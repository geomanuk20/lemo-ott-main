import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Plus, 
 Edit2, 
 X, 
 CheckCircle2, 
 XCircle,
 Timer
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/coupons';

// Helper: compute time remaining string from an expiryDate string ("YYYY-MM-DD")
const getTimeRemaining = (expiryDateStr) => {
 if (!expiryDateStr) return { text: 'No Expiry', expired: false };
 // End of expiry day: 23:59:59 local time
 const expiry = new Date(`${expiryDateStr}T23:59:59`);
 const now = new Date();
 const diffMs = expiry - now;
 if (diffMs <= 0) return { text: 'Expired', expired: true };
 const totalSec = Math.floor(diffMs / 1000);
 const days = Math.floor(totalSec / 86400);
 const hrs = Math.floor((totalSec % 86400) / 3600);
 const mins = Math.floor((totalSec % 3600) / 60);
 const secs = totalSec % 60;
 if (days > 0) return { text: `${days}d ${hrs}h ${mins}m ${secs}s`, expired: false };
 if (hrs > 0) return { text: `${hrs}h ${mins}m ${secs}s`, expired: false };
 return { text: `${mins}m ${secs}s`, expired: false, urgent: hrs === 0 && days === 0 };
};

// Timer display component — ticks every second using refs to avoid parent re-render
const CouponTimer = ({ expiryDate, usersAllow, couponUsed }) => {
 const [display, setDisplay] = useState(() => {
  if (couponUsed !== undefined && usersAllow !== undefined && couponUsed >= usersAllow) {
   return { text: 'Limit Reached', expired: true };
  }
  return getTimeRemaining(expiryDate);
 });

 useEffect(() => {
  if (couponUsed !== undefined && usersAllow !== undefined && couponUsed >= usersAllow) {
   setDisplay({ text: 'Limit Reached', expired: true });
   return;
  }
  const interval = setInterval(() => {
   setDisplay(getTimeRemaining(expiryDate));
  }, 1000);
  return () => clearInterval(interval);
 }, [expiryDate, couponUsed, usersAllow]);

 const urgent = !display.expired && display.text.startsWith('0m') || (!display.text.includes('d') && !display.text.includes('h') && !display.expired);

 return (
  <span style={{
   display: 'inline-flex',
   alignItems: 'center',
   gap: '5px',
   fontWeight: 700,
   fontSize: '0.82rem',
   fontFamily: 'monospace',
   color: display.expired ? '#ff4d4d' : (display.text.includes('Limit') ? '#ff9800' : (display.text.includes('d') ? '#b3d332' : (display.text.includes('h') ? '#ffd700' : '#ff9800'))),
  }}>
   {!display.expired && <Timer size={12} />}
   {display.text}
  </span>
 );
};

