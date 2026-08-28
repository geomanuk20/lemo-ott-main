import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Upload, 
  Eye, 
  ExternalLink, 
  Sparkles,
  X,
  Code,
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import Loader from '../components/Loader';
import { uploadToCloudinary } from '../utils/upload';
import { useToast } from '../context/ToastContext';

const API_BASE = '/api/popup-ads';

const PopupAds = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingAd, setSavingAd] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    status: 'OFF',
    displayMode: 'carousel',
    carouselInterval: 4,
    carouselAutoplay: true,
    delaySeconds: 2,
    autoCloseSeconds: 0,
    showCloseButton: true,
    frequency: 'every_session',
    targetPages: 'all'
  });

  // Ads list state
  const [ads, setAds] = useState([]);

  // Modal states
  const [showAdModal, setShowAdModal] = useState(false);
  const [editingAdId, setEditingAdId] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Ad Form state
  const [adForm, setAdForm] = useState({
    title: '',
    imageUrl: '',
    targetUrl: '',
    buttonText: '',
    openInNewTab: true,
    displayType: 'image',
    customCode: '',
    status: 'ON',
    order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        } else {
          setSettings(prev => ({
            ...prev,
            status: data.status || 'OFF',
            displayMode: data.displayMode || 'carousel',
            carouselInterval: data.carouselInterval || 4,
            carouselAutoplay: data.carouselAutoplay !== undefined ? data.carouselAutoplay : true,
            delaySeconds: data.delaySeconds ?? 2,
            autoCloseSeconds: data.autoCloseSeconds ?? 0,
            showCloseButton: data.showCloseButton !== undefined ? data.showCloseButton : true,
            frequency: data.frequency || 'every_session',
            targetPages: data.targetPages || 'all'
          }));
        }
        setAds(Array.isArray(data.ads) ? data.ads : []);
      }
    } catch (err) {
      console.error('Error fetching popup ads:', err);
      showNotification('Failed to load popup ads data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    if (type === 'error') {
      toast.error(message);
    } else if (type === 'warning') {
      toast.warning(message);
    } else {
      toast.success(message);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        ...settings,
        delaySeconds: Number(settings.delaySeconds) || 0,
        autoCloseSeconds: Number(settings.autoCloseSeconds) || 0,
        carouselInterval: Number(settings.carouselInterval) || 4
      };

      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification('Master settings saved successfully!');
      } else {
        showNotification('Error saving settings', 'error');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showNotification('Something went wrong', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const openCreateModal = () => {
    setEditingAdId(null);
    setAdForm({
      title: '',
      imageUrl: '',
      targetUrl: '',
      buttonText: 'Claim Deal',
      openInNewTab: true,
      displayType: 'image',
      customCode: '',
      status: 'ON',
      order: ads.length
    });
    setShowAdModal(true);
  };

  const openEditModal = (ad) => {
    setEditingAdId(ad._id);
    setAdForm({
      title: ad.title || '',
      imageUrl: ad.imageUrl || '',
      targetUrl: ad.targetUrl || '',
      buttonText: ad.buttonText || '',
      openInNewTab: ad.openInNewTab !== undefined ? ad.openInNewTab : true,
      displayType: ad.displayType || 'image',
      customCode: ad.customCode || '',
      status: ad.status || 'ON',
      order: ad.order !== undefined ? ad.order : 0
    });
    setShowAdModal(true);
  };

  const handleAdFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAdForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        setAdForm(prev => ({ ...prev, imageUrl: url }));
        showNotification('Image uploaded successfully!');
      } else {
        showNotification('Failed to upload image', 'error');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      showNotification('Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveAd = async (e) => {
    e.preventDefault();
    if (adForm.displayType === 'image' && !adForm.imageUrl) {
      showNotification('Please upload or enter an image URL', 'error');
      return;
    }
    if (adForm.displayType === 'custom_code' && !adForm.customCode) {
      showNotification('Please enter HTML / script code', 'error');
      return;
    }

    setSavingAd(true);
    try {
      const url = editingAdId 
        ? `${API_BASE}/items/${editingAdId}` 
        : `${API_BASE}/items`;
      const method = editingAdId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adForm)
      });

      if (res.ok) {
        const savedItem = await res.json();
        if (editingAdId) {
          setAds(prev => prev.map(a => a._id === editingAdId ? savedItem : a));
          showNotification('Popup ad updated successfully!');
        } else {
          setAds(prev => [savedItem, ...prev]);
          showNotification('New popup ad created successfully!');
        }
        setShowAdModal(false);
      } else {
        showNotification('Error saving popup ad', 'error');
      }
    } catch (err) {
      console.error('Error saving ad item:', err);
      showNotification('Something went wrong', 'error');
    } finally {
      setSavingAd(false);
    }
  };

  const handleToggleAdStatus = async (ad) => {
    const newStatus = ad.status === 'ON' ? 'OFF' : 'ON';
    try {
      const res = await fetch(`${API_BASE}/items/${ad._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setAds(prev => prev.map(a => a._id === ad._id ? { ...a, status: newStatus } : a));
        showNotification(`Ad status changed to ${newStatus}`);
      } else {
        showNotification('Failed to update ad status', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showNotification('Error updating ad status', 'error');
    }
  };

  const handleDeleteAd = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/items/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setAds(prev => prev.filter(a => a._id !== id));
        showNotification('Popup ad deleted successfully');
        setDeleteConfirmId(null);
      } else {
        showNotification('Failed to delete ad', 'error');
      }
    } catch (err) {
      console.error('Error deleting ad:', err);
      showNotification('Error deleting ad', 'error');
    }
  };

  const activeAds = ads.filter(a => a.status === 'ON');

  // Preview Carousel Auto-slide timer
  useEffect(() => {
    if (!showPreviewModal || activeAds.length <= 1) return;

    if (settings.carouselAutoplay) {
      const interval = setInterval(() => {
        setPreviewActiveIndex(prev => (prev + 1) % activeAds.length);
      }, (settings.carouselInterval || 4) * 1000);
      return () => clearInterval(interval);
    }
  }, [showPreviewModal, activeAds.length, settings.carouselAutoplay, settings.carouselInterval]);

  const handleOpenPreview = () => {
    setPreviewActiveIndex(0);
    setShowPreviewModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container-v">
        <Loader size="small" />
      </div>
    );
  }

  return (
    <div className="popup-ads-admin-page">
      {/* Page Header */}
      <div className="popup-page-header">
        <div className="header-text-group">
          <div className="section-header-v">
            <Layers size={24} className="section-icon-v" />
            <h1 className="section-title-v">Popup Ads Manager</h1>
            <div className="badges-wrap">
              <span className="badge-count">{ads.length} Total</span>
              <span className="badge-active">{activeAds.length} Active</span>
            </div>
          </div>
          <p className="page-subtitle">
            Configure multiple promotional popups and banner sliders running across your website.
          </p>
        </div>

        <div className="popup-header-actions">
          <button 
            type="button" 
            className="preview-btn-v"
            onClick={handleOpenPreview}
          >
            <Eye size={16} /> Live Preview ({activeAds.length})
          </button>

          <button 
            type="button" 
            className="create-btn-v"
            onClick={openCreateModal}
          >
            <Plus size={18} /> Add New Popup Ad
          </button>
        </div>
      </div>

      <div className="content-grid-layout">
        
        {/* Left Column: Ads List */}
        <div className="ads-list-column">
          <div className="column-header-row">
            <div className="col-title-group">
              <Sparkles size={18} className="text-lime" />
              <h2>Configured Popup Ads ({ads.length})</h2>
            </div>
            <button 
              type="button" 
              className="quick-add-btn"
              onClick={openCreateModal}
            >
              <Plus size={15} /> Add Ad
            </button>
          </div>

          {ads.length === 0 ? (
            <div className="empty-ads-card">
              <div className="empty-icon-wrap">
                <ImageIcon size={48} />
              </div>
              <h3>No Popup Ads Configured</h3>
              <p>Create your first promotional popup ad to display to visitors across the frontend.</p>
              <button 
                type="button" 
                className="create-first-btn"
                onClick={openCreateModal}
              >
                <Plus size={16} /> Create First Popup Ad
              </button>
            </div>
          ) : (
            <div className="ads-cards-stack">
              {ads.map((ad, idx) => (
                <div key={ad._id || idx} className={`ad-card-item ${ad.status === 'ON' ? 'is-active' : 'is-inactive'}`}>
                  {/* Thumbnail / Type */}
                  <div className="ad-card-thumb-wrap">
                    {ad.displayType === 'image' && ad.imageUrl ? (
                      <img src={ad.imageUrl} alt={ad.title || 'Ad'} className="ad-card-img" />
                    ) : (
                      <div className="ad-code-placeholder">
                        <Code size={22} />
                        <span>HTML Script</span>
                      </div>
                    )}
                    <span className="ad-type-tag">
                      {ad.displayType === 'image' ? 'Image Banner' : 'Custom HTML'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="ad-card-info">
                    <div className="ad-card-title-row">
                      <h4>{ad.title || 'Untitled Popup Ad'}</h4>
                      <span className={`ad-status-pill ${ad.status === 'ON' ? 'status-on' : 'status-off'}`}>
                        {ad.status === 'ON' ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>

                    {ad.targetUrl && (
                      <a 
                        href={ad.targetUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="ad-target-link"
                      >
                        <ExternalLink size={12} /> <span>{ad.targetUrl}</span>
                      </a>
                    )}

                    <div className="ad-meta-tags">
                      {ad.buttonText && (
                        <span className="meta-pill">Button: {ad.buttonText}</span>
                      )}
                      <span className="meta-pill">
                        {ad.openInNewTab ? 'New Tab' : 'Same Window'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ad-card-actions">
                    <button
                      type="button"
                      className={`toggle-status-btn ${ad.status === 'ON' ? 'btn-active-on' : 'btn-active-off'}`}
                      onClick={() => handleToggleAdStatus(ad)}
                      title={ad.status === 'ON' ? 'Turn OFF' : 'Turn ON'}
                    >
                      {ad.status === 'ON' ? 'ON' : 'OFF'}
                    </button>

                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className="icon-action-btn edit-btn"
                        onClick={() => openEditModal(ad)}
                        title="Edit Ad"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        type="button"
                        className="icon-action-btn delete-btn"
                        onClick={() => setDeleteConfirmId(ad._id)}
                        title="Delete Ad"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation Overlay */}
                  {deleteConfirmId === ad._id && (
                    <div className="delete-confirm-overlay">
                      <AlertTriangle size={20} color="#ff4d4d" />
                      <span>Delete this popup ad?</span>
                      <div className="confirm-btn-row">
                        <button 
                          type="button" 
                          className="cancel-del-btn"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="do-del-btn"
                          onClick={() => handleDeleteAd(ad._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Master Global Settings */}
        <div className="settings-column">
          <form onSubmit={handleSaveSettings} className="settings-panel-form">
            <div className="settings-panel-header">
              <Sliders size={18} className="text-lime" />
              <h3>Master Popup Settings</h3>
            </div>

            {/* Master Activation */}
            <div className="setting-group">
              <label>Master System Status</label>
              <div className="status-selection-container">
                <div className="status-btn-group">
                  <button 
                    type="button" 
                    className={`status-choice-btn ${settings.status === 'ON' ? 'active-on' : ''}`}
                    onClick={() => setSettings(prev => ({ ...prev, status: 'ON' }))}
                  >
                    ON
                  </button>
                  <button 
                    type="button" 
                    className={`status-choice-btn ${settings.status === 'OFF' ? 'active-off' : ''}`}
                    onClick={() => setSettings(prev => ({ ...prev, status: 'OFF' }))}
                  >
                    OFF
                  </button>
                </div>

                <span className={`status-pill ${settings.status === 'ON' ? 'pill-on' : 'pill-off'}`}>
                  {settings.status === 'ON' ? '● Master Popups Active' : '○ Master Disabled'}
                </span>
              </div>
              <p className="setting-hint">When disabled, no popup ads will appear on the frontend website.</p>
            </div>

            {/* Multi-Ad Display Mode */}
            <div className="setting-group">
              <label>Multi-Ad Display Mode</label>
              <select 
                name="displayMode" 
                value={settings.displayMode} 
                onChange={handleSettingsChange}
                className="custom-select"
              >
                <option value="carousel">Carousel Slider (Multi-ad Carousel in 1 Popup)</option>
                <option value="rotation">Smart Rotation (Cycle ad on each session/visit)</option>
                <option value="random">Randomized (Pick random active ad per visit)</option>
              </select>
              <p className="setting-hint">
                {settings.displayMode === 'carousel' 
                  ? 'All active ads are combined into an interactive auto-sliding carousel modal.' 
                  : settings.displayMode === 'rotation'
                  ? 'Each visitor sees a different active ad sequentially on subsequent visits.'
                  : 'A random active ad is chosen dynamically on each visit.'}
              </p>
            </div>

            {/* Carousel Settings */}
            {settings.displayMode === 'carousel' && (
              <div className="sub-settings-box">
                <div className="setting-group mb-12">
                  <label>Auto-Slide Duration</label>
                  <div className="input-unit-wrap">
                    <input 
                      type="number" 
                      name="carouselInterval" 
                      min="2" 
                      max="30" 
                      value={settings.carouselInterval} 
                      onChange={handleSettingsChange} 
                    />
                    <span className="unit-tag">seconds per slide</span>
                  </div>
                </div>

                <div className="setting-group mb-0">
                  <label className="checkbox-flex-label">
                    <input 
                      type="checkbox" 
                      name="carouselAutoplay" 
                      checked={settings.carouselAutoplay} 
                      onChange={handleSettingsChange} 
                    />
                    <span>Autoplay Slide Transitions</span>
                  </label>
                </div>
              </div>
            )}

            {/* Target Pages */}
            <div className="setting-group">
              <label>Target Pages</label>
              <select 
                name="targetPages" 
                value={settings.targetPages} 
                onChange={handleSettingsChange}
                className="custom-select"
              >
                <option value="all">All Frontend Pages</option>
                <option value="home_only">Home Page Only</option>
              </select>
            </div>

            {/* Display Frequency */}
            <div className="setting-group">
              <label>Display Frequency</label>
              <select 
                name="frequency" 
                value={settings.frequency} 
                onChange={handleSettingsChange}
                className="custom-select"
              >
                <option value="every_session">Once per Browser Session (Recommended)</option>
                <option value="once_per_day">Once every 24 Hours</option>
                <option value="once">Once per Visitor (Never show again after seen)</option>
                <option value="always">Always (Show on every page visit/reload)</option>
              </select>
            </div>

            {/* Delay Before Showing */}
            <div className="setting-group">
              <label>Delay Before Showing</label>
              <div className="input-unit-wrap">
                <input 
                  type="number" 
                  name="delaySeconds" 
                  min="0" 
                  max="60" 
                  value={settings.delaySeconds} 
                  onChange={handleSettingsChange} 
                />
                <span className="unit-tag">seconds after page load</span>
              </div>
            </div>

            {/* Auto Close Timer */}
            <div className="setting-group">
              <label>Auto-Close Timer</label>
              <div className="input-unit-wrap">
                <input 
                  type="number" 
                  name="autoCloseSeconds" 
                  min="0" 
                  max="120" 
                  value={settings.autoCloseSeconds} 
                  onChange={handleSettingsChange} 
                />
                <span className="unit-tag">seconds (0 = do not auto-close)</span>
              </div>
            </div>

            {/* Show Close Button */}
            <div className="setting-group">
              <label className="checkbox-flex-label">
                <input 
                  type="checkbox" 
                  name="showCloseButton" 
                  checked={settings.showCloseButton} 
                  onChange={handleSettingsChange} 
                />
                <span>Show '✕' Close Button on Popup</span>
              </label>
            </div>

            {/* Save Button */}
            <button type="submit" className="save-settings-btn" disabled={savingSettings}>
              {savingSettings ? <Loader size="button" /> : 'Save Master Settings'}
            </button>
          </form>
        </div>

      </div>

      {/* Add / Edit Ad Modal */}
      {showAdModal && (
        <div className="modal-backdrop" onClick={() => setShowAdModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAdId ? 'Edit Popup Ad' : 'Add New Popup Ad'}</h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowAdModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="modal-form">
              <div className="modal-body">
                {/* Title */}
                <div className="form-field">
                  <label>Ad Title (Optional)</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={adForm.title} 
                    onChange={handleAdFormChange}
                    placeholder="e.g. Special Offer! 50% Off Annual Plan" 
                  />
                </div>

                {/* Display Type */}
                <div className="form-field">
                  <label>Ad Format</label>
                  <div className="format-picker">
                    <button
                      type="button"
                      className={`format-option ${adForm.displayType === 'image' ? 'active' : ''}`}
                      onClick={() => setAdForm(prev => ({ ...prev, displayType: 'image' }))}
                    >
                      <ImageIcon size={18} />
                      <span>Image Banner</span>
                    </button>
                    <button
                      type="button"
                      className={`format-option ${adForm.displayType === 'custom_code' ? 'active' : ''}`}
                      onClick={() => setAdForm(prev => ({ ...prev, displayType: 'custom_code' }))}
                    >
                      <Code size={18} />
                      <span>Custom HTML</span>
                    </button>
                  </div>
                </div>

                {/* Image Fields */}
                {adForm.displayType === 'image' ? (
                  <>
                    <div className="form-field">
                      <label>Banner Image</label>
                      <div className="image-upload-row">
                        <input 
                          type="text" 
                          name="imageUrl" 
                          value={adForm.imageUrl} 
                          onChange={handleAdFormChange}
                          placeholder="Paste image URL or upload" 
                        />
                        <button
                          type="button"
                          className="btn-upload"
                          onClick={() => document.getElementById('adFileInput').click()}
                          disabled={uploadingImage}
                        >
                          <Upload size={16} />
                          <span>{uploadingImage ? '...' : 'Upload'}</span>
                        </button>
                        <input 
                          type="file" 
                          id="adFileInput" 
                          style={{ display: 'none' }} 
                          accept="image/*" 
                          onChange={handleFileUpload} 
                        />
                      </div>

                      {adForm.imageUrl && (
                        <div className="modal-img-preview">
                          <img src={adForm.imageUrl} alt="Ad Preview" />
                          <button 
                            type="button" 
                            className="btn-remove-preview"
                            onClick={() => setAdForm(prev => ({ ...prev, imageUrl: '' }))}
                            title="Remove Image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="form-field">
                      <label>Target Destination URL</label>
                      <input 
                        type="text" 
                        name="targetUrl" 
                        value={adForm.targetUrl} 
                        onChange={handleAdFormChange}
                        placeholder="https://example.com/promo or /subscription" 
                      />
                    </div>

                    <div className="form-field">
                      <label>CTA Button Text (Optional)</label>
                      <input 
                        type="text" 
                        name="buttonText" 
                        value={adForm.buttonText} 
                        onChange={handleAdFormChange}
                        placeholder="e.g. Subscribe Now, Claim Discount" 
                      />
                    </div>

                    <div className="form-field">
                      <label className="checkbox-flex-label">
                        <input 
                          type="checkbox" 
                          name="openInNewTab" 
                          checked={adForm.openInNewTab} 
                          onChange={handleAdFormChange} 
                        />
                        <span>Open Target Link in New Tab (_blank)</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="form-field">
                    <label>HTML / Script Embed Code</label>
                    <textarea 
                      name="customCode" 
                      value={adForm.customCode} 
                      onChange={handleAdFormChange}
                      placeholder="<a href='...'><img src='...' /></a> or third-party ad tags"
                      rows={6}
                      className="code-editor-area"
                    />
                  </div>
                )}

                {/* Status Toggle */}
                <div className="form-field">
                  <label>Ad Active Status</label>
                  <div className="status-selection-container">
                    <div className="status-btn-group">
                      <button 
                        type="button" 
                        className={`status-choice-btn ${adForm.status === 'ON' ? 'active-on' : ''}`}
                        onClick={() => setAdForm(prev => ({ ...prev, status: 'ON' }))}
                      >
                        ON
                      </button>
                      <button 
                        type="button" 
                        className={`status-choice-btn ${adForm.status === 'OFF' ? 'active-off' : ''}`}
                        onClick={() => setAdForm(prev => ({ ...prev, status: 'OFF' }))}
                      >
                        OFF
                      </button>
                    </div>
                    <span className={`status-pill ${adForm.status === 'ON' ? 'pill-on' : 'pill-off'}`}>
                      {adForm.status === 'ON' ? '● Ad is Active' : '○ Ad is Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowAdModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit" 
                  disabled={savingAd}
                >
                  {savingAd ? <Loader size="button" /> : (editingAdId ? 'Save Changes' : 'Create Popup Ad')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Preview Modal (with Carousel Navigation) */}
      {showPreviewModal && (
        <div className="preview-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="preview-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="preview-topbar">
              <div className="preview-badge-row">
                <Eye size={15} />
                <span>Frontend Preview</span>
                <span className="mode-tag">{settings.displayMode.toUpperCase()}</span>
                {activeAds.length > 0 && (
                  <span className="slide-counter">
                    {previewActiveIndex + 1}/{activeAds.length}
                  </span>
                )}
              </div>
              <button 
                type="button" 
                className="close-preview-btn" 
                onClick={() => setShowPreviewModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="preview-popup-stage">
              {activeAds.length === 0 ? (
                <div className="no-active-ads-box">
                  <AlertTriangle size={36} color="#ff9800" />
                  <h4>No Active Popup Ads Found</h4>
                  <p>Turn ON at least one ad to preview how it looks on the frontend website.</p>
                </div>
              ) : (
                <div className="fe-popup-card-preview">
                  {/* Close button preview */}
                  {settings.showCloseButton && (
                    <button 
                      type="button" 
                      className="preview-close-icon"
                      onClick={() => setShowPreviewModal(false)}
                    >
                      <X size={18} />
                    </button>
                  )}

                  {/* Title */}
                  {activeAds[previewActiveIndex]?.title && (
                    <div className="preview-header">
                      <h3>{activeAds[previewActiveIndex].title}</h3>
                    </div>
                  )}

                  {/* Body Slide */}
                  <div className="preview-slide-body">
                    {activeAds[previewActiveIndex]?.displayType === 'image' ? (
                      <div className="preview-image-container">
                        {activeAds[previewActiveIndex].imageUrl ? (
                          <img 
                            src={activeAds[previewActiveIndex].imageUrl} 
                            alt={activeAds[previewActiveIndex].title || 'Ad'} 
                            className="preview-img"
                          />
                        ) : (
                          <div className="preview-placeholder">
                            <ImageIcon size={40} />
                            <p>No image specified</p>
                          </div>
                        )}

                        {activeAds[previewActiveIndex].buttonText && (
                          <div className="preview-cta-bar">
                            <button type="button" className="preview-cta-button">
                              <span>{activeAds[previewActiveIndex].buttonText}</span>
                              <ExternalLink size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div 
                        className="preview-custom-code-box"
                        dangerouslySetInnerHTML={{ __html: activeAds[previewActiveIndex]?.customCode || '<p>HTML script preview</p>' }}
                      />
                    )}
                  </div>

                  {/* Carousel Controls (if more than 1 ad) */}
                  {activeAds.length > 1 && (
                    <div className="preview-carousel-nav">
                      <button 
                        type="button" 
                        className="carousel-arrow prev-arrow"
                        onClick={() => setPreviewActiveIndex(prev => (prev - 1 + activeAds.length) % activeAds.length)}
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <div className="carousel-dots">
                        {activeAds.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`carousel-dot ${i === previewActiveIndex ? 'active' : ''}`}
                            onClick={() => setPreviewActiveIndex(i)}
                          />
                        ))}
                      </div>

                      <button 
                        type="button" 
                        className="carousel-arrow next-arrow"
                        onClick={() => setPreviewActiveIndex(prev => (prev + 1) % activeAds.length)}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scoped Modern High-End OTT Admin Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .popup-ads-admin-page {
          background: #060709;
          min-height: 100vh;
          padding: 24px 30px;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
        }

        .popup-ads-admin-page .text-lime { color: #b3d332; }

        .popup-ads-admin-page .popup-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          border-bottom: 1px solid #161922;
          padding-bottom: 18px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .popup-ads-admin-page .header-text-group {
          flex: 1;
          min-width: 260px;
        }

        .popup-ads-admin-page .section-header-v {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .popup-ads-admin-page .section-icon-v { color: #b3d332; flex-shrink: 0; }
        .popup-ads-admin-page .section-title-v {
          font-size: 1.3rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .popup-ads-admin-page .badges-wrap {
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }
        .popup-ads-admin-page .badge-count {
          background: #191c24;
          border: 1px solid #282f3d;
          color: #8895a5;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .popup-ads-admin-page .badge-active {
          background: rgba(0, 200, 83, 0.15);
          border: 1px solid rgba(0, 200, 83, 0.3);
          color: #00c853;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .popup-ads-admin-page .page-subtitle {
          color: #7b889b;
          font-size: 0.85rem;
          margin: 6px 0 0 0;
        }

        .popup-ads-admin-page .popup-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .popup-ads-admin-page .preview-btn-v {
          background: #14171f;
          border: 1px solid #262d3d;
          color: #b3d332;
          padding: 9px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.84rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .popup-ads-admin-page .preview-btn-v:hover {
          background: #1f2533;
          border-color: #b3d332;
        }

        .popup-ads-admin-page .create-btn-v {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 9px 18px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.86rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: all 0.2s;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(179, 211, 50, 0.25);
        }
        .popup-ads-admin-page .create-btn-v:hover {
          background: #c5ea38;
          box-shadow: 0 6px 18px rgba(179, 211, 50, 0.35);
        }

        /* 2-Column Grid */
        .popup-ads-admin-page .content-grid-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
        }

        /* Left Column: Ads List */
        .popup-ads-admin-page .column-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .popup-ads-admin-page .col-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .popup-ads-admin-page .col-title-group h2 {
          font-size: 1rem;
          font-weight: 800;
          color: #e2e8f0;
          margin: 0;
        }
        .popup-ads-admin-page .quick-add-btn {
          background: #161922;
          border: 1px solid #282f3d;
          color: #b3d332;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
        }
        .popup-ads-admin-page .quick-add-btn:hover {
          background: #202634;
          border-color: #b3d332;
        }

        .popup-ads-admin-page .empty-ads-card {
          background: #0d0f14;
          border: 1px dashed #282f3d;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          color: #8895a5;
        }
        .popup-ads-admin-page .empty-icon-wrap {
          color: #3b4455;
          margin-bottom: 14px;
        }
        .popup-ads-admin-page .empty-ads-card h3 {
          color: #fff;
          font-size: 1.1rem;
          margin: 0 0 6px 0;
          font-weight: 700;
        }
        .popup-ads-admin-page .empty-ads-card p {
          max-width: 380px;
          margin: 0 auto 20px auto;
          font-size: 0.85rem;
          line-height: 1.5;
        }
        .popup-ads-admin-page .create-first-btn {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 9px 20px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.86rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .popup-ads-admin-page .ads-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .popup-ads-admin-page .ad-card-item {
          position: relative;
          background: #0d0f14;
          border: 1px solid #1a1e28;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s ease;
        }
        .popup-ads-admin-page .ad-card-item:hover {
          border-color: #2b3344;
          background: #10131a;
        }
        .popup-ads-admin-page .ad-card-item.is-active {
          border-left: 3px solid #00c853;
        }
        .popup-ads-admin-page .ad-card-item.is-inactive {
          border-left: 3px solid #444;
          opacity: 0.78;
        }

        .popup-ads-admin-page .ad-card-thumb-wrap {
          position: relative;
          width: 110px;
          height: 75px;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
          border: 1px solid #202633;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .popup-ads-admin-page .ad-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .popup-ads-admin-page .ad-code-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          color: #b3d332;
          font-size: 0.65rem;
          font-weight: 700;
        }
        .popup-ads-admin-page .ad-type-tag {
          position: absolute;
          bottom: 3px;
          left: 3px;
          background: rgba(0, 0, 0, 0.78);
          font-size: 0.6rem;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 3px;
          color: #b3d332;
        }

        .popup-ads-admin-page .ad-card-info {
          flex: 1;
          min-width: 0;
        }
        .popup-ads-admin-page .ad-card-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        .popup-ads-admin-page .ad-card-title-row h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }
        .popup-ads-admin-page .ad-status-pill {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 8px;
          letter-spacing: 0.3px;
        }
        .popup-ads-admin-page .status-on {
          background: rgba(0, 200, 83, 0.15);
          color: #00c853;
          border: 1px solid rgba(0, 200, 83, 0.3);
        }
        .popup-ads-admin-page .status-off {
          background: rgba(150, 150, 150, 0.1);
          color: #888;
          border: 1px solid rgba(150, 150, 150, 0.2);
        }

        .popup-ads-admin-page .ad-target-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #8da1ba;
          font-size: 0.78rem;
          margin-bottom: 6px;
          text-decoration: none;
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .popup-ads-admin-page .ad-target-link span {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .popup-ads-admin-page .ad-target-link:hover {
          color: #b3d332;
        }

        .popup-ads-admin-page .ad-meta-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .popup-ads-admin-page .meta-pill {
          background: #161922;
          color: #8895a5;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #232a38;
        }

        .popup-ads-admin-page .ad-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .popup-ads-admin-page .action-buttons-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .popup-ads-admin-page .toggle-status-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.75rem;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .popup-ads-admin-page .btn-active-on {
          background: rgba(0, 200, 83, 0.15);
          color: #00c853;
          border: 1px solid #00c853;
        }
        .popup-ads-admin-page .btn-active-on:hover {
          background: #ff4d4d;
          color: #fff;
          border-color: #ff4d4d;
        }
        .popup-ads-admin-page .btn-active-off {
          background: #1c212a;
          color: #8895a5;
          border: 1px solid #2b3344;
        }
        .popup-ads-admin-page .btn-active-off:hover {
          background: #00c853;
          color: #000;
          border-color: #00c853;
        }

        .popup-ads-admin-page .icon-action-btn {
          width: 34px;
          height: 34px;
          border-radius: 6px;
          background: #14171f;
          border: 1px solid #232a3a;
          color: #8895a5;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .popup-ads-admin-page .edit-btn:hover {
          background: #1f2533;
          border-color: #b3d332;
          color: #b3d332;
        }
        .popup-ads-admin-page .delete-btn:hover {
          background: rgba(255, 77, 77, 0.15);
          border-color: #ff4d4d;
          color: #ff4d4d;
        }

        .popup-ads-admin-page .delete-confirm-overlay {
          position: absolute;
          inset: 0;
          background: rgba(10, 11, 15, 0.96);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          z-index: 10;
          padding: 10px;
          flex-wrap: wrap;
          text-align: center;
        }
        .popup-ads-admin-page .delete-confirm-overlay span {
          font-weight: 700;
          font-size: 0.85rem;
          color: #fff;
        }
        .popup-ads-admin-page .confirm-btn-row {
          display: flex;
          gap: 6px;
        }
        .popup-ads-admin-page .cancel-del-btn {
          background: #202634;
          color: #fff;
          border: 1px solid #2b3344;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }
        .popup-ads-admin-page .do-del-btn {
          background: #ff4d4d;
          color: #fff;
          border: none;
          padding: 5px 14px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }

        /* Right Column: Settings Panel */
        .popup-ads-admin-page .settings-panel-form {
          background: #0d0f14;
          border: 1px solid #1a1e28;
          border-radius: 12px;
          padding: 20px;
          position: sticky;
          top: 20px;
        }
        .popup-ads-admin-page .settings-panel-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 14px;
          border-bottom: 1px solid #1a1e28;
          margin-bottom: 16px;
        }
        .popup-ads-admin-page .settings-panel-header h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 800;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .popup-ads-admin-page .setting-group {
          margin-bottom: 16px;
        }
        .popup-ads-admin-page .setting-group.mb-12 { margin-bottom: 12px; }
        .popup-ads-admin-page .setting-group.mb-0 { margin-bottom: 0; }
        .popup-ads-admin-page .setting-group label {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #8fa0b5;
          margin-bottom: 6px;
        }
        .popup-ads-admin-page .setting-hint {
          font-size: 0.74rem;
          color: #616f82;
          margin: 5px 0 0 0;
          line-height: 1.4;
        }

        .popup-ads-admin-page .custom-select, 
        .popup-ads-admin-page .input-unit-wrap input {
          width: 100%;
          background: #14171f;
          border: 1px solid #262c38;
          border-radius: 6px;
          padding: 9px 12px;
          color: #fff;
          font-size: 0.85rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .popup-ads-admin-page .custom-select:focus,
        .popup-ads-admin-page .input-unit-wrap input:focus {
          border-color: #b3d332;
        }

        .popup-ads-admin-page .input-unit-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .popup-ads-admin-page .input-unit-wrap input {
          max-width: 90px;
        }
        .popup-ads-admin-page .unit-tag {
          font-size: 0.78rem;
          color: #7b889b;
        }

        .popup-ads-admin-page .sub-settings-box {
          background: #12151c;
          border: 1px solid #1e2430;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .popup-ads-admin-page .checkbox-flex-label {
          display: flex !important;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.82rem !important;
          color: #c5d1e0 !important;
          margin: 0 !important;
        }
        .popup-ads-admin-page .checkbox-flex-label input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #b3d332;
        }

        .popup-ads-admin-page .status-selection-container {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .popup-ads-admin-page .status-btn-group {
          display: flex;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #252b36;
        }
        .popup-ads-admin-page .status-choice-btn {
          background: #14171d;
          color: #8895a5;
          border: none;
          padding: 7px 16px;
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .popup-ads-admin-page .status-choice-btn.active-on {
          background: #00c853;
          color: #000;
        }
        .popup-ads-admin-page .status-choice-btn.active-off {
          background: #ff4d4d;
          color: #fff;
        }
        .popup-ads-admin-page .status-pill {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 20px;
        }
        .popup-ads-admin-page .pill-on { background: rgba(0, 200, 83, 0.15); color: #00c853; border: 1px solid rgba(0, 200, 83, 0.3); }
        .popup-ads-admin-page .pill-off { background: rgba(150, 150, 150, 0.1); color: #888; border: 1px solid rgba(150, 150, 150, 0.2); }

        .popup-ads-admin-page .save-settings-btn {
          width: 100%;
          background: #b3d332;
          color: #000;
          border: none;
          padding: 11px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }
        .popup-ads-admin-page .save-settings-btn:hover {
          background: #c5ea38;
        }

        /* Modal Styles */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 16px;
          box-sizing: border-box;
          animation: fadeIn 0.2s ease;
        }

        .modal-dialog {
          background: #0d0f14;
          border: 1px solid rgba(179, 211, 50, 0.35);
          border-radius: 14px;
          max-width: 560px;
          width: 100%;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.95), 0 0 30px rgba(179, 211, 50, 0.12);
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          position: relative;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 22px;
          background: #141720;
          border-bottom: 1px solid #202634;
          flex-shrink: 0;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
        }
        .modal-close-btn {
          background: transparent;
          border: none;
          color: #8895a5;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .modal-close-btn:hover { 
          color: #ff4d4d; 
          background: rgba(255, 77, 77, 0.15);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .modal-body {
          padding: 20px 22px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-body::-webkit-scrollbar {
          width: 6px;
        }
        .modal-body::-webkit-scrollbar-track {
          background: #0d0f14;
        }
        .modal-body::-webkit-scrollbar-thumb {
          background: #252b36;
          border-radius: 4px;
        }
        .modal-body::-webkit-scrollbar-thumb:hover {
          background: #b3d332;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-field label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #8fa0b5;
        }
        .form-field input[type="text"],
        .code-editor-area {
          background: #14171f;
          border: 1px solid #252b36;
          padding: 10px 14px;
          border-radius: 6px;
          color: #fff;
          font-size: 0.85rem;
          outline: none;
          box-sizing: border-box;
          width: 100%;
        }
        .form-field input:focus,
        .code-editor-area:focus {
          border-color: #b3d332;
        }
        .code-editor-area {
          font-family: 'Fira Code', 'Courier New', monospace;
          line-height: 1.4;
          resize: vertical;
        }

        .format-picker {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .format-option {
          background: #14171f;
          border: 1px solid #252b36;
          border-radius: 8px;
          padding: 10px;
          color: #8895a5;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .format-option.active {
          background: rgba(179, 211, 50, 0.12);
          border-color: #b3d332;
          color: #b3d332;
        }

        .image-upload-row {
          display: flex;
          gap: 8px;
        }
        .image-upload-row input { flex: 1; min-width: 0; }
        .btn-upload {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-upload:hover {
          background: #c5ea38;
        }

        .modal-img-preview {
          position: relative;
          width: fit-content;
          max-width: 100%;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #252b36;
          background: #000;
          margin-top: 4px;
        }
        .modal-img-preview img {
          max-height: 130px;
          max-width: 100%;
          display: block;
          object-fit: contain;
        }
        .btn-remove-preview {
          position: absolute;
          top: 6px;
          right: 6px;
          background: rgba(0,0,0,0.8);
          color: #ff4d4d;
          border: 1px solid rgba(255, 77, 77, 0.4);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .btn-remove-preview:hover {
          background: #ff4d4d;
          color: #fff;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 14px 22px;
          background: #12151c;
          border-top: 1px solid #1e2430;
          flex-shrink: 0;
          z-index: 10;
        }
        .btn-cancel {
          background: #202634;
          color: #fff;
          border: 1px solid #2d3648;
          padding: 9px 20px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.84rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel:hover {
          background: #2b3346;
        }
        .btn-submit {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 9px 24px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.86rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(179, 211, 50, 0.25);
        }
        .btn-submit:hover {
          background: #c5ea38;
        }

        /* Live Preview Modal Overlay */
        .preview-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 16px;
          box-sizing: border-box;
          animation: fadeIn 0.25s ease;
        }
        .preview-modal-container {
          background: #080a0d;
          border: 1px solid #202634;
          border-radius: 14px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.9);
        }
        .preview-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #10131a;
          border-bottom: 1px solid #1a202c;
          flex-shrink: 0;
        }
        .preview-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #b3d332;
          font-size: 0.82rem;
          font-weight: 700;
          flex-wrap: wrap;
        }
        .mode-tag {
          background: rgba(179, 211, 50, 0.15);
          color: #b3d332;
          font-size: 0.68rem;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(179, 211, 50, 0.3);
        }
        .slide-counter {
          color: #8895a5;
          font-size: 0.75rem;
        }
        .close-preview-btn {
          background: transparent;
          border: none;
          color: #8895a5;
          cursor: pointer;
        }
        .close-preview-btn:hover { color: #fff; }

        .preview-popup-stage {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #040507;
        }

        .fe-popup-card-preview {
          position: relative;
          background: #0d0f14;
          border: 1px solid rgba(179, 211, 50, 0.35);
          border-radius: 14px;
          width: 100%;
          max-width: 480px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.9);
        }

        .preview-close-icon {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 20;
        }

        .preview-header {
          padding: 12px 16px;
          background: #141720;
          border-bottom: 1px solid #1f2533;
          padding-right: 46px;
        }
        .preview-header h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 800;
          color: #fff;
        }

        .preview-image-container {
          position: relative;
          background: #000;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .preview-img {
          width: 100%;
          max-height: 260px;
          object-fit: contain;
          display: block;
        }

        .preview-cta-bar {
          width: 100%;
          padding: 10px 16px;
          background: #12151d;
          border-top: 1px solid #1d232f;
          display: flex;
          justify-content: flex-end;
          box-sizing: border-box;
        }
        .preview-cta-button {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 7px 16px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        }

        .preview-custom-code-box {
          padding: 16px;
          color: #fff;
        }

        .preview-carousel-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: #0a0c10;
          border-top: 1px solid #171b24;
        }
        .carousel-arrow {
          background: #161922;
          border: 1px solid #252c3b;
          color: #fff;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .carousel-arrow:hover {
          background: #b3d332;
          color: #000;
        }
        .carousel-dots {
          display: flex;
          gap: 5px;
        }
        .carousel-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #252b36;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.2s;
        }
        .carousel-dot.active {
          background: #b3d332;
          width: 18px;
          border-radius: 10px;
        }

        .no-active-ads-box {
          padding: 30px 16px;
          text-align: center;
          color: #8895a5;
        }
        .no-active-ads-box h4 {
          color: #fff;
          margin: 10px 0 4px 0;
        }

        /* Responsive Mobile Breakpoints */
        @media (max-width: 992px) {
          .popup-ads-admin-page .content-grid-layout {
            grid-template-columns: 1fr;
          }
          .popup-ads-admin-page .settings-panel-form {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .popup-ads-admin-page {
            padding: 16px 14px;
          }
          .popup-ads-admin-page .popup-page-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .popup-ads-admin-page .popup-header-actions {
            width: 100%;
          }
          .popup-ads-admin-page .preview-btn-v, 
          .popup-ads-admin-page .create-btn-v {
            flex: 1;
            justify-content: center;
          }
          .popup-ads-admin-page .ad-card-item {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .popup-ads-admin-page .ad-card-thumb-wrap {
            width: 100%;
            height: 140px;
          }
          .popup-ads-admin-page .ad-card-title-row h4 {
            max-width: 100%;
          }
          .popup-ads-admin-page .ad-card-actions {
            justify-content: space-between;
            border-top: 1px solid #1c212c;
            padding-top: 10px;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .modal-dialog {
            max-height: 94vh;
          }
          .modal-header {
            padding: 12px 16px;
          }
          .modal-body {
            padding: 14px 16px;
            gap: 12px;
          }
          .modal-footer {
            padding: 12px 16px;
            flex-direction: column-reverse;
            gap: 8px;
          }
          .btn-cancel, .btn-submit {
            width: 100%;
            text-align: center;
            padding: 10px;
          }
          .format-picker {
            grid-template-columns: 1fr;
          }
          .image-upload-row {
            flex-direction: column;
          }
          .btn-upload {
            width: 100%;
            justify-content: center;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.92) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      ` }} />
    </div>
  );
};

export default PopupAds;
