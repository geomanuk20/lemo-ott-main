import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Plus, 
 Edit2, 
 X, 
 Loader2, 
 CheckCircle2, 
 XCircle,
 RefreshCcw,
 Monitor
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/subscription-plans';

const SubscriptionPlan = () => {
 const navigate = useNavigate();
 const [plans, setPlans] = useState([]);
 const [loading, setLoading] = useState(false);
 const [notification, setNotification] = useState(null);
 const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

 useEffect(() => {
  fetchPlans();
 }, []);

 const fetchPlans = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setPlans(data);
  } catch (err) {
   console.error('Error fetching plans:', err);
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
    setPlans(plans.filter(p => p._id !== id));
    showNotification('Plan deleted successfully');
   }
  } catch (err) {
   console.error('Error deleting plan:', err);
   showNotification('Error deleting plan', 'error');
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
      <p>You are about to permanently delete this subscription plan. This action cannot be undone.</p>
      <div className="modal-actions-p">
       <button className="cancel-btn-p" onClick={() => setDeleteModal({ show: false, id: null })}>Cancel</button>
       <button className="confirm-btn-p" onClick={handleDelete}>Delete Plan</button>
      </div>
     </div>
    </div>
   )}

   <div className="content-area-p">
    <button className="add-plan-btn" onClick={() => navigate('/admin/subscription-plan/add')}>
     <Plus size={18} strokeWidth={3} />
     <span>Add Plan</span>
    </button>

    <div className="table-container-p">
     <table className="premium-table-v">
      <thead>
       <tr>
        <th>Plan Name</th>
        <th>Duration</th>
        <th>Price</th>
        <th>Device Limit</th>
        <th>Quality</th>
        <th>Ads</th>
        <th>Status</th>
        <th>Action</th>
       </tr>
      </thead>
      <tbody>
       {loading ? (
        <tr>
         <td colSpan="7" className="loader-cell">
          <Loader size="small" inline={true} />
         </td>
        </tr>
       ) : (
        plans.map((plan) => (
         <tr key={plan._id}>
          <td>{plan.planName}</td>
          <td className="bold-text">{plan.duration}</td>
          <td className="price-text">{plan.price}</td>
          <td className="bold-text">{plan.deviceLimit}</td>
          <td className="bold-text">{plan.streamingQuality || 'HD'}</td>
          <td>
           <span className={`badge-p ads ${plan.ads === 'ON' ? 'on' : 'off'}`}>
            {plan.ads}
           </span>
          </td>
          <td>
           <span className="badge-p status-active">
            {plan.status}
           </span>
          </td>
          <td>
           <div className="action-btns-p">
            <button className="edit-btn-v" onClick={() => navigate(`/admin/subscription-plan/edit/${plan._id}`)}>
             <Edit2 size={14} />
            </button>
            <button className="delete-btn-v" onClick={() => confirmDelete(plan._id)}>
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
    .sub-header-premium { display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; background: #111; border-top: 2px solid #b3d332; border-bottom: 1px solid #222; }
    .sub-header-premium h1 { font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0; }
    .header-right-icons { display: flex; align-items: center; gap: 20px; }
    .icon-p { color: #fff; cursor: pointer; opacity: 0.8; transition: opacity 0.2s; }
    .icon-p:hover { opacity: 1; }
    .profile-mini-v { width: 32px; height: 32px; border-radius: 4px; overflow: hidden; border: 1px solid #333; }
    .profile-mini-v img { width: 100%; height: 100%; object-fit: cover; }

    .content-area-p { padding: 30px; }
    .add-plan-btn { background: #b3d332; color: #fff; border: none; padding: 10px 18px; border-radius: 4px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; margin-bottom: 25px; transition: background 0.3s; }
    .add-plan-btn:hover { background: #14b072; }

    .table-container-p { background: #0a0a0a; border: 1px solid #222; border-radius: 4px; overflow: hidden; }
    .premium-table-v { width: 100%; border-collapse: collapse; text-align: left; border: 1px solid #222; }
    .premium-table-v th { background: #151515; padding: 15px 20px; font-size: 0.9rem; font-weight: 700; color: #eee; border-bottom: 1px solid #333; border-right: 1px solid #222; }
    .premium-table-v th:last-child { border-right: none; }
    .premium-table-v td { padding: 18px 20px; font-size: 0.9rem; color: #aaa; border-bottom: 1px solid #1a1a1a; border-right: 1px solid #222; vertical-align: middle; }
    .premium-table-v td:last-child { border-right: none; }
    .premium-table-v tr:hover { background: #111; }
    
    .bold-text { color: #fff; font-weight: 700; }
    .price-text { color: #fff; font-weight: 700; }

    .badge-p { padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
    .badge-p.ads.on { background: #b3d332; color: #fff; }
    .badge-p.ads.off { background: #ff4d4d; color: #fff; }
    .badge-p.status-active { background: #b3d332; color: #fff; }

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

export default SubscriptionPlan;
