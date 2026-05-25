import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle,
  ChevronDown
 } from 'lucide-react';
 import Loader from '../components/Loader';
 import { formatBrandingUrl } from '../utils/branding';

const API_URL = '/api/general-settings';

const GeneralSettings = () => {
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  siteName: 'Viaavi Streaming - Watch TV Shows, Movies Online',
  siteLogo: 'upload/site_logo.png',
  siteFavicon: 'upload/favicon.png',
  email: 'info@viavilab.com',
  description: 'Viaavi Streaming is Best Script for Streaming Website & Application...',
  siteKeywords: 'Video Streaming, Streaming Website...',
  headerCode: '',
  footerCode: '',
  copyrightText: 'Copyright © 2024 www.viaviweb.com All Rights Reserved.',
  defaultTimezone: '(UTC+05:30) Asia/Kolkata',
  defaultLanguage: 'English',
  siteStyling: 'Style 6',
  currencyCode: 'USD - US Dollar',
  tmdbApiToken: 'Hidden in Demo',
  tmdbApiLanguage: 'English (United States)',
  facebookUrl: 'https://www.facebook.com/viaviweb/',
  twitterUrl: 'https://twitter.com/viaviwebtech/',
  instagramUrl: 'https://www.instagram.com/viaviwebtech/',
  googlePlayUrl: 'https://play.google.com/store/apps/dev?id=71574785',
  appleStoreUrl: 'https://apps.apple.com/in/developer/vishal-pamar/id1',
  gdprConsent: 'Active',
  gdprTitle: 'This website is using cookies',
  gdprText: 'We use them to give you the best experience...',
  gdprPrivacyUrl: '#'
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
   const saveData = { ...formData };
   delete saveData._id;
   delete saveData.__v;
   delete saveData.createdAt;
   delete saveData.updatedAt;

   const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saveData)
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

 const handleFileSelect = (fieldId) => {
  document.getElementById(fieldId).click();
 };

 const handleFileUpload = async (e, field) => {
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
    const trimmedUrl = data.url.trim();
    setFormData(prev => ({ ...prev, [field]: trimmedUrl }));
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
  <div className="general-settings-page">
   <input 
    type="file" 
    id="logo-input" 
    style={{ display: 'none' }} 
    onChange={(e) => handleFileUpload(e, 'siteLogo')} 
   />
   <input 
    type="file" 
    id="favicon-input" 
    style={{ display: 'none' }} 
    onChange={(e) => handleFileUpload(e, 'siteFavicon')} 
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
     
     {/* Left Column */}
     <div className="settings-column-v">
      
      <div className="form-row-v">
       <label>Site Name*</label>
       <input type="text" name="siteName" value={formData.siteName} onChange={handleChange} required />
      </div>

      <div className="form-row-v">
       <label>Site Logo*</label>
       <div className="file-input-group-v">
        <input type="text" name="siteLogo" value={formData.siteLogo} onChange={handleChange} />
        <button type="button" className="select-btn-v" onClick={() => handleFileSelect('logo-input')}>Select</button>
       </div>
       <p className="hint-text-v">(Recommended resolution : 180x50)</p>
       <div className="logo-preview-box-v">
        {formData.siteLogo ? (
          <img 
            src={formatBrandingUrl(formData.siteLogo)} 
            alt="Logo Preview" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
          />
        ) : (
          <div className="preview-logo-placeholder-v">LEMO OTT</div>
        )}
       </div>
      </div>

      <div className="form-row-v">
       <label>Site Favicon*</label>
       <div className="file-input-group-v">
        <input type="text" name="siteFavicon" value={formData.siteFavicon} onChange={handleChange} />
        <button type="button" className="select-btn-v" onClick={() => handleFileSelect('favicon-input')}>Select</button>
       </div>
       <p className="hint-text-v">(Recommended resolution : 16x16, 32x32)</p>
       <div className="favicon-preview-v">
        {formData.siteFavicon ? (
          <img 
            src={formatBrandingUrl(formData.siteFavicon, '/favicon.svg')} 
            alt="Favicon" 
            style={{ width: '100%', height: '100%', borderRadius: '4px' }} 
          />
        ) : 'L'}
       </div>
      </div>

      <div className="form-row-v">
       <label>Email*</label>
       <input type="email" name="email" value={formData.email} onChange={handleChange} required />
      </div>

      <div className="form-row-v">
       <label>Description</label>
       <textarea name="description" value={formData.description} onChange={handleChange} rows="4"></textarea>
      </div>

      <div className="form-row-v">
       <label>Site Keywords</label>
       <textarea name="siteKeywords" value={formData.siteKeywords} onChange={handleChange} rows="3"></textarea>
      </div>

      <div className="form-row-v">
       <label>Header Code</label>
       <textarea name="headerCode" value={formData.headerCode} onChange={handleChange} placeholder="Custom CSS OR JS script" rows="4"></textarea>
      </div>

      <div className="form-row-v">
       <label>Footer Code</label>
       <textarea name="footerCode" value={formData.footerCode} onChange={handleChange} placeholder="Custom CSS OR JS script" rows="4"></textarea>
      </div>

      <div className="form-row-v">
       <label>Copyright Text</label>
       <textarea name="copyrightText" value={formData.copyrightText} onChange={handleChange} rows="3"></textarea>
      </div>

     </div>

     {/* Right Column */}
     <div className="settings-column-v">
      
      <div className="form-row-v">
       <label>Default Timezone</label>
       <select name="defaultTimezone" value={formData.defaultTimezone} onChange={handleChange}>
        <option value="(UTC+05:30) Asia/Kolkata">(UTC+05:30) Asia/Kolkata</option>
        <option value="UTC">UTC</option>
       </select>
      </div>

      <div className="form-row-v">
       <label>Default Language</label>
       <select name="defaultLanguage" value={formData.defaultLanguage} onChange={handleChange}>
        <option value="English">English</option>
        <option value="Hindi">Hindi</option>
       </select>
      </div>

      <div className="form-row-v">
       <label>Site Styling</label>
       <select name="siteStyling" value={formData.siteStyling} onChange={handleChange}>
        <option value="Style 6">Style 6</option>
        <option value="Style 5">Style 5</option>
       </select>
      </div>

      <div className="form-row-v">
       <label>Currency Code*</label>
       <select name="currencyCode" value={formData.currencyCode} onChange={handleChange}>
        <option value="USD - US Dollar">USD - US Dollar</option>
        <option value="INR - Indian Rupee">INR - Indian Rupee</option>
       </select>
      </div>

      <h3 className="sub-section-title-v">TMDB API</h3>
      
      <div className="form-row-v">
       <label>API Read Access Token</label>
       <textarea name="tmdbApiToken" value={formData.tmdbApiToken} onChange={handleChange} rows="4"></textarea>
      </div>

      <div className="form-row-v">
       <label>TMDB API Data Language</label>
       <select name="tmdbApiLanguage" value={formData.tmdbApiLanguage} onChange={handleChange}>
        <option value="English (United States)">English (United States)</option>
       </select>
      </div>

      <h3 className="sub-section-title-v">Footer Icon</h3>
      <p className="section-hint-v">Leave empty if you don't want to display the social icon.</p>
      
      <div className="form-row-v">
       <label>Facebook URL</label>
       <input type="text" name="facebookUrl" value={formData.facebookUrl} onChange={handleChange} />
      </div>

      <div className="form-row-v">
       <label>Twitter URL</label>
       <input type="text" name="twitterUrl" value={formData.twitterUrl} onChange={handleChange} />
      </div>

      <div className="form-row-v">
       <label>Instagram URL</label>
       <input type="text" name="instagramUrl" value={formData.instagramUrl} onChange={handleChange} />
      </div>

      <h3 className="sub-section-title-v">Apps</h3>
      <p className="section-hint-v">Leave empty if you don't want to display the app download button.</p>

      <div className="form-row-v">
       <label>Google Play URL</label>
       <input type="text" name="googlePlayUrl" value={formData.googlePlayUrl} onChange={handleChange} />
      </div>

      <div className="form-row-v">
       <label>Apple Store URL</label>
       <input type="text" name="appleStoreUrl" value={formData.appleStoreUrl} onChange={handleChange} />
      </div>

     </div>

    </div>

    {/* GDPR Section */}
    <div className="gdpr-section-v">
     <h2 className="section-main-title-v">GDPR Cookie Consent</h2>
     
     <div className="form-row-v">
      <label>GDPR Cookie Consent</label>
      <select name="gdprConsent" value={formData.gdprConsent} onChange={handleChange}>
       <option value="Active">Active</option>
       <option value="Inactive">Inactive</option>
      </select>
     </div>

     <div className="form-row-v">
      <label>GDPR Consent Title</label>
      <input type="text" name="gdprTitle" value={formData.gdprTitle} onChange={handleChange} />
     </div>

     <div className="form-row-v">
      <label>GDPR Consent Text</label>
      <textarea name="gdprText" value={formData.gdprText} onChange={handleChange} rows="3"></textarea>
     </div>

     <div className="form-row-v">
      <label>GDPR Privacy URL</label>
      <input type="text" name="gdprPrivacyUrl" value={formData.gdprPrivacyUrl} onChange={handleChange} />
     </div>
    </div>

    <div className="form-actions-bottom-v">
     <button type="submit" className="save-btn-large-v" disabled={saving}>
      {saving ? <Loader size="small" inline={true} /> : 'Save Settings'}
     </button>
    </div>

   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .general-settings-page { background: #000; min-height: 100vh; padding: 30px 50px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    
    .settings-grid-v { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; max-width: 1200px; margin-bottom: 40px; }
    
    .form-row-v { margin-bottom: 18px; }
    .form-row-v label { display: block; font-weight: 600; color: #aaa; margin-bottom: 8px; font-size: 0.85rem; }
    
    .form-row-v input, .form-row-v select, .form-row-v textarea { 
     width: 100%; 
     background: #1a1b1e; 
     border: 1px solid #2a2c31; 
     padding: 10px 14px; 
     border-radius: 4px; 
     color: #fff; 
     outline: none; 
     font-size: 0.9rem; 
    }

    .file-input-group-v { display: flex; }
    .file-input-group-v input { border-top-right-radius: 0; border-bottom-right-radius: 0; border-right: none; }
    .select-btn-v { background: #2a2c31; color: #fff; border: 1px solid #333; padding: 0 15px; border-top-right-radius: 4px; border-bottom-right-radius: 4px; cursor: pointer; font-weight: 700; font-size: 0.8rem; }
    
    .hint-text-v { font-size: 0.75rem; color: #666; margin-top: 6px; }
    
    .logo-preview-box-v { margin-top: 15px; width: 140px; height: 50px; background: #111; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 1px solid #222; }
    .preview-logo-placeholder-v { color: #b3d332; font-weight: 900; font-size: 1.6rem; font-style: italic; letter-spacing: -1.5px; opacity: 0.8; }
    
    .favicon-preview-v { margin-top: 15px; width: 24px; height: 24px; background: #b3d332; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 0.9rem; }

    .sub-section-title-v { font-size: 0.95rem; font-weight: 800; margin: 30px 0 15px 0; border-bottom: 1px solid #111; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .section-hint-v { font-size: 0.8rem; color: #555; margin-bottom: 20px; }

    .section-main-title-v { font-size: 1rem; font-weight: 800; margin-bottom: 20px; border-top: 1px solid #111; padding-top: 30px; text-transform: uppercase; letter-spacing: 0.5px; }
    .gdpr-section-v { max-width: 1200px; margin-bottom: 40px; }

    .form-actions-bottom-v { display: flex; margin-top: 30px; padding-bottom: 60px; }
    .save-btn-large-v { background: #b3d332; color: #fff; border: none; padding: 12px 40px; border-radius: 4px; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; }
    .save-btn-large-v:hover { background: #b3d332; transform: translateY(-1px); }

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

export default GeneralSettings;
