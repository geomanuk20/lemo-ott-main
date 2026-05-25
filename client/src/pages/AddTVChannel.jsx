import React, { useState, useRef, useEffect } from 'react';
import { uploadToCloudinary } from '../utils/upload';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, ChevronDown } from 'lucide-react';
import Loader from '../components/Loader';
import { Editor } from '@tinymce/tinymce-react';

const AddTVChannel = () => {
 const navigate = useNavigate();
 const logoInputRef = useRef(null);
 const [loading, setLoading] = useState(false);
 const [categories, setCategories] = useState([]);
 const [formData, setFormData] = useState({
  name: '',
  description: '',
  category: '',
  tvAccess: 'Paid',
  status: 'Active',
  streamType: 'HLS/m3u8 / MPEG-DASH / YouTube / Vimeo',
  server1Url: '',
  server2Url: '',
  server3Url: '',
  embedCode: '',
  logo: '',
  seoTitle: '',
  metaDescription: '',
  keywords: ''
 });

 useEffect(() => {
  const fetchCategories = async () => {
   try {
    const response = await fetch('/api/tv-categories');
    const data = await response.json();
    setCategories(data);
   } catch (err) {
    console.error('Error fetching categories:', err);
   }
  };
  fetchCategories();
 }, []);

 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
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
  
  // Construct the payload to match the model
  const payload = {
   ...formData,
   server1Url: formData.server1Url // Ensure required field is present
  };

  try {
   const response = await fetch('/api/tv-channels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
   });
   if (response.ok) {
    navigate('/admin/live-tv/channel');
   }
  } catch (err) {
   console.error('Error saving channel:', err);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="add-channel-page">
   <div className="top-nav">
    <button className="back-btn" onClick={() => navigate(-1)}>
     <ArrowLeft size={18} color="#b3d332" strokeWidth={4} />
     <span>Back</span>
    </button>
   </div>

   <form onSubmit={handleSave} className="channel-form">
    <div className="form-container">
     {/* Left Column: Live TV Info */}
     <div className="form-column">
      <h2 className="section-title">Live TV Info</h2>
      
      <div className="form-group row">
       <label>TV Name*</label>
       <input 
        type="text" 
        name="name" 
        value={formData.name} 
        onChange={handleChange} 
        required 
        className="dark-input"
       />
      </div>

      <div className="form-group">
       <label>Description</label>
       <div className="rich-text-container">
        <Editor
         apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
         onEditorChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
         value={formData.description}
         init={{
          height: 350,
          menubar: true,
          plugins: [
           'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
           'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
           'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | bold italic forecolor | ' +
           'alignleft aligncenter alignright alignjustify | ' +
           'bullist numlist outdent indent | removeformat | help',
          content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px; background-color: #1b2635; color: #fff; }',
          skin: 'oxide-dark',
          content_css: 'dark',
          toolbar_mode: 'sliding',
          branding: false,
          statusbar: true,
         }}
        />
       </div>
      </div>

      <div className="form-group row">
       <label>TV Access</label>
       <div className="select-wrapper">
        <select name="tvAccess" value={formData.tvAccess} onChange={handleChange}>
         <option value="Paid">Paid</option>
         <option value="Free">Free</option>
        </select>
        <ChevronDown className="select-arrow" size={16} />
       </div>
      </div>

      <div className="form-group row">
       <label>TV Category*</label>
       <div className="select-wrapper">
        <select name="category" value={formData.category} onChange={handleChange} required>
         <option value="">Select Category</option>
         {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
        </select>
        <ChevronDown className="select-arrow" size={16} />
       </div>
      </div>

      <div className="form-group row">
       <label>Status</label>
       <div className="select-wrapper">
        <select name="status" value={formData.status} onChange={handleChange}>
         <option value="Active">Active</option>
         <option value="Inactive">Inactive</option>
        </select>
        <ChevronDown className="select-arrow" size={16} />
       </div>
      </div>
     </div>

     {/* Right Column: Thumb & URL and SEO */}
     <div className="form-column">
      <h2 className="section-title">Thumb & URL</h2>
      
      <div className="form-group">
       <label>Stream Type</label>
       <div className="select-wrapper full">
        <select name="streamType" value={formData.streamType} onChange={handleChange}>
         <option value="HLS/m3u8 / MPEG-DASH / YouTube / Vimeo">HLS/m3u8 / MPEG-DASH / YouTube / Vimeo</option>
         <option value="Embed Code">Embed Code</option>
        </select>
        <ChevronDown className="select-arrow" size={16} />
       </div>
       <p className="hint-text">(Supported : MP4, YouTube, Vimeo, HLS / m3u8 URL. If you are using external files then those files have to be CORS enabled otherwise they will not work.)</p>
      </div>

      {formData.streamType === 'Embed Code' ? (
       <div className="form-group">
        <label>Embed Code*</label>
        <textarea 
         name="embedCode" 
         value={formData.embedCode} 
         onChange={handleChange} 
         required 
         className="dark-textarea"
         placeholder="Paste your iframe or embed code here..."
         style={{ height: '150px' }}
        />
       </div>
      ) : (
       <>
        <div className="form-group row">
         <label>Server 1 URL*</label>
         <input 
          type="text" 
          name="server1Url" 
          value={formData.server1Url} 
          onChange={handleChange} 
          required 
          className="dark-input"
         />
        </div>

        <div className="form-group row">
         <label>Server 2 URL</label>
         <input 
          type="text" 
          name="server2Url" 
          value={formData.server2Url} 
          onChange={handleChange} 
          className="dark-input"
         />
        </div>

        <div className="form-group row">
         <label>Server 3 URL</label>
         <input 
          type="text" 
          name="server3Url" 
          value={formData.server3Url} 
          onChange={handleChange} 
          className="dark-input"
         />
        </div>
       </>
      )}

      <div className="form-group row">
       <label>TV Logo*</label>
       <div className="logo-upload-section">
        <div className="file-input-group">
         <input 
          type="text" 
          value={formData.logo ? 'Logo Selected' : ''} 
          readOnly 
          placeholder="Select Logo image..."
         />
         <button type="button" className="select-file-btn" onClick={() => logoInputRef.current.click()}>Select</button>
         <input type="file" ref={logoInputRef} hidden onChange={handleFileChange} accept="image/*" />
        </div>
        <p className="hint-text" style={{ color: '#b3d332', fontSize: '0.75rem', marginTop: '5px' }}>(Recommended resolution : 1280x720)</p>
        {formData.logo && (
         <div className="logo-preview-container">
          <img src={formData.logo} alt="Logo Preview" className="logo-preview" />
          <button type="button" className="remove-logo-btn" onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}>×</button>
         </div>
        )}
       </div>
      </div>

      <h2 className="section-title mt-40">SEO</h2>
      
      <div className="form-group row">
       <label>SEO Title</label>
       <input 
        type="text" 
        name="seoTitle" 
        value={formData.seoTitle} 
        onChange={handleChange} 
        className="dark-input"
       />
      </div>

      <div className="form-group row">
       <label>Meta Description</label>
       <textarea 
        name="metaDescription" 
        value={formData.metaDescription} 
        onChange={handleChange} 
        className="dark-textarea"
       />
      </div>

      <div className="form-group row">
       <label>Keyword</label>
       <textarea 
        name="keywords" 
        value={formData.keywords} 
        onChange={handleChange} 
        className="dark-textarea"
       />
       <p className="hint-text">use comma(,) to separate keyword.</p>
      </div>
     </div>
    </div>

    <div className="form-actions">
     <button type="submit" className="save-btn" disabled={loading}>
      {loading ? <Loader size="small" inline={true} /> : <Save size={18} />}
      <span>Save</span>
     </button>
    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-channel-page { background: #121212; min-height: 100vh; padding: 20px 40px; color: #e0e0e0; font-family: 'Inter', sans-serif; }
    .top-nav { margin-bottom: 20px; }
    .back-btn { background: transparent; border: none; color: #b3d332; display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.1rem; cursor: pointer; padding: 0; }
    .back-btn span { text-transform: uppercase; letter-spacing: 0.5px; }

    .form-container { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 20px; }
    .section-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 25px; color: #fff; }
    .mt-40 { margin-top: 40px; }

    .form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
    .form-group.row { flex-direction: row; align-items: center; justify-content: space-between; gap: 20px; }
    .form-group label { font-size: 0.9rem; font-weight: 700; color: #e0e0e0; min-width: 140px; }

    .dark-input { background: #2c2c2c; border: none; padding: 12px 15px; color: #fff; border-radius: 4px; flex: 1; font-size: 0.95rem; outline: none; }
    .dark-textarea { background: #2c2c2c; border: none; padding: 12px 15px; color: #fff; border-radius: 4px; flex: 1; height: 80px; font-size: 0.95rem; outline: none; resize: none; }
    
    .select-wrapper { position: relative; flex: 1; }
    .select-wrapper.full { width: 100%; }
    .select-wrapper select { width: 100%; background: #2c2c2c; border: none; padding: 12px 15px; color: #fff; border-radius: 4px; font-size: 0.95rem; outline: none; appearance: none; cursor: pointer; }
    .select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none; }

    .rich-text-container { border-radius: 4px; overflow: hidden; margin-top: 5px; border: 1px solid #333; }

    .logo-upload-section { flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .logo-preview-container { position: relative; width: 120px; height: 70px; border-radius: 4px; overflow: hidden; border: 1px solid #333; background: #000; }
    .logo-preview { width: 100%; height: 100%; object-fit: contain; }
    .remove-logo-btn { position: absolute; top: 5px; right: 5px; background: rgba(179,211,50,0.8); color: #fff; border: none; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; }

    .file-input-group { display: flex; gap: 0; }
    .file-input-group .dark-input { border-radius: 4px 0 0 4px; }
    .select-file-btn { background: #444; color: #fff; border: none; padding: 0 20px; border-radius: 0 4px 4px 0; cursor: pointer; font-size: 0.85rem; font-weight: 600; }

    .hint-text { font-size: 0.75rem; color: #777; margin-top: 5px; line-height: 1.4; }

    .form-actions { display: flex; justify-content: flex-end; margin-top: 40px; padding-bottom: 40px; }
    .save-btn { background: #b3d332; color: #fff; border: none; padding: 10px 25px; border-radius: 4px; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: background 0.2s; }
    .save-btn:hover { background: #cc0000; }

    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
   ` }} />
  </div>
 );
};

export default AddTVChannel;
