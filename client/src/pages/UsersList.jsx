import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Plus, 
 Search, 
 Eye, 
 Edit2, 
 X, 
 Download, 
 Upload,
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 Loader2,
 CheckCircle2,
 UserCheck,
 UserX,
 Trash2,
 XCircle,
 AlertTriangle
} from 'lucide-react';
import Loader from '../components/Loader';
import * as XLSX from 'xlsx';

const API_URL = '/api/users';

const UsersList = () => {
 const navigate = useNavigate();
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(false);
 const [notification, setNotification] = useState(null);
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedPlan, setSelectedPlan] = useState('');
 const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deletingId, setDeletingId] = useState(null);
 const fileInputRef = useRef(null);
 const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
 const [blockingUser, setBlockingUser] = useState(null);
 const [selectedUserIds, setSelectedUserIds] = useState([]);
 const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

 const plans = ['Basic Plan', 'Premium Plan', 'Platinum Plan', 'Diamond Plan'];
 const ITEMS_PER_PAGE = 10;
 const [currentPage, setCurrentPage] = useState(1);

 const fetchUsers = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   // Discovery: Filter for customer/subscriber roles (exclude admins from this list)
   setUsers(data.filter(u => (u.role === 'customer' || u.role === 'subscriber' || u.role === 'user') && !u.isDeleted));
   setSelectedUserIds([]); // Reset selection on fetch
  } catch (err) {
   console.error('Error fetching users:', err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchUsers();
 }, []);

 useEffect(() => {
  setCurrentPage(1);
 }, [searchTerm, selectedPlan]);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
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

 const confirmDelete = (id) => {
  setDeletingId(id);
  setIsDeleteModalOpen(true);
 };

 const executeDelete = async () => {
  try {
   const response = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
   if (response.ok) {
    setUsers(prev => prev.filter(u => u._id !== deletingId));
    setIsDeleteModalOpen(false);
    showNotification('User deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting user:', err);
  }
 };

 const filteredUsers = users.filter(user => {
  const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
             user.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const matchesPlan = !selectedPlan || user.subscriptionPlan === selectedPlan;
  return matchesSearch && matchesPlan;
 });

 const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
 const currentUsers = filteredUsers.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
 );

 const handleSelectAll = () => {
  const currentIds = currentUsers.map(u => u._id);
  const allSelected = currentIds.length > 0 && currentIds.every(id => selectedUserIds.includes(id));
  if (allSelected) {
   setSelectedUserIds(prev => prev.filter(id => !currentIds.includes(id)));
  } else {
   setSelectedUserIds(prev => {
    const newSelection = [...prev];
    currentIds.forEach(id => {
     if (!newSelection.includes(id)) {
      newSelection.push(id);
     }
    });
    return newSelection;
   });
  }
 };

 const handleSelectUser = (id) => {
  setSelectedUserIds(prev => {
   if (prev.includes(id)) {
    return prev.filter(x => x !== id);
   } else {
    return [...prev, id];
   }
  });
 };

 const executeBulkDelete = async () => {
  try {
   const response = await fetch(`${API_URL}/bulk-delete`, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids: selectedUserIds })
   });
   if (response.ok) {
    setUsers(prev => prev.filter(u => !selectedUserIds.includes(u._id)));
    setSelectedUserIds([]);
    setIsBulkDeleteModalOpen(false);
    showNotification('Selected users deleted successfully');
   } else {
    const resData = await response.json();
    showNotification(resData.message || 'Failed to delete selected users', 'error');
   }
  } catch (err) {
   console.error('Error during bulk delete:', err);
   showNotification('Connection error during bulk delete', 'error');
  }
 };

 const handleExport = async () => {
  setLoading(true);
  try {
   const transRes = await fetch('/api/transactions');
   const transactions = transRes.ok ? await transRes.json() : [];

   // Group transactions by user email (take the latest one for each user)
   const latestTxMap = {};
   transactions.forEach(tx => {
    if (tx.email) {
     const emailKey = tx.email.toLowerCase().trim();
     if (!latestTxMap[emailKey]) {
      latestTxMap[emailKey] = tx;
     }
    }
   });

   const dataToExport = users.map(user => {
    const userEmail = (user.email || '').toLowerCase().trim();
    const latestTx = latestTxMap[userEmail] || {};

    return {
     Name: user.name || 'N/A',
     Email: user.email,
     Password: user.password || '',
     'Auth Provider': user.authProvider || 'Email',
     Phone: user.phone || 'N/A',
     Status: user.status === 'Inactive' ? 'Blocked' : 'Active',
     'Subscription Plan': user.subscriptionPlan || 'Basic Plan',
     Amount: latestTx.amount !== undefined ? latestTx.amount : 'N/A',
     'Payment Gateway': latestTx.gateway || 'N/A',
     'Payment ID': latestTx.paymentId || 'N/A',
     'Payment Date': latestTx.paymentDate || 'N/A',
     'Expiry Date': user.expiryDate || 'N/A',
     Role: user.role,
     'Created At': new Date(user.createdAt).toLocaleDateString()
    };
   });

   const worksheet = XLSX.utils.json_to_sheet(dataToExport);
   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
   XLSX.writeFile(workbook, 'user.xlsx');
  } catch (err) {
   console.error('Error exporting users:', err);
   showNotification('Failed to export users', 'error');
  } finally {
   setLoading(false);
  }
 };

 const handleImport = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setLoading(true);
  const reader = new FileReader();
  reader.onload = async (evt) => {
   try {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const parsedData = XLSX.utils.sheet_to_json(sheet);

    if (parsedData.length === 0) {
     showNotification('No data found in the uploaded file', 'error');
     setLoading(false);
     return;
    }

    // Validate that at least one row has email/Email
    const hasEmail = parsedData.some(row => row.hasOwnProperty('Email') || row.hasOwnProperty('email'));
    if (!hasEmail) {
     showNotification('The uploaded file must contain an "Email" column', 'error');
     setLoading(false);
     return;
    }

    const response = await fetch('/api/users/import', {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json'
     },
     body: JSON.stringify({ users: parsedData })
    });

    const resData = await response.json();
    if (response.ok) {
     showNotification(
      `Import completed. Created: ${resData.importedCount}, Updated: ${resData.updatedCount}, Errors: ${resData.errorCount}`, 
      resData.errorCount > 0 ? 'error' : 'success'
     );
     fetchUsers();
    } else {
     showNotification(resData.message || 'Import failed', 'error');
    }
   } catch (err) {
    console.error('Error importing file:', err);
    showNotification('Failed to read or parse file', 'error');
   } finally {
    setLoading(false);
    e.target.value = null; // Clear input to allow re-upload
   }
  };

  reader.onerror = () => {
   showNotification('File reading failed', 'error');
   setLoading(false);
  };

  reader.readAsArrayBuffer(file);
 };

 const handleToggleStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  try {
   const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
     'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: newStatus })
   });

   if (response.ok) {
    setUsers(prev => prev.map(u => u._id === id ? { ...u, status: newStatus } : u));
    showNotification(`User has been ${newStatus === 'Inactive' ? 'blocked' : 'unblocked'} successfully`);
   } else {
    const resData = await response.json();
    showNotification(resData.message || `Failed to change user status`, 'error');
   }
  } catch (err) {
   console.error('Error toggling user status:', err);
   showNotification('Connection error', 'error');
  }
 };

 const confirmToggleStatus = (id, currentStatus) => {
  setBlockingUser({ id, currentStatus });
  setIsBlockModalOpen(true);
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
     <div className="custom-dropdown-container">
      <button 
       className="dropdown-trigger" 
       onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
      >
       <span>{selectedPlan || 'Filter by Plan'}</span>
       <ChevronDown size={14} className={isPlanDropdownOpen ? 'rotate' : ''} />
      </button>
      {isPlanDropdownOpen && (
       <div className="dropdown-menu-custom">
        <div className="menu-item" onClick={() => { setSelectedPlan(''); setIsPlanDropdownOpen(false); }}>Filter by Plan</div>
        {plans.map(plan => (
         <div 
          key={plan} 
          className="menu-item" 
          onClick={() => { setSelectedPlan(plan); setIsPlanDropdownOpen(false); }}
         >
          {plan}
         </div>
        ))}
       </div>
      )}
     </div>

     <div className="search-wrapper-premium">
      <input 
       type="text" 
       placeholder="Search by name or email..." 
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Search size={18} className="search-icon-premium" />
     </div>

     <button className="add-user-btn-premium" onClick={() => navigate('/admin/users/list/add')}>
      <Plus size={16} strokeWidth={3} />
      <span>Add User</span>
     </button>

     {selectedUserIds.length > 0 && (
      <button 
       className="bulk-delete-btn-premium" 
       onClick={() => setIsBulkDeleteModalOpen(true)}
       style={{
        background: '#ff4d4d',
        color: '#fff',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: '700',
        fontSize: '0.9rem',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.2s'
       }}
      >
       <Trash2 size={16} />
       <span>Delete Selected ({selectedUserIds.length})</span>
      </button>
     )}
    </div>

     <div className="header-right-actions">
      <input 
       type="file" 
       ref={fileInputRef} 
       onChange={handleImport} 
       accept=".xlsx,.xls,.csv" 
       style={{ display: 'none' }} 
      />
      <button className="import-users-btn" onClick={() => fileInputRef.current.click()}>
       <Upload size={16} />
       <span>Import Users</span>
      </button>
      <button className="export-users-btn" onClick={handleExport}>
       <Download size={16} />
       <span>Export Users</span>
      </button>
     </div>
   </div>

   {/* Users Table */}
   <div className="users-table-wrapper">
    {loading ? (
     <div className="loader-container"><Loader size="small" inline={true} /></div>
    ) : (
     <table className="users-data-table">
      <thead>
       <tr>
        <th style={{ width: '40px', textAlign: 'center' }}>
         <input 
          type="checkbox" 
          checked={currentUsers.length > 0 && currentUsers.every(u => selectedUserIds.includes(u._id))}
          onChange={handleSelectAll}
          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
         />
        </th>
        <th>User</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Role</th>
        <th>Status</th>
        <th>Action</th>
       </tr>
      </thead>
      <tbody>
       {currentUsers.map((user) => (
        <tr key={user._id} className={selectedUserIds.includes(user._id) ? 'selected-row-premium' : ''}>
         <td style={{ textAlign: 'center' }}>
          <input 
           type="checkbox" 
           checked={selectedUserIds.includes(user._id)}
           onChange={() => handleSelectUser(user._id)}
           style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
          />
         </td>
         <td className="user-cell">
          <div className="user-info-with-avatar">
           <div className="user-avatar-p">
            <img 
             src={user.profileImage ? (user.profileImage.startsWith('http') || user.profileImage.startsWith('data:') ? user.profileImage : `/uploads/${user.profileImage}`) : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
             alt="" 
            />
           </div>
           <span className="user-name-bold">{user.name || 'John Doe'}</span>
          </div>
         </td>
         <td className="email-cell">{maskEmail(user)}</td>
         <td className="phone-cell">{maskPhone(user.phone)}</td>
         <td>
          <span className={`role-badge-premium ${user.role || 'customer'}`}>
           {user.role === 'subscriber' ? 'Premium' : user.role === 'customer' ? 'Customer' : 'User'}
          </span>
         </td>
         <td>
          <span className={`status-badge-premium ${user.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
           {user.status || 'Active'}
          </span>
         </td>
         <td className="action-cell">
          <div className="action-buttons-group">
           <button className="action-btn-p view" title="User History" onClick={() => navigate(`/admin/users/history/${user._id}`)}><Eye size={14} /></button>
           <button className="action-btn-p edit" onClick={() => navigate(`/admin/users/list/edit/${user._id}`)}><Edit2 size={14} /></button>
           <button 
            className={`action-btn-p ${user.status === 'Inactive' ? 'unblock-btn' : 'block-btn'}`} 
            title={user.status === 'Inactive' ? 'Unblock User' : 'Block User'} 
            onClick={() => confirmToggleStatus(user._id, user.status || 'Active')}
           >
            {user.status === 'Inactive' ? <UserCheck size={14} /> : <UserX size={14} />}
           </button>
           <button className="action-btn-p delete" title="Delete" onClick={() => confirmDelete(user._id)}><Trash2 size={14} /></button>
          </div>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    )}
   </div>

   {totalPages > 1 && (
    <div className="pagination-v">
     <button 
      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
      disabled={currentPage === 1}
      className="pag-btn-v"
     >
      <ChevronLeft size={16} />
     </button>
     
     {(() => {
      const pages = [];
      let last = 0;
      for (let i = 1; i <= totalPages; i++) {
       if (i === 1 || i === totalPages || i === currentPage || (i >= currentPage - 1 && i <= currentPage + 1)) {
        if (last && i - last > 1) pages.push('...' + i);
        pages.push(i);
        last = i;
       }
      }
      return pages.map((page) => {
       if (typeof page === 'string') {
        return <span key={page} className="pag-ellipsis-v">…</span>;
       }
       return (
        <button 
         key={page} 
         onClick={() => setCurrentPage(page)} 
         className={`pag-btn-v ${currentPage === page ? 'active' : ''}`}
        >
         {page}
        </button>
       );
      });
     })()}

     <button 
      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
      disabled={currentPage === totalPages}
      className="pag-btn-v"
     >
      <ChevronRight size={16} />
     </button>
    </div>
   )}

    {/* Delete Confirmation Modal */}
    {isDeleteModalOpen && (
     <div className="modal-overlay-p">
      <div className="modal-content-p delete">
       <div className="modal-icon-p">
        <Trash2 size={40} color="#ff4d4d" />
       </div>
       <h2>Move to Recycle Bin?</h2>
       <p>Are you sure you want to delete this user? You can restore them later from the Deleted Users section.</p>
       <div className="modal-actions-p">
        <button className="cancel-btn-p" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
        <button className="confirm-btn-p delete" onClick={executeDelete}>Move to Recycle Bin</button>
       </div>
      </div>
     </div>
    )}

    {/* Bulk Delete Confirmation Modal */}
    {isBulkDeleteModalOpen && (
     <div className="modal-overlay-p">
      <div className="modal-content-p delete">
       <div className="modal-icon-p">
        <Trash2 size={40} color="#ff4d4d" />
       </div>
       <h2>Move {selectedUserIds.length} Users to Recycle Bin?</h2>
       <p>Are you sure you want to delete the {selectedUserIds.length} selected users? You can restore them later from the Deleted Users section.</p>
       <div className="modal-actions-p">
        <button className="cancel-btn-p" onClick={() => setIsBulkDeleteModalOpen(false)}>Cancel</button>
        <button className="confirm-btn-p delete" onClick={executeBulkDelete}>Move to Recycle Bin</button>
       </div>
      </div>
     </div>
    )}

    {/* Block/Unblock Confirmation Modal */}
    {isBlockModalOpen && blockingUser && (
     <div className="modal-overlay-p">
      <div className="modal-content-p">
       <div className="modal-icon-p" style={{ backgroundColor: blockingUser.currentStatus === 'Inactive' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(230, 126, 34, 0.1)' }}>
        {blockingUser.currentStatus === 'Inactive' ? (
         <UserCheck size={40} color="#2ecc71" />
        ) : (
         <UserX size={40} color="#e67e22" />
        )}
       </div>
       <h2>{blockingUser.currentStatus === 'Inactive' ? 'Unblock User?' : 'Block User?'}</h2>
       <p>
        Are you sure you want to {blockingUser.currentStatus === 'Inactive' ? 'unblock' : 'block'} this user?
        {blockingUser.currentStatus === 'Inactive' ? ' They will regain full access to the application immediately.' : ' They will be prevented from logging in or using the app.'}
       </p>
       <div className="modal-actions-p">
        <button className="cancel-btn-p" onClick={() => setIsBlockModalOpen(false)}>Cancel</button>
        <button 
         className={`confirm-btn-p ${blockingUser.currentStatus === 'Inactive' ? 'unblock-confirm' : 'block-confirm'}`}
         onClick={() => {
          handleToggleStatus(blockingUser.id, blockingUser.currentStatus);
          setIsBlockModalOpen(false);
         }}
        >
         {blockingUser.currentStatus === 'Inactive' ? 'Unblock User' : 'Block User'}
        </button>
       </div>
      </div>
     </div>
    )}

   <style dangerouslySetInnerHTML={{ __html: `
    .users-list-container { padding: 25px 30px; animation: fadeIn 0.4s ease-out; width: 100%; box-sizing: border-box; }
    
    /* Filter Bar Styling */
    .users-filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; gap: 14px; flex-wrap: wrap; width: 100%; box-sizing: border-box; }
    .left-filters { display: flex; align-items: center; gap: 12px; flex: 1; flex-wrap: wrap; min-width: 0; }
    .header-right-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
    
    .custom-dropdown-container { position: relative; width: 180px; flex-shrink: 0; }
    .dropdown-trigger { width: 100%; height: 42px; background: #1a1a1a; border: 1px solid #333; color: #aaa; padding: 0 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 0.9rem; box-sizing: border-box; }
    .dropdown-trigger .rotate { transform: rotate(180deg); }
    .dropdown-menu-custom { position: absolute; top: 100%; left: 0; width: 100%; background: #1a1a1a; border: 1px solid #333; border-radius: 6px; margin-top: 5px; z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; }
    .menu-item { padding: 10px 15px; color: #eee; font-size: 0.85rem; cursor: pointer; transition: background 0.2s; }
    .menu-item:hover { background: #222; color: #fff; }

    .search-wrapper-premium { position: relative; flex: 1; min-width: 0; }
    .search-wrapper-premium input { width: 100%; height: 42px; background: #1a1a1a; border: 1px solid #333; padding: 0 15px 0 40px; color: #fff; border-radius: 30px; outline: none; font-size: 0.9rem; box-sizing: border-box; }
    .search-icon-premium { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #666; pointer-events: none; }

    .add-user-btn-premium, .import-users-btn, .export-users-btn { 
     height: 42px;
     padding: 0 16px;
     border-radius: 8px;
     display: flex;
     align-items: center;
     justify-content: center;
     gap: 8px;
     font-weight: 800;
     font-size: 0.88rem;
     cursor: pointer;
     box-sizing: border-box;
     transition: all 0.2s ease;
     white-space: nowrap;
     flex-shrink: 0;
    }
    .add-user-btn-premium { background: #b3d332 !important; color: #000000 !important; border: 1px solid #b3d332; }
    .add-user-btn-premium * { color: #000000 !important; }
    .import-users-btn { background: #2e7d32; color: #fff; border: 1px solid #2e7d32; }
    .export-users-btn { background: #0088ff; color: #fff; border: 1px solid #0088ff; }

    /* Table Styling */
    .users-table-wrapper { background: #111; border-radius: 8px; border: 1px solid #222; overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; display: block; box-sizing: border-box; }
    .users-data-table { border-collapse: collapse; text-align: left; width: max-content; min-width: 100%; }
    .users-data-table th { padding: 12px 14px; border-bottom: 1px solid #333; border-right: 1px solid #222; color: #eee; font-size: 0.85rem; font-weight: 700; background: #161616; white-space: nowrap; }
    .users-data-table th:last-child { border-right: none; }
    .users-data-table td { padding: 12px 14px; border-bottom: 1px solid #222; border-right: 1px solid #1a1a1a; color: #aaa; font-size: 0.85rem; white-space: nowrap; }
    .users-data-table td:last-child { border-right: none; }
    .users-data-table tr:hover { background: #151515; }

    .user-name-bold { color: #fff; font-weight: 700; font-size: 0.9rem; }
    .user-info-with-avatar { display: flex; align-items: center; gap: 10px; }
    .user-avatar-p { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; background: #222; border: 1px solid #333; flex-shrink: 0; }
    .user-avatar-p img { width: 100%; height: 100%; object-fit: cover; }
    .email-cell { font-family: monospace; font-size: 0.82rem; color: #888; }
    .phone-cell { color: #888; font-size: 0.82rem; }

    .status-badge-premium { padding: 4px 10px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
    .status-badge-premium.active { background: #b3d332; color: #000; }
    .status-badge-premium.inactive { background: #ff4d4d; color: #fff; }

    .role-badge-premium { padding: 4px 8px; border-radius: 4px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; display: inline-block; }
    .role-badge-premium.customer { background: #333; color: #aaa; border: 1px solid #444; }
    .role-badge-premium.subscriber { background: rgba(0, 136, 255, 0.2); color: #0088ff; border: 1px solid rgba(0, 136, 255, 0.3); }
    .role-badge-premium.user { background: #222; color: #888; }

    .action-cell { width: 150px; }
    .action-buttons-group { display: flex; gap: 6px; }
    .action-btn-p { width: 30px; height: 30px; border-radius: 4px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; transition: transform 0.2s; }
    .action-btn-p.view { background: #b3d332; color: #000; }
    .action-btn-p.edit { background: #b3d332; color: #000; }
    .action-btn-p.block-btn { background: #e67e22; }
    .action-btn-p.unblock-btn { background: #2ecc71; }
    .action-btn-p.delete { background: #ff4d4d; }
    .action-btn-p:hover { transform: scale(1.1); }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.3s; }
    .delete-modal-content-premium { background: #1a1a1a; width: 90%; max-width: 450px; padding: 40px; border-radius: 24px; text-align: center; border: 1px solid #333; box-shadow: 0 20px 60px rgba(0,0,0,0.8); }
    .delete-icon-wrapper-alt { margin-bottom: 20px; display: flex; justify-content: center; }
    .delete-modal-content-premium h2 { color: #fff; margin-bottom: 10px; font-size: 1.8rem; font-weight: 700; }
    .delete-modal-content-premium p { color: #aaa; margin-bottom: 30px; font-size: 1rem; line-height: 1.5; }
    .delete-modal-footer-alt { display: flex; gap: 15px; justify-content: center; }
    .cancel-btn-alt { background: #333; color: #fff; border: none; padding: 12px 35px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 1rem; }
    .confirm-btn-alt { background: #ff4d4d; color: #fff; border: none; padding: 12px 35px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 1rem; }

    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 25px 50px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    .loader-container { height: 40vh; display: flex; align-items: center; justify-content: center; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-overlay-p { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(5px); animation: fadeIn 0.3s ease; }
    .modal-content-p { background: #111; border: 1px solid #222; border-radius: 16px; padding: 40px; width: 100%; max-width: 450px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,1); animation: modalSlide 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .modal-icon-p { width: 80px; height: 80px; background: rgba(255, 77, 77, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; }
    .modal-content-p h2 { font-size: 1.8rem; margin-bottom: 15px; color: #fff; font-weight: 800; }
    .modal-content-p p { color: #888; font-size: 1rem; line-height: 1.6; margin-bottom: 35px; }
    .modal-actions-p { display: flex; gap: 15px; justify-content: center; }
    .cancel-btn-p { background: #222; color: #fff; border: 1px solid #333; padding: 12px 30px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    .confirm-btn-p.delete { background: #ff4d4d; color: #fff; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3); }
    .confirm-btn-p.delete:hover { background: #ff1f1f; transform: translateY(-2px); }
    .confirm-btn-p.block-confirm { background: #e67e22; color: #fff; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    .confirm-btn-p.block-confirm:hover { background: #d35400; transform: translateY(-2px); }
    .confirm-btn-p.unblock-confirm { background: #2ecc71; color: #fff; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    .confirm-btn-p.unblock-confirm:hover { background: #27ae60; transform: translateY(-2px); }
    .cancel-btn-p:hover { background: #333; }
    @keyframes modalSlide { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .selected-row-premium { background: #171810 !important; }
    .bulk-delete-btn-premium:hover { background: #ff3333 !important; transform: translateY(-1px); }

    .pagination-v { display: flex; gap: 5px; margin-top: 20px; background: #111; padding: 5px; border-radius: 6px; width: fit-content; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .pag-btn-v { background: #222; border: none; color: #fff; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer; font-weight: 700; transition: all 0.2s; flex-shrink: 0; }
    .pag-btn-v:hover { background: #333; }
    .pag-btn-v.active { background: #b3d332; color: #000; }
    .pag-btn-v:disabled { opacity: 0.3; cursor: not-allowed; }
    .pag-ellipsis-v { display: flex; align-items: center; justify-content: center; width: 30px; height: 35px; color: #666; font-size: 1rem; flex-shrink: 0; }

    @media (max-width: 768px) {
     .users-list-container { padding: 15px 12px 60px; box-sizing: border-box; overflow-x: auto; -webkit-overflow-scrolling: touch; }
     .users-filter-bar { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; min-width: max-content; padding-bottom: 4px; }
     .left-filters { flex-wrap: nowrap; min-width: max-content; }
     .users-table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    }
   ` }} />
  </div>
 );
};

export default UsersList;
