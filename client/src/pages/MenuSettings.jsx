import React, { useState, useEffect } from 'react';
import { 
 Loader2, 
 CheckCircle2, 
 XCircle 
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/menu-settings';

const MenuSettings = () => {
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  shows: 'ON',
  movies: 'ON',
  sports: 'ON',
  liveTv: 'ON',
  shortFilms: 'ON',
  webSeries: 'ON',
  shorts: 'ON'
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
    showNotification('Menu settings saved successfully');
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
  <div className="menu-settings-page">
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
     
     <div className="form-row-full-v">
      <label>Shows</label>
      <select name="shows" value={formData.shows} onChange={handleChange}>
       <option value="ON">ON</option>
       <option value="OFF">OFF</option>
      </select>
     </div>

     <div className="form-row-full-v">
      <label>Movies</label>
      <select name="movies" value={formData.movies} onChange={handleChange}>
       <option value="ON">ON</option>
       <option value="OFF">OFF</option>
      </select>
     </div>

     <div className="form-row-full-v">
      <label>Sports</label>
      <select name="sports" value={formData.sports} onChange={handleChange}>
       <option value="ON">ON</option>
       <option value="OFF">OFF</option>
      </select>
     </div>

     <div className="form-row-full-v">
      <label>Live TV</label>
      <select name="liveTv" value={formData.liveTv} onChange={handleChange}>
       <option value="ON">ON</option>
       <option value="OFF">OFF</option>
      </select>
     </div>

     <div className="form-row-full-v">
      <label>Short Films</label>
      <select name="shortFilms" value={formData.shortFilms} onChange={handleChange}>
       <option value="ON">ON</option>
       <option value="OFF">OFF</option>
      </select>
     </div>

     <div className="form-row-full-v">
      <label>Web Series</label>
      <select name="webSeries" value={formData.webSeries} onChange={handleChange}>
       <option value="ON">ON</option>
       <option value="OFF">OFF</option>
      </select>
     </div>

     <div className="form-row-full-v">
      <label>Shorts</label>
      <select name="shorts" value={formData.shorts || 'ON'} onChange={handleChange}>
       <option value="ON">ON</option>
       <option value="OFF">OFF</option>
      </select>
     </div>

     <div className="form-actions-left-v mt-20">
      <button type="submit" className="save-btn-v" disabled={saving}>
       {saving ? <Loader size="small" inline={true} /> : 'Save Settings'}
      </button>
     </div>

    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .menu-settings-page { background: #000; min-height: 100vh; padding: 30px 50px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    
    .form-content-v { max-width: 900px; }
    
    .form-row-full-v { display: flex; align-items: center; margin-bottom: 15px; }
    .form-row-full-v label { width: 180px; font-weight: 600; color: #aaa; font-size: 0.85rem; flex-shrink: 0; }
    
    .form-row-full-v select { 
     flex: 1;
     background: #1a1b1e; 
     border: 1px solid #2a2c31; 
     padding: 10px 14px; 
     border-radius: 4px; 
     color: #fff; 
     outline: none; 
     font-size: 0.9rem; 
     appearance: none;
     background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
     background-repeat: no-repeat;
     background-position: right 14px center;
    }

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

export default MenuSettings;
