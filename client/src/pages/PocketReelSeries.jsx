import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit, X, Search, ChevronDown, CheckCircle2, AlertTriangle, Loader2, List, ArrowUpDown } from 'lucide-react';
import Loader from '../components/Loader';
import ImportExportModal from '../components/ImportExportModal';
import { formatImageUrl } from '../utils/image';

const PocketReelSeries = () => {
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
   const response = await fetch(`${API_URL}?contentType=Pocket Reel Series`);
   const data = await response.json();
   setShows(data);
  } catch (err) {
   console.error('Error fetching pocket reel series:', err);
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
  const matchesSearch = (show.title || '').toLowerCase().includes(searchTerm.toLowerCase());
  const matchesLanguage = selectedLanguage ? show.language === selectedLanguage : true;
  const matchesGenre = selectedGenre ? show.genres && show.genres.includes(selectedGenre) : true;
  return matchesSearch && matchesLanguage && matchesGenre;
 });

 const filteredLanguages = languages.filter(lang => (lang.name || '').toLowerCase().includes(languageSearch.toLowerCase()));
 const filteredGenres = genres.filter(g => (g.name || '').toLowerCase().includes(genreSearch.toLowerCase()));

 const executeDelete = async () => {
  try {
   if (deleteMode === 'single') {
    const response = await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
    if (response.ok) {
     setShows(prev => prev.filter(s => s._id !== deletingId));
     setIsDeleteModalOpen(false);
     showNotification('Pocket Reel Series deleted successfully');
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
       <AlertTriangle size={42} color="#ff4d4d" strokeWidth={2.5} />
      )}
      <span className="alert-text">{notification.message}</span>
     </div>
    </div>
   )}

   {/* Top Actions Row */}
   <div className="shows-top-row">
    <button className="add-btn" onClick={() => navigate('/admin/pocket-reel-series/add')}>
     <Plus size={18} />
     <span>Add Pocket Reel Series</span>
    </button>
    <button className="import-export-btn" onClick={() => setIsImportExportOpen(true)}>
     <ArrowUpDown size={16} />
     <span>Import / Export</span>
    </button>
   </div>

   {/* Controls Container (Search, Filters, Action) */}
   <div className="shows-controls">
    <div className="left-controls">
     <div className="action-dropdown-wrapper">
      <button 
       className={`action-btn ${selectedShows.length === 0 ? 'disabled' : ''}`}
       onClick={() => selectedShows.length > 0 && setIsActionMenuOpen(!isActionMenuOpen)}
       disabled={selectedShows.length === 0}
      >
       <span>Action</span>
       <ChevronDown size={14} />
      </button>

      {isActionMenuOpen && selectedShows.length > 0 && (
       <div className="action-menu">
        <div className="action-item" onClick={() => handleBulkStatusChange('Active')}>
         Set as Active
        </div>
        <div className="action-item" onClick={() => handleBulkStatusChange('Inactive')}>
         Set as Inactive
        </div>
        <div className="action-item delete" onClick={handleBulkDelete}>
         Delete
        </div>
       </div>
      )}
     </div>

     {/* Language Filter */}
     <div className="filter-dropdown-wrapper">
      <button 
       className="filter-btn"
       onClick={() => {
        setIsLanguageOpen(!isLanguageOpen);
        setIsGenreOpen(false);
       }}
      >
       <span>{selectedLanguage || 'Select Language'}</span>
       <ChevronDown size={14} />
      </button>
      
      {isLanguageOpen && (
       <div className="filter-menu">
        <div className="filter-search-box">
         <Search size={14} color="#666" />
         <input 
          type="text" 
          placeholder="Search language..." 
          value={languageSearch}
          onChange={(e) => setLanguageSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
         />
        </div>
        <div className="filter-options-list">
         <div 
          className={`filter-option ${selectedLanguage === '' ? 'selected' : ''}`}
          onClick={() => {
           setSelectedLanguage('');
           setIsLanguageOpen(false);
          }}
         >
          All Languages
         </div>
         {filteredLanguages.map(lang => (
          <div 
           key={lang._id} 
           className={`filter-option ${selectedLanguage === lang.name ? 'selected' : ''}`}
           onClick={() => {
            setSelectedLanguage(lang.name);
            setIsLanguageOpen(false);
           }}
          >
           {lang.name}
          </div>
         ))}
        </div>
       </div>
      )}
     </div>

     {/* Genre Filter */}
     <div className="filter-dropdown-wrapper">
      <button 
       className="filter-btn"
       onClick={() => {
        setIsGenreOpen(!isGenreOpen);
        setIsLanguageOpen(false);
       }}
      >
       <span>{selectedGenre || 'Select Genre'}</span>
       <ChevronDown size={14} />
      </button>
      
      {isGenreOpen && (
       <div className="filter-menu">
        <div className="filter-search-box">
         <Search size={14} color="#666" />
         <input 
          type="text" 
          placeholder="Search genre..." 
          value={genreSearch}
          onChange={(e) => setGenreSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
         />
        </div>
        <div className="filter-options-list">
         <div 
          className={`filter-option ${selectedGenre === '' ? 'selected' : ''}`}
          onClick={() => {
           setSelectedGenre('');
           setIsGenreOpen(false);
          }}
         >
          All Genres
         </div>
         {filteredGenres.map(genre => (
          <div 
           key={genre._id} 
           className={`filter-option ${selectedGenre === genre.name ? 'selected' : ''}`}
           onClick={() => {
            setSelectedGenre(genre.name);
            setIsGenreOpen(false);
           }}
          >
           {genre.name}
          </div>
         ))}
        </div>
       </div>
      )}
     </div>
    </div>

    <div className="search-box">
     <Search size={18} color="#666" className="search-icon" />
     <input 
      type="text" 
      placeholder="Search pocket reel series..." 
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
     />
    </div>
   </div>

   {/* Table Content */}
   <div className="shows-table-container">
    <table className="shows-table">
     <thead>
      <tr>
       <th className="th-checkbox">
        <input 
         type="checkbox" 
         onChange={handleSelectAll}
         checked={shows.length > 0 && selectedShows.length === shows.length}
        />
       </th>
       <th>Image</th>
       <th>Pocket Reel Series Title</th>
       <th>Series Access</th>
       <th>Episodes</th>
       <th>Status</th>
       <th>Actions</th>
      </tr>
     </thead>
     <tbody>
      {loading ? (
       <tr>
        <td colSpan="7" className="td-center">
         <Loader size="small" />
        </td>
       </tr>
      ) : filteredShows.length === 0 ? (
       <tr>
        <td colSpan="7" className="td-center empty-msg">
         No Pocket Reel Series found
        </td>
       </tr>
      ) : (
       filteredShows.map(show => (
        <tr key={show._id}>
         <td className="td-checkbox">
          <input 
           type="checkbox" 
           checked={selectedShows.includes(show._id)}
           onChange={() => handleSelectShow(show._id)}
          />
         </td>
         <td className="td-img">
          {show.thumbnail ? (
           <img 
            src={formatImageUrl(show.thumbnail)} 
            alt={show.title} 
            className="show-thumbnail" 
           />
          ) : (
           <div className="no-img">No Img</div>
          )}
         </td>
         <td className="td-title">{show.title}</td>
         <td>
          <span className={`badge-access ${(show.seriesAccess || 'Paid').toLowerCase()}`}>
           {show.seriesAccess || 'Paid'}
          </span>
         </td>
         <td>
          <button 
           className="icon-text-btn blue" 
           onClick={() => navigate(`/admin/pocket-reel-series/episodes?show=${show._id}`)}
           title="Manage Episodes"
          >
           <List size={16} />
           <span>Episodes</span>
          </button>
         </td>
         <td>
          <button 
           className={`status-btn ${show.status === 'Active' ? 'active' : 'inactive'}`}
           onClick={() => toggleStatus(show)}
          >
           {show.status || 'Active'}
          </button>
         </td>
         <td className="td-actions">
          <button className="circle-icon edit" onClick={() => navigate(`/admin/pocket-reel-series/edit/${show._id}`)}>
           <Edit size={16} />
          </button>
          <button className="circle-icon delete" onClick={() => confirmDelete(show._id)}>
           <X size={16} />
          </button>
         </td>
        </tr>
       ))
      )}
     </tbody>
    </table>
   </div>

   {/* Delete Modal */}
   {isDeleteModalOpen && (
    <div className="modal-overlay">
     <div className="modal-container">
      <div className="modal-icon-wrapper">
       <AlertTriangle size={36} color="#ff4d4d" />
      </div>
      <h2 className="modal-title">Delete Confirmation</h2>
      <p className="modal-desc">
       {deleteMode === 'single' 
        ? 'Are you sure you want to delete this Pocket Reel Series?' 
        : `Are you sure you want to delete ${selectedShows.length} selected Pocket Reel Series?`}
      </p>
      <div className="modal-actions">
       <button className="modal-btn cancel" onClick={() => setIsDeleteModalOpen(false)}>
        Cancel
       </button>
       <button className="modal-btn delete" onClick={executeDelete}>
        Delete
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Import / Export Modal */}
   <ImportExportModal 
    isOpen={isImportExportOpen}
    onClose={() => setIsImportExportOpen(false)}
    contentType="pocket-reel-series"
    onSuccess={() => {
     fetchShows();
     showNotification('Import completed successfully');
    }}
   />

   <style dangerouslySetInnerHTML={{ __html: `
    .shows-page { background: #060709; min-height: 100vh; padding: 24px 32px; color: #fff; animation: fadeIn 0.3s ease; box-sizing: border-box; }
    .shows-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; }
    .add-btn { display: flex; align-items: center; gap: 8px; background: #b3d332; color: #000; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(179,211,50,0.2); }
    .add-btn:hover { background: #c5ea38; transform: translateY(-1px); }
    .import-export-btn { display: flex; align-items: center; gap: 8px; background: #151821; border: 1px solid #232836; color: #cbd5e1; padding: 10px 18px; border-radius: 6px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.2s; }
    .import-export-btn:hover { background: #1c2230; color: #fff; border-color: #b3d332; }

    .shows-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 15px; flex-wrap: wrap; }
    .left-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    
    .action-dropdown-wrapper, .filter-dropdown-wrapper { position: relative; }
    .action-btn, .filter-btn { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #151821; border: 1px solid #232836; color: #fff; padding: 9px 14px; border-radius: 6px; font-size: 0.86rem; font-weight: 600; cursor: pointer; min-width: 140px; }
    .action-btn.disabled { opacity: 0.5; cursor: not-allowed; }
    
    .action-menu, .filter-menu { position: absolute; top: calc(100% + 6px); left: 0; background: #151821; border: 1px solid #232836; border-radius: 6px; padding: 6px; z-index: 50; min-width: 180px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .action-item { padding: 8px 12px; color: #ccc; font-size: 0.85rem; border-radius: 4px; cursor: pointer; }
    .action-item:hover { background: #232836; color: #fff; }
    .action-item.delete { color: #ff4d4d; }
    .action-item.delete:hover { background: rgba(255, 77, 77, 0.1); }
    
    .filter-search-box { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #0c0e14; border: 1px solid #232836; border-radius: 4px; margin-bottom: 6px; }
    .filter-search-box input { background: transparent; border: none; color: #fff; font-size: 0.82rem; outline: none; width: 100%; }
    .filter-options-list { max-height: 200px; overflow-y: auto; }
    .filter-option { padding: 8px 12px; color: #ccc; font-size: 0.85rem; border-radius: 4px; cursor: pointer; }
    .filter-option:hover { background: #232836; color: #fff; }
    .filter-option.selected { color: #b3d332; font-weight: 700; }

    .search-box { display: flex; align-items: center; gap: 10px; background: #151821; border: 1px solid #232836; border-radius: 6px; padding: 8px 14px; width: 300px; }
    .search-box input { background: transparent; border: none; color: #fff; font-size: 0.86rem; outline: none; width: 100%; }

    .shows-table-container { background: #11141b; border: 1px solid #1f2533; border-radius: 8px; overflow-x: auto; }
    .shows-table { width: 100%; border-collapse: collapse; text-align: left; }
    .shows-table th { padding: 14px 18px; color: #8895a5; font-size: 0.78rem; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #1f2533; letter-spacing: 0.5px; }
    .shows-table td { padding: 14px 18px; border-bottom: 1px solid #181d29; color: #cbd5e1; font-size: 0.88rem; vertical-align: middle; }
    .shows-table tr:last-child td { border-bottom: none; }
    .shows-table tr:hover td { background: rgba(255,255,255,0.015); }

    .th-checkbox, .td-checkbox { width: 40px; text-align: center; }
    .shows-table input[type="checkbox"] { width: 16px; height: 16px; accent-color: #b3d332; cursor: pointer; }
    
    .td-img { width: 80px; }
    .show-thumbnail { width: 55px; height: 75px; object-fit: cover; border-radius: 4px; border: 1px solid #283244; }
    .no-img { width: 55px; height: 75px; background: #181f2c; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #64748b; border: 1px solid #283244; }

    .td-title { font-weight: 700; color: #fff; font-size: 0.92rem; }

    .badge-access { font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
    .badge-access.free { background: rgba(0, 200, 83, 0.1); color: #00c853; border: 1px solid rgba(0, 200, 83, 0.2); }
    .badge-access.paid { background: rgba(255, 179, 0, 0.1); color: #ffb300; border: 1px solid rgba(255, 179, 0, 0.2); }

    .icon-text-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid; border-radius: 4px; padding: 5px 10px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: 0.2s; background: transparent; }
    .icon-text-btn.blue { border-color: rgba(56, 189, 248, 0.3); color: #38bdf8; background: rgba(56, 189, 248, 0.08); }
    .icon-text-btn.blue:hover { background: rgba(56, 189, 248, 0.18); border-color: #38bdf8; }

    .status-btn { border: none; padding: 5px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: 0.2s; letter-spacing: 0.5px; }
    .status-btn.active { background: #00c853; color: #000; }
    .status-btn.inactive { background: #ff4d4d; color: #fff; }

    .td-actions { display: flex; align-items: center; gap: 8px; }
    .circle-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid; cursor: pointer; transition: 0.2s; background: transparent; }
    .circle-icon.edit { border-color: #2a3447; color: #cbd5e1; }
    .circle-icon.edit:hover { background: #b3d332; color: #000; border-color: #b3d332; }
    .circle-icon.delete { border-color: #2a3447; color: #ff4d4d; }
    .circle-icon.delete:hover { background: #ff4d4d; color: #fff; border-color: #ff4d4d; }

    .td-center { text-align: center; padding: 30px !important; }
    .empty-msg { color: #64748b; font-weight: 600; }

    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #11141b; border-radius: 12px; padding: 20px 40px; z-index: 9999; box-shadow: 0 20px 50px rgba(0,0,0,0.8); border: 1px solid rgba(179, 211, 50, 0.3); animation: fadeIn 0.2s ease; }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .alert-text { color: #fff; font-size: 1.05rem; font-weight: 800; text-align: center; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease; }
    .modal-container { background: #11141b; border: 1px solid #232836; border-radius: 12px; padding: 28px; width: 100%; max-width: 420px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    .modal-icon-wrapper { margin-bottom: 16px; }
    .modal-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 8px; }
    .modal-desc { font-size: 0.88rem; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
    .modal-actions { display: flex; gap: 12px; }
    .modal-btn { flex: 1; padding: 10px; border-radius: 6px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.2s; border: none; }
    .modal-btn.cancel { background: #1f2533; color: #cbd5e1; }
    .modal-btn.cancel:hover { background: #2a3346; color: #fff; }
    .modal-btn.delete { background: #ff4d4d; color: #fff; }
    .modal-btn.delete:hover { background: #ff3333; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 768px) {
     .shows-page { padding: 16px; }
     .shows-top-row { flex-direction: column; align-items: stretch; }
     .shows-controls { flex-direction: column; align-items: stretch; }
     .search-box { width: 100%; }
    }
   ` }} />
  </div>
 );
};

export default PocketReelSeries;
