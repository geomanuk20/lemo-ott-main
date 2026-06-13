import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Shield, Zap, Crown, Loader2, CreditCard, Timer } from 'lucide-react';
import FrontendLayout from '../components/FrontendLayout';

// Per-tag countdown timer (isolated so only this tag re-renders each second)
const CouponTagTimer = ({ expiryDate }) => {
 const [timeStr, setTimeStr] = useState('');
 const [isUrgent, setIsUrgent] = useState(false);

 useEffect(() => {
  const calc = () => {
   if (!expiryDate) { setTimeStr(''); return; }
   const expiry = new Date(`${expiryDate}T23:59:59`);
   const diff = expiry - new Date();
   if (diff <= 0) { setTimeStr('Expired'); return; }
   const totalSec = Math.floor(diff / 1000);
   const d = Math.floor(totalSec / 86400);
   const h = Math.floor((totalSec % 86400) / 3600);
   const m = Math.floor((totalSec % 3600) / 60);
   const s = totalSec % 60;
   setIsUrgent(d === 0 && h < 2);
   if (d > 0) setTimeStr(`${d}d ${h}h`);
   else if (h > 0) setTimeStr(`${h}h ${m}m ${s}s`);
   else setTimeStr(`${m}m ${s}s`);
  };
  calc();
  const iv = setInterval(calc, 1000);
  return () => clearInterval(iv);
 }, [expiryDate]);

 if (!timeStr) return null;
 return (
  <span style={{
   display: 'inline-flex', alignItems: 'center', gap: '3px',
   fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700,
   color: timeStr === 'Expired' ? '#ff4d4d' : isUrgent ? '#ff9800' : '#b3d332',
   background: timeStr === 'Expired' ? 'rgba(255,77,77,0.1)' : isUrgent ? 'rgba(255,152,0,0.1)' : 'rgba(179,211,50,0.1)',
   padding: '2px 6px', borderRadius: '4px',
  }}>
   {timeStr !== 'Expired' && <Timer size={9} />}
   {timeStr}
  </span>
 );
};

