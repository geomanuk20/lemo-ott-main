import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 ArrowLeft, 
 Loader2, 
 CheckCircle2, 
 XCircle,
 Bold,
 Italic,
 AlignLeft,
 AlignCenter,
 AlignRight,
 AlignJustify,
 List,
 ListOrdered,
 Printer,
 Eye,
 MoreHorizontal,
 ChevronDown
} from 'lucide-react';
import Loader from '../components/Loader';

import { Editor } from '@tinymce/tinymce-react';

const API_URL = '/api/pages';
const TINY_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;

const AddPage = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  title: '',
  description: '',
  pageOrder: '1',
  status: 'Active'
 });

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const handleEditorChange = (content) => {
  setFormData({ ...formData, description: content });
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const slug = formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  try {
   const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...formData, slug })
   });

   if (response.ok) {
    showNotification('Page added successfully');
    setTimeout(() => navigate('/admin/pages/list'), 2000);
   } else {
    const data = await response.json();
    showNotification(data.message || 'Error adding page', 'error');
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
      <label>Page Title *</label>
      <div className="input-wrapper-v">
       <input 
        type="text" 
        name="title" 
        value={formData.title} 
        onChange={handleChange} 
        placeholder="About Us"
        required 
       />
      </div>
     </div>

     <div className="form-row-v">
      <label>Description</label>
      <div className="editor-outer-v">
       <Editor
        apiKey={TINY_API_KEY}
        init={{
         height: 500,
         menubar: true,
         plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table paste code help wordcount'
         ],
         toolbar: 'undo redo | formatselect | ' +
         'bold italic backcolor | alignleft aligncenter ' +
         'alignright alignjustify | bullist numlist outdent indent | ' +
         'removeformat | help',
         content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; background: #1a1a1a; color: #fff; }',
         skin: 'oxide-dark',
         content_css: 'dark'
        }}
        onEditorChange={handleEditorChange}
       />
      </div>
     </div>

     <div className="form-row-v">
      <label>Page Order</label>
      <div className="input-wrapper-v">
       <input 
        type="number" 
        name="pageOrder" 
        value={formData.pageOrder} 
        onChange={handleChange} 
        className="number-input-v"
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

     <div className="form-actions-v">
      <button type="submit" className="save-btn-v" disabled={loading}>
       {loading ? <Loader size="small" inline={true} /> : 'Save'}
      </button>
     </div>

    </form>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-plan-page { background: #000; min-height: 100vh; padding: 40px 60px; color: #fff; animation: fadeIn 0.4s ease; }
    
    .top-nav-v { margin-bottom: 40px; }
    .back-link-red-v { background: none; border: none; color: #b3d332; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.2rem; cursor: pointer; }
    
    .form-container-v { max-width: 1100px; margin: 0; }
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
    }
    
    /* Editor Styles */
    .editor-container-v { flex: 1; background: #fff; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column; }
    .editor-header-v { background: #fff; border-bottom: 1px solid #eee; padding: 5px; color: #333; }
    .editor-menu-v { display: flex; gap: 15px; padding: 5px 10px; font-size: 0.85rem; color: #444; border-bottom: 1px solid #f5f5f5; }
    .editor-menu-v span { cursor: pointer; }
    .editor-menu-v span:hover { color: #000; }
    
    .editor-toolbar-v { display: flex; align-items: center; padding: 5px 10px; gap: 5px; flex-wrap: wrap; }
    .toolbar-group-v { display: flex; gap: 2px; }
    .toolbar-group-v button { background: none; border: none; padding: 6px; border-radius: 3px; color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .toolbar-group-v button:hover { background: #f0f0f0; color: #000; }
    .toolbar-divider-v { width: 1px; height: 20px; background: #eee; margin: 0 5px; }
    
    .format-select-v { display: flex; align-items: center; gap: 10px; padding: 4px 10px; border: 1px solid #eee; border-radius: 3px; font-size: 0.85rem; color: #555; cursor: pointer; background: #fafafa; }
    
    .editor-content-v { width: 100%; min-height: 400px; border: none; outline: none; padding: 20px; font-size: 1rem; color: #333; font-family: inherit; resize: vertical; }
    
    .editor-footer-v { background: #f8f9fa; border-top: 1px solid #eee; padding: 4px 15px; display: flex; justify-content: space-between; color: #888; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }

    .form-actions-v { margin-left: 180px; margin-top: 15px; }
    .save-btn-v { background: #b3d332; color: #fff; border: none; padding: 12px 30px; border-radius: 4px; font-weight: 800; font-size: 1.05rem; cursor: pointer; transition: all 0.3s; }
    .save-btn-v:hover { background: #b3d332; transform: translateY(-1px); }

    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Notification */
    .custom-alert-box-v { position: fixed; top: 40px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 30px 60px; z-index: 9999; box-shadow: 0 20px 50px rgba(0,0,0,0.6); border: 1px solid #333; }
    .alert-content-v { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text-v { color: #fff; font-size: 1.2rem; font-weight: 800; text-align: center; }
   ` }} />
  </div>
 );
};

export default AddPage;
