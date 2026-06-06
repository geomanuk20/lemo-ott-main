import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, X, Search, ChevronDown, CheckCircle2, AlertTriangle, Loader2, Film, Copy, ArrowUpDown } from 'lucide-react';
import Loader from '../components/Loader';
import ImportExportModal from '../components/ImportExportModal';
import { formatImageUrl } from '../utils/image';

const Seasons = () => {
 const navigate = useNavigate();
 const [seasons, setSeasons] = useState([]);
 const [isImportExportOpen, setIsImportExportOpen] = useState(false);
 const [loading, setLoading] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedShow, setSelectedShow] = useState('');
 const [selectedSeasons, setSelectedSeasons] = useState([]);
 const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deletingId, setDeletingId] = useState(null);
 const [notification, setNotification] = useState(null);

 // Mock Data
 const API_URL = '/api/seasons';

 const [shows, setShows] = useState([]);

 const fetchData = async () => {
  setLoading(true);
  try {
   const [seasonsRes, showsRes] = await Promise.all([
    fetch(API_URL),
    fetch('/api/shows')
   ]);
   const seasonsData = await seasonsRes.json();
   const showsData = await showsRes.json();
   setSeasons(seasonsData);
   setShows(showsData);
  } catch (err) {
   console.error('Error fetching data:', err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchData();
 }, []);

 const toggleStatus = async (season) => {
  try {
   const newStatus = season.status === 'Active' ? 'Inactive' : 'Active';
   const response = await fetch(`${API_URL}/${season._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
   });
   if (response.ok) {
    setSeasons(prev => prev.map(s => s._id === season._id ? { ...s, status: newStatus } : s));
    showNotification('Season status updated');
   }
  } catch (err) {
   console.error('Error toggling status:', err);
  }
 };

 const handleSelectAll = (e) => {
  if (e.target.checked) {
   setSelectedSeasons(seasons.map(s => s._id));
  } else {
   setSelectedSeasons([]);
  }
 };

 const handleSelectSeason = (id) => {
  setSelectedSeasons(prev => 
   prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );
 };

 const confirmDelete = (id) => {
  setDeletingId(id);
  setIsDeleteModalOpen(true);
 };

 const executeDelete = async () => {
  if (!deletingId) return;
  try {
   const response = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
   if (response.ok) {
    setSeasons(prev => prev.filter(s => s._id !== deletingId));
    showNotification('Season deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting season:', err);
  } finally {
   setIsDeleteModalOpen(false);
   setDeletingId(null);
  }
 };

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleBulkDelete = async () => {
  if (selectedSeasons.length === 0) {
   showNotification('Please select items first');
   return;
  }
  if (window.confirm(`Are you sure you want to delete ${selectedSeasons.length} items?`)) {
   try {
    await Promise.all(selectedSeasons.map(id => fetch(`${API_URL}/${id}`, { method: 'DELETE' })));
    setSeasons(prev => prev.filter(s => !selectedSeasons.includes(s._id)));
    setSelectedSeasons([]);
    showNotification('Selected seasons deleted');
   } catch (err) {
    console.error('Error in bulk delete:', err);
   } finally {
    setIsActionMenuOpen(false);
   }
  }
 };

 const handleBulkStatusChange = async (status) => {
  if (selectedSeasons.length === 0) {
   showNotification('Please select items first');
   return;
  }
  try {
   await Promise.all(selectedSeasons.map(id => 
    fetch(`${API_URL}/${id}`, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ status })
    })
   ));
   setSeasons(prev => prev.map(s => selectedSeasons.includes(s._id) ? { ...s, status } : s));
   setSelectedSeasons([]);
   showNotification(`Selected items set to ${status}`);
  } catch (err) {
   console.error('Error in bulk status change:', err);
  } finally {
   setIsActionMenuOpen(false);
  }
 };
 const duplicateSeason = async (season) => {
  try {
   setLoading(true);
   const response = await fetch(`${API_URL}/duplicate/${season._id}`, {
    method: 'POST'
   });

   if (response.ok) {
    const fetchRes = await fetch(API_URL);
    const newData = await fetchRes.json();
    setSeasons(Array.isArray(newData) ? newData : []);
    showNotification('Season duplicated successfully');
   }
  } catch (err) {
   console.error('Error duplicating season:', err);
  } finally {
   setLoading(false);
  }
 };

  const isShortPath = window.location.pathname.includes('/short-web-series');

  const filteredShows = shows.filter(show => {
    if (isShortPath) {
      return show.contentType === 'Short Web Series';
    } else {
      return show.contentType === 'TV Show' || !show.contentType;
    }
  });

  const getShowName = (season) => {
    const showObj = shows.find(show => show._id === season.showId);
    return showObj ? showObj.title : (season.showName || 'Unknown Show');
  };

  const filteredSeasons = seasons.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSelectedShow = !selectedShow || s.showId === selectedShow;

    const showObj = shows.find(show => show._id === s.showId);
    if (showObj) {
      const isShortShow = showObj.contentType === 'Short Web Series';
      if (isShortPath && !isShortShow) return false;
      if (!isShortPath && isShortShow) return false;
    }

    return matchesSearch && matchesSelectedShow;
  });

  return (
   <div className="seasons-page">
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
      <button className="add-btn" onClick={() => navigate(isShortPath ? '/admin/short-web-series/seasons/add' : '/admin/tv-shows/seasons/add')}>
       <Plus size={20} strokeWidth={3} />
       <span>Add Season</span>
      </button>
     </div>
    </div>

    <div className="filters-bar">
     <div className="filter-group">
      <select 
       className="custom-select-box" 
       value={selectedShow} 
       onChange={(e) => setSelectedShow(e.target.value)}
      >
       <option value="">Filter by Shows</option>
       {filteredShows.map(show => (
        <option key={show._id} value={show._id}>{show.title}</option>
       ))}
      </select>
     </div>
     
     <div className="right-controls">
      <label className="select-all">
       <input 
        type="checkbox" 
        checked={seasons.length > 0 && selectedSeasons.length === seasons.length}
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
         <button onClick={() => handleBulkStatusChange('Active')}>Active</button>
         <button onClick={() => handleBulkStatusChange('Inactive')}>Inactive</button>
         <button className="delete-option" onClick={handleBulkDelete}>Delete</button>
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
     <div className="grid-container">
      {filteredSeasons.length > 0 ? (
       filteredSeasons.map((season) => (
        <div key={season._id} className="item-card">
         <div className="poster-wrapper">
          <input 
           type="checkbox" 
           className="item-checkbox" 
           checked={selectedSeasons.includes(season._id)}
           onChange={() => handleSelectSeason(season._id)}
          />
          <img src={formatImageUrl(season, 'poster') || 'https://via.placeholder.com/300x450'} alt={season.title} className="poster-img" />
         </div>
         <div className="item-info">
          <h3 className="item-title">{season.title}</h3>
          <p className="item-subtitle">{getShowName(season)}</p>
          <div className="card-controls">
           <div className="action-icons">
            <button className="circle-icon edit" onClick={() => navigate(isShortPath ? `/admin/short-web-series/seasons/edit/${season._id}` : `/admin/tv-shows/seasons/edit/${season._id}`)}><Edit size={16} /></button>
            <button className="circle-icon duplicate" onClick={() => duplicateSeason(season)} title="Duplicate"><Copy size={16} /></button>
            <button className="circle-icon delete" onClick={() => confirmDelete(season._id)}><X size={18} strokeWidth={3} /></button>
           </div>
           <label className="switch">
            <input 
             type="checkbox" 
             checked={season.status === 'Active'} 
             onChange={() => toggleStatus(season)}
            />
            <span className="slider"></span>
           </label>
          </div>
         </div>
        </div>
       ))
      ) : (
      <div className="no-items">
       <Film size={60} color="#333" />
       <p>No seasons found</p>
      </div>
     )}
    </div>
   )}

   {isDeleteModalOpen && (
    <div className="modal-overlay">
     <div className="delete-modal-content">
      <div className="delete-icon-wrapper">
       <AlertTriangle size={65} color="#ff4d4d" strokeWidth={1.5} />
      </div>
      <h2>Are you sure?</h2>
      <p>You want to delete this season? This action cannot be undone.</p>
      <div className="delete-modal-footer">
       <button className="cancel-btn" onClick={() => { setIsDeleteModalOpen(false); setDeletingId(null); }}>Cancel</button>
       <button className="confirm-btn" onClick={executeDelete}>Delete</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .seasons-page { animation: fadeIn 0.4s ease-out; }
    
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .search-bar { position: relative; width: 380px; }
    .search-bar input { width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 12px 20px 12px 48px; color: #fff; border-radius: 50px; outline: none; transition: border-color 0.3s; }
    .search-bar input:focus { border-color: #555; }
    .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #666; }
    
    .add-btn {
     background: linear-gradient(135deg, #b3d332 0%, #00a86b 100%);
     color: white; border: none; padding: 10px 22px; border-radius: 8px;
     display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer;
    }
    .import-export-btn { background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 10px 20px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
    .import-export-btn:hover { background: #2a2a2a; border-color: #b3d332; color: #b3d332; }

    .filters-bar { background: #111; padding: 15px 20px; border-radius: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #222; }
    .custom-select-box { background: #222; border: 1px solid #333; padding: 12px 18px; border-radius: 6px; color: #fff; min-width: 250px; cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; }
    
    .right-controls { display: flex; align-items: center; gap: 20px; }
    .select-all { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 0.95rem; cursor: pointer; }
    .select-all input { width: 18px; height: 18px; cursor: pointer; }
    
    .action-dropdown-container { position: relative; }
    .action-btn { background: #0088ff; color: #fff; border: none; padding: 9px 20px; border-radius: 6px; display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; font-size: 0.9rem; }
    .action-dropdown-menu { position: absolute; top: 100%; right: 0; background: #111; border: 1px solid #333; border-radius: 8px; margin-top: 8px; min-width: 160px; z-index: 1000; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .action-dropdown-menu button { width: 100%; padding: 12px 20px; background: none; border: none; color: #fff; text-align: left; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: background 0.2s; }
    .action-dropdown-menu button:hover { background: #222; }
    .action-dropdown-menu button.delete-option { color: #ff4d4d; border-top: 1px solid #222; }
    .action-dropdown-menu button.delete-option:hover { background: rgba(255, 77, 77, 0.1); }

    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 25px; }
    .item-card { background: #1a1a1a; border-radius: 10px; overflow: hidden; border: 1px solid #222; transition: transform 0.3s; }
    .item-card:hover { transform: translateY(-5px); }
    
    .poster-wrapper { position: relative; height: 320px; overflow: hidden; }
    .poster-img { width: 100%; height: 100%; object-fit: cover; }
    .item-checkbox { position: absolute; top: 12px; left: 12px; width: 20px; height: 20px; z-index: 10; cursor: pointer; accent-color: #fff; }
    
    .item-info { padding: 15px; }
    .item-title { color: #fff; font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-subtitle { color: #888; font-size: 0.9rem; margin-bottom: 15px; }
    
    .card-controls { display: flex; justify-content: space-between; align-items: center; }
    .action-icons { display: flex; gap: 10px; }
    .circle-icon { width: 34px; height: 34px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: transform 0.2s; }
    .circle-icon:hover { transform: scale(1.1); }
    .circle-icon.edit { background: #b3d332; }
    .circle-icon.duplicate { background: #0088ff; }
    .circle-icon.delete { background: #ff4d4d; }
    
    .switch-container { display: flex; align-items: center; gap: 10px; }
    .status-label { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-label.active { color: #b3d332; }
    .status-label:not(.active) { color: #666; }

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
    type="seasons" 
    onImportSuccess={fetchData} 
   />
  </div>
 );
};

export default Seasons;
