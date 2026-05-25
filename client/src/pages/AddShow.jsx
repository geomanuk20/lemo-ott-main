import React, { useState, useEffect, useRef } from 'react';
import { uploadToCloudinary } from '../utils/upload';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { ChevronLeft, Save, ChevronDown } from 'lucide-react';
import { formatImageUrl } from '../utils/image';

const AddShow = () => {
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
  releaseYear: '',
  videoQuality: '4K Ultra HD',
  seoTitle: '',
  metaDescription: '',
  keywords: '',
  imdbId: '',
  contentType: 'TV Show'
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
    navigate('/admin/tv-shows/shows');
   } else {
    const errorData = await response.json();
    alert(`Failed to add show: ${errorData.message}`);
   }
  } catch (err) {
   console.error('Error adding show:', err);
   alert('An error occurred while adding the show.');
  } finally {
   setLoading(false);
  }
 };

 const fetchImdbData = async () => {
  if (!formData.imdbId) return;
  // Mock IMDb fetch for now
  alert('IMDb data fetching logic will be implemented here');
 };

 return (
  <div className="add-show-page">
   <div className="top-nav">
    <button className="back-btn" onClick={() => navigate('/admin/tv-shows/shows')}>
     <ChevronLeft size={24} />
     <span>Back</span>
    </button>
   </div>

   <div className="imdb-import-section">
    <label>Import From IMDb</label>
    <div className="imdb-input-group">
     <input 
      type="text" 
      name="imdbId"
      value={formData.imdbId}
      onChange={handleChange}
      placeholder="Enter IMDb ID (e.g. tt11856010) or Title (e.g. House of Cards)" 
     />
     <button type="button" className="fetch-btn" onClick={fetchImdbData}>FETCH</button>
    </div>
    <p className="hint">(Recommended : Search by IMDb ID for better result)</p>
   </div>

   <form onSubmit={handleSubmit}>
    <div className="form-grid">
     {/* Left Column: Show Info */}
     <div className="form-column">
      <h2 className="section-title">Show Info</h2>
      
      <div className="form-group">
       <label>Show Name*</label>
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

      <div className="form-group">
       <label>Sort Info</label>
       <textarea name="sortInfo" value={formData.sortInfo} onChange={handleChange} style={{ height: '80px' }}></textarea>
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
        <label>Series Access</label>
        <select name="seriesAccess" value={formData.seriesAccess} onChange={handleChange}>
         <option value="Paid">Paid</option>
         <option value="Free">Free</option>
        </select>
       </div>
      </div>

      <div className="form-group">
       <label>Language*</label>
       <select name="language" value={formData.language} onChange={handleChange} required>
        <option value="">Select Language</option>
        {languages.map(lang => (
         <option key={lang._id} value={lang.name}>{lang.name}</option>
        ))}
       </select>
      </div>

      <div className="form-group">
       <label>Genres*</label>
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
           {genresList.filter(g => g?.name?.toLowerCase().includes(genreSearch.toLowerCase())).map(genre => (
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

      <div className="form-group">
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
           {availableActors.filter(a => a.name.toLowerCase().includes(actorSearch.toLowerCase())).map(actor => (
            <div key={actor._id} className="dropdown-option checkbox-option" onClick={(e) => {
             e.stopPropagation();
             const newActors = formData.actors.includes(actor.name) 
              ? formData.actors.filter(name => name !== actor.name) 
              : [...formData.actors, actor.name];
             setFormData(prev => ({ ...prev, actors: newActors }));
            }}>
             <input type="checkbox" checked={formData.actors.includes(actor.name)} readOnly />
             <span>{actor.name}</span>
            </div>
           ))}
          </div>
         </div>
        )}
       </div>
      </div>

      <div className="form-group">
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
           {availableDirectors.filter(d => d.name.toLowerCase().includes(directorSearch.toLowerCase())).map(director => (
            <div key={director._id} className="dropdown-option checkbox-option" onClick={(e) => {
             e.stopPropagation();
             const newDirectors = formData.directors.includes(director.name) 
              ? formData.directors.filter(name => name !== director.name) 
              : [...formData.directors, director.name];
             setFormData(prev => ({ ...prev, directors: newDirectors }));
            }}>
             <input type="checkbox" checked={formData.directors.includes(director.name)} readOnly />
             <span>{director.name}</span>
            </div>
           ))}
          </div>
         </div>
        )}
       </div>
      </div>

      <div className="form-group">
       <label>IMDb Rating</label>
       <input type="text" name="imdbRating" value={formData.imdbRating} onChange={handleChange} />
      </div>
      
      <div className="form-group">
       <label>Release Year</label>
       <input type="number" name="releaseYear" value={formData.releaseYear} onChange={handleChange} placeholder="e.g. 2024" />
      </div>

      <div className="form-group">
       <label>Video Quality</label>
       <select name="videoQuality" value={formData.videoQuality} onChange={handleChange}>
        <option value="8K Ultra HD">8K Ultra HD</option>
        <option value="4K Ultra HD">4K Ultra HD</option>
        <option value="Ultra HD">Ultra HD</option>
        <option value="HDR">HDR</option>
        <option value="Full HD">Full HD</option>
        <option value="HD">HD</option>
       </select>
      </div>

      <div className="form-group">
       <label>Content Rating</label>
       <select name="contentRating" value={formData.contentRating} onChange={handleChange}>
        <option value="16+">16+</option>
        <option value="18+">18+</option>
        <option value="U">U</option>
        <option value="U/A">U/A</option>
       </select>
      </div>

      <div className="form-group">
       <label>Show Poster*</label>
       <div className="file-input-group">
        <input type="text" name="poster" value={formData.poster && formData.poster.startsWith('data:') ? 'Image Selected' : formData.poster} onChange={handleChange} placeholder="Paste image URL..." />
        <button type="button" className="select-btn" onClick={() => posterInputRef.current.click()}>Select</button>
        <input type="file" ref={posterInputRef} hidden onChange={(e) => handleFileChange(e, 'poster')} />
       </div>
       {formData.poster && (
        <div className="image-preview" style={{ marginTop: '10px' }}>
         <img src={formatImageUrl(formData, 'poster') || 'https://via.placeholder.com/300x450'} alt="Preview" style={{ maxWidth: '200px', borderRadius: '4px' }} />
        </div>
       )}
       <p className="hint">(Recommended resolution : 600x900)</p>
      </div>

      <div className="form-group">
       <label>Landscape Poster (Thumbnail)*</label>
       <div className="file-input-group">
        <input type="text" name="thumbnail" value={formData.thumbnail && formData.thumbnail.startsWith('data:') ? 'Image Selected' : formData.thumbnail} onChange={handleChange} placeholder="Paste image URL..." />
        <button type="button" className="select-btn" onClick={() => thumbnailInputRef.current.click()}>Select</button>
        <input type="file" ref={thumbnailInputRef} hidden onChange={(e) => handleFileChange(e, 'thumbnail')} />
       </div>
       {formData.thumbnail && (
        <div className="image-preview" style={{ marginTop: '10px' }}>
         <img src={formData.thumbnail} alt="Preview" style={{ maxWidth: '200px', borderRadius: '4px' }} />
        </div>
       )}
       <p className="hint">(Recommended resolution : 1280x720)</p>
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
    .add-show-page { padding: 20px; animation: fadeIn 0.3s ease-out; background-color: #0c0c0c; min-height: 100vh; }
    
    .top-nav { margin-bottom: 25px; }
    .back-btn {
     background: transparent; border: none; color: #b3d332; display: flex; align-items: center;
     gap: 8px; font-weight: 800; font-size: 1.3rem; cursor: pointer;
    }

    /* Custom Dropdown Styling */
    .custom-dropdown-container { position: relative; width: 100%; }
    .custom-select { background: #1a1a1a; border: 1px solid #333; padding: 10px 15px; border-radius: 6px; color: #ccc; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 0.9rem; min-height: 44px; }
    .dropdown-menu { position: absolute; top: 100%; left: 0; width: 100%; background: #1a1a1a; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; border-radius: 4px; margin-top: 5px; overflow: hidden; }
    .dropdown-search { padding: 10px; background: #222; border-bottom: 1px solid #333; }
    .dropdown-search input { width: 100%; padding: 8px 12px !important; background: #111 !important; border: 1px solid #444 !important; color: #fff !important; outline: none; font-size: 0.85rem; border-radius: 4px; }
    .dropdown-options { max-height: 200px; overflow-y: auto; }
    .dropdown-option { padding: 10px 15px; cursor: pointer; color: #ccc; border-bottom: 1px solid #222; font-size: 0.9rem; display: flex; align-items: center; gap: 10px; }
    .dropdown-option:hover { background: #222; color: #fff; }
    .dropdown-option input[type="checkbox"] { width: 16px; height: 16px; accent-color: #b3d332; cursor: pointer; }
    .checkbox-option { transition: background 0.2s; }

    .imdb-import-section { background: #151515; padding: 25px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #222; }
    .imdb-import-section label { color: #fff; font-weight: 700; display: block; margin-bottom: 15px; font-size: 1.1rem; }
    .imdb-input-group { display: flex; gap: 15px; max-width: 800px; }
    .imdb-input-group input { flex: 1; background: transparent; border: 1px solid #333; padding: 12px 15px; color: #fff; border-radius: 4px; outline: none; font-size: 0.95rem; }
    .fetch-btn { background: #b3d332; color: #fff; border: none; padding: 0 25px; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 0.9rem; }
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
    
    .form-row { display: flex; gap: 20px; }
    .half { flex: 1; }

    .file-input-group { display: flex; }
    .file-input-group input { flex: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; }
    .select-btn { background: #444; color: #fff; border: none; padding: 0 15px; border-top-right-radius: 4px; border-bottom-right-radius: 4px; cursor: pointer; font-weight: 700; }

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

export default AddShow;
