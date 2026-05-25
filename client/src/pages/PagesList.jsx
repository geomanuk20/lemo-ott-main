import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Plus, 
 Edit2, 
 X, 
 Eye,
 Loader2, 
 CheckCircle2, 
 XCircle
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/pages';

const PagesList = () => {
 const navigate = useNavigate();
 const [pages, setPages] = useState([]);
 const [loading, setLoading] = useState(false);
 const [notification, setNotification] = useState(null);
 const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

 useEffect(() => {
  fetchPages();
 }, []);

 const fetchPages = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setPages(data);
  } catch (err) {
   console.error('Error fetching pages:', err);
  } finally {
   setLoading(false);
  }
 };

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const confirmDelete = (id) => {
  setDeleteModal({ show: true, id });
 };

 const handleDelete = async () => {
  const id = deleteModal.id;
  try {
   const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
   if (response.ok) {
    setPages(pages.filter(p => p._id !== id));
    showNotification('Page deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting page:', err);
   showNotification('Error deleting page', 'error');
  } finally {
   setDeleteModal({ show: false, id: null });
  }
 };

 return (
  <div className="subscription-page">
   {notification && (
    <div className="custom-alert-box-p">
     <div className="alert-content-p">
      {notification.type === 'success' ? (
       <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
      ) : (
       <XCircle size={42} color="#ff4d4d" strokeWidth={2.5} />
      )}
      <span className="alert-text-p">{notification.message}</span>
     </div>
    </div>
   )}

   {/* Delete Confirmation Modal */}
   {deleteModal.show && (
    <div className="modal-overlay-p">
     <div className="premium-delete-modal-p">
      <div className="modal-icon-p">
       <XCircle size={60} color="#ff4d4d" />
      </div>
      <h2>Are you sure?</h2>
      <p>You are about to permanently delete this page. This action cannot be undone.</p>
      <div className="modal-actions-p">
       <button className="cancel-btn-p" onClick={() => setDeleteModal({ show: false, id: null })}>Cancel</button>
       <button className="confirm-btn-p" onClick={handleDelete}>Delete Page</button>
      </div>
     </div>
    </div>
   )}

   <div className="content-area-p">
    <button className="add-plan-btn" onClick={() => navigate('/admin/pages/add')}>
     <Plus size={18} strokeWidth={3} />
     <span>Add Page</span>
    </button>

    <div className="table-container-p">
     <table className="premium-table-v">
      <thead>
       <tr>
        <th style={{ width: '40%' }}>Page Title</th>
        <th style={{ width: '30%' }}>Status</th>
        <th style={{ width: '30%' }}>Action</th>
       </tr>
      </thead>
      <tbody>
       {loading ? (
        <tr>
         <td colSpan="3" className="loader-cell">
          <Loader size="small" inline={true} />
         </td>
        </tr>
       ) : pages.length === 0 ? (
        <tr>
         <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No pages found. Click "Add Page" to create one.
         </td>
        </tr>
       ) : (
        pages.map((page) => (
         <tr key={page._id}>
          <td className="bold-text">{page.title}</td>
          <td>
           <span className={`badge-p status-active ${page.status === 'Active' ? '' : 'inactive'}`}>
            {page.status}
           </span>
          </td>
          <td>
           <div className="action-btns-p">
            <button className="view-btn-v" title="View Page">
             <Eye size={14} />
            </button>
            <button className="edit-btn-v" onClick={() => navigate(`/admin/pages/edit/${page._id}`)} title="Edit Page">
             <Edit2 size={14} />
            </button>
            {page.title !== 'Contact Us' && (
             <button className="delete-btn-v" onClick={() => confirmDelete(page._id)} title="Delete Page">
              <X size={14} />
             </button>
            )}
           </div>
          </td>
         </tr>
        ))
       )}
      </tbody>
     </table>
    </div>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .subscription-page { background: #000; min-height: 100vh; color: #fff; }
    
    /* Modal Styles */
    .modal-overlay-p { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 99999; animation: fadeInModal 0.3s ease; }
    .premium-delete-modal-p { background: #111; border: 1px solid #333; border-radius: 12px; padding: 30px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.8); animation: scaleUpModal 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .modal-icon-p { margin-bottom: 15px; animation: bounceIcon 0.6s ease; }
    .premium-delete-modal-p h2 { font-size: 1.4rem; font-weight: 800; margin-bottom: 10px; color: #fff; }
    .premium-delete-modal-p p { color: #888; line-height: 1.5; margin-bottom: 25px; font-size: 0.9rem; }
    .modal-actions-p { display: flex; gap: 10px; justify-content: center; }
    .cancel-btn-p { background: #222; color: #fff; border: 1px solid #333; padding: 10px 25px; border-radius: 6px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
    .confirm-btn-p { background: #ff4d4d; color: #fff; border: none; padding: 10px 25px; border-radius: 6px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }

    @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUpModal { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes bounceIcon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

    .content-area-p { padding: 25px 40px; }
    .add-plan-btn { background: #b3d332; color: #fff; border: none; padding: 8px 15px; border-radius: 4px; display: flex; align-items: center; gap: 6px; font-weight: 700; cursor: pointer; margin-bottom: 20px; transition: background 0.3s; font-size: 0.85rem; }
    .add-plan-btn:hover { background: #14b072; }

    .table-container-p { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 4px; overflow: hidden; }
    .premium-table-v { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table-v th { background: #111; padding: 12px 20px; font-size: 0.8rem; font-weight: 700; color: #888; border-bottom: 1px solid #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; }
    .premium-table-v td { padding: 12px 20px; font-size: 0.9rem; color: #aaa; border-bottom: 1px solid #111; vertical-align: middle; }
    .premium-table-v tr:hover { background: #050505; }
    
    .bold-text { color: #fff; font-weight: 700; }

    .badge-p { padding: 4px 10px; border-radius: 3px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-p.status-active { background: #b3d332; color: #fff; }
    .badge-p.status-active.inactive { background: #ff4d4d; }

    .action-btns-p { display: flex; gap: 8px; }
    .view-btn-v, .edit-btn-v, .delete-btn-v { background: #1a1b1e; color: #fff; border: 1px solid #2a2c31; width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .view-btn-v:hover { background: #b3d332; border-color: #b3d332; }
    .edit-btn-v:hover { background: #b3d332; border-color: #b3d332; }
    .delete-btn-v:hover { background: #ff4d4d; border-color: #ff4d4d; }

    .loader-cell { text-align: center; padding: 100px !important; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Notification */
    .custom-alert-box-p { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 20px 40px; z-index: 9999; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    .alert-content-p { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .alert-text-p { color: #fff; font-weight: 700; }
   ` }} />
  </div>
 );
};

export default PagesList;
