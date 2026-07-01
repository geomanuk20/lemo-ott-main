import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, X, Search, ChevronDown, CheckCircle2, AlertTriangle, PlayCircle, Eye, ThumbsUp, HelpCircle, Upload } from 'lucide-react';
import Loader from '../components/Loader';
import ImportExportModal from '../components/ImportExportModal';

const API_URL = '/api/shorts';

const Shorts = () => {
  const navigate = useNavigate();
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [selectedAccess, setSelectedAccess] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Bulk selection states
  const [selectedShorts, setSelectedShorts] = useState([]);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const [notification, setNotification] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteMode, setDeleteMode] = useState('single'); // 'single' or 'bulk'
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const fetchShorts = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setShorts(data);
      }
    } catch (err) {
      console.error('Error fetching shorts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  // Filter shorts
  const filteredShorts = shorts.filter(short => {
    const matchesSearch = short.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccess = selectedAccess ? short.access === selectedAccess : true;
    const matchesStatus = selectedStatus ? short.status === selectedStatus : true;
    return matchesSearch && matchesAccess && matchesStatus;
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleStatus = async (shortItem) => {
    try {
      const newStatus = shortItem.status === 'Active' ? 'Inactive' : 'Active';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${shortItem._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setShorts(prev => prev.map(s => s._id === shortItem._id ? { ...s, status: newStatus } : s));
        showNotification('Short status updated successfully');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedShorts(filteredShorts.map(s => s._id));
    } else {
      setSelectedShorts([]);
    }
  };

  const handleSelectShort = (id) => {
    setSelectedShorts(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedShorts.length === 0) {
      showNotification('Please select at least one short', 'error');
      setIsActionMenuOpen(false);
      return;
    }
    
    setIsActionMenuOpen(false);
    
    if (action === 'delete') {
      setDeleteMode('bulk');
      setIsDeleteModalOpen(true);
    } else if (action === 'active' || action === 'inactive') {
      const newStatus = action === 'active' ? 'Active' : 'Inactive';
      try {
        const token = localStorage.getItem('token');
        await Promise.all(selectedShorts.map(id => 
          fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
          })
        ));
        setShorts(prev => prev.map(s => selectedShorts.includes(s._id) ? { ...s, status: newStatus } : s));
        setSelectedShorts([]);
        showNotification(`Selected shorts set to ${newStatus}`);
      } catch (err) {
        console.error(`Error updating shorts statuses:`, err);
      }
    }
  };

  const confirmDelete = (id) => {
    setDeletingId(id);
    setDeleteMode('single');
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      if (deleteMode === 'single') {
        const response = await fetch(`${API_URL}/${deletingId}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          setShorts(prev => prev.filter(s => s._id !== deletingId));
          setIsDeleteModalOpen(false);
          showNotification('Short deleted successfully');
        }
      } else if (deleteMode === 'bulk') {
        await Promise.all(selectedShorts.map(id => 
          fetch(`${API_URL}/${id}`, { 
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ));
        setShorts(prev => prev.filter(s => !selectedShorts.includes(s._id)));
        setSelectedShorts([]);
        setIsDeleteModalOpen(false);
        showNotification('Selected shorts deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting short(s):', err);
    }
  };

  return (
    <div className="shorts-page">
      {notification && (
        <div className="custom-alert-box">
          <div className="alert-content">
            <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="import-export-btn" onClick={() => setIsImportExportOpen(true)}>
            <Upload size={16} />
            <span>Import / Export</span>
          </button>
          <button className="add-btn" onClick={() => navigate('/admin/shorts/add')}>
            <Plus size={20} strokeWidth={3} />
            <span>Add Short Video</span>
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          {/* Access Filter */}
          <select 
            value={selectedAccess} 
            onChange={(e) => setSelectedAccess(e.target.value)}
            className="filter-select"
          >
            <option value="">Filter by Access</option>
            <option value="Free">Free</option>
            <option value="Paid">Paid</option>
          </select>

          {/* Status Filter */}
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">Filter by Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        
        <div className="right-controls">
          <label className="select-all">
            <input 
              type="checkbox" 
              checked={filteredShorts.length > 0 && selectedShorts.length === filteredShorts.length}
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
                <button onClick={() => handleBulkAction('active')}>Active</button>
                <button onClick={() => handleBulkAction('inactive')}>Inactive</button>
                <button className="delete-option" onClick={() => handleBulkAction('delete')}>Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <Loader size="small" inline={true} />
      ) : filteredShorts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#111', borderRadius: '12px', border: '1px solid #222' }}>
          <PlayCircle size={48} color="#b3d332" style={{ marginBottom: '15px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Shorts Found</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Create a vertical short video to get started.</p>
        </div>
      ) : (
        <div className="shorts-grid">
          {filteredShorts.map((short) => (
            <div key={short._id} className="short-card">
              <div className="thumbnail-wrapper">
                <input 
                  type="checkbox" 
                  className="item-checkbox" 
                  checked={selectedShorts.includes(short._id)}
                  onChange={() => handleSelectShort(short._id)}
                />
                <img 
                  src={short.thumbnailUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=360&q=80'} 
                  alt={short.title} 
                  className="thumbnail-img" 
                />
                <div className="short-meta-overlay">
                  <div className="meta-stat"><Eye size={12} /> {short.views || 0}</div>
                  <div className="meta-stat"><ThumbsUp size={12} /> {short.likes || 0}</div>
                </div>
              </div>
              <div className="short-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h3 className="short-title" title={short.title}>{short.title}</h3>
                  <span className={`access-badge ${short.access.toLowerCase()}`}>{short.access}</span>
                </div>
                {short.description && (
                  <p className="short-description">{short.description.replace(/<[^>]*>/g, '')}</p>
                )}
                <div className="card-controls" style={{ marginTop: '12px' }}>
                  <div className="action-icons">
                    <button className="circle-icon edit" onClick={() => navigate(`/admin/shorts/edit/${short._id}`)}><Edit size={14} /></button>
                    <button className="circle-icon delete" onClick={() => confirmDelete(short._id)}><X size={16} strokeWidth={3} /></button>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={short.status === 'Active'} 
                      onChange={() => toggleStatus(short)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="delete-modal-content">
            <div className="delete-icon-wrapper">
              <AlertTriangle size={65} color="#ff4d4d" strokeWidth={1.5} />
            </div>
            <h2>Are you sure?</h2>
            <p>{deleteMode === 'bulk' ? `You want to delete these ${selectedShorts.length} short videos?` : 'You want to delete this short video?'} This action cannot be undone.</p>
            <div className="delete-modal-footer">
              <button className="cancel-btn" onClick={() => { setIsDeleteModalOpen(false); setDeletingId(null); }}>Cancel</button>
              <button className="confirm-btn" onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <ImportExportModal 
        isOpen={isImportExportOpen} 
        onClose={() => setIsImportExportOpen(false)} 
        type="shorts" 
        onImportSuccess={fetchShorts} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .shorts-page { animation: fadeIn 0.4s ease-out; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .search-bar { position: relative; width: 380px; }
        .search-bar input { width: 100%; background: #1a1a1a; border: 1px solid #333; padding: 12px 20px 12px 48px; color: #fff; border-radius: 50px; outline: none; }
        .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #666; }
        .import-export-btn { background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 10px 18px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
        .import-export-btn:hover { background: #2a2a2a; border-color: #b3d332; color: #b3d332; }
        .add-btn { background: linear-gradient(135deg, #b3d332 0%, #00a86b 100%); color: white; border: none; padding: 10px 22px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; }
        
        .filters-bar { background: #111; padding: 15px 20px; border-radius: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #222; }
        .filter-group { display: flex; align-items: center; gap: 15px; }
        .filter-select { background: #2c2c2c; border: 1px solid #333; padding: 10px 15px; border-radius: 6px; color: #fff; outline: none; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
        
        .right-controls { display: flex; align-items: center; gap: 20px; }
        .select-all { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 0.95rem; cursor: pointer; }
        .select-all input { width: 18px; height: 18px; cursor: pointer; }
        .action-btn { background: #0088ff; color: #fff; border: none; padding: 9px 20px; border-radius: 6px; display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; }
        
        .action-dropdown-container { position: relative; }
        .action-dropdown-menu { position: absolute; top: 100%; right: 0; background: #111; border: 1px solid #333; border-radius: 8px; margin-top: 8px; min-width: 160px; z-index: 1000; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .action-dropdown-menu button { width: 100%; padding: 12px 20px; background: none; border: none; color: #fff; text-align: left; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: background 0.2s; }
        .action-dropdown-menu button:hover { background: #222; }
        .action-dropdown-menu button.delete-option { color: #ff4d4d; border-top: 1px solid #222; }
        .action-dropdown-menu button.delete-option:hover { background: rgba(255, 77, 77, 0.1); }

        /* Shorts grid aspect 9:16 */
        .shorts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
        .short-card { background: #1a1a1a; border-radius: 10px; overflow: hidden; border: 1px solid #222; display: flex; flex-direction: column; }
        .thumbnail-wrapper { position: relative; aspect-ratio: 9/16; overflow: hidden; background: #000; }
        .thumbnail-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
        .short-card:hover .thumbnail-img { transform: scale(1.05); }
        .item-checkbox { position: absolute; top: 12px; left: 12px; width: 20px; height: 20px; z-index: 10; accent-color: #b3d332; cursor: pointer; }
        
        .short-meta-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px 12px 10px; display: flex; justify-content: space-between; align-items: center; z-index: 5; }
        .meta-stat { color: #fff; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        
        .short-info { padding: 12px; flex-grow: 1; display: flex; flex-direction: column; }
        .short-title { color: #fff; font-size: 0.95rem; font-weight: 700; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1; }
        .short-description { color: #666; font-size: 0.8rem; margin: 4px 0 0 0; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; height: 32px; }
        
        .access-badge { font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
        .access-badge.free { background: rgba(0,200,83,0.1); color: #00c853; border: 1px solid rgba(0,200,83,0.2); }
        .access-badge.paid { background: rgba(179,211,50,0.1); color: #b3d332; border: 1px solid rgba(179,211,50,0.2); }

        .card-controls { display: flex; justify-content: space-between; align-items: center; }
        .action-icons { display: flex; gap: 8px; }
        .circle-icon { width: 28px; height: 28px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: transform 0.2s; }
        .circle-icon:hover { transform: scale(1.1); }
        .circle-icon.edit { background: #b3d332; }
        .circle-icon.delete { background: #ff4d4d; }
        
        .switch { position: relative; display: inline-block; width: 38px; height: 20px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 20px; }
        .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #b3d332; }
        input:checked + .slider:before { transform: translateX(18px); }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(5px); }
        .delete-modal-content { background: #1a1a1a; width: 90%; max-width: 450px; padding: 30px; border-radius: 20px; text-align: center; border: 1px solid #333; }
        .delete-icon-wrapper { margin-bottom: 20px; }
        .delete-modal-content h2 { color: #fff; margin-bottom: 10px; font-size: 1.8rem; }
        .delete-modal-content p { color: #aaa; margin-bottom: 30px; }
        .delete-modal-footer { display: flex; gap: 15px; justify-content: center; }
        .cancel-btn { background: #333; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; }
        .confirm-btn { background: #ff4d4d; color: #fff; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 600; }

        .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 20px 40px; z-index: 5000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: block; }
        .alert-content { display: flex; align-items: center; gap: 15px; }
        .alert-text { color: #fff; font-size: 1rem; font-weight: 700; text-align: center; }
        @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      ` }} />
    </div>
  );
};

export default Shorts;
