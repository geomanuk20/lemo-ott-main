import React, { useState, useEffect, useRef } from 'react';
import { uploadToCloudinary } from '../utils/upload';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { ChevronLeft, Save, ChevronDown } from 'lucide-react';
import { formatImageUrl } from '../utils/image';

const AddPocketReelSeries = () => {
 const navigate = useNavigate();
 const posterInputRef = useRef(null);
 const thumbnailInputRef = useRef(null);

 const [formData, setFormData] = useState({
  title: '',
  description: '',
  sortInfo: '',
  upcoming: 'No',
  seriesAccess: 'Paid',
  language: '',
  genres: [],
  actors: [],
  directors: [],
  imdbRating: '',
  contentRating: '16+',
  poster: '',
  thumbnail: '',
  status: 'Active',
  releaseYear: '2026',
  videoQuality: 'None',
  seoTitle: '',
  metaDescription: '',
  keywords: '',
  imdbId: '',
  contentType: 'Pocket Reel Series'
 });

 const [languages, setLanguages] = useState([]);
 const [genresList, setGenresList] = useState([]);
 const [availableActors, setAvailableActors] = useState([]);
 const [availableDirectors, setAvailableDirectors] = useState([]);
 const [loading, setLoading] = useState(false);
 const [isActorsOpen, setIsActorsOpen] = useState(false);
 const [isDirectorsOpen, setIsDirectorsOpen] = useState(false);
 const [isGenresOpen, setIsGenresOpen] = useState(false);
 const [actorSearch, setActorSearch] = useState('');
 const [directorSearch, setDirectorSearch] = useState('');
 const [genreSearch, setGenreSearch] = useState('');

 useEffect(() => {
  const fetchData = async () => {
   try {
    const [langRes, genreRes, actorsRes, directorsRes] = await Promise.all([
     fetch('/api/languages'),
     fetch('/api/genres'),
     fetch('/api/actors'),
     fetch('/api/directors')
    ]);
    setLanguages(await langRes.json());
    setGenresList(await genreRes.json());
    setAvailableActors(await actorsRes.json());
    setAvailableDirectors(await directorsRes.json());
   } catch (err) {
    console.error('Error fetching data:', err);
   }
  };
  fetchData();
 }, []);

 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
 };

 const handleEditorChange = (content) => {
  setFormData(prev => ({ ...prev, description: content }));
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
   const response = await fetch('/api/shows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });
   if (response.ok) {
    navigate('/admin/pocket-reel-series');
   } else {
    const errorData = await response.json();
    alert(`Failed to add pocket reel series: ${errorData.message}`);
   }
  } catch (err) {
   console.error('Error adding pocket reel series:', err);
   alert('An error occurred while adding the pocket reel series.');
  } finally {
   setLoading(false);
  }
 };

 const handleSelectGenre = (genreName) => {
  setFormData(prev => {
   const exists = prev.genres.includes(genreName);
   const updated = exists ? prev.genres.filter(g => g !== genreName) : [...prev.genres, genreName];
   return { ...prev, genres: updated };
  });
 };

 const handleSelectActor = (actorId) => {
  setFormData(prev => {
   const exists = prev.actors.includes(actorId);
   const updated = exists ? prev.actors.filter(id => id !== actorId) : [...prev.actors, actorId];
   return { ...prev, actors: updated };
  });
 };

 const handleSelectDirector = (directorId) => {
  setFormData(prev => {
   const exists = prev.directors.includes(directorId);
   const updated = exists ? prev.directors.filter(id => id !== directorId) : [...prev.directors, directorId];
   return { ...prev, directors: updated };
  });
 };

 const filteredGenres = genresList.filter(g => (g.name || '').toLowerCase().includes(genreSearch.toLowerCase()));
 const filteredActors = availableActors.filter(a => (a.name || '').toLowerCase().includes(actorSearch.toLowerCase()));
 const filteredDirectors = availableDirectors.filter(d => (d.name || '').toLowerCase().includes(directorSearch.toLowerCase()));

 return (
  <div className="add-show-page">
   <div className="page-header-row">
    <button className="back-btn" onClick={() => navigate('/admin/pocket-reel-series')}>
     <ChevronLeft size={16} /> Back
    </button>
    <h2 className="section-title">Pocket Reel Series Info</h2>
   </div>

   <form onSubmit={handleSubmit} className="show-form">
    <div className="form-grid">
     <div className="form-group full-width">
      <label>Title *</label>
      <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="Enter pocket reel series title" />
     </div>

     <div className="form-group full-width">
      <label>Short Info</label>
      <input type="text" name="sortInfo" value={formData.sortInfo} onChange={handleChange} placeholder="Brief summary" />
     </div>

     <div className="form-group full-width">
      <label>Description</label>
      <Editor
       apiKey="b68svef2wtbkyjcfh11g0693m0j01y0m2k1d3o8s0u1lvd64"
       value={formData.description}
       init={{
        height: 200,
        menubar: false,
        plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'],
        toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; background-color: #1a1b1e; color: #fff; }'
       }}
       onEditorChange={handleEditorChange}
      />
     </div>

     <div className="form-group">
      <label>Language *</label>
      <select name="language" required value={formData.language} onChange={handleChange}>
       <option value="">Select Language</option>
       {languages.map(lang => (
        <option key={lang._id} value={lang.name}>{lang.name}</option>
       ))}
      </select>
     </div>

     <div className="form-group">
      <label>Upcoming Series</label>
      <select name="upcoming" value={formData.upcoming} onChange={handleChange}>
       <option value="No">No</option>
       <option value="Yes">Yes</option>
      </select>
     </div>

     <div className="form-group">
      <label>Series Access</label>
      <select name="seriesAccess" value={formData.seriesAccess} onChange={handleChange}>
       <option value="Paid">Paid</option>
       <option value="Free">Free</option>
      </select>
     </div>

     <div className="form-group">
      <label>Content Rating</label>
      <select name="contentRating" value={formData.contentRating} onChange={handleChange}>
       <option value="16+">16+</option>
       <option value="18+">18+</option>
       <option value="All">All</option>
       <option value="13+">13+</option>
       <option value="7+">7+</option>
      </select>
     </div>

     <div className="form-group">
      <label>IMDb Rating</label>
      <input type="text" name="imdbRating" value={formData.imdbRating} onChange={handleChange} placeholder="e.g. 8.5" />
     </div>

     <div className="form-group">
      <label>Release Year</label>
      <input type="number" name="releaseYear" value={formData.releaseYear} onChange={handleChange} placeholder="e.g. 2026" />
     </div>

     <div className="form-group">
      <label>Video Quality</label>
      <select name="videoQuality" value={formData.videoQuality || 'None'} onChange={handleChange}>
       <option value="None">None</option>
       <option value="8K Ultra HD">8K Ultra HD</option>
       <option value="4K Ultra HD">4K Ultra HD</option>
       <option value="Ultra HD">Ultra HD</option>
       <option value="HDR">HDR</option>
       <option value="Full HD">Full HD</option>
       <option value="HD">HD</option>
       <option value="SD">SD</option>
      </select>
     </div>

     {/* Genres Dropdown */}
     <div className="form-group full-width">
      <label>Genres</label>
      <div className="multi-select-wrapper">
       <div className="select-box" onClick={() => setIsGenresOpen(!isGenresOpen)}>
        <span className="selected-text">
         {formData.genres.length > 0 ? formData.genres.join(', ') : 'Select Genres'}
        </span>
        <ChevronDown size={16} />
       </div>
       {isGenresOpen && (
        <div className="dropdown-panel">
         <input type="text" placeholder="Search genre..." value={genreSearch} onChange={(e) => setGenreSearch(e.target.value)} className="search-input" />
         <div className="options-list">
          {filteredGenres.map(g => (
           <label key={g._id} className="checkbox-label">
            <input type="checkbox" checked={formData.genres.includes(g.name)} onChange={() => handleSelectGenre(g.name)} />
            {g.name}
           </label>
          ))}
         </div>
        </div>
       )}
      </div>
     </div>

     {/* Actors Dropdown */}
     <div className="form-group full-width">
      <label>Actors / Cast</label>
      <div className="multi-select-wrapper">
       <div className="select-box" onClick={() => setIsActorsOpen(!isActorsOpen)}>
        <span className="selected-text">
         {formData.actors.length > 0 
          ? availableActors.filter(a => formData.actors.includes(a._id)).map(a => a.name).join(', ')
          : 'Select Actors'}
        </span>
        <ChevronDown size={16} />
       </div>
       {isActorsOpen && (
        <div className="dropdown-panel">
         <input type="text" placeholder="Search actors..." value={actorSearch} onChange={(e) => setActorSearch(e.target.value)} className="search-input" />
         <div className="options-list">
          {filteredActors.map(a => (
           <label key={a._id} className="checkbox-label">
            <input type="checkbox" checked={formData.actors.includes(a._id)} onChange={() => handleSelectActor(a._id)} />
            {a.name}
           </label>
          ))}
         </div>
        </div>
       )}
      </div>
     </div>

     {/* Directors Dropdown */}
     <div className="form-group full-width">
      <label>Directors</label>
      <div className="multi-select-wrapper">
       <div className="select-box" onClick={() => setIsDirectorsOpen(!isDirectorsOpen)}>
        <span className="selected-text">
         {formData.directors.length > 0 
          ? availableDirectors.filter(d => formData.directors.includes(d._id)).map(d => d.name).join(', ')
          : 'Select Directors'}
        </span>
        <ChevronDown size={16} />
       </div>
       {isDirectorsOpen && (
        <div className="dropdown-panel">
         <input type="text" placeholder="Search directors..." value={directorSearch} onChange={(e) => setDirectorSearch(e.target.value)} className="search-input" />
         <div className="options-list">
          {filteredDirectors.map(d => (
           <label key={d._id} className="checkbox-label">
            <input type="checkbox" checked={formData.directors.includes(d._id)} onChange={() => handleSelectDirector(d._id)} />
            {d.name}
           </label>
          ))}
         </div>
        </div>
       )}
      </div>
     </div>

     {/* Thumbnail Image */}
     <div className="form-group">
      <label>Thumbnail (Landscape/Vertical)</label>
      <div className="file-input-wrapper">
       <input type="text" name="thumbnail" value={formData.thumbnail} onChange={handleChange} placeholder="Paste image URL or upload" />
       <input type="file" ref={thumbnailInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'thumbnail')} />
       <button type="button" className="upload-btn" onClick={() => thumbnailInputRef.current.click()}>Upload</button>
      </div>
      {formData.thumbnail && (
       <div className="image-preview">
        <img src={formatImageUrl(formData.thumbnail)} alt="Thumbnail Preview" />
       </div>
      )}
     </div>

     {/* Poster Image */}
     <div className="form-group">
      <label>Poster Image</label>
      <div className="file-input-wrapper">
       <input type="text" name="poster" value={formData.poster} onChange={handleChange} placeholder="Paste poster URL or upload" />
       <input type="file" ref={posterInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'poster')} />
       <button type="button" className="upload-btn" onClick={() => posterInputRef.current.click()}>Upload</button>
      </div>
      {formData.poster && (
       <div className="image-preview">
        <img src={formatImageUrl(formData.poster)} alt="Poster Preview" />
       </div>
      )}
     </div>

     <div className="form-group">
      <label>Status</label>
      <select name="status" value={formData.status} onChange={handleChange}>
       <option value="Active">Active</option>
       <option value="Inactive">Inactive</option>
      </select>
     </div>
    </div>

    <div className="seo-section-title">
     <h3>SEO Settings</h3>
    </div>

    <div className="form-grid">
     <div className="form-group full-width">
      <label>SEO Title</label>
      <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} placeholder="SEO Title" />
     </div>
     <div className="form-group full-width">
      <label>Meta Description</label>
      <input type="text" name="metaDescription" value={formData.metaDescription} onChange={handleChange} placeholder="Meta description" />
     </div>
     <div className="form-group full-width">
      <label>Keywords</label>
      <input type="text" name="keywords" value={formData.keywords} onChange={handleChange} placeholder="e.g. pocket reel, drama, series" />
     </div>
    </div>

    <div className="form-actions">
     <button type="submit" className="submit-btn" disabled={loading}>
      <Save size={16} />
      <span>{loading ? 'Saving...' : 'Save Pocket Reel Series'}</span>
     </button>
    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-show-page { background: #060709; min-height: 100vh; padding: 24px 32px; color: #fff; animation: fadeIn 0.3s ease; box-sizing: border-box; }
    .page-header-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .back-btn { display: flex; align-items: center; gap: 4px; background: #151821; border: 1px solid #232836; color: #cbd5e1; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
    .back-btn:hover { background: #1c2230; color: #fff; border-color: #b3d332; }
    .section-title { font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0; }

    .show-form { background: #11141b; border: 1px solid #1f2533; border-radius: 8px; padding: 24px; max-width: 900px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .full-width { grid-column: span 2; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.84rem; font-weight: 700; color: #94a3b8; }
    .form-group input, .form-group select { background: #181d29; border: 1px solid #252d3d; border-radius: 6px; padding: 10px 14px; color: #fff; font-size: 0.88rem; outline: none; transition: 0.2s; }
    .form-group input:focus, .form-group select:focus { border-color: #b3d332; }

    .multi-select-wrapper { position: relative; }
    .select-box { display: flex; align-items: center; justify-content: space-between; background: #181d29; border: 1px solid #252d3d; border-radius: 6px; padding: 10px 14px; cursor: pointer; }
    .selected-text { font-size: 0.88rem; color: #cbd5e1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dropdown-panel { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #151821; border: 1px solid #232836; border-radius: 6px; padding: 8px; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
    .search-input { width: 100%; box-sizing: border-box; margin-bottom: 6px; padding: 6px 10px; }
    .options-list { max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #cbd5e1; padding: 4px 6px; cursor: pointer; border-radius: 4px; }
    .checkbox-label:hover { background: #232836; color: #fff; }
    .checkbox-label input { accent-color: #b3d332; }

    .file-input-wrapper { display: flex; gap: 8px; }
    .file-input-wrapper input { flex: 1; }
    .upload-btn { background: #1e2638; border: 1px solid #2d384e; color: #b3d332; font-weight: 700; font-size: 0.82rem; padding: 0 16px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
    .upload-btn:hover { background: #2a354e; }
    .image-preview { margin-top: 8px; }
    .image-preview img { max-width: 140px; max-height: 140px; object-fit: cover; border-radius: 6px; border: 1px solid #283244; }

    .seo-section-title { margin: 28px 0 14px; border-top: 1px solid #1f2533; padding-top: 18px; }
    .seo-section-title h3 { font-size: 1rem; font-weight: 800; color: #b3d332; margin: 0; }

    .form-actions { margin-top: 24px; display: flex; justify-content: flex-start; }
    .submit-btn { display: flex; align-items: center; gap: 8px; background: #b3d332; color: #000; border: none; padding: 12px 28px; border-radius: 6px; font-weight: 800; font-size: 0.92rem; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 14px rgba(179,211,50,0.25); }
    .submit-btn:hover { background: #c5ea38; transform: translateY(-1px); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 768px) {
     .add-show-page { padding: 16px; }
     .form-grid { grid-template-columns: 1fr; }
     .full-width { grid-column: span 1; }
    }
   ` }} />
  </div>
 );
};

export default AddPocketReelSeries;
