import React, { useState, useEffect } from 'react';
import { 
 Loader2, 
 CheckCircle2, 
 XCircle,
 Share2,
 Globe
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/social-login-settings';

const SocialLoginSettings = () => {
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  googleLogin: 'ON',
  googleClientId: 'Hidden in Demo',
  googleSecret: 'Hidden in Demo',
  facebookLogin: 'OFF',
  facebookAppId: 'Hidden in Demo',
  facebookClientSecret: 'Hidden in Demo'
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
    showNotification('Social login settings saved successfully');
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
  <div className="social-settings-page">
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
     
     {/* Google Section */}
     <div className="settings-section-v">
      <div className="section-header-v">
       <Globe size={20} className="section-icon-v" />
       <h2 className="section-title-v">Google Settings</h2>
      </div>

      <div className="form-row-full-v">
       <label>Google Login</label>
       <select name="googleLogin" value={formData.googleLogin} onChange={handleChange}>
        <option value="ON">ON</option>
        <option value="OFF">OFF</option>
       </select>
      </div>

      <div className="form-row-full-v">
       <label>Google Client ID</label>
       <input type="text" name="googleClientId" value={formData.googleClientId} onChange={handleChange} />
      </div>

      <div className="form-row-full-v">
       <label>Google Secret</label>
       <input type="text" name="googleSecret" value={formData.googleSecret} onChange={handleChange} />
      </div>
     </div>

     <div className="section-divider-v"></div>

     {/* Facebook Section */}
     <div className="settings-section-v">
      <div className="section-header-v">
       <Share2 size={20} className="section-icon-v" />
       <h2 className="section-title-v">Facebook Settings</h2>
      </div>

      <div className="form-row-full-v">
       <label>Facebook Login</label>
       <select name="facebookLogin" value={formData.facebookLogin} onChange={handleChange}>
        <option value="ON">ON</option>
        <option value="OFF">OFF</option>
       </select>
      </div>

      <div className="form-row-full-v">
       <label>Facebook App ID</label>
       <input type="text" name="facebookAppId" value={formData.facebookAppId} onChange={handleChange} />
      </div>

      <div className="form-row-full-v">
       <label>Facebook Client Secret</label>
       <input type="text" name="facebookClientSecret" value={formData.facebookClientSecret} onChange={handleChange} />
      </div>
     </div>

     <div className="form-actions-left-v mt-20">
      <button type="submit" className="save-btn-v" disabled={saving}>
       {saving ? <Loader size="small" inline={true} /> : 'Save Settings'}
      </button>
     </div>

    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .social-settings-page { background: #000; min-height: 100vh; padding: 30px 50px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    
    .form-content-v { max-width: 900px; }
    
    .settings-section-v { margin-bottom: 25px; }
    .section-header-v { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .section-icon-v { color: #fff; opacity: 0.8; }
    .section-title-v { font-size: 1rem; font-weight: 800; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .section-divider-v { height: 1px; background: #111; margin: 30px 0; width: 100%; }

    .form-row-full-v { display: flex; align-items: center; margin-bottom: 15px; }
    .form-row-full-v label { width: 180px; font-weight: 600; color: #aaa; font-size: 0.85rem; flex-shrink: 0; }
    
    .form-row-full-v input, .form-row-full-v select { 
     flex: 1;
     background: #1a1b1e; 
     border: 1px solid #2a2c31; 
     padding: 10px 14px; 
     border-radius: 4px; 
     color: #fff; 
     outline: none; 
     font-size: 0.9rem; 
     transition: border-color 0.3s;
    }
    .form-row-full-v input:focus { border-color: #444; }

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

export default SocialLoginSettings;
