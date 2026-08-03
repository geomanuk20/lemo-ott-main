import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/subscription-plans';

const AddSubscriptionPlan = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  planName: '',
  durationValue: '',
  durationUnit: 'Day(s)',
  price: '',
  deviceLimit: '1',
  ads: 'ON',
  streamingQuality: 'HD',
  status: 'Active',
  getStarted: 'ON'
 });

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const isPriceFreeOrNan = !formData.price || parseFloat(formData.price) === 0 || isNaN(parseFloat(formData.price));

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const payload = {
   planName: formData.planName,
   duration: `${formData.durationValue} ${formData.durationUnit}`,
   price: `₹ ${parseFloat(formData.price).toFixed(2)}`,
   deviceLimit: formData.deviceLimit,
   ads: formData.ads,
   streamingQuality: formData.streamingQuality,
   status: formData.status,
   getStarted: isPriceFreeOrNan ? (formData.getStarted || 'ON') : 'ON'
  };

  try {
   const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
   });

   if (response.ok) {
    showNotification('Plan added successfully');
    setTimeout(() => navigate('/admin/subscription-plan'), 2000);
   } else {
    const data = await response.json();
    showNotification(data.message || 'Error adding plan', 'error');
   }
  } catch (err) {
   console.error('Error:', err);
   showNotification('Something went wrong', 'error');
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="add-plan-page">
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

   <div className="top-nav-v">
    <button className="back-link-red-v" onClick={() => navigate(-1)}>
     <ArrowLeft size={18} strokeWidth={3} />
     <span>Back</span>
    </button>
   </div>

   <div className="form-container-v">
    <form onSubmit={handleSubmit} className="premium-form-v">
     
     <div className="form-row-v">
      <label>Plan Name *</label>
      <div className="input-wrapper-v">
       <input 
        type="text" 
        name="planName" 
        value={formData.planName} 
        onChange={handleChange} 
        placeholder="Basic Plan"
        required 
       />
      </div>
     </div>

     <div className="form-row-v">
      <label>Duration *</label>
      <div className="input-row-v">
       <div className="input-wrapper-v half">
        <input 
         type="number" 
         name="durationValue" 
         value={formData.durationValue} 
         onChange={handleChange} 
         placeholder="7"
         required 
        />
       </div>
       <div className="input-wrapper-v half">
        <select name="durationUnit" value={formData.durationUnit} onChange={handleChange}>
         <option value="Day(s)">Day(s)</option>
         <option value="Month(s)">Month(s)</option>
         <option value="Year(s)">Year(s)</option>
        </select>
       </div>
      </div>
     </div>

     <div className="form-row-v">
      <label>Price *</label>
      <div className="input-wrapper-v">
       <input 
        type="number" 
        step="0.01" 
        name="price" 
        value={formData.price} 
        onChange={handleChange} 
        placeholder="9.99"
        required 
       />
       <p className="helper-text-v">
        The minimum amount for processing a transaction through Stripe in INR is ₹ 50.00. For more info <a href="#">click here</a>
       </p>
      </div>
     </div>

     <div className="form-row-v">
      <label>Device Limit *</label>
      <div className="input-wrapper-v">
       <input 
        type="number" 
        name="deviceLimit" 
        value={formData.deviceLimit} 
        onChange={handleChange} 
        placeholder="1"
        required 
       />
      </div>
     </div>

     <div className="form-row-v">
      <label>Ads</label>
      <div className="input-wrapper-v">
       <select name="ads" value={formData.ads} onChange={handleChange}>
        <option value="ON">ON</option>
        <option value="OFF">OFF</option>
       </select>
      </div>
     </div>

     <div className="form-row-v">
      <label>Streaming Quality</label>
      <div className="input-wrapper-v">
       <select name="streamingQuality" value={formData.streamingQuality} onChange={handleChange}>
        <option value="SD">SD</option>
        <option value="HD">HD</option>
        <option value="720p">720p</option>
        <option value="1080p (Full HD)">1080p (Full HD)</option>
        <option value="2K">2K</option>
        <option value="4K (Ultra HD)">4K (Ultra HD)</option>
        <option value="8K">8K</option>
        <option value="Auto">Auto</option>
       </select>
      </div>
     </div>

     <div className="form-row-v">
      <label>Status</label>
      <div className="input-wrapper-v">
       <select name="status" value={formData.status} onChange={handleChange}>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
       </select>
      </div>
     </div>

     {isPriceFreeOrNan && (
      <div className="form-row-v">
       <label>Get Started Option</label>
       <div className="input-wrapper-v">
        <select name="getStarted" value={formData.getStarted} onChange={handleChange}>
         <option value="ON">ON</option>
         <option value="OFF">OFF</option>
        </select>
       </div>
      </div>
     )}

     <div className="form-actions-v">
      <button type="submit" className="save-btn-v" disabled={loading}>
       {loading ? <Loader size="small" inline={true} /> : 'Save'}
      </button>
     </div>

    </form>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-plan-page { background: #000; min-height: 100vh; padding: 30px 40px; color: #fff; animation: fadeIn 0.4s ease; box-sizing: border-box; width: 100%; overflow-x: hidden; }
    
    .top-nav-v { margin-bottom: 30px; }
    .back-link-red-v { background: none; border: none; color: #b3d332; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.1rem; cursor: pointer; padding: 0; }
    
    .form-container-v { max-width: 850px; margin: 0; width: 100%; box-sizing: border-box; }
    .premium-form-v { display: flex; flex-direction: column; gap: 22px; width: 100%; box-sizing: border-box; }
    
    .form-row-v { display: flex; align-items: flex-start; width: 100%; box-sizing: border-box; }
    .form-row-v label { width: 200px; font-weight: 700; color: #eee; padding-top: 12px; font-size: 0.95rem; flex-shrink: 0; }
    
    .input-wrapper-v { flex: 1; position: relative; width: 100%; box-sizing: border-box; }
    .input-wrapper-v input, .input-wrapper-v select { 
     width: 100%; 
     background: #14171d; 
     border: 1px solid #282f3a; 
     padding: 12px 16px; 
     border-radius: 6px; 
     color: #fff; 
     outline: none; 
     font-size: 0.95rem; 
     transition: all 0.2s;
     box-sizing: border-box;
    }
    .input-wrapper-v input:focus, .input-wrapper-v select:focus { border-color: #b3d332; background: #1a1e26; }
    
    .input-row-v { display: flex; gap: 15px; width: 100%; box-sizing: border-box; }
    .input-wrapper-v.half { flex: 1; min-width: 0; }

    .helper-text-v { font-size: 0.85rem; color: #8895a5; margin-top: 8px; line-height: 1.5; }
    .helper-text-v a { color: #3b82f6; text-decoration: none; font-weight: 700; }

    .form-actions-v { margin-left: 200px; margin-top: 10px; width: calc(100% - 200px); box-sizing: border-box; }
    .save-btn-v { background: #b3d332; color: #111; border: none; padding: 12px 36px; border-radius: 6px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(179,211,50,0.2); }
    .save-btn-v:hover { background: #9ebf24; transform: translateY(-1px); }
    .save-btn-v:disabled { background: #555; color: #888; cursor: not-allowed; box-shadow: none; }

    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Notification */
    .custom-alert-box-v { position: fixed; top: 40px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 30px 60px; z-index: 9999; box-shadow: 0 20px 50px rgba(0,0,0,0.6); border: 1px solid #333; animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content-v { display: flex; flex-direction: column-v; align-items: center; gap: 15px; }
    .alert-text-v { color: #fff; font-size: 1.2rem; font-weight: 800; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -150%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    @media (max-width: 768px) {
      .add-plan-page { padding: 15px 10px 50px 10px; }
      .form-row-v { flex-direction: column; align-items: flex-start; gap: 6px; }
      .form-row-v label { width: 100%; padding-top: 0; font-size: 0.9rem; }
      .input-wrapper-v { width: 100%; }
      .input-row-v { flex-direction: row; width: 100%; gap: 10px; }
      .form-actions-v { margin-left: 0; margin-top: 15px; width: 100%; }
      .save-btn-v { width: 100%; padding: 14px; font-size: 1rem; }
    }
   ` }} />
  </div>
 );
};

export default AddSubscriptionPlan;
