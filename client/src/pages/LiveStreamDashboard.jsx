import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Copy, 
  RefreshCw, 
  Check, 
  ExternalLink, 
  MessageSquare, 
  Users, 
  Settings, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Activity, 
  Flame,
  Send,
  Zap,
  X,
  Upload
} from 'lucide-react';
import Loader from '../components/Loader';
import VideoPlayer from '../components/VideoPlayer';

const API_URL = '/api/live-stream/settings';

const LiveStreamDashboard = () => {
  const [streamKey, setStreamKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('Lemo OTT Live Stream');
  const [streamCategory, setStreamCategory] = useState('Entertainment');
  const [streamPoster, setStreamPoster] = useState(''); // Custom stream thumbnail/poster URL
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [serverType, setServerType] = useState('local'); // 'local' or 'custom'
  const [playbackUrl, setPlaybackUrl] = useState('');
  
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [liveStreamReady, setLiveStreamReady] = useState(false);
  
  // Custom chat & activity states
  const [chatMessages, setChatMessages] = useState([]);
  const [slowMode, setSlowMode] = useState('3'); // simulated chat slow mode time limit (seconds)
  const [bannedUsers, setBannedUsers] = useState([]);
  const [timedOutUsers, setTimedOutUsers] = useState({});
  const [activeModUser, setActiveModUser] = useState(null);
  
  const bannedUsersRef = useRef([]);
  const timedOutUsersRef = useRef({});

  useEffect(() => {
    bannedUsersRef.current = bannedUsers;
  }, [bannedUsers]);

  useEffect(() => {
    timedOutUsersRef.current = timedOutUsers;
  }, [timedOutUsers]);

  const [activityEvents, setActivityEvents] = useState([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [streamDuration, setStreamDuration] = useState('00:00:00');

  const chatEndRef = useRef(null);
  const durationTimerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Pool of usernames and messages for simulated chat
  const chatPool = [
    { text: "LEMO OTT live is looking fire today!", category: "Entertainment" },
    { text: "Wow, the RTMP stream has almost zero latency!", category: "All" },
    { text: "Love this stream quality! 1080p 60fps?", category: "All" },
    { text: "Best streaming app in the market right now.", category: "All" },
    { text: "Nice stream title!", category: "All" },
    { text: "Love from Kochi! 🌴❤", category: "All" },
    { text: "Lemo OTT is definitely the next big thing.", category: "All" },
    { text: "POGGERS!", category: "Gaming" },
    { text: "Is anyone else getting smooth playback?", category: "All" },
    { text: "Nice setup!", category: "All" },
    { text: "Who is watching this live?", category: "All" },
    { text: "This streaming dashboard is so clean", category: "Entertainment" },
    { text: "Stream is super stable! 🔥", category: "All" },
    { text: "Malayalam movie streaming when?", category: "Entertainment" },
    { text: "Excited for the next season!", category: "Entertainment" },
    { text: "Keep it up Lemo admin!", category: "All" }
  ];

  const userPool = [
    { name: "MalluGamer", color: "#ff4757" },
    { name: "LemoFan99", color: "#2ed573" },
    { name: "RetroOtt", color: "#1e90ff" },
    { name: "TechyGeek", color: "#ffa502" },
    { name: "Arun_Kumar", color: "#ff6b81" },
    { name: "Nikhil_K", color: "#9b59b6" },
    { name: "CinemaLover", color: "#1abc9c" },
    { name: "ott_watcher", color: "#34495e" },
    { name: "VibeGuy_45", color: "#e67e22" },
    { name: "PixelPerfect", color: "#b3d332" },
    { name: "StreamWizard", color: "#f1c40f" },
    { name: "AlphaWeb", color: "#e74c3c" }
  ];

  const activityPool = [
    "followed the stream",
    "subscribed with Lemo Prime",
    "shared the live channel",
    "unlocked Tier 1 Badge"
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStreamKey(data.streamKey);
        setServerType(data.serverType || 'local');
        setServerUrl(data.serverUrl || 'rtmp://live.lemoott.com/live');
        setPlaybackUrl(data.playbackUrl || 'http://live.lemoott.com/hls/live/{streamKey}/index.m3u8');
        setStreamTitle(data.streamTitle || 'Lemo OTT Live Stream');
        setStreamCategory(data.streamCategory || 'Entertainment');
        setStreamPoster(data.streamPoster || '');
        setIsLive(data.isLive || false);
        setViewers(data.isLive ? data.viewers || 120 : 0);
        setIsScheduled(data.isScheduled || false);
        setChatEnabled(data.chatEnabled !== false);
        setStartedAt(data.startedAt ? new Date(data.startedAt).getTime() : null);
        if (data.scheduledTime) {
          const date = new Date(data.scheduledTime);
          const tzOffset = date.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, 16);
          setScheduledTime(localISOTime);
        } else {
          setScheduledTime('');
        }
      }
    } catch (err) {
      console.error('Error fetching stream settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const res = await fetch('/api/live-chat/messages');
      if (res.ok) {
        const messages = await res.json();
        setChatMessages(messages);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle stream live effects (chat, viewers, duration)
  useEffect(() => {
    let chatInterval = null;
    let activityInterval = null;

    if (isLive) {
      startTimeRef.current = Date.now();
      
      // Start duration tracker from actual startedAt database timestamp
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      durationTimerRef.current = setInterval(() => {
        const start = startedAt || startTimeRef.current;
        const diff = Date.now() - start;
        const hrs = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        setStreamDuration(`${hrs}:${mins}:${secs}`);
      }, 1000);

      // Clear offline messages and events
      setChatMessages([]);
      setActivityEvents([
        { id: Date.now(), text: 'Stream goes online', time: 'Just now' }
      ]);

      // Initial fetch for chat messages
      fetchChatMessages();
      chatInterval = setInterval(fetchChatMessages, 3000);

      // Separate interval for viewer count fluctuation & simulated activity feed
      activityInterval = setInterval(() => {
        // Random activity feed update
        if (Math.random() > 0.6) {
          const randUser = userPool[Math.floor(Math.random() * userPool.length)];
          const action = activityPool[Math.floor(Math.random() * activityPool.length)];
          setActivityEvents(prev => [
            { id: Date.now(), text: `${randUser.name} ${action}`, time: 'Just now' },
            ...prev.slice(0, 10)
          ]);
        }

        // Random viewer count fluctuation
        setViewers(prev => {
          const offset = Math.floor(Math.random() * 21) - 10; // -10 to +10
          return Math.max(50, prev + offset);
        });
      }, 5000);

      return () => {
        if (chatInterval) clearInterval(chatInterval);
        if (activityInterval) clearInterval(activityInterval);
      };
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      setStreamDuration('00:00:00');
      setViewers(0);
      setChatMessages([
        { id: 1, user: 'System', text: 'Stream is currently offline. Chat disconnected.', color: '#888', system: true }
      ]);
      setActivityEvents([
        { id: 1, text: 'Stream went offline', time: 'Just now' }
      ]);
    }
  }, [isLive, streamCategory, startedAt]);

  // Poll for live stream readiness when isLive=true but HLS not ready yet
  useEffect(() => {
    if (!isLive) {
      setLiveStreamReady(false);
      return;
    }
    if (liveStreamReady) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/live-stream/active');
        if (res.ok) {
          const activeStream = await res.json();
          if (activeStream && activeStream.isLive && activeStream.streamReady) {
            setLiveStreamReady(true);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('[LivePoll] Error:', err);
      }
    }, 5000);

    // Initial check
    const initialCheck = async () => {
      try {
        const res = await fetch('/api/live-stream/active');
        if (res.ok) {
          const activeStream = await res.json();
          if (activeStream && activeStream.isLive && activeStream.streamReady) {
            setLiveStreamReady(true);
          }
        }
      } catch (err) {
        console.error('[LivePoll Init] Error:', err);
      }
    };
    initialCheck();

    return () => clearInterval(pollInterval);
  }, [isLive, liveStreamReady]);

  // Scroll chat to bottom when message arrives
  useEffect(() => {
    const container = document.querySelector('.chat-messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages]);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
    showNotification('Copied to clipboard');
  };

  const handleRegenerateKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate the stream key? Existing stream configurations using this key will disconnected.')) {
      return;
    }
    setRegenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/live-stream/regenerate-key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStreamKey(data.streamKey);
        showNotification('Stream Key Regenerated Successfully');
      } else {
        showNotification('Failed to regenerate stream key', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error regenerating stream key', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          streamTitle,
          streamCategory,
          streamPoster,
          isLive,
          viewers: isLive ? viewers || 120 : 0,
          isScheduled,
          scheduledTime: isScheduled && scheduledTime ? new Date(scheduledTime).toISOString() : null,
          chatEnabled,
          serverType,
          serverUrl,
          playbackUrl
        })
      });
      if (response.ok) {
        showNotification('Stream settings updated');
      } else {
        showNotification('Error saving settings', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleLiveStatus = async () => {
    const nextLiveStatus = !isLive;
    setIsLive(nextLiveStatus);
    const initialViewers = nextLiveStatus ? 150 : 0;
    if (nextLiveStatus) {
      setViewers(initialViewers);
      setIsScheduled(false);
      setScheduledTime('');
    }
    try {
      const token = localStorage.getItem('token');
      await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          streamTitle,
          streamCategory,
          streamPoster,
          isLive: nextLiveStatus,
          viewers: nextLiveStatus ? initialViewers : 0,
          isScheduled: false,
          scheduledTime: null,
          chatEnabled,
          serverType,
          serverUrl,
          playbackUrl
        })
      });
      showNotification(nextLiveStatus ? 'Live Stream Started!' : 'Live Stream Stopped.');
    } catch (err) {
      console.error(err);
      showNotification('Failed to toggle stream status', 'error');
    }
  };

  const sendAdminChatMessage = async (e) => {
    e.preventDefault();
    if (!adminMessage.trim()) return;
    const msgText = adminMessage.trim();
    setAdminMessage('');
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/live-chat/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user: 'Admin (You)',
          text: msgText,
          color: '#b3d332',
          system: false,
          isAdmin: true
        })
      });
      if (res.ok) {
        fetchChatMessages();
      }
    } catch (err) {
      console.error('Error sending admin chat message:', err);
    }
  };

  const deleteChatMessage = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/live-chat/messages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setChatMessages(prev => prev.filter(msg => (msg._id || msg.id) !== id));
        showNotification('Chat message deleted');
      } else {
        showNotification('Failed to delete chat message', 'error');
      }
    } catch (err) {
      console.error('Error deleting chat message:', err);
      showNotification('Failed to delete chat message', 'error');
    }
  };

  const handleUserClick = (username, msgId, userId, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const container = document.querySelector('.chat-messages-container');
    const containerRect = container ? container.getBoundingClientRect() : { top: 0, left: 0, width: 350 };
    
    // Position popover below the username relative to the scrolling container
    const calculatedTop = rect.bottom - containerRect.top + container.scrollTop;
    const calculatedLeft = Math.min(rect.left - containerRect.left, containerRect.width - 150);

    setActiveModUser({
      username,
      msgId,
      userId,
      top: calculatedTop,
      left: calculatedLeft
    });
  };

  const handleTimeoutUser = async (username, durationSeconds) => {
    if (!activeModUser?.userId) {
      showNotification('Cannot timeout anonymous user', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/live-chat/timeout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: activeModUser.userId,
          durationSeconds
        })
      });
      if (res.ok) {
        showNotification(`User @${username} timed out for ${durationSeconds}s`);
        setActivityEvents(prev => [
          { id: Date.now(), text: `Admin timed out @${username} for ${durationSeconds}s`, time: 'Just now' },
          ...prev.slice(0, 10)
        ]);
        setActiveModUser(null);
      } else {
        const errorData = await res.json();
        showNotification(errorData.message || 'Failed to timeout user', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to timeout user', 'error');
    }
  };

  const handleBlockUser = async (username) => {
    if (!activeModUser?.userId) {
      showNotification('Cannot ban anonymous user', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/live-chat/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: activeModUser.userId
        })
      });
      if (res.ok) {
        showNotification(`User @${username} has been blocked/banned`);
        setActivityEvents(prev => [
          { id: Date.now(), text: `Admin blocked/banned @${username}`, time: 'Just now' },
          ...prev.slice(0, 10)
        ]);
        setActiveModUser(null);
      } else {
        const errorData = await res.json();
        showNotification(errorData.message || 'Failed to ban user', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to ban user', 'error');
    }
  };

  const formatPosterUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1542204172-e7052809f852?w=800&q=80';
    if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `/${cleanPath}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      showNotification('Uploading image...', 'info');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await response.json();
      if (data.url) {
        const trimmedUrl = data.url.trim();
        setStreamPoster(trimmedUrl);
        showNotification('Thumbnail uploaded successfully');
      } else {
        showNotification('Upload failed', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showNotification('Upload failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size="small" />
      </div>
    );
  }

  return (
    <div className="live-dashboard-container">
      <input 
        type="file" 
        id="poster-file-input" 
        style={{ display: 'none' }} 
        onChange={handleFileUpload} 
        accept="image/*"
      />
      {notification && (
        <div className="custom-alert-box-v">
          <div className="alert-content-v">
            <Check size={32} color="#b3d332" strokeWidth={3} />
            <span className="alert-text-v">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className={`live-badge ${isLive ? 'online' : 'offline'}`}>
            <span className="pulse-dot"></span>
            <span>{isLive ? 'LIVE' : 'OFFLINE'}</span>
          </div>
          <h1>Lemo Live Stream Manager</h1>
        </div>
        <div className="header-actions">
          <button 
            onClick={toggleLiveStatus} 
            className={`btn-action-live ${isLive ? 'stop-live' : 'start-live'}`}
          >
            <Radio size={16} />
            <span>{isLive ? 'Stop Broadcasting' : 'Go Live Now'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="dashboard-grid">
        {/* Left Column - Streaming Config */}
        <div className="dashboard-main-col">
          {/* Virtual RTMP Player Mock/Stream Monitor Preview */}
          <div className="stream-preview-card">
            {isLive ? (
              <div className="preview-video-container active">
                {liveStreamReady ? (
                  <VideoPlayer 
                    src={
                      serverType === 'custom'
                        ? (playbackUrl || '').replace(/{streamKey}/g, streamKey).replace(/{key}/g, streamKey)
                        : `${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : `${window.location.protocol}//${window.location.host}`}/hls/live/${streamKey}/index.m3u8`
                    }
                    videoTitle={streamTitle}
                    type="live"
                  />
                ) : (
                  <>
                    <div className="live-status-overlay" style={{ zIndex: 20 }}>
                      <div className="live-stat"><Activity size={12} color="#ff4d4d"/> 1080p 60fps</div>
                      <div className="live-stat"><Users size={12} /> {viewers} Viewers</div>
                      <div className="live-stat">⏳ {streamDuration}</div>
                    </div>
                    <div className="preview-loader-animation">
                      <Flame size={48} className="live-flame" />
                      <p>Stream Active & Processing RTMP Input</p>
                      <span className="server-label">URL: {window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'rtmp://localhost:1935/live' : serverUrl}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div 
                className="preview-video-container offline"
                style={{ 
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0.9)), url(${formatPosterUrl(streamPoster)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="offline-message">
                  <Radio size={48} className="offline-icon" />
                  <h3>Live Broadcast Offline</h3>
                  <p>Configure your streaming software (OBS, Streamlabs, etc.) with the RTMP Server URL and Stream Key below to start broadcasting.</p>
                </div>
              </div>
            )}
          </div>

          {/* RTMP Setup Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <Zap size={18} color="#b3d332" />
              <h2>RTMP Encoder Settings</h2>
            </div>
            <div className="card-body">
              {(() => {
                 const host = window.location.hostname;
                 const isLocalHost = host === 'localhost' || host === '127.0.0.1';
                 const rtmpUrl = serverType === 'custom'
                   ? (serverUrl || 'rtmp://live.lemoott.com/live')
                   : (isLocalHost ? 'rtmp://localhost:1935/live' : `rtmp://${host}:1935/live`);
                 const isLocalBanner = serverType === 'local' && isLocalHost;
                 return (
                   <>
                     <div className="rtmp-env-banner" style={{
                       background: isLocalBanner ? 'rgba(179,211,50,0.08)' : 'rgba(239,68,68,0.08)',
                       border: `1px solid ${isLocalBanner ? '#b3d332' : '#ef4444'}`,
                       borderRadius: '8px',
                       padding: '10px 14px',
                       marginBottom: '16px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '10px',
                       fontSize: '0.8rem',
                       color: isLocalBanner ? '#b3d332' : '#ef4444'
                     }}>
                       <span style={{ fontSize: '1rem' }}>{isLocalBanner ? '🖥️' : '🌐'}</span>
                       <span>
                         <strong>{isLocalBanner ? 'LOCAL MODE' : 'PRODUCTION MODE'}</strong>
                         {' — '}
                         {serverType === 'custom'
                           ? 'OBS → connect to your custom RTMP Stream Server URL.'
                           : (isLocalHost
                             ? 'OBS → connect to localhost. For remote OBS, use your server IP.'
                             : 'OBS → connect to your server domain/IP on port 1935.')}
                       </span>
                     </div>
                     <div className="input-group-row">
                      <div className="input-block flex-3">
                        <label>RTMP Stream Server URL</label>
                        <div className="copyable-input-wrapper">
                          <input 
                            type="text" 
                            value={rtmpUrl} 
                            readOnly 
                            className="readonly-input"
                          />
                          <button 
                            onClick={() => handleCopy(rtmpUrl, 'url')}
                            className="btn-copy"
                            title="Copy Server URL"
                          >
                            {copiedUrl ? <Check size={16} color="#b3d332" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="input-group-row">
                <div className="input-block flex-3">
                  <label>Stream Key (Keep secret)</label>
                  <div className="copyable-input-wrapper">
                    <input 
                      type={showKey ? 'text' : 'password'} 
                      value={streamKey} 
                      readOnly 
                      className="readonly-input font-mono"
                    />
                    <button 
                      onClick={() => setShowKey(!showKey)} 
                      className="btn-reveal"
                      title={showKey ? "Hide Stream Key" : "Show Stream Key"}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                      onClick={() => handleCopy(streamKey, 'key')}
                      className="btn-copy"
                      title="Copy Stream Key"
                    >
                      {copiedKey ? <Check size={16} color="#b3d332" /> : <Copy size={16} />}
                    </button>
                    <button 
                      onClick={handleRegenerateKey}
                      className="btn-regen"
                      disabled={regenerating}
                      title="Regenerate Stream Key"
                    >
                      {regenerating ? <RefreshCw size={16} className="spinner" /> : <RefreshCw size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="encoder-hint">
                <AlertCircle size={12} /> In OBS: File → Settings → Stream → Service: Custom. Paste Server URL and Stream Key above.
              </p>
            </div>
          </div>

          {/* Stream Metadata Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <Settings size={18} color="#b3d332" />
              <h2>Stream Information</h2>
            </div>
            <form onSubmit={handleSaveSettings} className="card-body">
              <div className="input-group-row">
                <div className="input-block">
                  <label>Broadcast Title</label>
                  <input 
                    type="text" 
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="Enter Stream Title..."
                    required
                  />
                </div>
                <div className="input-block">
                  <label>Category</label>
                  <select 
                    value={streamCategory} 
                    onChange={(e) => setStreamCategory(e.target.value)}
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Just Chatting">Just Chatting</option>
                    <option value="Sports">Sports</option>
                    <option value="News">News</option>
                    <option value="Music">Music</option>
                  </select>
                </div>
              </div>

              <div className="input-group-row" style={{ marginTop: '20px' }}>
                <div className="input-block">
                  <label className="switch-container">
                    <input 
                      type="checkbox" 
                      id="isScheduled" 
                      checked={isScheduled} 
                      onChange={(e) => setIsScheduled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                    <span className="switch-label-text">Schedule this Stream</span>
                  </label>
                </div>
                {isScheduled && (
                  <div className="input-block">
                    <label>Scheduled Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      required={isScheduled}
                      style={{
                        background: '#1c1e24',
                        border: '1px solid #2d313f',
                        color: '#fff',
                        padding: '10px',
                        borderRadius: '4px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="input-group-row" style={{ marginTop: '20px' }}>
                <div className="input-block">
                  <label className="switch-container">
                    <input 
                      type="checkbox" 
                      id="chatEnabled" 
                      checked={chatEnabled} 
                      onChange={(e) => setChatEnabled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                    <span className="switch-label-text">Enable Live Chat on Frontend</span>
                  </label>
                </div>
              </div>

              <div className="input-group-row" style={{ marginTop: '20px' }}>
                <div className="input-block flex-3">
                  <label>Stream Thumbnail (Poster)</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={streamPoster}
                      onChange={(e) => setStreamPoster(e.target.value)}
                      placeholder="Thumbnail Image URL..."
                      style={{ flexGrow: 1 }}
                    />
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('poster-file-input').click()}
                      style={{ 
                        background: '#2d313f', 
                        color: '#fff', 
                        border: '1px solid #333', 
                        padding: '10px 18px', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: 700
                      }}
                    >
                      <Upload size={14} /> Select File
                    </button>
                  </div>
                  {streamPoster && (
                    <div style={{ marginTop: '15px', width: '160px', height: '90px', borderRadius: '6px', border: '1px solid #2d313f', overflow: 'hidden' }}>
                      <img 
                        src={formatPosterUrl(streamPoster)} 
                        alt="Thumbnail Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Streaming Server Configuration */}
              <div style={{
                marginTop: '25px',
                paddingTop: '20px',
                borderTop: '1px solid #2d313f'
              }}>
                <h3 style={{ fontSize: '1.1rem', color: '#b3d332', marginBottom: '15px', fontWeight: 600 }}>Stream Ingest Server Configuration</h3>
                <div className="input-group-row">
                  <div className="input-block">
                    <label>Streaming Server Mode</label>
                    <select 
                      value={serverType} 
                      onChange={(e) => setServerType(e.target.value)}
                    >
                      <option value="local">Local Node Media Server (Auto)</option>
                      <option value="custom">Custom External Stream Server</option>
                    </select>
                  </div>
                  {serverType === 'custom' && (
                    <div className="input-block">
                      <label>RTMP Stream Server URL</label>
                      <input 
                        type="text" 
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        placeholder="e.g. rtmp://live.lemoott.com/live"
                        required={serverType === 'custom'}
                      />
                    </div>
                  )}
                </div>

                {serverType === 'custom' && (
                  <div className="input-group-row" style={{ marginTop: '15px' }}>
                    <div className="input-block">
                      <label>HLS Playback URL</label>
                      <input 
                        type="text" 
                        value={playbackUrl}
                        onChange={(e) => setPlaybackUrl(e.target.value)}
                        placeholder="e.g. http://live.lemoott.com/hls/live/{streamKey}/index.m3u8"
                        required={serverType === 'custom'}
                      />
                      <p className="encoder-hint" style={{ marginTop: '6px' }}>
                        <AlertCircle size={10} /> Tip: Use <code>{'{streamKey}'}</code> as a placeholder in the playback URL to dynamically insert the active stream key.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save-settings" disabled={saving}>
                  {saving ? 'Saving...' : 'Update Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Chat & Activity Side Panel */}
        <div className="dashboard-sidebar-col">
          {/* Live Chat Panel */}
          <div className="sidebar-card chat-panel">
            <div className="sidebar-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} color="#b3d332" />
                <h3>Simulated Live Chat</h3>
                {isLive && <span className="chat-online-dot"></span>}
              </div>
              <select 
                value={slowMode} 
                onChange={(e) => setSlowMode(e.target.value)} 
                className="slow-mode-select"
                title="Select time limit between simulated chat messages"
                style={{ 
                  background: '#1c1e24', 
                  border: '1px solid #2d313f', 
                  color: '#fff', 
                  fontSize: '0.72rem', 
                  borderRadius: '4px', 
                  padding: '3px 8px', 
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <option value="1">Slow Mode: 1s</option>
                <option value="3">Slow Mode: 3s</option>
                <option value="5">Slow Mode: 5s</option>
                <option value="10">Slow Mode: 10s</option>
                <option value="30">Slow Mode: 30s</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div className="chat-messages-container" style={{ position: 'relative' }}>
              {activeModUser && (
                <>
                  <div 
                    onClick={() => setActiveModUser(null)} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99, background: 'transparent' }}
                  />
                  <div 
                    className="chat-mod-popover"
                    style={{
                      position: 'absolute',
                      top: `${activeModUser.top}px`,
                      left: `${activeModUser.left}px`,
                      backgroundColor: '#16181f',
                      border: '1px solid #2d313f',
                      borderRadius: '6px',
                      padding: '8px 0',
                      zIndex: 100,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      minWidth: '130px'
                    }}
                  >
                    <div style={{ padding: '4px 12px', fontSize: '0.72rem', color: '#8e909a', fontWeight: 'bold', borderBottom: '1px solid #222', marginBottom: '4px' }}>
                      @{activeModUser.username}
                    </div>
                    {activeModUser.msgId && (
                      <button 
                        onClick={() => {
                          deleteChatMessage(activeModUser.msgId);
                          setActiveModUser(null);
                        }}
                        className="mod-option-btn"
                        style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', color: '#ffb703', fontSize: '0.78rem', textAlign: 'left', cursor: 'pointer' }}
                      >
                        Delete Message
                      </button>
                    )}
                    <button 
                      onClick={() => handleTimeoutUser(activeModUser.username, 30)}
                      className="mod-option-btn"
                      style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', color: '#fff', fontSize: '0.78rem', textAlign: 'left', cursor: 'pointer' }}
                    >
                      Timeout (30s)
                    </button>
                    <button 
                      onClick={() => handleBlockUser(activeModUser.username)}
                      className="mod-option-btn"
                      style={{ display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.78rem', textAlign: 'left', cursor: 'pointer' }}
                    >
                      Block & Ban
                    </button>
                  </div>
                </>
              )}
              {chatMessages.map((msg) => (
                <div 
                  key={msg._id || msg.id} 
                  className={msg.isAdmin ? 'chat-message-row admin-chat-msg' : 'chat-message-row'}
                  style={msg.isAdmin ? { width: '100%' } : {}}
                >
                  <div className={`chat-message ${msg.system ? 'system' : ''} ${msg.isAdmin ? 'admin-msg' : ''}`}>
                    {!msg.system && (
                      <>
                        {msg.isAdmin && (
                          <span 
                            style={{ 
                              background: '#b3d332', 
                              color: '#000', 
                              padding: '1px 5px', 
                              borderRadius: '3px', 
                              fontSize: '0.65rem', 
                              fontWeight: '900', 
                              marginRight: '6px', 
                              display: 'inline-block',
                              letterSpacing: '0.5px',
                              boxShadow: '0 0 6px rgba(179, 211, 50, 0.4)'
                            }}
                          >
                            ADMIN
                          </span>
                        )}
                        <span 
                          className="chat-username" 
                          style={{ color: msg.isAdmin ? '#b3d332' : msg.color, cursor: 'pointer', borderBottom: '1px dashed transparent', fontWeight: msg.isAdmin ? '800' : 'normal' }}
                          title="Click for mod actions"
                          onClick={(e) => handleUserClick(msg.user, msg._id || msg.id, msg.userId, e)}
                          onMouseOver={(e) => e.currentTarget.style.borderBottomColor = msg.isAdmin ? '#b3d332' : msg.color}
                          onMouseOut={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
                        >
                          {msg.user}:
                        </span>
                      </>
                    )}
                    <span 
                      className="chat-text"
                      style={msg.isAdmin ? { color: '#d1f054', fontWeight: '500' } : {}}
                    >
                      {msg.text}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendAdminChatMessage} className="chat-input-bar">
              <input 
                type="text" 
                value={adminMessage} 
                onChange={(e) => setAdminMessage(e.target.value)} 
                placeholder={isLive ? "Send message as Admin..." : "Stream is offline"} 
                disabled={!isLive}
              />
              <button type="submit" className="btn-send-chat" disabled={!isLive || !adminMessage.trim()}>
                <Send size={14} />
              </button>
            </form>
          </div>

          {/* Activity Feed Panel */}
          <div className="sidebar-card activity-panel">
            <div className="sidebar-card-header">
              <Activity size={16} color="#b3d332" />
              <h3>Stream Activity Log</h3>
            </div>
            <div className="activity-list">
              {activityEvents.length === 0 ? (
                <div className="activity-empty">No active notifications</div>
              ) : (
                activityEvents.map((evt) => (
                  <div key={evt.id} className="activity-item">
                    <span className="activity-time">{evt.time}</span>
                    <span className="activity-text">{evt.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .live-dashboard-container {
          background-color: #0d0e12;
          color: #ffffff;
          padding: 30px;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          animation: fadeIn 0.4s ease-out;
        }

        .loading-container {
          background-color: #0d0e12;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #b3d332;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          border-bottom: 1px solid #1a1c23;
          padding-bottom: 15px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .header-left h1 {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0;
        }

        .live-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          border: 1px solid transparent;
        }

        .live-badge.online {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .live-badge.offline {
          background-color: rgba(142, 142, 147, 0.1);
          border-color: rgba(142, 142, 147, 0.3);
          color: #8e8e93;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .online .pulse-dot {
          background-color: #ef4444;
          animation: pulse 1.5s infinite;
        }

        .offline .pulse-dot {
          background-color: #8e8e93;
        }

        .btn-action-live {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
        }

        .start-live {
          background-color: #b3d332;
          color: #000;
        }

        .start-live:hover {
          background-color: #a2c02c;
          transform: translateY(-1px);
        }

        .stop-live {
          background-color: #ef4444;
          color: #fff;
        }

        .stop-live:hover {
          background-color: #dc2626;
          transform: translateY(-1px);
        }

        /* Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 25px;
        }

        .dashboard-main-col {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .dashboard-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        /* Stream Preview Panel */
        .stream-preview-card {
          background-color: #12141a;
          border-radius: 12px;
          border: 1px solid #1f222b;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .preview-video-container {
          aspect-ratio: 16/9;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #000;
        }

        .preview-video-container.active {
          background: linear-gradient(135deg, #0d0f14 0%, #151821 100%);
        }

        .live-status-overlay {
          position: absolute;
          top: 15px;
          left: 15px;
          display: flex;
          gap: 10px;
          z-index: 10;
        }

        .live-stat {
          background-color: rgba(0, 0, 0, 0.75);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .preview-loader-animation {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .live-flame {
          color: #ff4757;
          animation: wave 1.2s ease-in-out infinite alternate;
        }

        .preview-loader-animation p {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .server-label {
          font-size: 0.8rem;
          color: #b3d332;
          background: rgba(179, 211, 50, 0.1);
          padding: 4px 10px;
          border-radius: 4px;
        }

        .offline-message {
          text-align: center;
          max-width: 450px;
          padding: 20px;
        }

        .offline-icon {
          color: #484c5a;
          margin-bottom: 15px;
        }

        .offline-message h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #e2e8f0;
        }

        .offline-message p {
          color: #718096;
          font-size: 0.88rem;
          line-height: 1.5;
        }

        /* Generic Dashboard Cards */
        .dashboard-card {
          background-color: #12141a;
          border-radius: 12px;
          border: 1px solid #1f222b;
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 18px 24px;
          border-bottom: 1px solid #1a1c23;
        }

        .card-header h2 {
          font-size: 1rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
          color: #fff;
        }

        .card-body {
          padding: 24px;
        }

        .input-group-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .input-group-row:last-of-type {
          margin-bottom: 0;
        }

        .input-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-block.flex-3 {
          grid-column: span 2;
        }

        .input-block label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #a0aec0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-block input, .input-block select {
          background-color: #090a0f;
          border: 1px solid #2d313f;
          border-radius: 6px;
          color: #fff;
          padding: 12px 14px;
          outline: none;
          font-size: 0.9rem;
          transition: border-color 0.2s;
        }

        .input-block input:focus, .input-block select:focus {
          border-color: #b3d332;
        }

        .copyable-input-wrapper {
          display: flex;
          position: relative;
        }

        .copyable-input-wrapper input {
          width: 100%;
          padding-right: 140px; /* spacing for action buttons */
        }

        .readonly-input {
          background-color: #07080c !important;
          color: #a0aec0 !important;
          cursor: default;
        }

        .font-mono {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
          letter-spacing: 0.5px;
        }

        .copyable-input-wrapper button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: #1f222b;
          border: 1px solid #2d313f;
          color: #e2e8f0;
          width: 34px;
          height: 34px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copyable-input-wrapper button:hover {
          background-color: #2d313f;
          color: #fff;
        }

        .btn-reveal {
          right: 88px;
        }

        .btn-copy {
          right: 50px;
        }

        .btn-regen {
          right: 12px;
        }

        .btn-regen:hover {
          color: #ff4757 !important;
          border-color: rgba(255, 71, 87, 0.3) !important;
        }

        .encoder-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #718096;
          margin-top: 12px;
          margin-bottom: 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 25px;
        }

        .btn-save-settings {
          background-color: #b3d332;
          color: #000;
          border: none;
          padding: 12px 28px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-save-settings:hover {
          background-color: #a2c02c;
          transform: translateY(-1px);
        }

        /* Sidebar Panels */
        .sidebar-card {
          background-color: #12141a;
          border-radius: 12px;
          border: 1px solid #1f222b;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-panel {
          height: 480px;
        }

        .activity-panel {
          height: 250px;
        }

        .sidebar-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 15px 20px;
          border-bottom: 1px solid #1a1c23;
        }

        .sidebar-card-header h3 {
          font-size: 0.88rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
          color: #fff;
          flex-grow: 1;
        }

        .chat-online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #2ed573;
          box-shadow: 0 0 8px #2ed573;
        }

        /* Chat Scroll Area */
        .chat-messages-container {
          flex-grow: 1;
          padding: 15px 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background-color: #0a0b0e;
        }

        .chat-message-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          padding: 2px 0;
          border-radius: 4px;
        }
        @keyframes adminPulseGlow {
          0% { border-left-color: #b3d332; box-shadow: inset 3px 0 0 #b3d332, 0 0 4px rgba(179, 211, 50, 0.15); }
          50% { border-left-color: #d1f054; box-shadow: inset 3px 0 0 #d1f054, 0 0 12px rgba(179, 211, 50, 0.45); }
          100% { border-left-color: #b3d332; box-shadow: inset 3px 0 0 #b3d332, 0 0 4px rgba(179, 211, 50, 0.15); }
        }
        .admin-chat-msg {
          animation: adminPulseGlow 2s infinite ease-in-out;
          background: rgba(179, 211, 50, 0.08) !important;
          border-left: 3px solid #b3d332 !important;
          padding: 6px 8px !important;
          border-radius: 4px;
          margin: 4px 0;
        }

        .chat-message-row:hover .chat-delete-btn {
          opacity: 0.7;
        }

        .chat-delete-btn {
          background: none;
          border: none;
          color: #ff4d4d;
          cursor: pointer;
          padding: 2px;
          opacity: 0;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }

        .chat-delete-btn:hover {
          opacity: 1 !important;
          transform: scale(1.1);
        }

        .mod-option-btn:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }

        .chat-message {
          font-size: 0.85rem;
          line-height: 1.45;
          word-wrap: break-word;
          flex-grow: 1;
        }

        .chat-message.system {
          color: #718096;
          font-style: italic;
          padding: 4px 8px;
          background-color: rgba(255,255,255,0.02);
          border-radius: 4px;
        }

        .chat-message.admin-msg {
          background-color: rgba(179, 211, 50, 0.05);
          border-left: 2px solid #b3d332;
          padding: 4px 8px;
          border-radius: 2px;
        }

        .chat-username {
          font-weight: 800;
          margin-right: 8px;
          font-size: 0.82rem;
        }

        .chat-text {
          color: #e2e8f0;
        }

        .chat-input-bar {
          display: flex;
          padding: 10px 15px;
          background-color: #12141a;
          border-top: 1px solid #1a1c23;
        }

        .chat-input-bar input {
          flex-grow: 1;
          background-color: #090a0f;
          border: 1px solid #2d313f;
          border-radius: 4px;
          color: #fff;
          padding: 8px 12px;
          font-size: 0.85rem;
          outline: none;
        }

        .chat-input-bar input:focus {
          border-color: #b3d332;
        }

        .btn-send-chat {
          background-color: #2d313f;
          color: #fff;
          border: none;
          padding: 0 12px;
          border-radius: 4px;
          margin-left: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-send-chat:hover:not(:disabled) {
          background-color: #b3d332;
          color: #000;
        }

        .btn-send-chat:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Activity List */
        .activity-list {
          flex-grow: 1;
          overflow-y: auto;
          padding: 15px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background-color: #0a0b0e;
        }

        .activity-item {
          display: flex;
          gap: 12px;
          font-size: 0.82rem;
          line-height: 1.4;
        }

        .activity-time {
          color: #4a5568;
          font-weight: 700;
          white-space: nowrap;
        }

        .activity-text {
          color: #cbd5e0;
        }

        .activity-empty {
          color: #4a5568;
          font-size: 0.8rem;
          font-style: italic;
          text-align: center;
          margin-top: 30px;
        }

        /* Animations */
        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes wave {
          from { transform: translateY(0); }
          to { transform: translateY(-4px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Custom alert box */
        .custom-alert-box-v {
          position: fixed;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #0f1015;
          border: 1px solid #1f222b;
          border-radius: 8px;
          padding: 15px 30px;
          z-index: 10000;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          animation: slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .alert-content-v {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .alert-text-v {
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
        }

        @keyframes slideDown {
          from { transform: translate(-50%, -50px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        /* Switch Toggles Styles */
        .switch-container {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }

        .switch-container input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }

        .switch-slider {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 22px;
          background-color: #2d313f;
          border-radius: 30px;
          transition: all 0.3s ease;
          border: 1px solid #1f222b;
        }

        .switch-slider::before {
          content: "";
          position: absolute;
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 2px;
          background-color: #fff;
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .switch-container input:checked + .switch-slider {
          background-color: #b3d332;
          border-color: #b3d332;
        }

        .switch-container input:checked + .switch-slider::before {
          transform: translateX(20px);
          background-color: #000;
        }

        .switch-label-text {
          font-size: 0.85rem;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      ` }} />
    </div>
  );
};

export default LiveStreamDashboard;
