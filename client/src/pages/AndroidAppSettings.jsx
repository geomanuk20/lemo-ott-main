import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Settings } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/android-app/settings';

const AndroidAppSettings = () => {
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [notification, setNotification] = useState(null);
 const [formData, setFormData] = useState({
  appName: 'Video OTT', appLogo: '', appEmail: 'admin@video.com', appAuthor: 'Video',
  appContact: '', appWebsite: '', appDescription: '', appVersion: '1.0.0',
  appUpdateStatus: 'OFF', appUpdateMsg: '', appUpdateUrl: '', appCancelBtn: 'OFF'
 });

 useEffect(() => { fetchSettings(); }, []);
 const fetchSettings = async () => {
  try {
   const res = await fetch(API_URL);
   const data = await res.json();
   setFormData(prev => ({ ...prev, ...data }));
  } catch (err) { console.error(err); } finally { setLoading(false); }
 };

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);
  try {
   const saveData = { ...formData };
   delete saveData._id;
   delete saveData.__v;
   delete saveData.createdAt;
   delete saveData.updatedAt;

   const res = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saveData)
   });
   if (res.ok) showNotification('App settings saved successfully');
   else showNotification('Error saving settings', 'error');
  } catch (err) { showNotification('Something went wrong', 'error'); } finally { setSaving(false); }
 };

 

 return (
  <div className="android-settings-page">
   {notification && (
    <div className="custom-alert-box-v">
     <div className="alert-content-v">
      {notification.type === 'success' ? <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} /> : <XCircle size={42} color="#ff4d4d" strokeWidth={2.5} />}
      <span className="alert-text-v">{notification.message}</span>
     </div>
    </div>
   )}
   <form onSubmit={handleSubmit} className="settings-form-v">
    <div className="form-content-v">
     <div className="section-header-v">
      <Settings size={18} className="section-icon-v" />
      <h2 className="section-title-v">App Settings</h2>
     </div>
     
     <div className="form-grid-v">
      <div className="form-row-full-v"><label>App Name</label><input type="text" value={formData.appName} onChange={(e) => setFormData({...formData, appName: e.target.value})} /></div>
      <div className="form-row-full-v"><label>App Email</label><input type="email" value={formData.appEmail} onChange={(e) => setFormData({...formData, appEmail: e.target.value})} /></div>
      <div className="form-row-full-v"><label>App Author</label><input type="text" value={formData.appAuthor} onChange={(e) => setFormData({...formData, appAuthor: e.target.value})} /></div>
      <div className="form-row-full-v"><label>App Contact</label><input type="text" value={formData.appContact} onChange={(e) => setFormData({...formData, appContact: e.target.value})} /></div>
      <div className="form-row-full-v"><label>App Website</label><input type="text" value={formData.appWebsite} onChange={(e) => setFormData({...formData, appWebsite: e.target.value})} /></div>
      <div className="form-row-full-v align-start-v"><label className="mt-8">App Description</label><textarea value={formData.appDescription} onChange={(e) => setFormData({...formData, appDescription: e.target.value})} /></div>
     </div>

     <div className="section-divider-v"></div>
     <div className="section-header-v"><h2 className="section-title-v">App Update Settings</h2></div>
     
     <div className="form-grid-v">
      <div className="form-row-full-v"><label>App Version</label><input type="text" value={formData.appVersion} onChange={(e) => setFormData({...formData, appVersion: e.target.value})} /></div>
      <div className="form-row-full-v">
       <label>Update Status</label>
       <select value={formData.appUpdateStatus} onChange={(e) => setFormData({...formData, appUpdateStatus: e.target.value})}>
        <option value="ON">ON</option><option value="OFF">OFF</option>
       </select>
      </div>
      <div className="form-row-full-v"><label>Update Msg</label><input type="text" value={formData.appUpdateMsg} onChange={(e) => setFormData({...formData, appUpdateMsg: e.target.value})} /></div>
      <div className="form-row-full-v"><label>Update URL</label><input type="text" value={formData.appUpdateUrl} onChange={(e) => setFormData({...formData, appUpdateUrl: e.target.value})} /></div>
      <div className="form-row-full-v">
       <label>Cancel Button</label>
       <select value={formData.appCancelBtn} onChange={(e) => setFormData({...formData, appCancelBtn: e.target.value})}>
        <option value="ON">ON</option><option value="OFF">OFF</option>
       </select>
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
    .android-settings-page { background: #000; min-height: 100vh; padding: 25px 40px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    .form-content-v { max-width: 1000px; }
    .section-header-v { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #111; padding-bottom: 10px; }
    .section-title-v { font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-row-full-v { display: flex; align-items: center; margin-bottom: 12px; }
    .form-row-full-v label { width: 180px; font-weight: 600; color: #aaa; font-size: 0.85rem; }
    .form-row-full-v input, .form-row-full-v select, .form-row-full-v textarea { flex: 1; background: #1a1b1e; border: 1px solid #2a2c31; padding: 10px 14px; border-radius: 4px; color: #fff; outline: none; font-size: 0.9rem; }
    .form-row-full-v textarea { min-height: 80px; resize: vertical; }
    .section-divider-v { height: 1px; background: #111; margin: 25px 0; }
    .save-btn-v { background: #b3d332; color: #fff; border: none; padding: 10px 25px; border-radius: 4px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: 0.3s; }
    .save-btn-v:hover { background: #b3d332; transform: translateY(-1px); }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .custom-alert-box-v { position: fixed; top: 40px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 30px 60px; z-index: 9999; box-shadow: 0 20px 50px rgba(0,0,0,0.6); border: 1px solid #333; }
    .alert-content-v { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text-v { color: #fff; font-size: 1.2rem; font-weight: 800; text-align: center; }
   ` }} />
  </div>
 );
};
export default AndroidAppSettings;
