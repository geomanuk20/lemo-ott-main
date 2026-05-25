import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Plus, 
 Edit, 
 X, 
 Search, 
 MonitorPlay, 
 AlertTriangle,
 ChevronDown,
 Loader2,
 CheckCircle2,
 XCircle
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/tv-channels';

const TVChannels = () => {
 const navigate = useNavigate();
 const [channels, setChannels] = useState([]);
 const [categories, setCategories] = useState([]);
 const [loading, setLoading] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedCategory, setSelectedCategory] = useState('');
 const [isCategoryOpen, setIsCategoryOpen] = useState(false);
 const [categorySearch, setCategorySearch] = useState('');
 
 // Bulk selection states
 const [selectedIds, setSelectedIds] = useState([]);
 const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
 
 // Pagination states
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 8;
 
 const [notification, setNotification] = useState(null);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deletingId, setDeletingId] = useState(null);
 const [deleteMode, setDeleteMode] = useState('single'); // 'single' or 'bulk'

 useEffect(() => {
  const fetchData = async () => {
   try {
    const [channelsRes, categoriesRes] = await Promise.all([
     fetch(API_URL),
     fetch('/api/tv-categories')
    ]);
    const channelsData = await channelsRes.json();
    const categoriesData = await categoriesRes.json();
    setChannels(channelsData);
    setCategories(categoriesData);
   } catch (err) {
    console.error('Error fetching data:', err);
   } finally {
    setLoading(false);
   }
  };
  fetchData();
 }, []);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const toggleStatus = async (channel) => {
  const newStatus = channel.status === 'Active' ? 'Inactive' : 'Active';
  try {
   const response = await fetch(`${API_URL}/${channel._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
   });
   if (response.ok) {
    setChannels(prev => prev.map(c => c._id === channel._id ? { ...c, status: newStatus } : c));
    showNotification(`Channel marked as ${newStatus}`);
   }
  } catch (err) {
   console.error('Error toggling status:', err);
  }
 };

 const handleSelectOne = (id) => {
  setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
 };

 const handleSelectAll = (e) => {
  if (e.target.checked) {
   setSelectedIds(filteredChannels.map(c => c._id));
  } else {
   setSelectedIds([]);
  }
 };

 const handleBulkAction = async (action) => {
  if (selectedIds.length === 0) {
   showNotification('Please select at least one channel');
   setIsActionMenuOpen(false);
   return;
  }
  
  setIsActionMenuOpen(false);
  
  if (action === 'delete') {
   setDeleteMode('bulk');
   setIsDeleteModalOpen(true);
  } else if (action === 'Active' || action === 'Inactive') {
   try {
    await Promise.all(selectedIds.map(id => 
     fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action })
     })
    ));
    setChannels(prev => prev.map(c => selectedIds.includes(c._id) ? { ...c, status: action } : c));
    setSelectedIds([]);
    showNotification(`Selected channels set to ${action}`);
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
     setChannels(prev => prev.filter(c => c._id !== deletingId));
     setIsDeleteModalOpen(false);
     setDeletingId(null);
     showNotification('Channel deleted successfully');
    }
   } else if (deleteMode === 'bulk') {
    await Promise.all(selectedIds.map(id => 
     fetch(`${API_URL}/${id}`, { method: 'DELETE' })
    ));
    setChannels(prev => prev.filter(c => !selectedIds.includes(c._id)));
    setSelectedIds([]);
    setIsDeleteModalOpen(false);
    showNotification('Selected channels deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting channel(s):', err);
  }
 };

 const filteredChannels = channels.filter(channel => {
  const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = selectedCategory ? channel.category?.name === selectedCategory : true;
  return matchesSearch && matchesCategory;
 });

 const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

 // Pagination logic
 const indexOfLastItem = currentPage * itemsPerPage;
 const indexOfFirstItem = indexOfLastItem - itemsPerPage;
 const currentItems = filteredChannels.slice(indexOfFirstItem, indexOfLastItem);
 const totalPages = Math.ceil(filteredChannels.length / itemsPerPage);

 const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
  window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 return (
  <div className="tv-channels-page">
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
    <div className="search-bar">
     <Search className="search-icon" size={20} />
     <input 
      type="text" 
      placeholder="Search TV Channels..." 
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
     />
    </div>
    <button className="add-btn" onClick={() => navigate('/admin/live-tv/channel/add')}>
     <Plus size={20} strokeWidth={3} />
     <span>Add TV Channel</span>
    </button>
   </div>

   <div className="filters-bar">
    <div className="filter-left">
     <div className="custom-dropdown-container">
      <div className="custom-select" onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
       <span>{selectedCategory || 'Filter by Category'}</span>
       <ChevronDown size={18} />
      </div>
      {isCategoryOpen && (
       <div className="dropdown-menu">
        <div className="dropdown-search">
         <input 
          type="text" 
          placeholder="Search category..."
          value={categorySearch} 
          onChange={e => setCategorySearch(e.target.value)} 
          onClick={e => e.stopPropagation()}
          autoFocus
         />
        </div>
        <div className="dropdown-options">
         <div className="dropdown-header-option" onClick={() => { setSelectedCategory(''); setIsCategoryOpen(false); setCategorySearch(''); }}>
          All Categories
         </div>
         {filteredCategories.map(cat => (
          <div 
           key={cat._id} 
           className="dropdown-option" 
           onClick={() => { setSelectedCategory(cat.name); setIsCategoryOpen(false); setCategorySearch(''); }}
          >
           {cat.name}
          </div>
         ))}
        </div>
       </div>
      )}
     </div>
    </div>

    <div className="filter-right">
     <label className="select-all">
      <input 
       type="checkbox" 
       checked={filteredChannels.length > 0 && selectedIds.length === filteredChannels.length} 
       onChange={handleSelectAll}
      />
      <span>Select All</span>
     </label>
     
     <div className="action-dropdown-container">
      <button className={`action-btn ${selectedIds.length === 0 ? 'disabled' : ''}`} onClick={() => selectedIds.length > 0 && setIsActionMenuOpen(!isActionMenuOpen)}>
       <span>Action</span>
       <ChevronDown size={16} />
      </button>
      {isActionMenuOpen && (
       <div className="action-dropdown-menu">
        <button onClick={() => handleBulkAction('Active')}>Active</button>
        <button onClick={() => handleBulkAction('Inactive')}>Inactive</button>
        <button className="delete-option" onClick={() => handleBulkAction('delete')}>Delete</button>
       </div>
      )}
     </div>
    </div>
   </div>

   {loading ? (
    <div className="loader-container">
     <Loader size="small" inline={true} />
    </div>
   ) : (
    <>
     <div className="grid-container">
      {currentItems.length > 0 ? (
       currentItems.map(channel => (
        <div key={channel._id} className={`item-card ${selectedIds.includes(channel._id) ? 'selected' : ''}`}>
         <div className="poster-wrapper">
          <input 
           type="checkbox" 
           className="item-checkbox"
           checked={selectedIds.includes(channel._id)} 
           onChange={() => handleSelectOne(channel._id)}
          />
          <img src={channel.logo || 'https://via.placeholder.com/300x170'} alt={channel.name} className="poster-img" />
         </div>
         <div className="item-info">
          <h3 className="item-title">{channel.name}</h3>
          <p className="item-subtitle">{channel.category?.name || 'Uncategorized'}</p>
          <div className="card-controls">
           <div className="action-icons">
            <button className="circle-icon edit" onClick={() => navigate(`/admin/live-tv/channel/edit/${channel._id}`)}><Edit size={16} /></button>
            <button className="circle-icon delete" onClick={() => confirmDelete(channel._id)}><X size={18} strokeWidth={3} /></button>
           </div>
           <label className="switch">
            <input 
             type="checkbox" 
             checked={channel.status === 'Active'} 
             onChange={() => toggleStatus(channel)}
            />
            <span className="slider"></span>
           </label>
          </div>
         </div>
        </div>
       ))
      ) : (
       <div className="no-items">
        <MonitorPlay size={60} color="#333" />
        <p>No TV channels found</p>
       </div>
      )}
     </div>

     {totalPages > 1 && (
      <div className="pagination-container">
       <div className="pagination-group">
        <button 
         className="page-btn arrow" 
         onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
         disabled={currentPage === 1}
        >
         «
        </button>
        {[...Array(totalPages)].map((_, i) => (
         <button 
          key={i + 1} 
          className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
          onClick={() => handlePageChange(i + 1)}
         >
          {i + 1}
         </button>
        ))}
        <button 
         className="page-btn arrow" 
         onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
         disabled={currentPage === totalPages}
        >
         »
        </button>
       </div>
      </div>
     )}
    </>
   )}

   {isDeleteModalOpen && (
    <div className="modal-overlay">
     <div className="delete-modal-content">
      <div className="delete-icon-wrapper"><AlertTriangle size={65} color="#ff4d4d" strokeWidth={1.5} /></div>
      <h2>Are you sure?</h2>
      <p>{deleteMode === 'bulk' ? `You want to delete these ${selectedIds.length} channels?` : 'You want to delete this channel?'} This action cannot be undone.</p>
      <div className="delete-modal-footer">
       <button className="cancel-btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="confirm-btn" onClick={executeDelete}>Delete</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .tv-channels-page { animation: fadeIn 0.4s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .search-bar { position: relative; width: 380px; }
    .search-bar input { width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 12px 20px 12px 48px; color: #fff; border-radius: 50px; outline: none; }
    .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #666; }
    .add-btn { background: linear-gradient(135deg, #b3d332 0%, #00a86b 100%); color: white; border: none; padding: 10px 22px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; }
    
    .filters-bar { background: #111; padding: 10px 20px; border-radius: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #222; min-height: 65px; }
    .filter-left { display: flex; align-items: center; }
    .filter-right { display: flex; align-items: center; gap: 25px; }
    
    .select-all { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 0.95rem; cursor: pointer; }
    .select-all input { width: 18px; height: 18px; cursor: pointer; accent-color: #fff; }

    .action-dropdown-container { position: relative; }
    .action-btn { background: #0088ff; color: #fff; border: none; padding: 9px 20px; border-radius: 6px; display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
    .action-btn:hover:not(.disabled) { background: #0077ee; }
    .action-btn.disabled { opacity: 0.5; cursor: not-allowed; }
    
    .action-dropdown-menu { position: absolute; top: 100%; right: 0; background: #111; border: 1px solid #333; border-radius: 8px; margin-top: 8px; min-width: 160px; z-index: 1000; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .action-dropdown-menu button { width: 100%; padding: 12px 20px; background: none; border: none; color: #fff; text-align: left; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: background 0.2s; }
    .action-dropdown-menu button:hover { background: #222; color: #0088ff; }
    .action-dropdown-menu button.delete-option { color: #ff4d4d; border-top: 1px solid #222; }
    .action-dropdown-menu button.delete-option:hover { background: #ff4d4d1a; }

    .custom-dropdown-container { position: relative; min-width: 250px; }
    .custom-select { background: #1a1a1a; border: 1px solid #333; padding: 10px 15px; border-radius: 6px; color: #ccc; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 0.9rem; font-weight: 400; }
    
    .dropdown-menu { position: absolute; top: 100%; left: 0; width: 100%; background: #1a1a1a; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; border-radius: 4px; margin-top: 5px; overflow: hidden; }
    .dropdown-search { padding: 10px; background: #222; border-bottom: 1px solid #333; }
    .dropdown-search input { width: 100%; padding: 8px 12px; background: #111; border: 1px solid #444; color: #fff; outline: none; font-size: 0.85rem; border-radius: 4px; }
    .dropdown-options { max-height: 250px; overflow-y: auto; }
    .dropdown-option, .dropdown-header-option { padding: 10px 15px; cursor: pointer; color: #ccc; border-bottom: 1px solid #222; font-size: 0.9rem; }
    .dropdown-option:hover, .dropdown-header-option:hover { background: #222; color: #fff; }

    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
    .item-card { background: #1a1a1a; border-radius: 10px; overflow: hidden; border: 1px solid #222; position: relative; transition: all 0.2s; }
    .item-card.selected { border-color: #0088ff; box-shadow: 0 0 15px rgba(0,136,255,0.2); }
    
    .item-checkbox { position: absolute; top: 12px; left: 12px; width: 18px; height: 18px; z-index: 10; accent-color: #fff; cursor: pointer; }
    
    .poster-wrapper { position: relative; height: 160px; overflow: hidden; }
    .poster-img { width: 100%; height: 100%; object-fit: cover; }
    .item-info { padding: 15px; }
    .item-title { color: #fff; font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; }
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
    
    .loader-container { display: flex; justify-content: center; align-items: center; height: 300px; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(5px); }
    .delete-modal-content { background: #1a1a1a; width: 90%; max-width: 450px; padding: 30px; border-radius: 20px; text-align: center; border: 1px solid #333; }
    .delete-icon-wrapper { margin-bottom: 20px; }
    .delete-modal-content h2 { color: #fff; margin-bottom: 10px; font-size: 1.8rem; }
    .delete-modal-content p { color: #aaa; margin-bottom: 30px; }
    .delete-modal-footer { display: flex; gap: 15px; justify-content: center; }
    .cancel-btn { background: #333; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; }
    .confirm-btn { background: #ff4d4d; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; }

    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 25px 50px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    /* Pagination Styling */
    .pagination-container { display: flex; justify-content: center; margin-top: 50px; margin-bottom: 20px; }
    .pagination-group { display: flex; background: #222; border: 1px solid #333; border-radius: 6px; overflow: hidden; }
    .page-btn { background: none; border: none; border-right: 1px solid #333; color: #fff; padding: 12px 22px; cursor: pointer; font-weight: 700; font-size: 1.1rem; transition: all 0.2s; min-width: 55px; display: flex; align-items: center; justify-content: center; }
    .page-btn:last-child { border-right: none; }
    .page-btn.active { background: #b3d332; }
    .page-btn:hover:not(.active):not(:disabled) { background: #333; }
    .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .page-btn.arrow { font-size: 1.5rem; line-height: 1; }
   ` }} />
  </div>
 );
};

export default TVChannels;
