import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Shield, Edit2, CheckCircle2, XCircle, Loader2, Camera, Bookmark, LogOut, CreditCard, FileText, Calendar, Download, Eye } from 'lucide-react';
import Loader from '../components/Loader';
import FrontendLayout from '../components/FrontendLayout';
import { logoutUser } from '../utils/logout';

const FrontendProfile = () => {
 const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
 const [formData, setFormData] = useState({
  name: user.name || '',
  email: user.email || '',
  phone: user.phone || '',
  password: ''
 });
 const [profileImage, setProfileImage] = useState(null);
 const [previewUrl, setPreviewUrl] = useState(
  user.profileImage 
   ? (user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5001/uploads/${user.profileImage}`)
   : null
 );
 const [loading, setLoading] = useState(false);
 const [notification, setNotification] = useState(null);
 const [isEditing, setIsEditing] = useState(false);
 const [activeTab, setActiveTab] = useState('account');
 const [transactions, setTransactions] = useState([]);
 const [fullUser, setFullUser] = useState(null);
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 5;
 const [selectedTransaction, setSelectedTransaction] = useState(null);

 useEffect(() => {
  const fetchUserData = async () => {
   try {
    const res = await fetch(`http://localhost:5001/api/users/${user.id}`);
    const data = await res.json();
    setFullUser(data);
    
    // Update localStorage so other pages (like Video Details) know the user is upgraded!
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data, id: data._id }));
    
    const transRes = await fetch(`http://localhost:5001/api/user/transactions/${user.email}`);
    const transData = await transRes.json();
    setTransactions(transData);
   } catch (err) {
    console.error('Error fetching dashboard data:', err);
   }
  };
  fetchUserData();
 }, [user.id, user.email]);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleInputChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
   setProfileImage(file);
   setPreviewUrl(URL.createObjectURL(file));
  }
 };

 const handleSave = async (e) => {
  e.preventDefault();
  setLoading(true);

  const data = new FormData();
  data.append('name', formData.name);
  data.append('email', formData.email);
  data.append('phone', formData.phone);
  if (formData.password) data.append('password', formData.password);
  if (profileImage) data.append('profileImage', profileImage);

  try {
   const response = await fetch(`http://localhost:5001/api/users/${user.id}`, {
    method: 'PUT',
    body: data
   });

   if (response.ok) {
    const updatedUser = await response.json();
    const newUserObj = {
     id: updatedUser._id,
     name: updatedUser.name,
     email: updatedUser.email,
     role: updatedUser.role,
     profileImage: updatedUser.profileImage,
     phone: updatedUser.phone,
     status: updatedUser.status,
     subscriptionPlan: updatedUser.subscriptionPlan,
     expiryDate: updatedUser.expiryDate
    };
    localStorage.setItem('user', JSON.stringify(newUserObj));
    setUser(newUserObj);
    setIsEditing(false);
    showNotification('Profile updated successfully!');
    window.dispatchEvent(new Event('profileUpdate'));
   } else {
    const err = await response.json();
    showNotification(err.message || 'Update failed', 'error');
   }
  } catch (err) {
   console.error('Error updating profile:', err);
   showNotification('Connection error', 'error');
  } finally {
   setLoading(false);
  }
 };

 const handleLogout = () => {
  logoutUser();
 };

 return (
  <FrontendLayout isTransparent={true}>
   <div className="fe-profile-page-v">
    {notification && (
     <div className={`fe-watchlist-notification-v ${notification.type}`}>
      <div className="note-content-v">
       {notification.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
       <span>{notification.message}</span>
      </div>
     </div>
    )}

    <div className="fe-profile-container-v">
     <div className="fe-profile-sidebar-v">
      <div className="fe-profile-avatar-v">
       <div className="avatar-wrapper-v">
        {previewUrl ? (
         <img src={previewUrl} alt="User" />
        ) : (
         <div className="avatar-placeholder-v"><User size={60} /></div>
        )}
        {isEditing && (
         <label className="avatar-upload-v">
          <Camera size={20} />
          <input type="file" hidden onChange={handleImageChange} accept="image/*" />
         </label>
        )}
       </div>
       <h3>{user.name}</h3>
      </div>

      <div className="fe-profile-nav-v">
       <button className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')}><User size={18} /> Account Info</button>
       <button className={activeTab === 'subscription' ? 'active' : ''} onClick={() => setActiveTab('subscription')}><CreditCard size={18} /> Subscription</button>
       <button className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}><FileText size={18} /> Billing History</button>
       <button onClick={() => window.location.href = '/watchlist'}><Bookmark size={18} /> My Watchlist</button>
       <button className="logout-v" onClick={handleLogout}><LogOut size={18} /> Logout</button>
      </div>
     </div>

     <div className="fe-profile-content-v">
      {activeTab === 'account' && (
       <>
        <div className="content-header-v">
         <h2>Account Settings</h2>
         {!isEditing && (
          <button className="edit-toggle-v" onClick={() => setIsEditing(true)}>
           <Edit2 size={16} /> Edit Profile
          </button>
         )}
        </div>

        <form onSubmit={handleSave} className="fe-profile-form-v">
         <div className="form-grid-v">
          <div className="form-group-v">
           <label><User size={16} /> Full Name</label>
           <input 
            type="text" 
            name="name"
            value={formData.name} 
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="Enter your name"
           />
          </div>
          <div className="form-group-v">
           <label><Mail size={16} /> Email Address</label>
           <input 
            type="email" 
            name="email"
            value={formData.email} 
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="Enter your email"
           />
          </div>
          <div className="form-group-v">
           <label><Phone size={16} /> Phone Number</label>
           <input 
            type="text" 
            name="phone"
            value={formData.phone} 
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="Enter your phone"
           />
          </div>
          {isEditing && (
           <div className="form-group-v full-v">
            <label>Change Password</label>
            <input 
             type="password" 
             name="password"
             value={formData.password} 
             onChange={handleInputChange}
             placeholder="Leave blank to keep current password"
            />
           </div>
          )}
         </div>

         {isEditing && (
          <div className="form-actions-v">
           <button type="button" className="cancel-btn-v" onClick={() => setIsEditing(false)}>Cancel</button>
           <button type="submit" className="save-btn-v" disabled={loading}>
            {loading ? (
             <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 className="spinner-v" size={18} /> Saving...
             </span>
            ) : 'Save Changes'}
           </button>
          </div>
         )}
        </form>
       </>
      )}

      {activeTab === 'subscription' && (
       <div className="fe-subscription-v">
        <div className="content-header-v">
         <h2>My Subscription</h2>
        </div>
        <div className="plan-card-premium-v">
         <div className="plan-badge-v">{fullUser?.subscriptionPlan || 'No Plan'}</div>
         <div className="plan-status-v">
          <span className="status-indicator-v active"></span>
          {fullUser?.status === 'Active' ? 'Active Subscription' : 'Inactive'}
         </div>
         <div className="plan-details-v">
          <div className="detail-item-v">
           <Calendar size={20} />
           <div>
            <label>Expires On</label>
            <span>{fullUser?.expiryDate || 'N/A'}</span>
           </div>
          </div>
          <div className="detail-item-v">
           <CreditCard size={20} />
           <div>
            <label>Payment Method</label>
            <span>Credit Card (Ending in 4242)</span>
           </div>
          </div>
         </div>
         <button 
          className="upgrade-btn-v" 
          onClick={() => window.location.href = '/subscription'}
         >
          Change / Upgrade Plan
         </button>
        </div>
       </div>
      )}

      {activeTab === 'billing' && (
       <div className="fe-billing-v">
        <div className="content-header-v">
         <h2>Billing History</h2>
        </div>
        <div className="invoice-table-v">
         {transactions.length > 0 ? (
           <>
            <table>
             <thead>
              <tr>
               <th>Time / Date</th>
               <th>Plan</th>
               <th>Amount</th>
               <th>Action</th>
              </tr>
             </thead>
             <tbody>
              {transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(tx => (
               <tr key={tx._id}>
                <td>{tx.paymentDate}</td>
                <td>{tx.plan}</td>
                <td>{tx.amount}</td>
                <td>
                 <button className="view-invoice-v" title="View Invoice" onClick={() => setSelectedTransaction(tx)}>
                  <Eye size={14} />
                 </button>
                </td>
               </tr>
              ))}
             </tbody>
            </table>
            
            {transactions.length > itemsPerPage && (
             <div className="fe-pagination-v">
              <button 
               disabled={currentPage === 1} 
               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
               Prev
              </button>
              <span>Page {currentPage} of {Math.ceil(transactions.length / itemsPerPage)}</span>
              <button 
               disabled={currentPage === Math.ceil(transactions.length / itemsPerPage)} 
               onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(transactions.length / itemsPerPage)))}
              >
               Next
              </button>
             </div>
            )}
           </>
         ) : (
          <div className="no-invoices-v">
           <FileText size={48} />
           <p>No billing records found.</p>
          </div>
         )}
        </div>
       </div>
      )}
     </div>
    </div>

    {selectedTransaction && (
     <div className="fe-invoice-modal-overlay-v" onClick={() => setSelectedTransaction(null)}>
      <div className="fe-invoice-modal-v" onClick={e => e.stopPropagation()}>
       <div className="modal-header-v">
        <h3>Invoice Details</h3>
        <button className="close-btn-v" onClick={() => setSelectedTransaction(null)}><XCircle size={24} /></button>
       </div>
       <div className="modal-body-v">
        <div className="invoice-detail-row-v">
         <span className="label-v">Transaction ID</span>
         <span className="value-v">{selectedTransaction.paymentId}</span>
        </div>
        <div className="invoice-detail-row-v">
         <span className="label-v">Date & Time</span>
         <span className="value-v">{selectedTransaction.paymentDate}</span>
        </div>
        <div className="invoice-detail-row-v">
         <span className="label-v">Email ID</span>
         <span className="value-v">{fullUser?.email || user.email}</span>
        </div>
        <div className="invoice-detail-row-v">
         <span className="label-v">Plan Name</span>
         <span className="value-v">{selectedTransaction.plan}</span>
        </div>
        <div className="invoice-detail-row-v">
         <span className="label-v">Expiry Date</span>
         <span className="value-v">{fullUser?.expiryDate || 'N/A'}</span>
        </div>
        <div className="invoice-detail-row-v">
         <span className="label-v">Amount Paid</span>
         <span className="value-v highlight-v">₹{selectedTransaction.amount}</span>
        </div>
        <div className="invoice-detail-row-v">
         <span className="label-v">Status</span>
         <span className="value-v status-v">{selectedTransaction.status || 'Completed'}</span>
        </div>
       </div>
       <div className="modal-footer-v">
        <button className="done-btn-v" onClick={() => setSelectedTransaction(null)}>Close</button>
       </div>
      </div>
     </div>
    )}

   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .fe-profile-page-v { min-height: 100vh; background: #050505; padding: 120px 5% 60px; color: #fff; }
    .fe-profile-container-v { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 320px 1fr; gap: 40px; }
    
    .fe-profile-sidebar-v { background: #0a0a0a; border: 1px solid #222; border-radius: 16px; padding: 40px 20px; height: fit-content; }
    .fe-profile-avatar-v { text-align: center; margin-bottom: 40px; }
    .avatar-wrapper-v { position: relative; width: 120px; height: 120px; margin: 0 auto 20px; }
    .avatar-wrapper-v img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #b3d332; }
    .avatar-placeholder-v { width: 100%; height: 100%; border-radius: 50%; background: #1a1a1a; display: flex; align-items: center; justify-content: center; color: #444; border: 3px solid #333; }
    .avatar-upload-v { position: absolute; bottom: 0; right: 0; background: #b3d332; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
    .avatar-upload-v:hover { transform: scale(1.1); }
    .fe-profile-avatar-v h3 { font-size: 1.4rem; font-weight: 800; margin: 0 0 5px 0; }
    .fe-profile-avatar-v p { font-size: 0.75rem; font-weight: 800; color: #b3d332; letter-spacing: 1.5px; }

    .fe-profile-nav-v { display: flex; flex-direction: column; gap: 10px; }
    .fe-profile-nav-v button { background: none; border: none; color: #888; display: flex; align-items: center; gap: 15px; padding: 15px 20px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: 0.3s; text-align: left; }
    .fe-profile-nav-v button:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .fe-profile-nav-v button.active { background: rgba(179,211,50,0.1); color: #b3d332; }
    .fe-profile-nav-v button.logout-v { color: #ff4d4d; margin-top: 20px; border-top: 1px solid #222; border-radius: 0; }
    .fe-profile-nav-v button.logout-v:hover { background: rgba(255,77,77,0.1); }

    .fe-profile-content-v { background: #0a0a0a; border: 1px solid #222; border-radius: 16px; padding: 40px; }
    .content-header-v { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .content-header-v h2 { font-size: 2rem; font-weight: 800; margin: 0; }
    .edit-toggle-v { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid #333; padding: 10px 20px; border-radius: 30px; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; }
    .edit-toggle-v:hover { background: #fff; color: #000; }

    .fe-profile-form-v .form-grid-v { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .form-group-v.full-v { grid-column: span 2; }
    .form-group-v label { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 700; color: #888; margin-bottom: 12px; }
    .form-group-v input { width: 100%; background: #111; border: 1px solid #222; padding: 15px 20px; border-radius: 12px; color: #fff; font-size: 1rem; font-weight: 600; transition: 0.3s; outline: none; }
    .form-group-v input:focus { border-color: #b3d332; background: #000; box-shadow: 0 0 20px rgba(179,211,50,0.1); }
    .form-group-v input:disabled { opacity: 0.6; cursor: not-allowed; }
    .readonly-v { color: #b3d332 !important; font-weight: 800 !important; }

    .form-actions-v { display: flex; justify-content: flex-end; gap: 20px; margin-top: 40px; padding-top: 30px; border-top: 1px solid #222; }
    .cancel-btn-v { background: none; border: 1px solid #333; color: #888; padding: 12px 30px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.3s; }
    .cancel-btn-v:hover { color: #fff; border-color: #555; }
    .save-btn-v { background: #b3d332; color: #fff; border: none; padding: 12px 40px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(179,211,50,0.2); }
    .save-btn-v:hover { transform: scale(1.05); background: #b3d332; box-shadow: 0 15px 30px rgba(179,211,50,0.4); }

    /* Subscription & Billing Tabs Styles */
    .plan-card-premium-v { background: #111; border: 1px solid #222; border-radius: 20px; padding: 40px; position: relative; overflow: hidden; }
    .plan-card-premium-v::before { content: ''; position: absolute; top: -50%; right: -20%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(179,211,50,0.1) 0%, transparent 70%); border-radius: 50%; }
    .plan-badge-v { font-size: 2.5rem; font-weight: 900; color: #fff; margin-bottom: 10px; }
    .plan-status-v { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.85rem; color: #b3d332; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 40px; }
    .status-indicator-v { width: 8px; height: 8px; border-radius: 50%; background: #b3d332; box-shadow: 0 0 10px #b3d332; }
    
    .plan-details-v { display: flex; flex-direction: column; gap: 25px; margin-bottom: 40px; }
    .detail-item-v { display: flex; align-items: center; gap: 20px; }
    .detail-item-v svg { color: #444; }
    .detail-item-v label { display: block; font-size: 0.75rem; font-weight: 700; color: #555; text-transform: uppercase; margin-bottom: 4px; }
    .detail-item-v span { font-size: 1.1rem; font-weight: 700; color: #fff; }
    
    .upgrade-btn-v { background: #fff; color: #000; border: none; padding: 15px 30px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: 0.3s; }
    .upgrade-btn-v:hover { background: #b3d332; color: #fff; transform: translateY(-3px); }

    .invoice-table-v { overflow-x: auto; }
    .invoice-table-v table { width: 100%; border-collapse: collapse; min-width: 600px; }
    .invoice-table-v th { text-align: left; padding: 15px 20px; border-bottom: 1px solid #222; color: #444; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; }
    .invoice-table-v td { padding: 20px; border-bottom: 1px solid #111; font-weight: 600; color: #aaa; }
    .invoice-table-v tr:hover td { background: #111; color: #fff; }
    .view-invoice-v { background: rgba(255,255,255,0.05); border: 1px solid #222; color: #fff; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
    .view-invoice-v:hover { background: #fff; color: #000; border-color: #fff; }
    
    .no-invoices-v p { margin-top: 15px; font-weight: 700; font-size: 1.1rem; }

    .fe-pagination-v { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #222; }
    .fe-pagination-v button { background: rgba(255,255,255,0.05); border: 1px solid #333; color: #fff; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.3s; }
    .fe-pagination-v button:hover:not(:disabled) { background: #b3d332; color: #000; border-color: #b3d332; }
    .fe-pagination-v button:disabled { opacity: 0.5; cursor: not-allowed; }
    .fe-pagination-v span { font-size: 0.9rem; font-weight: 700; color: #888; }

    .fe-invoice-modal-overlay-v { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease; }
    .fe-invoice-modal-v { background: #111; border: 1px solid #333; border-radius: 16px; width: 90%; max-width: 500px; padding: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .fe-invoice-modal-v .modal-header-v { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; padding-bottom: 20px; margin-bottom: 20px; }
    .fe-invoice-modal-v .modal-header-v h3 { font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0; }
    .fe-invoice-modal-v .close-btn-v { background: none; border: none; color: #888; cursor: pointer; transition: 0.3s; }
    .fe-invoice-modal-v .close-btn-v:hover { color: #ff4d4d; }
    .fe-invoice-modal-v .modal-body-v { display: flex; flex-direction: column; gap: 15px; }
    .invoice-detail-row-v { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #222; }
    .invoice-detail-row-v .label-v { color: #888; font-weight: 700; font-size: 0.9rem; }
    .invoice-detail-row-v .value-v { color: #fff; font-weight: 800; font-size: 1rem; }
    .invoice-detail-row-v .highlight-v { color: #b3d332; font-size: 1.2rem; }
    .invoice-detail-row-v .status-v { background: rgba(179,211,50,0.1); color: #b3d332; padding: 5px 12px; border-radius: 6px; font-size: 0.8rem; }
    .fe-invoice-modal-v .modal-footer-v { margin-top: 30px; text-align: center; }
    .fe-invoice-modal-v .done-btn-v { background: #fff; color: #000; border: none; padding: 12px 40px; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.3s; width: 100%; }
    .fe-invoice-modal-v .done-btn-v:hover { background: #b3d332; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .fe-watchlist-notification-v { 
     position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); 
     background: #b3d332; color: #fff; padding: 12px 25px; border-radius: 12px; 
     display: flex; align-items: center; gap: 20px; z-index: 10000; 
     font-weight: 800; box-shadow: 0 20px 40px rgba(0,0,0,0.5); 
     animation: noteSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
     border: 1px solid rgba(255,255,255,0.2);
    }
    .fe-watchlist-notification-v.error {
     background: #ff4d4d;
    }
    .note-content-v { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; }
    
    @keyframes noteSlideUp {
     from { transform: translate(-50%, 20px); opacity: 0; }
     to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    .spinner-v { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (max-width: 992px) {
     .fe-profile-container-v { grid-template-columns: 1fr; }
     .fe-profile-sidebar-v { position: relative; padding: 30px; }
     .fe-profile-nav-v { flex-direction: row; flex-wrap: wrap; justify-content: center; }
    }
    @media (max-width: 600px) {
     .fe-profile-form-v .form-grid-v { grid-template-columns: 1fr; }
     .form-group-v.full-v { grid-column: auto; }
     .content-header-v h2 { font-size: 1.5rem; }
     
     .invoice-table-v table { min-width: 100%; }
     .invoice-table-v th { padding: 10px; font-size: 0.65rem; }
     .invoice-table-v td { padding: 10px; font-size: 0.75rem; }
    }
   ` }} />
  </FrontendLayout>
 );
};

export default FrontendProfile;
