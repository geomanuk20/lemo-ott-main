import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Upload, 
  Eye, 
  ExternalLink, 
  Clock, 
  RefreshCw, 
  Sparkles,
  X,
  Code,
  Image as ImageIcon,
  Monitor
} from 'lucide-react';
import Loader from '../components/Loader';
import { uploadToCloudinary } from '../utils/upload';

const API_URL = '/api/popup-ads';

const PopupAds = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [formData, setFormData] = useState({
    status: 'OFF',
    title: '',
    imageUrl: '',
    targetUrl: '',
    openInNewTab: true,
    displayType: 'image',
    customCode: '',
    delaySeconds: 2,
    autoCloseSeconds: 0,
    showCloseButton: true,
    frequency: 'every_session',
    targetPages: 'all',
    buttonText: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          ...data,
          openInNewTab: data.openInNewTab !== undefined ? data.openInNewTab : true,
          showCloseButton: data.showCloseButton !== undefined ? data.showCloseButton : true
        }));
      }
    } catch (err) {
      console.error('Error fetching popup ads settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
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
        setFormData(prev => ({ ...prev, imageUrl: url }));
        showNotification('Popup ad image uploaded successfully!');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const saveData = {
        ...formData,
        delaySeconds: Number(formData.delaySeconds) || 0,
        autoCloseSeconds: Number(formData.autoCloseSeconds) || 0
      };

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });

      if (response.ok) {
        showNotification('Popup ads settings saved successfully');
      } else {
        showNotification('Error saving settings', 'error');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showNotification('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
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
      {notification && (
        <div className="custom-alert-box-v">
          <div className="alert-content-v">
            {notification.type === 'success' ? (
              <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
            ) : (
              <XCircle size={42} color="#ff4d4d" strokeWidth={2.5} />
            )}
            <span className="alert-text-v">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header-row">
        <div>
          <div className="section-header-v">
            <Layers size={22} className="section-icon-v" />
            <h1 className="section-title-v">Frontend Popup Ads Settings</h1>
          </div>
          <p className="page-subtitle">
            Configure promotional popups, banners, and alert modals shown to visitors across the frontend website.
          </p>
        </div>

        <div className="header-actions">
          <button 
            type="button" 
            className="preview-btn-v"
            onClick={() => setShowPreviewModal(true)}
          >
            <Eye size={16} /> Live Preview
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-form-v">
        <div className="form-content-v">

          {/* Master Status Card */}
          <div className="settings-card">
            <div className="card-header">
              <Sparkles size={18} className="card-icon" />
              <h3>Master Activation</h3>
            </div>
            
            <div className="form-row-full-v">
              <label>Ad Status (ON / OFF)</label>
              <div className="status-selection-container">
                <div className="status-btn-group">
                  <button 
                    type="button" 
                    className={`status-choice-btn ${formData.status === 'ON' ? 'active-on' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, status: 'ON' }))}
                  >
                    ON
                  </button>
                  <button 
                    type="button" 
                    className={`status-choice-btn ${formData.status === 'OFF' ? 'active-off' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, status: 'OFF' }))}
                  >
                    OFF
                  </button>
                </div>

                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  className={formData.status === 'ON' ? 'status-select-on' : 'status-select-off'}
                  style={{ maxWidth: '140px' }}
                >
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                </select>

                <span className={`status-pill ${formData.status === 'ON' ? 'pill-on' : 'pill-off'}`}>
                  {formData.status === 'ON' ? '● Popup is Enabled' : '○ Popup is Disabled'}
                </span>
              </div>
            </div>

            <div className="form-row-full-v">
              <label>Display Format</label>
              <select name="displayType" value={formData.displayType} onChange={handleChange}>
                <option value="image">Image Banner & Click Link</option>
                <option value="custom_code">Custom HTML / Script Embed</option>
              </select>
            </div>

            <div className="form-row-full-v">
              <label>Popup Title (Optional)</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="e.g. Special Offer! 50% Off Premium Pass"
              />
            </div>
          </div>

          {/* Image & Link Settings */}
          {formData.displayType === 'image' && (
            <div className="settings-card">
              <div className="card-header">
                <ImageIcon size={18} className="card-icon" />
                <h3>Image Banner & Destination</h3>
              </div>

              <div className="form-row-full-v align-start-v">
                <label className="mt-8-v">Banner Image</label>
                <div className="upload-input-group">
                  <div className="url-input-wrapper">
                    <input 
                      type="text" 
                      name="imageUrl" 
                      value={formData.imageUrl} 
                      onChange={handleChange} 
                      placeholder="Paste Image URL or upload a file below"
                    />
                    <button
                      type="button"
                      className="upload-trigger-btn"
                      onClick={() => document.getElementById('popupImageFile').click()}
                      disabled={uploadingImage}
                    >
                      <Upload size={16} />
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </button>
                    <input 
                      type="file" 
                      id="popupImageFile" 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                      onChange={handleFileUpload}
                    />
                  </div>

                  {formData.imageUrl && (
                    <div className="image-preview-box">
                      <img src={formData.imageUrl} alt="Popup Ad Preview" />
                      <button 
                        type="button" 
                        className="remove-img-btn"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        title="Remove Image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row-full-v">
                <label>Target Destination URL</label>
                <input 
                  type="text" 
                  name="targetUrl" 
                  value={formData.targetUrl} 
                  onChange={handleChange} 
                  placeholder="https://example.com/promo or /subscription"
                />
              </div>

              <div className="form-row-full-v">
                <label>CTA Button Text (Optional)</label>
                <input 
                  type="text" 
                  name="buttonText" 
                  value={formData.buttonText} 
                  onChange={handleChange} 
                  placeholder="e.g. Subscribe Now, Claim Deal (or leave blank)"
                />
              </div>

              <div className="form-row-full-v">
                <label>Open Link In New Tab</label>
                <div className="toggle-field-wrapper">
                  <label className="custom-switch-label">
                    <input 
                      type="checkbox" 
                      name="openInNewTab" 
                      checked={formData.openInNewTab} 
                      onChange={handleChange} 
                    />
                    <span className="custom-switch-slider"></span>
                  </label>
                  <span className="toggle-text-hint">
                    {formData.openInNewTab ? 'Open in a new tab (_blank)' : 'Open in the same tab'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Custom HTML / Embed Code Settings */}
          {formData.displayType === 'custom_code' && (
            <div className="settings-card">
              <div className="card-header">
                <Code size={18} className="card-icon" />
                <h3>Custom Code / Embed Script</h3>
              </div>

              <div className="form-row-full-v align-start-v">
                <label className="mt-8-v">HTML / Embed Code</label>
                <textarea 
                  name="customCode" 
                  value={formData.customCode} 
                  onChange={handleChange}
                  placeholder="<a href='https://...' target='_blank'><img src='...' /></a> or third-party ad tags"
                  rows={6}
                  spellCheck="false"
                  className="code-textarea"
                />
              </div>
            </div>
          )}

          {/* Display Timing & Rules */}
          <div className="settings-card">
            <div className="card-header">
              <Clock size={18} className="card-icon" />
              <h3>Timing & Display Rules</h3>
            </div>

            <div className="form-row-full-v">
              <label>Target Pages</label>
              <select name="targetPages" value={formData.targetPages} onChange={handleChange}>
                <option value="all">All Frontend Pages</option>
                <option value="home_only">Home Page Only</option>
              </select>
            </div>

            <div className="form-row-full-v">
              <label>Display Frequency</label>
              <select name="frequency" value={formData.frequency} onChange={handleChange}>
                <option value="every_session">Once per Browser Session (Recommended)</option>
                <option value="once_per_day">Once every 24 Hours</option>
                <option value="once">Once per Visitor (Never show again after seen)</option>
                <option value="always">Always (Show on every page visit/reload)</option>
              </select>
            </div>

            <div className="form-row-full-v">
              <label>Delay Before Showing</label>
              <div className="input-unit-wrap">
                <input 
                  type="number" 
                  name="delaySeconds" 
                  min="0" 
                  max="60" 
                  value={formData.delaySeconds} 
                  onChange={handleChange} 
                />
                <span className="unit-tag">seconds</span>
              </div>
            </div>

            <div className="form-row-full-v">
              <label>Auto-Close Timer</label>
              <div className="input-unit-wrap">
                <input 
                  type="number" 
                  name="autoCloseSeconds" 
                  min="0" 
                  max="120" 
                  value={formData.autoCloseSeconds} 
                  onChange={handleChange} 
                />
                <span className="unit-tag">seconds (0 = Do not auto-close)</span>
              </div>
            </div>

            <div className="form-row-full-v">
              <label>Show Close ('✕') Button</label>
              <div className="toggle-field-wrapper">
                <label className="custom-switch-label">
                  <input 
                    type="checkbox" 
                    name="showCloseButton" 
                    checked={formData.showCloseButton} 
                    onChange={handleChange} 
                  />
                  <span className="custom-switch-slider"></span>
                </label>
                <span className="toggle-text-hint">
                  {formData.showCloseButton ? 'Visible top-right close icon' : 'Hidden close button'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="form-actions-left-v">
            <button type="submit" className="save-btn-v" disabled={saving}>
              {saving ? <Loader size="small" inline={true} /> : 'Save Settings'}
            </button>

            <button 
              type="button" 
              className="test-btn-v"
              onClick={() => setShowPreviewModal(true)}
            >
              <Eye size={16} /> Test Preview
            </button>
          </div>

        </div>
      </form>

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div className="preview-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="preview-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <span>Modal Preview Mode</span>
              <button 
                type="button" 
                className="close-preview-btn" 
                onClick={() => setShowPreviewModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="preview-modal-body">
              <div className="ad-popup-container">
                {formData.showCloseButton && (
                  <button 
                    type="button" 
                    className="ad-popup-close-btn" 
                    onClick={() => setShowPreviewModal(false)}
                  >
                    <X size={20} />
                  </button>
                )}

                {formData.title && (
                  <div className="ad-popup-title">
                    {formData.title}
                  </div>
                )}

                {formData.displayType === 'image' ? (
                  <div className="ad-popup-content-box">
                    {formData.imageUrl ? (
                      <a 
                        href={formData.targetUrl || '#'} 
                        target={formData.openInNewTab ? '_blank' : '_self'}
                        rel="noreferrer"
                        className="ad-popup-image-link"
                      >
                        <img 
                          src={formData.imageUrl} 
                          alt={formData.title || 'Advertisement'} 
                          className="ad-popup-img"
                        />
                      </a>
                    ) : (
                      <div className="ad-placeholder-box">
                        <ImageIcon size={48} color="#444" />
                        <p>No image uploaded yet. Enter an image URL or upload a banner above.</p>
                      </div>
                    )}

                    {formData.buttonText && (
                      <div className="ad-popup-cta-row">
                        <a 
                          href={formData.targetUrl || '#'} 
                          target={formData.openInNewTab ? '_blank' : '_self'}
                          rel="noreferrer"
                          className="ad-popup-cta-btn"
                        >
                          {formData.buttonText} <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="ad-popup-custom-html" 
                    dangerouslySetInnerHTML={{ __html: formData.customCode || '<p style="color:#aaa;padding:20px;text-align:center;">No custom HTML code provided yet.</p>' }} 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .popup-ads-admin-page { 
          background: #000; 
          min-height: 100vh; 
          padding: 30px 45px; 
          color: #fff; 
          animation: fadeIn 0.3s ease; 
        }
        .loading-container-v { 
          background: #000; 
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: #b3d332; 
        }

        .page-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 25px;
          border-bottom: 1px solid #1a1e26;
          padding-bottom: 20px;
        }

        .section-header-v { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
        }
        .section-icon-v { color: #b3d332; }
        .section-title-v { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; }
        .page-subtitle { color: #8895a5; font-size: 0.85rem; margin: 6px 0 0 0; }

        .header-actions { display: flex; gap: 12px; }
        .preview-btn-v, .test-btn-v {
          background: #191c23;
          border: 1px solid #282f3d;
          color: #b3d332;
          padding: 9px 18px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .preview-btn-v:hover, .test-btn-v:hover {
          background: #232833;
          border-color: #b3d332;
        }

        .form-content-v { max-width: 950px; }

        .settings-card {
          background: #0f1115;
          border: 1px solid #1c212a;
          border-radius: 10px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid #171b22;
          padding-bottom: 12px;
        }
        .card-icon { color: #b3d332; }
        .card-header h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-row-full-v { 
          display: flex; 
          align-items: center; 
          margin-bottom: 16px; 
        }
        .form-row-full-v.align-start-v { align-items: flex-start; }
        .form-row-full-v label { 
          width: 220px; 
          font-weight: 600; 
          color: #8895a5; 
          font-size: 0.86rem; 
          flex-shrink: 0; 
        }
        .mt-8-v { margin-top: 8px; }

        .form-row-full-v input[type="text"], 
        .form-row-full-v input[type="number"], 
        .form-row-full-v select, 
        .code-textarea {
          flex: 1;
          background: #14171d;
          border: 1px solid #252b36;
          padding: 10px 14px;
          border-radius: 6px;
          color: #fff;
          outline: none;
          font-size: 0.88rem;
          transition: border-color 0.2s;
        }
        .form-row-full-v input:focus, 
        .form-row-full-v select:focus, 
        .code-textarea:focus {
          border-color: #b3d332;
          background: #181c24;
        }

        .status-selection-container {
          display: flex;
          align-items: center;
          gap: 15px;
          flex: 1;
          flex-wrap: wrap;
        }
        .status-btn-group {
          display: flex;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #252b36;
        }
        .status-choice-btn {
          background: #14171d;
          color: #8895a5;
          border: none;
          padding: 8px 20px;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .status-choice-btn.active-on {
          background: #00c853;
          color: #000;
          box-shadow: 0 0 10px rgba(0, 200, 83, 0.4);
        }
        .status-choice-btn.active-off {
          background: #ff4d4d;
          color: #fff;
          box-shadow: 0 0 10px rgba(255, 77, 77, 0.4);
        }
        .status-choice-btn:hover:not(.active-on):not(.active-off) {
          background: #1e232d;
          color: #fff;
        }
        .status-select-on { border-color: #00c853 !important; }
        .status-select-off { border-color: #444 !important; }
        .status-pill {
          font-size: 0.78rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 20px;
          white-space: nowrap;
        }
        .pill-on { background: rgba(0, 200, 83, 0.15); color: #00c853; border: 1px solid rgba(0, 200, 83, 0.3); }
        .pill-off { background: rgba(150, 150, 150, 0.1); color: #888; border: 1px solid rgba(150, 150, 150, 0.2); }

        .upload-input-group { flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .url-input-wrapper { display: flex; gap: 10px; }
        .upload-trigger-btn {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 9px 18px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .upload-trigger-btn:hover { background: #9ebf24; }
        .upload-trigger-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .image-preview-box {
          position: relative;
          width: fit-content;
          max-width: 380px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #282f3d;
          background: #0a0b0d;
        }
        .image-preview-box img {
          display: block;
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
        }
        .remove-img-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          background: rgba(0, 0, 0, 0.75);
          color: #ff4d4d;
          border: 1px solid rgba(255, 77, 77, 0.3);
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .remove-img-btn:hover { background: #ff4d4d; color: #fff; }

        .code-textarea {
          font-family: 'Fira Code', 'Courier New', monospace;
          line-height: 1.5;
          resize: vertical;
        }

        .input-unit-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .input-unit-wrap input { max-width: 120px; }
        .unit-tag { color: #8895a5; font-size: 0.82rem; }

        .toggle-field-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .custom-switch-label {
          position: relative !important;
          display: inline-block !important;
          width: 48px !important;
          min-width: 48px !important;
          max-width: 48px !important;
          height: 24px !important;
          flex-shrink: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          cursor: pointer !important;
        }
        .custom-switch-label input {
          opacity: 0;
          width: 0;
          height: 0;
          margin: 0;
          position: absolute;
        }
        .custom-switch-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #252b36;
          transition: 0.3s;
          border-radius: 24px;
        }
        .custom-switch-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        .custom-switch-label input:checked + .custom-switch-slider {
          background-color: #b3d332;
        }
        .custom-switch-label input:checked + .custom-switch-slider:before {
          transform: translateX(24px);
          background-color: #000;
        }
        .toggle-text-hint {
          font-size: 0.85rem;
          color: #8895a5;
        }

        .form-actions-left-v {
          display: flex;
          gap: 15px;
          margin-top: 30px;
          padding-bottom: 50px;
        }
        .save-btn-v {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 12px 34px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .save-btn-v:hover { background: #9ebf24; transform: translateY(-1px); }
        .save-btn-v:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Notification */
        .custom-alert-box-v {
          position: fixed;
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
          background: #111;
          border-radius: 12px;
          padding: 25px 50px;
          z-index: 99999;
          box-shadow: 0 20px 50px rgba(0,0,0,0.8);
          border: 1px solid #333;
        }
        .alert-content-v { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .alert-text-v { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }

        /* Preview Modal */
        .preview-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
        }
        .preview-modal-wrapper {
          background: #12151c;
          border: 1px solid #282f3d;
          border-radius: 16px;
          width: 90%;
          max-width: 580px;
          overflow: hidden;
          box-shadow: 0 30px 70px rgba(0,0,0,0.9);
          animation: scaleUp 0.25s ease;
        }
        .preview-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #0d0f14;
          border-bottom: 1px solid #1a1e27;
          font-size: 0.82rem;
          font-weight: 700;
          color: #8895a5;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .close-preview-btn {
          background: none;
          border: none;
          color: #8895a5;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .close-preview-btn:hover { color: #fff; }

        .preview-modal-body {
          padding: 25px;
          display: flex;
          justify-content: center;
          background: #08090c;
        }

        .ad-popup-container {
          position: relative;
          background: #14171f;
          border: 1px solid #2a313e;
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
          box-shadow: 0 15px 35px rgba(0,0,0,0.6);
        }
        .ad-popup-close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s;
        }
        .ad-popup-close-btn:hover { background: #ff4d4d; border-color: #ff4d4d; }

        .ad-popup-title {
          padding: 15px 20px;
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
          border-bottom: 1px solid #1c212a;
          background: #11141b;
        }
        .ad-popup-content-box { display: flex; flex-direction: column; }
        .ad-popup-image-link { display: block; overflow: hidden; }
        .ad-popup-img { width: 100%; height: auto; max-height: 75vh; object-fit: contain; display: block; transition: transform 0.3s; }
        .ad-popup-img:hover { transform: scale(1.015); }

        .ad-placeholder-box {
          padding: 50px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #666;
        }
        .ad-placeholder-box p { font-size: 0.85rem; margin: 0; }

        .ad-popup-cta-row {
          padding: 14px 20px;
          background: #11141b;
          border-top: 1px solid #1c212a;
          display: flex;
          justify-content: flex-end;
        }
        .ad-popup-cta-btn {
          background: #b3d332;
          color: #000;
          text-decoration: none;
          padding: 9px 20px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ad-popup-cta-btn:hover { background: #9ebf24; }

        .ad-popup-custom-html { padding: 15px; color: #fff; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        @media (max-width: 768px) {
          .popup-ads-admin-page { padding: 20px 15px 60px 15px; }
          .page-header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .header-actions { width: 100%; }
          .preview-btn-v { width: 100%; justify-content: center; }
          .form-row-full-v { flex-direction: column; align-items: flex-start; gap: 6px; }
          .form-row-full-v label { width: 100%; }
          .url-input-wrapper { flex-direction: column; }
          .upload-trigger-btn { width: 100%; justify-content: center; }
          .select-with-badge { flex-direction: column; align-items: flex-start; width: 100%; }
          .form-actions-left-v { flex-direction: column; }
          .save-btn-v, .test-btn-v { width: 100%; text-align: center; justify-content: center; }
        }
      ` }} />
    </div>
  );
};

export default PopupAds;
