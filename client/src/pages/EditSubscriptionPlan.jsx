import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = 'http://localhost:5001/api/subscription-plans';

const EditSubscriptionPlan = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(false);
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

 useEffect(() => {
  const fetchPlan = async () => {
   try {
    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();
    
    // Parse duration (e.g., "7 Day(s)")
    const durationParts = data.duration.split(' ');
    
    setFormData({
     planName: data.planName,
     durationValue: durationParts[0],
     durationUnit: durationParts.slice(1).join(' '),
     price: data.price.replace(/[^\d.]/g, ''), // Strip currency symbol
     deviceLimit: data.deviceLimit,
     ads: data.ads,
     streamingQuality: data.streamingQuality || 'HD',
     status: data.status,
     getStarted: data.getStarted || 'ON'
    });
   } catch (err) {
    console.error('Error fetching plan:', err);
    showNotification('Failed to load plan data', 'error');
   } finally {
    setFetching(false);
   }
  };
  fetchPlan();
 }, [id]);

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
   const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
   });

   if (response.ok) {
    showNotification('Plan updated successfully');
    setTimeout(() => navigate('/admin/subscription-plan'), 2000);
   } else {
    const data = await response.json();
    showNotification(data.message || 'Error updating plan', 'error');
   }
  } catch (err) {
   console.error('Error:', err);
   showNotification('Something went wrong', 'error');
  } finally {
   setLoading(false);
  }
 };

 if (fetching) {
  return (
   <div className="loading-container-v">
    <Loader size="small" />
   </div>
  );
 }

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
    .add-plan-page { background: #000; min-height: 100vh; padding: 40px 60px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    
    .top-nav-v { margin-bottom: 40px; }
    .back-link-red-v { background: none; border: none; color: #b3d332; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.2rem; cursor: pointer; }
    
    .form-container-v { max-width: 1000px; margin: 0; }
    .premium-form-v { display: flex; flex-direction: column; gap: 30px; }
    
    .form-row-v { display: flex; align-items: flex-start; }
    .form-row-v label { width: 180px; font-weight: 700; color: #eee; padding-top: 14px; font-size: 1rem; flex-shrink: 0; }
    
    .input-wrapper-v { flex: 1; position: relative; }
    .input-wrapper-v input, .input-wrapper-v select { 
     width: 100%; 
     background: #25272b; 
     border: 1px solid #333; 
     padding: 14px 18px; 
     border-radius: 6px; 
     color: #fff; 
     outline: none; 
     font-size: 1rem; 
     transition: all 0.2s;
    }
    .input-wrapper-v input:focus, .input-wrapper-v select:focus { border-color: #444; background: #2a2d32; }
    
    .input-row-v { display: flex; gap: 20px; width: 100%; }
    .input-wrapper-v.half { flex: 1; }

    .helper-text-v { font-size: 0.85rem; color: #777; margin-top: 10px; line-height: 1.5; }
    .helper-text-v a { color: #0088ff; text-decoration: none; font-weight: 700; }

    .form-actions-v { margin-left: 180px; margin-top: 15px; }
    .save-btn-v { background: #b3d332; color: #fff; border: none; padding: 12px 30px; border-radius: 4px; font-weight: 800; font-size: 1.05rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(179,211,50,0.2); }
    .save-btn-v:hover { background: #b3d332; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(179,211,50,0.3); }
    .save-btn-v:disabled { background: #555; cursor: not-allowed; box-shadow: none; }

    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Notification */
    .custom-alert-box-v { position: fixed; top: 40px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 30px 60px; z-index: 9999; box-shadow: 0 20px 50px rgba(0,0,0,0.6); border: 1px solid #333; animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content-v { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text-v { color: #fff; font-size: 1.2rem; font-weight: 800; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -150%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
   ` }} />
  </div>
 );
};

export default EditSubscriptionPlan;
