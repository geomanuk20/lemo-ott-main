import React, { useState, useEffect } from 'react';
import { Check, Shield, Zap, Crown, Loader2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import Loader from '../components/Loader';
import FrontendLayout from '../components/FrontendLayout';
import { useNavigate, useLocation } from 'react-router-dom';

const FrontendSubscription = () => {
 const [plans, setPlans] = useState([]);
 const [loading, setLoading] = useState(false);
 const [settings, setSettings] = useState(null);
 const [processing, setProcessing] = useState(false);
 const [notification, setNotification] = useState(null);
 const navigate = useNavigate();
 const location = useLocation();
 const user = JSON.parse(localStorage.getItem('user') || '{}');
 const currentUserPlan = user.subscriptionPlan;

  const isPlanFree = (plan) => {
    if (!plan || plan.price === undefined || plan.price === null) return false;
    const p = plan.price.toString().trim().toLowerCase().replace(/[^\d.]/g, '');
    return p === '0' || p === '0.00' || p === '' || p === 'free' || parseFloat(p) === 0;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleActivateFreePlan = async (plan) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payment/free-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId: plan._id })
      });
      
      if (response.ok) {
        const data = await response.json();
        showNotification('Plan activated successfully!', 'success');
        
        // Update user state in local storage
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        userObj.status = data.user.status;
        userObj.subscriptionPlan = data.user.subscriptionPlan;
        userObj.expiryDate = data.user.expiryDate;
        localStorage.setItem('user', JSON.stringify(userObj));
        
        // Trigger profile update event
        window.dispatchEvent(new Event('profileUpdate'));
        
        setTimeout(() => {
          navigate('/user/profile');
        }, 2000);
      } else {
        const errorData = await response.json();
        showNotification(errorData.message || 'Activation failed', 'error');
        setProcessing(false);
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error during activation', 'error');
      setProcessing(false);
    }
  };

 useEffect(() => {
  const fetchData = async () => {
   try {
    const [plansRes, settingsRes] = await Promise.all([
     fetch('/api/subscription-plans'),
     fetch('/api/general-settings')
    ]);
    const plansData = await plansRes.json();
    const settingsData = await settingsRes.json();
    
    setPlans(Array.isArray(plansData) ? plansData.filter(p => p.status === 'Active') : []);
    setSettings(settingsData);
   } catch (err) {
    console.error('Error fetching subscription data:', err);
   } finally {
    setLoading(false);
   }
  };
  fetchData();
 }, []);

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('token');
    const selectedPlan = location.state?.selectedPlan;
    if (isLoggedIn && selectedPlan && isPlanFree(selectedPlan)) {
      // Clear location state immediately to prevent infinite triggers
      window.history.replaceState({}, document.title);
      handleActivateFreePlan(selectedPlan);
    }
  }, [location.state, navigate]);

  const handleSelectPlan = (plan) => {
   const isLoggedIn = !!localStorage.getItem('token');
   if (isPlanFree(plan)) {
    if (!isLoggedIn) {
     navigate('/login', { state: { from: '/subscription', selectedPlan: plan } });
    } else {
     handleActivateFreePlan(plan);
    }
   } else {
    if (!isLoggedIn) {
     navigate('/login', { state: { from: '/checkout', selectedPlan: plan } });
    } else {
     navigate('/checkout', { state: { selectedPlan: plan } });
    }
   }
  };

 return (
  <FrontendLayout isTransparent={true}>
   {notification && (
    <div className="custom-alert-box-v">
     <div className="alert-content-v">
      {notification.type === 'success' ? (
       <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
      ) : (
       <XCircle size={42} color="#ff4d4d" strokeWidth={2.5} />
      )}
      <span className="alert-text-v">{notification.message}</span>
     </div>
    </div>
   )}

   {processing && (
    <div className="fe-plans-loader-overlay-v">
     <Loader2 size={50} className="spinner-v" />
     <p style={{ marginTop: '15px', fontWeight: 600, color: '#fff' }}>Activating plan...</p>
    </div>
   )}

   <div className="fe-subscription-page-v">
    <div className="fe-subscription-header-v">
     <span className="fe-sub-tag-v">CHOOSE YOUR PLAN</span>
     <h1>Experience Premium <span>Entertainment</span></h1>
     <p>Unlimited access to our entire library of movies, TV shows, and live channels. No hidden fees, cancel anytime.</p>
    </div>

    <div className="fe-plans-container-v">
     {loading ? (
      <div className="fe-plans-loader-v">
       <Loader size="small" />
      </div>
     ) : (
      <div className="fe-plans-grid-v">
       {plans.map((plan, index) => {
        const isPremium = plan.planName.toLowerCase().includes('premium') || plan.planName.toLowerCase().includes('platinum') || plan.planName.toLowerCase().includes('pro');
        const isBasic = plan.planName.toLowerCase() === 'basic plan';
        const isCurrentPlan = currentUserPlan === plan.planName;
        return (
         <div key={plan._id} className={`fe-plan-card-v ${isPremium ? 'premium-v' : ''} ${isBasic ? 'basic-v' : ''}`}>
          {isCurrentPlan && <div className="fe-plan-ribbon-v" style={{ background: '#00a8ff' }}>CURRENT PLAN</div>}
          {!isCurrentPlan && isPremium && <div className="fe-plan-ribbon-v">MOST POPULAR</div>}
          {!isCurrentPlan && isBasic && <div className="fe-plan-ribbon-v default-v">DEFAULT</div>}
          <div className="fe-plan-head-v">
           <div className="fe-plan-icon-v">
            {index === 0 ? <Zap size={24} /> : index === 1 ? <Shield size={24} /> : <Crown size={24} />}
           </div>
           <h3>{plan.planName}</h3>
           <div className="fe-plan-price-v">
            <span className="amount-v">{plan.price}</span>
            <span className="period-v">/ {plan.duration}</span>
           </div>
          </div>

          <div className="fe-plan-features-v">
           <div className="fe-feature-item-v">
            <Check size={18} className="check-v" />
            <span>{plan.deviceLimit} Device Limit</span>
           </div>
           <div className="fe-feature-item-v">
            <Check size={18} className="check-v" />
            <span>Ads: {plan.ads}</span>
           </div>
           <div className="fe-feature-item-v">
            <Check size={18} className="check-v" />
            <span>{plan.streamingQuality || 'HD'} Streaming</span>
           </div>
           <div className="fe-feature-item-v">
            <Check size={18} className="check-v" />
            <span>Cancel anytime</span>
           </div>
          </div>

          <button 
           className={`fe-plan-btn-v ${isCurrentPlan ? 'current-plan-btn-v' : ''} ${(!isCurrentPlan && isPlanFree(plan) && plan.getStarted === 'OFF') ? 'disabled-plan-btn-v' : ''}`}
           onClick={() => !isCurrentPlan && !(isPlanFree(plan) && plan.getStarted === 'OFF') && handleSelectPlan(plan)}
           disabled={isCurrentPlan || (!isCurrentPlan && isPlanFree(plan) && plan.getStarted === 'OFF')}
          >
           {isCurrentPlan ? 'CURRENT PLAN' : ((isPlanFree(plan) && plan.getStarted === 'OFF') ? 'UNAVAILABLE' : <>GET STARTED <ArrowRight size={16} /></>)}
          </button>
         </div>
        );
       })}
      </div>
     )}
    </div>

    <div className="fe-subscription-footer-v">
     <p>Have questions? <a href="/faq">Visit our Help Center</a></p>
    </div>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .fe-subscription-page-v { min-height: 100vh; background: #050505; padding: 140px 5% 80px; color: #fff; text-align: center; }
    
    .fe-subscription-header-v { max-width: 800px; margin: 0 auto 60px; }
    .fe-sub-tag-v { font-size: 0.75rem; font-weight: 800; color: #b3d332; letter-spacing: 3px; display: block; margin-bottom: 15px; }
    .fe-subscription-header-v h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; line-height: 1.1; margin-bottom: 25px; }
    .fe-subscription-header-v h1 span { color: #b3d332; }
    .fe-subscription-header-v p { font-size: 1.1rem; color: #888; line-height: 1.6; }

    .fe-plans-grid-v { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; }
    
    .fe-plan-card-v { background: #0a0a0a; border: 1px solid #222; border-radius: 24px; padding: 40px; text-align: left; position: relative; transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; }
    .fe-plan-card-v:hover { transform: translateY(-10px); border-color: #333; background: #0d0d0d; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    
    .fe-plan-card-v.premium-v { border-color: #b3d332; background: linear-gradient(135deg, #0a0a0a 0%, #0d0d0d 100%); }
    .fe-plan-card-v.premium-v::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at top right, rgba(22,196,127,0.1) 0%, transparent 70%); pointer-events: none; }
    
    .fe-plan-ribbon-v { position: absolute; top: 20px; right: -10px; background: #b3d332; color: #fff; padding: 5px 15px; font-size: 0.65rem; font-weight: 900; border-radius: 4px 0 0 4px; box-shadow: -5px 5px 15px rgba(0,0,0,0.3); }
    .fe-plan-ribbon-v.default-v { background: #444; }

    .fe-plan-head-v { margin-bottom: 30px; }
    .fe-plan-icon-v { width: 50px; height: 50px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #b3d332; margin-bottom: 20px; }
    .fe-plan-head-v h3 { font-size: 1.5rem; font-weight: 800; margin-bottom: 15px; }
    
    .fe-plan-price-v { display: flex; align-items: baseline; gap: 4px; white-space: nowrap; }
    .amount-v { font-size: 3rem; font-weight: 800; color: #fff; white-space: nowrap; flex-shrink: 0; }
    .period-v { font-size: 0.9rem; color: #666; font-weight: 600; flex-shrink: 0; }

    .fe-plan-features-v { display: flex; flex-direction: column; gap: 15px; margin-bottom: 40px; flex: 1; }
    .fe-feature-item-v { display: flex; align-items: center; gap: 12px; font-size: 0.95rem; color: #aaa; font-weight: 500; }
    .check-v { color: #b3d332; }

    .fe-plan-btn-v { background: #fff; color: #000; border: none; width: 100%; padding: 16px; border-radius: 12px; font-weight: 800; font-size: 0.9rem; letter-spacing: 1px; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .fe-plan-btn-v:hover { background: #b3d332; color: #fff; transform: scale(1.02); }
    .premium-v .fe-plan-btn-v { background: #b3d332; color: #fff; }
    .premium-v .fe-plan-btn-v:hover { background: #b3d332; box-shadow: 0 10px 20px rgba(22,196,127,0.2); }
    .current-plan-btn-v, .premium-v .current-plan-btn-v { background: #333 !important; color: #888 !important; cursor: not-allowed !important; box-shadow: none !important; transform: none !important; }
    .disabled-plan-btn-v, .premium-v .disabled-plan-btn-v { background: #1a1a1a !important; color: #555 !important; cursor: not-allowed !important; box-shadow: none !important; transform: none !important; border: 1px solid #333 !important; }

    .fe-subscription-footer-v { margin-top: 60px; color: #666; font-size: 0.95rem; }
    .fe-subscription-footer-v a { color: #b3d332; text-decoration: none; font-weight: 700; margin-left: 5px; }

    .fe-plans-loader-v { height: 400px; display: flex; align-items: center; justify-content: center; width: 100%; }
    .spinner-v { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
     .fe-subscription-header-v h1 { font-size: 2.2rem; }
     .fe-plans-grid-v { grid-template-columns: 1fr; }
     .fe-plan-card-v { padding: 30px; }
    }

    /* Custom Alert Box & Animations */
    .custom-alert-box-v { position: fixed; top: 40px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 30px 60px; z-index: 9999; box-shadow: 0 20px 50px rgba(0,0,0,0.6); border: 1px solid #333; animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content-v { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text-v { color: #fff; font-size: 1.1rem; font-weight: 800; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -150%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    /* Loader Overlay */
    .fe-plans-loader-overlay-v { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(5,5,5,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999; }
   ` }} />
  </FrontendLayout>
 );
};

export default FrontendSubscription;
