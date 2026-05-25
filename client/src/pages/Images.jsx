import React, { useState, useEffect } from 'react';
import { 
 Plus, 
 Trash2, 
 Copy, 
 ExternalLink, 
 Search, 
 Filter, 
 Image as ImageIcon,
 CheckCircle2,
 XCircle,
 AlertTriangle,
 Loader2,
 Calendar,
 Clock,
 Save
} from 'lucide-react';
import Loader from '../components/Loader';

const Images = () => {
 const [images, setImages] = useState([]);
 const [loading, setLoading] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [notification, setNotification] = useState(null);
 const [deletingId, setDeletingId] = useState(null);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
 const [uploadFile, setUploadFile] = useState(null);
 const [uploadTitle, setUploadTitle] = useState('');
 const [uploadPreview, setUploadPreview] = useState('');
 const fileInputRef = React.useRef(null);

 useEffect(() => {
  fetchAssets();
 }, []);

 const fetchAssets = async () => {
  try {
   const response = await fetch('/api/assets');
   if (!response.ok) throw new Error('Failed to fetch');
   const data = await response.json();
   setImages(data);
  } catch (err) {
   console.error('Fetch error:', err);
  } finally {
   setLoading(false);
  }
 };

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
   return showNotification('Please upload an image file', 'error');
  }

  setUploadFile(file);
  setUploadTitle(file.name.split('.')[0]);
  setUploadPreview(URL.createObjectURL(file));
  setIsUploadModalOpen(true);
  e.target.value = ''; // Reset input
 };

 const executeUpload = async () => {
  if (!uploadTitle) return showNotification('Please enter an image name', 'error');
  
  setLoading(true);
  const formData = new FormData();
  formData.append('file', uploadFile);

  try {
   // 1. Upload to Cloudinary
   const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    body: formData
   });

   if (!uploadRes.ok) throw new Error('Upload failed');
   const uploadData = await uploadRes.json();
   
   // 2. Save to Database
   const assetData = {
    title: uploadTitle,
    url: uploadData.url,
    size: (uploadFile.size / (1024 * 1024)).toFixed(1) + ' MB',
    dimension: 'Original'
   };

   const saveRes = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assetData)
   });

   if (!saveRes.ok) throw new Error('Persistence failed');
   const newAsset = await saveRes.json();

   setImages(prev => [newAsset, ...prev]);
   showNotification('Image uploaded and stored successfully!');
   setIsUploadModalOpen(false);
   setUploadFile(null);
   setUploadTitle('');
   setUploadPreview('');
  } catch (err) {
   console.error('Upload error:', err);
   showNotification('Failed to upload/store image', 'error');
  } finally {
   setLoading(false);
  }
 };

 const copyToClipboard = (url) => {
  navigator.clipboard.writeText(url);
  showNotification('URL copied to clipboard!');
 };

 const handleDelete = async (id) => {
  try {
   const response = await fetch(`/api/assets/${id}`, {
    method: 'DELETE'
   });
   if (!response.ok) throw new Error('Delete failed');
   
   setImages(prev => prev.filter(img => img._id !== id));
   setIsDeleteModalOpen(false);
   showNotification('Image permanently removed from library');
  } catch (err) {
   console.error('Delete error:', err);
   showNotification('Failed to remove asset', 'error');
  }
 };

 const filteredImages = images.filter(img => 
  img.title.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
  <div className="images-page">
   {notification && (
    <div className="custom-alert-box">
     <div className="alert-content">
      <CheckCircle2 size={42} color="#b3d332" strokeWidth={2.5} />
      <span className="alert-text">{notification.message}</span>
     </div>
    </div>
   )}

   <div className="images-header-section">
    <div className="header-left">
     <div className="search-bar-exp">
      <Search size={18} className="search-icon" />
      <input 
       type="text" 
       placeholder="Search assets..." 
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
      />
     </div>
    </div>
    <div className="header-right">
     <input 
      type="file" 
      ref={fileInputRef} 
      onChange={handleFileSelect} 
      accept="image/*" 
      style={{ display: 'none' }} 
     />
     <button 
      className="upload-btn-premium" 
      onClick={() => fileInputRef.current.click()}
     >
      <Plus size={18} strokeWidth={3} />
      <span>Upload Image</span>
     </button>
    </div>
   </div>

   <div className="images-grid-container">
    {filteredImages.length > 0 ? (
     <div className="images-grid">
      {filteredImages.map((img) => (
       <div key={img._id} className="image-card-premium">
        <div className="image-preview-box">
         <img src={img.url} alt={img.title} />
         <div className="image-hover-actions">
          <button className="action-circle" title="Copy URL" onClick={() => copyToClipboard(img.url)}>
           <Copy size={16} />
          </button>
          <button className="action-circle" title="View Original" onClick={() => window.open(img.url, '_blank')}>
           <ExternalLink size={16} />
          </button>
          <button className="action-circle delete" title="Delete" onClick={() => {
           setDeletingId(img._id);
           setIsDeleteModalOpen(true);
          }}>
           <Trash2 size={16} />
          </button>
         </div>
        </div>
        <div className="image-details-exp">
         <h3 className="img-title-text">{img.title}</h3>
         <div className="img-meta-row">
          <span className="meta-tag dim">{img.dimension}</span>
          <span className="meta-tag size">{img.size}</span>
          <span className="meta-tag date">
           <Calendar size={10} style={{ marginRight: '4px' }} />
           {img.date}
          </span>
         </div>
        </div>
       </div>
      ))}
     </div>
    ) : (
     <div className="empty-state">
      <ImageIcon size={60} color="#333" />
      <p>No images found in your library</p>
     </div>
    )}
   </div>

   {/* Delete Modal */}
   {isDeleteModalOpen && (
    <div className="modal-overlay-exp">
     <div className="exp-modal delete">
      <AlertTriangle size={60} color="#ff4d4d" />
      <h2>Confirm Delete</h2>
      <p>Are you sure you want to permanently remove this asset from your library?</p>
      <div className="exp-modal-footer">
       <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="btn-confirm-delete" onClick={() => handleDelete(deletingId)}>Delete Asset</button>
      </div>
     </div>
    </div>
   )}

   {/* Upload Modal */}
   {isUploadModalOpen && (
    <div className="modal-overlay-exp">
     <div className="exp-modal edit">
      <div className="modal-header">
       <Plus size={24} color="#b3d332" />
       <h2>Staging Asset</h2>
      </div>
      <div className="upload-staging-box">
       <div className="staging-preview">
        <img src={uploadPreview} alt="Preview" />
       </div>
       <div className="exp-form">
        <div className="form-group">
         <label>Image Name</label>
         <input 
          type="text" 
          value={uploadTitle} 
          onChange={(e) => setUploadTitle(e.target.value)}
          placeholder="Enter image name..."
          autoFocus
         />
         <p className="form-help">This name will be used to identify the asset in your library.</p>
        </div>
       </div>
      </div>
      <div className="exp-modal-footer">
       <button className="btn-cancel" onClick={() => {
        setIsUploadModalOpen(false);
        setUploadFile(null);
       }} disabled={loading}>Discard</button>
       <button className="btn-save" onClick={executeUpload} disabled={loading}>
        {loading ? <Loader size="small" inline={true} /> : <Save size={18} />}
        <span>{loading ? 'Ingesting...' : 'Confirm Upload'}</span>
       </button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .images-page { padding: 30px; animation: fadeIn 0.4s ease-out; }
    
    .images-header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px; }
    
    .search-bar-exp { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; display: flex; align-items: center; padding: 0 15px; width: 350px; transition: border-color 0.3s; }
    .search-bar-exp:focus-within { border-color: #b3d332; }
    .search-bar-exp input { background: transparent; border: none; color: #fff; padding: 12px 10px; width: 100%; outline: none; font-size: 0.95rem; }
    .search-icon { color: #555; }
    
    .upload-btn-premium { background: #b3d332; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(22, 196, 127, 0.2); }
    .upload-btn-premium:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(22, 196, 127, 0.3); }

    .images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
    
    .image-card-premium { background: #1a1a1a; border-radius: 20px; overflow: hidden; border: 1px solid #222; transition: all 0.3s; }
    .image-card-premium:hover { border-color: #b3d332; transform: translateY(-8px); box-shadow: 0 15px 40px rgba(0,0,0,0.4); }
    
    .image-preview-box { aspect-ratio: 16/10; width: 100%; position: relative; background: #111; overflow: hidden; }
    .image-preview-box img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
    .image-card-premium:hover .image-preview-box img { transform: scale(1.1); }
    
    .image-hover-actions { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; gap: 15px; opacity: 0; transition: 0.3s; backdrop-filter: blur(4px); }
    .image-preview-box:hover .image-hover-actions { opacity: 1; }
    
    .action-circle { width: 45px; height: 45px; border-radius: 50%; background: #fff; color: #000; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .action-circle.delete { background: #ff4d4d; color: #fff; }
    .action-circle:hover { transform: scale(1.15) rotate(5deg); }
    
    .image-details-exp { padding: 20px; }
    .img-title-text { color: #fff; font-size: 1.1rem; font-weight: 700; margin: 0 0 10px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .img-meta-row { display: flex; gap: 10px; }
    .meta-tag { font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
    .meta-tag.dim { background: rgba(0, 136, 255, 0.1); color: #0088ff; border: 1px solid rgba(0, 136, 255, 0.2); }
    .meta-tag.size { background: rgba(255, 255, 255, 0.05); color: #888; border: 1px solid rgba(255, 255, 255, 0.1); }
    
    .empty-state { grid-column: 1 / -1; padding: 100px 0; text-align: center; color: #555; font-size: 1.2rem; display: flex; flex-direction: column; align-items: center; gap: 20px; }

    /* Modals Base */
    .modal-overlay-exp { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(8px); }
    .exp-modal { background: #1a1a1a; padding: 40px; border-radius: 24px; text-align: center; border: 1px solid #333; max-width: 450px; width: 90%; animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

    .exp-modal.edit { text-align: left; }
    .modal-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
    .modal-header h2 { color: #fff; font-size: 1.5rem; margin: 0; }
    
    .upload-staging-box { display: flex; flex-direction: column; gap: 20px; }
    .staging-preview { width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; border: 1px solid #333; }
    .staging-preview img { width: 100%; height: 100%; object-fit: contain; }
    
    .form-help { color: #555; font-size: 0.75rem; margin: 0; }
    
    .exp-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { color: #aaa; font-size: 0.85rem; font-weight: 600; }
    .form-group input { background: #111; border: 1px solid #333; color: #fff; padding: 12px 15px; border-radius: 8px; outline: none; transition: border-color 0.3s; }
    .form-group input:focus { border-color: #b3d332; }
    
    .exp-modal-footer { display: flex; gap: 15px; margin-top: 35px; }
    .btn-cancel { flex: 1; background: #333; color: #fff; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-weight: 700; transition: background 0.2s; }
    .btn-save { flex: 1.5; background: #b3d332; color: #fff; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-weight: 700; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .btn-confirm-delete { flex: 1.5; background: #ff4d4d; color: #fff; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-weight: 700; }
    .btn-save:hover, .btn-confirm-delete:hover { opacity: 0.9; }

    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #000; border-radius: 16px; padding: 25px 50px; z-index: 20000; box-shadow: 0 10px 50px rgba(0,0,0,1); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid #333; }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
   ` }} />
  </div>
 );
};

export default Images;
