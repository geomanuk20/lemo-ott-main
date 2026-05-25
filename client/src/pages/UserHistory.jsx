import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
 ArrowLeft, 
 RotateCw, 
 Monitor, 
 User as UserIcon, 
 Loader2, 
 CheckCircle2, 
 XCircle,
 CreditCard,
 Calendar,
 Smartphone,
 Trash2,
 Activity
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = 'http://localhost:5001/api/users';

const SessionTimer = ({ session, isDeviceA }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!session) return 'Expired';
      
      let loginTime = 0;
      if (session.loginAt) {
        loginTime = new Date(session.loginAt).getTime();
      } else if (session.token) {
        try {
          const parts = session.token.split('.');
          if (parts.length === 3) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            if (payload && payload.iat) {
              loginTime = payload.iat * 1000;
            }
          }
        } catch (_) {}
      }

      if (!loginTime) return 'Expired';

      const expiryDuration = isDeviceA ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
      const expireTime = loginTime + expiryDuration;
      const now = Date.now();
      const difference = expireTime - now;

      if (difference <= 0) {
        return 'Expired';
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const pad = (num) => String(num).padStart(2, '0');
      if (days > 0) {
        return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      }
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [session, isDeviceA]);

  return (
    <span style={{ 
      fontFamily: 'monospace', 
      fontWeight: 'bold', 
      color: timeLeft === 'Expired' ? '#ff4d4d' : '#2ecc71',
      background: timeLeft === 'Expired' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(46, 204, 113, 0.1)',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '0.8rem'
    }}>
      {timeLeft}
    </span>
  );
};

