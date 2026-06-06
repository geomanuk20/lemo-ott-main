// Force rebuild
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit, X, Search, ChevronDown, CheckCircle2, AlertTriangle, Loader2, List, ArrowUpDown } from 'lucide-react';
import Loader from '../components/Loader';
import ImportExportModal from '../components/ImportExportModal';
import { formatImageUrl } from '../utils/image';

const ShortWebSeries = () => {
 const navigate = useNavigate();
 const location = useLocation();
 const [shows, setShows] = useState([]);
 const [isImportExportOpen, setIsImportExportOpen] = useState(false);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedShows, setSelectedShows] = useState([]);
 const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deleteMode, setDeleteMode] = useState('single');
 const [deletingId, setDeletingId] = useState(null);
 const [notification, setNotification] = useState(null);
 const [languages, setLanguages] = useState([]);
 const [genres, setGenres] = useState([]);
 const [selectedLanguage, setSelectedLanguage] = useState('');
 const [selectedGenre, setSelectedGenre] = useState('');
 const [isLanguageOpen, setIsLanguageOpen] = useState(false);
 const [isGenreOpen, setIsGenreOpen] = useState(false);
 const [languageSearch, setLanguageSearch] = useState('');
 const [genreSearch, setGenreSearch] = useState('');

 const API_URL = '/api/shows';

 const fetchShows = async () => {
  try {
   const response = await fetch(`${API_URL}?contentType=Short Web Series`);
   const data = await response.json();
   setShows(data);
  } catch (err) {
   console.error('Error fetching short web series:', err);
  } finally {
   setLoading(false);
  }
 };

 const fetchFilters = async () => {
  try {
   const [langRes, genreRes] = await Promise.all([
    fetch('/api/languages'),
    fetch('/api/genres')
   ]);
   const langData = await langRes.json();
   const genreData = await genreRes.json();
   setLanguages(langData);
   setGenres(genreData);
  } catch (err) {
   console.error('Error fetching filters:', err);
  }
 };

 useEffect(() => {
  fetchShows();
  fetchFilters();
 }, []);

 useEffect(() => {
  const params = new URLSearchParams(location.search);
  const genreParam = params.get('genre');
  if (genreParam) {
   setSelectedGenre(genreParam);
  } else {
   setSelectedGenre('');
  }
 }, [location.search]);

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const toggleStatus = async (show) => {
  try {
   const newStatus = show.status === 'Active' ? 'Inactive' : 'Active';
   const response = await fetch(`${API_URL}/${show._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
   });
   if (response.ok) {
    setShows(prev => prev.map(s => s._id === show._id ? { ...s, status: newStatus } : s));
    showNotification('Status updated successfully');
   }
  } catch (err) {
   console.error('Error toggling status:', err);
  }
 };

 const handleSelectAll = (e) => {
  if (e.target.checked) {
   setSelectedShows(shows.map(s => s._id));
  } else {
   setSelectedShows([]);
  }
 };

 const handleSelectShow = (id) => {
  setSelectedShows(prev => 
   prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
  );
 };

 const handleBulkDelete = async () => {
  if (selectedShows.length === 0) return;
  setDeleteMode('bulk');
  setIsDeleteModalOpen(true);
 };

 const handleBulkStatusChange = async (status) => {
  if (selectedShows.length === 0) return;
  try {
   await Promise.all(selectedShows.map(id => 
    fetch(`${API_URL}/${id}`, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ status })
    })
   ));
   setShows(prev => prev.map(s => selectedShows.includes(s._id) ? { ...s, status } : s));
   setSelectedShows([]);
   setIsActionMenuOpen(false);
   showNotification(`Selected series set to ${status}`);
  } catch (err) {
   console.error('Error in bulk status change:', err);
  }
 };

 const confirmDelete = (id) => {
  setDeletingId(id);
  setDeleteMode('single');
  setIsDeleteModalOpen(true);
 };

 const filteredShows = (Array.isArray(shows) ? shows : []).filter(show => {
  const matchesSearch = show.title.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesLanguage = selectedLanguage ? show.language === selectedLanguage : true;
  const matchesGenre = selectedGenre ? show.genres && show.genres.includes(selectedGenre) : true;
  return matchesSearch && matchesLanguage && matchesGenre;
 });

 const filteredLanguages = languages.filter(lang => lang.name.toLowerCase().includes(languageSearch.toLowerCase()));
 const filteredGenres = genres.filter(g => g.name.toLowerCase().includes(genreSearch.toLowerCase()));

 const executeDelete = async () => {
  try {
   if (deleteMode === 'single') {
    const response = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
    if (response.ok) {
     setShows(prev => prev.filter(s => s._id !== deletingId));
     setIsDeleteModalOpen(false);
     showNotification('Short Web Series deleted successfully');
    }
   } else {
    await Promise.all(selectedShows.map(id => fetch(`${API_URL}/${id}`, { method: 'DELETE' })));
    setShows(prev => prev.filter(s => !selectedShows.includes(s._id)));
    setSelectedShows([]);
    setIsDeleteModalOpen(false);
    showNotification('Selected series deleted');
   }
  } catch (err) {
   console.error('Error deleting show:', err);
  }
 };

 return (
  <div className="shows-page">
   {notification && (
    <div className="custom-alert-box">
     <div className="alert-content">
      {notification.type === 'success' ? (
       <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
      ) : (
       <X size={42} color="#ff4d4d" strokeWidth={2.5} />
      )}
      <span className="alert-text">{notification.message}</span>
     </div>
    </div>
   )}

   <div className="page-header">
    <div className="search-wrapper">
     <div className="search-bar">
      <input 
       type="text" 
       placeholder="Search By Title..." 
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Search size={20} className="search-icon" />
     </div>
    </div>
     <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <button className="import-export-btn" onClick={() => setIsImportExportOpen(true)}>
       <ArrowUpDown size={18} />
       <span>Import / Export</span>
      </button>
      <button className="add-btn" onClick={() => navigate('/admin/short-web-series/add')}>
       <Plus size={20} strokeWidth={3} />
       <span>Add Short Web Series</span>
      </button>
     </div>
   </div>

   <div className="filters-bar">
    <div className="filter-group">
     
     {/* Language Dropdown */}
     <div className="custom-dropdown-container">
      <div className="custom-select" onClick={() => setIsLanguageOpen(!isLanguageOpen)}>
       <span>{selectedLanguage || 'Filter by Language'}</span>
       <ChevronDown size={18} className={isLanguageOpen ? 'rotate-180' : ''} />
      </div>
      {isLanguageOpen && (
       <div className="dropdown-menu">
        <div className="dropdown-search">
         <input 
          type="text" 
          value={languageSearch} 
          onChange={e => setLanguageSearch(e.target.value)} 
          onClick={e => e.stopPropagation()}
          autoFocus
         />
        </div>
        <div className="dropdown-options">
         <div className="dropdown-header-option" onClick={() => { setSelectedLanguage(''); setIsLanguageOpen(false); }}>
          Filter by Language
         </div>
         {filteredLanguages.map(lang => (
          <div 
           key={lang._id} 
           className="dropdown-option" 
           onClick={() => { setSelectedLanguage(lang.name); setIsLanguageOpen(false); }}
          >
           {lang.name}
          </div>
         ))}
        </div>
       </div>
      )}
     </div>

     {/* Genre Dropdown */}
     <div className="custom-dropdown-container">
      <div className="custom-select" onClick={() => setIsGenreOpen(!isGenreOpen)}>
       <span>{selectedGenre || 'Filter by genres'}</span>
       <ChevronDown size={18} className={isGenreOpen ? 'rotate-180' : ''} />
      </div>
      {isGenreOpen && (
       <div className="dropdown-menu">
        <div className="dropdown-search">
         <input 
          type="text" 
          value={genreSearch} 
          onChange={e => setGenreSearch(e.target.value)} 
          onClick={e => e.stopPropagation()}
          autoFocus
         />
        </div>
        <div className="dropdown-options">
         <div className="dropdown-header-option" onClick={() => { setSelectedGenre(''); setIsGenreOpen(false); }}>
          Filter by genres
         </div>
         {filteredGenres.map(genre => (
          <div 
           key={genre._id} 
           className="dropdown-option" 
           onClick={() => { setSelectedGenre(genre.name); setIsGenreOpen(false); }}
          >
           {genre.name}
          </div>
         ))}
        </div>
       </div>
      )}
     </div>
    </div>

    <div className="right-controls">
     <label className="select-all">
      <input 
       type="checkbox" 
       checked={shows.length > 0 && selectedShows.length === shows.length}
       onChange={handleSelectAll}
      />
      <span>Select All</span>
     </label>
     <div className="action-dropdown-container">
      <button className="action-btn" onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}>
       <span>Action</span>
       <ChevronDown size={16} />
      </button>
      {isActionMenuOpen && (
       <div className="action-dropdown-menu">
        <button onClick={() => handleBulkStatusChange('Active')}>Active</button>
        <button onClick={() => handleBulkStatusChange('Inactive')}>Inactive</button>
        <button className="delete-option" onClick={handleBulkDelete}>Delete</button>
       </div>
      )}
     </div>
    </div>
   </div>

   {loading ? (
    <div className="loader-container"><Loader size="small" inline={true} /></div>
   ) : (
    <div className="grid-container">
     {filteredShows.map((show) => (
      <div key={show._id} className="item-card">
       <div className="poster-wrapper">
        <input 
         type="checkbox" 
         className="item-checkbox" 
         checked={selectedShows.includes(show._id)}
         onChange={() => handleSelectShow(show._id)}
        />
        <img src={formatImageUrl(show, 'poster') || 'https://via.placeholder.com/300x450'} alt={show.title} className="poster-img" />
       </div>
       <div className="item-info">
        <h3 className="item-title">{show.title}</h3>
        <p className="item-subtitle">{Array.isArray(show.genres) ? show.genres.join(', ') : ''}</p>
        <div className="card-controls">
         <div className="action-icons">
          <button className="circle-icon episodes" onClick={() => navigate(`/admin/short-web-series/episodes?show=${show._id}`)} title="View Episodes"><List size={16} /></button>
          <button className="circle-icon edit" onClick={() => navigate(`/admin/short-web-series/edit/${show._id}`)}><Edit size={16} /></button>
          <button className="circle-icon delete" onClick={() => confirmDelete(show._id)}><X size={18} strokeWidth={3} /></button>
         </div>
         <label className="switch">
          <input 
           type="checkbox" 
           checked={show.status === 'Active'} 
           onChange={() => toggleStatus(show)}
          />
          <span className="slider"></span>
         </label>
        </div>
       </div>
      </div>
     ))}
    </div>
   )}

   {/* Delete Modal */}
   {isDeleteModalOpen && (
    <div className="modal-overlay">
     <div className="delete-modal-content">
      <div className="delete-icon-wrapper">
       <AlertTriangle size={65} color="#ff4d4d" strokeWidth={1.5} />
      </div>
      <h2>Are you sure?</h2>
      <p>{deleteMode === 'bulk' ? `You want to delete these ${selectedShows.length} series?` : 'You want to delete this series?'} This action cannot be undone.</p>
      <div className="delete-modal-footer">
       <button className="cancel-btn" onClick={() => { setIsDeleteModalOpen(false); setDeletingId(null); }}>Cancel</button>
       <button className="confirm-btn" onClick={executeDelete}>Delete</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .shows-page { animation: fadeIn 0.4s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .search-bar { position: relative; width: 380px; }
    .search-bar input { width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 12px 20px 12px 48px; color: #fff; border-radius: 50px; outline: none; }
    .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #666; }
    .add-btn { background: linear-gradient(135deg, #b3d332 0%, #00a86b 100%); color: white; border: none; padding: 10px 22px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; }
    .import-export-btn { background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 10px 20px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
    .import-export-btn:hover { background: #2a2a2a; border-color: #b3d332; color: #b3d332; }
    .filters-bar { background: #111; padding: 15px 20px; border-radius: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #222; }
    .filter-group { display: flex; align-items: center; gap: 15px; }
    
    .custom-dropdown-container { position: relative; min-width: 250px; }
    .custom-select { background: #2c2c2c; border: 1px solid #333; padding: 12px 18px; border-radius: 4px; color: #fff; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 0.95rem; font-weight: 500; }
    .rotate-180 { transform: rotate(180deg); }
    
    .dropdown-menu { position: absolute; top: 100%; left: 0; width: 100%; background: #1a1a1a; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; border-radius: 4px; margin-top: 5px; overflow: hidden; }
    .dropdown-search { padding: 10px; background: #222; border-bottom: 1px solid #333; }
    .dropdown-search input { width: 100%; padding: 10px 12px; background: #111; border: 1px solid #444; color: #fff; outline: none; font-size: 0.9rem; border-radius: 4px; }
    .dropdown-options { max-height: 250px; overflow-y: auto; }
    .dropdown-header-option { padding: 10px 15px; background: #2c2c2c; color: #aaa; font-size: 0.85rem; cursor: pointer; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .dropdown-option { padding: 12px 15px; background: #1a1a1a; color: #fff; font-size: 0.95rem; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid #222; }
    .dropdown-option:last-child { border-bottom: none; }
    .dropdown-option:hover { background: #222; color: #b3d332; }

    .right-controls { display: flex; align-items: center; gap: 20px; }
    .select-all { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 0.95rem; cursor: pointer; }
    .select-all input { width: 18px; height: 18px; cursor: pointer; }
    .action-btn { background: #0088ff; color: #fff; border: none; padding: 9px 20px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; }
    
    .action-dropdown-container { position: relative; }
    .action-dropdown-menu { position: absolute; top: 100%; right: 0; background: #111; border: 1px solid #333; border-radius: 8px; margin-top: 8px; min-width: 160px; z-index: 1000; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .action-dropdown-menu button { width: 100%; padding: 12px 20px; background: none; border: none; color: #fff; text-align: left; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: background 0.2s; }
    .action-dropdown-menu button:hover { background: #222; }
    .action-dropdown-menu button.delete-option { color: #ff4d4d; border-top: 1px solid #222; }
    .action-dropdown-menu button.delete-option:hover { background: rgba(255, 77, 77, 0.1); }

    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 25px; }
    .item-card { background: #1a1a1a; border-radius: 10px; overflow: hidden; border: 1px solid #222; }
    .poster-wrapper { position: relative; height: 320px; }
    .poster-img { width: 100%; height: 100%; object-fit: cover; }
    .item-checkbox { position: absolute; top: 12px; left: 12px; width: 20px; height: 20px; z-index: 10; accent-color: #fff; }
    .item-info { padding: 15px; }
    .item-title { color: #fff; font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; }
    .item-subtitle { color: #888; font-size: 0.9rem; margin-bottom: 15px; }
    .card-controls { display: flex; justify-content: space-between; align-items: center; }
    .action-icons { display: flex; gap: 10px; }
    .circle-icon { width: 34px; height: 34px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: transform 0.2s; }
    .circle-icon:hover { transform: scale(1.1); }
    .circle-icon.edit { background: #b3d332; }
    .circle-icon.episodes { background: #0088ff; }
    .circle-icon.delete { background: #ff4d4d; }
    .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #b3d332; }
    input:checked + .slider:before { transform: translateX(20px); }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Delete Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(5px); }
    .delete-modal-content { background: #1a1a1a; width: 90%; max-width: 450px; padding: 30px; border-radius: 20px; text-align: center; border: 1px solid #333; }
    .delete-icon-wrapper { margin-bottom: 20px; }
    .delete-modal-content h2 { color: #fff; margin-bottom: 10px; font-size: 1.8rem; }
    .delete-modal-content p { color: #aaa; margin-bottom: 30px; }
    .delete-modal-footer { display: flex; gap: 15px; justify-content: center; }
    .cancel-btn { background: #333; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; }
    .confirm-btn { background: #ff4d4d; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; }
    @keyframes modalFade { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    /* Notification Alert Styles */
    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 25px 50px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
   ` }} />
   <ImportExportModal 
    isOpen={isImportExportOpen} 
    onClose={() => setIsImportExportOpen(false)} 
    type="short-web-series" 
    onImportSuccess={fetchShows} 
   />
  </div>
 );
};

export default ShortWebSeries;
