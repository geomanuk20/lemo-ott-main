import React, { useState, useEffect } from 'react';
import { 
 RotateCcw, 
 Trash2, 
 Search, 
 Download, 
 Loader2,
 CheckCircle2,
 XCircle
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/users';

const DeletedUsers = () => {
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(false);
 const [notification, setNotification] = useState(null);
 const [searchTerm, setSearchTerm] = useState('');
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deletingId, setDeletingId] = useState(null); // 'all' or ID

 const fetchDeleted = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setUsers(data.filter(u => u.isDeleted));
  } catch (err) {
   console.error('Error fetching deleted users:', err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchDeleted();
 }, []);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleRestore = async (id) => {
  try {
   const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isDeleted: false })
   });
   
   if (response.ok) {
    setUsers(prev => prev.filter(u => u._id !== id));
    showNotification('User restored successfully');
   }
  } catch (err) {
   console.error('Error restoring user:', err);
  }
 };

 const handlePermanentDelete = async () => {
  try {
   const url = deletingId === 'all' 
    ? `${API_URL}/permanent/all` 
    : `${API_URL}/permanent/${deletingId}`;
   
   const response = await fetch(url, { method: 'DELETE' });
   if (response.ok) {
    if (deletingId === 'all') {
     setUsers([]);
    } else {
     setUsers(prev => prev.filter(u => u._id !== deletingId));
    }
    setIsDeleteModalOpen(false);
    setDeletingId(null);
    showNotification(deletingId === 'all' ? 'Recycle bin cleared' : 'User permanently deleted');
   }
  } catch (err) {
   console.error('Error deleting:', err);
  }
 };

 const openDeleteModal = (id) => {
  setDeletingId(id);
  setIsDeleteModalOpen(true);
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

   {/* Delete Confirmation Modal */}
   {isDeleteModalOpen && (
    <div className="modal-overlay-p">
     <div className="modal-content-p delete">
      <div className="modal-icon-p">
       <Trash2 size={40} color="#ff4d4d" />
      </div>
      <h2>{deletingId === 'all' ? 'Clear Recycle Bin?' : 'Permanently Delete User?'}</h2>
      <p>
       {deletingId === 'all' 
        ? 'This will permanently delete all users in the recycle bin. This action cannot be undone.' 
        : 'Are you sure you want to permanently delete this user? This action cannot be undone.'}
      </p>
      <div className="modal-actions-p">
       <button className="cancel-btn-p" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="confirm-btn-p delete" onClick={handlePermanentDelete}>
        {deletingId === 'all' ? 'Permanently Delete All' : 'Permanently Delete'}
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Top Filter Bar */}
   <div className="users-filter-bar">
    <div className="left-filters">
     <div className="search-wrapper-premium">
      <input 
       type="text" 
       placeholder="Search deleted users..." 
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Search size={18} className="search-icon-premium" />
     </div>
    </div>

    <button className="export-users-btn" style={{ background: '#ff4d4d' }} onClick={() => openDeleteModal('all')}>
     <Trash2 size={16} />
     <span>Permanently Delete All</span>
    </button>
   </div>

   {/* Users Table */}
   <div className="users-table-wrapper">
    {loading ? (
     <div className="loader-container"><Loader size="small" inline={true} /></div>
    ) : users.length === 0 ? (
     <div className="empty-state-v">
       <Trash2 size={60} color="#333" />
       <p>No deleted users found</p>
     </div>
    ) : (
     <table className="users-data-table">
      <thead>
       <tr>
        <th>User</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Status</th>
        <th>Action</th>
       </tr>
      </thead>
      <tbody>
       {users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (user.name?.toLowerCase().includes(searchLower) || 
            user.email?.toLowerCase().includes(searchLower));
       }).map((user) => (
        <tr key={user._id}>
         <td className="user-cell">
          <div className="user-info-with-avatar">
           <div className="user-avatar-p">
            <img 
             src={user.profileImage ? (user.profileImage.startsWith('http') || user.profileImage.startsWith('data:') ? user.profileImage : `/uploads/${user.profileImage}`) : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
             alt="" 
            />
           </div>
           <span className="user-name-bold">{user.name || 'Anonymous'}</span>
          </div>
         </td>
         <td className="email-cell">{maskEmail(user)}</td>
         <td className="phone-cell">{maskPhone(user.phone)}</td>
         <td>
          <span className="status-badge-premium deleted">DELETED</span>
         </td>
         <td className="action-cell">
          <div className="action-buttons-group">
           <button className="action-btn-p restore" title="Restore" onClick={() => handleRestore(user._id)}>
            <RotateCcw size={14} strokeWidth={3} />
           </button>
           <button className="action-btn-p delete-p" title="Permanently Delete" onClick={() => openDeleteModal(user._id)}>
            <Trash2 size={14} />
           </button>
          </div>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    )}
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .users-list-container { padding: 25px 30px; animation: fadeIn 0.4s ease-out; }
    .users-filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; gap: 20px; }
    .left-filters { display: flex; align-items: center; gap: 15px; flex: 1; }
    
    .search-wrapper-premium { position: relative; flex: 1; max-width: 400px; }
    .search-wrapper-premium input { width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 10px 15px 10px 40px; color: #fff; border-radius: 30px; outline: none; font-size: 0.9rem; }
    .search-icon-premium { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #666; }

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
    .user-avatar-p { width: 35px; height: 35px; border-radius: 50%; overflow: hidden; background: #222; border: 1px solid #333; }
    .user-avatar-p img { width: 100%; height: 100%; object-fit: cover; }
    .email-cell { font-family: monospace; font-size: 0.85rem; color: #888; }
    .phone-cell { color: #888; font-size: 0.85rem; }

    .status-badge-premium { padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .status-badge-premium.deleted { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.2); }

    .action-cell { width: 150px; }
    .action-buttons-group { display: flex; gap: 8px; }
    .action-btn-p { width: 32px; height: 32px; border-radius: 4px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; transition: transform 0.2s; }
    .action-btn-p.restore { background: #b3d332; }
    .action-btn-p.delete-p { background: #ff4d4d; }
    .action-btn-p:hover { transform: scale(1.1); }

    .empty-state-v { padding: 50px; text-align: center; color: #444; display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 25px 50px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    .loader-container { height: 40vh; display: flex; align-items: center; justify-content: center; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Modal Styles - Premium Centered */
    .modal-overlay-p { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(5px); animation: fadeIn 0.3s ease; }
    .modal-content-p { background: #111; border: 1px solid #222; border-radius: 16px; padding: 40px; width: 100%; max-width: 450px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,1); animation: modalSlide 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .modal-icon-p { width: 80px; height: 80px; background: rgba(255, 77, 77, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; }
    .modal-content-p h2 { font-size: 1.8rem; margin-bottom: 15px; color: #fff; font-weight: 800; }
    .modal-content-p p { color: #888; font-size: 1rem; line-height: 1.6; margin-bottom: 35px; }
    .modal-actions-p { display: flex; gap: 15px; justify-content: center; }
    .cancel-btn-p { background: #222; color: #fff; border: 1px solid #333; padding: 12px 30px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    .confirm-btn-p.delete { background: #ff4d4d; color: #fff; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3); }
    .confirm-btn-p.delete:hover { background: #ff1f1f; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 77, 77, 0.4); }
    .cancel-btn-p:hover { background: #333; }
    @keyframes modalSlide { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
   ` }} />
  </div>
 );
};

export default DeletedUsers;
