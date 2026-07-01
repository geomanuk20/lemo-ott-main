import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Loader from '../components/Loader';
import { uploadToCloudinary } from '../utils/upload';

const EditSlider = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const fileInputRef = useRef(null);
 const videoInputRef = useRef(null);
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [formData, setFormData] = useState({
  title: '',
  image: '',
  contentType: 'Image',
  videoType: 'URL',
  videoUrl: '',
  postType: '',
  contentId: '',
  displayOn: [],
  status: 'Active',
  link: ''
 });
 const [contentList, setContentList] = useState([]);

 useEffect(() => {
  const fetchSlider = async () => {
   try {
    const response = await fetch(`/api/sliders/${id}`);
    const data = await response.json();
    setFormData({
     title: data.title || '',
     image: data.image || '',
     contentType: data.contentType || 'Image',
     videoType: data.videoUrl?.startsWith('data:') ? 'File' : 'URL',
     videoUrl: data.videoUrl || '',
     postType: data.postType || '',
     contentId: data.contentId || '',
     displayOn: data.displayOn || [],
     imdbRating: data.imdbRating || '',
     releaseYear: data.releaseYear || '',
     duration: data.duration || '',
     videoQuality: data.videoQuality || '8K Ultra HD',
     ccActive: data.ccActive || 'Yes',
     status: data.status || 'Active',
     link: data.link || ''
    });
   } catch (err) {
    console.error('Error fetching slider:', err);
   } finally {
    setLoading(false);
   }
  };
  fetchSlider();
 }, [id]);

 useEffect(() => {
  const fetchContent = async () => {
   if (!formData.postType) {
    setContentList([]);
    return;
   }

   let endpoint = '';
   if (formData.postType === 'Movies' || formData.postType === 'Short Film') endpoint = '/api/movies';
   else if (formData.postType === 'TV Shows' || formData.postType === 'Short Web Series') endpoint = '/api/shows';
   else if (formData.postType === 'Sports') endpoint = '/api/sports-videos';
   else if (formData.postType === 'Live TV') endpoint = '/api/channels';

   if (endpoint) {
    try {
     const res = await fetch(endpoint);
     const data = await res.json();
     if (formData.postType === 'Short Film') {
      setContentList(data.filter(item => item.contentType === 'Short Film'));
     } else if (formData.postType === 'Movies') {
      setContentList(data.filter(item => item.contentType !== 'Short Film'));
     } else if (formData.postType === 'Short Web Series') {
      setContentList(data.filter(item => item.contentType === 'Short Web Series'));
     } else if (formData.postType === 'TV Shows') {
      setContentList(data.filter(item => item.contentType !== 'Short Web Series'));
     } else {
      setContentList(data);
     }
    } catch (err) {
     console.error('Error fetching content list:', err);
    }
   }
  };
  fetchContent();
 }, [formData.postType]);

  const handleChange = (e) => {
   const { name, value } = e.target;
   setFormData(prev => {
    const nextData = { ...prev, [name]: value };
    if (name === 'contentId' && value) {
     const selectedItem = contentList.find(item => item._id === value);
     if (selectedItem) {
      nextData.title = selectedItem.title || selectedItem.name || prev.title;
      nextData.imdbRating = selectedItem.imdbRating || selectedItem.rating || '';
      
      let year = '';
      if (selectedItem.releaseDate) {
       year = String(new Date(selectedItem.releaseDate).getFullYear());
      } else if (selectedItem.releaseYear) {
       year = String(selectedItem.releaseYear);
      } else if (selectedItem.date) {
       year = String(selectedItem.date).split('-')[0] || String(selectedItem.date).split('/')[0] || '';
      }
      nextData.releaseYear = year;
      
      nextData.videoQuality = selectedItem.videoQuality || '8K Ultra HD';
      nextData.duration = selectedItem.duration || '';
      nextData.image = selectedItem.poster || selectedItem.thumbnail || selectedItem.logo || prev.image;
      
      const typeMap = {
       'Movies': 'movie',
       'Short Film': 'movie',
       'TV Shows': 'show',
       'Short Web Series': 'show',
       'Sports': 'sports',
       'Live TV': 'live'
      };
      const type = typeMap[prev.postType] || 'movie';
      nextData.link = `/details/${type}/${value}`;
     }
    }
    return nextData;
   });
  };

 const handleCheckboxChange = (e) => {
  const { value, checked } = e.target;
  setFormData(prev => {
   const displayOn = checked 
    ? [...prev.displayOn, value] 
    : prev.displayOn.filter(item => item !== value);
   return { ...prev, displayOn };
  });
 };

 const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formDataUpload = new FormData();
  formDataUpload.append('file', file);
  try {
   setLoading(true);
   const response = await fetch('/api/upload', {
    method: 'POST',
    body: formDataUpload
   });
   const data = await response.json();
   if (data.url) {
    setFormData(prev => ({ ...prev, image: data.url }));
   } else {
    alert('Upload failed: ' + (data.message || 'Unknown error'));
   }
  } catch (err) {
   console.error('Upload error:', err);
   alert('Network error during upload');
  } finally {
   setLoading(false);
  }
 };

 const handleVideoFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
   setLoading(true);
   const url = await uploadToCloudinary(file);
   if (url) {
    setFormData(prev => ({ ...prev, videoUrl: url }));
   } else {
    alert('Video upload failed');
   }
  } catch (err) {
   alert('Error uploading video: ' + err.message);
  } finally {
   setLoading(false);
  }
 };

 const handleUpdate = async (e) => {
  e.preventDefault();

  // Validation
  if (!formData.title) { alert('Title is required'); return; }
  if (formData.contentType === 'Image' && !formData.image) { alert('Slider Image is required'); return; }
  if (formData.contentType === 'Video' && !formData.videoUrl) { alert('Video is required'); return; }

  setSaving(true);
  try {
   const response = await fetch(`/api/sliders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });

   const data = await response.json();

   if (response.ok) {
    navigate('/admin/home/slider');
   } else {
    alert('Error: ' + (data.message || 'Failed to update slider'));
   }
  } catch (err) {
   console.error('Error updating slider:', err);
   alert('Network error. Please check if the server is running.');
  } finally {
   setSaving(false);
  }
 };

 if (loading) {
  return (
   <div className="loader-container">
    <Loader size="small" />
   </div>
  );
 }

 return (
  <div className="add-actor-page">
   <div className="top-nav">
    <button className="back-link" onClick={() => navigate(-1)}>
     <ArrowLeft size={20} color="#b3d332" strokeWidth={3} />
     <span>Back</span>
    </button>
   </div>

   <form onSubmit={handleUpdate} className="actor-form">
    <div className="form-row-custom">
     <label>Slider Title*</label>
     <div className="input-col">
      <input 
       type="text" 
       name="title" 
       value={formData.title} 
       onChange={handleChange} 
       required 
      />
     </div>
    </div>

    <div className="form-row-custom">
     <label>Slider Type*</label>
     <div className="input-col">
      <div className="radio-group-v">
       <label className="radio-item-v">
        <input 
         type="radio" 
         name="contentType" 
         value="Image" 
         checked={formData.contentType === 'Image'} 
         onChange={handleChange} 
        />
        <span>Image</span>
       </label>
       <label className="radio-item-v">
        <input 
         type="radio" 
         name="contentType" 
         value="Video" 
         checked={formData.contentType === 'Video'} 
         onChange={handleChange} 
        />
        <span>Video</span>
       </label>
      </div>
     </div>
    </div>

    {formData.contentType === 'Image' ? (
     <div className="form-row-custom">
      <label>Slider Image*</label>
      <div className="input-col">
       <div className="file-input-wrapper">
        <input 
         type="text" 
         value={formData.image ? 'Image Selected' : ''} 
         readOnly 
        />
        <button type="button" className="select-btn" onClick={() => fileInputRef.current.click()}>Select</button>
        <input 
         type="file" 
         ref={fileInputRef} 
         hidden 
         accept="image/*" 
         onChange={handleFileChange} 
        />
       </div>
        <p className="resolution-text">(Recommended resolution : 1920x1080 / 16:9 aspect ratio)</p>
       {formData.image && (
        <div className="preview-container-wide">
         <img src={formData.image} alt="Preview" className="slider-preview-img" />
        </div>
       )}
      </div>
     </div>
    ) : (
     <>
      <div className="form-row-custom">
       <label>Slider Image</label>
       <div className="input-col">
        <div className="file-input-wrapper">
         <input 
          type="text" 
          value={formData.image ? 'Thumbnail Selected' : ''} 
          readOnly 
         />
         <button type="button" className="select-btn" onClick={() => fileInputRef.current.click()}>Select</button>
         <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/*" 
          onChange={handleFileChange} 
         />
        </div>
        <p className="resolution-text">(Thumbnail for video background)</p>
        {formData.image && (
         <div className="preview-container-wide">
          <img src={formData.image} alt="Preview" className="slider-preview-img" />
         </div>
        )}
       </div>
      </div>
      <div className="form-row-custom">
       <label>Video Option*</label>
       <div className="input-col">
        <div className="radio-group-v">
         <label className="radio-item-v">
          <input 
           type="radio" 
           name="videoType" 
           value="URL" 
           checked={formData.videoType === 'URL'} 
           onChange={handleChange} 
          />
          <span>URL</span>
         </label>
         <label className="radio-item-v">
          <input 
           type="radio" 
           name="videoType" 
           value="File" 
           checked={formData.videoType === 'File'} 
           onChange={handleChange} 
          />
          <span>File</span>
         </label>
        </div>
       </div>
      </div>

      {formData.videoType === 'URL' ? (
       <div className="form-row-custom">
        <label>Video URL*</label>
        <div className="input-col">
         <input 
          type="text" 
          name="videoUrl" 
          value={formData.videoUrl} 
          onChange={handleChange} 
          placeholder="https://example.com/video.mp4"
          required 
         />
        </div>
       </div>
      ) : (
       <div className="form-row-custom">
        <label>Upload Video*</label>
        <div className="input-col">
         <div className="file-input-wrapper">
          <input 
           type="text" 
           value={formData.videoUrl && formData.videoUrl.startsWith('data:') ? 'Video Selected' : ''} 
           readOnly 
          />
          <button type="button" className="select-btn" onClick={() => videoInputRef.current.click()}>Select</button>
          <input 
           type="file" 
           ref={videoInputRef}
           hidden 
           accept="video/*" 
           onChange={handleVideoFileChange} 
          />
         </div>
        </div>
       </div>
      )}
     </>
    )}

    <div className="form-row-custom">
     <label>Post Type</label>
     <div className="input-col">
      <select name="postType" value={formData.postType} onChange={handleChange}>
       <option value="">Select Type</option>
       <option value="Movies">Movies</option>
       <option value="Short Film">Short Film</option>
       <option value="TV Shows">TV Shows</option>
       <option value="Short Web Series">Short Web Series</option>
       <option value="Sports">Sports</option>
       <option value="Live TV">Live TV</option>
      </select>
     </div>
    </div>

    {formData.postType && (
     <div className="form-row-custom">
      <label>{formData.postType}</label>
      <div className="input-col">
       <select name="contentId" value={formData.contentId} onChange={handleChange}>
        <option value="">Select {formData.postType === 'Movies' ? 'Movie' : formData.postType === 'TV Shows' ? 'TV Show' : formData.postType === 'Short Film' ? 'Short Film' : formData.postType === 'Short Web Series' ? 'Short Web Series' : formData.postType === 'Sports' ? 'Sport' : formData.postType === 'Live TV' ? 'Live TV' : formData.postType}</option>
        {contentList.map((item) => (
         <option key={item._id} value={item._id}>{item.name || item.title}</option>
        ))}
       </select>
      </div>
     </div>
    )}

    <div className="form-row-custom">
     <label>Home Section</label>
     <div className="input-col">
      <select name="section" value={formData.section} onChange={handleChange}>
       <option value="Main Slider">Main Slider</option>
       <option value="Below Slider">Below Slider</option>
       <option value="Bottom Slider">Bottom Slider</option>
      </select>
     </div>
    </div>

    <div className="form-row-custom">
     <label>Display On</label>
     <div className="input-col">
      <div className="checkbox-group-grid-alt">
       {['Home', 'Movies', 'Shows', 'Sports', 'Live TV'].map((item) => (
        <label key={item} className="checkbox-item-alt">
         <input 
          type="checkbox" 
          value={item} 
          checked={formData.displayOn.includes(item)}
          onChange={handleCheckboxChange}
         />
         <span>{item}</span>
        </label>
       ))}
      </div>
     </div>
    </div>

    <div className="form-row-custom">
     <label>IMDb Rating</label>
     <div className="input-col">
      <input type="text" name="imdbRating" value={formData.imdbRating} onChange={handleChange} placeholder="e.g. 8.5" />
     </div>
    </div>

    <div className="form-row-custom">
     <label>Release Year</label>
     <div className="input-col">
      <input type="text" name="releaseYear" value={formData.releaseYear} onChange={handleChange} placeholder="e.g. 2024" />
     </div>
    </div>

    <div className="form-row-custom">
     <label>Duration</label>
     <div className="input-col">
      <input type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 1 hr 45 min" />
     </div>
    </div>

    <div className="form-row-custom">
     <label>Video Quality</label>
     <div className="input-col">
      <select name="videoQuality" value={formData.videoQuality} onChange={handleChange}>
       <option value="8K Ultra HD">8K Ultra HD</option>
       <option value="4K Ultra HD">4K Ultra HD</option>
       <option value="Ultra HD">Ultra HD</option>
       <option value="HDR">HDR</option>
       <option value="Full HD">Full HD</option>
       <option value="HD">HD</option>
      </select>
     </div>
    </div>

    <div className="form-row-custom">
     <label>CC Active</label>
     <div className="input-col">
      <select name="ccActive" value={formData.ccActive} onChange={handleChange}>
       <option value="Yes">Yes</option>
       <option value="No">No</option>
      </select>
     </div>
    </div>

    <div className="form-row-custom">
     <label>Status</label>
     <div className="input-col">
      <select name="status" value={formData.status} onChange={handleChange}>
       <option value="Active">Active</option>
       <option value="Inactive">Inactive</option>
      </select>
     </div>
    </div>

    <div className="form-row-custom">
     <label>Watch Now Link</label>
     <div className="input-col">
      <input 
       type="text" 
       name="link" 
       value={formData.link} 
       onChange={handleChange} 
       placeholder="e.g. /details/movie/ID or https://external.com" 
      />
      <p className="resolution-text">(URL for the 'WATCH NOW' button)</p>
     </div>
    </div>

    <div className="form-footer">
     <button type="submit" className="save-btn-red" disabled={saving}>
      {saving ? <Loader size="small" inline={true} /> : 'Save Changes'}
     </button>
    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-actor-page { padding: 20px 30px; animation: fadeIn 0.4s ease-out; }
    .top-nav { margin-bottom: 30px; }
    .back-link { background: none; border: none; display: flex; align-items: center; gap: 10px; color: #b3d332; font-weight: 800; font-size: 1.2rem; cursor: pointer; padding: 0; }
    
    .actor-form { max-width: 1000px; }
    .form-row-custom { display: flex; margin-bottom: 10px; align-items: flex-start; }
    .form-row-custom label { width: 140px; color: #fff; font-size: 1rem; font-weight: 600; padding-top: 10px; }
    .input-col { flex: 1; }
    
    .input-col input[type="text"], 
    .input-col select {
     width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 12px 20px; color: #fff; border-radius: 4px; outline: none; font-size: 1rem; appearance: none;
    }
    .input-col select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 15px center; background-size: 18px; }

    .file-input-wrapper { display: flex; gap: 0; }
    .file-input-wrapper input { border-top-right-radius: 0 !important; border-bottom-right-radius: 0 !important; }
    .select-btn { background: #333; color: #fff; border: 1px solid #333; padding: 0 25px; border-top-right-radius: 4px; border-bottom-right-radius: 4px; cursor: pointer; font-weight: 600; }
    
    .preview-container-wide { margin-top: 15px; width: 100%; aspect-ratio: 16/9; border-radius: 6px; overflow: hidden; border: 1px solid #333; background: #111; }
    .slider-preview-img { width: 100%; height: 100%; object-fit: contain; }
    
    .resolution-text { color: #666; font-size: 0.85rem; margin-top: 8px; font-weight: 500; }
    
    .checkbox-group-grid-alt { display: flex; gap: 20px; padding-top: 5px; flex-wrap: nowrap; overflow-x: auto; }
    .checkbox-item-alt { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #fff; font-weight: 600; font-size: 1.05rem; white-space: nowrap; }
    .checkbox-item-alt input { width: 18px; height: 18px; accent-color: #b3d332; cursor: pointer; }
    .checkbox-group-grid-alt::-webkit-scrollbar { display: none; }

    .form-footer { margin-top: 40px; }
    .save-btn-red { background: #b3d332; color: #fff; border: none; padding: 10px 40px; border-radius: 4px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: opacity 0.2s; }
    .save-btn-red:hover { opacity: 0.9; }
    .save-btn-red:disabled { opacity: 0.6; cursor: not-allowed; }

    .radio-group-v { display: flex; gap: 30px; padding-top: 10px; }
    .radio-item-v { display: flex; align-items: center; gap: 10px; color: #fff; cursor: pointer; font-weight: 600; }
    .radio-item-v input { width: 18px; height: 18px; accent-color: #b3d332; }

    .loader-container { height: 70vh; display: flex; align-items: center; justify-content: center; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
   ` }} />
  </div>
 );
};

export default EditSlider;
