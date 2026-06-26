import React, { useState, useRef, useEffect } from 'react';
import { uploadToCloudinary } from '../utils/upload';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { ArrowLeft, Save, X, ChevronDown, Calendar, Clock, Trophy, Globe, FileText, Image as ImageIcon, Video, Download } from 'lucide-react';
import { formatImageUrl } from '../utils/image';

const AddSportsVideo = () => {
 const navigate = useNavigate();
 const posterInputRef = useRef(null);
 const landscapePosterInputRef = useRef(null);
 const videoInputRef = useRef(null);
 const video480InputRef = useRef(null);
 const video720InputRef = useRef(null);
 const video1080InputRef = useRef(null);
 const downloadInputRef = useRef(null);
 const [loading, setLoading] = useState(false);
 const [categories, setCategories] = useState([]);
 
 const [formData, setFormData] = useState({
  title: '',
  description: '',
  access: 'Paid',
  category: '',
  date: '',
  duration: '',
  status: 'Active',
  poster: '',
  landscapePoster: '',
  videoType: 'Local',
  videoQuality: 'Full HD',
  videoFile: '',
  videoFile480: '',
  videoFile720: '',
  videoFile1080: '',
  downloadable: 'Inactive',
  downloadUrl: '',
  subtitlesActive: 'Inactive',
  seoTitle: '',
  metaDescription: '',
  keywords: ''
 });

 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
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

 const handleVideoFileChange = async (e, field) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
   setLoading(true);
   const url = await uploadToCloudinary(file);
   if (url) {
    setFormData(prev => ({ ...prev, [field]: url }));
   } else {
    alert('Video upload failed');
   }
  } catch (err) {
   alert('Error uploading video: ' + err.message);
  } finally {
   setLoading(false);
  }
 };

 const handleEditorChange = (content) => {
  setFormData(prev => ({ ...prev, description: content }));
 };

 useEffect(() => {
  const fetchCategories = async () => {
   try {
    const response = await fetch('/api/sports-categories');
    const data = await response.json();
    setCategories(data);
   } catch (err) {
    console.error('Error fetching categories:', err);
   }
  };
  fetchCategories();
 }, []);

 const handleSave = async (e) => {
  e.preventDefault();
  
  if (!formData.title || !formData.category || formData.category === 'Select Category') {
   alert('Please fill mandatory fields: Video Title and Sports Category');
   return;
  }

  setLoading(true);
  try {
   // Find category object
   const catObj = categories.find(c => c.name === formData.category);
   
   const submissionData = {
    ...formData,
    category: catObj ? catObj._id : null
   };

   const response = await fetch('/api/sports-videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submissionData)
   });
   
   if (response.ok) {
    navigate('/admin/sports/video');
   } else {
    const errorData = await response.json();
    alert(`Failed to save sports video: ${errorData.message}`);
   }
  } catch (err) {
   console.error('Error saving sports video:', err);
   alert(`An error occurred while saving: ${err.message}`);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="add-sports-page">
   <div className="top-nav">
    <button className="back-btn" onClick={() => navigate('/admin/sports/video')}>
     <ArrowLeft size={20} strokeWidth={3} />
     <span>Back</span>
    </button>
   </div>

   <form onSubmit={handleSave} className="sports-form">
    <div className="form-sections-grid">
     
     {/* Left Side: Sport Info & SEO */}
     <div className="form-column">
      {/* Sport Info Section */}
      <div className="form-section-card">
       <h2 className="section-title">Sport Info</h2>
       
       <div className="form-group">
        <label>Video Title</label>
        <input 
         type="text" 
         name="title" 
         value={formData.title} 
         onChange={handleChange} 
         placeholder="Enter video title..." 
         required 
        />
       </div>

       <div className="form-group">
        <label>Description</label>
        <Editor
         apiKey="o55omxnn9u998swbnw7mrv8vrpdfeh6b0c8dq4ibo1rh35cl"
         init={{
          height: 250,
          menubar: 'file edit view insert format tools table help',
          plugins: [
           'advlist autolink lists link image charmap print preview anchor',
           'searchreplace visualblocks code fullscreen',
           'insertdatetime media table paste code help wordcount'
          ],
          toolbar: 'undo redo | formatselect | ' +
           'bold italic backcolor | alignleft aligncenter ' +
           'alignright alignjustify | bullist numlist outdent indent | ' +
           'removeformat | help',
          skin: 'oxide-dark',
          content_css: 'dark',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
         }}
         onEditorChange={handleEditorChange}
         value={formData.description}
        />
       </div>

       <div className="form-row-custom">
        <div className="form-group-custom">
         <label>Access</label>
         <select name="access" value={formData.access} onChange={handleChange}>
          <option value="Paid">Paid</option>
          <option value="Free">Free</option>
         </select>
        </div>
       </div>

       <div className="form-group">
        <label>Sports Category *</label>
        <select name="category" value={formData.category} onChange={handleChange} required>
         <option>Select Category</option>
         {categories.map(cat => (
          <option key={cat._id} value={cat.name}>{cat.name}</option>
         ))}
        </select>
       </div>

       <div className="form-row-custom">
        <div className="form-group-custom">
         <label>Date</label>
         <div className="input-with-icon">
          <input type="date" name="date" value={formData.date} onChange={handleChange} />
          <Calendar size={18} className="inner-icon" />
         </div>
        </div>
       </div>

       <div className="form-row-custom">
        <div className="form-group-custom">
         <label>Duration</label>
         <div className="input-with-icon">
          <input type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="1h 35m 54s" />
          <Clock size={18} className="inner-icon" />
         </div>
        </div>
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

      {/* SEO Section */}
      <div className="form-section-card" style={{ marginTop: '30px' }}>
       <h2 className="section-title">SEO</h2>
       <div className="form-group">
        <label>SEO Title</label>
        <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} />
       </div>
       <div className="form-group">
        <label>Meta Description</label>
        <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows="3" />
       </div>
       <div className="form-group">
        <label>Keyword</label>
        <textarea name="keywords" value={formData.keywords} onChange={handleChange} placeholder="use comma(,) to separate keyword." rows="3" />
       </div>
      </div>
     </div>

     {/* Right Side: Poster & Video & Subtitles */}
     <div className="form-column">
      {/* Poster & Video Section */}
      <div className="form-section-card">
       <h2 className="section-title">Poster & Video</h2>
       
       <div className="form-group">
        <label>Video Poster</label>
        <div className="file-input-wrapper-standard">
         <input type="text" name="poster" value={formData.poster} onChange={handleChange} placeholder="Select Poster image..." />
         <button type="button" className="select-file-btn" onClick={() => posterInputRef.current.click()}>Select</button>
         <input type="file" ref={posterInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'poster')} />
        </div>
        <p className="hint-text">(Recommended resolution : 800x450)</p>
        {formData.poster && (
         <div className="image-preview" style={{ marginTop: '15px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
          <img src={formatImageUrl(formData, 'poster') || 'https://via.placeholder.com/300x450'} alt="Poster Preview" style={{ maxWidth: '300px', display: 'block' }} />
         </div>
        )}
       </div>
       
       <div className="form-group">
        <label>Landscape Poster</label>
        <div className="file-input-wrapper-standard">
         <input type="text" name="landscapePoster" value={formData.landscapePoster} onChange={handleChange} placeholder="Select Landscape Poster..." />
         <button type="button" className="select-file-btn" onClick={() => landscapePosterInputRef.current.click()}>Select</button>
         <input type="file" ref={landscapePosterInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'landscapePoster')} />
        </div>
        <p className="hint-text" style={{ color: '#b3d332', fontSize: '0.75rem', marginTop: '5px' }}>(Recommended resolution : 1280x720)</p>
        {formData.landscapePoster && (
         <div className="image-preview" style={{ marginTop: '15px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
          <img src={formData.landscapePoster} alt="Landscape Preview" style={{ maxWidth: '300px', display: 'block' }} />
         </div>
        )}
       </div>

        <div className="form-row-custom stacked">
         <div className="label-text">Video Upload Type</div>
         <select name="videoType" value={formData.videoType} onChange={handleChange}>
          <option value="Local">File</option>
          <option value="URL">URL</option>
          <option value="LemoOTT Live">LemoOTT Live</option>
          <option value="HLS/m3u8 / MPEG-DASH / YouTube / Vimeo">HLS/m3u8 / MPEG-DASH / YouTube / Vimeo</option>
          <option value="Embed Code">Embed Code</option>
         </select>
        </div>

       <div className="form-row-custom stacked">
        <div className="label-text">Video Quality</div>
        <select name="videoQuality" value={formData.videoQuality} onChange={handleChange}>
         <option value="8K Ultra HD">8K Ultra HD</option>
         <option value="4K Ultra HD">4K Ultra HD</option>
         <option value="Ultra HD">Ultra HD</option>
         <option value="HDR">HDR</option>
         <option value="Full HD">Full HD</option>
         <option value="HD">HD</option>
        </select>
       </div>

       {/* Conditional Video Inputs */}
       {formData.videoType === 'Local' && (
        <div className="video-file-group">
         <p className="hint-text" style={{ marginBottom: '15px' }}>(Supported : MP4, MKV, AVI, etc.)</p>
         <div className="form-row-custom stacked">
          <div className="label-text">Video File * <span className="sub-hint">(Default Player File)</span></div>
          <div className="file-input-wrapper-standard">
           <input type="text" name="videoFile" value={formData.videoFile} onChange={handleChange} />
           <button type="button" className="select-file-btn" onClick={() => videoInputRef.current.click()}>Select</button>
           <input type="file" ref={videoInputRef} style={{ display: 'none' }} accept="video/*" onChange={(e) => handleVideoFileChange(e, 'videoFile')} />
          </div>
         </div>

         {['480', '720', '1080'].map(res => {
          const refs = { '480': video480InputRef, '720': video720InputRef, '1080': video1080InputRef };
          return (
           <div className="form-row-custom stacked" key={res}>
            <div className="label-text">Video File {res}P</div>
            <div className="file-input-wrapper-standard">
             <input type="text" name={`videoFile${res}`} value={formData[`videoFile${res}`] || ''} onChange={handleChange} />
             <button type="button" className="select-file-btn" onClick={() => refs[res].current.click()}>Select</button>
             <input type="file" ref={refs[res]} style={{ display: 'none' }} accept="video/*" onChange={(e) => handleVideoFileChange(e, `videoFile${res}`)} />
            </div>
           </div>
          );
         })}
        </div>
       )}

       {formData.videoType === 'URL' && (
        <div className="video-file-group">
         <p className="hint-text" style={{ marginBottom: '15px' }}>(Supported : MP4 URL. If you are using external files then those files have to be CORS enabled otherwise they will not work.)</p>
         <div className="form-row-custom stacked">
          <div className="label-text">Video URL <span className="sub-hint">(Default Player File)</span></div>
          <input type="text" name="videoFile" value={formData.videoFile} onChange={handleChange} placeholder="https://..." />
         </div>
         {['480', '720', '1080'].map(res => (
          <div className="form-row-custom stacked" key={res}>
           <div className="label-text">Video URL {res}P</div>
           <input type="text" name={`videoFile${res}`} value={formData[`videoFile${res}`] || ''} onChange={handleChange} placeholder="http://..." />
          </div>
         ))}
        </div>
       )}

       {(formData.videoType === 'HLS/m3u8 / MPEG-DASH / YouTube / Vimeo' || formData.videoType === 'LemoOTT Live') && (
        <div className="video-file-group">
         <p className="hint-text" style={{ marginBottom: '15px' }}>(Supported : MP4, YouTube, Vimeo, HLS / m3u8 URL. If you are using external files then those files have to be CORS enabled otherwise they will not work.)</p>
         <div className="form-row-custom stacked">
          <div className="label-text"><span className="hls-label">HLS Streaming URL</span></div>
          <input type="text" name="videoFile" value={formData.videoFile} onChange={handleChange} placeholder="https://..." />
         </div>
        </div>
       )}

       {formData.videoType === 'Embed Code' && (
        <div className="video-file-group">
         <div className="form-row-custom stacked">
          <div className="label-text">Video Embed Code</div>
          <textarea name="videoFile" value={formData.videoFile} onChange={handleChange} rows="4" placeholder="Paste embed code here..." />
         </div>
        </div>
       )}

       <div className="form-row-custom stacked" style={{ marginTop: '20px' }}>
        <div className="label-text">Download</div>
        <div className="custom-radio-group">
         <label className="radio-item">
          <input type="radio" name="downloadable" value="Active" checked={formData.downloadable === 'Active'} onChange={handleChange} />
          <span className="radio-dot"></span>
          <span>Active</span>
         </label>
         <label className="radio-item ml-30">
          <input type="radio" name="downloadable" value="Inactive" checked={formData.downloadable === 'Inactive'} onChange={handleChange} />
          <span className="radio-dot"></span>
          <span>Inactive</span>
         </label>
        </div>
       </div>

        <div className="form-row-custom stacked">
         <div className="label-text">Download File / URL</div>
         <div className="file-input-wrapper-standard">
          <input type="text" name="downloadUrl" value={formData.downloadUrl} onChange={handleChange} placeholder="Choose file or enter URL" />
          <button type="button" className="select-file-btn" onClick={() => downloadInputRef.current.click()}>Select</button>
          <input type="file" ref={downloadInputRef} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'downloadUrl')} />
         </div>
        </div>
      </div>

      {/* Subtitles Section */}
      <div className="form-section-card" style={{ marginTop: '30px' }}>
       <h2 className="section-title">Subtitles</h2>
       <p className="hint-text" style={{ marginBottom: '15px' }}>(Supported : .srt or .vtt files URL only. If you are using external files then those files have to be CORS enabled otherwise they will not work.)</p>
       
       <div className="form-row-custom stacked">
        <div className="label-text">Subtitles</div>
        <div className="custom-radio-group">
         <label className="radio-item">
          <input type="radio" name="subtitlesActive" value="Active" checked={formData.subtitlesActive === 'Active'} onChange={handleChange} />
          <span className="radio-dot"></span>
          <span>Active</span>
         </label>
         <label className="radio-item ml-30">
          <input type="radio" name="subtitlesActive" value="Inactive" checked={formData.subtitlesActive === 'Inactive'} onChange={handleChange} />
          <span className="radio-dot"></span>
          <span>Inactive</span>
         </label>
        </div>
       </div>

       {[1, 2, 3].map(i => (
        <div key={i} className="subtitle-pair">
         <div className="form-row-custom stacked">
          <div className="label-text">Language {i}</div>
          <input type="text" placeholder={i === 1 ? 'English' : i === 2 ? 'French' : 'Spanish'} readOnly />
         </div>
         <div className="form-row-custom stacked">
          <div className="label-text">Subtitle URL {i}</div>
          <input type="text" placeholder="http://example.com/demo.srt" readOnly />
         </div>
        </div>
       ))}

       <div className="form-submit-row">
        <button type="submit" className="save-sports-btn" disabled={loading}>
         <Save size={18} />
         <span>{loading ? 'Saving...' : 'Save'}</span>
        </button>
       </div>
      </div>
     </div>

    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-sports-page { padding: 15px 30px; background-color: #0c0c0c; min-height: 100vh; animation: fadeIn 0.4s ease-out; }
    
    .top-nav { margin-bottom: 20px; }
    .back-btn { background: transparent; border: none; color: #b3d332; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.2rem; cursor: pointer; transition: transform 0.2s; }
    .back-btn:hover { transform: translateX(-5px); }

    .sports-form { max-width: 1600px; margin: 0 auto; }
    .form-sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
    
    .form-section-card { background: #151515; border-radius: 10px; padding: 20px; border: 1px solid #222; }
    .section-title { color: #fff; font-size: 1.2rem; font-weight: 800; margin-bottom: 15px; letter-spacing: 0.5px; }
    
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; }
    .form-group label { color: #fff; font-weight: 700; font-size: 0.85rem; }
    
    /* Compact Transparent Dark Box Styles */
    .form-group input, 
    .form-group select, 
    .form-group textarea,
    .form-row-custom select,
    .form-row-custom input,
    .file-input-wrapper-standard input { 
     background: linear-gradient(180deg, #2a2a2a 0%, #222222 100%); 
     border: 1px solid #333; 
     padding: 10px 15px; 
     color: #fff; 
     border-radius: 6px; 
     outline: none; 
     font-size: 0.9rem; 
     transition: all 0.2s ease;
     appearance: none;
     box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
    }

    .form-group input:focus, 
    .form-group select:focus, 
    .form-group textarea:focus { 
     border-color: #444; 
     background: linear-gradient(180deg, #333 0%, #2a2a2a 100%);
    }

    /* Custom Arrow for Select */
    .form-group, .form-row-custom { position: relative; }
    select {
     background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
     background-repeat: no-repeat;
     background-position: right 12px center;
     background-size: 15px;
     padding-right: 35px !important;
    }

    .form-row-custom { display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 15px; }
    .form-row-custom.stacked { grid-template-columns: 150px 1fr; align-items: center; }
    .form-group-custom { display: flex; flex-direction: column; gap: 6px; }
    .form-group-custom label { color: #fff; font-weight: 700; font-size: 0.85rem; }

    .label-text { color: #fff; font-weight: 700; font-size: 0.85rem; }
    .sub-hint { display: block; color: #888; font-size: 0.75rem; font-weight: 500; margin-top: 2px; }
    .hint-text { color: #888; font-size: 0.8rem; font-weight: 500; }

    .input-with-icon { position: relative; }
    .inner-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #666; pointer-events: none; width: 14px; }

    .file-input-wrapper-standard { display: flex; }
    .file-input-wrapper-standard input { flex: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; }
    .select-file-btn { background: #3a3a3a; color: #fff; border: 1px solid #444; border-left: none; padding: 0 15px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; font-weight: 700; cursor: pointer; transition: background 0.2s; font-size: 0.85rem; }
    .select-file-btn:hover { background: #444; }

    .custom-radio-group { display: flex; align-items: center; }
    .radio-item { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 700; position: relative; color: #fff; }
    .radio-item input { position: absolute; opacity: 0; cursor: pointer; }
    .radio-dot { height: 20px; width: 20px; background-color: #000; border: 2px solid #fff; border-radius: 50% !important; display: inline-block; position: relative; }
    .radio-item input:checked ~ .radio-dot { border-color: #b3d332; }
    .radio-item input:checked ~ .radio-dot:after { content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: #b3d332; border-radius: 50% !important; }
    .ml-30 { margin-left: 30px; }

    .radio-flex { display: flex; gap: 20px; }
    .radio-flex label { display: flex; align-items: center; gap: 8px; color: #fff; font-weight: 600; cursor: pointer; font-size: 0.85rem; }
    .radio-flex input[type="radio"] { width: 18px; height: 18px; accent-color: #b3d332; cursor: pointer; }

    .hls-label { background: #6482B9; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; }

    .subtitle-pair { margin-top: 15px; padding-top: 15px; border-top: 1px solid #222; display: flex; flex-direction: column; gap: 10px; }
    .form-submit-row { display: flex; justify-content: flex-end; margin-top: 20px; }
    .save-sports-btn { background: #b3d332; color: #fff; border: none; padding: 10px 30px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(179,211,50,0.3); }
    .save-sports-btn:hover { transform: translateY(-2px); background: #b3d332; }

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

export default AddSportsVideo;
