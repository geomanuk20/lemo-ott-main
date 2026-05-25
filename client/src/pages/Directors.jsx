import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Plus, 
 Edit, 
 X, 
 Search, 
 User, 
 AlertTriangle, 
 CheckCircle2, 
 Loader2, 
 ChevronDown,
 RotateCw,
 LayoutGrid
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/directors';
const ITEMS_PER_PAGE = 12;

const Directors = () => {
 const navigate = useNavigate();
 const [directors, setDirectors] = useState([]);
 const [loading, setLoading] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [searchTerm, setSearchTerm] = useState('');
 
 // Modal states
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deletingId, setDeletingId] = useState(null);
 const [deleteMode, setDeleteMode] = useState('single'); // 'single' or 'bulk'
 
 // Bulk selection
 const [selectedIds, setSelectedIds] = useState([]);
 const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const fileInputRef = useRef(null);

 const fetchDirectors = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setDirectors(data);
  } catch (err) {
   console.error('Error fetching directors:', err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchDirectors();
 }, []);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleSelectOne = (id) => {
  setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
 };

 const handleSelectAll = (e) => {
  if (e.target.checked) {
   setSelectedIds(filteredDirectors.map(a => a._id));
  } else {
   setSelectedIds([]);
  }
 };

 const handleBulkAction = async (action) => {
  if (selectedIds.length === 0) return;
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
    setDirectors(prev => prev.map(a => selectedIds.includes(a._id) ? { ...a, status: action } : a));
    setSelectedIds([]);
    showNotification(`Selected directors marked as ${action}`);
   } catch (err) {
    console.error('Error bulk updating:', err);
   }
  }
 };

 const executeDelete = async () => {
  try {
   if (deleteMode === 'single') {
    const res = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
    if (res.ok) {
     setDirectors(prev => prev.filter(a => a._id !== deletingId));
     showNotification('Director deleted successfully');
    }
   } else {
    await Promise.all(selectedIds.map(id => fetch(`${API_URL}/${id}`, { method: 'DELETE' })));
    setDirectors(prev => prev.filter(a => !selectedIds.includes(a._id)));
    setSelectedIds([]);
    showNotification('Selected directors deleted successfully');
   }
   setIsDeleteModalOpen(false);
  } catch (err) {
   console.error('Error deleting:', err);
  }
 };

 const filteredDirectors = directors.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
 const totalPages = Math.ceil(filteredDirectors.length / ITEMS_PER_PAGE);
 const currentItems = filteredDirectors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

 return (
  <div className="actors-page">
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

   <div className="filters-bar-alt">
    <div className="search-box-alt">
     <input 
      type="text" 
      placeholder="Search by name" 
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
     />
     <Search size={18} className="search-icon-alt" />
    </div>

    <div className="filter-right-alt">
     <label className="select-all-alt">
      <input 
       type="checkbox" 
       checked={filteredDirectors.length > 0 && selectedIds.length === filteredDirectors.length}
       onChange={handleSelectAll}
      />
      <span>Select All</span>
     </label>

     <div className="action-dropdown-container">
      <button 
       className={`action-btn-alt ${selectedIds.length === 0 ? 'disabled' : ''}`} 
       onClick={() => selectedIds.length > 0 && setIsActionMenuOpen(!isActionMenuOpen)}
      >
       <span>Action</span>
       <ChevronDown size={16} className={isActionMenuOpen ? 'rotate' : ''} />
      </button>
      {isActionMenuOpen && (
       <div className="action-menu-alt">
        <div className="menu-header">Bulk Actions ({selectedIds.length})</div>
        <button onClick={() => handleBulkAction('Active')}>Mark as Active</button>
        <button onClick={() => handleBulkAction('Inactive')}>Mark as Inactive</button>
        <div className="menu-divider"></div>
        <button className="delete-opt" onClick={() => handleBulkAction('delete')}>
         Delete Selected
        </button>
       </div>
      )}
     </div>

     <button className="add-actor-btn" onClick={() => navigate('/admin/cast-crew/directors/add')}>
      <Plus size={18} strokeWidth={3} />
      <span>Add Director</span>
     </button>
    </div>
   </div>

   {loading ? (
    <div className="loader-container"><Loader size="small" inline={true} /></div>
   ) : (
    <>
     <div className="actors-grid">
      {currentItems.map((director) => (
       <div key={director._id} className={`actor-card ${selectedIds.includes(director._id) ? 'selected' : ''}`}>
        <div className="actor-image-container">
         <input 
          type="checkbox" 
          className="actor-checkbox" 
          checked={selectedIds.includes(director._id)}
          onChange={() => handleSelectOne(director._id)}
         />
         {director.image ? (
          <img src={director.image} alt={director.name} className="actor-img" />
         ) : (
          <div className="actor-placeholder"><User size={50} /></div>
         )}
         <div className="actor-name-overlay">
          <span>{director.name}</span>
         </div>
        </div>
        <div className="actor-controls-alt">
         <button className="control-btn-alt edit" onClick={() => navigate(`/admin/cast-crew/directors/edit/${director._id}`)}>
          <Edit size={14} />
         </button>
         <button className="control-btn-alt delete" onClick={() => {
          setDeletingId(director._id);
          setDeleteMode('single');
          setIsDeleteModalOpen(true);
         }}><X size={16} strokeWidth={3} /></button>
        </div>
       </div>
      ))}
     </div>

     {totalPages > 1 && (
      <div className="pagination-container-alt">
       <div className="pagination-group-alt">
        <button className="page-btn-alt arrow" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>«</button>
        {[...Array(totalPages)].map((_, i) => (
         <button key={i+1} className={`page-btn-alt ${currentPage === i+1 ? 'active' : ''}`} onClick={() => setCurrentPage(i+1)}>{i+1}</button>
        ))}
        <button className="page-btn-alt arrow" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>»</button>
       </div>
      </div>
     )}
    </>
   )}

   {isDeleteModalOpen && (
    <div className="modal-overlay-alt">
     <div className="delete-modal-alt">
      <AlertTriangle size={60} color="#ff4d4d" />
      <h2>Confirm Delete</h2>
      <p>Are you sure you want to delete {deleteMode === 'bulk' ? `these ${selectedIds.length} directors` : 'this director'}?</p>
      <div className="delete-footer-alt">
       <button className="cancel-btn-alt" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="confirm-btn-alt" onClick={executeDelete}>Delete</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .actors-page { padding: 0; animation: fadeIn 0.4s ease-out; color: #fff; }
    
    .page-header-alt { display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; border-bottom: 1px solid #111; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: 0.5px; }
    .header-actions { display: flex; align-items: center; gap: 20px; }
    .header-icon-btn { background: none; border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0.8; transition: opacity 0.2s; }
    .header-icon-btn:hover { opacity: 1; }
    .header-user-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 1px solid #333; }
    .header-user-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .filters-bar-alt { background: #111; margin: 20px 30px; padding: 12px 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #222; }
    .search-box-alt { position: relative; width: 350px; }
    .search-box-alt input { width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 10px 15px 10px 40px; color: #fff; border-radius: 30px; outline: none; font-size: 0.9rem; }
    .search-icon-alt { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #666; }
    
    .filter-right-alt { display: flex; align-items: center; gap: 20px; }
    .select-all-alt { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.95rem; }
    .select-all-alt input { width: 18px; height: 18px; accent-color: #fff; cursor: pointer; }
    .action-dropdown-container { position: relative; }
    
    .action-btn-alt { background: #0088ff; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .action-btn-alt.disabled { opacity: 0.4; cursor: not-allowed; background: #333; }
    .action-btn-alt .rotate { transform: rotate(180deg); }
    
    .action-menu-alt { position: absolute; top: 100%; right: 0; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; margin-top: 10px; z-index: 1000; min-width: 200px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; }
    .menu-header { padding: 12px 15px; font-size: 0.75rem; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #222; background: #111; }
    .action-menu-alt button { width: 100%; padding: 12px 15px; background: none; border: none; color: #eee; text-align: left; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; }
    .action-menu-alt button:hover { background: #222; color: #0088ff; padding-left: 20px; }
    .menu-divider { height: 1px; background: #222; }
    .action-menu-alt button.delete-opt { color: #ff4d4d; }
    .action-menu-alt button.delete-opt:hover { background: #311; color: #ff4d4d; }

    .add-actor-btn { background: #b3d332; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; }

    .actors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 25px; padding: 0 30px 40px; }
    .actor-card { background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #222; transition: transform 0.2s, border-color 0.2s; position: relative; }
    .actor-card:hover { border-color: #444; }
    .actor-card.selected { border-color: #0088ff; box-shadow: 0 0 15px rgba(0,136,255,0.2); }
    
    .actor-image-container { position: relative; aspect-ratio: 2/3; background: #111; }
    .actor-img { width: 100%; height: 100%; object-fit: cover; }
    .actor-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #333; }
    
    .actor-checkbox { position: absolute; top: 10px; left: 10px; width: 18px; height: 18px; z-index: 10; accent-color: #fff; cursor: pointer; }
    .actor-name-overlay { 
     position: absolute; 
     bottom: 10px; 
     left: 10px; 
     right: 10px; 
     width: calc(100% - 20px); 
     background: rgba(0, 0, 0, 0.5); 
     backdrop-filter: blur(12px);
     -webkit-backdrop-filter: blur(12px);
     padding: 12px 5px; 
     text-align: center; 
     border-radius: 8px;
     border: 1px solid rgba(255, 255, 255, 0.1);
     box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }
    .actor-name-overlay span { font-weight: 700; font-size: 0.95rem; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.5); letter-spacing: 0.3px; }
    
    .actor-controls-alt { display: flex; justify-content: center; gap: 12px; padding: 12px; background: #1a1a1a; }
    .control-btn-alt { width: 32px; height: 32px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: transform 0.2s; }
    .control-btn-alt.edit { background: #b3d332; }
    .control-btn-alt.delete { background: #ff4d4d; }
    .control-btn-alt:hover { transform: scale(1.1); }

    .pagination-container-alt { display: flex; justify-content: center; margin: 20px 0 50px; }
    .pagination-group-alt { display: flex; background: #222; border: 1px solid #333; border-radius: 6px; overflow: hidden; }
    .page-btn-alt { background: none; border: none; border-right: 1px solid #333; color: #fff; padding: 10px 18px; cursor: pointer; font-weight: 700; }
    .page-btn-alt.active { background: #b3d332; }
    .page-btn-alt:disabled { opacity: 0.3; cursor: not-allowed; }

    .modal-overlay-alt { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(5px); }
    
    .delete-modal-alt { background: #1a1a1a; padding: 40px; border-radius: 20px; text-align: center; border: 1px solid #333; max-width: 400px; }
    .delete-footer-alt { display: flex; gap: 15px; margin-top: 30px; }
    .cancel-btn-alt { flex: 1; background: #333; color: #fff; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }
    .confirm-btn-alt { flex: 1; background: #ff4d4d; color: #fff; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }

    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 25px 50px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
   ` }} />
  </div>
 );
};

export default Directors;
