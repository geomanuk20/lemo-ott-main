import React, { useState, useEffect, useRef } from 'react';
import { uploadToCloudinary } from '../utils/upload';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { formatImageUrl } from '../utils/image';

const EditSeason = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const posterInputRef = useRef(null);

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
  // Fetch shows and the specific season data
  const fetchData = async () => {
   try {
    const [showsRes, seasonRes] = await Promise.all([
     fetch('/api/shows'),
     fetch(`/api/seasons/${id}`)
    ]);
    const showsData = await showsRes.json();
    const seasonData = await seasonRes.json();
    
    setShows(showsData);
    setFormData(seasonData);
   } catch (err) {
    console.error('Error fetching data:', err);
   }
  };
  fetchData();
 }, [id]);

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
   const response = await fetch(`/api/seasons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });
   if (response.ok) {
    navigate(isShortPath ? '/admin/short-web-series/seasons' : '/admin/tv-shows/seasons');
   }
  } catch (err) {
   console.error('Error updating season:', err);
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
      <h2 className="section-title">Edit Season</h2>
      
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
       {formData.poster && (
        <div className="image-preview" style={{ marginTop: '10px' }}>
         <img src={formatImageUrl(formData, 'poster') || 'https://via.placeholder.com/300x450'} alt="Preview" style={{ maxWidth: '200px', borderRadius: '4px' }} />
        </div>
       )}
       <p className="hint">(Recommended resolution : 800x450)</p>
      </div>

      <div className="form-group">
       <label>Trailer URL</label>
       <input type="text" name="trailerUrl" value={formData.trailerUrl} onChange={handleChange} />
       <p className="hint">(Supported : MP4, YouTube, Vimeo, HLS / m3u8 URL...)</p>
      </div>

      <div className="form-group">
       <label>Status</label>
       <select name="status" value={formData.status} onChange={handleChange}>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
       </select>
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
        <span>{loading ? 'Updating...' : 'Update'}</span>
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

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
   ` }} />
  </div>
 );
};

export default EditSeason;
