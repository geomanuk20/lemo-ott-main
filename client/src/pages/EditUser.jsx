import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/users';

const EditUser = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const fileInputRef = useRef(null);
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(false);
 const [notification, setNotification] = useState(null);
 const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: '',
  image: '',
  expiryDate: '',
  subscriptionPlan: 'Basic Plan',
  status: 'Active',
  role: 'customer'
 });
 const [imagePreview, setImagePreview] = useState(null);
 const [currentBcrypt, setCurrentBcrypt] = useState('');

 useEffect(() => {
  const fetchUser = async () => {
   try {
    const response = await fetch(`${API_URL}/${id}`);
    const user = await response.json();
    if (user) {
     setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      image: user.profileImage || '',
      expiryDate: user.expiryDate || '',
      subscriptionPlan: user.subscriptionPlan || 'Basic Plan',
      status: user.status || 'Active',
      role: user.role || 'customer'
     });
     setCurrentBcrypt(user.password || '');
     if (user.profileImage) {
      const previewUrl = user.profileImage.startsWith('data:') || user.profileImage.startsWith('http') 
       ? user.profileImage 
       : `/uploads/${user.profileImage}`;
      setImagePreview(previewUrl);
     }
    }
   } catch (err) {
    console.error('Error fetching user:', err);
   } finally {
    setFetching(false);
   }
  };
  fetchUser();
 }, [id]);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
 };

 const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
   setFormData({ ...formData, profileImage: file });
   setImagePreview(URL.createObjectURL(file));
  }
 };

 const handleSave = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
   const data = new FormData();
   Object.keys(formData).forEach(key => {
    if (key === 'profileImage') {
     if (formData[key] instanceof File) {
      data.append('profileImage', formData[key]);
     }
    } else {
     data.append(key, formData[key]);
    }
   });

   const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    body: data // Use FormData for file upload
   });
   
   const responseData = await response.json().catch(() => ({ message: 'Server error' }));

   if (response.ok) {
    showNotification('User updated successfully');
    setTimeout(() => navigate('/admin/users/list'), 2000);
   } else {
    showNotification(responseData.message || 'Error updating user', 'error');
   }
  } catch (err) {
   console.error('Error updating user:', err);
   showNotification('Connection error or server timeout', 'error');
  } finally {
   setLoading(false);
  }
 };

 

 return (
  <div className="add-user-page">
   {notification && (
    <div className="custom-alert-box">
     <div className="alert-content">
      {notification.type === 'success' ? (
       <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
      ) : (
       <XCircle size={42} color="#ff4d4d" strokeWidth={2.5} />
      )}
      <span className="alert-text">{notification.message}</span>
     </div>
    </div>
   )}

   <div className="top-nav-alt">
    <button className="back-link-red" onClick={() => navigate(-1)}>
     <ArrowLeft size={18} strokeWidth={3} />
     <span>Back</span>
    </button>
   </div>

   <div className="form-container-premium">
    <form onSubmit={handleSave} className="premium-form-horizontal">
     <div className="form-row-premium">
      <label>Name</label>
      <div className="input-group-premium">
       <input 
        type="text" 
        name="name" 
        value={formData.name} 
        onChange={handleChange} 
        required 
       />
      </div>
     </div>

     <div className="form-row-premium">
      <label>Email</label>
      <div className="input-group-premium">
       <input 
        type="email" 
        name="email" 
        value={formData.email} 
        onChange={handleChange} 
        required 
       />
      </div>
     </div>

     <div className="form-row-premium">
      <label>Password</label>
      <div className="input-group-premium">
       <input 
        type="password" 
        name="password" 
        placeholder="Leave blank to keep current password"
        value={formData.password || ''} 
        onChange={handleChange} 
       />
      </div>
     </div>

     <div className="form-row-premium">
      <label>Current Password (Bcrypt)</label>
      <div className="input-group-premium">
       <input 
        type="text" 
        value={currentBcrypt} 
        readOnly
        style={{ color: '#888', background: '#111', cursor: 'not-allowed' }}
       />
      </div>
     </div>

     <div className="form-row-premium">
      <label>Phone</label>
      <div className="input-group-premium">
       <input 
        type="text" 
        name="phone" 
        value={formData.phone} 
        onChange={handleChange} 
       />
      </div>
     </div>

     <div className="form-row-premium">
      <label>Image</label>
      <div className="input-group-premium">
       {imagePreview && (
        <div className="image-preview-container-p">
         <img src={imagePreview} alt="Preview" />
        </div>
       )}
       <div className="file-picker-custom">
        <button type="button" className="choose-file-btn" onClick={() => fileInputRef.current.click()}>Choose file</button>
        <span className="file-name-label">{formData.image ? 'File Selected' : 'No file chosen'}</span>
        <input 
         type="file" 
         ref={fileInputRef} 
         hidden 
         accept="image/*"
         onChange={handleImageChange}
        />
       </div>
      </div>
     </div>

     <div className="form-row-premium">
      <label>Expiry Date</label>
      <div className="input-group-premium">
       <input 
        type="date" 
        name="expiryDate" 
        value={formData.expiryDate} 
        onChange={handleChange} 
        className="date-picker-alt"
       />
      </div>
     </div>

     <div className="form-row-premium">
      <label>Subscription Plan</label>
      <div className="input-group-premium">
       <select name="subscriptionPlan" value={formData.subscriptionPlan} onChange={handleChange}>
        <option value="Basic Plan">Basic Plan</option>
        <option value="Premium Plan">Premium Plan</option>
        <option value="Platinum Plan">Platinum Plan</option>
        <option value="Diamond Plan">Diamond Plan</option>
       </select>
      </div>
     </div>

     <div className="form-row-premium">
      <label>Role</label>
      <div className="input-group-premium">
       <select name="role" value={formData.role} onChange={handleChange}>
        <option value="customer">Customer (Default)</option>
        <option value="subscriber">Subscriber (Premium)</option>
        <option value="admin">Administrator</option>
        <option value="sub-admin">Sub Admin</option>
       </select>
      </div>
     </div>

     <div className="form-row-premium">
      <label>Status</label>
      <div className="input-group-premium">
       <select name="status" value={formData.status} onChange={handleChange}>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
       </select>
      </div>
     </div>

     <div className="form-row-premium">
      <label></label>
      <div className="input-group-premium">
       <button type="submit" className="save-btn-solid-red" disabled={loading}>
        {loading ? <Loader size="small" inline={true} /> : 'Save'}
       </button>
      </div>
     </div>
    </form>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-user-page { padding: 25px; max-width: 850px; margin: 0 auto; box-sizing: border-box; width: 100%; animation: fadeIn 0.4s ease-out; }
    .top-nav-alt { margin-bottom: 25px; }
    .back-link-red { background: none; border: none; display: flex; align-items: center; gap: 8px; color: #b3d332; font-weight: 800; font-size: 1.1rem; cursor: pointer; padding: 0; }
    
    .form-container-premium { background: #0a0a0a; border: 1px solid #1f242d; border-radius: 12px; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); width: 100%; box-sizing: border-box; }
    .premium-form-horizontal { display: flex; flex-direction: column; gap: 18px; width: 100%; box-sizing: border-box; }

    .form-row-premium { display: flex; align-items: center; width: 100%; box-sizing: border-box; }
    .form-row-premium label { width: 200px; color: #e2e8f0; font-size: 0.95rem; font-weight: 600; flex-shrink: 0; }
    .input-group-premium { flex: 1; width: 100%; box-sizing: border-box; }
    
    .input-group-premium input, .input-group-premium select { width: 100%; background: #14171d; border: 1px solid #282f3a; padding: 12px 15px; color: #fff; border-radius: 6px; outline: none; font-size: 0.95rem; box-sizing: border-box; transition: border-color 0.2s; }
    .input-group-premium input:focus, .input-group-premium select:focus { border-color: #b3d332; }
    .input-group-premium select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 15px center; background-size: 18px; }
    
    .file-picker-custom { display: flex; align-items: center; gap: 12px; background: #14171d; border: 1px solid #282f3a; padding: 6px 12px; border-radius: 6px; box-sizing: border-box; }
    .choose-file-btn { background: #e2e8f0; color: #0f172a; border: none; padding: 7px 14px; border-radius: 4px; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
    .file-name-label { color: #8895a5; font-size: 0.88rem; }
    .image-preview-container-p { margin-bottom: 12px; width: 100px; height: 100px; border-radius: 12px; overflow: hidden; border: 2px solid #282f3a; background: #111; }
    .image-preview-container-p img { width: 100%; height: 100%; object-fit: cover; }
    
    .save-btn-solid-red { background: #b3d332; color: #111; border: none; padding: 12px 36px; border-radius: 6px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: background 0.2s; }
    .save-btn-solid-red:hover { background: #9ebf24; }

    .loader-container { height: 40vh; display: flex; align-items: center; justify-content: center; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 25px 50px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    @media (max-width: 768px) {
      .add-user-page { padding: 15px 10px 40px 10px; }
      .form-container-premium { padding: 18px 14px; border-radius: 10px; }
      .form-row-premium { flex-direction: column; align-items: flex-start; gap: 6px; }
      .form-row-premium label { width: 100%; font-size: 0.9rem; }
      .input-group-premium { width: 100%; }
      .save-btn-solid-red { width: 100%; padding: 14px; font-size: 1rem; }
    }
   ` }} />
  </div>
 );
};

export default EditUser;
