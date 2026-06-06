import React, { useState, useEffect, useRef, forwardRef, isValidElement } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { createPlayer } from '@videojs/react';
import { VideoSkin, videoFeatures } from '@videojs/react/video';
import { HlsVideo } from '@videojs/react/media/hls-video';
import '@videojs/react/video/skin.css';

const SEEK_TIME = 10;
export const Player = createPlayer({ features: videoFeatures });

const HtmlScriptExecutor = ({ html }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !html) return;

    container.innerHTML = '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find all script tags in the parsed doc
    const scriptElements = Array.from(doc.querySelectorAll('script'));

    // Remove script elements from doc so we can render elements first
    scriptElements.forEach(s => s.remove());

    // Clone and append remaining head styles/links
    const headNodes = Array.from(doc.head.childNodes);
    headNodes.forEach(node => {
      container.appendChild(node.cloneNode(true));
    });

    // Clone and append remaining body elements
    const bodyNodes = Array.from(doc.body.childNodes);
    bodyNodes.forEach(node => {
      container.appendChild(node.cloneNode(true));
    });

    // Run scripts sequentially
    let currentIdx = 0;
    const runNextScript = () => {
      if (currentIdx >= scriptElements.length) return;

      const originalScript = scriptElements[currentIdx];
      const newScript = document.createElement('script');

      // Copy attributes
      Array.from(originalScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (originalScript.src) {
        newScript.innerHTML = originalScript.innerHTML;
        newScript.onload = () => {
          currentIdx++;
          runNextScript();
        };
        newScript.onerror = () => {
          currentIdx++;
          runNextScript();
        };
      } else {
        // Wrap inline script code in an IIFE to prevent variable redeclaration errors in the global scope
        newScript.innerHTML = `(function(){\n${originalScript.innerHTML}\n})();`;
        // Inline scripts are executed synchronously upon appending
        setTimeout(() => {
          currentIdx++;
          runNextScript();
        }, 50);
      }

      container.appendChild(newScript);
    };

    runNextScript();
  }, [html]);

  return (
    <div 
      ref={containerRef} 
      className="html-script-executor-container"
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} 
    />
  );
};

