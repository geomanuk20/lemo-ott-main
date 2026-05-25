import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Bell, Send } from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/android-app/notification';

const AndroidNotification = () => {
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [notification, setNotification] = useState(null);
 const [formData, setFormData] = useState({ onesignalAppId: '', onesignalRestApiKey: '' });
 const [pushData, setPushData] = useState({ title: '', message: '', imageUrl: '', externalLink: '' });

 useEffect(() => { fetchSettings(); }, []);
 const fetchSettings = async () => {
  try {
   const res = await fetch(API_URL);
   const data = await res.json();
   setFormData(data);
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
   const res = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });
   if (res.ok) showNotification('Notification settings saved successfully');
   else showNotification('Error saving settings', 'error');
  } catch (err) { showNotification('Something went wrong', 'error'); } finally { setSaving(false); }
 };

 const handleSendPush = (e) => {
  e.preventDefault();
  showNotification('Push Notification Sent Successfully');
  setPushData({ title: '', message: '', imageUrl: '', externalLink: '' });
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
   
   <div className="settings-grid-v">
    <form onSubmit={handleSubmit} className="settings-form-v">
     <div className="form-content-v">
      <div className="section-header-v">
       <Bell size={18} className="section-icon-v" />
       <h2 className="section-title-v">Notification Settings</h2>
      </div>
      <div className="form-row-full-v"><label>OneSignal App ID</label><input type="text" value={formData.onesignalAppId} onChange={(e) => setFormData({...formData, onesignalAppId: e.target.value})} /></div>
      <div className="form-row-full-v"><label>OneSignal REST API Key</label><input type="text" value={formData.onesignalRestApiKey} onChange={(e) => setFormData({...formData, onesignalRestApiKey: e.target.value})} /></div>
      <div className="form-actions-left-v mt-20">
       <button type="submit" className="save-btn-v" disabled={saving}>
        {saving ? <Loader size="small" inline={true} /> : 'Save Configuration'}
       </button>
      </div>
     </div>
    </form>

    <form onSubmit={handleSendPush} className="settings-form-v mt-40">
     <div className="form-content-v">
      <div className="section-header-v">
       <Send size={18} className="section-icon-v" />
       <h2 className="section-title-v">Send Push Notification</h2>
      </div>
      <div className="form-row-full-v"><label>Title</label><input type="text" value={pushData.title} onChange={(e) => setPushData({...pushData, title: e.target.value})} required /></div>
      <div className="form-row-full-v align-start-v"><label className="mt-8">Message</label><textarea value={pushData.message} onChange={(e) => setPushData({...pushData, message: e.target.value})} required /></div>
      <div className="form-row-full-v"><label>Image URL</label><input type="text" value={pushData.imageUrl} onChange={(e) => setPushData({...pushData, imageUrl: e.target.value})} placeholder="Optional" /></div>
      <div className="form-row-full-v"><label>External Link</label><input type="text" value={pushData.externalLink} onChange={(e) => setPushData({...pushData, externalLink: e.target.value})} placeholder="Optional" /></div>
      <div className="form-actions-left-v mt-20">
       <button type="submit" className="save-btn-v blue-btn-v">
        <Send size={16} />
        <span>Send Push Notification</span>
       </button>
      </div>
     </div>
    </form>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .android-settings-page { background: #000; min-height: 100vh; padding: 25px 40px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    .form-content-v { max-width: 900px; }
    .section-header-v { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #111; padding-bottom: 10px; }
    .section-title-v { font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-row-full-v { display: flex; align-items: center; margin-bottom: 12px; }
    .form-row-full-v label { width: 220px; font-weight: 600; color: #aaa; font-size: 0.85rem; }
    .form-row-full-v input, .form-row-full-v textarea { flex: 1; background: #1a1b1e; border: 1px solid #2a2c31; padding: 10px 14px; border-radius: 4px; color: #fff; outline: none; font-size: 0.9rem; }
    .form-row-full-v textarea { min-height: 80px; resize: vertical; }
    .save-btn-v { background: #b3d332; color: #fff; border: none; padding: 10px 25px; border-radius: 4px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px; }
    .save-btn-v:hover { background: #b3d332; transform: translateY(-1px); }
    .blue-btn-v { background: #3ab0f0; }
    .blue-btn-v:hover { background: #1da1f2; }
    .mt-40 { margin-top: 40px; }
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
export default AndroidNotification;