const FrontendCheckout = () => {
 const location = useLocation();
 const navigate = useNavigate();
 const selectedPlan = location.state?.selectedPlan;
 
 const [gateways, setGateways] = useState([]);
 const [selectedGateway, setSelectedGateway] = useState(null);
 const [loading, setLoading] = useState(true);
 const [processing, setProcessing] = useState(false);
 const [notification, setNotification] = useState(null);

 // Coupon States
 const [couponInput, setCouponInput] = useState('');
 const [appliedCoupon, setAppliedCoupon] = useState(null);
 const [couponLoading, setCouponLoading] = useState(false);
 const [couponMessage, setCouponMessage] = useState('');
 const [couponError, setCouponError] = useState(false);
 const [availableCoupons, setAvailableCoupons] = useState([]);

 useEffect(() => {
  if (!selectedPlan) {
   navigate('/subscription');
   return;
  }
  
  const fetchGateways = async () => {
   try {
    const response = await fetch('/api/payment-gateways');
    const data = await response.json();
    const activeGateways = data.filter(gw => gw.status === 'Active');
    setGateways(activeGateways);
    if (activeGateways.length > 0) {
     setSelectedGateway(activeGateways[0]._id);
    }
   } catch (err) {
    console.error('Error fetching gateways:', err);
    showNotification('Error loading payment options', 'error');
   } finally {
    setLoading(false);
   }
  };

  const fetchAvailableCoupons = async () => {
   try {
    const response = await fetch('/api/coupons');
    const data = await response.json();
    const todayStr = new Date().toISOString().split('T')[0];
    const filtered = data.filter(c =>
     c.status === 'Active' &&
     c.showOnFrontend !== 'OFF' &&
     (!c.expiryDate || c.expiryDate >= todayStr) &&
     (c.couponUsed === undefined || c.usersAllow === undefined || c.couponUsed < c.usersAllow)
    );
    setAvailableCoupons(filtered);
   } catch (err) {
    console.error('Error fetching coupons:', err);
   }
  };
  
  fetchGateways();
  fetchAvailableCoupons();
 }, [selectedPlan, navigate]);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const getPlanPriceVal = () => {
  if (!selectedPlan || !selectedPlan.price) return 0;
  const priceClean = selectedPlan.price.toString().replace(/[^\d.]/g, '');
  return parseFloat(priceClean) || 0;
 };

 const originalPrice = getPlanPriceVal();
 const discountAmount = appliedCoupon ? (originalPrice * appliedCoupon.couponPercentage) / 100 : 0;
 const finalPriceVal = Math.max(0, originalPrice - discountAmount);

 const handleApplyCoupon = async (codeToApply) => {
  const targetCode = typeof codeToApply === 'string' ? codeToApply : couponInput;
  if (!targetCode.trim()) return;
  setCouponLoading(true);
  setCouponMessage('');
  setCouponError(false);
  try {
   const response = await fetch('/api/coupons/validate', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json'
    },
    body: JSON.stringify({ couponCode: targetCode.trim() })
   });
   const data = await response.json();
   if (response.ok && data.valid) {
    setAppliedCoupon({
     couponCode: data.couponCode,
     couponPercentage: data.couponPercentage
    });
    setCouponMessage(`Success! ${data.couponPercentage}% discount applied.`);
    setCouponError(false);
   } else {
    setCouponMessage(data.message || 'Invalid coupon code');
    setCouponError(true);
   }
  } catch (err) {
   console.error(err);
   setCouponMessage('Error validating coupon');
   setCouponError(true);
  } finally {
   setCouponLoading(false);
  }
 };

 const handleSelectCoupon = (code) => {
  setCouponInput(code);
  handleApplyCoupon(code);
 };

 const handleRemoveCoupon = () => {
  setAppliedCoupon(null);
  setCouponInput('');
  setCouponMessage('');
  setCouponError(false);
 };

 const handlePayment = async () => {
  if (finalPriceVal > 0 && !selectedGateway) {
   showNotification('Please select a payment method', 'error');
   return;
  }
  
  setProcessing(true);
  
  try {
   const token = localStorage.getItem('token');

   if (finalPriceVal === 0) {
    // Bypassing gateways because price is 0
    const response = await fetch('/api/payment/mock-success', {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({ 
      planId: selectedPlan._id,
      couponCode: appliedCoupon?.couponCode 
     })
    });
    
    if (response.ok) {
     const data = await response.json();
     showNotification('Subscription activated successfully!', 'success');
     
     const user = JSON.parse(localStorage.getItem('user'));
     user.status = data.user.status;
     user.subscriptionPlan = data.user.subscriptionPlan;
     user.expiryDate = data.user.expiryDate;
     localStorage.setItem('user', JSON.stringify(user));
     
     setTimeout(() => {
      navigate('/user/profile');
     }, 2000);
    } else {
     const errorData = await response.json();
     showNotification(errorData.message || 'Activation failed', 'error');
     setProcessing(false);
    }
    return;
   }

   const gatewayObj = gateways.find(gw => gw._id === selectedGateway);
   
   if (gatewayObj && gatewayObj.name.toLowerCase() === 'phonepe') {
    // PhonePe Real Integration
    const response = await fetch('/api/payment/phonepe/initiate', {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({ 
      planId: selectedPlan._id,
      couponCode: appliedCoupon?.couponCode
     })
    });

    const data = await response.json();
    if (response.ok && data.redirectUrl) {
     window.location.href = data.redirectUrl;
    } else {
     showNotification(data.message || 'Failed to initiate PhonePe payment', 'error');
     setProcessing(false);
    }
   } else {
    // Fallback Mock Payment for other gateways
    const response = await fetch('/api/payment/mock-success', {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({ 
      planId: selectedPlan._id, 
      gatewayId: selectedGateway,
      couponCode: appliedCoupon?.couponCode
     })
    });
    
    if (response.ok) {
     const data = await response.json();
     showNotification('Payment successful! Your subscription is active.', 'success');
     
     const user = JSON.parse(localStorage.getItem('user'));
     user.status = data.user.status;
     user.subscriptionPlan = data.user.subscriptionPlan;
     user.expiryDate = data.user.expiryDate;
     localStorage.setItem('user', JSON.stringify(user));
     
     setTimeout(() => {
      navigate('/user/profile');
     }, 2000);
    } else {
     const errorData = await response.json();
     showNotification(errorData.message || 'Payment failed', 'error');
     setProcessing(false);
    }
   }
  } catch (err) {
   console.error(err);
   showNotification('Network error during payment', 'error');
   setProcessing(false);
  }
 };

 if (!selectedPlan) return null;

 const isPremium = selectedPlan.planName.toLowerCase().includes('premium') || selectedPlan.planName.toLowerCase().includes('platinum');

 return (
  <FrontendLayout isTransparent={true}>
   <div className="fe-checkout-page-v">
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

    <div className="checkout-container-v">
     <div className="checkout-header-v">
      <h1>Secure Checkout</h1>
      <p>Complete your purchase to unlock premium content.</p>
     </div>

     <div className="checkout-content-v">
      {/* Plan Summary */}
      <div className="summary-section-v">
       <h2>Order Summary</h2>
       <div className={`plan-summary-card-v ${isPremium ? 'premium-card-v' : ''}`}>
        <div className="plan-icon-v">
         {isPremium ? <Crown size={30} /> : <Zap size={30} />}
        </div>
        <div className="plan-details-v">
         <h3>{selectedPlan.planName}</h3>
         <p>{selectedPlan.duration}</p>
        </div>
        <div className="plan-price-v">
         <span className="price-v">{selectedPlan.price}</span>
        </div>
       </div>

       {/* Coupon Section */}
       <div className="coupon-container-v">
        <div className="coupon-input-group-v">
         <input
          type="text"
          placeholder="Promo / Coupon Code"
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
          disabled={appliedCoupon || couponLoading}
         />
         {appliedCoupon ? (
          <button 
           type="button" 
           className="coupon-remove-btn-v"
           onClick={handleRemoveCoupon}
          >
           Remove
          </button>
         ) : (
          <button 
           type="button" 
           className="coupon-apply-btn-v"
           onClick={handleApplyCoupon}
           disabled={!couponInput || couponLoading}
          >
           {couponLoading ? <Loader2 size={16} className="spinner-v" /> : 'Apply'}
          </button>
         )}
        </div>

        {/* Available Coupons list */}
        {!appliedCoupon && availableCoupons.length > 0 && (
         <div className="available-coupons-v">
          <p className="available-title-v">Available Coupons:</p>
          <div className="coupons-flex-v">
           {availableCoupons.map((c) => (
            <div 
             key={c._id} 
             className="coupon-tag-v"
             onClick={() => handleSelectCoupon(c.couponCode)}
            >
             <span className="tag-code-v">{c.couponCode}</span>
             <span className="tag-desc-v">({c.couponPercentage}% OFF)</span>
             <CouponTagTimer expiryDate={c.expiryDate} />
            </div>
           ))}
          </div>
         </div>
        )}

        {couponMessage && (
         <p className={`coupon-message-v ${couponError ? 'error-v' : 'success-v'}`}>
          {couponMessage}
         </p>
        )}
       </div>
       
       <div className="summary-list-v">
        <div className="summary-item-v">
         <span>Subtotal</span>
         <span>{selectedPlan.price}</span>
        </div>
        {appliedCoupon && (
         <div className="summary-item-v discount-row-v">
          <span>Discount ({appliedCoupon.couponPercentage}%)</span>
          <span>- ₹ {discountAmount.toFixed(2)}</span>
         </div>
        )}
        <div className="summary-item-v">
         <span>Tax</span>
         <span>Included</span>
        </div>
        <div className="summary-divider-v"></div>
        <div className="summary-item-v total-v">
         <span>Total to pay</span>
         <span>₹ {finalPriceVal.toFixed(2)}</span>
        </div>
       </div>
      </div>

      {/* Payment Methods */}
      <div className="payment-section-v">
       <h2>Payment Method</h2>
       
       {finalPriceVal === 0 ? (
        <div className="free-activation-box-v">
         <CheckCircle2 size={36} color="#b3d332" />
         <div className="free-activation-info-v">
          <h3>Free Plan Activation</h3>
          <p>Your coupon code gives you 100% discount. No payment is required.</p>
         </div>
        </div>
       ) : (
        <>
         <p className="payment-sub-v">Select your preferred payment gateway.</p>
         
         {loading ? (
          <div className="payment-loader-v"><Loader2 size={30} className="spinner-v" /></div>
         ) : gateways.length === 0 ? (
          <div className="no-gateway-v">
           <XCircle size={30} color="#ff4d4d" />
           <p>No payment gateways are currently active. Please contact support.</p>
          </div>
         ) : (
          <div className="gateways-list-v">
           {gateways.map((gw) => (
            <div 
             key={gw._id} 
             className={`gateway-card-v ${selectedGateway === gw._id ? 'selected-v' : ''}`}
             onClick={() => setSelectedGateway(gw._id)}
            >
             <div className="gateway-radio-v">
              <div className="radio-inner-v"></div>
             </div>
             <div className="gateway-info-v">
              <CreditCard size={20} className="gw-icon-v" />
              <span className="gw-name-v">Pay via {gw.name}</span>
             </div>
            </div>
           ))}
          </div>
         )}
        </>
       )}

       <button 
        className={`pay-btn-v ${(finalPriceVal > 0 && !selectedGateway) || processing ? 'disabled-v' : ''}`}
        onClick={handlePayment}
        disabled={(finalPriceVal > 0 && !selectedGateway) || processing}
       >
        {processing ? <Loader2 size={20} className="spinner-v" /> : (
         finalPriceVal === 0 ? (
          <>Activate Plan <ArrowRight size={18} /></>
         ) : (
          <>Proceed to Pay <ArrowRight size={18} /></>
         )
        )}
       </button>
       <div className="secure-badge-v">
        <Shield size={14} /> <span>100% Secure & Encrypted Transaction</span>
       </div>
      </div>
     </div>
    </div>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .fe-checkout-page-v { min-height: 100vh; background: #050505; padding: 120px 5% 80px; color: #fff; font-family: 'Inter', sans-serif; }
    .checkout-container-v { max-width: 1000px; margin: 0 auto; }
    
    .checkout-header-v { text-align: center; margin-bottom: 50px; }
    .checkout-header-v h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; background: linear-gradient(90deg, #fff, #aaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .checkout-header-v p { color: #888; font-size: 1rem; }

    .checkout-content-v { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }

    .summary-section-v, .payment-section-v { background: #0a0a0a; border: 1px solid #222; border-radius: 20px; padding: 40px; }
    h2 { font-size: 1.3rem; font-weight: 700; margin-bottom: 25px; color: #fff; border-bottom: 1px solid #1a1a1a; padding-bottom: 15px; }

    .plan-summary-card-v { display: flex; align-items: center; gap: 20px; background: #111; padding: 25px; border-radius: 16px; border: 1px solid #222; margin-bottom: 30px; }
    .plan-summary-card-v.premium-card-v { border-color: rgba(179,211,50,0.3); background: linear-gradient(135deg, rgba(179,211,50,0.05) 0%, transparent 100%); }
    .plan-icon-v { width: 60px; height: 60px; background: rgba(179,211,50,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #b3d332; flex-shrink: 0; }
    .plan-details-v { flex: 1; }
    .plan-details-v h3 { margin: 0 0 5px 0; font-size: 1.2rem; font-weight: 700; }
    .plan-details-v p { margin: 0; color: #888; font-size: 0.9rem; text-transform: capitalize; }
    .plan-price-v .price-v { font-size: 1.5rem; font-weight: 800; color: #b3d332; }

    /* Coupon Styles */
    .coupon-container-v { margin-bottom: 25px; }
    .coupon-input-group-v { display: flex; gap: 10px; }
    .coupon-input-group-v input { flex: 1; background: #111; border: 1px solid #222; border-radius: 8px; padding: 12px 16px; color: #fff; font-size: 0.95rem; font-weight: 600; text-transform: uppercase; transition: all 0.2s; }
    .coupon-input-group-v input:focus { border-color: #b3d332; outline: none; }
    .coupon-input-group-v input:disabled { color: #666; cursor: not-allowed; }
    .coupon-apply-btn-v { background: #b3d332; color: #000; border: none; border-radius: 8px; padding: 0 24px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; min-width: 90px; transition: all 0.2s; }
    .coupon-apply-btn-v:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(179,211,50,0.2); }
    .coupon-apply-btn-v:disabled { background: #222; color: #555; cursor: not-allowed; }
    .coupon-remove-btn-v { background: #ff4d4d; color: #fff; border: none; border-radius: 8px; padding: 0 20px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
    .coupon-remove-btn-v:hover { background: #ff3333; }
    .coupon-message-v { margin: 8px 0 0 0; font-size: 0.85rem; font-weight: 600; text-align: left; }
    .coupon-message-v.success-v { color: #b3d332; }
    .coupon-message-v.error-v { color: #ff4d4d; }
    .discount-row-v { color: #b3d332 !important; font-weight: 600; }

    /* Available Coupons styles */
    .available-coupons-v { margin-top: 15px; text-align: left; }
    .available-title-v { color: #888; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .coupons-flex-v { display: flex; flex-wrap: wrap; gap: 8px; }
    .coupon-tag-v { background: #151515; border: 1px dashed #333; padding: 6px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .coupon-tag-v:hover { background: rgba(179,211,50,0.08); border-color: #b3d332; transform: translateY(-1px); }
    .tag-code-v { color: #b3d332; font-weight: 700; font-size: 0.8rem; }
    .tag-desc-v { color: #888; font-size: 0.75rem; font-weight: 500; }

    /* Free Activation Box */
    .free-activation-box-v { display: flex; align-items: center; gap: 15px; background: rgba(179,211,50,0.05); border: 1px solid #b3d332; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
    .free-activation-info-v h3 { margin: 0 0 5px 0; font-size: 1.1rem; font-weight: 700; color: #b3d332; text-align: left; }
    .free-activation-info-v p { margin: 0; color: #aaa; font-size: 0.9rem; line-height: 1.4; text-align: left; }

    .summary-list-v { display: flex; flex-direction: column; gap: 15px; }
    .summary-item-v { display: flex; justify-content: space-between; color: #aaa; font-size: 0.95rem; }
    .summary-divider-v { height: 1px; background: #222; margin: 10px 0; }
    .summary-item-v.total-v { color: #fff; font-size: 1.2rem; font-weight: 800; }

    .payment-sub-v { color: #888; font-size: 0.9rem; margin-top: -15px; margin-bottom: 25px; }
    
    .gateways-list-v { display: flex; flex-direction: column; gap: 15px; margin-bottom: 35px; }
    .gateway-card-v { display: flex; align-items: center; gap: 15px; background: #111; border: 1px solid #222; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .gateway-card-v:hover { background: #151515; border-color: #444; }
    .gateway-card-v.selected-v { border-color: #b3d332; background: rgba(179,211,50,0.05); }
    
    .gateway-radio-v { width: 22px; height: 22px; border: 2px solid #555; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: 0.2s; }
    .gateway-card-v.selected-v .gateway-radio-v { border-color: #b3d332; }
    .radio-inner-v { width: 10px; height: 10px; background: #b3d332; border-radius: 50%; transform: scale(0); transition: 0.2s; }
    .gateway-card-v.selected-v .radio-inner-v { transform: scale(1); }
    
    .gateway-info-v { display: flex; align-items: center; gap: 12px; }
    .gw-icon-v { color: #00a8ff; }
    .gw-name-v { font-weight: 600; font-size: 1.05rem; }

    .pay-btn-v { width: 100%; background: #b3d332; color: #000; border: none; padding: 18px; border-radius: 12px; font-weight: 800; font-size: 1.05rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; }
    .pay-btn-v:hover:not(.disabled-v) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(179,211,50,0.2); }
    .pay-btn-v.disabled-v { background: #222; color: #555; cursor: not-allowed; }

    .secure-badge-v { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; color: #666; font-size: 0.8rem; font-weight: 600; }
    
    .payment-loader-v { display: flex; justify-content: center; padding: 30px; }
    .no-gateway-v { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 15px; color: #888; padding: 30px; background: #111; border-radius: 12px; margin-bottom: 30px; }

    .spinner-v { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Notification */
    .custom-alert-box-v { position: fixed; top: 40px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 30px 60px; z-index: 9999; box-shadow: 0 20px 50px rgba(0,0,0,0.6); border: 1px solid #333; animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content-v { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text-v { color: #fff; font-size: 1.1rem; font-weight: 800; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -150%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    @media (max-width: 900px) {
     .checkout-content-v { grid-template-columns: 1fr; gap: 25px; }
     .summary-section-v, .payment-section-v { padding: 30px; }
    }

    @media (max-width: 600px) {
     .fe-checkout-page-v { padding: 100px 3% 60px; }
     .summary-section-v, .payment-section-v { padding: 20px; border-radius: 12px; }
     .checkout-header-v { margin-bottom: 30px; }
     .checkout-header-v h1 { font-size: 1.8rem; }
     .plan-summary-card-v { padding: 15px; gap: 12px; }
     .plan-icon-v { width: 50px; height: 50px; }
     .plan-details-v h3 { font-size: 1.1rem; }
     .plan-price-v .price-v { font-size: 1.25rem; }
     .coupon-input-group-v { flex-direction: column; }
     .coupon-apply-btn-v, .coupon-remove-btn-v { padding: 12px 20px; width: 100%; min-height: 46px; }
     .custom-alert-box-v { padding: 20px 30px; width: 90%; }
    }
   ` }} />
  </FrontendLayout>
 );
};

export default FrontendCheckout;
