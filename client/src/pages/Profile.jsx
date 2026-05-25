import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/profile';

const Profile = () => {
 const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: '',
  password: ''
 });
 const [profileImage, setProfileImage] = useState(null);
 const [previewUrl, setPreviewUrl] = useState('https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop');
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [notification, setNotification] = useState(null);

 useEffect(() => {
  fetchProfile();
 }, []);

 const fetchProfile = async () => {
  try {
   const user = JSON.parse(localStorage.getItem('user') || '{}');
   if (!user.id) return;

   const response = await fetch(`/api/users/${user.id}`);
   const data = await response.json();
   if (response.ok) {
    setFormData({
     name: data.name || '',
     email: data.email || '',
     phone: data.phone || '',
     password: ''
    });
    if (data.profileImage) {
     setPreviewUrl(data.profileImage);
    }
   }
  } catch (err) {
   console.error('Error fetching profile:', err);
  } finally {
   setLoading(false);
  }
 };

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
   setProfileImage(file);
   setPreviewUrl(URL.createObjectURL(file));
  }
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
   showNotification('User session expired. Please login again.', 'error');
   setSaving(false);
   return;
  }

  const data = new FormData();
  data.append('name', formData.name);
  data.append('email', formData.email);
  data.append('phone', formData.phone);
  if (formData.password) {
   data.append('password', formData.password);
  }
  if (profileImage) {
   data.append('profileImage', profileImage);
  }

  try {
   // Use the robust users/:id route instead of the generic profile route
   const response = await fetch(`/api/users/${user.id}`, {
    method: 'PUT',
    body: data
   });

   if (response.ok) {
    const updatedUser = await response.json();
    showNotification('Profile updated successfully');
    
    // Update localStorage with NEW data
    const newUserObj = {
     id: updatedUser._id,
     name: updatedUser.name,
     email: updatedUser.email,
     role: updatedUser.role,
     profileImage: updatedUser.profileImage
    };
    localStorage.setItem('user', JSON.stringify(newUserObj));
    
    // Update local state
    if (updatedUser.profileImage) {
     setPreviewUrl(updatedUser.profileImage);
    }
    
    // Dispatch custom event to notify Sidebar/Header to refresh
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('profileUpdate'));
   } else {
    const errorData = await response.json();
    showNotification(errorData.message || 'Error updating profile', 'error');
   }
  } catch (err) {
   console.error('Error updating profile:', err);
   showNotification('Connection error', 'error');
  } finally {
   setSaving(false);
  }
 };

 if (loading) {
  return (
   <div className="profile-loading">
    <Loader size="small" />
   </div>
  );
 }

 return (
  <div className="profile-page-container">
    {notification && (
     <div className={`custom-alert-box ${notification.type}`}>
      <div className="alert-content">
       {notification.type === 'success' ? (
        <CheckCircle2 size={20} strokeWidth={2.5} />
       ) : (
        <XCircle size={20} strokeWidth={2.5} />
       )}
       <span className="alert-text">{notification.message}</span>
      </div>
     </div>
    )}

   <div className="profile-inner-box">
    <form onSubmit={handleSubmit} className="profile-layout">
     {/* Left Side - Image Preview */}
     <div className="profile-image-section">
      <div className="image-preview-box">
       <img 
        src={previewUrl} 
        alt="Profile Preview" 
       />
      </div>
     </div>

     {/* Right Side - Form Fields */}
     <div className="profile-form-section">
      <div className="form-row">
       <label>Profile Image</label>
       <div className="input-field-wrapper file-input">
        <input 
         type="file" 
         id="profile-upload" 
         hidden 
         onChange={handleImageChange}
         accept="image/*"
        />
        <label htmlFor="profile-upload" className="custom-file-btn">Choose file</label>
        <span className="file-status">
         {profileImage ? profileImage.name : 'No file chosen'}
        </span>
       </div>
      </div>

      <div className="form-row">
       <label>Name *</label>
       <div className="input-field-wrapper">
        <input 
         type="text" 
         name="name" 
         value={formData.name} 
         onChange={handleChange}
         required
        />
       </div>
      </div>

      <div className="form-row">
       <label>Email *</label>
       <div className="input-field-wrapper">
        <input 
         type="email" 
         name="email" 
         value={formData.email} 
         onChange={handleChange}
         required
        />
       </div>
      </div>

      <div className="form-row">
       <label>Phone</label>
       <div className="input-field-wrapper">
        <input 
         type="text" 
         name="phone" 
         value={formData.phone} 
         onChange={handleChange}
        />
       </div>
      </div>

      <div className="form-row">
       <label>Password*</label>
       <div className="input-field-wrapper">
        <input 
         type="password" 
         name="password" 
         placeholder="Leave blank to keep current"
         value={formData.password} 
         onChange={handleChange}
        />
       </div>
      </div>

      <div className="form-actions">
       <button type="submit" className="save-btn-red" disabled={saving}>
        {saving ? (
         <>
          <Loader size="small" inline={true} />
          <span>Saving...</span>
         </>
        ) : 'Save'}
       </button>
      </div>
     </div>
    </form>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .profile-page-container {
     padding: 10px;
     animation: fadeIn 0.4s ease-out;
    }

    .profile-loading {
     display: flex;
     justify-content: center;
     align-items: center;
     height: 400px;
    }

    .spinner {
     animation: spin 1s linear infinite;
    }

    @keyframes spin {
     from { transform: rotate(0deg); }
     to { transform: rotate(360deg); }
    }

    .custom-alert-box { 
     position: fixed; 
     bottom: 40px; 
     left: 50%; 
     transform: translateX(-50%); 
     background: #b3d332; 
     color: #fff; 
     padding: 12px 25px; 
     border-radius: 50px; 
     display: flex; 
     align-items: center; 
     justify-content: center;
     z-index: 9999; 
     box-shadow: 0 15px 30px rgba(0,0,0,0.4); 
     animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
     border: 1px solid rgba(255,255,255,0.25);
    }
    .custom-alert-box.error { 
     background: #ff4d4d; 
    }
    .alert-content { 
     display: flex; 
     align-items: center; 
     gap: 12px; 
    }
    .alert-text { 
     color: #fff; 
     font-size: 1rem; 
     font-weight: 700; 
     text-align: center; 
     letter-spacing: -0.2px;
    }
    
    @keyframes slideUp { 
     from { transform: translate(-50%, 20px); opacity: 0; } 
     to { transform: translate(-50%, 0); opacity: 1; } 
    }

    .profile-inner-box {
     background-color: #111;
     border-radius: 8px;
     padding: 50px 40px;
     border: 1px solid #222;
    }

    .profile-layout {
     display: flex;
     gap: 60px;
    }

    .image-preview-box {
     width: 130px;
     height: 140px;
     border: 4px solid #fff;
     border-radius: 4px;
     overflow: hidden;
     background: #000;
    }

    .image-preview-box img {
     width: 100%;
     height: 100%;
     object-fit: cover;
    }

    .form-row {
     display: flex;
     align-items: center;
     margin-bottom: 25px;
    }

    .form-row label {
     width: 200px;
     color: #fff;
     font-weight: 700;
     font-size: 1.1rem;
    }

    .input-field-wrapper input {
     width: 100%;
     background: #2a2a2a;
     border: none;
     padding: 15px 20px;
     border-radius: 4px;
     color: #fff;
     font-size: 1.05rem;
     outline: none;
    }

    .file-input {
     display: flex;
     align-items: center;
     background: #2a2a2a;
     padding: 8px 12px;
     border-radius: 4px;
    }

    .custom-file-btn {
     background: #e9e9e9;
     color: #000;
     padding: 6px 14px;
     border-radius: 2px;
     font-size: 1.1rem;
     font-weight: 800;
     cursor: pointer;
     margin-right: 15px;
     border: 1px solid #999;
    }

    .file-status {
     color: #ffffff;
     font-size: 1.1rem;
     font-weight: 700;
    }

    .save-btn-red {
     background-color: #b3d332;
     color: white;
     border: none;
     padding: 10px 35px;
     border-radius: 4px;
     font-weight: 700;
     font-size: 1.1rem;
     cursor: pointer;
     display: flex;
     align-items: center;
     gap: 10px;
    }

    .save-btn-red:disabled {
     opacity: 0.7;
     cursor: not-allowed;
    }

    @keyframes fadeIn {
     from { opacity: 0; transform: translateY(10deg); }
     to { opacity: 1; transform: translateY(0); }
    }
   ` }} />
  </div>
 );
};

export default Profile;