function CentralControlsOverlay() {
  const paused = Player.usePlayer((s) => s.paused);
  const play = Player.usePlayer((s) => s.play);
  const pause = Player.usePlayer((s) => s.pause);
  const currentTime = Player.usePlayer((s) => s.currentTime);
  const seek = Player.usePlayer((s) => s.seek);
  const controlsVisible = Player.usePlayer((s) => s.controlsVisible);

  const lastClickRef = useRef({ time: 0, count: 0, side: null, amount: 0 });
  const [activeFeedback, setActiveFeedback] = useState(null); // { side: 'left' | 'right', amount: number, key: number }

  const handleZoneClick = (side, e) => {
    e.stopPropagation();
    const now = Date.now();
    const last = lastClickRef.current;

    // Check if within double/triple click time threshold (450ms)
    if (last.side === side && now - last.time < 450) {
      const nextCount = last.count + 1;
      let skipAmount = 0;
      let displayAmount = 0;

      if (nextCount === 2) {
        skipAmount = 2;
        displayAmount = 2;
      } else if (nextCount === 3) {
        // Triple click: we seek 3s more to make it 5s total
        skipAmount = 3;
        displayAmount = 5;
      } else if (nextCount === 4) {
        // Quad click: seek 5s more to make it 10s total
        skipAmount = 5;
        displayAmount = 10;
      } else {
        // Repeated clicks: keep seeking 10s more
        skipAmount = 10;
        displayAmount = last.amount + 10;
      }

      lastClickRef.current = { time: now, count: nextCount, side, amount: displayAmount };

      const targetTime = side === 'left' ? currentTime - skipAmount : currentTime + skipAmount;
      if (seek) seek(targetTime);

      setActiveFeedback({
        side,
        amount: displayAmount,
        key: now
      });
    } else {
      // First click: set timer to execute single click action
      lastClickRef.current = { time: now, count: 1, side, amount: 0 };

      setTimeout(() => {
        const currentLast = lastClickRef.current;
        if (currentLast.side === side && currentLast.count === 1 && Date.now() - currentLast.time >= 250) {
          // Single tap toggles play/pause
          if (paused) {
            if (play) play();
          } else {
            if (pause) pause();
          }
          lastClickRef.current = { time: 0, count: 0, side: null, amount: 0 };
        }
      }, 260);
    }
  };

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (paused) {
      if (play) play();
    } else {
      if (pause) pause();
    }
  };

  const isVisible = controlsVisible || paused;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .premium-aspect-ratio-btn:hover {
          background: rgba(255,255,255,0.15) !important;
          border-color: #b3d332 !important;
          transform: scale(1.05);
        }

        .central-controls-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0);
          backdrop-filter: blur(0px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 5;
        }

        .central-controls-overlay.visible {
          opacity: 1;
          pointer-events: auto;
          backdrop-filter: blur(1.5px);
          background: rgba(0, 0, 0, 0.35);
        }

        .central-click-zone {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 35%;
          cursor: pointer;
          z-index: 1;
        }

        .left-zone {
          left: 0;
        }

        .right-zone {
          right: 0;
        }

        .center-control-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          z-index: 2;
          pointer-events: auto;
        }

        .central-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          color: #ffffff;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          user-select: none;
        }

        .central-btn.skip-btn {
          width: 56px;
          height: 56px;
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          backdrop-filter: none !important;
        }

        .central-btn.skip-btn:hover {
          transform: scale(1.25);
          background: transparent !important;
        }

        .central-btn.skip-btn:active {
          transform: scale(0.9);
        }

        .central-btn.play-pause-btn {
          position: relative;
          width: 76px;
          height: 76px;
          background: var(--media-brand, #b3d332);
          color: var(--media-brand-text, #ffffff);
          box-shadow: 0 8px 25px rgba(var(--media-brand-rgb, 179, 211, 50), 0.4);
        }

        .central-btn.play-pause-btn:hover {
          transform: scale(1.1);
          filter: brightness(1.08);
          box-shadow: 0 10px 30px rgba(var(--media-brand-rgb, 179, 211, 50), 0.6);
        }

        .central-btn.play-pause-btn:active {
          transform: scale(0.95);
        }

        /* Dynamic Sonar Pulsing Waves when paused */
        .central-btn.play-pause-btn.is-paused::before,
        .central-btn.play-pause-btn.is-paused::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--media-brand, #b3d332);
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        }

        .central-btn.play-pause-btn.is-paused::before {
          animation: play-pause-sonar 2s infinite cubic-bezier(0.25, 0, 0, 1);
        }

        .central-btn.play-pause-btn.is-paused::after {
          animation: play-pause-sonar 2s infinite cubic-bezier(0.25, 0, 0, 1);
          animation-delay: 1s;
        }

        @keyframes play-pause-sonar {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.75);
            opacity: 0;
          }
        }

        /* Skip ripple & text animation */
        @keyframes ripple-wave-left {
          0% {
            opacity: 0.5;
            transform: scale(0.4) translateX(-40%);
            border-radius: 50%;
          }
          100% {
            opacity: 0;
            transform: scale(1.8) translateX(0%);
            border-radius: 0 100px 100px 0;
          }
        }

        @keyframes ripple-wave-right {
          0% {
            opacity: 0.5;
            transform: scale(0.4) translateX(40%);
            border-radius: 50%;
          }
          100% {
            opacity: 0;
            transform: scale(1.8) translateX(0%);
            border-radius: 100px 0 0 100px;
          }
        }

        @keyframes text-pop {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1.15); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }

        .skip-feedback {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 35%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          overflow: hidden;
          z-index: 4;
        }

        .left-feedback {
          left: 0;
        }

        .right-feedback {
          right: 0;
        }

        .skip-ripple {
          position: absolute;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.15);
          top: 0;
          pointer-events: none;
        }

        .left-feedback .skip-ripple {
          left: 0;
          transform-origin: left center;
          animation: ripple-wave-left 0.65s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }

        .right-feedback .skip-ripple {
          right: 0;
          transform-origin: right center;
          animation: ripple-wave-right 0.65s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }

        .skip-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #ffffff;
          font-family: sans-serif;
          font-size: 15px;
          font-weight: 800;
          text-shadow: 0 2px 10px rgba(0,0,0,0.6);
          animation: text-pop 0.65s ease-out forwards;
          z-index: 2;
        }

        /* Transient Mid-Screen Play/Pause Animation */
        @keyframes transient-scale-fade {
          0% { transform: scale(0.6); opacity: 0; }
          30% { transform: scale(1.15); opacity: 0.85; }
          75% { transform: scale(1); opacity: 0.85; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        .transient-play-pause-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 6;
        }

        .transient-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 84px;
          height: 84px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          color: #ffffff;
          animation: transient-scale-fade 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }

        /* Hide default play buttons */
        .media-default-skin .media-button--play-large,
        .media-default-skin .media-play-large-button,
        .vjs-big-play-button {
          display: none !important;
        }
      ` }} />

      {/* Floating Skip Feedback Wave & Text */}
      {activeFeedback && activeFeedback.side === 'left' && (
        <div key={activeFeedback.key} className="skip-feedback left-feedback">
          <div className="skip-ripple"></div>
          <div className="skip-text">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
            </svg>
            <span>-{activeFeedback.amount}s</span>
          </div>
        </div>
      )}

      {activeFeedback && activeFeedback.side === 'right' && (
        <div key={activeFeedback.key} className="skip-feedback right-feedback">
          <div className="skip-ripple"></div>
          <div className="skip-text">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
            </svg>
            <span>+{activeFeedback.amount}s</span>
          </div>
        </div>
      )}



      <div 
        className={`central-controls-overlay ${isVisible ? 'visible' : ''}`}
        onClick={handlePlayPause}
      >
        {/* Invisible Click/Double-click zones */}
        <div className="central-click-zone left-zone" onClick={(e) => handleZoneClick('left', e)} />
        <div className="central-click-zone right-zone" onClick={(e) => handleZoneClick('right', e)} />

        <div className="center-control-wrapper">
          <button 
            type="button"
            className={`central-btn play-pause-btn ${paused ? 'is-paused' : ''}`}
            onClick={handlePlayPause}
            title={paused ? "Play" : "Pause"}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" style={{ marginLeft: '4px' }}><path d="M8 5v14l11-7z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// helper to convert hh:mm:ss to seconds
const timeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(timeStr) || 0;
};

// Video.js (HlsVideo) controller component to handle play/pause sync and ads timing
function AdsController({ isAdPlaying, adsConfig, playedAdsRef, triggerAd, vastPreRoll }) {
  const paused = Player.usePlayer((s) => s.paused);
  const play = Player.usePlayer((s) => s.play);
  const pause = Player.usePlayer((s) => s.pause);
  const currentTime = Player.usePlayer((s) => s.currentTime);

  // Monitor currentTime to trigger ads
  useEffect(() => {
    if (!adsConfig) return;

    // 1. Handle VAST Pre-roll at 0 seconds
    if (adsConfig.defaultAds === 'VAST, VMAP and IMA' && vastPreRoll && !playedAdsRef.current.has('vast')) {
      playedAdsRef.current.add('vast');
      if (!paused && pause) {
        pause(); // Pause main video
      }
      triggerAd(vastPreRoll.mediaUrl, vastPreRoll.clickUrl);
      return;
    }

    // 2. Handle Built-in Ads
    if (adsConfig.defaultAds === 'Built-in Advertisement') {
      const checkAd = (num) => {
        const source = adsConfig[`ad${num}Source`];
        const timeStr = adsConfig[`ad${num}Timestart`];
        const targetLink = adsConfig[`ad${num}TargetLink`];

        if (source && timeStr && !playedAdsRef.current.has(String(num))) {
          const adStart = timeToSeconds(timeStr);
          if (currentTime >= adStart && currentTime < adStart + 5) {
            playedAdsRef.current.add(String(num));
            if (!paused && pause) {
              pause(); // Pause main video
            }
            triggerAd(source, targetLink);
          }
        }
      };

      checkAd(1);
      checkAd(2);
      checkAd(3);
    }
  }, [currentTime, adsConfig, vastPreRoll, paused, pause, triggerAd, playedAdsRef]);

  // Keep it paused during ad playback
  useEffect(() => {
    if (isAdPlaying && !paused && pause) {
      pause(); // Force pause
    }
  }, [isAdPlaying, paused, pause]);

  // Resume playback once ad is finished
  const prevAdPlaying = useRef(false);
  const playRef = useRef(play);
  const pausedRef = useRef(paused);

  useEffect(() => {
    playRef.current = play;
    pausedRef.current = paused;
  }, [play, paused]);

  useEffect(() => {
    if (prevAdPlaying.current && !isAdPlaying) {
      if (pausedRef.current && playRef.current) {
        playRef.current(); // Force resume
      }
    }
    prevAdPlaying.current = isAdPlaying;
  }, [isAdPlaying]);

  return null;
}

// ================================================================
// Main Video Player
// ================================================================

const VideoPlayer = ({ src, onEnded, onTimeUpdate, subtitles, subtitlesActive, videoTitle, videoId, userId, playerSettings, className, poster, ...rest }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  // Read active video player configuration directly from environment variables (.env)
  const activePlayer = import.meta.env.VITE_ACTIVE_PLAYER || 'MUX_PLAYER';

  // Gating & Playback Ads Configuration state
  const [adsConfig, setAdsConfig] = useState(null);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adMediaUrl, setAdMediaUrl] = useState('');
  const [adClickUrl, setAdClickUrl] = useState('');
  const [adSecondsLeft, setAdSecondsLeft] = useState(0);
  const [userShouldSeeAds, setUserShouldSeeAds] = useState(false);
  const [vastPreRoll, setVastPreRoll] = useState(null);
  const playedAdsRef = useRef(new Set());
  const timerRef = useRef(null);
  const [aspectRatioMode, setAspectRatioMode] = useState('contain'); // 'contain' | 'fill' | 'cover'

  useEffect(() => {
    const checkUserGating = () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const role = storedUser.role;
        console.log('[DEBUG-ADS] checkUserGating - User Role:', role);
        if (role === 'admin' || role === 'sub-admin') {
          console.log('[DEBUG-ADS] checkUserGating - User is Admin/Sub-Admin. Gating bypassed (Ads disabled).');
          return false; // Admins skip ads
        }
        const planName = (storedUser.subscriptionPlan || 'Basic Plan').toLowerCase();
        const isPremiumUser = planName.includes('premium') || planName.includes('platinum') || planName.includes('pro');
        
        let isExpired = false;
        if (storedUser.expiryDate) {
          const expiry = new Date(storedUser.expiryDate);
          if (expiry < new Date()) {
            isExpired = true;
          }
        }
        
        console.log('[DEBUG-ADS] checkUserGating - Plan:', planName, '| Premium:', isPremiumUser, '| Expired:', isExpired);
        if (isPremiumUser && !isExpired) {
          console.log('[DEBUG-ADS] checkUserGating - User is Premium. Gating bypassed (Ads disabled).');
          return false; // Active Premium subscription, skip ads
        }
      } catch (e) {
        console.error('[DEBUG-ADS] Error parsing user for ad-gating:', e);
      }
      console.log('[DEBUG-ADS] checkUserGating - Gating active. User should see ads.');
      return true; // Basic, Guest, Expired see ads
    };

    const shouldShow = checkUserGating();
    setUserShouldSeeAds(shouldShow);

    if (shouldShow) {
      fetch('/api/player-ads')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch player ads');
        })
        .then(data => {
          setAdsConfig(data);
          // If defaultAds is VAST, VMAP and IMA, trigger VAST proxy fetch right away for pre-roll
          if (data && data.defaultAds === 'VAST, VMAP and IMA' && data.sourceUrl) {
            fetch(`/api/vast-proxy?url=${encodeURIComponent(data.sourceUrl)}`)
              .then(res => {
                if (!res.ok) throw new Error('VAST Proxy request failed');
                return res.json();
              })
              .then(vastData => {
                if (vastData.mediaUrl) {
                  setVastPreRoll(vastData);
                }
              })
              .catch(err => console.error('[VAST Fetch Error]:', err));
          }
        })
        .catch(err => console.error('Error fetching ads settings:', err));
    }
  }, []);

  const triggerAd = (mediaUrl, clickUrl) => {
    if (!mediaUrl) return;
    setAdMediaUrl(mediaUrl);
    setAdClickUrl(clickUrl || '#');
    setIsAdPlaying(true);
    setAdSecondsLeft(5); // Minimum 5 seconds to skip ad

    // Pause the Mux Player
    if (activePlayer === 'MUX_PLAYER' && playerRef.current) {
      try {
        playerRef.current.pause();
      } catch (e) {
        console.error('Failed to pause Mux Player:', e);
      }
    }

    // Set countdown timer
    if (timerRef.current) clearInterval(timerRef.current);
    let timeRemaining = 5;
    timerRef.current = setInterval(() => {
      timeRemaining -= 1;
      setAdSecondsLeft(timeRemaining);
      if (timeRemaining <= 0) {
        clearInterval(timerRef.current);
      }
    }, 1000);
  };

  const skipAd = () => {
    setIsAdPlaying(false);
    setAdMediaUrl('');
    setAdClickUrl('');
    if (timerRef.current) clearInterval(timerRef.current);

    // Resume playback of Mux Player
    if (activePlayer === 'MUX_PLAYER' && playerRef.current) {
      try {
        playerRef.current.play();
      } catch (e) {
        console.error('Failed to play Mux Player:', e);
      }
    }
  };

  const handleAdClick = (e) => {
    e.stopPropagation();
    if (adClickUrl && adClickUrl !== '#') {
      window.open(adClickUrl, '_blank');
    }
  };

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Force Mux Player to stay paused when ad is playing
  useEffect(() => {
    if (isAdPlaying && activePlayer === 'MUX_PLAYER' && playerRef.current) {
      const keepPaused = () => {
        try {
          playerRef.current.pause();
        } catch (e) {}
      };
      playerRef.current.addEventListener('play', keepPaused);
      return () => {
        if (playerRef.current) {
          playerRef.current.removeEventListener('play', keepPaused);
        }
      };
    }
  }, [isAdPlaying, activePlayer]);

  const handleMuxTimeUpdate = (currentTime, duration) => {
    if (onTimeUpdate) {
      onTimeUpdate(currentTime, duration);
    }

    if (!userShouldSeeAds || !adsConfig) return;

    // 1. Handle VAST Pre-roll at 0 seconds
    if (adsConfig.defaultAds === 'VAST, VMAP and IMA' && vastPreRoll && !playedAdsRef.current.has('vast')) {
      playedAdsRef.current.add('vast');
      triggerAd(vastPreRoll.mediaUrl, vastPreRoll.clickUrl);
      return;
    }

    // 2. Handle Built-in Ads
    if (adsConfig.defaultAds === 'Built-in Advertisement') {
      const checkAd = (num) => {
        const source = adsConfig[`ad${num}Source`];
        const timeStr = adsConfig[`ad${num}Timestart`];
        const targetLink = adsConfig[`ad${num}TargetLink`];

        if (source && timeStr && !playedAdsRef.current.has(String(num))) {
          const adStart = timeToSeconds(timeStr);
          if (currentTime >= adStart && currentTime < adStart + 5) {
            playedAdsRef.current.add(String(num));
            triggerAd(source, targetLink);
          }
        }
      };

      checkAd(1);
      checkAd(2);
      checkAd(3);
    }
  };

  const getAdMediaUrlNormalized = () => {
    if (!adMediaUrl) return '';
    if (adMediaUrl.startsWith('http') || adMediaUrl.startsWith('//') || adMediaUrl.startsWith('/')) {
      return adMediaUrl;
    }
    let normalized = adMediaUrl;
    if (normalized.startsWith('upload/')) {
      normalized = 'uploads/' + normalized.substring(7);
    }
    return `/${normalized}`;
  };

  // HLS/m3u8 capable ad player supporting autoplay bypass
  const AdVideoPlayer = ({ src, onEnded }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      let hlsInstance = null;

      const initPlayer = () => {
        if (src.toLowerCase().includes('.m3u8')) {
          if (window.Hls) {
            if (window.Hls.isSupported()) {
              hlsInstance = new window.Hls();
              hlsInstance.loadSource(src);
              hlsInstance.attachMedia(video);
              hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(err => {
                  console.log('[AdPlayer] Hls Autoplay blocked, trying muted play:', err);
                  video.muted = true;
                  video.play().catch(e => console.error('[AdPlayer] Muted autoplay also failed:', e));
                });
              });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = src;
              video.play().catch(err => {
                console.log('[AdPlayer] Native Hls Autoplay blocked, trying muted play:', err);
                video.muted = true;
                video.play().catch(e => console.error('[AdPlayer] Native muted autoplay failed:', e));
              });
            }
          } else {
            // Hls object not loaded on window, fallback to standard source
            video.src = src;
            video.play().catch(err => {
              console.log('[AdPlayer] Standard Autoplay blocked, trying muted play:', err);
              video.muted = true;
              video.play().catch(e => console.error('[AdPlayer] Standard muted autoplay failed:', e));
            });
          }
        } else {
          video.src = src;
          video.play().catch(err => {
            console.log('[AdPlayer] Video Autoplay blocked, trying muted play:', err);
            video.muted = true;
            video.play().catch(e => console.error('[AdPlayer] Video muted autoplay failed:', e));
          });
        }
      };

      if (src.toLowerCase().includes('.m3u8') && !window.Hls) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.async = true;
        script.onload = () => {
          initPlayer();
        };
        document.head.appendChild(script);
      } else {
        initPlayer();
      }

      return () => {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      };
    }, [src]);

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={false}
        onContextMenu={(e) => e.preventDefault()}
        onEnded={onEnded}
        onError={onEnded} // Skip ad if video source fails to load
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    );
  };

  const renderAdOverlay = () => {
    const normalizedAdMediaUrl = getAdMediaUrlNormalized();
    const isAdVideo = normalizedAdMediaUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov|m3u8)$/) || 
                      normalizedAdMediaUrl.includes('video') || 
                      normalizedAdMediaUrl.includes('/uploads/');

    return (
      <div 
        className="premium-ad-overlay"
        onClick={handleAdClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: adClickUrl && adClickUrl !== '#' ? 'pointer' : 'default'
        }}
      >
        {/* Header */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '30px',
          right: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          width: 'calc(100% - 60px)'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff'
          }}>
            Advertisement
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              skipAd();
            }}
            disabled={adSecondsLeft > 0}
            style={{
              pointerEvents: 'auto',
              background: adSecondsLeft > 0 ? 'rgba(255,255,255,0.1)' : '#b3d332',
              color: adSecondsLeft > 0 ? 'rgba(255,255,255,0.4)' : '#000',
              border: adSecondsLeft > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              padding: '10px 24px',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: adSecondsLeft > 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {adSecondsLeft > 0 ? `Skip Ad in ${adSecondsLeft}s` : 'Skip Ad'}
          </button>
        </div>

        {/* Ad Media */}
        <div style={{
          width: '85%',
          height: '75%',
          maxWidth: '960px',
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {isAdVideo ? (
            <AdVideoPlayer src={normalizedAdMediaUrl} onEnded={skipAd} />
          ) : (
            <img
              src={normalizedAdMediaUrl}
              alt="Advertisement"
              onError={skipAd} // Skip ad if image source fails to load
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          )}
        </div>
      </div>
    );
  };


  // activePlayer is declared at the top of the component to prevent TDZ issues

  // Compute dynamic player styling parameters based on playerSettings
  const isBlueAccent = playerSettings?.playerStyle === 'Blue Accent';
  const isModernLight = playerSettings?.playerStyle === 'Modern Light';
  
  const accentColor = isBlueAccent 
    ? '#0070f3' 
    : isModernLight 
      ? '#ffffff' 
      : '#b3d332'; // Brand green

  const accentRgb = isBlueAccent 
    ? '0, 112, 243' 
    : isModernLight 
      ? '255, 255, 255' 
      : '179, 211, 50';

  const accentText = isModernLight ? '#000000' : '#ffffff';
  const isAutoplayEnabled = playerSettings?.autoplay === 'YES';
  const isRewindForwardEnabled = playerSettings?.rewindForward !== 'NO';

  // Helper to extract playback ID if it's a Mux stream
  const getPlaybackId = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    // Support raw 46-character Mux playback IDs directly
    if (/^[a-zA-Z0-9]{46}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/(?:stream\.mux\.com|player\.mux\.com)\/([a-zA-Z0-9]+)/);
    if (match && match[1]) return match[1];
    return null;
  };

  const playbackId = getPlaybackId(src);
  const [signedToken, setSignedToken] = useState(null);
  const [loadingToken, setLoadingToken] = useState(false);

  useEffect(() => {
    if (playbackId) {
      setLoadingToken(true);
      fetch(`/api/mux/sign-token?playbackId=${playbackId}`)
        .then(res => {
          if (!res.ok) throw new Error('Token API failed');
          return res.json();
        })
        .then(data => {
          setSignedToken(data.token || null);
        })
        .catch(err => {
          console.error('Error fetching Mux signed token:', err);
          setSignedToken(null);
        })
        .finally(() => {
          setLoadingToken(false);
        });
    } else {
      setSignedToken(null);
      setLoadingToken(false);
    }
  }, [playbackId]);

  const [resolvedYoutubeLiveSrc, setResolvedYoutubeLiveSrc] = useState(null);
  const [resolvingYoutubeLive, setResolvingYoutubeLive] = useState(false);

  useEffect(() => {
    setResolvedYoutubeLiveSrc(null);
    if (!src) return;

    const isYt = src.includes('youtube.com') || src.includes('youtu.be');
    if (isYt) {
      setResolvingYoutubeLive(true);
      const host = window.location.hostname || 'localhost';
      const backendUrl = `http://${host}:5001/api/youtube/live-m3u8?url=${encodeURIComponent(src.trim())}`;
      fetch(backendUrl)
        .then(res => {
          if (!res.ok) throw new Error('Not a live stream or resolution failed');
          return res.json();
        })
        .then(data => {
          if (data.m3u8Url) {
            console.log('Resolved YouTube Live HLS stream:', data.m3u8Url);
            setResolvedYoutubeLiveSrc(data.m3u8Url);
          }
        })
        .catch(err => {
          console.log('YouTube Live HLS resolution skipped/failed:', err.message);
        })
        .finally(() => {
          setResolvingYoutubeLive(false);
        });
    }
  }, [src]);

  const getStreamSrc = () => {
    if (resolvedYoutubeLiveSrc) {
      return resolvedYoutubeLiveSrc;
    }
    if (signedToken && src && src.includes('stream.mux.com')) {
      return `${src}${src.includes('?') ? '&' : '?'}token=${signedToken}`;
    }
    if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('/')) {
      let normalized = src;
      if (normalized.startsWith('upload/')) {
        normalized = 'uploads/' + normalized.substring(7);
      }
      return `/${normalized}`;
    }
    return src;
  };

  const getEmbedInfo = (url) => {
    if (!url) return { isEmbed: false, type: null, src: null };
    const trimmed = url.trim();
    if (trimmed.startsWith('<iframe') || trimmed.startsWith('<div') || trimmed.includes('<script')) {
      return { isEmbed: true, type: 'html', src: trimmed };
    }
    
    // YouTube
    const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|live)\/|watch\?v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const ytMatch = trimmed.match(ytReg);
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${isAutoplayEnabled ? 1 : 0}&enablejsapi=1&rel=0`;
      return { isEmbed: true, type: 'youtube', src: embedUrl };
    }

    // Vimeo
    const vimeoReg = /(vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
    const vimeoMatch = trimmed.match(vimeoReg);
    if (vimeoMatch && vimeoMatch[2]) {
      const videoId = vimeoMatch[2];
      const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${isAutoplayEnabled ? 1 : 0}&dnt=1`;
      return { isEmbed: true, type: 'vimeo', src: embedUrl };
    }

    return { isEmbed: false, type: null, src: url };
  };

  const embedInfo = getEmbedInfo(src);
  const isHtmlEmbed = embedInfo.isEmbed && !resolvedYoutubeLiveSrc;

  // Filter subtitles that have valid URLs
  const activeSubs = (subtitles || []).filter(sub => sub && sub.url && sub.url.trim() !== '');

  const getViewerUserId = () => {
    if (userId) return userId;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user._id || 'guest-viewer';
    } catch (e) {
      return 'guest-viewer';
    }
  };

  const metadata = {
    video_id: videoId || 'unknown-id',
    video_title: videoTitle || 'Lemo OTT Stream',
    viewer_user_id: getViewerUserId(),
    player_name: `Lemo Premium ${activePlayer}`
  };

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    "--media-brand": accentColor,
    "--media-brand-rgb": accentRgb,
    "--media-brand-text": accentText
  };

  const playerStyle = {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    objectFit: aspectRatioMode,
    outline: 'none'
  };

  // Explicit CSS variables to force all controls to show up on Mux Player
  const muxPlayerStyle = {
    ...playerStyle,
    objectFit: aspectRatioMode,
    "--playback-rate-button": "inline-flex",
    "--rendition-menu-button": "inline-flex",
    "--audio-track-menu-button": "inline-flex",
    "--captions-button": "inline-flex",
    "--pip-button": "inline-flex",
    "--fullscreen-button": "inline-flex",
    "--volume-range": "inline-flex",
    "--time-range": "inline-flex"
  };

  const getWatermarkUrl = (logo) => {
    if (!logo) return '';
    if (logo.startsWith('http://') || logo.startsWith('https://')) return logo;
    return `/${logo}`;
  };

  const getWatermarkStyle = (position) => {
    const pos = (position || 'Top Right').toLowerCase();
    const style = { position: 'absolute', zIndex: 10 };
    if (pos.includes('top')) style.top = '20px';
    if (pos.includes('bottom')) style.bottom = '20px';
    if (pos.includes('left')) style.left = '20px';
    if (pos.includes('right')) style.right = '20px';
    return style;
  };

  // --- RENDERING PIPELINE ---

  if (isHtmlEmbed) {
    return (
      <div className="premium-player-wrapper" style={containerStyle} onContextMenu={(e) => e.preventDefault()}>
        {embedInfo.type === 'html' ? (
          <HtmlScriptExecutor html={embedInfo.src} />
        ) : (
          <iframe 
            src={embedInfo.src}
            title={videoTitle || "Video Player"}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', minHeight: '450px', border: 'none', borderRadius: '12px' }}
          />
        )}
      </div>
    );
  }

  if (loadingToken || resolvingYoutubeLive) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '450px', background: '#000', color: '#fff', gap: '15px' }}>
        <div className="token-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: accentColor, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ fontFamily: 'sans-serif', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.5px', color: '#aaa' }}>
          {resolvingYoutubeLive ? 'Resolving live stream...' : 'Securing stream...'}
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        ` }} />
      </div>
    );
  }

  // 1. Render Mux Player if playback ID is present and activePlayer is MUX_PLAYER
  if (activePlayer === 'MUX_PLAYER' && playbackId) {
    return (
      <div style={containerStyle} onContextMenu={(e) => e.preventDefault()}>
        <MuxPlayer
          ref={playerRef}
          playbackId={playbackId}
          tokens={signedToken ? { playback: signedToken } : undefined}
          accentColor={accentColor}
          playsInline
          autoPlay={isAutoplayEnabled ? 'any' : false}
          playbackEngine="mse"
          forwardSeekOffset={10}
          backwardSeekOffset={10}
          playbackRates={[0.5, 1, 1.25, 1.5, 2]}
          onEnded={onEnded}
          onPlay={(e) => {
            if (isAdPlaying) {
              try {
                e.target.pause();
              } catch (err) {}
            }
          }}
          onTimeUpdate={(e) => {
            handleMuxTimeUpdate(e.target.currentTime, e.target.duration);
          }}
          style={muxPlayerStyle}
          metadata={metadata}
          fullscreenElement="lemo-premium-player-container"
        />
        {/* Aspect Ratio Toggle Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setAspectRatioMode(prev => {
              if (prev === 'contain') return 'fill';
              if (prev === 'fill') return 'cover';
              return 'contain';
            });
          }}
          className="premium-aspect-ratio-btn"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            {aspectRatioMode === 'fill' && <path d="M7 7h10v10H7z" fill="currentColor"/>}
            {aspectRatioMode === 'cover' && <path d="M3 12h18M12 3v18"/>}
          </svg>
          {aspectRatioMode === 'contain' ? 'FIT' : aspectRatioMode === 'fill' ? 'STRETCH' : 'ZOOM'}
        </button>

        {/* Floating Watermark Layer */}
        {playerSettings?.watermark === 'YES' && playerSettings?.watermarkLogo && (
          <a 
            href={playerSettings.watermarkUrl && playerSettings.watermarkUrl !== '#' ? playerSettings.watermarkUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`premium-player-watermark position-${(playerSettings.watermarkPosition || 'Top Right').toLowerCase().replace(' ', '-')}`}
            style={getWatermarkStyle(playerSettings.watermarkPosition)}
          >
            <img 
              src={getWatermarkUrl(playerSettings.watermarkLogo)} 
              alt="Watermark" 
              style={{ maxHeight: '35px', opacity: 0.7 }}
            />
          </a>
        )}
        {/* Ad Overlay */}
        {isAdPlaying && adMediaUrl && renderAdOverlay()}
      </div>
    );
  }

  // 2. Render V10 @videojs/react Player (HLS, DASH, MP4, etc.)
  return (
    <Player.Provider>
      <VideoSkin
        poster={poster}
        className={className}
        style={containerStyle}
        onContextMenu={(e) => e.preventDefault()}
        {...rest}
      >
        <HlsVideo 
          src={getStreamSrc()} 
          playsInline 
          crossOrigin="anonymous"
          autoPlay={isAutoplayEnabled}
          onEnded={onEnded}
          onTimeUpdate={(e) => {
            if (onTimeUpdate) {
              onTimeUpdate(e.target.currentTime, e.target.duration);
            }
          }}
          style={playerStyle}
        >
          {subtitlesActive === 'Active' && activeSubs.map((sub, idx) => (
            <track
              key={idx}
              kind="subtitles"
              src={sub.url}
              srcLang={sub.language ? sub.language.toLowerCase().substring(0, 2) : 'en'}
              label={sub.language || 'English'}
              default={idx === 0}
            />
          ))}
        </HlsVideo>

        {/* Central controls overlay (Big play/pause, backward/forward skip) */}
        <CentralControlsOverlay />

        {/* AdsController */}
        {userShouldSeeAds && adsConfig && (
          <AdsController 
            isAdPlaying={isAdPlaying} 
            adsConfig={adsConfig} 
            playedAdsRef={playedAdsRef} 
            triggerAd={triggerAd} 
            vastPreRoll={vastPreRoll} 
          />
        )}

        {/* Aspect Ratio Toggle Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setAspectRatioMode(prev => {
              if (prev === 'contain') return 'fill';
              if (prev === 'fill') return 'cover';
              return 'contain';
            });
          }}
          className="premium-aspect-ratio-btn"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            {aspectRatioMode === 'fill' && <path d="M7 7h10v10H7z" fill="currentColor"/>}
            {aspectRatioMode === 'cover' && <path d="M3 12h18M12 3v18"/>}
          </svg>
          {aspectRatioMode === 'contain' ? 'FIT' : aspectRatioMode === 'fill' ? 'STRETCH' : 'ZOOM'}
        </button>

        {/* Floating Watermark Layer */}
        {playerSettings?.watermark === 'YES' && playerSettings?.watermarkLogo && (
          <a 
            href={playerSettings.watermarkUrl && playerSettings.watermarkUrl !== '#' ? playerSettings.watermarkUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`premium-player-watermark position-${(playerSettings.watermarkPosition || 'Top Right').toLowerCase().replace(' ', '-')}`}
            style={getWatermarkStyle(playerSettings.watermarkPosition)}
          >
            <img 
              src={getWatermarkUrl(playerSettings.watermarkLogo)} 
              alt="Watermark" 
              style={{ maxHeight: '35px', opacity: 0.7 }}
            />
          </a>
        )}

        {/* Ad Overlay */}
        {isAdPlaying && adMediaUrl && renderAdOverlay()}
      </VideoSkin>
    </Player.Provider>
  );
};

export default VideoPlayer;
