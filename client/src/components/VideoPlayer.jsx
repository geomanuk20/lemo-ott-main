import React, { useState, useEffect, useRef, forwardRef, isValidElement, useMemo } from 'react';
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

function CentralControlsOverlay({ isLive }) {
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

    // Disable skip/seek double-tap actions if this is a live stream
    if (isLive) {
      if (now - last.time < 450) {
        return;
      }
      lastClickRef.current = { time: now, count: 1, side, amount: 0 };
      setTimeout(() => {
        const currentLast = lastClickRef.current;
        if (currentLast.side === side && currentLast.count === 1 && Date.now() - currentLast.time >= 250) {
          if (paused) {
            if (play) play();
          } else {
            if (pause) pause();
          }
          lastClickRef.current = { time: 0, count: 0, side: null, amount: 0 };
        }
      }, 260);
      return;
    }

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

// Custom Subtitles Dropdown that intercepts native CC button clicks
function SubtitlesDropdown({ processedSubs, activeTrackIdx, setActiveTrackIdx, containerRef }) {
  const paused = Player.usePlayer((s) => s.paused);
  const controlsVisible = Player.usePlayer((s) => s.controlsVisible);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({ display: 'none' });
  const dropdownRef = useRef(null);

  const findCcButton = () => {
    if (!containerRef.current) return null;
    return containerRef.current.querySelector(
      '.vjs-captions-button, .vjs-subs-caps-button, .media-button--captions, [part="captions-button"], vds-captions-button, .vds-captions-button'
    );
  };

  useEffect(() => {
    let ccButton = findCcButton();

    const handleCcClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDropdown(prev => !prev);
    };

    if (ccButton) {
      ccButton.addEventListener('click', handleCcClick, true);
    }

    const observer = new MutationObserver(() => {
      const currentCcButton = findCcButton();
      if (currentCcButton !== ccButton) {
        if (ccButton) {
          ccButton.removeEventListener('click', handleCcClick, true);
        }
        ccButton = currentCcButton;
        if (ccButton) {
          ccButton.addEventListener('click', handleCcClick, true);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      if (ccButton) {
        ccButton.removeEventListener('click', handleCcClick, true);
      }
    };
  }, [containerRef]);

  useEffect(() => {
    if (!showDropdown || !controlsVisible) {
      setDropdownStyle({ display: 'none' });
      return;
    }

    const ccButton = findCcButton();
    if (!ccButton || !containerRef.current) {
      setDropdownStyle({ display: 'none' });
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const buttonRect = ccButton.getBoundingClientRect();

    const rightOffset = containerRect.right - buttonRect.right;
    const bottomOffset = containerRect.bottom - buttonRect.top + 8;

    setDropdownStyle({
      position: 'absolute',
      bottom: `${bottomOffset}px`,
      right: `${rightOffset}px`,
      zIndex: 1000,
      display: 'block'
    });
  }, [showDropdown, controlsVisible, containerRef]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const ccButton = findCcButton();
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) &&
        (!ccButton || !ccButton.contains(e.target))
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    if (!controlsVisible && !paused) {
      setShowDropdown(false);
    }
  }, [controlsVisible, paused]);

  const isSubActive = activeTrackIdx !== -1;
  const shouldShowMenu = showDropdown && (controlsVisible || paused);

  return (
    <>
      {isSubActive && (
        <style dangerouslySetInnerHTML={{ __html: `
          .vjs-captions-button,
          .vjs-subs-caps-button,
          .media-button--captions,
          [part="captions-button"],
          vds-captions-button,
          .vds-captions-button {
            color: #b3d332 !important;
          }
          .vjs-captions-button svg,
          .vjs-subs-caps-button svg,
          .media-button--captions svg,
          [part="captions-button"] svg,
          vds-captions-button svg,
          .vds-captions-button svg,
          .vjs-captions-button svg path,
          .vjs-subs-caps-button svg path,
          .media-button--captions svg path,
          [part="captions-button"] svg path,
          vds-captions-button svg path,
          .vds-captions-button svg path {
            fill: #b3d332 !important;
            stroke: #b3d332 !important;
          }
        ` }} />
      )}
      {shouldShowMenu && (
        <div 
          ref={dropdownRef} 
          style={dropdownStyle}
          className="subtitles-dropdown-container"
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .subtitles-dropdown-container {
              animation: subDropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            @keyframes subDropdownFadeIn {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .subtitles-dropdown-item {
              padding: 8px 16px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: space-between;
              transition: background 0.2s, color 0.2s;
            }
            .subtitles-dropdown-item:hover {
              background: rgba(255, 255, 255, 0.12) !important;
              color: #b3d332;
            }
          ` }} />
          <div style={{
            background: 'rgba(20, 20, 20, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '8px 0',
            minWidth: '140px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            fontFamily: 'sans-serif',
            fontSize: '0.85rem'
          }}>
            <div style={{
              padding: '4px 12px 8px 12px',
              fontWeight: 600,
              color: '#888',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '4px'
            }}>
              Subtitles
            </div>
            
            <div 
              onClick={() => {
                setActiveTrackIdx(-1);
                setShowDropdown(false);
              }}
              className="subtitles-dropdown-item"
              style={{
                background: activeTrackIdx === -1 ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}
            >
              <span>Off</span>
              {activeTrackIdx === -1 && (
                <span style={{ color: '#b3d332', fontSize: '0.9rem' }}>✓</span>
              )}
            </div>

            {processedSubs.map((sub, idx) => {
              const isSelected = activeTrackIdx === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    setActiveTrackIdx(idx);
                    setShowDropdown(false);
                  }}
                  className="subtitles-dropdown-item"
                  style={{
                    background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                  }}
                >
                  <span>{sub.language || `Track ${idx + 1}`}</span>
                  {isSelected && (
                    <span style={{ color: '#b3d332', fontSize: '0.9rem' }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ================================================================
// Main Video Player
// ================================================================

const VideoPlayer = ({ src, onEnded, onTimeUpdate, subtitles, subtitlesActive, videoTitle, videoId, userId, contentType, onRatingSubmitted, playerSettings, className, poster, ...rest }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  // Read active video player configuration directly from environment variables (.env)
  const activePlayer = import.meta.env.VITE_ACTIVE_PLAYER || 'VIDEO_JS';

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

  // Subtitles dropdown and active track states
  const [activeTrackIdx, setActiveTrackIdx] = useState(-1);

  // Rating overlay states
  const [showRatingOverlay, setShowRatingOverlay] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hasRatedThisSession, setHasRatedThisSession] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Rating helper variables and hooks
  const currentUserId = userId || (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return stored.id || stored._id || null;
    } catch(e) {
      return null;
    }
  })();

  const getNormalizedContentType = () => {
    if (contentType) {
      const cType = contentType.toLowerCase().trim();
      if (cType === 'show' || cType === 'shows' || cType === 'series' || cType === 'short-web-series') return 'show';
      if (cType === 'sports' || cType === 'sport') return 'sports';
      if (cType === 'live' || cType === 'channel' || cType === 'channels' || cType === 'tv-channel' || cType === 'tv-channels') return 'live';
      return 'movie';
    }
    try {
      const paths = window.location.pathname.split('/');
      const detailsIndex = paths.indexOf('details');
      if (detailsIndex !== -1 && paths[detailsIndex + 1]) {
        const urlType = paths[detailsIndex + 1].toLowerCase().trim();
        if (urlType === 'show' || urlType === 'shows' || urlType === 'series' || urlType === 'short-web-series') return 'show';
        if (urlType === 'sports' || urlType === 'sport') return 'sports';
        if (urlType === 'live' || urlType === 'channel' || urlType === 'channels' || urlType === 'tv-channel' || urlType === 'tv-channels') return 'live';
      }
    } catch (e) {}
    return 'movie';
  };

  useEffect(() => {
    if (videoId && currentUserId) {
      fetch(`/api/ratings/status?userId=${currentUserId}&contentId=${videoId}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Rating check failed');
        })
        .then(data => {
          if (data.rated) {
            setHasRatedThisSession(true);
          } else {
            setHasRatedThisSession(false);
          }
        })
        .catch(err => console.error('Error checking rating status in player:', err));
    } else {
      setHasRatedThisSession(false);
    }
  }, [videoId, currentUserId]);

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

  const handleRatingSubmit = async () => {
    if (!currentUserId || !videoId || selectedRating === 0) return;
    setIsSubmittingRating(true);

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          contentId: videoId,
          contentType: getNormalizedContentType(),
          rating: selectedRating
        })
      });

      if (response.ok) {
        const result = await response.json();
        setRatingSuccess(true);
        setHasRatedThisSession(true);
        if (onRatingSubmitted) {
          onRatingSubmitted(selectedRating, result.averageRating, result.ratingsCount);
        }
        setTimeout(() => {
          setShowRatingOverlay(false);
          setRatingSuccess(false);
        }, 2500);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to submit rating. Please try again.');
        setIsSubmittingRating(false);
      }
    } catch (err) {
      console.error('Error submitting rating from player:', err);
      alert('Network error. Failed to submit rating.');
      setIsSubmittingRating(false);
    }
  };

  const handlePlayerTimeUpdate = (currentTime, duration) => {
    if (onTimeUpdate) {
      onTimeUpdate(currentTime, duration);
    }

    // Rating trigger check
    if (duration && duration > 0) {
      const timeRemaining = duration - currentTime;
      if (
        timeRemaining > 0 &&
        timeRemaining <= 5 &&
        !showRatingOverlay &&
        !hasRatedThisSession &&
        currentUserId
      ) {
        setShowRatingOverlay(true);
      }
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

  const renderRatingOverlay = () => {
    if (!showRatingOverlay) return null;

    return (
      <div 
        className="premium-rating-popup"
        style={{
          position: 'absolute',
          top: '50%',
          right: '25px',
          transform: 'translateY(-50%)',
          width: '290px',
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '24px 20px',
          color: '#fff',
          zIndex: 9999,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        <button 
          className="rating-close-btn"
          onClick={() => {
            setShowRatingOverlay(false);
            setHasRatedThisSession(true);
          }}
          aria-label="Close rating prompt"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {ratingSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '10px 0', textAlign: 'center', animation: 'fadeIn 0.3s ease-out' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#b3d332" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(179,211,50,0.5))' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#b3d332' }}>Rating Submitted!</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#aaa' }}>Thank you for your feedback.</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', width: '100%' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, letterSpacing: '0.5px', color: '#fff' }}>Rate this video</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoTitle || 'Current Video'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled = starVal <= (hoveredRating || selectedRating);
                return (
                  <button 
                    key={starVal}
                    className="rating-star-btn"
                    onMouseEnter={() => setHoveredRating(starVal)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setSelectedRating(starVal)}
                    type="button"
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      width="28" 
                      height="28" 
                      fill={isFilled ? '#b3d332' : 'transparent'} 
                      stroke={isFilled ? '#b3d332' : 'rgba(255, 255, 255, 0.4)'} 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ transition: 'all 0.15s ease' }}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                );
              })}
            </div>

            <button 
              className="rating-submit-btn"
              disabled={isSubmittingRating || selectedRating === 0}
              onClick={handleRatingSubmit}
              type="button"
            >
              {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
            </button>
          </>
        )}
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

  const playbackId = null;
  const signedToken = null;
  const loadingToken = false;

  const [resolvedYoutubeLiveSrc, setResolvedYoutubeLiveSrc] = useState(null);
  const [resolvingYoutubeLive, setResolvingYoutubeLive] = useState(false);

  // Bypass resolving YouTube Live streams on the web app because direct playback
  // of manifest.googlevideo.com manifests fails due to browser CORS policies.
  // Using the standard iframe embed handles playback cleanly on the web.
  useEffect(() => {
    setResolvedYoutubeLiveSrc(null);
    setResolvingYoutubeLive(false);
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

    // Twitch
    const twitchReg = /(?:twitch\.tv\/)(?:videos\/)?([a-zA-Z0-9_]+)/;
    const twitchMatch = trimmed.match(twitchReg);
    if (twitchMatch && twitchMatch[1]) {
      const isVod = trimmed.includes('/videos/');
      const channelOrVideoId = twitchMatch[1];
      const hostname = window.location.hostname || 'localhost';
      const embedUrl = isVod 
        ? `https://player.twitch.tv/?video=${channelOrVideoId}&parent=${hostname}&autoplay=true`
        : `https://player.twitch.tv/?channel=${channelOrVideoId}&parent=${hostname}&autoplay=true&muted=false`;
      return { isEmbed: true, type: 'twitch', src: embedUrl };
    }

    // Kick
    const kickReg = /(?:kick\.com\/)([a-zA-Z0-9_]+)/;
    const kickMatch = trimmed.match(kickReg);
    if (kickMatch && kickMatch[1]) {
      const channelId = kickMatch[1];
      const embedUrl = `https://player.kick.com/${channelId}?autoplay=true&muted=false`;
      return { isEmbed: true, type: 'kick', src: embedUrl };
    }

    // Facebook
    if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
      const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=0&autoplay=true`;
      return { isEmbed: true, type: 'facebook', src: embedUrl };
    }

    return { isEmbed: false, type: null, src: url };
  };

  const embedInfo = getEmbedInfo(src);
  const isHtmlEmbed = embedInfo.isEmbed && !resolvedYoutubeLiveSrc;

  // Filter subtitles that have valid URLs and use fallback if empty
  const activeSubs = useMemo(() => {
    if (subtitlesActive !== 'Active') {
      return [];
    }
    const rawSubs = (subtitles || []).filter(sub => sub && sub.url && sub.url.trim() !== '');
    return rawSubs.length > 0 
      ? rawSubs 
      : [
          { url: '/subtitles.vtt', language: 'English' },
          { url: '/subtitles_ml.vtt', language: 'Malayalam' }
        ];
  }, [JSON.stringify(subtitles), subtitlesActive]);

  const [processedSubs, setProcessedSubs] = useState(activeSubs);

  useEffect(() => {
    setProcessedSubs(activeSubs);

    let active = true;
    const blobUrlsToClean = [];

    const processSubtitles = async () => {
      const results = await Promise.all(
        activeSubs.map(async (sub) => {
          if (sub.url) {
            const isExternal = sub.url.startsWith('http://') || sub.url.startsWith('https://');
            const isSrt = sub.url.split('?')[0].toLowerCase().endsWith('.srt');
            const isVtt = sub.url.split('?')[0].toLowerCase().endsWith('.vtt');

            if (isSrt || isVtt || isExternal) {
              try {
                const fetchUrl = isExternal 
                  ? `/api/subtitle-proxy?url=${encodeURIComponent(sub.url)}`
                  : sub.url;

                const res = await fetch(fetchUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                let text = await res.text();
                
                if (isSrt) {
                  // Convert SRT to VTT format on-the-fly
                  let vttText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                  if (!vttText.startsWith('WEBVTT')) {
                    vttText = 'WEBVTT\n\n' + vttText;
                  }
                  vttText = vttText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
                  text = vttText;
                }

                const blob = new Blob([text], { type: 'text/vtt' });
                const blobUrl = URL.createObjectURL(blob);
                blobUrlsToClean.push(blobUrl);

                return { ...sub, url: blobUrl };
              } catch (err) {
                console.error(`Failed to load/convert subtitle from ${sub.url}:`, err);
                return sub;
              }
            }
          }
          return sub;
        })
      );

      if (active) {
        setProcessedSubs(results);
      }
    };

    processSubtitles();

    return () => {
      active = false;
      blobUrlsToClean.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      });
    };
  }, [activeSubs]);

  // Find index of the first English subtitle, or fallback to index 0
  const defaultIdx = useMemo(() => {
    const idx = processedSubs.findIndex(sub => {
      const lang = (sub.language || '').toLowerCase();
      return lang.includes('english') || lang === 'en';
    });
    return idx !== -1 ? idx : 0;
  }, [processedSubs]);

  useEffect(() => {
    if (subtitlesActive === 'Active' && processedSubs.length > 0) {
      setActiveTrackIdx(defaultIdx);
    } else {
      setActiveTrackIdx(-1);
    }
  }, [processedSubs, defaultIdx, subtitlesActive]);

  const getLangCode = (langName) => {
    if (!langName) return 'en';
    const name = langName.toLowerCase().trim();
    if (name.includes('malayalam') || name === 'ml') return 'ml';
    if (name.includes('english') || name === 'en') return 'en';
    return name.substring(0, 2);
  };

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
    "--pip-button": "none",
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

  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  const getWatermarkText = () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const identifier = storedUser.email || storedUser.username || '';
      if (identifier && identifier !== 'admin@video.com' && !identifier.endsWith('@video.com') && identifier.toLowerCase() !== 'admin') {
        return `Lemo OTT Secure Stream • ${identifier}`;
      }
    } catch (e) {}
    return 'Lemo OTT Secure Stream';
  };

  const renderUserWatermark = () => (
    <div style={{
      position: 'absolute',
      bottom: '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      color: 'rgba(255,255,255,0.18)',
      fontSize: '11px',
      fontWeight: 500,
      letterSpacing: '1px',
      zIndex: 8,
      pointerEvents: 'none',
      userSelect: 'none',
      fontFamily: 'sans-serif'
    }}>
      {getWatermarkText()}
    </div>
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Intercept PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        try {
          navigator.clipboard.writeText(''); // Clear clipboard to prevent pasting screenshot
        } catch (err) {}
        alert('Screenshots are disabled for security reasons.');
        return false;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isOptionOrShift = e.altKey || e.shiftKey;

      // Intercept Print shortcut (Ctrl+P / Cmd+P)
      if (isCmdOrCtrl && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        alert('Printing is disabled.');
        return false;
      }

      // Intercept Save shortcut (Ctrl+S / Cmd+S)
      if (isCmdOrCtrl && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        return false;
      }

      // Intercept DevTools shortcuts
      if (
        e.key === 'F12' ||
        (isCmdOrCtrl && isOptionOrShift && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (isCmdOrCtrl && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleBlur = () => {
      setIsWindowBlurred(true);
      // Pause Mux Player
      if (activePlayer === 'MUX_PLAYER' && playerRef.current) {
        try {
          playerRef.current.pause();
        } catch (e) {}
      }
      // Pause any HTML5 video elements inside the player container (including VideoJS)
      if (containerRef.current) {
        try {
          const videos = containerRef.current.querySelectorAll('video');
          videos.forEach(v => {
            if (typeof v.pause === 'function') {
              v.pause();
            }
          });
        } catch (e) {}
      }
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur();
      }
    };

    // Override navigator.mediaDevices.getDisplayMedia to block browser-level screen recording/sharing
    let originalGetDisplayMedia = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function() {
        alert('Screen recording/sharing is disabled on this platform.');
        return Promise.reject(new DOMException('Permission denied by security policy', 'NotAllowedError'));
      };
    }

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (originalGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, [activePlayer]);

  // Handle mobile screen orientation change to landscape when entering fullscreen
  useEffect(() => {
    const handleFullscreenEnter = () => {
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile && screen.orientation && typeof screen.orientation.lock === 'function') {
        screen.orientation.lock('landscape').catch((err) => {
          console.warn("Screen orientation lock to landscape failed:", err);
        });
      }
    };

    const handleFullscreenExit = () => {
      if (screen.orientation && typeof screen.orientation.unlock === 'function') {
        try {
          screen.orientation.unlock();
        } catch (e) {
          console.warn("Screen orientation unlock failed:", e);
        }
      }
    };

    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (isFullscreen) {
        handleFullscreenEnter();
      } else {
        handleFullscreenExit();
      }
    };

    // Document level (for standard Fullscreen API)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Video level (specifically for iOS Safari native fullscreen)
    let videoEl = null;
    const observer = new MutationObserver(() => {
      const currentVideo = containerRef.current?.querySelector('video');
      if (currentVideo !== videoEl) {
        if (videoEl) {
          videoEl.removeEventListener('webkitbeginfullscreen', handleFullscreenEnter);
          videoEl.removeEventListener('webkitendfullscreen', handleFullscreenExit);
        }
        videoEl = currentVideo;
        if (videoEl) {
          videoEl.addEventListener('webkitbeginfullscreen', handleFullscreenEnter);
          videoEl.addEventListener('webkitendfullscreen', handleFullscreenExit);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
      videoEl = containerRef.current.querySelector('video');
      if (videoEl) {
        videoEl.addEventListener('webkitbeginfullscreen', handleFullscreenEnter);
        videoEl.addEventListener('webkitendfullscreen', handleFullscreenExit);
      }
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      observer.disconnect();
      if (videoEl) {
        videoEl.removeEventListener('webkitbeginfullscreen', handleFullscreenEnter);
        videoEl.removeEventListener('webkitendfullscreen', handleFullscreenExit);
      }
    };
  }, [containerRef]);

  // Sync activeTrackIdx with HTML5 video textTracks mode by matching language/label
  useEffect(() => {
    const videoEl = containerRef.current?.querySelector('video');
    if (!videoEl || !videoEl.textTracks) return;

    let isSyncing = false;

    const syncTracks = () => {
      if (isSyncing) return;
      isSyncing = true;

      const tracks = videoEl.textTracks;
      const selectedSub = activeTrackIdx !== -1 ? processedSubs[activeTrackIdx] : null;
      const selectedLang = selectedSub ? getLangCode(selectedSub.language) : null;
      const selectedLabel = selectedSub ? (selectedSub.language || 'English') : null;

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track.kind === 'subtitles' || track.kind === 'captions') {
          const isMatch = selectedSub && (
            track.label === selectedLabel || 
            track.language === selectedLang
          );
          if (isMatch && subtitlesActive === 'Active') {
            track.mode = 'showing';
          } else {
            track.mode = 'disabled';
          }
        }
      }
      isSyncing = false;
    };

    const syncStateFromTracks = () => {
      if (isSyncing) return;
      isSyncing = true;

      const tracks = videoEl.textTracks;
      let foundActiveIdx = -1;

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if ((track.kind === 'subtitles' || track.kind === 'captions') && track.mode === 'showing') {
          const idx = processedSubs.findIndex(sub => {
            const subLang = getLangCode(sub.language);
            const subLabel = sub.language || 'English';
            return track.label === subLabel || track.language === subLang;
          });
          if (idx !== -1) {
            foundActiveIdx = idx;
            break;
          }
        }
      }

      if (foundActiveIdx !== activeTrackIdx) {
        setActiveTrackIdx(foundActiveIdx);
      }
      isSyncing = false;
    };

    syncTracks();

    videoEl.addEventListener('loadedmetadata', syncTracks);
    if (videoEl.textTracks) {
      videoEl.textTracks.addEventListener('addtrack', syncTracks);
      videoEl.textTracks.addEventListener('change', syncStateFromTracks);
    }

    return () => {
      videoEl.removeEventListener('loadedmetadata', syncTracks);
      if (videoEl.textTracks) {
        videoEl.textTracks.removeEventListener('addtrack', syncTracks);
        videoEl.textTracks.removeEventListener('change', syncStateFromTracks);
      }
    };
  }, [activeTrackIdx, processedSubs, subtitlesActive]);



  const renderSecurityOverlay = () => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.98)',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'sans-serif',
      pointerEvents: 'auto'
    }}>
      <svg viewBox="0 0 24 24" width="48" height="48" fill="#ff4d4d" style={{ marginBottom: '16px' }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>Security Protected Content</h3>
      <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Screen sharing, recording, or screenshots are disabled.</p>
    </div>
  );

  const securityStyles = `
    @media print {
      body {
        display: none !important;
      }
      iframe, video, mux-player, .premium-player-wrapper, #lemo-premium-player-container {
        display: none !important;
        visibility: hidden !important;
      }
    }
    mux-player {
      --pip-button: none !important;
      --bottom-pip-button: none !important;
    }
    mux-player::part(pip-button), mux-player::part(pip), .media-button--pip {
      display: none !important;
    }
  `;

  const ratingStyles = `
    @keyframes slideInRight {
      0% {
        opacity: 0;
        transform: translate3d(50px, -50%, 0) scale(0.9);
      }
      100% {
        opacity: 1;
        transform: translate3d(0, -50%, 0) scale(1);
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .premium-rating-popup {
      animation: slideInRight 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .rating-star-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      outline: none;
    }
    .rating-star-btn:hover {
      transform: scale(1.25);
    }
    .rating-star-btn:active {
      transform: scale(0.9);
    }
    .rating-submit-btn {
      background: #b3d332;
      color: #000;
      border: none;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.9rem;
      width: 100%;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 15px rgba(179, 211, 50, 0.3);
      outline: none;
    }
    .rating-submit-btn:hover:not(:disabled) {
      background: #c3e342;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(179, 211, 50, 0.5);
    }
    .rating-submit-btn:disabled {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.35);
      cursor: not-allowed;
      box-shadow: none;
    }
    .rating-close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      outline: none;
    }
    .rating-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Subtitles custom styling: small font size & transparent background */
    ::cue {
      background: transparent !important;
      background-color: transparent !important;
      color: #ffffff !important;
      font-size: 14px !important;
      text-shadow: 
        1px 1px 2px #000, 
        -1px -1px 2px #000, 
        1px -1px 2px #000, 
        -1px 1px 2px #000,
        0px 2px 4px rgba(0,0,0,0.8) !important;
    }
    video::-webkit-media-text-track-display {
      background: transparent !important;
      background-color: transparent !important;
    }
    video::-webkit-media-text-track-display-backdrop {
      background: transparent !important;
      background-color: transparent !important;
    }
    video::-webkit-media-text-track-container {
      background: transparent !important;
      background-color: transparent !important;
    }
    .video-js .vjs-text-track-cue {
      background-color: transparent !important;
      background: transparent !important;
    }
    .video-js .vjs-text-track-cue > div {
      background-color: transparent !important;
      background: transparent !important;
      font-size: 14px !important;
      text-shadow: 
        1px 1px 2px #000, 
        -1px -1px 2px #000, 
        1px -1px 2px #000, 
        -1px 1px 2px #000,
        0px 2px 4px rgba(0,0,0,0.8) !important;
    }
  `;

  const liveStyles = getNormalizedContentType() === 'live' ? `
    /* Hide seek bar/timeline, duration, progress control, and time group elements for Live TV */
    .vjs-progress-control,
    .vjs-current-time,
    .vjs-duration,
    .vjs-time-divider,
    .vjs-remaining-time,
    .time-slider,
    .media-time-slider,
    .media-time-layout,
    .media-time-group,
    .media-duration,
    .media-time,
    .vds-time-slider,
    .vds-time-layout,
    .vds-time-group,
    .vds-duration,
    .vds-time,
    .vds-slider,
    media-time-slider,
    media-time-layout,
    media-time-group,
    media-duration,
    media-time,
    vds-time-slider,
    vds-time-layout,
    vds-time-group,
    vds-duration,
    vds-time,
    vds-slider,
    mux-player::part(time-slider),
    mux-player::part(time-display),
    mux-player::part(duration-display) {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  ` : '';

  const combinedSecurityAndRatingStyles = securityStyles + ratingStyles + liveStyles;

  // --- RENDERING PIPELINE ---

  if (isHtmlEmbed) {
    return (
      <div ref={containerRef} className="premium-player-wrapper" style={containerStyle} onContextMenu={(e) => e.preventDefault()}>
        <style dangerouslySetInnerHTML={{ __html: combinedSecurityAndRatingStyles }} />
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
        {renderUserWatermark()}
        {isWindowBlurred && renderSecurityOverlay()}
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

  // 2. Render V10 @videojs/react Player (HLS, DASH, MP4, etc.)
  return (
    <Player.Provider>
      <div 
        ref={containerRef} 
        style={containerStyle} 
        onContextMenu={(e) => e.preventDefault()}
      >
        <VideoSkin
          poster={poster}
          className={className}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
          {...rest}
        >
          <style dangerouslySetInnerHTML={{ __html: combinedSecurityAndRatingStyles }} />
          <HlsVideo 
            key={`${getStreamSrc()}_${processedSubs.map(s => s.url).join(',')}`}
            src={getStreamSrc()} 
            playsInline 
            crossOrigin="anonymous"
            autoPlay={isAutoplayEnabled}
            onEnded={onEnded}
            onTimeUpdate={(e) => {
              handlePlayerTimeUpdate(e.target.currentTime, e.target.duration);
            }}
            style={playerStyle}
          >
            {subtitlesActive === 'Active' && processedSubs.map((sub, idx) => (
              <track
                key={idx}
                kind="subtitles"
                src={sub.url}
                srcLang={getLangCode(sub.language)}
                label={sub.language || 'English'}
                default={idx === defaultIdx}
              />
            ))}
          </HlsVideo>

          {/* Central controls overlay (Big play/pause, backward/forward skip) */}
          <CentralControlsOverlay isLive={getNormalizedContentType() === 'live'} />

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
          {renderRatingOverlay()}
          {renderUserWatermark()}
          {isWindowBlurred && renderSecurityOverlay()}

          {/* Subtitles Custom Dropdown */}
          <SubtitlesDropdown 
            processedSubs={processedSubs}
            activeTrackIdx={activeTrackIdx}
            setActiveTrackIdx={setActiveTrackIdx}
            containerRef={containerRef}
          />
        </VideoSkin>
      </div>
    </Player.Provider>
  );
};

export default VideoPlayer;