const UserHistory = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const [user, setUser] = useState(null);
 const [transactions, setTransactions] = useState([]);
 const [loading, setLoading] = useState(true);

  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to terminate this active session? This will force-logout the user from this device.')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/users/${id}/sessions/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({ ...prev, activeSessions: data.activeSessions }));
      } else {
        alert('Failed to terminate session');
      }
    } catch (err) {
      console.error(err);
      alert('Error terminating session');
    }
  };

  const handleTerminateAllSessions = async () => {
    if (!window.confirm('Are you sure you want to terminate all active sessions for this user? This will log them out from all devices.')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/users/${id}/sessions/terminate-all`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({ ...prev, activeSessions: data.activeSessions }));
      } else {
        alert('Failed to terminate all sessions');
      }
    } catch (err) {
      console.error(err);
      alert('Error terminating all sessions');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (_) {
      return dateStr;
    }
  };

 const fetchUserHistory = async () => {
  setLoading(true);
  try {
   const response = await fetch(`${API_URL}/${id}`);
   const data = await response.json();
   if (response.ok) {
    setUser(data);
    try {
     const transRes = await fetch(`http://localhost:5001/api/user/transactions/${data.email}`);
     if (transRes.ok) {
      const transData = await transRes.json();
      setTransactions(transData);
     }
    } catch (transErr) {
     console.error('Error fetching user transactions:', transErr);
    }
   }
  } catch (err) {
   console.error('Error fetching user history:', err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchUserHistory();
 }, [id]);

 const maskEmail = (email) => {
  if (!email) return '';
  const [name, domain] = email.split('@');
  return `${name.substring(0, 3)}*******@${domain}`;
 };

  if (loading) {
    return (
      <div className="loader-container-h">
        <Loader size="small" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-history-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div className="error-container-h" style={{ fontSize: '1.2rem', color: '#ff4d4d', fontWeight: 600, marginBottom: '20px' }}>User not found</div>
        <button className="back-btn-h" style={{ background: '#b3d332', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }} onClick={() => navigate('/admin/users/list')}>
          <ArrowLeft size={16} /> Back to Users List
        </button>
      </div>
    );
  }

 return (
  <div className="user-history-page">
   <div className="history-header-premium">
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
     <button className="back-btn-h" onClick={() => navigate('/admin/users/list')}>
      <ArrowLeft size={20} />
     </button>
     <h1 className="history-title-p">USER HISTORY</h1>
    </div>
   </div>

   <div className="history-grid-p">
    {/* User Info Card */}
    <div className="history-card-p user-main-card-p">
     <div className="user-info-flex-p">
      <div className="user-profile-img-p">
       {user.profileImage ? (
        <img 
         src={user.profileImage.startsWith('http') || user.profileImage.startsWith('data:') ? user.profileImage : `http://localhost:5001/uploads/${user.profileImage}`} 
         alt="Profile" 
         onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Profile"; }}
        />
       ) : (
        <div className="avatar-placeholder-h">
         <UserIcon size={40} color="#333" />
        </div>
       )}
      </div>
      <div className="user-details-text-p">
       <h2 className="user-name-h">{user.name}</h2>
       <p className="user-email-h">Email: {maskEmail(user.email)}</p>
       <p className="user-phone-h">Phone: {user.phone || ''}</p>
      </div>
      <div className="status-badge-container-h">
        <span className={`status-pill-h ${user.status === 'Active' ? 'active' : 'inactive'}`}>
         {user.status}
        </span>
      </div>
     </div>
    </div>

    {/* Subscription Card */}
    <div className="history-card-p subscription-card-p">
     <h3 className="card-subtitle-h">Subscription Plan</h3>
     <div className="plan-details-list-h">
      <div className="plan-item-h">
       <span className="dot red-dot"></span>
       <span className="label-h">Current Plan</span>
       <span className="value-h">{user.subscriptionPlan || 'None'}</span>
      </div>
      <div className="plan-item-h">
       <span className="dot green-dot"></span>
       <span className="label-h">Subscription expires on</span>
       <span className="value-h">{user.expiryDate || 'N/A'}</span>
      </div>
     </div>
    </div>
   </div>

   {/* Active Sessions & Device History Section */}
   <div className="devices-section-p" style={{ marginTop: '30px', marginBottom: '30px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
     <h3 className="section-title-h">Devices & Active Sessions</h3>
     {user.activeSessions && user.activeSessions.length > 0 && (
      <button 
       onClick={handleTerminateAllSessions}
       style={{
        background: '#ff4d4d',
        color: '#fff',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: '700',
        transition: 'background 0.2s'
       }}
       onMouseOver={(e) => e.target.style.background = '#e60000'}
       onMouseOut={(e) => e.target.style.background = '#ff4d4d'}
      >
       Terminate All Sessions
      </button>
     )}
    </div>

    <div className="history-grid-p">
     {/* Active Sessions Table */}
     <div className="history-card-p" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '15px', color: '#b3d332', display: 'flex', alignItems: 'center', gap: '8px' }}>
       <Smartphone size={18} /> Active Sessions ({user.activeSessions ? user.activeSessions.length : 0})
      </h4>
      <div className="transactions-table-wrapper-h">
       <table className="history-table-p">
        <thead>
         <tr>
          <th>Device ID</th>
          <th>Logged In At</th>
          <th>Expires In</th>
          <th style={{ textAlign: 'center' }}>Action</th>
         </tr>
        </thead>
        <tbody>
         {!user.activeSessions || user.activeSessions.length === 0 ? (
          <tr className="empty-row-h">
           <td colSpan="4" style={{ height: '80px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>No active sessions found.</td>
          </tr>
         ) : (
          user.activeSessions.map((session, index) => (
           <tr key={session._id}>
            <td style={{ fontFamily: 'monospace', color: '#eee' }}>
             <span style={{ 
                display: 'inline-block',
                fontWeight: 'bold', 
                color: index === 0 ? '#b3d332' : '#3498db', 
                background: index === 0 ? 'rgba(179, 211, 50, 0.15)' : 'rgba(52, 152, 219, 0.15)',
                padding: '2px 6px',
                borderRadius: '3px',
                marginRight: '8px',
                fontSize: '0.75rem'
              }}>
                {index === 0 ? 'Device A' : index === 1 ? 'Device B' : `Device ${String.fromCharCode(65 + index)}`}
              </span>
              {session.deviceId}
             </td>
            <td>{formatDate(session.loginAt)}</td>
             <td>
               <SessionTimer session={session} isDeviceA={index === 0} />
             </td>
            <td style={{ textAlign: 'center' }}>
             <button
              onClick={() => handleTerminateSession(session._id)}
              style={{
               background: 'none',
               border: 'none',
               color: '#ff4d4d',
               cursor: 'pointer',
               padding: '4px',
               transition: 'color 0.2s',
               display: 'inline-flex',
               alignItems: 'center',
               justifyContent: 'center'
              }}
              title="Force Logout Session"
              onMouseOver={(e) => e.currentTarget.style.color = '#e60000'}
               onMouseOut={(e) => e.currentTarget.style.color = '#ff4d4d'}
             >
              <Trash2 size={16} />
             </button>
            </td>
           </tr>
          ))
         )}
        </tbody>
       </table>
      </div>
     </div>

     {/* Device History Table */}
     <div className="history-card-p" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '15px', color: '#b3d332', display: 'flex', alignItems: 'center', gap: '8px' }}>
       <Activity size={18} /> Recent Login Activity (Last 6 attempts)
      </h4>
      <div className="transactions-table-wrapper-h">
       <table className="history-table-p">
        <thead>
         <tr>
          <th>Device ID</th>
          <th>Status</th>
          <th>Time</th>
         </tr>
        </thead>
        <tbody>
         {!user.deviceHistory || user.deviceHistory.length === 0 ? (
          <tr className="empty-row-h">
           <td colSpan="3" style={{ height: '80px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>No login attempts recorded yet.</td>
          </tr>
         ) : (
          [...user.deviceHistory].reverse().slice(0, 6).map((attempt, index) => (
           <tr key={index}>
            <td style={{ fontFamily: 'monospace', color: '#eee' }}>{attempt.deviceId}</td>
            <td>
             <span 
              style={{
               display: 'inline-block',
               padding: '2px 8px',
               borderRadius: '4px',
               fontSize: '0.75rem',
               fontWeight: '700',
               textTransform: 'uppercase',
               background: attempt.status === 'Success' ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)',
               color: attempt.status === 'Success' ? '#2ecc71' : '#e74c3c'
              }}
             >
              {attempt.status}
             </span>
            </td>
            <td>{formatDate(attempt.loginAt)}</td>
           </tr>
          ))
         )}
        </tbody>
       </table>
      </div>
     </div>
    </div>
   </div>

   {/* Transactions Section */}
   <div className="transactions-section-p">
    <h3 className="section-title-h">User Transactions</h3>
    <div className="transactions-table-wrapper-h">
     <table className="history-table-p">
      <thead>
       <tr>
        <th>Email</th>
        <th>Plan</th>
        <th>Amount</th>
        <th>Payment Gateway</th>
        <th>Payment ID</th>
        <th>Payment Date</th>
       </tr>
      </thead>
      <tbody>
       {transactions.length === 0 ? (
        <tr className="empty-row-h">
         <td colSpan="6" style={{ height: '100px', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>No transactions found for this user.</td>
        </tr>
       ) : (
        transactions.map((tx) => (
         <tr key={tx._id || tx.paymentId}>
          <td>{tx.email}</td>
          <td>{tx.plan}</td>
          <td>{tx.amount}</td>
          <td>{tx.gateway}</td>
          <td>{tx.paymentId}</td>
          <td>{tx.paymentDate}</td>
         </tr>
        ))
       )}
      </tbody>
     </table>
    </div>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .user-history-page { padding: 30px; animation: fadeIn 0.4s ease-out; background: #000; min-height: 100vh; color: #fff; }
    
    .back-btn-h { background: none; border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 5px; transition: color 0.2s; }
    .back-btn-h:hover { color: #b3d332; }

    .history-header-premium { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #222; padding-bottom: 15px; }
    .history-title-p { font-size: 1.4rem; font-weight: 800; letter-spacing: 0.5px; }
    
    .header-actions-p { display: flex; align-items: center; gap: 15px; }
    .header-icon-btn-p { background: none; border: none; color: #fff; cursor: pointer; padding: 5px; transition: color 0.3s; }
    .header-icon-btn-p:hover { color: #b3d332; }
    .header-user-avatar-p { width: 32px; height: 32px; border-radius: 50%; background: #222; display: flex; align-items: center; justify-content: center; border: 1px solid #333; }

    .history-grid-p { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; }
    .history-card-p { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }

    .user-info-flex-p { display: flex; align-items: center; gap: 25px; position: relative; }
    .user-profile-img-p { width: 140px; height: 60px; background: #fff; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid #333; }
    .user-profile-img-p img { width: 100%; height: 100%; object-fit: contain; }
    .avatar-placeholder-h { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #eee; }
    .user-name-h { font-size: 1.2rem; font-weight: 700; margin-bottom: 5px; }
    .user-email-h, .user-phone-h { color: #888; font-size: 0.9rem; margin-bottom: 3px; }

    .status-badge-container-h { position: absolute; top: 0; right: 0; }
    .status-pill-h { padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
    .status-pill-h.active { background: #b3d332; color: #fff; }
    .status-pill-h.inactive { background: #ff4d4d; color: #fff; }

    .subscription-card-p { border-left: 3px solid #1a1a1a; }
    .card-subtitle-h { font-size: 1rem; font-weight: 700; margin-bottom: 20px; color: #fff; }
    .plan-details-list-h { display: flex; flex-direction: column; gap: 15px; }
    .plan-item-h { display: flex; align-items: center; gap: 10px; background: #151515; padding: 12px; border-radius: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .red-dot { background: #b3d332; box-shadow: 0 0 10px rgba(179,211,50,0.4); }
    .green-dot { background: #b3d332; box-shadow: 0 0 10px rgba(22,196,127,0.4); }
    .label-h { flex: 1; font-size: 0.85rem; color: #aaa; font-weight: 600; }
    .value-h { font-size: 0.85rem; color: #fff; font-weight: 700; }

    .transactions-section-p { margin-top: 20px; }
    .section-title-h { font-size: 1rem; font-weight: 700; margin-bottom: 15px; }
    .transactions-table-wrapper-h { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden; }
    .history-table-p { width: 100%; border-collapse: collapse; text-align: left; }
    .history-table-p th { background: #111; padding: 15px 20px; color: #eee; font-size: 0.85rem; font-weight: 700; border-bottom: 1px solid #222; border-right: 1px solid #1a1a1a; }
    .history-table-p td { padding: 15px 20px; color: #888; font-size: 0.85rem; border-bottom: 1px solid #151515; border-right: 1px solid #151515; }
    .history-table-p tr:last-child td { border-bottom: none; }
    
    .loader-container-h { height: 60vh; display: flex; align-items: center; justify-content: center; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 1100px) {
     .history-grid-p { grid-template-columns: 1fr; }
    }
   ` }} />
  </div>
 );
};

export default UserHistory;
