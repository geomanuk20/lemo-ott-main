import React, { useState, useEffect } from 'react';
import { 
 Loader2, 
 CheckCircle2, 
 XCircle,
 Settings,
 ShieldCheck,
 Power
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/maintenance-settings';

const MaintenanceSettings = () => {
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  status: false,
  title: 'The Website Under Maintenance!',
  description: 'This Website Under Maintenance!',
  secret: 'viaviweb',
  endTime: ''
 });

 useEffect(() => {
  fetchSettings();
 }, []);

 const fetchSettings = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setFormData(prev => ({ ...prev, ...data }));
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
  const { name, value, type, checked } = e.target;
  setFormData({ 
   ...formData, 
   [name]: type === 'checkbox' ? checked : value 
  });
 };

  const toggleStatus = async () => {
   const newStatus = !formData.status;
   setFormData(prev => ({ ...prev, status: newStatus }));
   
   setSaving(true);
   try {
    const response = await fetch(API_URL, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ ...formData, status: newStatus })
    });

    if (response.ok) {
     showNotification(`Maintenance Mode turned ${newStatus ? 'ON' : 'OFF'} successfully`);
    } else {
     showNotification('Error updating maintenance status', 'error');
    }
   } catch (err) {
    console.error('Error:', err);
    showNotification('Something went wrong', 'error');
   } finally {
    setSaving(false);
   }
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
    showNotification('Maintenance settings saved successfully');
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

 if (loading) {
  return (
   <div className="loading-container-v">
    <Loader size="small" />
   </div>
  );
 }

 return (
  <div className="maintenance-settings-page">
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

   <div className="header-actions-v">
    <button 
     type="button" 
     className={`status-toggle-btn-v ${formData.status ? 'active' : ''}`}
     onClick={toggleStatus}
    >
     <Power size={14} />
     <span>Maintenance Mode {formData.status ? 'On' : 'Off'}</span>
    </button>
   </div>

   <form onSubmit={handleSubmit} className="settings-form-v">
    <div className="form-content-v">
     
     <div className="form-row-full-v">
      <label>Title*</label>
      <input 
       type="text" 
       name="title" 
       value={formData.title} 
       onChange={handleChange} 
       required 
      />
     </div>

     <div className="form-row-full-v align-start-v">
      <label className="mt-10-v">Description</label>
      <div className="rich-editor-mock-v">
       <div className="editor-toolbar-v">
        <span>File Edit View Insert Format Tools Table Help</span>
       </div>
       <div className="editor-icons-v">
        <span className="icon-group">↶ ↷ Paragraph B I ≡ ≡ ≡ ≡ ≡ List List Link Image Eye Color Edit</span>
       </div>
       <textarea 
        name="description" 
        value={formData.description} 
        onChange={handleChange}
        spellCheck="false"
       />
       <div className="editor-footer-v">
        <span>P</span>
        <span>{formData.description ? formData.description.split(' ').length : 0} WORDS POWERED BY TINY</span>
       </div>
      </div>
     </div>

     <div className="section-divider-v"></div>

     <div className="form-row-full-v">
      <label>Expected End Time (Timer)</label>
      <input 
       type="datetime-local" 
       name="endTime" 
       value={formData.endTime || ''} 
       onChange={handleChange} 
       style={{ colorScheme: 'dark' }}
      />
     </div>

     <div className="form-row-full-v">
      <label>Maintenance Secret*</label>
      <input 
       type="text" 
       name="secret" 
       value={formData.secret} 
       onChange={handleChange} 
       required 
      />
     </div>

     <div className="info-text-box-v">
      <p>After placing the site in maintenance mode, you may navigate to the site URL matching this secret token and script will issue a maintenance mode bypass cookie to your browser.</p>
      <p className="mt-10-v">To get access to your site when it's maintenance mode please copy this link to access: <span className="link-v">http://localhost:5173/{formData.secret}</span></p>
      <p className="mt-10-v">Once the cookie has been issued to your browser, you will be able to browse the application normally as if it was not in maintenance mode.</p>
     </div>

     <div className="form-actions-left-v mt-30">
      <button type="submit" className="save-btn-v" disabled={saving}>
       {saving ? <Loader size="small" inline={true} /> : 'Save Settings'}
      </button>
     </div>

    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .maintenance-settings-page { background: #000; min-height: 100vh; padding: 25px 40px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    
    .header-actions-v { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .status-toggle-btn-v { 
     background: #ff4d4d; 
     color: #fff; 
     border: none; 
     padding: 6px 12px; 
     border-radius: 4px; 
     display: flex; 
     align-items: center; 
     gap: 6px; 
     font-weight: 700; 
     font-size: 0.75rem; 
     cursor: pointer; 
     transition: all 0.3s;
     text-transform: uppercase;
     letter-spacing: 0.5px;
    }
    .status-toggle-btn-v.active { background: #b3d332; }
    .status-toggle-btn-v:hover { transform: translateY(-1px); opacity: 0.9; }

    .form-content-v { max-width: 1000px; }
    
    .form-row-full-v { display: flex; align-items: center; margin-bottom: 15px; }
    .form-row-full-v label { width: 180px; font-weight: 600; color: #aaa; font-size: 0.85rem; flex-shrink: 0; }
    .mt-10-v { margin-top: 10px; }

    .form-row-full-v input { 
     flex: 1;
     background: #1a1b1e; 
     border: 1px solid #2a2c31; 
     padding: 10px 14px; 
     border-radius: 4px; 
     color: #fff; 
     outline: none; 
     font-size: 0.9rem; 
    }

    /* Rich Editor Mock */
    .rich-editor-mock-v { flex: 1; background: #fff; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column; border: 1px solid #2a2c31; }
    .editor-toolbar-v { background: #fff; padding: 6px 12px; border-bottom: 1px solid #ddd; color: #444; font-size: 0.75rem; }
    .editor-icons-v { background: #fff; padding: 6px 12px; border-bottom: 1px solid #ddd; color: #444; font-size: 0.8rem; font-weight: bold; border-top: 1px solid #eee; }
    .icon-group { opacity: 0.7; letter-spacing: 4px; }
    .rich-editor-mock-v textarea { 
     width: 100%;
     min-height: 200px;
     border: none;
     padding: 15px;
     color: #000;
     font-size: 0.95rem;
     outline: none;
     resize: vertical;
     background: #fff;
    }
    .editor-footer-v { background: #f9f9f9; padding: 4px 12px; border-top: 1px solid #eee; display: flex; justify-content: space-between; color: #888; font-size: 0.65rem; text-transform: uppercase; }

    .section-divider-v { height: 1px; background: #111; margin: 20px 0; width: 100%; }

    .info-text-box-v { color: #666; font-size: 0.8rem; line-height: 1.5; max-width: 900px; }
    .link-v { color: #3ab0f0; text-decoration: none; font-weight: 600; }

    .mt-30 { margin-top: 25px; }
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

export default MaintenanceSettings;
