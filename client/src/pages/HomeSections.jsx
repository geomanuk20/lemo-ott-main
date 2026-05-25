import React, { useState, useEffect } from 'react';
import { 
 Plus, 
 Edit2, 
 Trash2, 
 X, 
 AlertTriangle, 
 CheckCircle2, 
 XCircle,
 Loader2,
 Layers
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/home-sections';

const HomeSections = () => {
 const [sections, setSections] = useState([]);
 const [loading, setLoading] = useState(false);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [deletingId, setDeletingId] = useState(null);
 const [notification, setNotification] = useState(null);

 // Form State
 const [formData, setFormData] = useState({
  title: '',
  sectionType: '',
  status: 'Active',
  limit: 10,
  order: 0
 });

 const fetchSections = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setSections(data);
  } catch (err) {
   console.error('Error fetching sections:', err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchSections();
 }, []);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleToggleStatus = async (section) => {
  const newStatus = section.status === 'Active' ? 'Inactive' : 'Active';
  try {
   const response = await fetch(`${API_URL}/${section._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
   });
   if (response.ok) {
    setSections(prev => prev.map(s => 
     s._id === section._id ? { ...s, status: newStatus } : s
    ));
    showNotification('Status updated successfully');
   }
  } catch (err) {
   console.error('Error toggling status:', err);
  }
 };

 const handleAdd = () => {
  setEditingId(null);
  setFormData({ title: '', sectionType: '', status: 'Active', limit: 10, order: sections.length });
  setIsModalOpen(true);
 };

 const handleEdit = (section) => {
  setEditingId(section._id);
  setFormData({
   title: section.title,
   sectionType: section.sectionType,
   status: section.status,
   limit: section.limit !== undefined ? section.limit : 10,
   order: section.order !== undefined ? section.order : 0
  });
  setIsModalOpen(true);
 };

 const handleSave = async (e) => {
  e.preventDefault();
  try {
   if (editingId) {
    const res = await fetch(`${API_URL}/${editingId}`, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(formData)
    });
    if (res.ok) {
     const updated = await res.json();
     setSections(prev => prev.map(s => s._id === editingId ? updated : s));
     showNotification('Home section updated successfully');
    }
   } else {
    const res = await fetch(API_URL, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(formData)
    });
    if (res.ok) {
     const saved = await res.json();
     setSections(prev => [...prev, saved]);
     showNotification('Home section added successfully');
    }
   }
   setIsModalOpen(false);
  } catch (err) {
   console.error('Error saving section:', err);
  }
 };

 const confirmDelete = (id) => {
  setDeletingId(id);
  setIsDeleteModalOpen(true);
 };

 const executeDelete = async () => {
  try {
   const res = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
   if (res.ok) {
    setSections(prev => prev.filter(s => s._id !== deletingId));
    showNotification('Home section deleted successfully');
   }
   setIsDeleteModalOpen(false);
  } catch (err) {
   console.error('Error deleting section:', err);
  }
 };

 return (
  <div className="language-session-container">
    {notification && (
     <div className={`custom-alert-box ${notification.type}`}>
      <div className="alert-content">
       {notification.type === 'success' ? (
        <CheckCircle2 size={20} strokeWidth={2.5} />
       ) : (
        <XCircle size={20} strokeWidth={2.5} />
       )}
       <span className="alert-text">{notification.message}</span>
      </div>
     </div>
    )}

   <div className="language-inner-box">
    <div className="action-bar">
     <button className="add-language-btn" onClick={handleAdd}>
      <Plus size={16} strokeWidth={3} />
      <span>Add Section</span>
     </button>
    </div>

    {loading ? (
     <div className="loader-container">
      <Loader size="small" inline={true} />
     </div>
    ) : sections.length === 0 ? (
     <div className="empty-state-alt">
      <Layers size={60} color="#333" />
      <h3>No homepage sections found</h3>
     </div>
    ) : (
     <div className="language-grid">
      {sections.map((section) => (
       <div key={section._id} className="language-card">
        <div className="card-top">
         <h3>{section.title}</h3>
        </div>
        <div className="card-bottom">
         <div className="left-actions">
          <button className="icon-btn edit" onClick={() => handleEdit(section)}>
           <Edit2 size={14} />
          </button>
          <button className="icon-btn delete" onClick={() => confirmDelete(section._id)}>
           <Trash2 size={14} />
          </button>
         </div>
         <div className="right-actions">
          <label className="switch">
           <input 
            type="checkbox" 
            checked={section.status === 'Active'} 
            onChange={() => handleToggleStatus(section)}
           />
           <span className="slider round"></span>
          </label>
         </div>
        </div>
       </div>
      ))}
     </div>
    )}
   </div>

   {/* Add/Edit Modal */}
   {isModalOpen && (
    <div className="modal-overlay">
     <div className="modal-content-refactored">
      <div className="modal-header-refactored">
       <h2>{editingId ? 'Edit Section' : 'Add Section'}</h2>
       <button className="close-btn-refactored" onClick={() => setIsModalOpen(false)}>
        <X size={24} />
       </button>
      </div>
      
      <form onSubmit={handleSave} className="modal-form-refactored">
       <div className="form-group-refactored">
        <label>Home Section Title*</label>
        <input 
         type="text" 
         value={formData.title}
         onChange={(e) => setFormData({...formData, title: e.target.value})}
         required 
        />
       </div>

       <div className="form-group-refactored">
        <label>Type</label>
        <select 
         value={formData.sectionType}
         onChange={(e) => setFormData({...formData, sectionType: e.target.value})}
        >
          <option value="">Select</option>
          <option value="Movie">Movie</option>
          <option value="New Release">New Release</option>
          <option value="Short Film">Short Film</option>
          <option value="Short Web Series">Short Web Series</option>
          <option value="Shows">Shows</option>
          <option value="Sports">Sports</option>
          <option value="Live TV">Live TV</option>
         </select>
       </div>

        <div className="form-group-refactored">
         <label>Limit (Items Count)</label>
         <input 
          type="number" 
          value={formData.limit}
          onChange={(e) => setFormData({...formData, limit: parseInt(e.target.value) || 10})}
          min={1}
          max={100}
          required
         />
        </div>

        <div className="form-group-refactored">
         <label>Display Order</label>
         <input 
          type="number" 
          value={formData.order}
          onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
          min={0}
          required
         />
        </div>

        <div className="form-group-refactored">
         <label>Status</label>
         <select 
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
         >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
         </select>
        </div>

       <div className="modal-footer-refactored">
        <button type="submit" className="save-btn-refactored">Save</button>
       </div>
      </form>
     </div>
    </div>
   )}

   {/* Delete Modal */}
   {isDeleteModalOpen && (
    <div className="modal-overlay">
     <div className="delete-modal-content">
      <AlertTriangle size={60} color="#ff4d4d" />
      <h2>Are you sure?</h2>
      <p>This action cannot be undone. This section will be permanently deleted.</p>
      <div className="delete-modal-footer">
       <button className="cancel-btn-delete" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="confirm-btn-delete" onClick={executeDelete}>Delete</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .language-session-container { padding: 30px; animation: fadeIn 0.4s ease-out; }
    .language-inner-box { background-color: #111; border-radius: 8px; padding: 25px; min-height: 500px; border: 1px solid #222; }
    
    .action-bar { margin-bottom: 30px; }
    .add-language-btn { background-color: #b3d332; color: white; border: none; padding: 8px 16px; border-radius: 6px; display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: transform 0.2s; }
    .add-language-btn:hover { transform: scale(1.02); background-color: #12a66d; }

    .language-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
    .language-card { background: linear-gradient(135deg, #1e1e1e 0%, #151515 100%); border-radius: 12px; padding: 25px 20px; border: 1px solid #2a2a2a; display: flex; flex-direction: column; align-items: center; }
    
    .card-top h3 { font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 30px; text-align: center; }
    .card-bottom { width: 100%; display: flex; justify-content: space-between; align-items: center; }
    
    .left-actions { display: flex; gap: 10px; }
    .icon-btn { width: 32px; height: 32px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: transform 0.2s; }
    .icon-btn.edit { background-color: #b3d332; }
    .icon-btn.delete { background-color: #ff4d4d; }
    .icon-btn:hover { transform: scale(1.1); }

    .switch { position: relative; display: inline-block; width: 38px; height: 20px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 34px; }
    .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #b3d332; }
    input:checked + .slider:before { transform: translateX(18px); }

    .loader-container { display: flex; justify-content: center; align-items: center; height: 300px; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 3000; backdrop-filter: blur(5px); }
    .modal-content-refactored { background: #1a1a1a; width: 100%; max-width: 500px; border-radius: 20px; border: 1px solid #333; overflow: hidden; animation: modalIn 0.3s ease-out; }
    .modal-header-refactored { background: #111; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; }
    .modal-header-refactored h2 { color: #fff; font-size: 1.4rem; font-weight: 700; margin: 0; }
    .close-btn-refactored { background: none; border: none; color: #666; cursor: pointer; transition: color 0.2s; }
    .close-btn-refactored:hover { color: #ff4d4d; }

    .modal-form-refactored { padding: 30px; }
    .form-group-refactored { margin-bottom: 20px; }
    .form-group-refactored label { display: block; color: #aaa; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; }
    .form-group-refactored input, .form-group-refactored select { width: 100%; background: #111; border: 1px solid #333; padding: 12px 15px; color: #fff; border-radius: 8px; outline: none; font-size: 1rem; }
    
    .modal-footer-refactored { margin-top: 30px; }
    .save-btn-refactored { width: 100%; background: #ff4d4d; color: #fff; border: none; padding: 14px; border-radius: 8px; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: opacity 0.2s; }
    .save-btn-refactored:hover { opacity: 0.9; }

    .delete-modal-content { background: #1a1a1a; padding: 40px; border-radius: 20px; text-align: center; border: 1px solid #333; max-width: 450px; }
    .delete-modal-content h2 { color: #fff; margin: 20px 0 10px; font-size: 1.8rem; }
    .delete-modal-content p { color: #aaa; margin-bottom: 30px; line-height: 1.5; }
    .delete-modal-footer { display: flex; gap: 15px; }
    .cancel-btn-delete { flex: 1; background: #333; color: #fff; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .confirm-btn-delete { flex: 1; background: #ff4d4d; color: #fff; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }

    .custom-alert-box { 
     position: fixed; 
     bottom: 40px; 
     left: 50%; 
     transform: translateX(-50%); 
     background: #b3d332; 
     color: #fff; 
     padding: 12px 25px; 
     border-radius: 50px; 
     display: flex; 
     align-items: center; 
     justify-content: center;
     z-index: 5000; 
     box-shadow: 0 15px 30px rgba(0,0,0,0.4); 
     animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
     border: 1px solid rgba(255,255,255,0.25);
    }
    .custom-alert-box.error { 
     background: #ff4d4d; 
    }
    .alert-content { 
     display: flex; 
     align-items: center; 
     gap: 12px; 
    }
    .alert-text { 
     color: #fff; 
     font-size: 1rem; 
     font-weight: 700; 
     text-align: center; 
     letter-spacing: -0.2px;
    }
    
    @keyframes slideUp { 
     from { transform: translate(-50%, 20px); opacity: 0; } 
     to { transform: translate(-50%, 0); opacity: 1; } 
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes modalIn { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
   ` }} />
  </div>
 );
};

export default HomeSections;
