import React, { useState, useEffect, useRef } from 'react';
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
  Info,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  AlertCircle,
  Repeat
} from 'lucide-react';
import Loader from '../components/Loader';
import { uploadToCloudinary } from '../utils/upload';
import { useToast } from '../context/ToastContext';

const API_URL = '/api/player-ads';

const loadHls = () => {
  return new Promise((resolve, reject) => {
    if (window.Hls) {
      resolve(window.Hls);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.onload = () => resolve(window.Hls);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const AdPreviewPlayer = ({ source, targetLink, skipAfter = 5, title, timestart, repeatMode = 'timestamps', repeatInterval = 0 }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [countdown, setCountdown] = useState(skipAfter);
  const [canSkip, setCanSkip] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(source || '');
  const isHls = (source || '').toLowerCase().includes('.m3u8');

  useEffect(() => {
    if (!source || isImage) return;

    let isDestroyed = false;
    setError(null);
    const video = videoRef.current;
    if (!video) return;

    if (isHls) {
      loadHls().then(Hls => {
        if (isDestroyed || !video) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().then(() => setIsPlaying(true)).catch(() => {
              video.muted = true;
              setIsMuted(true);
              video.play().then(() => setIsPlaying(true)).catch(e => console.log('Autoplay muted:', e));
            });
          });
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              setError('Failed to load HLS video stream.');
            }
          });
          hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
          setError('HLS playback is not supported.');
        }
      }).catch(() => {
        setError('Failed to load streaming library.');
      });
    } else {
      video.src = source;
      video.play().then(() => setIsPlaying(true)).catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => setIsPlaying(true)).catch(e => console.log('Autoplay muted:', e));
      });
    }

    return () => {
      isDestroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [source, isHls, isImage]);

  useEffect(() => {
    const delay = Math.max(0, Number(skipAfter) || 0);
    setCountdown(delay);
    if (delay === 0) {
      setCanSkip(true);
      return;
    }
    setCanSkip(false);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [skipAfter, source]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const restartAd = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    const delay = Math.max(0, Number(skipAfter) || 0);
    setCountdown(delay);
    setCanSkip(delay === 0);
  };

  const formatTime = (secs) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const parsedTimes = String(timestart || '00:00:10').split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

  return (
    <div className="ad-preview-player-box">
      <div className="ad-preview-header">
        <div className="ad-preview-tag-group">
          <span className="ad-live-pill">LIVE AD PREVIEW</span>
          <span className="ad-type-pill">{isImage ? 'IMAGE BANNER' : isHls ? 'HLS VIDEO' : 'MP4 VIDEO'}</span>
          <span className="ad-timing-pill">
            {repeatMode === 'interval'
              ? `Repeats every ${repeatInterval || 5} min (Starts: ${parsedTimes[0] || '00:00:10'})`
              : parsedTimes.length > 1
                ? `Plays ${parsedTimes.length} Times: ${parsedTimes.join(', ')}`
                : `Starts at: ${timestart || '00:00:10'}`}
          </span>
        </div>
        {targetLink && targetLink !== '#' && (
          <a href={targetLink} target="_blank" rel="noreferrer" className="ad-preview-target-btn">
            <span>Visit Link</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="ad-preview-media-stage">
        {isImage ? (
          <div className="ad-preview-image-wrapper">
            <img src={source} alt={title || 'Ad'} className="ad-preview-image" />
          </div>
        ) : (
          <video 
            ref={videoRef}
            className="ad-preview-video"
            playsInline
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
        )}

        <div className="ad-preview-overlay">
          <div className="ad-badge-corner">
            <span className="ad-badge-text">Ad</span>
            <span className="ad-badge-title">{title || 'Advertisement'}</span>
          </div>
          <div className="ad-skip-corner">
            {canSkip ? (
              <button type="button" className="ad-skip-btn-active" onClick={restartAd}>
                <span>Skip Ad</span>
                <span className="skip-arrow">➔</span>
              </button>
            ) : (
              <div className="ad-skip-countdown">
                <span>Skip ad in <strong>{countdown}s</strong></span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="ad-preview-error-overlay">
            <AlertCircle size={24} color="#ff4d4d" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {!isImage && (
        <div className="ad-preview-controls-bar">
          <div className="controls-left">
            <button type="button" className="control-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button type="button" className="control-btn" onClick={restartAd}>
              <RotateCcw size={14} />
            </button>
            <button type="button" className="control-btn" onClick={toggleMute}>
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <span className="ad-time-text">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <div className="controls-right">
            <span className="sim-label">In-Stream Preview</span>
          </div>
        </div>
      )}
    </div>
  );
};

const AVAILABLE_CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: '✨' },
  { id: 'Pocket Reel Series', label: 'Pocket Reel Series', icon: '📱' },
  { id: 'Short Web Series', label: 'Web Series', icon: '🎬' },
  { id: 'Movie', label: 'Movies', icon: '🎥' },
  { id: 'TV Show', label: 'TV Shows', icon: '📺' },
  { id: 'Short Film', label: 'Short Films', icon: '🎞️' },
  { id: 'Live TV', label: 'Live TV / Sports', icon: '📡' },
];

const PlayerAds = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlotIndex, setUploadingSlotIndex] = useState(null);
  const [previewingSlots, setPreviewingSlots] = useState({});
  
  const [formData, setFormData] = useState({
    defaultAds: 'Built-in Advertisement',
    sourceType: 'URL',
    sourceUrl: 'https://cdn.theplayer.com/demos/ads/vast/vast.xml',
    builtInAds: [
      { title: 'Pre-roll Ad', source: '', timestart: '00:00:03', repeatMode: 'timestamps', repeatInterval: 0, targetLink: '#', skipAfter: 5, categories: ['all'] }
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
          adsList = data.builtInAds.map(ad => ({
            ...ad,
            repeatMode: ad.repeatMode || 'timestamps',
            repeatInterval: Number(ad.repeatInterval) || 0,
            categories: Array.isArray(ad.categories) && ad.categories.length > 0 ? ad.categories : ['all']
          }));
        } else {
          adsList = [{ title: 'Ad 1', source: '', timestart: '00:00:03', repeatMode: 'timestamps', repeatInterval: 0, targetLink: '#', skipAfter: 5, categories: ['all'] }];
        }

        setFormData({
          defaultAds: data.defaultAds || 'Built-in Advertisement',
          sourceType: data.sourceType || 'URL',
          sourceUrl: data.sourceUrl || '',
          builtInAds: adsList
        });

        const initialPreviews = {};
        adsList.forEach((slot, idx) => {
          if (slot.source) initialPreviews[idx] = true;
        });
        setPreviewingSlots(initialPreviews);
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
      showNotification('Failed to load player ads settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    if (type === 'error') toast.error(message);
    else if (type === 'warning') toast.warning(message);
    else toast.success(message);
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

  const handleToggleSlotCategory = (index, categoryId) => {
    setFormData(prev => {
      const updated = [...prev.builtInAds];
      const slot = updated[index];
      let currentCats = Array.isArray(slot.categories) ? [...slot.categories] : ['all'];

      if (categoryId === 'all') {
        currentCats = ['all'];
      } else {
        currentCats = currentCats.filter(c => c !== 'all');
        if (currentCats.includes(categoryId)) {
          currentCats = currentCats.filter(c => c !== categoryId);
          if (currentCats.length === 0) {
            currentCats = ['all'];
          }
        } else {
          currentCats.push(categoryId);
        }
      }

      updated[index] = { ...slot, categories: currentCats };
      return { ...prev, builtInAds: updated };
    });
  };

  const parseTimestamps = (timeStr) => {
    if (!timeStr) return [];
    return String(timeStr)
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
  };

  const handleAddTimeToSlot = (index, newTime) => {
    const slot = formData.builtInAds[index];
    const currentTimes = parseTimestamps(slot?.timestart);
    if (!currentTimes.includes(newTime)) {
      const updated = [...currentTimes, newTime].join(', ');
      handleSlotChange(index, 'timestart', updated);
      showNotification(`Added ${newTime} to Slot #${index + 1} schedule.`);
    }
  };

  const handleRemoveTimeFromSlot = (index, timeToRemove) => {
    const slot = formData.builtInAds[index];
    const currentTimes = parseTimestamps(slot?.timestart);
    const filtered = currentTimes.filter(t => t !== timeToRemove);
    handleSlotChange(index, 'timestart', filtered.length > 0 ? filtered.join(', ') : '00:00:10');
  };

  const toggleSlotPreview = (index) => {
    setPreviewingSlots(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleAddSlot = () => {
    const nextNum = formData.builtInAds.length + 1;
    let defaultTime = '00:00:10';
    if (nextNum === 1) defaultTime = '00:00:03';
    else if (nextNum === 2) defaultTime = '00:15:00';
    else if (nextNum === 3) defaultTime = '00:30:00';
    else if (nextNum === 4) defaultTime = '00:45:00';
    else defaultTime = `01:${String((nextNum - 5) * 15).padStart(2, '0')}:00`;

    const newSlot = {
      title: `Ad ${nextNum}`,
      source: '',
      timestart: defaultTime,
      repeatMode: 'timestamps',
      repeatInterval: 0,
      targetLink: '#',
      skipAfter: 5,
      categories: ['all']
    };

    setFormData(prev => ({
      ...prev,
      builtInAds: [...prev.builtInAds, newSlot]
    }));
    showNotification(`New Ad slot #${nextNum} added!`);
  };

  const handleRemoveSlot = (index) => {
    const targetSlot = formData.builtInAds[index];
    const slotLabel = targetSlot?.title || `Slot #${index + 1}`;

    if (formData.builtInAds.length === 1) {
      setFormData(prev => ({
        ...prev,
        builtInAds: [{ title: 'Ad 1', source: '', timestart: '00:00:03', targetLink: '#', skipAfter: 5 }]
      }));
      setPreviewingSlots({});
      showNotification(`${slotLabel} cleared and reset.`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      builtInAds: prev.builtInAds.filter((_, i) => i !== index)
    }));

    setPreviewingSlots(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });

    showNotification(`${slotLabel} deleted.`);
  };

  const handleFileChange = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingSlotIndex(index);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        handleSlotChange(index, 'source', url);
        setPreviewingSlots(prev => ({ ...prev, [index]: true }));
        showNotification(`Ad #${index + 1} uploaded! Live preview active.`);
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
      if (response.ok) showNotification('Player ads settings saved successfully');
      else showNotification('Error saving ads settings', 'error');
    } catch (err) {
      console.error('Error saving settings:', err);
      showNotification('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-container-v"><Loader size="small" /></div>;
  }

  return (
    <div className="player-ads-page">
      <div className="player-ads-header-row">
        <div>
          <h1 className="page-main-title">Video Player Advertisement Settings</h1>
          <p className="page-main-desc">Configure native video ads inside the player.</p>
        </div>
        <div className="header-badges-row">
          <span className="badge-ad-count">{formData.builtInAds.length} Active Slots</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ads-form-v">
        {/* Engine Selector Card */}
        <div className="ads-card-section">
          <div className="form-row-full-v">
            <label>Default Ad Engine</label>
            <div className="input-with-hint-v">
              <select 
                name="defaultAds" 
                value={formData.defaultAds} 
                onChange={handleChange} 
                className={`custom-select-v ${formData.defaultAds === 'None (No Ads)' ? 'select-warning' : 'select-active'}`}
              >
                <option value="Built-in Advertisement">Built-in Advertisement (Custom Videos / In-Stream Ads)</option>
                <option value="VAST, VMAP and IMA">VAST, VMAP and IMA (Third-Party Feed Tags)</option>
                <option value="None (No Ads)">None (No Ads - Disable All Player Ads)</option>
              </select>
              <p className="hint-text-v">
                {formData.defaultAds === 'Built-in Advertisement' && '✅ Built-in video ads are ACTIVE on the frontend video player.'}
                {formData.defaultAds === 'VAST, VMAP and IMA' && '✅ VAST/IMA XML tags are ACTIVE on the frontend video player.'}
                {formData.defaultAds === 'None (No Ads)' && '⚠️ Ads are currently DISABLED on the frontend player.'}
              </p>
            </div>
          </div>

          {/* Quick Activation Notice if set to None */}
          {formData.defaultAds === 'None (No Ads)' && (
            <div className="ads-disabled-banner-v">
              <AlertCircle size={18} color="#facc15" />
              <div className="banner-text-wrap">
                <strong>Player Ads are Currently Inactive!</strong>
                <span>You have configured video ad slots below, but they will not appear on the frontend until the engine is set to Built-in Advertisement.</span>
              </div>
              <button 
                type="button" 
                className="btn-activate-engine"
                onClick={() => {
                  setFormData(prev => ({ ...prev, defaultAds: 'Built-in Advertisement' }));
                  showNotification('Default Ad Engine switched to Built-in Advertisement! Click Save Settings to apply.');
                }}
              >
                Activate Built-in Ads
              </button>
            </div>
          )}
        </div>

        {formData.defaultAds === 'VAST, VMAP and IMA' && (
          <div className="ads-card-section">
            <div className="section-head-v">
              <Film size={18} className="text-lime" />
              <h2>VAST, VMAP and IMA</h2>
            </div>
            <div className="form-row-full-v">
              <label>Source Type</label>
              <select name="sourceType" value={formData.sourceType} onChange={handleChange} className="custom-select-v">
                <option value="URL">URL Feed Tag</option>
                <option value="Raw Code">Raw XML Code</option>
              </select>
            </div>
            <div className="form-row-full-v">
              <label>VAST / IMA Tag URL</label>
              <input type="text" name="sourceUrl" value={formData.sourceUrl} onChange={handleChange} className="custom-input-v" />
            </div>
          </div>
        )}

        <div className="ads-card-section">
          <div className="section-head-v flex-between">
            <div className="head-left-group">
              <Sparkles size={18} className="text-lime" />
              <h2>Built-in Advertisement Slots ({formData.builtInAds.length})</h2>
            </div>
            <button type="button" className="btn-add-slot-top" onClick={handleAddSlot}>
              <Plus size={15} /> Add Ad Slot
            </button>
          </div>

          <div className="ad-slots-container">
            {formData.builtInAds.map((slot, index) => {
              const hasSource = Boolean(slot.source && slot.source.trim());
              const isPreviewOpen = previewingSlots[index];

              return (
                <div key={index} className="ad-slot-card">
                  <div className="slot-card-header">
                    <div className="slot-title-badge">
                      <span className="slot-num-pill">Slot #{index + 1}</span>
                      <input type="text" className="slot-name-input" value={slot.title || `Ad ${index + 1}`} onChange={(e) => handleSlotChange(index, 'title', e.target.value)} />
                      {slot.categories && !slot.categories.includes('all') && slot.categories.length > 0 && (
                        <span className="slot-cat-indicator-pill">
                          🎯 {slot.categories.length} {slot.categories.length === 1 ? 'Category' : 'Categories'}
                        </span>
                      )}
                    </div>
                    <div className="slot-header-actions">
                      <button type="button" className="btn-remove-slot" onClick={() => handleRemoveSlot(index)} title="Delete this ad slot">
                        <Trash2 size={15} />
                        <span className="btn-delete-text">Delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="slot-fields-body">
                    <div className="form-row-full-v">
                      <label>Ad Source URL</label>
                      <div className="ad-source-input-group-v">
                        <input type="text" value={slot.source || ''} onChange={(e) => handleSlotChange(index, 'source', e.target.value)} placeholder="Paste MP4/HLS/Image URL" className="custom-input-v" />
                        <button type="button" className="ad-upload-btn-v" onClick={() => document.getElementById(`slotFile_${index}`).click()}>
                          <Upload size={15} />
                          <span>{uploadingSlotIndex === index ? 'Uploading...' : 'Upload'}</span>
                        </button>
                        {hasSource && (
                          <button type="button" className={`ad-play-toggle-btn ${isPreviewOpen ? 'active' : ''}`} onClick={() => toggleSlotPreview(index)}>
                            {isPreviewOpen ? <EyeOff size={15} /> : <Play size={15} />}
                          </button>
                        )}
                        <input type="file" id={`slotFile_${index}`} style={{ display: 'none' }} onChange={(e) => handleFileChange(index, e)} accept="video/*,image/*" />
                      </div>
                    </div>

                    {hasSource && isPreviewOpen && (
                      <div className="slot-preview-wrapper-v">
                        <AdPreviewPlayer 
                          source={slot.source} 
                          targetLink={slot.targetLink} 
                          skipAfter={slot.skipAfter ?? 5} 
                          title={slot.title} 
                          timestart={slot.timestart}
                          repeatMode={slot.repeatMode}
                          repeatInterval={slot.repeatInterval}
                        />
                      </div>
                    )}

                    {/* Target Categories / Content Types */}
                    <div className="form-row-full-v category-target-container">
                      <div className="category-label-header">
                        <label className="category-main-label">
                          <Film size={16} className="label-icon-inline text-lime" />
                          <span>Target Category (Show Ads On)</span>
                        </label>
                        <span className="category-hint-text">
                          {(slot.categories || ['all']).includes('all') || (slot.categories || []).length === 0
                            ? '● Active on All Video Categories'
                            : `● Active on ${(slot.categories || []).length} Selected ${(slot.categories || []).length === 1 ? 'Category' : 'Categories'}`}
                        </span>
                      </div>

                      <div className="category-pills-selector">
                        {AVAILABLE_CATEGORIES.map(cat => {
                          const slotCats = slot.categories || ['all'];
                          const isSelected = cat.id === 'all'
                            ? (slotCats.includes('all') || slotCats.length === 0)
                            : (!slotCats.includes('all') && slotCats.includes(cat.id));

                          return (
                            <button
                              key={cat.id}
                              type="button"
                              className={`category-pill-btn ${isSelected ? 'active' : ''}`}
                              onClick={() => handleToggleSlotCategory(index, cat.id)}
                            >
                              <span className="pill-icon">{cat.icon}</span>
                              <span className="pill-label">{cat.label}</span>
                              {isSelected && <span className="pill-check">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timestart & Multiple Time / Repeat Schedule */}
                    <div className="form-row-full-v timing-section-container">
                      <div className="timing-label-header">
                        <label className="timing-main-label">
                          <Clock size={16} className="label-icon-inline text-lime" />
                          <span>Ad Playback Schedule (Multiple Times)</span>
                        </label>
                        <div className="timing-mode-toggle-group">
                          <button
                            type="button"
                            className={`timing-mode-btn ${slot.repeatMode !== 'interval' ? 'active' : ''}`}
                            onClick={() => handleSlotChange(index, 'repeatMode', 'timestamps')}
                          >
                            <Clock size={13} />
                            <span>Specific Times ({parseTimestamps(slot.timestart).length})</span>
                          </button>
                          <button
                            type="button"
                            className={`timing-mode-btn ${slot.repeatMode === 'interval' ? 'active' : ''}`}
                            onClick={() => {
                              handleSlotChange(index, 'repeatMode', 'interval');
                              if (!slot.repeatInterval) handleSlotChange(index, 'repeatInterval', 5);
                            }}
                          >
                            <Repeat size={13} />
                            <span>Repeat Every X Min</span>
                          </button>
                        </div>
                      </div>

                      {slot.repeatMode === 'interval' ? (
                        <div className="interval-schedule-card">
                          <div className="interval-inputs-grid">
                            <div className="interval-input-cell">
                              <span className="cell-sub-label">First Play Timestart (HH:MM:SS)</span>
                              <div className="timestart-input-wrap">
                                <Clock size={15} className="input-icon-v" />
                                <input
                                  type="text"
                                  value={slot.timestart ? String(slot.timestart).split(/[,;]/)[0].trim() : '00:00:10'}
                                  onChange={(e) => handleSlotChange(index, 'timestart', e.target.value)}
                                  placeholder="00:00:10"
                                  className="custom-input-v time-input"
                                />
                              </div>
                            </div>
                            <div className="interval-input-cell">
                              <span className="cell-sub-label">Repeat Interval Frequency</span>
                              <div className="interval-select-wrap">
                                <Repeat size={15} className="input-icon-v" />
                                <select
                                  value={slot.repeatInterval || 5}
                                  onChange={(e) => handleSlotChange(index, 'repeatInterval', Number(e.target.value))}
                                  className="custom-input-v interval-select-v"
                                >
                                  <option value={1}>Every 1 Minute</option>
                                  <option value={2}>Every 2 Minutes</option>
                                  <option value={3}>Every 3 Minutes</option>
                                  <option value={5}>Every 5 Minutes (Recommended)</option>
                                  <option value={10}>Every 10 Minutes</option>
                                  <option value={15}>Every 15 Minutes</option>
                                  <option value={20}>Every 20 Minutes</option>
                                  <option value={30}>Every 30 Minutes</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="interval-notice-box">
                            <Repeat size={14} className="notice-icon text-lime" />
                            <span>This ad will trigger at <strong>{slot.timestart ? String(slot.timestart).split(/[,;]/)[0].trim() : '00:00:10'}</strong>, then automatically repeat every <strong>{slot.repeatInterval || 5} minutes</strong> continuously throughout the entire video.</span>
                          </div>
                        </div>
                      ) : (
                        <div className="timestamps-schedule-card">
                          <div className="timestart-input-wrap">
                            <Clock size={16} className="input-icon-v" />
                            <input
                              type="text"
                              value={slot.timestart || '00:00:10'}
                              onChange={(e) => handleSlotChange(index, 'timestart', e.target.value)}
                              placeholder="e.g. 00:00:10, 00:00:45, 00:05:00"
                              className="custom-input-v time-input multi-time-input"
                            />
                            <span className="timestart-hint">
                              {parseTimestamps(slot.timestart).length > 1
                                ? `● Plays ${parseTimestamps(slot.timestart).length} Times`
                                : slot.timestart === '00:00:00' || slot.timestart === '00:00:01' || slot.timestart === '00:00:03'
                                  ? '● Pre-roll Ad'
                                  : '● Mid-roll Ad'}
                            </span>
                          </div>

                          {/* Quick Add Timestamps Chips */}
                          <div className="quick-time-chips-wrap">
                            <span className="quick-chips-label">Quick Add Play Time:</span>
                            {[
                              { label: 'Pre-roll', time: '00:00:03' },
                              { label: '45s', time: '00:00:45' },
                              { label: '2 min', time: '00:02:00' },
                              { label: '5 min', time: '00:05:00' },
                              { label: '10 min', time: '00:10:00' },
                              { label: '15 min', time: '00:15:00' },
                              { label: '30 min', time: '00:30:00' }
                            ].map((preset) => {
                              const isAdded = parseTimestamps(slot.timestart).includes(preset.time);
                              return (
                                <button
                                  key={preset.time}
                                  type="button"
                                  className={`btn-time-preset-chip ${isAdded ? 'active' : ''}`}
                                  onClick={() => handleAddTimeToSlot(index, preset.time)}
                                  title={`Add ${preset.time} to this ad slot`}
                                >
                                  {isAdded ? '✓' : '+'} {preset.time} <span className="chip-sub">{preset.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Cue points badges */}
                          <div className="cue-points-badge-row">
                            {parseTimestamps(slot.timestart).map((time, tIdx) => {
                              const isPre = time === '00:00:00' || time === '00:00:01' || time === '00:00:03';
                              return (
                                <span key={tIdx} className="cue-point-tag">
                                  <span className="cue-num">#{tIdx + 1}</span>
                                  <span className="cue-time">{time}</span>
                                  <span className="cue-type">{isPre ? 'Pre-roll' : 'Mid-roll'}</span>
                                  {parseTimestamps(slot.timestart).length > 1 && (
                                    <button
                                      type="button"
                                      className="cue-remove-btn"
                                      onClick={() => handleRemoveTimeFromSlot(index, time)}
                                      title={`Remove ${time}`}
                                    >
                                      ×
                                    </button>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
              );
            })}
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
        .custom-select-v.select-active {
          border-color: rgba(179, 211, 50, 0.4);
        }
        .custom-select-v.select-warning {
          border-color: rgba(250, 204, 21, 0.5);
          color: #facc15;
        }

        .ads-disabled-banner-v {
          margin-top: 14px;
          background: rgba(250, 204, 21, 0.08);
          border: 1px solid rgba(250, 204, 21, 0.25);
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .banner-text-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .banner-text-wrap strong {
          color: #facc15;
          font-size: 0.84rem;
        }
        .banner-text-wrap span {
          color: #cbd5e1;
          font-size: 0.78rem;
        }
        .btn-activate-engine {
          background: #facc15;
          color: #000;
          border: none;
          padding: 7px 14px;
          border-radius: 5px;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-activate-engine:hover {
          background: #fde047;
          transform: translateY(-1px);
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

        .slot-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-preview-slot {
          background: #161a24;
          border: 1px solid #293447;
          color: #b3d332;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-preview-slot:hover, .btn-preview-slot.active {
          background: #b3d332;
          color: #000;
          border-color: #b3d332;
        }

        .btn-remove-slot {
          background: rgba(255, 77, 77, 0.08);
          border: 1px solid rgba(255, 77, 77, 0.25);
          color: #ff6b6b;
          padding: 6px 12px;
          height: auto;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 700;
          transition: all 0.2s;
        }
        .btn-remove-slot:hover {
          background: #ff4d4d;
          border-color: #ff4d4d;
          color: #fff;
        }
        .btn-delete-text {
          font-size: 0.78rem;
        }

        .ad-play-toggle-btn {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 10px 14px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .ad-play-toggle-btn:hover {
          background: #c5ea38;
          transform: scale(1.05);
        }
        .ad-play-toggle-btn.active {
          background: #252e3d;
          color: #fff;
        }

        /* Video Ad Preview Stage */
        .slot-preview-wrapper-v {
          margin: 12px 0 18px 0;
          width: 100%;
        }

        .ad-preview-player-box {
          background: #08090d;
          border: 1px solid #232a3b;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        }

        .ad-preview-header {
          background: #0f1219;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #1c2230;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ad-preview-tag-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ad-live-pill {
          background: #b3d332;
          color: #000;
          font-size: 0.7rem;
          font-weight: 900;
          padding: 2px 7px;
          border-radius: 3px;
          letter-spacing: 0.5px;
        }

        .ad-type-pill {
          background: #1c2230;
          color: #cbd5e1;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 3px;
        }

        .ad-timing-pill {
          color: #8895a5;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .ad-preview-target-btn {
          color: #b3d332;
          font-size: 0.75rem;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: rgba(179, 211, 50, 0.08);
          border-radius: 4px;
          transition: background 0.2s;
        }
        .ad-preview-target-btn:hover {
          background: rgba(179, 211, 50, 0.18);
        }

        .ad-preview-media-stage {
          position: relative;
          width: 100%;
          height: 280px;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .ad-preview-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .ad-preview-image-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050508;
        }

        .ad-preview-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .ad-preview-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 14px;
          box-sizing: border-box;
        }

        .ad-badge-corner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.75);
          padding: 4px 10px;
          border-radius: 4px;
          border-left: 3px solid #facc15;
          width: fit-content;
        }

        .ad-badge-text {
          background: #facc15;
          color: #000;
          font-size: 0.68rem;
          font-weight: 900;
          padding: 1px 5px;
          border-radius: 2px;
          text-transform: uppercase;
        }

        .ad-badge-title {
          color: #fff;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .ad-skip-corner {
          align-self: flex-end;
          pointer-events: auto;
        }

        .ad-skip-countdown {
          background: rgba(0, 0, 0, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 7px 14px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .ad-skip-countdown strong {
          color: #b3d332;
        }

        .ad-skip-btn-active {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 7px 16px;
          border-radius: 4px;
          font-size: 0.82rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          transition: transform 0.15s, background 0.2s;
        }
        .ad-skip-btn-active:hover {
          background: #c5ea38;
          transform: scale(1.03);
        }

        .ad-preview-error-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          text-align: center;
          gap: 10px;
        }
        .ad-preview-error-overlay p {
          color: #ff8080;
          font-size: 0.85rem;
          margin: 0;
        }

        .ad-preview-controls-bar {
          background: #0e1118;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #1a202c;
        }

        .controls-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .control-btn {
          background: #191f2b;
          border: 1px solid #283244;
          color: #cbd5e1;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .control-btn:hover {
          background: #b3d332;
          color: #000;
          border-color: #b3d332;
        }

        .ad-time-text {
          font-size: 0.78rem;
          color: #8895a5;
          font-family: monospace;
          margin-left: 6px;
        }

        .sim-label {
          font-size: 0.72rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .slot-fields-body {
          display: flex;
          flex-direction: column;
        }

        .slot-cat-indicator-pill {
          background: rgba(179, 211, 50, 0.12);
          border: 1px solid rgba(179, 211, 50, 0.35);
          color: #b3d332;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          margin-left: 6px;
        }

        .category-target-container {
          background: #090c12;
          border: 1px solid #1a2230;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .category-label-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          flex-wrap: wrap;
          gap: 8px;
        }

        .category-main-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.84rem;
          color: #e2e8f0;
          margin: 0;
        }

        .category-hint-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: #b3d332;
        }

        .category-pills-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
        }

        .category-pill-btn {
          background: #121622;
          border: 1px solid #232d3f;
          color: #94a3b8;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .category-pill-btn:hover {
          background: #1a2232;
          border-color: #3b4b66;
          color: #fff;
        }

        .category-pill-btn.active {
          background: rgba(179, 211, 50, 0.15);
          border-color: #b3d332;
          color: #fff;
          box-shadow: 0 2px 8px rgba(179, 211, 50, 0.2);
        }

        .category-pill-btn.active .pill-label {
          color: #b3d332;
        }

        .pill-check {
          color: #b3d332;
          font-weight: 900;
          font-size: 0.8rem;
        }

        .timing-section-container {
          background: #090c12;
          border: 1px solid #1a2230;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .timing-label-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          flex-wrap: wrap;
          gap: 8px;
        }

        .timing-main-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.84rem;
          color: #e2e8f0;
          margin: 0;
        }

        .label-icon-inline {
          color: #b3d332;
          flex-shrink: 0;
        }

        .timing-mode-toggle-group {
          display: flex;
          align-items: center;
          background: #111622;
          border: 1px solid #232c3d;
          border-radius: 6px;
          padding: 2px;
          gap: 2px;
        }

        .timing-mode-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
        }
        .timing-mode-btn:hover {
          color: #fff;
        }
        .timing-mode-btn.active {
          background: #b3d332;
          color: #000;
          box-shadow: 0 2px 6px rgba(179, 211, 50, 0.25);
        }

        .timestamps-schedule-card,
        .interval-schedule-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .interval-inputs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
        }

        .interval-input-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cell-sub-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .interval-select-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .interval-select-v {
          width: 100%;
          cursor: pointer;
        }

        .interval-notice-box {
          background: rgba(179, 211, 50, 0.06);
          border: 1px solid rgba(179, 211, 50, 0.2);
          border-radius: 6px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: #cbd5e1;
          line-height: 1.4;
        }
        .interval-notice-box strong {
          color: #b3d332;
        }

        .multi-time-input {
          max-width: 100% !important;
          flex: 1;
        }

        .quick-time-chips-wrap {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          padding: 4px 0;
        }

        .quick-chips-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          margin-right: 2px;
        }

        .btn-time-preset-chip {
          background: #131824;
          border: 1px solid #242f44;
          color: #94a3b8;
          font-size: 0.72rem;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Fira Code', 'Courier New', monospace;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .btn-time-preset-chip .chip-sub {
          font-family: sans-serif;
          color: #64748b;
          font-size: 0.68rem;
        }
        .btn-time-preset-chip:hover {
          background: #1e2738;
          border-color: #b3d332;
          color: #fff;
        }
        .btn-time-preset-chip.active {
          border-color: rgba(179, 211, 50, 0.4);
          background: rgba(179, 211, 50, 0.1);
          color: #b3d332;
        }

        .cue-points-badge-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 2px;
        }

        .cue-point-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #111722;
          border: 1px solid #233047;
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 0.74rem;
        }
        .cue-num {
          font-weight: 800;
          color: #64748b;
          font-size: 0.68rem;
        }
        .cue-time {
          font-family: 'Fira Code', monospace;
          color: #b3d332;
          font-weight: 700;
        }
        .cue-type {
          font-size: 0.66rem;
          color: #94a3b8;
          text-transform: uppercase;
          background: #182030;
          padding: 1px 4px;
          border-radius: 2px;
        }
        .cue-remove-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 0 2px;
          line-height: 1;
          transition: transform 0.15s;
        }
        .cue-remove-btn:hover {
          transform: scale(1.3);
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
          white-space: nowrap;
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
