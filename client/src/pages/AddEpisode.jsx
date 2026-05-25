import React, { useState, useRef, useEffect } from 'react';
import { uploadToCloudinary } from '../utils/upload';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { ArrowLeft, Save, Search, X } from 'lucide-react';
import { formatImageUrl } from '../utils/image';

const AddEpisode = () => {
 const navigate = useNavigate();
 const posterInputRef = useRef(null);
 const videoInputRef = useRef(null);
 const video480InputRef = useRef(null);
 const video720InputRef = useRef(null);
 const video1080InputRef = useRef(null);

 const [loading, setLoading] = useState(false);
 const [shows, setShows] = useState([]);
 const [seasons, setSeasons] = useState([]);
 const [formData, setFormData] = useState({
  imdbId: '',
  title: '',
  description: '',
  access: 'Paid',
  showId: '',
  seasonId: '',
  imdbRating: '',
  releaseDate: '',
  duration: '',
  status: 'Active',
  poster: '',
  videoType: 'Local',
  videoQuality: '8K Ultra HD',
  videoFile: '',
  videoFile480: '',
  videoFile720: '',
  videoFile1080: '',
  downloadable: 'Inactive',
  downloadUrl: '',
  subtitlesActive: 'Inactive',
  subtitles: [
   { language: 'English', url: '' },
   { language: 'French', url: '' },
   { language: 'Spanish', url: '' }
  ],
  seoTitle: '',
  metaDescription: '',
  keywords: ''
 });

 useEffect(() => {
  const fetchShowsAndSeasons = async () => {
   try {
    const [showsRes, seasonsRes] = await Promise.all([
     fetch('/api/shows'),
     fetch('/api/seasons')
    ]);
    const showsData = await showsRes.json();
    const seasonsData = await seasonsRes.json();
    setShows(Array.isArray(showsData) ? showsData : []);
    setSeasons(Array.isArray(seasonsData) ? seasonsData : []);
   } catch (err) {
    console.error('Error fetching data:', err);
   }
  };
  fetchShowsAndSeasons();
 }, []);

 const isShortPath = window.location.pathname.includes('/short-web-series');

 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
 };

 const handleSubChange = (index, value) => {
  const newSubs = [...formData.subtitles];
  newSubs[index].url = value;
  setFormData(prev => ({ ...prev, subtitles: newSubs }));
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

 const handleSave = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
   const payload = { ...formData };
   if (!payload.seasonId || isShortPath) {
    payload.seasonId = null;
   }
   const response = await fetch('/api/episodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
   });
   if (response.ok) {
    alert('Episode added successfully!');
    navigate(isShortPath ? '/admin/short-web-series/episodes' : '/admin/tv-shows/episodes');
   } else {
    const errData = await response.json();
    alert('Failed to save episode: ' + (errData.message || response.statusText));
   }
  } catch (err) {
   console.error('Error saving episode:', err);
   alert('Error saving episode: ' + err.message);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="add-episode-page">
   <div className="top-nav">
    <button className="back-btn" onClick={() => navigate(isShortPath ? '/admin/short-web-series/episodes' : '/admin/tv-shows/episodes')}>
     <ArrowLeft size={20} color="#b3d332" strokeWidth={3} />
     <span>Back</span>
    </button>
   </div>

   <div className="imdb-import-section">
    <label>Import From IMDb</label>
    <div className="imdb-input-group">
     <input 
      type="text" 
      placeholder="Enter IMDb ID (e.g. tt2161930)" 
      value={formData.imdbId}
      onChange={(e) => setFormData({...formData, imdbId: e.target.value})}
     />
     <button type="button" className="fetch-btn">FETCH</button>
    </div>
    <p className="imdb-note">(Recommended : Search by IMDb ID for better result)</p>
    <p className="imdb-note">Note: Keep in mind that the information about some episodes may be missing since it relies on fetching data from the TMDb API.</p>
   </div>

   <form onSubmit={handleSave}>
    <div className="form-grid">
     {/* Left Column */}
     <div className="form-column">
      <h2 className="section-title">Episode Info</h2>
      
      <div className="form-group">
       <label>Episode Title*</label>
       <input type="text" name="title" value={formData.title} onChange={handleChange} required />
      </div>

      <div className="form-group">
       <label>Description</label>
       <Editor
        apiKey="o55omxnn9u998swbnw7mrv8vrpdfeh6b0c8dq4ibo1rh35cl"
        init={{
         height: 300,
         menubar: true,
         plugins: ['advlist autolink lists link image charmap print preview anchor', 'searchreplace visualblocks code fullscreen', 'insertdatetime media table paste code help wordcount'],
         toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | help',
         skin: "oxide-dark",
         content_css: "dark"
        }}
        onEditorChange={(content) => setFormData({...formData, description: content})}
       />
      </div>

      <div className="form-row-2">
       <div className="form-group">
        <label>Access</label>
        <select name="access" value={formData.access} onChange={handleChange}>
         <option value="Paid">Paid</option>
         <option value="Free">Free</option>
        </select>
       </div>
      </div>

      <div className="form-group">
        <label>Shows*</label>
        <select name="showId" value={formData.showId} onChange={handleChange} required>
         <option value="">Select Show</option>
         {shows
           .filter(show => isShortPath ? show.contentType === 'Short Web Series' : (show.contentType === 'TV Show' || !show.contentType))
           .map(s => <option key={s._id} value={s._id}>{s.title}</option>)
         }
        </select>
       </div>

       {!isShortPath && (
        <div className="form-group">
         <label>Seasons</label>
         <select name="seasonId" value={formData.seasonId} onChange={handleChange}>
          <option value="">Select Season (Optional)</option>
          {seasons.filter(s => s.showId === formData.showId).map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
         </select>
        </div>
       )}

      <div className="form-group">
       <label>IMDb Rating</label>
       <input type="text" name="imdbRating" value={formData.imdbRating} onChange={handleChange} />
      </div>

      <div className="form-group">
       <label>Release Date</label>
       <input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleChange} />
      </div>

      <div className="form-group">
       <label>Duration</label>
       <input type="text" placeholder="1h 35m 54s" name="duration" value={formData.duration} onChange={handleChange} />
      </div>

      <div className="form-group">
       <label>Status</label>
       <div className="custom-radio-group">
        <label className="radio-item">
         <input type="radio" name="status" value="Active" checked={formData.status === 'Active'} onChange={handleChange} />
         <span className="radio-dot"></span>
        </label>
        <label className="radio-item ml-30">
         <input type="radio" name="status" value="Inactive" checked={formData.status === 'Inactive'} onChange={handleChange} />
         <span className="radio-dot"></span>
        </label>
       </div>
      </div>

      <h2 className="section-title mt-40">SEO</h2>
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
       <p className="note">use comma(,) to separate keyword.</p>
      </div>
     </div>

     {/* Right Column */}
     <div className="form-column">
      <h2 className="section-title">Poster & Video</h2>
      
      <div className="form-group">
       <label>Episode Poster*</label>
       <div className="file-input-group">
        <input type="text" name="poster" value={formData.poster} onChange={handleChange} placeholder="Paste image URL..." />
        <button type="button" onClick={() => posterInputRef.current.click()} className="select-btn">Select</button>
        <input type="file" ref={posterInputRef} hidden onChange={(e) => handleFileChange(e, 'poster')} />
       </div>
       {formData.poster && (
        <div className="poster-preview mt-10">
         <img src={formatImageUrl(formData, 'poster') || 'https://via.placeholder.com/300x450'} alt="Preview" style={{ width: '100%', borderRadius: '4px', border: '1px solid #333' }} />
        </div>
       )}
       <p className="note">(Recommended resolution : 800x450)</p>
      </div>

      <div className="video-source-section">
       <div className="video-source-row">
        <div className="video-source-label">Video Upload Type</div>
        <select name="videoType" value={formData.videoType} onChange={handleChange} style={{ background: '#333', border: '1px solid #444', padding: '12px', color: '#fff', borderRadius: '4px', outline: 'none' }}>
         <option value="Local">Local</option>
         <option value="URL">URL</option>
         <option value="HLS/m3u8 / MPEG-DASH / YouTube / Vimeo">HLS/m3u8 / MPEG-DASH / YouTube / Vimeo</option>
         <option value="Embed Code">Embed Code</option>
        </select>
       </div>

       <div className="video-source-row">
        <div className="video-source-label">
         Video Quality
         <span className="sub-label">(For Local and URL)</span>
        </div>
        <div className="video-source-input">
         <select name="videoQuality" value={formData.videoQuality || '8K Ultra HD'} onChange={handleChange} style={{ background: '#333', border: '1px solid #444', padding: '12px', color: '#fff', borderRadius: '4px', outline: 'none', width: '100%' }}>
          <option value="8K Ultra HD">8K Ultra HD</option>
          <option value="4K Ultra HD">4K Ultra HD</option>
          <option value="Full HD">Full HD</option>
          <option value="HD">HD</option>
          <option value="SD">SD</option>
         </select>
        </div>
       </div>

       {formData.videoType === 'Local' ? (
        <p className="hint">(Supported : MP4, MKV, AVI, etc.)</p>
       ) : (
        <p className="hint">(Supported : MP4, YouTube, Vimeo, HLS / m3u8 URL. If you are using external files then those files have to be CORS enabled otherwise they will not work.)</p>
       )}

       {formData.videoType === 'Local' && (
        <>
         <div className="video-source-row">
          <div className="video-source-label">
           Video File*
           <span className="sub-label">(Default Player File)</span>
          </div>
          <div className="video-source-input">
           <div className="file-input-group">
            <input type="text" value={formData.videoFile} readOnly placeholder="No file selected" />
            <button type="button" onClick={() => videoInputRef.current.click()} className="select-btn">Select</button>
            <input type="file" ref={videoInputRef} hidden onChange={(e) => handleFileChange(e, 'videoFile')} />
           </div>
          </div>
         </div>
         <div className="video-source-row">
          <div className="video-source-label">Video File 480P</div>
          <div className="video-source-input">
           <div className="file-input-group">
            <input type="text" value={formData.videoFile480} readOnly placeholder="No file selected" />
            <button type="button" onClick={() => video480InputRef.current.click()} className="select-btn">Select</button>
            <input type="file" ref={video480InputRef} hidden onChange={(e) => handleFileChange(e, 'videoFile480')} />
           </div>
          </div>
         </div>
         <div className="video-source-row">
          <div className="video-source-label">Video File 720P</div>
          <div className="video-source-input">
           <div className="file-input-group">
            <input type="text" value={formData.videoFile720} readOnly placeholder="No file selected" />
            <button type="button" onClick={() => video720InputRef.current.click()} className="select-btn">Select</button>
            <input type="file" ref={video720InputRef} hidden onChange={(e) => handleFileChange(e, 'videoFile720')} />
           </div>
          </div>
         </div>
         <div className="video-source-row">
          <div className="video-source-label">Video File 1080P</div>
          <div className="video-source-input">
           <div className="file-input-group">
            <input type="text" value={formData.videoFile1080} readOnly placeholder="No file selected" />
            <button type="button" onClick={() => video1080InputRef.current.click()} className="select-btn">Select</button>
            <input type="file" ref={video1080InputRef} hidden onChange={(e) => handleFileChange(e, 'videoFile1080')} />
           </div>
          </div>
         </div>
        </>
       )}

       {formData.videoType === 'URL' && (
        <>
         <div className="video-source-row">
          <div className="video-source-label">
           Video URL
           <span className="sub-label">(Default Player File)</span>
          </div>
          <div className="video-source-input">
           <input type="text" name="videoFile" value={formData.videoFile} onChange={handleChange} placeholder="https://..." />
          </div>
         </div>
         <div className="video-source-row">
          <div className="video-source-label">Video URL 480P</div>
          <div className="video-source-input">
           <input type="text" name="videoFile480" value={formData.videoFile480} onChange={handleChange} placeholder="http://..." />
          </div>
         </div>
         <div className="video-source-row">
          <div className="video-source-label">Video URL 720P</div>
          <div className="video-source-input">
           <input type="text" name="videoFile720" value={formData.videoFile720} onChange={handleChange} placeholder="http://..." />
          </div>
         </div>
         <div className="video-source-row">
          <div className="video-source-label">Video URL 1080P</div>
          <div className="video-source-input">
           <input type="text" name="videoFile1080" value={formData.videoFile1080} onChange={handleChange} placeholder="http://..." />
          </div>
         </div>
        </>
       )}

       {formData.videoType === 'HLS/m3u8 / MPEG-DASH / YouTube / Vimeo' && (
        <div className="video-source-row">
         <div className="video-source-label">
          <div className="hls-label">HLS Streaming URL</div>
         </div>
         <div className="video-source-input">
          <input type="text" name="videoFile" value={formData.videoFile} onChange={handleChange} placeholder="https://..." />
         </div>
        </div>
       )}

       {formData.videoType === 'Embed Code' && (
        <div className="video-source-row">
         <div className="video-source-label">Video Embed Code</div>
         <div className="video-source-input">
          <textarea name="videoFile" value={formData.videoFile} onChange={handleChange} placeholder="Paste embed code here..." className="styled-textarea"></textarea>
         </div>
        </div>
       )}
      </div>

      <div className="form-group">
       <label>Download</label>
       <div className="custom-radio-group">
        <label className="radio-item">
         <input type="radio" name="downloadable" value="Active" checked={formData.downloadable === 'Active'} onChange={handleChange} />
         <span className="radio-dot"></span>
        </label>
        <label className="radio-item ml-30">
         <input type="radio" name="downloadable" value="Inactive" checked={formData.downloadable === 'Inactive'} onChange={handleChange} />
         <span className="radio-dot"></span>
        </label>
       </div>
      </div>

      <div className="form-group">
       <label>Download URL</label>
       <input type="text" name="downloadUrl" value={formData.downloadUrl} onChange={handleChange} />
      </div>

      <h2 className="section-title mt-40">Subtitles</h2>
      <p className="note">(Supported : .srt or .vtt files URL only. If you are using external files then those files have to be <span style={{color: '#0088ff'}}>CORS</span> enabled otherwise they will not work.)</p>
      
      <div className="form-group mt-20">
       <label>Subtitles</label>
       <div className="custom-radio-group">
        <label className="radio-item">
         <input type="radio" name="subtitlesActive" value="Active" checked={formData.subtitlesActive === 'Active'} onChange={handleChange} />
         <span className="radio-dot"></span>
        </label>
        <label className="radio-item ml-30">
         <input type="radio" name="subtitlesActive" value="Inactive" checked={formData.subtitlesActive === 'Inactive'} onChange={handleChange} />
         <span className="radio-dot"></span>
        </label>
       </div>
      </div>

      {formData.subtitles.map((sub, index) => (
       <div key={index} className="subtitle-row">
        <div className="form-group">
         <label>Language {index + 1}</label>
         <input type="text" value={sub.language} readOnly />
        </div>
        <div className="form-group">
         <label>Subtitle URL {index + 1}</label>
         <input 
          type="text" 
          placeholder="http://example.com/demo.srt" 
          value={sub.url} 
          onChange={(e) => handleSubChange(index, e.target.value)}
         />
        </div>
       </div>
      ))}

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
    .add-episode-page { padding: 20px; animation: fadeIn 0.3s ease-out; background-color: #0c0c0c; min-height: 100vh; }
    
    .top-nav { margin-bottom: 25px; }
    .back-btn {
     background: transparent; border: none; color: #b3d332; display: flex; align-items: center;
     gap: 8px; font-weight: 800; font-size: 1.3rem; cursor: pointer;
    }

    .imdb-import-section { background: #151515; padding: 25px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #222; }
    .imdb-import-section label { color: #fff; font-weight: 700; display: block; margin-bottom: 15px; font-size: 1.1rem; }
    .imdb-input-group { display: flex; gap: 15px; max-width: 800px; }
    .imdb-input-group input { flex: 1; background: transparent; border: 1px solid #333; padding: 12px 15px; color: #fff; border-radius: 4px; outline: none; font-size: 0.95rem; }
    .fetch-btn { background: #444; color: #fff; border: none; padding: 0 25px; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 0.9rem; }
    .hint { color: #888; font-size: 0.85rem; margin-top: 8px; font-weight: 500; }

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

    .custom-radio-group { display: flex; align-items: center; }
    .radio-item { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem; font-weight: 700; position: relative; color: #fff; }
    .radio-item input { position: absolute; opacity: 0; cursor: pointer; }
    .radio-dot { height: 20px; width: 20px; background-color: #000; border: 2px solid #fff; border-radius: 50%; display: inline-block; position: relative; }
    .radio-item input:checked ~ .radio-dot { border-color: #b3d332; }
    .radio-item input:checked ~ .radio-dot:after { content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: #b3d332; border-radius: 50%; }
    .ml-30 { margin-left: 30px; }

    .video-source-row { display: grid; grid-template-columns: 180px 1fr; align-items: start; margin-bottom: 25px; gap: 20px; }
    .video-source-label { color: #fff; font-weight: 700; font-size: 1rem; padding-top: 10px; }
    .video-source-label .sub-label { display: block; color: #888; font-size: 0.85rem; font-weight: 500; margin-top: 5px; }
    .video-source-input { flex: 1; }
    .video-source-input input { width: 100%; background: transparent; border: 1px solid #333; padding: 12px 15px; color: #fff; border-radius: 4px; outline: none; }
    
    .hls-label { background: #5a78af; color: #fff; padding: 8px 15px; border-radius: 4px; font-weight: 800; display: inline-block; font-size: 1rem; }
    .styled-textarea { width: 100%; background: transparent; border: 1px solid #333; padding: 14px 18px; color: #fff; border-radius: 6px; outline: none; font-size: 1rem; height: 120px; resize: none; }

    .subtitle-row { display: flex; gap: 15px; margin-bottom: 20px; }
    .subtitle-row .form-group { flex: 1; }

    .form-actions { display: flex; justify-content: flex-end; margin-top: 40px; }
    .save-btn {
     background: #b3d332; color: #fff; border: none; padding: 12px 40px; border-radius: 4px;
     display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.1rem; cursor: pointer;
     box-shadow: 0 4px 10px rgba(255, 0, 0, 0.2); transition: transform 0.2s;
    }
    .save-btn:hover { transform: translateY(-2px); }
    .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .tox-tinymce { border: 1px solid #333 !important; border-radius: 4px !important; }
   ` }} />
  </div>
 );
};

export default AddEpisode;
