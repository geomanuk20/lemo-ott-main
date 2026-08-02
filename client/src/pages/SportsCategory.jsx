import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/sports-categories';
const ITEMS_PER_PAGE = 8;

const SportsCategory = () => {
 const [categories, setCategories] = useState([]);
 const [loading, setLoading] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [deletingId, setDeletingId] = useState(null);
 const [nameValue, setNameValue] = useState('');
 const [statusValue, setStatusValue] = useState(true);
 const [notification, setNotification] = useState(null);

 // Fetch categories from DB
 const fetchCategories = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setCategories(data);
  } catch (err) {
   console.error('Error fetching categories:', err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchCategories();
 }, []);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const toggleStatus = async (category) => {
  try {
   const response = await fetch(`${API_URL}/${category._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: !category.status })
   });
   if (response.ok) {
    setCategories(prev => prev.map(c => 
     c._id === category._id ? { ...c, status: !c.status } : c
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
    setCategories(prev => prev.filter(c => c._id !== deletingId));
    setIsDeleteModalOpen(false);
    setDeletingId(null);
    showNotification('Category deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting category:', err);
  }
 };

 const handleEdit = (category) => {
  setEditingId(category._id);
  setNameValue(category.name);
  setStatusValue(category.status);
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
     setCategories(prev => prev.map(c => c._id === editingId ? updated : c));
     showNotification('Category updated successfully');
    }
   } else {
    const response = await fetch(API_URL, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: nameValue, status: statusValue })
    });
    if (response.ok) {
     const created = await response.json();
     setCategories(prev => [...prev, created]);
     showNotification('Category added successfully');
    }
   }
   setIsModalOpen(false);
  } catch (err) {
   console.error('Error saving category:', err);
  }
 };

 // Pagination logic
 const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
 const currentCategories = categories.slice(
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
      <span>Add Category</span>
     </button>
    </div>

    {loading ? (
     <div className="loader-container">
      <Loader size="small" inline={true} />
     </div>
    ) : (
     <>
      <div className="language-grid">
       {currentCategories.map((category) => (
        <div key={category._id} className="language-card">
         <div className="card-top">
          <h3>{category.name}</h3>
         </div>
         <div className="card-bottom">
          <div className="left-actions">
           <button 
            className="icon-btn edit" 
            onClick={() => handleEdit(category)}
            type="button"
           >
            <Edit2 size={14} />
           </button>
           <button 
            className="icon-btn delete" 
            onClick={() => confirmDelete(category._id)}
            type="button"
           >
            <Trash2 size={14} />
           </button>
          </div>
          <div className="right-actions">
           <label className="switch">
            <input 
             type="checkbox" 
             checked={!!category.status} 
             onChange={() => toggleStatus(category)}
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
         
         {(() => {
           const pages = [];
           let last = 0;
           for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || i === currentPage) {
             if (last && i - last > 1) pages.push('...' + i);
             pages.push(i);
             last = i;
            }
           }
           return pages.map((page) => {
            if (typeof page === 'string') return <span key={page} className="page-ellipsis">…</span>;
            return <button key={page} className={`page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => handlePageChange(page)}>{page}</button>;
           });
          })()}

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

   {/* Add/Edit Modal */}
   {isModalOpen && (
    <div className="modal-overlay">
     <div className="modal-content-refactored">
      <div className="modal-header-refactored">
       <h2>{editingId ? 'Edit Category' : 'Add Category'}</h2>
       <button className="close-btn-refactored" onClick={() => setIsModalOpen(false)}>
        <X size={24} />
       </button>
      </div>
      
      <form onSubmit={handleSave} className="modal-form-refactored">
       <div className="form-row">
        <label>Category Name</label>
        <div className="input-wrapper">
         <input 
          type="text" 
          value={nameValue} 
          onChange={(e) => setNameValue(e.target.value)}
          placeholder="Enter category name..."
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

   {/* Delete Confirmation Modal */}
   {isDeleteModalOpen && (
    <div className="modal-overlay">
     <div className="delete-modal-content">
      <div className="delete-icon-wrapper">
       <AlertTriangle size={65} color="#ff4d4d" strokeWidth={1.5} />
      </div>
      <h2>Are you sure?</h2>
      <p>You want to delete this category? This action cannot be undone.</p>
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

    .language-inner-box {
     background-color: #111;
     border-radius: 8px;
     padding: 25px;
     min-height: 500px;
     border: 1px solid #222;
    }

    .action-bar { display: flex; gap: 15px; margin-bottom: 30px; align-items: center; }
     
    .import-export-btn, .add-category-btn { 
     height: 42px;
     padding: 0 18px;
     border-radius: 8px;
     display: inline-flex;
     align-items: center;
     justify-content: center;
     gap: 8px;
     font-weight: 800;
     font-size: 0.88rem;
     cursor: pointer;
     box-sizing: border-box;
     transition: all 0.2s ease;
    }
    .add-category-btn {
     background-color: #b3d332;
     color: #000;
     border: 1px solid #b3d332;
    }
    .import-export-btn {
     background: #1a1a1a;
     border: 1px solid #333;
     color: #fff;
    }
    .import-export-btn:hover { background: #2a2a2a; border-color: #b3d332; color: #b3d332; }

    .loader-container {
     display: flex;
     justify-content: center;
     align-items: center;
     height: 300px;
    }

    .spinner { animation: spin 1s linear infinite; color: #00c853; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .category-grid {
     display: grid;
     grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
     gap: 20px;
     margin-bottom: 40px;
    }

    .category-card {
     background: linear-gradient(135deg, #1e1e1e 0%, #151515 100%);
     border-radius: 12px;
     padding: 25px 20px;
     border: 1px solid #2a2a2a;
     display: flex;
     flex-direction: column;
     align-items: center;
    }

    .card-top h3 { font-size: 1.4rem; font-weight: 700; color: #fff; margin-bottom: 30px; text-align: center; }

    .card-bottom { width: 100%; display: flex; justify-content: center; align-items: center; gap: 12px; }

    .left-actions { display: flex; align-items: center; gap: 8px; }
    .right-actions { display: flex; align-items: center; }

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
    .page-btn { background-color: transparent; border: none; color: #fff; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: background 0.2s; border-right: 1px solid #333; }
    .page-btn:last-child { border-right: none; }
    .page-btn.active { background-color: #ff4d4d; }
    .page-btn:hover:not(.active):not(:disabled) { background-color: #2a2a2a; }
    .page-btn.arrow { font-size: 1.5rem; color: #fff; }
    .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

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

    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border: 1px solid #222; padding: 20px 40px; border-radius: 12px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes modalFade { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 768px) {
     .sports-category-container { padding: 5px; }
     .sports-category-inner-box { padding: 15px; }
     .action-bar { flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
     .add-category-btn, .import-export-btn { flex: 1 1 auto; justify-content: center; padding: 10px 14px; font-size: 0.85rem; }
     .category-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 25px; }
     .category-card { padding: 18px 12px; }
     .card-top h3 { font-size: 1.1rem; margin-bottom: 18px; text-align: center; }
     .card-bottom { width: 100%; display: flex; justify-content: space-between; align-items: center; }
     .left-actions { gap: 6px; }
     .icon-btn { width: 30px; height: 30px; }
     .form-row { flex-direction: column; align-items: stretch; gap: 6px; margin-bottom: 18px; }
     .form-row label { width: 100%; font-size: 0.95rem; }
     .input-wrapper { width: 100%; }
    }
   ` }} />
  </div>
 );
};

export default SportsCategory;
