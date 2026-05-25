import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, UserCircle } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/users';

const EditAdmin = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(false);
 const [notification, setNotification] = useState(null);
 const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'sub-admin',
  status: 'Active',
  profileImage: null
 });
 const [imagePreview, setImagePreview] = useState(null);

 const fetchAdmin = async () => {
  try {
   const response = await fetch(`${API_URL}/${id}`);
   const data = await response.json();
   if (response.ok) {
    setFormData({
     name: data.name || '',
     email: data.email || '',
     password: '', // Don't fetch password
     phone: data.phone || '',
     role: data.role || 'sub-admin',
     status: data.status || 'Active',
     profileImage: null
    });
    if (data.profileImage) {
     setImagePreview(data.profileImage.startsWith('http') ? data.profileImage : `/uploads/${data.profileImage}`);
    }
   }
  } catch (err) {
   console.error('Error fetching admin:', err);
  } finally {
   setFetching(false);
  }
 };

 useEffect(() => {
  fetchAdmin();
 }, [id]);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
 };

 const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
   setFormData(prev => ({ ...prev, profileImage: file }));
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
     // Only append if it's a new file (File object)
     if (formData[key] instanceof File) {
      data.append('profileImage', formData[key]);
     }
    } else if (key === 'password') {
     if (formData[key]) data.append('password', formData[key]);
    } else {
     data.append(key, formData[key]);
    }
   });

   const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    body: data
   });

   const responseData = await response.json().catch(() => ({ 
    message: `Server error occurred (Status: ${response.status})` 
   }));

   if (response.ok) {
    showNotification('Admin updated successfully!', 'success');
    setTimeout(() => navigate('/admin/users/sub-admin'), 1500);
   } else {
    showNotification(responseData.message || 'Error updating admin', 'error');
   }
  } catch (err) {
   console.error('Error updating admin:', err);
   showNotification('Connection error or server timeout', 'error');
  } finally {
   setLoading(false);
  }
 };

 

 return (
  <div className="add-admin-page">
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

   <div className="admin-form-container-p">
    <button className="back-btn-red-p" onClick={() => navigate(-1)}>
     <ArrowLeft size={18} strokeWidth={3} />
     <span>Back</span>
    </button>

    <form onSubmit={handleSave} className="premium-admin-form">
     <div className="form-group-p">
      <label>Name*</label>
      <input 
       type="text" 
       name="name"
       required 
       value={formData.name}
       onChange={handleInputChange}
       className="admin-input-p"
      />
     </div>

     <div className="form-group-p">
      <label>Email*</label>
      <input 
       type="email" 
       name="email"
       required 
       value={formData.email}
       onChange={handleInputChange}
       className="admin-input-p"
      />
     </div>

     <div className="form-group-p">
      <label>Password</label>
      <input 
       type="password" 
       name="password"
       placeholder="Leave blank to keep current"
       value={formData.password}
       onChange={handleInputChange}
       className="admin-input-p"
      />
     </div>

     <div className="form-group-p">
      <label>Phone</label>
      <input 
       type="text" 
       name="phone"
       value={formData.phone}
       onChange={handleInputChange}
       className="admin-input-p"
      />
     </div>

     <div className="form-group-p">
      <label>Image</label>
      <div className="image-edit-wrapper-p">
       <div className="admin-image-preview-p">
        {imagePreview ? (
         <img src={imagePreview} alt="Admin Preview" />
        ) : (
         <div className="avatar-placeholder-p">
          <UserCircle size={45} color="#333" />
         </div>
        )}
       </div>
       <div className="file-input-wrapper-p">
        <input 
         type="file" 
         accept="image/*"
         onChange={handleFileChange}
         className="admin-file-input-p"
        />
       </div>
      </div>
     </div>

     <div className="form-group-p">
      <label>Admin Type</label>
      <select 
       name="role"
       value={formData.role}
       onChange={handleInputChange}
       className="admin-select-p"
      >
       <option value="sub-admin">Sub Admin</option>
       <option value="admin">Master Admin</option>
      </select>
     </div>

     <div className="permission-info-p">
      <p className="permission-title">Permission for {formData.role === 'admin' ? 'Master Admin' : 'Sub Admin'}</p>
      <p className="permission-list">
       {formData.role === 'admin' 
        ? '(All Permission)' 
        : '(Language, Genres, Movies, New Release, TV Shows, Seasons, Episodes, Sports Category, Sports Video, Cast & Crew, Slider, Home Section)'}
      </p>
     </div>

     <div className="form-group-p">
      <label>Status</label>
      <select 
       name="status"
       value={formData.status}
       onChange={handleInputChange}
       className="admin-select-p"
      >
       <option value="Active">Active</option>
       <option value="Inactive">Inactive</option>
      </select>
     </div>

     <div className="form-actions-p">
      <button type="submit" className="save-btn-red-p" disabled={loading}>
       {loading ? <Loader size="small" inline={true} /> : 'Save Changes'}
      </button>
     </div>
    </form>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-admin-page { padding: 40px; animation: fadeIn 0.4s ease-out; background: #000; min-height: 100vh; }
    .admin-form-container-p { max-width: 900px; margin: 0 auto; background: #0a0a0a; border: 1px solid #222; border-radius: 12px; padding: 40px; position: relative; }
    .back-btn-red-p { display: flex; align-items: center; gap: 8px; color: #b3d332; background: none; border: none; font-weight: 700; cursor: pointer; margin-bottom: 30px; font-size: 1.1rem; padding: 0; transition: transform 0.2s; }
    .premium-admin-form { display: flex; flex-direction: column; gap: 25px; }
    .form-group-p { display: grid; grid-template-columns: 180px 1fr; align-items: center; gap: 20px; }
    .form-group-p label { color: #fff; font-size: 0.95rem; font-weight: 600; }
    .admin-input-p, .admin-select-p { background: #1a1a1a; border: 1px solid #333; padding: 12px 15px; color: #fff; border-radius: 6px; outline: none; font-size: 0.95rem; }
    
    .image-edit-wrapper-p { display: flex; align-items: center; gap: 20px; }
    .admin-image-preview-p { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid #333; display: flex; align-items: center; justify-content: center; background: #111; }
    .admin-image-preview-p img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-placeholder-p { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
    .file-input-wrapper-p { flex: 1; background: #1a1a1a; border: 1px solid #333; border-radius: 6px; padding: 8px 12px; }
    .admin-file-input-p { color: #888; cursor: pointer; width: 100%; }

    .permission-info-p { margin: 10px 0 10px 200px; }
    .permission-title { color: #fff; font-weight: 700; font-size: 0.95rem; margin-bottom: 5px; }
    .permission-list { color: #666; font-size: 0.85rem; line-height: 1.4; }

    .form-actions-p { margin-left: 200px; margin-top: 10px; }
    .save-btn-red-p { background: #b3d332; color: #fff; border: none; padding: 12px 40px; border-radius: 6px; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; min-width: 120px; }
    
    .loader-container-p { height: 60vh; display: flex; align-items: center; justify-content: center; }
    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 25px 50px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 768px) {
     .form-group-p { grid-template-columns: 1fr; gap: 8px; }
     .permission-info-p, .form-actions-p { margin-left: 0; }
     .image-edit-wrapper-p { flex-direction: column; align-items: flex-start; }
    }
   ` }} />
  </div>
 );
};

export default EditAdmin;
