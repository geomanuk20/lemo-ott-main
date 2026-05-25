import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/genres';
const ITEMS_PER_PAGE = 8;

const Genres = () => {
 const [genres, setGenres] = useState([]);
 const [loading, setLoading] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [deletingId, setDeletingId] = useState(null);
 const [nameValue, setNameValue] = useState('');
 const [statusValue, setStatusValue] = useState(true);
 const [notification, setNotification] = useState(null);

 // Fetch genres from DB
 const fetchGenres = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setGenres(data);
  } catch (err) {
   console.error('Error fetching genres:', err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchGenres();
 }, []);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const toggleStatus = async (genre) => {
  try {
   const response = await fetch(`${API_URL}/${genre._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: !genre.status })
   });
   if (response.ok) {
    setGenres(prev => prev.map(g => 
     g._id === genre._id ? { ...g, status: !g.status } : g
    ));
    showNotification('Status updated successfully');
   }
  } catch (err) {
   console.error('Error toggling status:', err);
  }
 };

 const confirmDelete = (id) => {
  setDeletingId(id);
  setIsDeleteModalOpen(true);
 };

 const executeDelete = async () => {
  try {
   const response = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
   if (response.ok) {
    setGenres(prev => prev.filter(genre => genre._id !== deletingId));
    setIsDeleteModalOpen(false);
    setDeletingId(null);
    showNotification('Genre deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting genre:', err);
  }
 };

 const handleEdit = (genre) => {
  setEditingId(genre._id);
  setNameValue(genre.name);
  setStatusValue(genre.status);
  setIsModalOpen(true);
 };

 const handleAdd = () => {
  setEditingId(null);
  setNameValue('');
  setStatusValue(true);
  setIsModalOpen(true);
 };

 const handleSave = async (e) => {
  e.preventDefault();
  if (!nameValue.trim()) return;

  try {
   if (editingId) {
    const response = await fetch(`${API_URL}/${editingId}`, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: nameValue, status: statusValue })
    });
    if (response.ok) {
     const updated = await response.json();
     setGenres(prev => prev.map(g => g._id === editingId ? updated : g));
     showNotification('Genre updated successfully');
    }
   } else {
    const response = await fetch(API_URL, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: nameValue, status: statusValue })
    });
    if (response.ok) {
     const saved = await response.json();
     setGenres(prev => [...prev, saved]);
     showNotification('Genre added successfully');
    }
   }
   setIsModalOpen(false);
  } catch (err) {
   console.error('Error saving genre:', err);
  }
 };

 // Pagination logic
 const totalPages = Math.ceil(genres.length / ITEMS_PER_PAGE);
 const currentGenres = genres.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
 );

 const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages) {
   setCurrentPage(page);
   window.scrollTo(0, 0);
  }
 };

 return (
  <div className="session-container">
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

   <div className="session-inner-box">
    <div className="action-bar">
     <button className="add-btn-green" onClick={handleAdd}>
      <Plus size={16} strokeWidth={3} />
      <span>Add Genre</span>
     </button>
    </div>

    {loading ? (
     <div className="loader-container">
      <Loader size="small" inline={true} />
     </div>
    ) : (
     <>
      <div className="data-grid">
       {currentGenres.map((genre) => (
        <div key={genre._id} className="data-card">
         <div className="card-top">
          <h3>{genre.name}</h3>
         </div>
         <div className="card-bottom">
          <div className="left-actions">
           <button className="icon-btn edit" onClick={() => handleEdit(genre)}>
            <Edit2 size={14} />
           </button>
           <button className="icon-btn delete" onClick={() => confirmDelete(genre._id)}>
            <Trash2 size={14} />
           </button>
          </div>
          <div className="right-actions">
           <label className="switch">
            <input 
             type="checkbox" 
             checked={!!genre.status} 
             onChange={() => toggleStatus(genre)}
            />
            <span className="slider round"></span>
           </label>
          </div>
         </div>
        </div>
       ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
       <div className="pagination-wrapper">
        <div className="pagination-container">
         <button className="page-btn arrow" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>«</button>
         {[...Array(totalPages)].map((_, i) => (
          <button key={i + 1} className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
         ))}
         <button className="page-btn arrow" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>»</button>
        </div>
       </div>
      )}
     </>
    )}
   </div>

   {/* Modals */}
   {isModalOpen && (
    <div className="modal-overlay">
     <div className="modal-content-refactored">
      <div className="modal-header-refactored">
       <h2>{editingId ? 'Edit Genre' : 'Add Genre'}</h2>
       <button className="close-btn-refactored" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
      </div>
      <form onSubmit={handleSave} className="modal-form-refactored">
       <div className="form-row">
        <label>Genre Name</label>
        <div className="input-wrapper">
         <input type="text" value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder="Enter genre name..." required />
        </div>
       </div>
       <div className="form-row">
        <label>Status</label>
        <div className="input-wrapper">
         <select value={statusValue ? 'Active' : 'Inactive'} onChange={(e) => setStatusValue(e.target.value === 'Active')}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
         </select>
        </div>
       </div>
       <div className="modal-footer-refactored">
        <button type="submit" className="save-btn-refactored">Save</button>
       </div>
      </form>
     </div>
    </div>
   )}

   {isDeleteModalOpen && (
    <div className="modal-overlay">
     <div className="delete-modal-content">
      <div className="delete-icon-wrapper">
       <AlertTriangle size={65} color="#ff4d4d" strokeWidth={1.5} />
      </div>
      <h2>Are you sure?</h2>
      <p>You want to delete this genre? This action cannot be undone.</p>
      <div className="delete-modal-footer">
       <button className="cancel-btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="confirm-btn" onClick={executeDelete}>Delete</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .session-container { padding: 10px; animation: fadeIn 0.3s ease-in; }
    .session-inner-box { background-color: #111; border-radius: 8px; padding: 25px; min-height: 500px; border: 1px solid #222; }
    .action-bar { margin-bottom: 30px; }
    
    .add-btn-green {
     background-color: #b3d332; color: white; border: none; padding: 6px 12px; border-radius: 6px;
     display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 0.9rem; cursor: pointer;
    }

    .data-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .data-card { background: linear-gradient(135deg, #1e1e1e 0%, #151515 100%); border-radius: 12px; padding: 25px 20px; border: 1px solid #2a2a2a; display: flex; flex-direction: column; align-items: center; }
    .card-top h3 { font-size: 1.4rem; font-weight: 700; color: #fff; margin-bottom: 30px; }
    .card-bottom { width: 100%; display: flex; justify-content: space-between; align-items: center; }
    .left-actions { display: flex; gap: 10px; }
    .icon-btn { width: 32px; height: 32px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: transform 0.2s; }
    .icon-btn:hover { transform: scale(1.1); }
    .icon-btn.edit { background-color: #b3d332; }
    .icon-btn.delete { background-color: #ff4d4d; }

    .switch { position: relative; display: inline-block; width: 38px; height: 20px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 34px; }
    .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #b3d332; }
    input:checked + .slider:before { transform: translateX(18px); }

    .pagination-wrapper { display: flex; justify-content: center; margin-top: 30px; }
    .pagination-container { display: flex; background-color: #1a1a1a; border-radius: 6px; overflow: hidden; border: 1px solid #333; }
    .page-btn { background-color: transparent; border: none; color: #fff; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 700; cursor: pointer; border-right: 1px solid #333; }
    .page-btn.active { background-color: #ff4d4d; }
    .page-btn.arrow { font-size: 1.5rem; }
    .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 4000; backdrop-filter: blur(5px); }
    .modal-content-refactored { background: #1a1a1a; width: 100%; max-width: 600px; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8); animation: modalFade 0.2s ease-out; }
    .modal-header-refactored { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; border-bottom: 1px solid #333; }
    .modal-header-refactored h2 { font-size: 1.5rem; font-weight: 700; color: #fff; }
    .close-btn-refactored { background: transparent; border: none; color: #fff; cursor: pointer; }
    .modal-form-refactored { padding: 30px 25px; }
    .form-row { display: flex; align-items: center; margin-bottom: 25px; }
    .form-row label { width: 180px; font-size: 1.1rem; font-weight: 700; color: #fff; }
    .input-wrapper input, .input-wrapper select { width: 100%; background: #2a2a2a; border: none; padding: 15px 20px; border-radius: 6px; color: #fff; font-size: 1rem; outline: none; }
    .modal-footer-refactored { display: flex; justify-content: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; }
    .save-btn-refactored { background: #00c853; color: #fff; border: none; padding: 12px 35px; border-radius: 6px; font-weight: 700; font-size: 1.1rem; cursor: pointer; }

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
    .spinner { animation: spin 1s linear infinite; color: #00c853; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes modalFade { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
}
   ` }} />
  </div>
 );
};

export default Genres;
