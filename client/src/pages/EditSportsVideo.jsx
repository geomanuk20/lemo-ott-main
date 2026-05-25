import React, { useState, useRef, useEffect } from 'react';
import { uploadToCloudinary } from '../utils/upload';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { ArrowLeft, Save, Calendar, Clock, Image as ImageIcon, Video, Search, Globe, FileText, X } from 'lucide-react';
import { formatImageUrl } from '../utils/image';

const EditSportsVideo = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const posterInputRef = useRef(null);
 const landscapePosterInputRef = useRef(null);
 const videoInputRef = useRef(null);
 const video480InputRef = useRef(null);
 const video720InputRef = useRef(null);
 const video1080InputRef = useRef(null);
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(false);
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
  videoQuality: 'Active',
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

 useEffect(() => {
  const fetchData = async () => {
   try {
    const [videoRes, catRes] = await Promise.all([
     fetch(`/api/sports-videos/${id}`),
     fetch('/api/sports-categories')
    ]);
    
    const cats = await catRes.json();
    setCategories(cats);

    if (videoRes.ok) {
     const video = await videoRes.json();
     // Find category name from ID
     const catName = cats.find(c => c._id === video.category?._id || c._id === video.category)?.name || '';
     
     setFormData({
      ...video,
      category: catName
     });
    }
   } catch (err) {
    console.error('Error fetching data:', err);
   } finally {
    setFetching(false);
   }
  };
  fetchData();
 }, [id]);

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

 const handleSave = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
   const catObj = categories.find(c => c.name === formData.category);
   const submissionData = {
    ...formData,
    category: catObj ? catObj._id : null
   };

   const response = await fetch(`/api/sports-videos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submissionData)
   });
   
   if (response.ok) {
    navigate('/admin/sports/video');
   } else {
    const errorData = await response.json();
    alert(`Failed to update sports video: ${errorData.message}`);
   }
  } catch (err) {
   console.error('Error updating sports video:', err);
   alert('An error occurred while updating.');
  } finally {
   setLoading(false);
  }
 };

 if (fetching) {
  return <div className="loading">Loading sports video...</div>;
 }

 return (
  <div className="add-sports-page">
   <div className="top-nav">
    <button className="back-btn" onClick={() => navigate('/admin/sports/video')}>
     <ArrowLeft size={20} strokeWidth={3} />
     <span>Back</span>
    </button>
   </div>

   <h2 className="section-title">Edit Sports Video: {formData.title}</h2>

   <form onSubmit={handleSave} className="sports-form">
    <div className="form-sections-grid">
     <div className="form-column">
      <div className="form-section-card">
       <h2 className="section-title">Sport Info</h2>
       <div className="form-group">
        <label>Video Title</label>
        <input type="text" name="title" value={formData.title} onChange={handleChange} required />
       </div>
       <div className="form-group">
        <label>Description</label>
        <Editor
         apiKey="o55omxnn9u998swbnw7mrv8vrpdfeh6b0c8dq4ibo1rh35cl"
         init={{
          height: 250,
          menubar: false,
          plugins: ['advlist autolink lists link image charmap preview anchor', 'searchreplace visualblocks code fullscreen', 'insertdatetime media table paste code help wordcount'],
          toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
          skin: 'oxide-dark',
          content_css: 'dark'
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
         <input type="date" name="date" value={formData.date} onChange={handleChange} />
        </div>
        <div className="form-group-custom">
         <label>Duration</label>
         <input type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="10:30" />
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

      <div className="form-section-card mt-30">
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
        <label>Keywords</label>
        <textarea name="keywords" value={formData.keywords} onChange={handleChange} rows="3" />
       </div>
      </div>
     </div>

     <div className="form-column">
      <div className="form-section-card">
       <h2 className="section-title">Poster & Video</h2>
       <div className="form-group">
        <label>Video Poster</label>
        <div className="file-input-wrapper-standard">
         <input type="text" name="poster" value={formData.poster && formData.poster.length > 100 ? 'Image Selected' : formData.poster} onChange={handleChange} />
         <button type="button" className="select-file-btn" onClick={() => posterInputRef.current.click()}>Select</button>
         <input type="file" ref={posterInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'poster')} />
        </div>
        {formData.poster && (
         <div className="image-preview" style={{ marginTop: '15px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
          <img src={formatImageUrl(formData, 'poster') || 'https://via.placeholder.com/300x450'} alt="Poster Preview" style={{ maxWidth: '200px', display: 'block' }} />
         </div>
        )}
       </div>
       
       <div className="form-group">
        <label>Landscape Poster</label>
        <div className="file-input-wrapper-standard">
         <input type="text" name="landscapePoster" value={formData.landscapePoster && formData.landscapePoster.length > 100 ? 'Image Selected' : formData.landscapePoster} onChange={handleChange} />
         <button type="button" className="select-file-btn" onClick={() => landscapePosterInputRef.current.click()}>Select</button>
         <input type="file" ref={landscapePosterInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'landscapePoster')} />
        </div>
        <p className="hint-text" style={{ color: '#b3d332', fontSize: '0.75rem', marginTop: '5px' }}>(Recommended resolution : 1280x720)</p>
        {formData.landscapePoster && (
         <div className="image-preview" style={{ marginTop: '15px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
          <img src={formData.landscapePoster} alt="Landscape Preview" style={{ maxWidth: '200px', display: 'block' }} />
         </div>
        )}
       </div>
       <div className="form-row-custom stacked">
        <div className="label-text">Video Upload Type</div>
        <select name="videoType" value={formData.videoType} onChange={handleChange}>
         <option value="Local">Local</option>
         <option value="URL">URL</option>
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

       {formData.videoType === 'Local' && (
        <div className="video-file-group">
         <div className="form-row-custom stacked">
          <div className="label-text">Video File *</div>
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

       {formData.videoType === 'HLS/m3u8 / MPEG-DASH / YouTube / Vimeo' && (
        <div className="video-file-group">
         <p className="hint-text" style={{ marginBottom: '15px' }}>(Supported : MP4, YouTube, Vimeo, HLS / m3u8 URL. If you are using external files then those files have to be CORS enabled otherwise they will not work.)</p>
         <div className="form-row-custom stacked">
          <div className="label-text">HLS Streaming URL</div>
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

       <div className="form-row-custom stacked mt-20">
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
        <div className="label-text">Download URL</div>
        <input type="text" name="downloadUrl" value={formData.downloadUrl} onChange={handleChange} />
       </div>

       <div className="form-footer mt-40">
        <button type="submit" className="save-sports-btn" disabled={loading}>
         <Save size={18} />
         <span>{loading ? 'Updating...' : 'Update Sports Video'}</span>
        </button>
       </div>
      </div>
     </div>
    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-sports-page { padding: 25px; background: #0c0c0c; min-height: 100vh; color: #fff; }
    .top-nav { margin-bottom: 30px; }
    .back-btn { background: transparent; border: none; color: #b3d332; display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.2rem; cursor: pointer; }
    .form-sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .form-section-card { background: #151515; padding: 25px; border-radius: 12px; border: 1px solid #222; }
    .section-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 25px; border-left: 4px solid #b3d332; padding-left: 15px; line-height: 1; }
    .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .form-group label { font-weight: 700; font-size: 0.95rem; }
    .form-group input, .form-group select, .form-group textarea, .form-row-custom select, .form-row-custom input { background: #1a1a1a; border: 1px solid #333; padding: 12px 15px; color: #fff; border-radius: 6px; outline: none; }
    .form-row-custom { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .form-row-custom.stacked { grid-template-columns: 150px 1fr; align-items: center; }
    .form-group-custom { display: flex; flex-direction: column; gap: 8px; }
    .form-group-custom label { font-weight: 700; font-size: 0.95rem; }
    .form-group-custom input, .form-group-custom select { background: #1a1a1a; border: 1px solid #333; padding: 12px 15px; color: #fff; border-radius: 6px; }
    .file-input-wrapper-standard { display: flex; }
    .file-input-wrapper-standard input { flex: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; }
    .select-file-btn { background: #3a3a3a; color: #fff; border: 1px solid #444; padding: 0 15px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; cursor: pointer; font-weight: 700; }
    .custom-radio-group { display: flex; align-items: center; }
    .radio-item { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem; font-weight: 700; color: #fff; position: relative; }
    .radio-item input { position: absolute; opacity: 0; }
    .radio-dot { height: 20px; width: 20px; background-color: #000; border: 2px solid #fff; border-radius: 50% !important; display: inline-block; position: relative; }
    .radio-item input:checked ~ .radio-dot { border-color: #b3d332; }
    .radio-item input:checked ~ .radio-dot:after { content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: #b3d332; border-radius: 50% !important; }
    .ml-30 { margin-left: 30px; }
    .save-sports-btn { background: #b3d332; color: #fff; border: none; padding: 12px 30px; border-radius: 6px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; }
    .loading { color: #fff; text-align: center; padding: 100px; font-size: 1.5rem; }
    .mt-30 { margin-top: 30px; }
    .mt-40 { margin-top: 40px; }
   ` }} />
  </div>
 );
};

export default EditSportsVideo;
