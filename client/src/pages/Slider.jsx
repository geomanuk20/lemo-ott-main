import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Plus, 
 Edit, 
 X, 
 RotateCw, 
 Loader2, 
 AlertTriangle,
 CheckCircle2,
 Upload
} from 'lucide-react';
import Loader from '../components/Loader';
import { formatImageUrl } from '../utils/image';
import ImportExportModal from '../components/ImportExportModal';

const API_URL = '/api/sliders';

const Slider = () => {
 const navigate = useNavigate();
 const [sliders, setSliders] = useState([]);
 const [loading, setLoading] = useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deletingId, setDeletingId] = useState(null);
 const [notification, setNotification] = useState(null);
 const [isImportExportOpen, setIsImportExportOpen] = useState(false);

 const fetchSliders = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setSliders(data);
  } catch (err) {
   console.error('Error fetching sliders:', err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchSliders();
 }, []);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleStatusToggle = async (id, currentStatus) => {
  const newStatus = (currentStatus && currentStatus.toLowerCase() === 'active') ? 'Inactive' : 'Active';
  try {
   const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
   });
   if (res.ok) {
    setSliders(prev => prev.map(s => s._id === id ? { ...s, status: newStatus } : s));
    showNotification(`Slider marked as ${newStatus}`);
   }
  } catch (err) {
   console.error('Error toggling status:', err);
  }
 };

 const executeDelete = async () => {
  try {
   const res = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
   if (res.ok) {
    setSliders(prev => prev.filter(s => s._id !== deletingId));
    showNotification('Slider deleted successfully');
   }
   setIsDeleteModalOpen(false);
  } catch (err) {
   console.error('Error deleting slider:', err);
  }
 };

 return (
  <div className="slider-page">
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

    <div className="slider-controls-top">
     <button className="add-slider-btn-green" onClick={() => navigate('/admin/home/slider/add')}>
      <Plus size={18} strokeWidth={3} />
      <span>Add Slider</span>
     </button>
     <button className="import-export-btn" onClick={() => setIsImportExportOpen(true)}>
      <Upload size={16} />
      <span>Import / Export</span>
     </button>
    </div>

   {loading ? (
    <div className="loader-container"><Loader size="small" inline={true} /></div>
   ) : (
    <div className="slider-grid">
     {sliders.map((slider) => (
      <div key={slider._id} className="slider-card-premium">
       <div className="slider-img-container">
        <img src={formatImageUrl(slider, 'slider')} alt={slider.title} className="slider-img" />
       </div>
       <div className="slider-info">
        <div className="slider-header-info">
         <h3 className="slider-title">{slider.title}</h3>
         <span className="section-badge-alt">{slider.section || 'Main Slider'}</span>
        </div>
        <div className="display-on-row-alt">
         <span className="row-label-alt">Broadcast:</span>
         {slider.displayOn && slider.displayOn.length > 0 ? (
          slider.displayOn.map(loc => (
           <span key={loc} className="loc-tag">{loc}</span>
          ))
         ) : (
          <span className="loc-tag-empty">Home Only</span>
         )}
        </div>

        <div className="slider-actions-row">
         <div className="left-btns">
          <button className="circle-btn-green" onClick={() => navigate(`/admin/home/slider/edit/${slider._id}`)}>
           <Edit size={14} />
          </button>
          <button className="circle-btn-red" onClick={() => {
           setDeletingId(slider._id);
           setIsDeleteModalOpen(true);
          }}>
           <X size={16} strokeWidth={3} />
          </button>
         </div>
         <div className="right-toggle">
          <label className="switch">
           <input 
            type="checkbox" 
            checked={slider.status && slider.status.toLowerCase() === 'active'} 
            onChange={() => handleStatusToggle(slider._id, slider.status)}
           />
           <span className="slider-round"></span>
          </label>
         </div>
        </div>
       </div>
      </div>
     ))}
    </div>
   )}

   {isDeleteModalOpen && (
    <div className="modal-overlay-alt">
     <div className="delete-modal-alt">
      <AlertTriangle size={60} color="#ff4d4d" />
      <h2>Confirm Delete</h2>
      <p>Are you sure you want to delete this slider?</p>
      <div className="delete-footer-alt">
       <button className="cancel-btn-alt" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="confirm-btn-alt" onClick={executeDelete}>Delete</button>
      </div>
     </div>
    </div>
   )}

    <ImportExportModal
     isOpen={isImportExportOpen}
     onClose={() => setIsImportExportOpen(false)}
     type="sliders"
     onImportSuccess={fetchSliders}
    />

    <style dangerouslySetInnerHTML={{ __html: `
     .slider-page { padding: 20px 30px; animation: fadeIn 0.4s ease-out; }
     
     .slider-controls-top { display: flex; gap: 15px; align-items: center; margin-bottom: 25px; }
     .add-slider-btn-green { background: #b3d332; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
     .add-slider-btn-green:hover { opacity: 0.9; }
     .import-export-btn { background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 10px 20px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; font-size: 0.9rem; }
     .import-export-btn:hover { background: #2a2a2a; border-color: #b3d332; color: #b3d332; }

    .slider-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: 30px; }
    
    .slider-card-premium { background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #222; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    .slider-img-container { aspect-ratio: 16/9; width: 100%; background: #111; overflow: hidden; }
    .slider-img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s; }
    .slider-card-premium:hover .slider-img { transform: scale(1.05); }

    .slider-info { padding: 15px 20px; }
    .slider-header-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .slider-title { color: #fff; font-size: 1.1rem; font-weight: 700; margin: 0; }
    .section-badge-alt { background: rgba(22, 196, 127, 0.1); color: #b3d332; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; border: 1px solid rgba(22, 196, 127, 0.2); }
    
    .display-on-row-alt { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .row-label-alt { color: #555; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-right: 5px; }
    .loc-tag { background: rgba(0, 136, 255, 0.1); color: #0088ff; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 3px; text-transform: uppercase; border: 1px solid rgba(0, 136, 255, 0.2); }
    .loc-tag-empty { color: #444; font-size: 0.65rem; font-weight: 700; font-style: italic; }
    
    .slider-actions-row { display: flex; justify-content: space-between; align-items: center; }
    .left-btns { display: flex; gap: 12px; }
    
    .circle-btn-green { width: 32px; height: 32px; border-radius: 50%; background: #b3d332; color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; }
    .circle-btn-red { width: 32px; height: 32px; border-radius: 50%; background: #ff4d4d; color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; }
    .circle-btn-green:hover, .circle-btn-red:hover { transform: scale(1.1); }

    /* Toggle Switch */
    .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider-round { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 34px; }
    .slider-round:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider-round { background-color: #b3d332; }
    input:checked + .slider-round:before { transform: translateX(22px); }

    .loader-container { height: 50vh; display: flex; align-items: center; justify-content: center; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    
    .modal-overlay-alt { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(5px); }
    .delete-modal-alt { background: #1a1a1a; padding: 40px; border-radius: 20px; text-align: center; border: 1px solid #333; max-width: 400px; }
    .delete-footer-alt { display: flex; gap: 15px; margin-top: 30px; }
    .cancel-btn-alt { flex: 1; background: #333; color: #fff; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }
    .confirm-btn-alt { flex: 1; background: #ff4d4d; color: #fff; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }

    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 25px 50px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
   ` }} />
  </div>
 );
};

export default Slider;
