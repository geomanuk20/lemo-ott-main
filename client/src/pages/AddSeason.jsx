import React, { useState, useEffect, useRef } from 'react';
import { uploadToCloudinary } from '../utils/upload';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';

const AddSeason = () => {
 const navigate = useNavigate();
 const posterInputRef = useRef(null);
 const trailerInputRef = useRef(null);

 const [formData, setFormData] = useState({
  showId: '',
  title: '',
  poster: '',
  trailerUrl: '',
  status: 'Active',
  seoTitle: '',
  metaDescription: '',
  keywords: ''
 });

 const [shows, setShows] = useState([]);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
  // Fetch shows for the dropdown
  const fetchShows = async () => {
   try {
    const response = await fetch('/api/shows');
    const data = await response.json();
    setShows(data);
   } catch (err) {
    console.error('Error fetching shows:', err);
   }
  };
  fetchShows();
 }, []);

 const isShortPath = window.location.pathname.includes('/short-web-series');

 const handleChange = (e) => {
  const { name, value } = e.target;
  if (name === 'showId') {
   const selectedShowObj = shows.find(s => s._id === value);
   setFormData(prev => ({ 
    ...prev, 
    showId: value,
    showName: selectedShowObj ? selectedShowObj.title : ''
   }));
  } else {
   setFormData(prev => ({ ...prev, [name]: value }));
  }
 };

 const handleFileChange = async (e, field) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
   setLoading(true);
   const url = await uploadToCloudinary(file);
   if (url) {
    setFormData(prev => ({ ...prev, [field]: url }));
   } else {
    alert('Upload failed');
   }
  } catch (err) {
   alert('Error uploading file: ' + err.message);
  } finally {
   setLoading(false);
  }
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
   const response = await fetch('/api/seasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });
   if (response.ok) {
    navigate(isShortPath ? '/admin/short-web-series/seasons' : '/admin/tv-shows/seasons');
   }
  } catch (err) {
   console.error('Error adding season:', err);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="add-season-page">
   <div className="top-nav">
    <button className="back-btn" onClick={() => navigate(isShortPath ? '/admin/short-web-series/seasons' : '/admin/tv-shows/seasons')}>
     <ChevronLeft size={24} />
     <span>Back</span>
    </button>
   </div>

   <form onSubmit={handleSubmit}>
    <div className="form-grid">
     {/* Left Column: Season Info */}
     <div className="form-column">
      <h2 className="section-title">Season Info</h2>
      
      <div className="form-group">
       <label>Shows</label>
       <select name="showId" value={formData.showId} onChange={handleChange} required>
        <option value="">Select Show</option>
        {shows
         .filter(show => isShortPath ? show.contentType === 'Short Web Series' : (show.contentType === 'TV Show' || !show.contentType))
         .map(show => (
          <option key={show._id} value={show._id}>{show.title}</option>
         ))
        }
       </select>
      </div>

      <div className="form-group">
       <label>Season Title</label>
       <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="Season 1" />
      </div>

      <div className="form-group">
       <label>Season Poster</label>
       <div className="file-input-group">
        <input type="text" name="poster" value={formData.poster} onChange={handleChange} placeholder="Paste image URL..." />
        <button type="button" className="select-btn" onClick={() => posterInputRef.current.click()}>Select</button>
        <input type="file" ref={posterInputRef} hidden onChange={(e) => handleFileChange(e, 'poster')} />
       </div>
       <p className="hint">(Recommended resolution : 800x450)</p>
      </div>

       <div className="form-group">
        <label>Trailer URL / File</label>
        <div className="file-input-group">
         <input type="text" name="trailerUrl" value={formData.trailerUrl} onChange={handleChange} />
         <button type="button" className="select-btn" onClick={() => trailerInputRef.current.click()}>Select</button>
         <input type="file" ref={trailerInputRef} style={{ display: 'none' }} accept="video/*" onChange={(e) => handleFileChange(e, 'trailerUrl')} />
        </div>
        <p className="hint">(Supported : MP4, YouTube, Vimeo, HLS / m3u8 URL. If you are using external files then those files have to be CORS enabled otherwise they will not work.)</p>
       </div>

      <div className="form-group">
       <label>Status</label>
       <div className="custom-radio-group">
        <label className="radio-item">
         <input type="radio" name="status" value="Active" checked={formData.status === 'Active'} onChange={handleChange} />
         <span className="radio-dot"></span>
         <span>Active</span>
        </label>
        <label className="radio-item ml-30">
         <input type="radio" name="status" value="Inactive" checked={formData.status === 'Inactive'} onChange={handleChange} />
         <span className="radio-dot"></span>
         <span>Inactive</span>
        </label>
       </div>
      </div>
     </div>

     {/* Right Column: SEO */}
     <div className="form-column">
      <h2 className="section-title">SEO</h2>
      
      <div className="form-group">
       <label>SEO Title</label>
       <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} />
      </div>

      <div className="form-group">
       <label>Meta Description</label>
       <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange}></textarea>
      </div>

      <div className="form-group">
       <label>Keyword</label>
       <textarea name="keywords" value={formData.keywords} onChange={handleChange}></textarea>
       <p className="hint">use comma(,) to separate keyword.</p>
      </div>

      <div className="form-actions">
       <button type="submit" className="save-btn" disabled={loading}>
        <Save size={20} />
        <span>{loading ? 'Saving...' : 'Save'}</span>
       </button>
      </div>
     </div>
    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-season-page { padding: 20px; animation: fadeIn 0.3s ease-out; background-color: #0c0c0c; min-height: 100vh; }
    
    .top-nav { margin-bottom: 25px; }
    .back-btn {
     background: transparent; border: none; color: #b3d332; display: flex; align-items: center;
     gap: 8px; font-weight: 800; font-size: 1.3rem; cursor: pointer;
    }

    .section-title { color: #fff; font-size: 1.8rem; font-weight: 800; margin-bottom: 30px; border-left: 5px solid #b3d332; padding-left: 15px; line-height: 1; }

    .form-grid { display: flex; gap: 50px; }
    .form-column { flex: 1; display: flex; flex-direction: column; gap: 20px; }

    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { color: #fff; font-weight: 700; font-size: 1rem; }
    .form-group input, .form-group select, .form-group textarea {
     background: transparent; border: 1px solid #333; padding: 12px 15px; color: #fff; border-radius: 4px; outline: none; font-size: 0.95rem; transition: border-color 0.2s;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #b3d332; }
    
    .form-group textarea { height: 100px; resize: none; }
    
    .file-input-group { display: flex; }
    .file-input-group input { flex: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; }
    .select-btn { background: #444; color: #fff; border: none; padding: 0 15px; border-top-right-radius: 4px; border-bottom-right-radius: 4px; cursor: pointer; font-weight: 700; }

    .hint { color: #888; font-size: 0.85rem; margin-top: 8px; font-weight: 500; }

    .form-actions { display: flex; justify-content: flex-end; margin-top: 40px; }
    .save-btn {
     background: #b3d332; color: #fff; border: none; padding: 12px 40px; border-radius: 4px;
     display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.1rem; cursor: pointer;
     box-shadow: 0 4px 10px rgba(255, 0, 0, 0.2); transition: transform 0.2s;
    }
    .save-btn:hover { transform: translateY(-2px); }
    .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .custom-radio-group { display: flex; align-items: center; }
    .radio-item { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem; font-weight: 700; position: relative; color: #fff; }
    .radio-item input { position: absolute; opacity: 0; cursor: pointer; }
    .radio-dot { height: 20px; width: 20px; background-color: #000; border: 2px solid #fff; border-radius: 50% !important; display: inline-block; position: relative; }
    .radio-item input:checked ~ .radio-dot { border-color: #b3d332; }
    .radio-item input:checked ~ .radio-dot:after { content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: #b3d332; border-radius: 50% !important; }
    .ml-30 { margin-left: 30px; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
   ` }} />
  </div>
 );
};

export default AddSeason;