const Coupons = () => {
 const navigate = useNavigate();
 const [coupons, setCoupons] = useState([]);
 const [loading, setLoading] = useState(true);
 const [notification, setNotification] = useState(null);
 const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

 useEffect(() => {
  fetchCoupons();
 }, []);

 const fetchCoupons = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setCoupons(data);
  } catch (err) {
   console.error('Error fetching coupons:', err);
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
    setCoupons(coupons.filter(c => c._id !== id));
    showNotification('Coupon deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting coupon:', err);
   showNotification('Error deleting coupon', 'error');
  } finally {
   setDeleteModal({ show: false, id: null });
  }
 };

 // Quick-toggle showOnFrontend without navigating to edit page
 const handleToggleFrontend = async (coupon) => {
  const newVal = coupon.showOnFrontend === 'OFF' ? 'ON' : 'OFF';
  try {
   const response = await fetch(`${API_URL}/${coupon._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...coupon, showOnFrontend: newVal })
   });
   if (response.ok) {
    setCoupons(coupons.map(c => c._id === coupon._id ? { ...c, showOnFrontend: newVal } : c));
    showNotification(`Coupon ${newVal === 'ON' ? 'shown on' : 'hidden from'} frontend`);
   }
  } catch (err) {
   showNotification('Error updating coupon visibility', 'error');
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
      <p>You are about to permanently delete this coupon. This action cannot be undone.</p>
      <div className="modal-actions-p">
       <button className="cancel-btn-p" onClick={() => setDeleteModal({ show: false, id: null })}>Cancel</button>
       <button className="confirm-btn-p" onClick={handleDelete}>Delete Coupon</button>
      </div>
     </div>
    </div>
   )}

   <div className="content-area-p">
    <button className="add-plan-btn" onClick={() => navigate('/admin/coupons/add')}>
     <Plus size={18} strokeWidth={3} />
     <span>Add Coupon</span>
    </button>

    <div className="table-container-p">
     <table className="premium-table-v">
      <thead>
       <tr>
        <th>Coupon Code</th>
        <th>Percentage</th>
        <th>Users Allow</th>
        <th>Used</th>
        <th>Expiry Date</th>
        <th>Timer to Invalid</th>
        <th>Status</th>
        <th>Show on Frontend</th>
        <th>Action</th>
       </tr>
      </thead>
      <tbody>
       {loading ? (
        <tr>
         <td colSpan="9" className="loader-cell">
          <Loader size="small" inline={true} />
         </td>
        </tr>
       ) : coupons.length === 0 ? (
        <tr>
         <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No coupons found. Click "Add Coupon" to create one.
         </td>
        </tr>
       ) : (
        coupons.map((coupon) => (
         <tr key={coupon._id}>
          <td className="bold-text">{coupon.couponCode}</td>
          <td className="bold-text">{coupon.couponPercentage}%</td>
          <td>{coupon.usersAllow}</td>
          <td>{coupon.couponUsed}</td>
          <td>{coupon.expiryDate}</td>
          <td>
           <CouponTimer
            expiryDate={coupon.expiryDate}
            usersAllow={coupon.usersAllow}
            couponUsed={coupon.couponUsed}
           />
          </td>
          <td>
           <span className={`badge-p status-active ${coupon.status === 'Active' ? '' : 'inactive'}`}>
            {coupon.status}
           </span>
          </td>
          <td>
           <button
            className={`frontend-toggle-btn ${coupon.showOnFrontend === 'OFF' ? 'toggle-off' : 'toggle-on'}`}
            onClick={() => handleToggleFrontend(coupon)}
            title="Click to toggle frontend visibility"
           >
            {coupon.showOnFrontend === 'OFF' ? 'OFF' : 'ON'}
           </button>
          </td>
          <td>
           <div className="action-btns-p">
            <button className="edit-btn-v" onClick={() => navigate(`/admin/coupons/edit/${coupon._id}`)}>
             <Edit2 size={14} />
            </button>
            <button className="delete-btn-v" onClick={() => confirmDelete(coupon._id)}>
             <X size={14} />
            </button>
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
    .premium-delete-modal-p { background: #111; border: 1px solid #333; border-radius: 20px; padding: 40px; max-width: 450px; width: 90%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.8); animation: scaleUpModal 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .modal-icon-p { margin-bottom: 20px; animation: bounceIcon 0.6s ease; }
    .premium-delete-modal-p h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: 15px; color: #fff; }
    .premium-delete-modal-p p { color: #888; line-height: 1.6; margin-bottom: 30px; }
    .modal-actions-p { display: flex; gap: 15px; justify-content: center; }
    .cancel-btn-p { background: #222; color: #fff; border: 1px solid #333; padding: 12px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .cancel-btn-p:hover { background: #333; }
    .confirm-btn-p { background: #ff4d4d; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(255,77,77,0.3); }
    .confirm-btn-p:hover { background: #ff1a1a; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,77,77,0.4); }

    @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUpModal { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes bounceIcon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

    .content-area-p { padding: 30px; }
    .add-plan-btn { background: #b3d332; color: #fff; border: none; padding: 10px 18px; border-radius: 4px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; margin-bottom: 25px; transition: background 0.3s; }
    .add-plan-btn:hover { background: #14b072; }

    .table-container-p { background: #0a0a0a; border: 1px solid #222; border-radius: 4px; overflow: auto; }
    .premium-table-v { width: 100%; border-collapse: collapse; text-align: left; border: 1px solid #222; min-width: 1100px; }
    .premium-table-v th { background: #151515; padding: 15px 16px; font-size: 0.85rem; font-weight: 700; color: #eee; border-bottom: 1px solid #333; border-right: 1px solid #222; white-space: nowrap; }
    .premium-table-v th:last-child { border-right: none; }
    .premium-table-v td { padding: 14px 16px; font-size: 0.88rem; color: #aaa; border-bottom: 1px solid #1a1a1a; border-right: 1px solid #222; vertical-align: middle; white-space: nowrap; }
    .premium-table-v td:last-child { border-right: none; }
    .premium-table-v tr:hover { background: #111; }
    
    .bold-text { color: #fff; font-weight: 700; }

    .badge-p { padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
    .badge-p.status-active { background: #b3d332; color: #fff; }
    .badge-p.status-active.inactive { background: #ff4d4d; }

    /* Frontend Toggle Button */
    .frontend-toggle-btn { border: none; border-radius: 20px; padding: 4px 16px; font-size: 0.78rem; font-weight: 800; cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px; }
    .frontend-toggle-btn.toggle-on { background: rgba(179,211,50,0.15); color: #b3d332; border: 1px solid #b3d332; }
    .frontend-toggle-btn.toggle-on:hover { background: rgba(179,211,50,0.25); transform: scale(1.04); }
    .frontend-toggle-btn.toggle-off { background: rgba(255,77,77,0.1); color: #ff4d4d; border: 1px solid #ff4d4d; }
    .frontend-toggle-btn.toggle-off:hover { background: rgba(255,77,77,0.2); transform: scale(1.04); }

    .action-btns-p { display: flex; gap: 8px; }
    .edit-btn-v { background: #b3d332; color: #fff; border: none; width: 30px; height: 30px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .delete-btn-v { background: #ff4d4d; color: #fff; border: none; width: 30px; height: 30px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    
    .footer-p { margin-top: 50px; text-align: center; color: #666; font-size: 0.85rem; padding: 20px; border-top: 1px solid #111; }
    .footer-p a { color: #0088ff; text-decoration: none; font-weight: 700; }

    .loader-cell { text-align: center; padding: 50px !important; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Notification */
    .custom-alert-box-p { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 20px 40px; z-index: 9999; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s ease; }
    .alert-content-p { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .alert-text-p { color: #fff; font-weight: 700; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
   ` }} />
  </div>
 );
};

export default Coupons;
