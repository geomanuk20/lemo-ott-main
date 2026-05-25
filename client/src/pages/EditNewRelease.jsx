import React, { useState, useRef, useEffect } from 'react';
import { uploadToCloudinary } from '../utils/upload';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { ArrowLeft, Save, Upload, Info, Image as ImageIcon, Video, Search, Globe, FileText, X, ChevronDown } from 'lucide-react';
import { formatImageUrl } from '../utils/image';

const EditNewRelease = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const thumbnailInputRef = useRef(null);
 const posterInputRef = useRef(null);
 const videoInputRef = useRef(null);
 const video480InputRef = useRef(null);
 const video720InputRef = useRef(null);
 const video1080InputRef = useRef(null);
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(false);
 const [availableGenres, setAvailableGenres] = useState([]);
 const [availableLanguages, setAvailableLanguages] = useState([]);
 const [availableActors, setAvailableActors] = useState([]);
 const [availableDirectors, setAvailableDirectors] = useState([]);
 const [isActorsOpen, setIsActorsOpen] = useState(false);
 const [isDirectorsOpen, setIsDirectorsOpen] = useState(false);
 const [isGenresOpen, setIsGenresOpen] = useState(false);
 const [actorSearch, setActorSearch] = useState('');
 const [directorSearch, setDirectorSearch] = useState('');
 const [genreSearch, setGenreSearch] = useState('');
 const [formData, setFormData] = useState({
  imdbId: '',
  title: '',
  description: '',
  sortInfo: '',
  upcoming: 'No',
  access: 'Paid',
  seriesAccess: 'Paid',
  language: '',
  genres: [],
  actors: [],
  directors: [],
  imdbRating: '',
  contentRating: '16+',
  releaseDate: '',
  duration: '',
  status: 'Active',
  thumbnail: '',
  poster: '',
  trailerUrl: '',
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
  const fetchData = async () => {
   try {
    const [movieRes, genreRes, languagesRes, actorsRes, directorsRes] = await Promise.all([
     fetch(`/api/new-releases/${id}`),
     fetch('/api/genres'),
     fetch('/api/languages'),
     fetch('/api/actors'),
     fetch('/api/directors')
    ]);
    
    if (movieRes.ok) {
     const movie = await movieRes.json();
     setFormData({
      imdbId: movie.imdbId || '',
      title: movie.title || '',
      description: movie.description || '',
      sortInfo: movie.sortInfo || '',
      upcoming: movie.upcoming || 'No',
      access: movie.access || movie.seriesAccess || 'Paid',
      seriesAccess: movie.seriesAccess || movie.access || 'Paid',
      language: movie.language || '',
      genres: Array.isArray(movie.genres) ? movie.genres : (movie.genre ? (Array.isArray(movie.genre) ? movie.genre : [movie.genre]) : []),
      actors: Array.isArray(movie.actors) ? movie.actors : [],
      directors: Array.isArray(movie.directors) ? movie.directors : [],
      imdbRating: movie.imdbRating || '',
      contentRating: movie.contentRating || '16+',
      releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '',
      duration: movie.duration || '',
      status: movie.status || 'Active',
      thumbnail: movie.thumbnail || '',
      poster: movie.poster || '',
      trailerUrl: movie.trailerUrl || '',
      videoType: movie.videoType || 'Local',
      videoQuality: movie.videoQuality || '8K Ultra HD',
      videoFile: movie.videoFile || '',
      videoFile480: movie.videoFile480 || '',
      videoFile720: movie.videoFile720 || '',
      videoFile1080: movie.videoFile1080 || '',
      downloadable: movie.downloadable || 'Inactive',
      downloadUrl: movie.downloadUrl || '',
      subtitlesActive: movie.subtitlesActive || 'Inactive',
      subtitles: movie.subtitles && movie.subtitles.length > 0 ? movie.subtitles : [
       { language: 'English', url: '' },
       { language: 'French', url: '' },
       { language: 'Spanish', url: '' }
      ],
      seoTitle: movie.seoTitle || '',
      metaDescription: movie.metaDescription || '',
      keywords: movie.keywords || ''
     });
    }
    setAvailableGenres(await genreRes.json());
    setAvailableLanguages(await languagesRes.json());
    setAvailableActors(await actorsRes.json());
    setAvailableDirectors(await directorsRes.json());
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
   const submissionData = {
    ...formData
   };

   const response = await fetch(`/api/new-releases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submissionData)
   });
   
   if (response.ok) {
    navigate('/admin/new-release');
   } else {
    const errorData = await response.json();
    alert(`Failed to update movie: ${errorData.message}`);
   }
  } catch (err) {
   console.error('Error updating movie:', err);
   alert('An error occurred while updating.');
  } finally {
   setLoading(false);
  }
 };

 if (fetching) {
  return <div className="loading">Loading movie data...</div>;
 }

 return (
  <div className="add-movie-page">
   <div className="top-nav">
    <button className="back-btn" onClick={() => navigate('/admin/new-release')}>
     <ArrowLeft size={18} />
     <span>Back</span>
    </button>
   </div>

   <h2 className="section-title">Edit Movie: {formData.title}</h2>

   <form onSubmit={handleSave} className="movie-form">
    <div className="form-sections-wrapper">
     <h2 className="section-title">Movie Info</h2>
     <div className="form-columns">
      <div className="form-column">
       <div className="form-group">
        <label>Movie Title</label>
        <input type="text" name="title" value={formData.title} onChange={handleChange} required />
       </div>
       <div className="form-group">
        <label>Description</label>
        <Editor
         apiKey="o55omxnn9u998swbnw7mrv8vrpdfeh6b0c8dq4ibo1rh35cl"
         init={{
          height: 300,
          menubar: false,
          plugins: ['advlist autolink lists link image charmap print preview anchor', 'searchreplace visualblocks code fullscreen', 'insertdatetime media table paste code help wordcount'],
          toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
          skin: 'oxide-dark',
          content_css: 'dark'
         }}
         onEditorChange={handleEditorChange}
         value={formData.description}
        />
       </div>
       <div className="form-row">
        <div className="form-group half">
         <label>Upcoming</label>
         <select name="upcoming" value={formData.upcoming} onChange={handleChange}>
          <option value="No">No</option>
          <option value="Yes">Yes</option>
         </select>
        </div>
        <div className="form-group half">
         <label>Access</label>
         <select name="access" value={formData.access} onChange={handleChange}>
          <option value="Paid">Paid</option>
          <option value="Free">Free</option>
         </select>
        </div>
       </div>
       <div className="form-group">
        <label>Language</label>
        <select name="language" value={formData.language} onChange={handleChange}>
         <option value="">Select Language</option>
         {availableLanguages.map(lang => (
          <option key={lang._id} value={lang.name}>{lang.name}</option>
         ))}
        </select>
       </div>
       <div className="form-group">
        <label>Genres</label>
        <div className="custom-dropdown-container">
         <div className="custom-select" onClick={() => setIsGenresOpen(!isGenresOpen)}>
          <span>{formData.genres.length > 0 ? `${formData.genres.length} selected` : 'Select Genres'}</span>
          <ChevronDown size={18} />
         </div>
         {isGenresOpen && (
          <div className="dropdown-menu">
           <div className="dropdown-search">
            <input type="text" placeholder="Search genre..." value={genreSearch} onChange={e => setGenreSearch(e.target.value)} onClick={e => e.stopPropagation()} />
           </div>
           <div className="dropdown-options">
            {availableGenres.filter(g => g?.name?.toLowerCase().includes(genreSearch.toLowerCase())).map(genre => (
             <div key={genre._id} className="dropdown-option checkbox-option" onClick={(e) => {
              e.stopPropagation();
              const newGenres = formData.genres.includes(genre.name) 
               ? formData.genres.filter(t => t !== genre.name) 
               : [...formData.genres, genre.name];
              setFormData(prev => ({ ...prev, genres: newGenres }));
             }}>
              <input type="checkbox" checked={formData.genres.includes(genre.name)} readOnly />
              <span>{genre.name}</span>
             </div>
            ))}
           </div>
          </div>
         )}
        </div>
       </div>
      </div>

      <div className="form-column">
       <div className="form-row">
        <div className="form-group half">
         <label>Actors</label>
         <div className="custom-dropdown-container">
          <div className="custom-select" onClick={() => setIsActorsOpen(!isActorsOpen)}>
           <span>{formData.actors.length > 0 ? `${formData.actors.length} selected` : 'Select Actors'}</span>
           <ChevronDown size={18} />
          </div>
          {isActorsOpen && (
           <div className="dropdown-menu">
            <div className="dropdown-search">
             <input type="text" placeholder="Search actor..." value={actorSearch} onChange={e => setActorSearch(e.target.value)} onClick={e => e.stopPropagation()} />
            </div>
            <div className="dropdown-options">
             {availableActors.filter(a => a?.name?.toLowerCase().includes(actorSearch.toLowerCase())).map(actor => (
              <div key={actor._id} className="dropdown-option checkbox-option" onClick={(e) => {
               e.stopPropagation();
               const newActors = formData.actors.includes(actor._id) 
                ? formData.actors.filter(id => id !== actor._id) 
                : [...formData.actors, actor._id];
               setFormData(prev => ({ ...prev, actors: newActors }));
              }}>
               <input type="checkbox" checked={formData.actors.includes(actor._id)} readOnly />
               <span>{actor.name}</span>
              </div>
             ))}
            </div>
           </div>
          )}
         </div>
        </div>
        <div className="form-group half">
         <label>Directors</label>
         <div className="custom-dropdown-container">
          <div className="custom-select" onClick={() => setIsDirectorsOpen(!isDirectorsOpen)}>
           <span>{formData.directors.length > 0 ? `${formData.directors.length} selected` : 'Select Directors'}</span>
           <ChevronDown size={18} />
          </div>
          {isDirectorsOpen && (
           <div className="dropdown-menu">
            <div className="dropdown-search">
             <input type="text" placeholder="Search director..." value={directorSearch} onChange={e => setDirectorSearch(e.target.value)} onClick={e => e.stopPropagation()} />
            </div>
            <div className="dropdown-options">
             {availableDirectors.filter(d => d?.name?.toLowerCase().includes(directorSearch.toLowerCase())).map(director => (
              <div key={director._id} className="dropdown-option checkbox-option" onClick={(e) => {
               e.stopPropagation();
               const newDirectors = formData.directors.includes(director._id) 
                ? formData.directors.filter(id => id !== director._id) 
                : [...formData.directors, director._id];
               setFormData(prev => ({ ...prev, directors: newDirectors }));
              }}>
               <input type="checkbox" checked={formData.directors.includes(director._id)} readOnly />
               <span>{director.name}</span>
              </div>
             ))}
            </div>
           </div>
          )}
         </div>
        </div>
       </div>
       <div className="form-row">
        <div className="form-group half">
         <label>IMDb Rating</label>
         <input type="text" name="imdbRating" value={formData.imdbRating} onChange={handleChange} />
        </div>
        <div className="form-group half">
         <label>Content Rating</label>
         <select name="contentRating" value={formData.contentRating} onChange={handleChange}>
          <option value="G">G</option>
          <option value="PG">PG</option>
          <option value="PG-13">PG-13</option>
          <option value="R">R</option>
          <option value="16+">16+</option>
          <option value="18+">18+</option>
         </select>
        </div>
       </div>
       <div className="form-row">
        <div className="form-group half">
         <label>Release Date</label>
         <input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleChange} />
        </div>
        <div className="form-group half">
         <label>Duration</label>
         <input type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="2h 15m" />
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

       <div className="form-group">
        <label>Thumbnail</label>
        <div className="file-input-group">
         <input type="text" name="thumbnail" value={formData.thumbnail && formData.thumbnail.length > 100 ? 'Image Selected' : formData.thumbnail} onChange={handleChange} />
         <button type="button" className="select-btn" onClick={() => thumbnailInputRef.current.click()}>Select</button>
         <input type="file" ref={thumbnailInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'thumbnail')} />
        </div>
        {formData.thumbnail && (
         <div className="image-preview-mini" style={{ marginTop: '10px' }}>
          <img src={formData.thumbnail} alt="Thumbnail" style={{ maxWidth: '100px', borderRadius: '4px' }} />
         </div>
        )}
       </div>
       <div className="form-group">
        <label>Poster</label>
        <div className="file-input-group">
         <input type="text" name="poster" value={formData.poster && formData.poster.length > 100 ? 'Image Selected' : formData.poster} onChange={handleChange} />
         <button type="button" className="select-btn" onClick={() => posterInputRef.current.click()}>Select</button>
         <input type="file" ref={posterInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'poster')} />
        </div>
        {formData.poster && (
         <div className="image-preview-mini" style={{ marginTop: '10px' }}>
          <img src={formatImageUrl(formData, 'poster') || 'https://via.placeholder.com/300x450'} alt="Poster" style={{ maxWidth: '100px', borderRadius: '4px' }} />
         </div>
        )}
       </div>
      </div>
     </div>

     <h2 className="section-title mt-40">Video & Subtitles</h2>
     <div className="form-columns">
      <div className="form-column">
       <div className="form-group">
        <label>Trailer URL</label>
        <input type="text" name="trailerUrl" value={formData.trailerUrl} onChange={handleChange} />
       </div>
       <div className="video-source-row">
        <div className="video-source-label">Video Upload Type</div>
        <select name="videoType" value={formData.videoType} onChange={handleChange}>
         <option value="Local">Local</option>
         <option value="URL">URL</option>
         <option value="HLS/m3u8 / MPEG-DASH / YouTube / Vimeo">HLS/m3u8 / MPEG-DASH / YouTube / Vimeo</option>
         <option value="Embed Code">Embed Code</option>
        </select>
       </div>
       <div className="form-group">
        <label>Video Quality</label>
        <select name="videoQuality" value={formData.videoQuality || '8K Ultra HD'} onChange={handleChange}>
         <option value="8K Ultra HD">8K Ultra HD</option>
         <option value="4K Ultra HD">4K Ultra HD</option>
         <option value="Ultra HD">Ultra HD</option>
         <option value="HDR">HDR</option>
         <option value="Full HD">Full HD</option>
         <option value="HD">HD</option>
        </select>
       </div>

       {formData.videoType === 'Local' && (
        <div className="local-video-inputs">
         <div className="form-group">
          <label>Video File*</label>
          <div className="file-input-group">
           <input type="text" name="videoFile" value={formData.videoFile} onChange={handleChange} />
           <button type="button" className="select-btn" onClick={() => videoInputRef.current.click()}>Select</button>
           <input type="file" ref={videoInputRef} style={{ display: 'none' }} accept="video/*" onChange={(e) => handleVideoFileChange(e, 'videoFile')} />
          </div>
         </div>
         {['480', '720', '1080'].map(res => {
          const refs = { '480': video480InputRef, '720': video720InputRef, '1080': video1080InputRef };
          return (
           <div className="form-group" key={res}>
            <label>Video File {res}P</label>
            <div className="file-input-group">
             <input type="text" name={`videoFile${res}`} value={formData[`videoFile${res}`] || ''} onChange={handleChange} />
             <button type="button" className="select-btn" onClick={() => refs[res].current.click()}>Select</button>
             <input type="file" ref={refs[res]} style={{ display: 'none' }} accept="video/*" onChange={(e) => handleVideoFileChange(e, `videoFile${res}`)} />
            </div>
           </div>
          );
         })}
        </div>
       )}

       {formData.videoType === 'URL' && (
        <div className="url-video-inputs">
         <div className="form-group">
          <label>Video URL*</label>
          <input type="text" name="videoFile" value={formData.videoFile} onChange={handleChange} placeholder="https://..." />
         </div>
         {['480', '720', '1080'].map(res => (
          <div className="form-group" key={res}>
           <label>Video URL {res}P</label>
           <input type="text" name={`videoFile${res}`} value={formData[`videoFile${res}`] || ''} onChange={handleChange} placeholder="https://..." />
          </div>
         ))}
        </div>
       )}

       {formData.videoType === 'HLS/m3u8 / MPEG-DASH / YouTube / Vimeo' && (
        <div className="form-group">
         <label>HLS / Streaming URL*</label>
         <input type="text" name="videoFile" value={formData.videoFile} onChange={handleChange} placeholder="https://..." />
        </div>
       )}

       {formData.videoType === 'Embed Code' && (
        <div className="form-group">
         <label>Video Embed Code*</label>
         <textarea name="videoFile" value={formData.videoFile} onChange={handleChange} placeholder="Paste embed code here..." style={{ background: '#1a1a1a', border: '1px solid #333', padding: '12px 15px', color: '#fff', borderRadius: '4px', outline: 'none', width: '100%', height: '100px', resize: 'none' }}></textarea>
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
       <div className="form-group">
        <label>Download URL</label>
        <input type="text" name="downloadUrl" value={formData.downloadUrl} onChange={handleChange} />
       </div>
      </div>

      <div className="form-column">
       <h2 className="section-title">Edit New Release</h2>
       <div className="form-group">
        <label>SEO Title</label>
        <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} />
       </div>
       <div className="form-group">
        <label>Meta Description</label>
        <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} />
       </div>
       <div className="form-group">
        <label>Keywords</label>
        <textarea name="keywords" value={formData.keywords} onChange={handleChange} />
       </div>

       <h2 className="section-title mt-20">Subtitles</h2>
       <div className="form-group">
        <label>Subtitles</label>
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
       {formData.subtitles.map((sub, index) => (
        <div key={index} className="subtitle-row">
         <div className="form-group half">
          <label>Language {index + 1}</label>
          <input type="text" value={sub.language} readOnly />
         </div>
         <div className="form-group half">
          <label>URL {index + 1}</label>
          <input type="text" value={sub.url} onChange={(e) => handleSubChange(index, e.target.value)} />
         </div>
        </div>
       ))}
       
       <div className="form-footer mt-40">
        <button type="submit" className="save-movie-btn" disabled={loading}>
         <Save size={18} />
         <span>{loading ? 'Updating...' : 'Update Movie'}</span>
        </button>
       </div>
      </div>
     </div>
    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-movie-page { padding: 20px; background-color: #0c0c0c; min-height: 100vh; color: #fff; }
    .top-nav { margin-bottom: 25px; }
    .back-btn { background: transparent; border: none; color: #b3d332; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.3rem; cursor: pointer; }
    .section-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 30px; border-left: 5px solid #b3d332; padding-left: 15px; line-height: 1; }
    .form-columns { display: flex; gap: 50px; }
    .form-column { flex: 1; display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
    .form-group label { font-weight: 700; font-size: 1rem; }
    .form-group input, .form-group select, .form-group textarea { background: #1a1a1a; border: 1px solid #333; padding: 12px 15px; color: #fff; border-radius: 4px; outline: none; width: 100%; }
    .form-row { display: flex; gap: 20px; }
    .half { flex: 1; }
    .file-input-group { display: flex; }
    .file-input-group input { flex: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; }
    .select-btn { background: #444; color: #fff; border: none; padding: 0 15px; border-top-right-radius: 4px; border-bottom-right-radius: 4px; cursor: pointer; font-weight: 700; }
    .custom-radio-group { display: flex; align-items: center; }
    .radio-item { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem; font-weight: 700; position: relative; }
    .radio-item input { position: absolute; opacity: 0; cursor: pointer; }
    .radio-dot { height: 20px; width: 20px; background-color: #000; border: 2px solid #fff; border-radius: 50% !important; display: inline-block; position: relative; }
    .radio-item input:checked ~ .radio-dot { border-color: #b3d332; }
    .radio-item input:checked ~ .radio-dot:after { content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: #b3d332; border-radius: 50% !important; }
    .ml-30 { margin-left: 30px; }
    .mt-20 { margin-top: 20px; }
    .mt-40 { margin-top: 40px; }
    .subtitle-row { display: flex; gap: 15px; }
    .save-movie-btn { background: #b3d332; color: #fff; border: none; padding: 12px 40px; border-radius: 4px; display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: transform 0.2s; }
    .save-movie-btn:hover { transform: translateY(-2px); }
    .video-source-row { display: grid; grid-template-columns: 180px 1fr; align-items: center; gap: 20px; margin-bottom: 20px; }
    .video-source-row select { width: 100%; background: #2c2c2c; border: 1px solid #333; padding: 12px; border-radius: 4px; color: #fff; }
    .form-row-custom.stacked { display: grid; grid-template-columns: 180px 1fr; align-items: center; gap: 20px; margin-bottom: 20px; }

    /* Custom Dropdown Styling */
    .custom-dropdown-container { position: relative; width: 100%; }
    .custom-select { background: #1a1a1a; border: 1px solid #333; padding: 10px 15px; border-radius: 6px; color: #ccc; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 0.9rem; min-height: 44px; }
    .dropdown-menu { position: absolute; top: 100%; left: 0; width: 100%; background: #1a1a1a; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; border-radius: 4px; margin-top: 5px; overflow: hidden; }
    .dropdown-search { padding: 10px; background: #222; border-bottom: 1px solid #333; }
    .dropdown-search input { width: 100%; padding: 8px 12px; background: #111; border: 1px solid #444; color: #fff; outline: none; font-size: 0.85rem; border-radius: 4px; }
    .dropdown-options { max-height: 200px; overflow-y: auto; }
    .dropdown-option { padding: 10px 15px; cursor: pointer; color: #ccc; border-bottom: 1px solid #222; font-size: 0.9rem; display: flex; align-items: center; gap: 10px; }
    .dropdown-option:hover { background: #222; color: #fff; }
    .dropdown-option input[type="checkbox"] { width: 16px; height: 16px; accent-color: #b3d332; cursor: pointer; }
    .checkbox-option { transition: background 0.2s; }
    .loading { color: #fff; text-align: center; padding: 100px; font-size: 1.5rem; }
   ` }} />
  </div>
 );
};

export default EditNewRelease;
