import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle,
  Plus,
  Trash2,
  Upload,
  Clock,
  ExternalLink,
  Film,
  Sparkles,
  Info
} from 'lucide-react';
import Loader from '../components/Loader';
import { uploadToCloudinary } from '../utils/upload';
import { useToast } from '../context/ToastContext';

const API_URL = '/api/player-ads';

const PlayerAds = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlotIndex, setUploadingSlotIndex] = useState(null);
  
  const [formData, setFormData] = useState({
    defaultAds: 'Built-in Advertisement',
    sourceType: 'URL',
    sourceUrl: 'https://cdn.theplayer.com/demos/ads/vast/vast.xml',
    builtInAds: [
      {
        title: 'Pre-roll Ad',
        source: '',
        timestart: '00:00:03',
        targetLink: '#',
        skipAfter: 5
      }
    ]
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        let adsList = [];
        if (Array.isArray(data.builtInAds) && data.builtInAds.length > 0) {
          adsList = data.builtInAds;
        } else {
          // Fallback legacy slots
          if (data.ad1Source || data.ad1Timestart) {
            adsList.push({
              title: 'Ad 1',
              source: data.ad1Source || '',
              timestart: data.ad1Timestart || '00:00:10',
              targetLink: data.ad1TargetLink || '#',
              skipAfter: 5
            });
          }
          if (data.ad2Source) {
            adsList.push({
              title: 'Ad 2',
              source: data.ad2Source || '',
              timestart: data.ad2Timestart || '00:30:00',
              targetLink: data.ad2TargetLink || '#',
              skipAfter: 5
            });
          }
          if (data.ad3Source) {
            adsList.push({
              title: 'Ad 3',
              source: data.ad3Source || '',
              timestart: data.ad3Timestart || '01:30:00',
              targetLink: data.ad3TargetLink || '#',
              skipAfter: 5
            });
          }
          if (adsList.length === 0) {
            adsList = [{
              title: 'Ad 1',
              source: '',
              timestart: '00:00:03',
              targetLink: '#',
              skipAfter: 5
            }];
          }
        }

        setFormData({
          defaultAds: data.defaultAds || 'Built-in Advertisement',
          sourceType: data.sourceType || 'URL',
          sourceUrl: data.sourceUrl || '',
          builtInAds: adsList
        });
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
      showNotification('Failed to load player ads settings', 'error');
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSlotChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.builtInAds];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, builtInAds: updated };
    });
  };

  const handleAddSlot = () => {
    const nextNum = formData.builtInAds.length + 1;
    // Suggest timestart: 10s for 1st, 15m for 2nd, 30m for 3rd, etc.
    let defaultTime = '00:00:10';
    if (nextNum === 2) defaultTime = '00:15:00';
    else if (nextNum === 3) defaultTime = '00:30:00';
    else if (nextNum === 4) defaultTime = '00:45:00';
    else defaultTime = `01:${String((nextNum - 5) * 15).padStart(2, '0')}:00`;

    const newSlot = {
      title: `Ad ${nextNum}`,
      source: '',
      timestart: defaultTime,
      targetLink: '#',
      skipAfter: 5
    };

    setFormData(prev => ({
      ...prev,
      builtInAds: [...prev.builtInAds, newSlot]
    }));
    showNotification(`New Ad slot #${nextNum} added!`);
  };

  const handleRemoveSlot = (index) => {
    if (formData.builtInAds.length <= 1) {
      showNotification('You must keep at least one ad slot', 'error');
      return;
    }
    setFormData(prev => ({
      ...prev,
      builtInAds: prev.builtInAds.filter((_, i) => i !== index)
    }));
    showNotification('Ad slot removed');
  };

  const handleFileChange = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingSlotIndex(index);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        handleSlotChange(index, 'source', url);
        showNotification(`Ad #${index + 1} video/image uploaded successfully!`);
      } else {
        showNotification('Failed to upload file', 'error');
      }
    } catch (err) {
      console.error('Error uploading ad file:', err);
      showNotification('Upload failed. Please try again.', 'error');
    } finally {
      setUploadingSlotIndex(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showNotification('Player ads settings saved successfully');
      } else {
        showNotification('Error saving ads settings', 'error');
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
    <div className="player-ads-page">
      <div className="player-ads-header-row">
        <div>
          <h1 className="page-main-title">Video Player Advertisement Settings</h1>
          <p className="page-main-desc">
            Configure pre-roll, mid-roll, and custom timestamp video/image ads that automatically play inside the web player.
          </p>
        </div>
        <div className="header-badges-row">
          <span className="badge-ad-count">{formData.builtInAds.length} Active Slots</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ads-form-v">
        
        {/* Top Dropdown Card */}
        <div className="ads-card-section">
          <div className="form-row-full-v">
            <label>Default Ad Engine</label>
            <div className="input-with-hint-v">
              <select name="defaultAds" value={formData.defaultAds} onChange={handleChange} className="custom-select-v">
                <option value="None (No Ads)">None (No Ads)</option>
                <option value="Built-in Advertisement">Built-in Advertisement (Multiple Custom Ads)</option>
                <option value="VAST, VMAP and IMA">VAST, VMAP and IMA (Third-party VAST Tags)</option>
              </select>
              <p className="hint-text-v">Select which advertising system powers the web video player.</p>
            </div>
          </div>
        </div>

        {/* VAST Section */}
        {formData.defaultAds === 'VAST, VMAP and IMA' && (
          <div className="ads-card-section">
            <div className="section-head-v">
              <Film size={18} className="text-lime" />
              <h2>VAST, VMAP and IMA / DFP Advertising</h2>
            </div>
            <p className="section-desc-v">
              Support inline linear (pre-roll, mid-roll, post-roll, pods) and nonlinear ads via external VAST XML or Google IMA tag URLs.
            </p>

            <div className="form-row-full-v mt-15">
              <label>Source Type</label>
              <select name="sourceType" value={formData.sourceType} onChange={handleChange} className="custom-select-v">
                <option value="URL">URL</option>
                <option value="Raw Code">Raw XML Code</option>
              </select>
            </div>

            <div className="form-row-full-v">
              <label>Source URL / Tag</label>
              <input 
                type="text" 
                name="sourceUrl" 
                value={formData.sourceUrl} 
                onChange={handleChange} 
                placeholder="https://cdn.theplayer.com/demos/ads/vast/vast.xml"
                className="custom-input-v"
              />
            </div>
          </div>
        )}

        {/* Built-in Multiple Ads Section */}
        <div className="ads-card-section">
          <div className="section-head-v flex-between">
            <div className="head-left-group">
              <Sparkles size={18} className="text-lime" />
              <h2>Built-in Advertisement Slots ({formData.builtInAds.length})</h2>
            </div>
            <button 
              type="button" 
              className="btn-add-slot-top"
              onClick={handleAddSlot}
            >
              <Plus size={15} /> Add Ad Slot
            </button>
          </div>

          <div className="note-box-v mb-20">
            <Info size={16} />
            <span><strong>Note:</strong> Built-in ads run natively inside the HTML5 web player at their exact designated start timestamps.</span>
          </div>

          <div className="help-texts-v mb-25">
            <p><strong>Source:</strong> Direct video link (mp4/hls m3u8), image banner, or uploaded file via the upload button.</p>
            <p><strong>Timestart:</strong> Format <code>HH:MM:SS</code> (e.g. <code>00:00:03</code> for pre-roll, <code>00:15:00</code> for mid-roll at 15m).</p>
            <p><strong>Target Link:</strong> Destination URL when the user clicks the advertisement.</p>
          </div>

          {/* Dynamic Ad Slots List */}
          <div className="ad-slots-container">
            {formData.builtInAds.map((slot, index) => (
              <div key={index} className="ad-slot-card">
                <div className="slot-card-header">
                  <div className="slot-title-badge">
                    <span className="slot-num-pill">Slot #{index + 1}</span>
                    <input 
                      type="text"
                      className="slot-name-input"
                      value={slot.title || `Ad ${index + 1}`}
                      onChange={(e) => handleSlotChange(index, 'title', e.target.value)}
                      placeholder={`Ad ${index + 1} Name`}
                    />
                  </div>

                  {formData.builtInAds.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-slot"
                      onClick={() => handleRemoveSlot(index)}
                      title="Remove this ad slot"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="slot-fields-body">
                  {/* Source Field */}
                  <div className="form-row-full-v">
                    <label>Ad Source URL</label>
                    <div className="ad-source-input-group-v">
                      <input 
                        type="text" 
                        value={slot.source || ''} 
                        onChange={(e) => handleSlotChange(index, 'source', e.target.value)} 
                        placeholder="Paste MP4/M3U8/Image URL or upload a file"
                        className="custom-input-v"
                      />
                      <button
                        type="button"
                        className="ad-upload-btn-v"
                        onClick={() => document.getElementById(`slotFile_${index}`).click()}
                        disabled={uploadingSlotIndex === index}
                      >
                        <Upload size={15} />
                        <span>{uploadingSlotIndex === index ? 'Uploading...' : 'Upload File'}</span>
                      </button>
                      <input
                        type="file"
                        id={`slotFile_${index}`}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(index, e)}
                        accept="video/*,image/*"
                      />
                    </div>
                  </div>

                  {/* Timestart Field */}
                  <div className="form-row-full-v">
                    <label>Timestart (HH:MM:SS)</label>
                    <div className="timestart-input-wrap">
                      <Clock size={16} className="input-icon-v" />
                      <input 
                        type="text" 
                        value={slot.timestart || '00:00:10'} 
                        onChange={(e) => handleSlotChange(index, 'timestart', e.target.value)}
                        placeholder="00:00:10"
                        className="custom-input-v time-input"
                      />
                      <span className="timestart-hint">
                        {slot.timestart === '00:00:00' || slot.timestart === '00:00:01' || slot.timestart === '00:00:03' 
                          ? '● Pre-roll Ad' 
                          : '● Mid-roll Ad'}
                      </span>
                    </div>
                  </div>

                  {/* Target Link Field */}
                  <div className="form-row-full-v">
                    <label>Click Destination URL</label>
                    <div className="target-link-wrap">
                      <ExternalLink size={16} className="input-icon-v" />
                      <input 
                        type="text" 
                        value={slot.targetLink || ''} 
                        onChange={(e) => handleSlotChange(index, 'targetLink', e.target.value)} 
                        placeholder="https://example.com/promotion"
                        className="custom-input-v"
                      />
                    </div>
                  </div>

                  {/* Skip Timer */}
                  <div className="form-row-full-v">
                    <label>Skip Button Delay</label>
                    <div className="skip-input-wrap">
                      <input 
                        type="number" 
                        min="0"
                        max="60"
                        value={slot.skipAfter ?? 5} 
                        onChange={(e) => handleSlotChange(index, 'skipAfter', Number(e.target.value))} 
                        className="custom-input-v skip-num-input"
                      />
                      <span className="unit-tag">seconds (0 = Skip immediately)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Another Slot Button */}
          <div className="add-slot-row">
            <button
              type="button"
              className="btn-add-slot-large"
              onClick={handleAddSlot}
            >
              <Plus size={18} /> Add Another Video Ad Slot
            </button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions-bottom-v">
          <button type="submit" className="save-btn-v" disabled={saving}>
            {saving ? <Loader size="button" /> : 'Save Player Ads Settings'}
          </button>
        </div>

      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        .player-ads-page { 
          background: #060709; 
          min-height: 100vh; 
          padding: 24px 32px; 
          color: #fff; 
          animation: fadeIn 0.3s ease; 
          box-sizing: border-box; 
          width: 100%; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .loading-container-v { 
          background: #060709; 
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: #b3d332; 
        }

        .text-lime { color: #b3d332; }

        .player-ads-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #161922;
          padding-bottom: 18px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .page-main-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .page-main-desc {
          color: #7b889b;
          font-size: 0.86rem;
          margin: 6px 0 0 0;
        }
        .badge-ad-count {
          background: rgba(179, 211, 50, 0.12);
          border: 1px solid rgba(179, 211, 50, 0.28);
          color: #b3d332;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
        }
        
        .ads-form-v { 
          max-width: 920px; 
          width: 100%; 
          box-sizing: border-box; 
        }

        .ads-card-section {
          background: #0d0f14;
          border: 1px solid #1a1e28;
          border-radius: 12px;
          padding: 22px;
          margin-bottom: 24px;
        }

        .section-head-v {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #1a202c;
        }
        .section-head-v.flex-between {
          justify-content: space-between;
        }
        .head-left-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-head-v h2 {
          font-size: 1rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .section-desc-v { 
          color: #8895a5; 
          font-size: 0.84rem; 
          line-height: 1.5; 
          margin-bottom: 16px; 
        }

        .btn-add-slot-top {
          background: #161a24;
          border: 1px solid #283244;
          color: #b3d332;
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
        }
        .btn-add-slot-top:hover {
          background: #202634;
          border-color: #b3d332;
        }
        
        .form-row-full-v { 
          display: flex; 
          align-items: center; 
          margin-bottom: 14px; 
          width: 100%; 
          box-sizing: border-box; 
        }
        .form-row-full-v label { 
          width: 200px; 
          font-weight: 600; 
          color: #8895a5; 
          font-size: 0.85rem; 
          flex-shrink: 0; 
        }
        
        .input-with-hint-v { flex: 1; width: 100%; box-sizing: border-box; }
        .hint-text-v { font-size: 0.75rem; color: #64748b; margin-top: 5px; }

        .custom-input-v, 
        .custom-select-v { 
          flex: 1;
          width: 100%;
          min-width: 0;
          background: #14171f; 
          border: 1px solid #262c38; 
          padding: 10px 14px; 
          border-radius: 6px; 
          color: #fff; 
          outline: none; 
          font-size: 0.88rem; 
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .custom-input-v:focus, 
        .custom-select-v:focus { 
          border-color: #b3d332; 
          background: #181c26; 
        }

        .mt-15 { margin-top: 15px; }
        .mb-20 { margin-bottom: 20px; }
        .mb-25 { margin-bottom: 25px; }
        
        .note-box-v { 
          background: rgba(179, 211, 50, 0.08); 
          border: 1px solid rgba(179, 211, 50, 0.2); 
          padding: 10px 14px; 
          border-radius: 6px; 
          display: flex;
          align-items: center;
          gap: 10px;
          color: #b3d332;
        }
        .note-box-v span { 
          font-size: 0.82rem; 
          color: #cbd5e1; 
        }
        .note-box-v strong { color: #b3d332; }
        
        .ad-source-input-group-v { 
          display: flex; 
          flex: 1; 
          gap: 8px; 
          align-items: center; 
          width: 100%; 
          box-sizing: border-box; 
        }
        .ad-upload-btn-v { 
          background: #b3d332; 
          color: #000; 
          border: none; 
          padding: 10px 16px; 
          border-radius: 6px; 
          font-weight: 800; 
          font-size: 0.82rem; 
          cursor: pointer; 
          transition: all 0.2s ease; 
          white-space: nowrap; 
          flex-shrink: 0; 
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ad-upload-btn-v:hover { background: #c5ea38; }
        .ad-upload-btn-v:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .help-texts-v p { 
          font-size: 0.8rem; 
          color: #7b889b; 
          margin: 0 0 5px 0; 
          line-height: 1.4; 
        }
        .help-texts-v strong { 
          color: #cbd5e1; 
          margin-right: 4px; 
          text-transform: uppercase; 
          font-size: 0.74rem; 
        }

        .ad-slots-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .ad-slot-card {
          background: #11141b;
          border: 1px solid #202634;
          border-left: 3px solid #b3d332;
          border-radius: 10px;
          padding: 18px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .ad-slot-card:hover {
          border-color: #2e374a;
          border-left-color: #b3d332;
        }

        .slot-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #1c2230;
        }
        .slot-title-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .slot-num-pill {
          background: #b3d332;
          color: #000;
          font-size: 0.74rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .slot-name-input {
          background: transparent;
          border: 1px dashed transparent;
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 3px 8px;
          border-radius: 4px;
          outline: none;
          max-width: 250px;
          transition: border-color 0.2s;
        }
        .slot-name-input:focus {
          border-color: #b3d332;
          background: #161a22;
        }

        .btn-remove-slot {
          background: #1c212a;
          border: 1px solid #2c3444;
          color: #8895a5;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-remove-slot:hover {
          background: rgba(255, 77, 77, 0.15);
          border-color: #ff4d4d;
          color: #ff4d4d;
        }

        .slot-fields-body {
          display: flex;
          flex-direction: column;
        }

        .timestart-input-wrap,
        .target-link-wrap,
        .skip-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          position: relative;
        }
        .input-icon-v {
          color: #64748b;
          flex-shrink: 0;
        }
        .time-input {
          max-width: 140px;
          font-family: 'Fira Code', 'Courier New', monospace;
          letter-spacing: 1px;
        }
        .timestart-hint {
          font-size: 0.78rem;
          font-weight: 700;
          color: #b3d332;
          background: rgba(179, 211, 50, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid rgba(179, 211, 50, 0.2);
        }

        .skip-num-input {
          max-width: 90px;
        }
        .unit-tag {
          font-size: 0.78rem;
          color: #7b889b;
        }

        .add-slot-row {
          margin-top: 18px;
          display: flex;
        }
        .btn-add-slot-large {
          width: 100%;
          background: #141720;
          border: 1px dashed #2d3648;
          color: #b3d332;
          padding: 12px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.88rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-add-slot-large:hover {
          background: #1c2230;
          border-color: #b3d332;
        }

        .form-actions-bottom-v { 
          display: flex; 
          justify-content: flex-start; 
          margin-top: 10px; 
          padding-bottom: 40px; 
          width: 100%; 
          box-sizing: border-box; 
        }
        .save-btn-v { 
          background: #b3d332; 
          color: #000; 
          border: none; 
          padding: 12px 36px; 
          border-radius: 8px; 
          font-weight: 800; 
          font-size: 0.92rem; 
          cursor: pointer; 
          transition: all 0.2s; 
          box-shadow: 0 4px 14px rgba(179, 211, 50, 0.25);
        }
        .save-btn-v:hover { 
          background: #c5ea38; 
          transform: translateY(-1px); 
        }

        /* Notification */
        .custom-alert-box-v { 
          position: fixed; 
          top: 30px; 
          left: 50%; 
          transform: translateX(-50%); 
          background: #11141b; 
          border-radius: 12px; 
          padding: 24px 45px; 
          z-index: 9999; 
          box-shadow: 0 20px 50px rgba(0,0,0,0.8); 
          border: 1px solid rgba(179, 211, 50, 0.3); 
          animation: fadeIn 0.2s ease;
        }
        .alert-content-v { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 12px; 
        }
        .alert-text-v { 
          color: #fff; 
          font-size: 1.1rem; 
          font-weight: 800; 
          text-align: center; 
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 768px) {
          .player-ads-page { padding: 16px 14px 50px 14px; }
          .player-ads-header-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .form-row-full-v { flex-direction: column; align-items: flex-start; gap: 6px; margin-bottom: 14px; }
          .form-row-full-v label { width: 100%; font-size: 0.84rem; }
          .form-row-full-v input, .form-row-full-v select, .input-with-hint-v { width: 100%; }
          .ad-source-input-group-v { flex-direction: column; align-items: stretch; gap: 8px; }
          .ad-upload-btn-v { width: 100%; justify-content: center; }
          .timestart-input-wrap, .target-link-wrap, .skip-input-wrap { width: 100%; }
          .time-input { max-width: 100%; }
          .form-actions-bottom-v { width: 100%; }
          .save-btn-v { width: 100%; padding: 14px; }
        }
      ` }} />
    </div>
  );
};

export default PlayerAds;
