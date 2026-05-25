import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Plus, 
 Search, 
 Eye, 
 Edit2, 
 X, 
 Download, 
 ChevronDown,
 Loader2,
 CheckCircle2,
 UserCheck,
 Trash2,
 XCircle,
 AlertTriangle,
 UserCircle
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/users';

const SubAdmin = () => {
 const navigate = useNavigate();
 const [admins, setAdmins] = useState([]);
 const [loading, setLoading] = useState(false);
 const [notification, setNotification] = useState(null);
 const [searchTerm, setSearchTerm] = useState('');
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deletingId, setDeletingId] = useState(null);

 const fetchAdmins = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setAdmins(data.filter(u => (u.role === 'sub-admin' || u.role === 'admin') && !u.isDeleted));
  } catch (err) {
   console.error('Error fetching admins:', err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchAdmins();
 }, []);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const confirmDelete = (id) => {
  setDeletingId(id);
  setIsDeleteModalOpen(true);
 };

 const executeDelete = async () => {
  try {
   const response = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
   if (response.ok) {
    setAdmins(prev => prev.filter(a => a._id !== deletingId));
    setIsDeleteModalOpen(false);
    showNotification('Sub admin deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting admin:', err);
  }
 };

 const maskEmail = (user) => {
  if (!user || !user.email) return '';
  const [name, domain] = user.email.split('@');
  if (name.length <= 3) return user.email;
  const masked = `${name.substring(0, 3)}*******${name.slice(-4)}@${domain}`;
  return user.authProvider === 'Google' ? `${masked} - G` : masked;
 };

 const maskPhone = (phone) => {
  if (!phone) return '';
  if (phone.length <= 4) return phone;
  return `${phone.substring(0, 2)}*****${phone.slice(-3)}`;
 };

 return (
  <div className="users-list-container">
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

   {/* Top Filter Bar */}
   <div className="users-filter-bar">
    <div className="left-filters">
     <div className="search-wrapper-premium">
      <input 
       type="text" 
       placeholder="Search sub admins..." 
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Search size={18} className="search-icon-premium" />
     </div>

     <button className="add-user-btn-premium" onClick={() => navigate('/admin/users/sub-admin/add')}>
      <Plus size={16} strokeWidth={3} />
      <span>Add Sub Admin</span>
     </button>
    </div>
   </div>

   {/* Users Table */}
   <div className="users-table-wrapper">
    {loading ? (
     <div className="loader-container"><Loader size="small" inline={true} /></div>
    ) : admins.length === 0 ? (
     <div className="empty-state-v">
       <UserCheck size={60} color="#333" />
       <p>No sub admins found</p>
     </div>
    ) : (
     <table className="users-data-table">
      <thead>
       <tr>
        <th>Admin</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Status</th>
        <th>Action</th>
       </tr>
      </thead>
      <tbody>
       {admins.filter(admin => {
        const searchLower = searchTerm.toLowerCase();
        return admin.name?.toLowerCase().includes(searchLower) || 
            admin.email?.toLowerCase().includes(searchLower);
       }).map((admin) => (
        <tr key={admin._id}>
         <td className="user-cell">
          <div className="user-info-with-avatar">
           <div className="user-avatar-p">
            {admin.profileImage ? (
             <img 
              src={admin.profileImage.startsWith('http') || admin.profileImage.startsWith('data:') ? admin.profileImage : `/uploads/${admin.profileImage}`} 
              alt="" 
             />
            ) : (
             <UserCircle size={24} color="#888" />
            )}
           </div>
           <span className="user-name-bold">{admin.name}</span>
          </div>
         </td>
         <td className="email-cell">{maskEmail(admin)}</td>
         <td className="phone-cell">{maskPhone(admin.phone)}</td>
         <td>
          <div className="status-flex-h">
           <span className={`status-badge-premium ${admin.status === 'Active' ? 'active' : 'inactive'}`}>
            {admin.status || 'Active'}
           </span>
           <span className="role-tag-h">{admin.role === 'admin' ? 'Master' : 'Sub'}</span>
          </div>
         </td>
         <td className="action-cell">
          <div className="action-buttons-group">
           <button className="action-btn-p edit" title="Edit" onClick={() => navigate(`/admin/users/sub-admin/edit/${admin._id}`)}><Edit2 size={14} /></button>
           <button className="action-btn-p delete" title="Delete" onClick={() => confirmDelete(admin._id)}><Trash2 size={14} /></button>
          </div>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    )}
   </div>

   {/* Delete Confirmation Modal */}
   {isDeleteModalOpen && (
    <div className="modal-overlay-p">
     <div className="modal-content-p delete">
      <div className="modal-icon-p">
       <Trash2 size={40} color="#ff4d4d" />
      </div>
      <h2>Move to Recycle Bin?</h2>
      <p>Are you sure you want to delete this sub admin? You can restore them later from the Deleted Users section.</p>
      <div className="modal-actions-p">
       <button className="cancel-btn-p" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="confirm-btn-p delete" onClick={executeDelete}>Move to Recycle Bin</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .users-list-container { padding: 25px 30px; animation: fadeIn 0.4s ease-out; }
    .users-filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; gap: 20px; }
    .left-filters { display: flex; align-items: center; gap: 15px; flex: 1; }
    
    .search-wrapper-premium { position: relative; flex: 1; max-width: 400px; }
    .search-wrapper-premium input { width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 10px 15px 10px 40px; color: #fff; border-radius: 30px; outline: none; font-size: 0.9rem; }
    .search-icon-premium { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #666; }

    .add-user-btn-premium { background: #b3d332; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; white-space: nowrap; }
    .export-users-btn { background: #0088ff; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; }

    .users-table-wrapper { background: #111; border-radius: 8px; border: 1px solid #222; overflow: hidden; }
    .users-data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .users-data-table th { padding: 15px 20px; border-bottom: 1px solid #333; border-right: 1px solid #222; color: #eee; font-size: 0.9rem; font-weight: 700; background: #161616; }
    .users-data-table th:last-child { border-right: none; }
    .users-data-table td { padding: 15px 20px; border-bottom: 1px solid #222; border-right: 1px solid #1a1a1a; color: #aaa; font-size: 0.9rem; }
    .users-data-table td:last-child { border-right: none; }
    .users-data-table tr:hover { background: #151515; }

    .user-name-bold { color: #fff; font-weight: 700; font-size: 0.95rem; }
    .user-info-with-avatar { display: flex; align-items: center; gap: 12px; }
    .user-avatar-p { width: 35px; height: 35px; border-radius: 50%; overflow: hidden; background: #111; border: 1px solid #333; display: flex; align-items: center; justify-content: center; }
    .user-avatar-p img { width: 100%; height: 100%; object-fit: cover; }
    .email-cell { font-family: monospace; font-size: 0.85rem; color: #888; }
    .phone-cell { color: #888; font-size: 0.85rem; }

    .status-badge-premium { padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge-premium.active { background: #b3d332; color: #fff; }
    .status-badge-premium.inactive { background: #ff4d4d; color: #fff; }
    
    .status-flex-h { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
    .role-tag-h { font-size: 0.65rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; }

    .action-cell { width: 150px; }
    .action-buttons-group { display: flex; gap: 8px; }
    .action-btn-p { width: 32px; height: 32px; border-radius: 4px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; transition: transform 0.2s; }
    .action-btn-p.view { background: #b3d332; }
    .action-btn-p.edit { background: #b3d332; }
    .action-btn-p.delete { background: #ff4d4d; }
    .action-btn-p:hover { transform: scale(1.1); }

    .empty-state-v { padding: 50px; text-align: center; color: #444; display: flex; flex-direction: column; align-items: center; gap: 15px; }
    
    .confirm-btn-alt { background: #ff4d4d; color: #fff; border: none; padding: 12px 35px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 1rem; }

    /* Global Notification Style */
    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 25px 50px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    .loader-container { height: 40vh; display: flex; align-items: center; justify-content: center; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Premium Modal Styles */
    .modal-overlay-p { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.3s ease; }
    .modal-content-p { background: #0a0a0a; border: 1px solid #222; padding: 40px; border-radius: 20px; width: 100%; max-width: 450px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); animation: modalSlide 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes modalSlide { from { transform: scale(0.8) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    
    .modal-icon-p { margin-bottom: 25px; display: flex; justify-content: center; }
    .modal-content-p h2 { color: #fff; font-size: 1.6rem; font-weight: 800; margin-bottom: 15px; }
    .modal-content-p p { color: #888; font-size: 0.95rem; line-height: 1.6; margin-bottom: 30px; }
    
    .modal-actions-p { display: flex; gap: 15px; justify-content: center; }
    .cancel-btn-p { background: #1a1a1a; color: #fff; border: 1px solid #333; padding: 12px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    .cancel-btn-p:hover { background: #252525; border-color: #444; }
    
    .confirm-btn-p { background: #ff4d4d; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3); }
    .confirm-btn-p:hover { background: #ff3333; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 77, 77, 0.4); }
   ` }} />
  </div>
 );
};

export default SubAdmin;
