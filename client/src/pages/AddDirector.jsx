import React, { useState, useRef } from 'react';
import { uploadToCloudinary } from '../utils/upload';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Loader from '../components/Loader';

const AddDirector = () => {
 const navigate = useNavigate();
 const fileInputRef = useRef(null);
 const dateInputRef = useRef(null);
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
  name: '',
  bio: '',
  placeOfBirth: '',
  birthday: '',
  image: '',
  status: 'Active'
 });

 const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
 };

 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
 };

 const handleEditorChange = (content) => {
  setFormData(prev => ({ ...prev, bio: content }));
 };

 const handleFileChange = async (e, field = 'logo') => {
  const file = e.target.files[0];
  if (!file) return;
  try {
   setLoading(true);
   const url = await uploadToCloudinary(file);
   if (url) {
    setFormData(prev => ({ ...prev, [field]: url }));
   } else {
    alert('Upload failed');
   }
  } catch (err) {
   alert('Error uploading file: ' + err.message);
  } finally {
   setLoading(false);
  }
 };

 const handleSave = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
   const response = await fetch('/api/directors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });
   if (response.ok) {
    navigate('/admin/cast-crew/directors');
   }
  } catch (err) {
   console.error('Error saving director:', err);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="add-actor-page">
   <div className="top-nav">
    <button className="back-link" onClick={() => navigate(-1)}>
     <ArrowLeft size={20} color="#b3d332" strokeWidth={3} />
     <span>Back</span>
    </button>
   </div>

   <form onSubmit={handleSave} className="actor-form">
    <div className="form-row-custom">
     <label>Director Name</label>
     <div className="input-col">
      <input 
       type="text" 
       name="name" 
       value={formData.name} 
       onChange={handleChange} 
       required 
      />
     </div>
    </div>

    <div className="form-row-custom">
     <label>Bio</label>
     <div className="input-col">
      <Editor
       apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
       init={{
        height: 300,
        menubar: true,
        plugins: [
         'advlist autolink lists link image charmap print preview anchor',
         'searchreplace visualblocks code fullscreen',
         'insertdatetime media table paste code help wordcount'
        ],
        toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
        skin: 'oxide-dark',
        content_css: 'dark'
       }}
       onEditorChange={handleEditorChange}
      />
     </div>
    </div>

    <div className="form-row-custom">
     <label>Place of Birth</label>
     <div className="input-col">
      <input 
       type="text" 
       name="placeOfBirth" 
       value={formData.placeOfBirth} 
       onChange={handleChange} 
      />
     </div>
    </div>

    <div className="form-row-custom">
     <label>Birthday</label>
     <div className="input-col">
      <div className="date-input-wrapper">
       <input 
        type="text" 
        value={formatDate(formData.birthday)} 
        placeholder="21 May 1960" 
        readOnly 
        className="date-display-input"
       />
       <input 
        type="date" 
        name="birthday" 
        value={formData.birthday} 
        onChange={handleChange} 
        className="hidden-date-input"
       />
      </div>
     </div>
    </div>

    <div className="form-row-custom">
     <label>Image</label>
     <div className="input-col">
      <div className="file-input-wrapper">
       <input 
        type="text" 
        value={formData.image ? 'Image Selected' : ''} 
        readOnly 
       />
       <button type="button" className="select-btn" onClick={() => fileInputRef.current.click()}>Select</button>
       <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept="image/*" 
        onChange={handleFileChange} 
       />
      </div>
      {formData.image && (
       <div className="preview-container">
        <img src={formData.image} alt="Preview" className="actor-preview-img" />
       </div>
      )}
      <p className="resolution-text">(Recommended resolution : 180x140)</p>
     </div>
    </div>

    <div className="form-footer">
     <button type="submit" className="save-btn-red" disabled={loading}>
      {loading ? <Loader size="small" inline={true} /> : 'Save'}
     </button>
    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-actor-page { padding: 20px 30px; animation: fadeIn 0.4s ease-out; }
    .top-nav { margin-bottom: 30px; }
    .back-link { background: none; border: none; display: flex; align-items: center; gap: 10px; color: #b3d332; font-weight: 800; font-size: 1.2rem; cursor: pointer; padding: 0; }
    
    .actor-form { max-width: 1200px; }
    .form-row-custom { display: flex; margin-bottom: 25px; align-items: flex-start; }
    .form-row-custom label { width: 220px; color: #fff; font-size: 1rem; font-weight: 600; padding-top: 12px; }
    .input-col { flex: 1; }
    
    .input-col input[type="text"] {
     width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 12px 20px; color: #fff; border-radius: 4px; outline: none; font-size: 1rem;
    }

    .date-input-wrapper { position: relative; width: 100%; }
    .date-display-input { width: 100%; background: #1a1a1a !important; border: 1px solid #333; padding: 12px 20px; color: #fff; border-radius: 4px; outline: none; font-size: 1rem; }
    .hidden-date-input { 
     position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
     opacity: 0; cursor: pointer; z-index: 2;
    }
    .hidden-date-input::-webkit-calendar-picker-indicator {
     position: absolute; top: 0; left: 0; width: 100%; height: 100%;
     cursor: pointer;
    }

    .file-input-wrapper { display: flex; gap: 0; }
    .file-input-wrapper input { border-top-right-radius: 0 !important; border-bottom-right-radius: 0 !important; }
    .select-btn { background: #333; color: #fff; border: 1px solid #333; padding: 0 25px; border-top-right-radius: 4px; border-bottom-right-radius: 4px; cursor: pointer; font-weight: 600; }
    
    .preview-container { margin-top: 15px; width: 120px; height: 150px; border-radius: 6px; overflow: hidden; border: 1px solid #333; background: #111; }
    .actor-preview-img { width: 100%; height: 100%; object-fit: cover; }
    
    .resolution-text { color: #666; font-size: 0.85rem; margin-top: 8px; font-weight: 500; }
    
    .form-footer { margin-top: 40px; }
    .save-btn-red { background: #b3d332; color: #fff; border: none; padding: 10px 40px; border-radius: 4px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: opacity 0.2s; }
    .save-btn-red:hover { opacity: 0.9; }
    .save-btn-red:disabled { opacity: 0.6; cursor: not-allowed; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
   ` }} />
  </div>
 );
};

export default AddDirector;
