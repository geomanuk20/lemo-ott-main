import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/coupons';

const EditCoupon = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  couponCode: '',
  couponPercentage: '',
  usersAllow: '',
  expiryDate: '',
  status: 'Active',
  showOnFrontend: 'ON'
 });

 useEffect(() => {
  const fetchCoupon = async () => {
   try {
    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();
    setFormData({
     couponCode: data.couponCode,
     couponPercentage: data.couponPercentage,
     usersAllow: data.usersAllow,
     expiryDate: data.expiryDate,
     status: data.status,
     showOnFrontend: data.showOnFrontend || 'ON'
    });
   } catch (err) {
    console.error('Error fetching coupon:', err);
    showNotification('Failed to load coupon data', 'error');
   } finally {
    setFetching(false);
   }
  };
  fetchCoupon();
 }, [id]);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
   code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  setFormData({ ...formData, couponCode: code });
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
   const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });

   if (response.ok) {
    showNotification('Coupon updated successfully');
    setTimeout(() => navigate('/admin/coupons'), 2000);
   } else {
    const data = await response.json();
    showNotification(data.message || 'Error updating coupon', 'error');
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
      <label>Coupon Code *</label>
      <div className="input-wrapper-v">
       <input 
        type="text" 
        name="couponCode" 
        value={formData.couponCode} 
        onChange={handleChange} 
        placeholder="PROMO2026"
        required 
       />
       <button type="button" className="generate-btn-v" onClick={generateCode}>
        Generate
       </button>
      </div>
     </div>

     <div className="form-row-v">
      <label>Coupon Percentage *</label>
      <div className="input-wrapper-v">
       <input 
        type="number" 
        name="couponPercentage" 
        value={formData.couponPercentage} 
        onChange={handleChange} 
        placeholder="10"
        required 
       />
      </div>
     </div>

     <div className="form-row-v">
      <label>Number of Users Allow *</label>
      <div className="input-wrapper-v">
       <input 
        type="number" 
        name="usersAllow" 
        value={formData.usersAllow} 
        onChange={handleChange} 
        placeholder="100"
        required 
       />
      </div>
     </div>

     <div className="form-row-v">
      <label>Expiry Date *</label>
      <div className="input-wrapper-v">
       <input 
        type="date" 
        name="expiryDate" 
        value={formData.expiryDate} 
        onChange={handleChange} 
        required 
       />
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

     <div className="form-row-v">
      <label>Show on Frontend</label>
      <div className="input-wrapper-v">
       <select name="showOnFrontend" value={formData.showOnFrontend} onChange={handleChange}>
        <option value="ON">ON (Show as available coupon on checkout)</option>
        <option value="OFF">OFF (Hide from checkout page)</option>
       </select>
       <p style={{ color: '#666', fontSize: '0.82rem', marginTop: '8px' }}>
        When ON, this coupon appears as a clickable tag on the frontend checkout page.
       </p>
      </div>
     </div>

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
    .form-row-v label { width: 220px; font-weight: 700; color: #eee; padding-top: 14px; font-size: 1rem; flex-shrink: 0; }
    
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
    
    .generate-btn-v { background: #b3d332; color: #fff; border: none; padding: 6px 15px; border-radius: 4px; font-weight: 700; font-size: 0.85rem; cursor: pointer; margin-top: 10px; transition: background 0.3s; }
    .generate-btn-v:hover { background: #14b072; }

    .form-actions-v { margin-left: 220px; margin-top: 15px; }
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

export default EditCoupon;
