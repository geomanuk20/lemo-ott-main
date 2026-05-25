import React, { useState, useEffect } from 'react';
import { 
 Loader2, 
 CheckCircle2, 
 XCircle 
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/player-settings';

const PlayerConfig = () => {
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  playerStyle: 'Clasic Dark',
  vectorIcons: 'NO',
  autoplay: 'NO',
  rewindForward: 'YES',
  watermark: 'YES',
  watermarkLogo: 'upload/player_logo.png',
  watermarkPosition: 'Top Right',
  watermarkUrl: '#',
 });

 useEffect(() => {
  fetchSettings();
 }, []);

 const fetchSettings = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setFormData(data);
  } catch (err) {
   console.error('Error fetching settings:', err);
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
    showNotification('Settings saved successfully');
   } else {
    showNotification('Error saving settings', 'error');
   }
  } catch (err) {
   console.error('Error:', err);
   showNotification('Something went wrong', 'error');
  } finally {
   setSaving(false);
  }
 };

 const handleFileSelect = () => {
  document.getElementById('watermark-input').click();
 };

 const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formDataUpload = new FormData();
  formDataUpload.append('file', file);

  try {
   showNotification('Uploading...', 'info');
   const response = await fetch('/api/upload', {
    method: 'POST',
    body: formDataUpload
   });
   const data = await response.json();
   if (data.url) {
    setFormData({ ...formData, watermarkLogo: data.url });
    showNotification('File uploaded successfully');
   }
  } catch (err) {
   console.error('Upload error:', err);
   showNotification('Upload failed', 'error');
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
  <div className="player-settings-page">
   <input 
    type="file" 
    id="watermark-input" 
    style={{ display: 'none' }} 
    onChange={handleFileUpload} 
   />

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
    <div className="settings-grid-v">
     
     {/* Left Column: Player Options */}
     <div className="settings-column-v">
      <h2 className="column-title-v">Player Options</h2>
      
      <div className="form-row-v">
       <label>Player Style</label>
       <select name="playerStyle" value={formData.playerStyle} onChange={handleChange}>
        <option value="Clasic Dark">Clasic Dark</option>
        <option value="Modern Light">Modern Light</option>
        <option value="Blue Accent">Blue Accent</option>
       </select>
      </div>

      <div className="form-row-v">
       <label>Vector Icons</label>
       <select name="vectorIcons" value={formData.vectorIcons} onChange={handleChange}>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
       </select>
      </div>

      <div className="form-row-v">
       <label>Autoplay</label>
       <select name="autoplay" value={formData.autoplay} onChange={handleChange}>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
       </select>
      </div>

      <div className="form-row-v">
       <label>Rewind and Forward</label>
       <select name="rewindForward" value={formData.rewindForward} onChange={handleChange}>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
       </select>
      </div>


     </div>

     {/* Right Column: Player Watermark */}
     <div className="settings-column-v">
      <h2 className="column-title-v">Player Watermark</h2>

      <div className="form-row-v">
       <label>Watermark</label>
       <select name="watermark" value={formData.watermark} onChange={handleChange}>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
       </select>
      </div>

      <div className="form-row-v">
       <label>Watermark Logo</label>
       <div className="file-input-group-v">
        <input 
         type="text" 
         name="watermarkLogo" 
         value={formData.watermarkLogo} 
         onChange={handleChange} 
        />
        <button type="button" className="select-btn-v" onClick={handleFileSelect}>Select</button>
       </div>
       <p className="hint-text-v">(Recommended resolution : 180x50)</p>
       
       <div className="logo-preview-box-v">
        {formData.watermarkLogo && formData.watermarkLogo !== 'upload/player_logo.png' ? (
         <img src={formData.watermarkLogo} alt="Watermark Preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
        ) : (
         <div className="preview-placeholder-v"></div>
        )}
       </div>
      </div>

      <div className="form-row-v">
       <label>Watermark Position</label>
       <select name="watermarkPosition" value={formData.watermarkPosition} onChange={handleChange}>
        <option value="Top Right">Top Right</option>
        <option value="Top Left">Top Left</option>
        <option value="Bottom Right">Bottom Right</option>
        <option value="Bottom Left">Bottom Left</option>
       </select>
      </div>

      <div className="form-row-v">
       <label>Watermark URL*</label>
       <input 
        type="text" 
        name="watermarkUrl" 
        value={formData.watermarkUrl} 
        onChange={handleChange} 
       />
      </div>

      <div className="form-actions-right-v">
       <button type="submit" className="save-btn-v" disabled={saving}>
        {saving ? <Loader size="small" inline={true} /> : 'Save Settings'}
       </button>
      </div>
     </div>

    </div>

    <div className="note-box-v">
     <p><strong>Note:</strong> This settings only work with web player</p>
    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .player-settings-page { background: #000; min-height: 100vh; padding: 30px 50px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    
    .column-title-v { font-size: 1rem; font-weight: 800; margin-bottom: 25px; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #111; padding-bottom: 10px; }
    
    .settings-grid-v { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; max-width: 1200px; }
    
    .form-row-v { margin-bottom: 18px; }
    .form-row-v label { display: block; font-weight: 600; color: #aaa; margin-bottom: 8px; font-size: 0.85rem; }
    
    .form-row-v input, .form-row-v select { 
     width: 100%; 
     background: #1a1b1e; 
     border: 1px solid #2a2c31; 
     padding: 10px 14px; 
     border-radius: 4px; 
     color: #fff; 
     outline: none; 
     font-size: 0.9rem; 
    }

    .file-input-group-v { display: flex; gap: 0; }
    .file-input-group-v input { border-top-right-radius: 0; border-bottom-right-radius: 0; border-right: none; }
    .select-btn-v { background: #2a2c31; color: #fff; border: 1px solid #333; padding: 0 15px; border-top-right-radius: 4px; border-bottom-right-radius: 4px; cursor: pointer; font-weight: 700; font-size: 0.8rem; }
    
    .hint-text-v { font-size: 0.75rem; color: #666; margin-top: 6px; }
    
    .logo-preview-box-v { margin-top: 15px; width: 140px; height: 50px; background: #111; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 1px solid #222; }
    .preview-placeholder-v { width: 100px; height: 20px; background: #333; opacity: 0.3; }

    .form-actions-right-v { display: flex; justify-content: flex-end; margin-top: 25px; }
    .save-btn-v { background: #b3d332; color: #fff; border: none; padding: 10px 25px; border-radius: 4px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: all 0.3s; }
    .save-btn-v:hover { background: #b3d332; transform: translateY(-1px); }

    .note-box-v { margin-top: 40px; background: rgba(255, 0, 0, 0.05); border: 1px solid rgba(255, 0, 0, 0.1); padding: 12px 20px; border-radius: 4px; max-width: 1200px; }
    .note-box-v p { color: #ff4d4d; font-size: 0.85rem; margin: 0; opacity: 0.9; }
    .note-box-v strong { margin-right: 5px; text-transform: uppercase; }

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

export default PlayerConfig;
