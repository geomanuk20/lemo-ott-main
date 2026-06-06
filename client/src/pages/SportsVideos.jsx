import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, X, Search, ChevronDown, CheckCircle2, AlertTriangle, Loader2, Trophy, ArrowUpDown } from 'lucide-react';
import Loader from '../components/Loader';
import ImportExportModal from '../components/ImportExportModal';
import { formatImageUrl } from '../utils/image';

const API_URL = '/api/sports-videos';

const SportsVideos = () => {
 const navigate = useNavigate();
 const [videos, setVideos] = useState([]);
 const [isImportExportOpen, setIsImportExportOpen] = useState(false);
 const [loading, setLoading] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 
 // Filter states
 const [categories, setCategories] = useState([]);
 const [selectedCategory, setSelectedCategory] = useState('');
 
 // Bulk selection states
 const [selectedVideos, setSelectedVideos] = useState([]);
 const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
 
 // Dropdown UI states
 const [isCategoryOpen, setIsCategoryOpen] = useState(false);
 const [categorySearch, setCategorySearch] = useState('');

 const [notification, setNotification] = useState(null);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deletingId, setDeletingId] = useState(null);
 const [deleteMode, setDeleteMode] = useState('single'); // 'single' or 'bulk'

 const fetchVideos = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setVideos(data);
  } catch (err) {
   console.error('Error fetching sports videos:', err);
  } finally {
   setLoading(false);
  }
 };

 const fetchFilters = async () => {
  try {
   const response = await fetch('/api/sports-categories');
   const data = await response.json();
   setCategories(data);
  } catch (err) {
   console.error('Error fetching categories:', err);
  }
 };

 useEffect(() => {
  fetchVideos();
  fetchFilters();
 }, []);

 // Filter videos
 const filteredVideos = videos.filter(video => {
  const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = selectedCategory ? video.category && video.category.name === selectedCategory : true;
  return matchesSearch && matchesCategory;
 });

 const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const toggleStatus = async (video) => {
  try {
   const newStatus = !video.status;
   const response = await fetch(`${API_URL}/${video._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
   });
   if (response.ok) {
    setVideos(prev => prev.map(v => v._id === video._id ? { ...v, status: newStatus } : v));
    showNotification('Video status updated');
   }
  } catch (err) {
   console.error('Error toggling status:', err);
  }
 };

 const handleSelectAll = (e) => {
  if (e.target.checked) {
   setSelectedVideos(filteredVideos.map(v => v._id));
  } else {
   setSelectedVideos([]);
  }
 };

 const handleSelectVideo = (id) => {
  setSelectedVideos(prev => 
   prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]
  );
 };

 const handleBulkAction = async (action) => {
  if (selectedVideos.length === 0) {
   showNotification('Please select at least one video');
   setIsActionMenuOpen(false);
   return;
  }
  
  setIsActionMenuOpen(false);
  
  if (action === 'delete') {
   setDeleteMode('bulk');
   setIsDeleteModalOpen(true);
  } else if (action === 'active' || action === 'inactive') {
   const newStatus = action === 'active';
   try {
    await fetch(`${API_URL}/bulk-status`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ ids: selectedVideos, status: newStatus })
    });
    setVideos(prev => prev.map(v => selectedVideos.includes(v._id) ? { ...v, status: newStatus } : v));
    setSelectedVideos([]);
    showNotification(`Selected videos set to ${newStatus ? 'Active' : 'Inactive'}`);
   } catch (err) {
    console.error(`Error updating bulk status:`, err);
   }
  }
 };

 const confirmDelete = (id) => {
  setDeletingId(id);
  setDeleteMode('single');
  setIsDeleteModalOpen(true);
 };

 const executeDelete = async () => {
  try {
   if (deleteMode === 'single') {
    const response = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
    if (response.ok) {
     setVideos(prev => prev.filter(v => v._id !== deletingId));
     setIsDeleteModalOpen(false);
     showNotification('Video deleted successfully');
    }
   } else if (deleteMode === 'bulk') {
    await fetch(`${API_URL}/bulk-delete`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ ids: selectedVideos })
    });
    setVideos(prev => prev.filter(v => !selectedVideos.includes(v._id)));
    setSelectedVideos([]);
    setIsDeleteModalOpen(false);
    showNotification('Selected videos deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting video(s):', err);
  }
 };

 return (
  <div className="movies-page">
   {notification && (
    <div className="custom-alert-box">
     <div className="alert-content">
      {notification.type === 'success' ? (
       <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
      ) : (
       <XCircle size={42} color="#ff4d4d" strokeWidth={2.5} />
      )}
      <span className="alert-text">{notification.message}</span>
     </div>
    </div>
   )}

   <div className="page-header">
    <div className="search-wrapper">
     <div className="search-bar">
      <input 
       type="text" 
       placeholder="Search By Title..." 
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Search size={20} className="search-icon" />
     </div>
    </div>
     <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <button className="import-export-btn" onClick={() => setIsImportExportOpen(true)}>
       <ArrowUpDown size={18} />
       <span>Import / Export</span>
      </button>
      <button className="add-btn" onClick={() => navigate('/admin/sports/add-video')}>
       <Plus size={20} strokeWidth={3} />
       <span>Add Video</span>
      </button>
     </div>
   </div>

   <div className="filters-bar">
    <div className="filter-group">
     <div className="custom-dropdown-container">
      <div className="custom-select" onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
       <span>{selectedCategory || 'Filter by Category'}</span>
       <ChevronDown size={18} className={isCategoryOpen ? 'rotate-180' : ''} />
      </div>
      {isCategoryOpen && (
       <div className="dropdown-menu">
        <div className="dropdown-search">
         <input 
          type="text" 
          value={categorySearch} 
          onChange={e => setCategorySearch(e.target.value)} 
          onClick={e => e.stopPropagation()}
          autoFocus
         />
        </div>
        <div className="dropdown-options">
         <div className="dropdown-header-option" onClick={() => { setSelectedCategory(''); setIsCategoryOpen(false); }}>
          Filter by Category
         </div>
         {filteredCategories.map(c => (
          <div 
           key={c._id} 
           className="dropdown-option" 
           onClick={() => { setSelectedCategory(c.name); setIsCategoryOpen(false); }}
          >
           {c.name}
          </div>
         ))}
        </div>
       </div>
      )}
     </div>
    </div>
    
    <div className="right-controls">
     <label className="select-all">
      <input 
       type="checkbox" 
       checked={filteredVideos.length > 0 && selectedVideos.length === filteredVideos.length}
       onChange={handleSelectAll}
      />
      <span>Select All</span>
     </label>
     <div className="action-dropdown-container">
      <button className="action-btn" onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}>
       <span>Action</span>
       <ChevronDown size={16} />
      </button>
      {isActionMenuOpen && (
       <div className="action-dropdown-menu">
        <button onClick={() => handleBulkAction('active')}>Active</button>
        <button onClick={() => handleBulkAction('inactive')}>Inactive</button>
        <button className="delete-option" onClick={() => handleBulkAction('delete')}>Delete</button>
       </div>
      )}
     </div>
    </div>
   </div>

   {loading ? (
    <div className="loader-container"><Loader size="small" inline={true} /></div>
   ) : (
    <div className="grid-container">
     {filteredVideos.map((video) => (
      <div key={video._id} className="item-card">
       <div className="poster-wrapper">
        <input 
         type="checkbox" 
         className="item-checkbox" 
         checked={selectedVideos.includes(video._id)}
         onChange={() => handleSelectVideo(video._id)}
        />
        <img src={formatImageUrl(video, 'poster') || 'https://via.placeholder.com/300x450'} alt={video.title} className="poster-img" />
       </div>
       <div className="item-info">
        <h3 className="item-title">{video.title}</h3>
        <p className="item-subtitle">{video.category?.name || 'Uncategorized'}</p>
        <div className="card-controls">
         <div className="action-icons">
          <button className="circle-icon edit" onClick={() => navigate(`/admin/sports/edit-video/${video._id}`)}><Edit size={16} /></button>
          <button className="circle-icon delete" onClick={() => confirmDelete(video._id)}><X size={18} strokeWidth={3} /></button>
         </div>
         <label className="switch">
          <input 
           type="checkbox" 
           checked={!!video.status} 
           onChange={() => toggleStatus(video)}
          />
          <span className="slider"></span>
         </label>
        </div>
       </div>
      </div>
     ))}
    </div>
   )}

   {isDeleteModalOpen && (
    <div className="modal-overlay">
     <div className="delete-modal-content">
      <div className="delete-icon-wrapper">
       <AlertTriangle size={65} color="#ff4d4d" strokeWidth={1.5} />
      </div>
      <h2>Are you sure?</h2>
      <p>{deleteMode === 'bulk' ? `You want to delete these ${selectedVideos.length} videos?` : 'You want to delete this video?'} This action cannot be undone.</p>
      <div className="delete-modal-footer">
       <button className="cancel-btn" onClick={() => { setIsDeleteModalOpen(false); setDeletingId(null); }}>Cancel</button>
       <button className="confirm-btn" onClick={executeDelete}>Delete</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .movies-page { animation: fadeIn 0.4s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .search-bar { position: relative; width: 380px; }
    .search-bar input { width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 12px 20px 12px 48px; color: #fff; border-radius: 50px; outline: none; }
    .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #666; }
    .add-btn { background: linear-gradient(135deg, #b3d332 0%, #00a86b 100%); color: white; border: none; padding: 10px 22px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; }
    .import-export-btn { background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 10px 20px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
    .import-export-btn:hover { background: #2a2a2a; border-color: #b3d332; color: #b3d332; }
    .filters-bar { background: #111; padding: 15px 20px; border-radius: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #222; }
    .filter-group { display: flex; align-items: center; gap: 15px; }
    
    .custom-dropdown-container { position: relative; min-width: 250px; }
    .custom-select { background: #2c2c2c; border: 1px solid #333; padding: 12px 18px; border-radius: 4px; color: #fff; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 0.95rem; font-weight: 500; }
    .rotate-180 { transform: rotate(180deg); }
    
    .dropdown-menu { position: absolute; top: 100%; left: 0; width: 100%; background: #1a1a1a; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; border-radius: 4px; margin-top: 5px; overflow: hidden; }
    .dropdown-search { padding: 10px; background: #222; border-bottom: 1px solid #333; }
    .dropdown-search input { width: 100%; padding: 10px 12px; background: #111; border: 1px solid #444; color: #fff; outline: none; font-size: 0.9rem; border-radius: 4px; }
    .dropdown-options { max-height: 250px; overflow-y: auto; }
    .dropdown-header-option { padding: 10px 15px; background: #2c2c2c; color: #aaa; font-size: 0.85rem; cursor: pointer; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .dropdown-option { padding: 12px 15px; background: #1a1a1a; color: #fff; font-size: 0.95rem; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid #222; }
    .dropdown-option:last-child { border-bottom: none; }
    .dropdown-option:hover { background: #222; color: #b3d332; }

    .right-controls { display: flex; align-items: center; gap: 20px; }
    .select-all { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 0.95rem; cursor: pointer; }
    .select-all input { width: 18px; height: 18px; cursor: pointer; }
    .action-btn { background: #0088ff; color: #fff; border: none; padding: 9px 20px; border-radius: 6px; display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; }
    
    .action-dropdown-container { position: relative; }
    .action-dropdown-menu { position: absolute; top: 100%; right: 0; background: #111; border: 1px solid #333; border-radius: 8px; margin-top: 8px; min-width: 160px; z-index: 1000; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .action-dropdown-menu button { width: 100%; padding: 12px 20px; background: none; border: none; color: #fff; text-align: left; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: background 0.2s; }
    .action-dropdown-menu button:hover { background: #222; }
    .action-dropdown-menu button.delete-option { color: #ff4d4d; border-top: 1px solid #222; }

    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 25px; }
    .item-card { background: #1a1a1a; border-radius: 10px; overflow: hidden; border: 1px solid #222; }
    .poster-wrapper { position: relative; height: 160px; overflow: hidden; }
    .poster-img { width: 100%; height: 100%; object-fit: cover; }
    .item-checkbox { position: absolute; top: 12px; left: 12px; width: 20px; height: 20px; z-index: 10; accent-color: #fff; }
    .item-info { padding: 15px; }
    .item-title { color: #fff; font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-subtitle { color: #888; font-size: 0.9rem; margin-bottom: 15px; }
    .card-controls { display: flex; justify-content: space-between; align-items: center; }
    .action-icons { display: flex; gap: 10px; }
    .circle-icon { width: 34px; height: 34px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: transform 0.2s; }
    .circle-icon:hover { transform: scale(1.1); }
    .circle-icon.edit { background: #b3d332; }
    .circle-icon.delete { background: #ff4d4d; }
    .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #b3d332; }
    input:checked + .slider:before { transform: translateX(20px); }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(5px); }
    .delete-modal-content { background: #1a1a1a; width: 90%; max-width: 450px; padding: 30px; border-radius: 20px; text-align: center; border: 1px solid #333; }
    .delete-icon-wrapper { margin-bottom: 20px; }
    .delete-modal-content h2 { color: #fff; margin-bottom: 10px; font-size: 1.8rem; }
    .delete-modal-content p { color: #aaa; margin-bottom: 30px; }
    .delete-modal-footer { display: flex; gap: 15px; justify-content: center; }
    .cancel-btn { background: #333; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; }
    .confirm-btn { background: #ff4d4d; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; }

    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border: 1px solid #222; padding: 20px 40px; border-radius: 12px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
   ` }} />
   <ImportExportModal 
    isOpen={isImportExportOpen} 
    onClose={() => setIsImportExportOpen(false)} 
    type="sports-videos" 
    onImportSuccess={fetchVideos} 
   />
  </div>
 );
};

export default SportsVideos;
