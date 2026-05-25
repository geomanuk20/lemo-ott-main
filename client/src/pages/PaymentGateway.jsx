import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Settings, 
 Loader2,
 CheckCircle2,
 XCircle,
 CreditCard
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/payment-gateways';

const PaymentGateway = () => {
 const navigate = useNavigate();
 const [gateways, setGateways] = useState([]);
 const [loading, setLoading] = useState(false);
 const [notification, setNotification] = useState(null);

 useEffect(() => {
  fetchGateways();
 }, []);

 const fetchGateways = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setGateways(data);
  } catch (err) {
   console.error('Error fetching gateways:', err);
  } finally {
   setLoading(false);
  }
 };

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
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

   <div className="content-area-p">
    <div className="table-container-p">
     <table className="premium-table-v">
      <thead>
       <tr>
        <th>Gateway Name</th>
        <th>Status</th>
        <th>Action</th>
       </tr>
      </thead>
      <tbody>
       {loading ? (
        <tr>
         <td colSpan="3" className="loader-cell">
          <Loader size="small" />
         </td>
        </tr>
       ) : (
        gateways.map((gw) => (
         <tr key={gw._id}>
          <td className="bold-text">
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="gateway-icon-box">
             <CreditCard size={20} color="#00a8ff" />
            </div>
            {gw.name}
           </div>
          </td>
          <td>
           <span className={`badge-p status-active ${gw.status === 'Active' ? '' : 'inactive'}`}>
            {gw.status}
           </span>
          </td>
          <td>
           <button 
            className="edit-btn-v" 
            onClick={() => navigate(`/admin/payment-gateway/edit/${gw._id}`)}
            style={{ background: '#00a8ff' }}
           >
            <Settings size={14} />
           </button>
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
    .content-area-p { padding: 30px; }
    
    .table-container-p { background: #0a0a0a; border: 1px solid #222; border-radius: 4px; overflow: hidden; }
    .premium-table-v { width: 100%; border-collapse: collapse; text-align: left; border: 1px solid #222; }
    .premium-table-v th { background: #151515; padding: 18px 25px; font-size: 1rem; font-weight: 800; color: #eee; border-bottom: 1px solid #333; border-right: 1px solid #222; }
    .premium-table-v th:last-child { border-right: none; }
    .premium-table-v td { padding: 22px 25px; font-size: 0.95rem; color: #aaa; border-bottom: 1px solid #1a1a1a; border-right: 1px solid #222; vertical-align: middle; }
    .premium-table-v td:last-child { border-right: none; }
    .premium-table-v tr:hover { background: #111; }
    
    .bold-text { color: #fff; font-weight: 700; font-size: 1.1rem; }
    .gateway-icon-box { background: rgba(0, 168, 255, 0.1); width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0, 168, 255, 0.2); }

    .badge-p { padding: 6px 15px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-p.status-active { background: #b3d332; color: #fff; }
    .badge-p.status-active.inactive { background: #ff4d4d; }

    .edit-btn-v { color: #fff; border: none; width: 35px; height: 35px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .edit-btn-v:hover { transform: scale(1.1); filter: brightness(1.1); }
    
    .loader-cell { text-align: center; padding: 100px !important; }
    .spinner { animation: spin 1s linear infinite; color: #00a8ff; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Notification */
    .custom-alert-box-p { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 20px 40px; z-index: 9999; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    .alert-content-p { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .alert-text-p { color: #fff; font-weight: 700; }
   ` }} />
  </div>
 );
};

export default PaymentGateway;
