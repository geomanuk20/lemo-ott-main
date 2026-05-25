import React, { useState, useEffect } from 'react';
import { 
 Loader2, 
 CheckCircle2, 
 XCircle,
 ChevronDown
} from 'lucide-react';
import Loader from '../components/Loader';

const API_URL = '/api/player-ads';

const PlayerAds = () => {
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [notification, setNotification] = useState(null);
 
 const [formData, setFormData] = useState({
  defaultAds: 'VAST, VMAP and IMA',
  sourceType: 'URL',
  sourceUrl: 'https://cdn.theplayer.com/demos/ads/vast/vast.xml',
  ad1Source: 'https://cdn.theplayer.com/demos/ads/vast/vast.xml',
  ad1Timestart: '00:00:10',
  ad1TargetLink: 'https://codecanyon.net/item/video-streaming-portal-tv-shows-movies-sports-video-streaming/25581885',
  ad2Source: '',
  ad2Timestart: '00:30:00',
  ad2TargetLink: '#',
  ad3Source: '',
  ad3Timestart: '01:30:00',
  ad3TargetLink: '#'
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
    showNotification('Ads settings saved successfully');
   } else {
    showNotification('Error saving ads settings', 'error');
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
  <div className="player-ads-page">
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

   <form onSubmit={handleSubmit} className="ads-form-v">
    
    {/* Top Dropdown */}
    <div className="form-row-full-v">
     <label>Default Ads</label>
     <div className="input-with-hint-v">
      <select name="defaultAds" value={formData.defaultAds} onChange={handleChange}>
       <option value="None (No Ads)">None (No Ads)</option>
       <option value="Built-in Advertisement">Built-in Advertisement</option>
       <option value="VAST, VMAP and IMA">VAST, VMAP and IMA</option>
      </select>
      <p className="hint-text-v">(Based on your Player Ads settings)</p>
     </div>
    </div>

    {/* Section Title */}
    <h2 className="section-title-v">VAST, VMAP and IMA / DFP advertising</h2>
    <p className="section-desc-v">
     Currently support inline linear (pre-roll, mid-roll, post-roll, pods) and nonlinear ads. To add an VAST, VMAP or Google IMA URL path to the player to be played.
    </p>

    <div className="form-row-full-v mt-20">
     <label>Source Type</label>
     <select name="sourceType" value={formData.sourceType} onChange={handleChange}>
      <option value="URL">URL</option>
      <option value="Raw Code">Raw Code</option>
     </select>
    </div>

    <div className="form-row-full-v">
     <label>Source URL</label>
     <input 
      type="text" 
      name="sourceUrl" 
      value={formData.sourceUrl} 
      onChange={handleChange} 
      placeholder="https://cdn.theplayer.com/demos/ads/vast/vast.xml"
     />
    </div>

    {/* Section Title 2 */}
    <h2 className="section-title-v mt-40">Built-in advertisement</h2>

    <div className="note-box-v mb-30">
     <p><strong>Note:</strong> This settings only work with web player</p>
    </div>

    <div className="help-texts-v mb-30">
     <p><strong>Source:</strong> The ad source, it can be a mp4 video path, an image path, webpage URL or a youtube video url.</p>
     <p><strong>Timestart:</strong> The ad start time when it will appear in hours:minutes:seconds format.</p>
     <p><strong>Target Link:</strong> The link to open when the ad is clicked.</p>
    </div>

    {/* Ad Slots */}
    {[1, 2, 3].map((num) => (
     <div key={num} className="ad-slot-v">
      <div className="form-row-full-v">
       <label>Ad{num} Source</label>
       <input 
        type="text" 
        name={`ad${num}Source`} 
        value={formData[`ad${num}Source`]} 
        onChange={handleChange} 
       />
      </div>
      <div className="form-row-full-v">
       <label>Ad{num} Timestart</label>
       <input 
        type="text" 
        name={`ad${num}Timestart`} 
        value={formData[`ad${num}Timestart`]} 
        onChange={handleChange} 
       />
      </div>
      <div className="form-row-full-v">
       <label>Ad{num} {num === 1 ? 'Target Link' : 'Link'}</label>
       <input 
        type="text" 
        name={num === 1 ? 'ad1TargetLink' : `ad${num}Link`} 
        value={num === 1 ? formData.ad1TargetLink : (formData[`ad${num}Link`] || '')} 
        onChange={handleChange} 
       />
      </div>
     </div>
    ))}

    <div className="form-actions-bottom-v">
     <button type="submit" className="save-btn-v" disabled={saving}>
      {saving ? <Loader size="small" inline={true} /> : 'Save Settings'}
     </button>
    </div>

   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .player-ads-page { background: #000; min-height: 100vh; padding: 30px 50px; color: #fff; animation: fadeIn 0.4s ease; }
    .loading-container-v { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
    
    .section-title-v { font-size: 0.9rem; font-weight: 800; margin-bottom: 10px; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #111; padding-bottom: 8px; }
    .section-desc-v { color: #666; font-size: 0.8rem; line-height: 1.5; margin-bottom: 20px; }
    
    .form-row-full-v { display: flex; align-items: center; margin-bottom: 15px; }
    .form-row-full-v label { width: 200px; font-weight: 600; color: #aaa; font-size: 0.85rem; flex-shrink: 0; }
    
    .input-with-hint-v { flex: 1; }
    .hint-text-v { font-size: 0.7rem; color: #444; margin-top: 4px; }

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

    .mt-20 { margin-top: 20px; }
    .mt-40 { margin-top: 40px; }
    .mb-30 { margin-bottom: 20px; }
    
    .note-box-v { background: rgba(255, 0, 0, 0.05); border: 1px solid rgba(255, 0, 0, 0.1); padding: 10px 18px; border-radius: 4px; }
    .note-box-v p { color: #ff4d4d; font-size: 0.8rem; margin: 0; opacity: 0.9; }
    
    .help-texts-v p { font-size: 0.8rem; color: #777; margin-bottom: 6px; line-height: 1.4; }
    .help-texts-v strong { color: #bbb; margin-right: 5px; text-transform: uppercase; font-size: 0.75rem; }

    .ad-slot-v { margin-bottom: 25px; border-bottom: 1px solid #111; padding-bottom: 10px; }
    .ad-slot-v:last-of-type { border-bottom: none; }

    .form-actions-bottom-v { display: flex; justify-content: flex-end; margin-top: 20px; padding-bottom: 40px; }
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

export default PlayerAds;
