import React, { useState, useEffect } from 'react';
import { 
 Loader2, 
 CheckCircle2, 
 XCircle,
 Send
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/smtp-settings';

const SMTPSettings = () => {
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [testing, setTesting] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  host: 'Hidden in Demo',
  port: 'Hidden in Demo',
  email: 'Hidden in Demo',
  password: '',
  encryption: 'SSL'
 });

 useEffect(() => {
  fetchSettings();
 }, []);

 const fetchSettings = async () => {
  try {
   const response = await fetch(API_URL);
   const data = await response.json();
   setFormData({ ...data, password: '' }); // Don't show password
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
    showNotification('SMTP settings saved successfully');
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

 const handleTestSMTP = async () => {
  setTesting(true);
  try {
   const response = await fetch(`${API_URL}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });
   const data = await response.json();
   if (response.ok) {
    showNotification(data.message || 'SMTP Connection Test Successful!');
   } else {
    showNotification(data.message || 'SMTP Connection Test Failed', 'error');
   }
  } catch (err) {
   showNotification('SMTP Server Unreachable', 'error');
  } finally {
   setTesting(false);
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
  <div className="smtp-settings-page">
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

   <div className="settings-header-v">
    <button type="button" className="test-smtp-btn-v" onClick={handleTestSMTP} disabled={testing}>
     {testing ? <Loader size="small" inline={true} /> : <Send size={16} />}
     Test SMTP
    </button>
   </div>

   <form onSubmit={handleSubmit} className="settings-form-v">
    <div className="form-content-v">
     
     <div className="form-row-full-v">
      <label>Host*</label>
      <input type="text" name="host" value={formData.host} onChange={handleChange} required />
     </div>

     <div className="form-row-full-v">
      <label>Port*</label>
      <input type="text" name="port" value={formData.port} onChange={handleChange} required />
     </div>

     <div className="form-row-full-v">
      <label>Email*</label>
      <input type="text" name="email" value={formData.email} onChange={handleChange} required />
     </div>

     <div className="form-row-full-v">
      <label>Password*</label>
      <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="............" />
     </div>

     <div className="form-row-full-v">
      <label>Encryption</label>
      <select name="encryption" value={formData.encryption} onChange={handleChange}>
       <option value="SSL">SSL</option>
       <option value="TLS">TLS</option>
       <option value="None">None</option>
      </select>
     </div>

     <div className="form-actions-left-v">
      <button type="submit" className="save-btn-v" disabled={saving}>
       {saving ? <Loader size="small" inline={true} /> : 'Save Settings'}
      </button>
     </div>

    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .smtp-settings-page { background: #000; min-height: 100vh; padding: 30px 50px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    
    .settings-header-v { display: flex; justify-content: flex-end; max-width: 900px; margin-bottom: 20px; }
    .test-smtp-btn-v { background: #3ab0f0; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s; }
    .test-smtp-btn-v:hover { background: #2a90d0; transform: translateY(-1px); }

    .form-content-v { max-width: 900px; }
    
    .form-row-full-v { display: flex; align-items: center; margin-bottom: 15px; }
    .form-row-full-v label { width: 160px; font-weight: 600; color: #aaa; font-size: 0.85rem; flex-shrink: 0; }
    
    .form-row-full-v input, .form-row-full-v select { 
     flex: 1;
     background: #1a1b1e; 
     border: 1px solid #2a2c31; 
     padding: 10px 14px; 
     border-radius: 4px; 
     color: #fff; 
     outline: none; 
     font-size: 0.9rem; 
    }

    .form-actions-left-v { display: flex; margin-top: 25px; padding-left: 160px; }
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

export default SMTPSettings;
