import React, { useState, useEffect } from 'react';
import { 
 Loader2, 
 CheckCircle2, 
 XCircle,
 Layout
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/banner-ads';

const BannerAds = () => {
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  homeTop: '',
  homeBottom: '',
  listTop: '',
  listBottom: '',
  detailsTop: '',
  detailsBottom: '',
  otherPagesTop: '',
  otherPagesBottom: ''
 });

 useEffect(() => {
  fetchAds();
 }, []);

 const fetchAds = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setFormData(data);
  } catch (err) {
   console.error('Error fetching ads:', err);
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

 const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);

  try {
   const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });

   if (response.ok) {
    showNotification('Banner ads saved successfully');
   } else {
    showNotification('Error saving ads', 'error');
   }
  } catch (err) {
   console.error('Error:', err);
   showNotification('Something went wrong', 'error');
  } finally {
   setSaving(false);
  }
 };

 if (loading) {
  return (
   <div className="loading-container-v">
    <Loader size="small" />
   </div>
  );
 }

 return (
  <div className="banner-ads-page">
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

   <form onSubmit={handleSubmit} className="settings-form-v">
    <div className="form-content-v">
     
     <div className="section-header-v">
      <Layout size={18} className="section-icon-v" />
      <h2 className="section-title-v">Banner Ads</h2>
     </div>

     <div className="note-box-v">
      <p><strong>Note:</strong> Leave empty if not want to display</p>
     </div>

     <div className="ads-fields-container-v mt-20">
      {[
       { id: 'homeTop', label: 'Home Top' },
       { id: 'homeBottom', label: 'Home Bottom' },
       { id: 'listTop', label: 'List Top' },
       { id: 'listBottom', label: 'List Bottom' },
       { id: 'detailsTop', label: 'Details Top' },
       { id: 'detailsBottom', label: 'Details Bottom' },
       { id: 'otherPagesTop', label: 'Other Pages Top' },
       { id: 'otherPagesBottom', label: 'Other Pages Bottom' }
      ].map((field) => (
       <div className="form-row-full-v align-start-v" key={field.id}>
        <label className="mt-8-v">{field.label}</label>
        <textarea 
         name={field.id} 
         value={formData[field.id]} 
         onChange={handleChange}
         placeholder="<a href='#' target='_blank'><img src='...' /></a>"
         spellCheck="false"
        />
       </div>
      ))}
     </div>

     <div className="form-actions-left-v mt-20">
      <button type="submit" className="save-btn-v" disabled={saving}>
       {saving ? <Loader size="small" inline={true} /> : 'Save Settings'}
      </button>
     </div>

    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .banner-ads-page { background: #000; min-height: 100vh; padding: 30px 50px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    
    .form-content-v { max-width: 1100px; }
    
    .section-header-v { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .section-icon-v { color: #fff; opacity: 0.8; }
    .section-title-v { font-size: 1rem; font-weight: 800; color: #fff; margin: 0; }
    
    .note-box-v { background: rgba(58, 176, 240, 0.1); border: 1px solid rgba(58, 176, 240, 0.2); padding: 12px 20px; border-radius: 4px; margin-bottom: 25px; }
    .note-box-v p { color: #3ab0f0; font-size: 0.85rem; margin: 0; }

    .form-row-full-v { display: flex; align-items: flex-start; margin-bottom: 18px; }
    .form-row-full-v label { width: 220px; font-weight: 600; color: #aaa; font-size: 0.85rem; flex-shrink: 0; }
    .mt-8-v { margin-top: 8px; }

    .form-row-full-v textarea { 
     flex: 1;
     background: #1a1b1e; 
     border: 1px solid #2a2c31; 
     padding: 12px 18px; 
     border-radius: 4px; 
     color: #fff; 
     outline: none; 
     font-size: 0.9rem; 
     min-height: 80px;
     font-family: monospace;
     resize: vertical;
     line-height: 1.5;
    }
    .form-row-full-v textarea:focus { border-color: #444; }

    .mt-20 { margin-top: 20px; }
    .form-actions-left-v { display: flex; padding-left: 0; }
    .save-btn-v { background: #b3d332; color: #fff; border: none; padding: 10px 25px; border-radius: 4px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: all 0.3s; }
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

export default BannerAds;
