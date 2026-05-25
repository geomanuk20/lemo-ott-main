import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/languages';
const ITEMS_PER_PAGE = 8;

const Languages = () => {
 const [languages, setLanguages] = useState([]);
 const [loading, setLoading] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [deletingId, setDeletingId] = useState(null);
 const [nameValue, setNameValue] = useState('');
 const [statusValue, setStatusValue] = useState(true);
 const [notification, setNotification] = useState(null);

 // Fetch languages from DB
 const fetchLanguages = async () => {
  console.log('Ingesting language modules...');
  setLoading(true);
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   
   // Artificial delay to ensure visibility of the world-class orchestration
   await new Promise(resolve => setTimeout(resolve, 1000));
   
   setLanguages(data);
  } catch (err) {
   console.error('Error fetching languages:', err);
  } finally {
   setLoading(false);
   console.log('Language modules synchronized.');
  }
 };

 useEffect(() => {
  fetchLanguages();
 }, []);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const toggleStatus = async (lang) => {
  try {
   const response = await fetch(`${API_URL}/${lang._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: !lang.status })
   });
   if (response.ok) {
    setLanguages(prev => prev.map(l => 
     l._id === lang._id ? { ...l, status: !l.status } : l
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
    setLanguages(prev => prev.filter(lang => lang._id !== deletingId));
    setIsDeleteModalOpen(false);
    setDeletingId(null);
    showNotification('Language deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting language:', err);
  }
 };

 const handleEdit = (lang) => {
  setEditingId(lang._id);
  setNameValue(lang.name);
  setStatusValue(lang.status);
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
     setLanguages(prev => prev.map(l => l._id === editingId ? updated : l));
     showNotification('Language updated successfully');
    }
   } else {
    const response = await fetch(API_URL, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: nameValue, status: statusValue })
    });
    if (response.ok) {
     const saved = await response.json();
     setLanguages(prev => [...prev, saved]);
     showNotification('Language added successfully');
    }
   }
   setIsModalOpen(false);
  } catch (err) {
   console.error('Error saving language:', err);
  }
 };

 // Pagination logic
 const totalPages = Math.ceil(languages.length / ITEMS_PER_PAGE);
 const currentLanguages = languages.slice(
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
  <div className="language-session-container">
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

   <div className="language-inner-box">
    <div className="action-bar">
     <button className="add-language-btn" onClick={handleAdd}>
      <Plus size={16} strokeWidth={3} />
      <span>Add Language</span>
     </button>
    </div>

    {loading ? (
     <div className="loader-container-v">
      <Loader size="small" />
     </div>
    ) : (
     <>
      <div className="language-grid">
       {currentLanguages.map((lang) => (
        <div key={lang._id} className="language-card">
         <div className="card-top">
          <h3>{lang.name}</h3>
         </div>
         <div className="card-bottom">
          <div className="left-actions">
           <button 
            className="icon-btn edit" 
            onClick={() => handleEdit(lang)}
            type="button"
           >
            <Edit2 size={14} />
           </button>
           <button 
            className="icon-btn delete" 
            onClick={() => confirmDelete(lang._id)}
            type="button"
           >
            <Trash2 size={14} />
           </button>
          </div>
          <div className="right-actions">
           <label className="switch">
            <input 
             type="checkbox" 
             checked={!!lang.status} 
             onChange={() => toggleStatus(lang)}
            />
            <span className="slider round"></span>
           </label>
          </div>
         </div>
        </div>
       ))}
      </div>

      {/* Pagination UI */}
      {totalPages > 1 && (
       <div className="pagination-wrapper">
        <div className="pagination-container">
         <button 
          className="page-btn arrow" 
          onClick={() => handlePageChange(currentPage - 1)}
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
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
         >
          »
         </button>
        </div>
       </div>
      )}
     </>
    )}
   </div>

   {/* Modals... */}
   {isModalOpen && (
    <div className="modal-overlay">
     <div className="modal-content-refactored">
      <div className="modal-header-refactored">
       <h2>{editingId ? 'Edit Language' : 'Add Language'}</h2>
       <button className="close-btn-refactored" onClick={() => setIsModalOpen(false)}>
        <X size={24} />
       </button>
      </div>
      
      <form onSubmit={handleSave} className="modal-form-refactored">
       <div className="form-row">
        <label>Language Name</label>
        <div className="input-wrapper">
         <input 
          type="text" 
          value={nameValue} 
          onChange={(e) => setNameValue(e.target.value)}
          placeholder="Enter name..."
          required
         />
        </div>
       </div>

       <div className="form-row">
        <label>Status</label>
        <div className="input-wrapper">
         <select 
          value={statusValue ? 'Active' : 'Inactive'} 
          onChange={(e) => setStatusValue(e.target.value === 'Active')}
         >
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
      <p>You want to delete this language? This action cannot be undone.</p>
      <div className="delete-modal-footer">
       <button className="cancel-btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="confirm-btn" onClick={executeDelete}>Delete</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .language-session-container {
     padding: 10px;
     animation: fadeIn 0.3s ease-in;
     position: relative;
    }

    .custom-alert-box {
     position: fixed;
     top: 30px;
     right: 30px;
     background-color: #ffffff;
     border-radius: 4px;
     padding: 15px 30px;
     box-shadow: 0 4px 20px rgba(0,0,0,0.3);
     z-index: 6000;
     animation: alertSlideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
     min-width: 350px;
    }

    @keyframes alertSlideIn {
     from { transform: translateX(100%); opacity: 0; }
     to { transform: translateX(0); opacity: 1; }
    }

    .delete-modal-content {
     width: 90%;
     max-width: 500px;
     text-align: left;
     animation: modalFade 0.2s ease-out;
     padding: 20px;
    }

    .delete-icon-wrapper { margin-bottom: 10px; }
    .delete-modal-content h2 { font-size: 2.8rem; font-weight: 800; margin-bottom: 5px; color: #fff; line-height: 1.1; }
    .delete-modal-content p { color: #fff; margin-bottom: 15px; font-size: 1.25rem; font-weight: 500; }
    .delete-modal-footer { display: flex; gap: 6px; }

    .cancel-btn-delete, .confirm-btn-delete {
     background: #f0f0f0;
     color: #000;
     border: 1px solid #767676;
     padding: 1px 8px;
     border-radius: 2px;
     cursor: pointer;
     font-size: 0.95rem;
     font-family: Arial, sans-serif;
    }

    .cancel-btn-delete:hover, .confirm-btn-delete:hover {
     background: #e5e5e5;
    }

    .alert-content {
     display: flex;
     align-items: center;
     gap: 20px;
    }

    .alert-text {
     color: #333333;
     font-size: 1.2rem;
     font-weight: 700;
    }

    .language-inner-box {
     background-color: #111;
     border-radius: 8px;
     padding: 25px;
     min-height: 500px;
     border: 1px solid #222;
    }

    .action-bar { margin-bottom: 30px; }

    .add-language-btn {
     background-color: #b3d332;
     color: white;
     border: none;
     padding: 6px 12px;
     border-radius: 6px;
     display: flex;
     align-items: center;
     gap: 6px;
     font-weight: 800;
     font-size: 0.9rem;
     cursor: pointer;
     transition: transform 0.2s;
    }

    .add-language-btn:hover {
     transform: scale(1.02);
     background-color: #12a66d;
    }

    .loader-container { width: 100%; min-height: 500px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; }
    .ios-spinner-v { position: relative; width: 40px; height: 40px; }
    .spoke-v { position: absolute; left: 17px; top: 0; width: 5px; height: 12px; background: #ffffff !important; border-radius: 6px; transform-origin: 2.5px 20px; animation: ios-fade 1s linear infinite; opacity: 0; }
    @keyframes ios-fade { 0% { opacity: 1; } 100% { opacity: 0.15; } }
    
    .spoke-1 { transform: rotate(0deg); animation-delay: -1s; }
    .spoke-2 { transform: rotate(30deg); animation-delay: -0.916s; }
    .spoke-3 { transform: rotate(60deg); animation-delay: -0.833s; }
    .spoke-4 { transform: rotate(90deg); animation-delay: -0.75s; }
    .spoke-5 { transform: rotate(120deg); animation-delay: -0.666s; }
    .spoke-6 { transform: rotate(150deg); animation-delay: -0.583s; }
    .spoke-7 { transform: rotate(180deg); animation-delay: -0.5s; }
    .spoke-8 { transform: rotate(210deg); animation-delay: -0.416s; }
    .spoke-9 { transform: rotate(240deg); animation-delay: -0.333s; }
    .spoke-10 { transform: rotate(270deg); animation-delay: -0.25s; }
    .spoke-11 { transform: rotate(300deg); animation-delay: -0.166s; }
    .spoke-12 { transform: rotate(330deg); animation-delay: -0.083s; }

    .language-grid {
     display: grid;
     grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
     gap: 20px;
     margin-bottom: 40px;
    }

    .language-card {
     background: linear-gradient(135deg, #1e1e1e 0%, #151515 100%);
     border-radius: 12px;
     padding: 25px 20px;
     border: 1px solid #2a2a2a;
     display: flex;
     flex-direction: column;
     align-items: center;
    }

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

    /* PAGINATION STYLES */
    .pagination-wrapper {
     display: flex;
     justify-content: center;
     margin-top: 30px;
    }

    .pagination-container {
     display: flex;
     background-color: #1a1a1a;
     border-radius: 6px;
     overflow: hidden;
     border: 1px solid #333;
    }

    .page-btn {
     background-color: transparent;
     border: none;
     color: #fff;
     width: 45px;
     height: 45px;
     display: flex;
     align-items: center;
     justify-content: center;
     font-size: 1.1rem;
     font-weight: 700;
     cursor: pointer;
     transition: background 0.2s;
     border-right: 1px solid #333;
    }

    .page-btn:last-child { border-right: none; }

    .page-btn.active {
     background-color: #ff4d4d;
    }

    .page-btn:hover:not(.active):not(:disabled) {
     background-color: #2a2a2a;
    }

    .page-btn.arrow {
     font-size: 1.5rem;
     color: #fff;
    }

    .page-btn:disabled {
     opacity: 0.3;
     cursor: not-allowed;
    }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 4000; backdrop-filter: blur(5px); }
    .modal-content-refactored { background: #1a1a1a; width: 100%; max-width: 600px; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8); animation: modalFade 0.2s ease-out; }
    .modal-header-refactored { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; border-bottom: 1px solid #333; }
    .modal-header-refactored h2 { font-size: 1.5rem; font-weight: 700; color: #fff; }
    .close-btn-refactored { background: transparent; border: none; color: #fff; cursor: pointer; }
    .modal-form-refactored { padding: 30px 25px; }
    .form-row { display: flex; align-items: center; margin-bottom: 25px; }
    .form-row label { width: 180px; font-size: 1.1rem; font-weight: 700; color: #fff; }
    .input-wrapper { flex: 1; }
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

    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 25px 50px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    @keyframes modalFade { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
   ` }} />
  </div>
 );
};

export default Languages;
