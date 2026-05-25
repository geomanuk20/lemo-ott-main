import React, { useState, useEffect, useRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { createPlayer, videoFeatures } from '@videojs/react';
import { VideoSkin } from '@videojs/react/video';
import { HlsVideo } from '@videojs/react/media/hls-video';
import '@videojs/react/video/skin.css';

const VideoJSPlayer = createPlayer({ features: videoFeatures });

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

const VideoPlayer = ({ src, onEnded, onTimeUpdate, subtitles, subtitlesActive, videoTitle, videoId, userId, playerSettings }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const dashRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  
  // Timer references for overlay and multi-click queuing
  const overlayTimeoutRef = useRef(null);
  const clickTimerRef = useRef({ backward: null, forward: null });

  const [showOverlay, setShowOverlay] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [playPulse, setPlayPulse] = useState(false);

  // Active seek clicks (state-based to trigger real-time refresh icon updates)
  const [backwardClicks, setBackwardClicks] = useState(0);
  const [forwardClicks, setForwardClicks] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Read active video player configuration directly from environment variables (.env)
  const activePlayer = import.meta.env.VITE_ACTIVE_PLAYER || 'MUX_PLAYER';

  // Compute dynamic player styling parameters based on playerSettings
  const isBlueAccent = playerSettings?.playerStyle === 'Blue Accent';
  const isModernLight = playerSettings?.playerStyle === 'Modern Light';
  
  const accentColor = isBlueAccent 
    ? '#0070f3' 
    : isModernLight 
      ? '#ffffff' 
      : '#b3d332';

  const accentRgb = isBlueAccent 
    ? '0, 112, 243' 
    : isModernLight 
      ? '255, 255, 255' 
      : '179, 211, 50';

  const accentText = isModernLight ? '#000000' : '#ffffff';
  const isAutoplayEnabled = playerSettings?.autoplay === 'YES';
  const isRewindForwardEnabled = playerSettings?.rewindForward !== 'NO';



  // Track native fullscreen state across all major browsers and vendors
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      // Cleanly exit fullscreen if the player is unmounted while active
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      if (isCurrentlyFullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => console.log('Error exiting fullscreen on unmount:', err));
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };
  }, []);

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
  const shouldShowOverlayControls = !isHtmlEmbed || playbackId;

  // Filter subtitles that have valid URLs
  const activeSubs = (subtitles || []).filter(sub => sub && sub.url && sub.url.trim() !== '');

  // 1. Google Cast Framework dynamic injector (For Mux Player)
  useEffect(() => {
    if (activePlayer === 'MUX_PLAYER' && playbackId) {
      const castScriptId = 'google-cast-sdk';
      if (!document.getElementById(castScriptId)) {
        const script = document.createElement('script');
        script.id = castScriptId;
        script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  }, [activePlayer, playbackId]);

  // 2. Native HLS.js and Dash.js Player lifecycle
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || isHtmlEmbed) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (dashRef.current) {
      dashRef.current.destroy();
      dashRef.current = null;
    }

    const streamSrc = getStreamSrc();
    const isHls = streamSrc.includes('.m3u8') || streamSrc.includes('manifest/hls_live') || streamSrc.includes('googlevideo.com');
    const isDash = streamSrc.includes('.mpd');

    if (isHls) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamSrc;
      } else {
        const loadHls = () => {
          if (window.Hls && window.Hls.isSupported()) {
            const hls = new window.Hls({ maxMaxBufferLength: 10, enableWorker: true });
            hls.loadSource(streamSrc);
            hls.attachMedia(video);
            hlsRef.current = hls;
          }
        };

        if (!window.Hls) {
          const script = document.createElement('script');
          script.id = 'hls-js-sdk';
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
          script.onload = loadHls;
          document.body.appendChild(script);
        } else {
          loadHls();
        }
      }
    } else if (isDash) {
      const loadDash = () => {
        if (window.dashjs) {
          const player = window.dashjs.MediaPlayer().create();
          player.initialize(video, streamSrc, isAutoplayEnabled);
          dashRef.current = player;
        }
      };

      if (!window.dashjs) {
        const script = document.createElement('script');
        script.id = 'dash-js-sdk';
        script.src = 'https://cdn.jsdelivr.net/npm/dashjs@latest/dist/dash.all.min.js';
        script.onload = loadDash;
        document.body.appendChild(script);
      } else {
        loadDash();
      }
    } else {
      video.src = streamSrc;
    }

    if (isAutoplayEnabled) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.log('Autoplay blocked:', err));
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (dashRef.current) {
        dashRef.current.destroy();
        dashRef.current = null;
      }
    };
  }, [src, isHtmlEmbed, isAutoplayEnabled, signedToken, resolvedYoutubeLiveSrc, resolvingYoutubeLive]);

  // 3. Setup Screen Overlay Controller Event Observers
  const resetOverlayTimer = () => {
    setShowOverlay(true);
    if (overlayTimeoutRef.current) {
      clearTimeout(overlayTimeoutRef.current);
    }
    const video = containerRef.current?.querySelector('video') || playerRef.current;
    if (video && !video.paused) {
      overlayTimeoutRef.current = setTimeout(() => {
        setShowOverlay(false);
      }, 2500);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldShowOverlayControls) return;

    const handlePlay = () => {
      setIsPaused(false);
      resetOverlayTimer();
    };

    const handlePause = () => {
      setIsPaused(true);
      setShowOverlay(true);
    };

    container.addEventListener('play', handlePlay, true);
    container.addEventListener('pause', handlePause, true);

    return () => {
      container.removeEventListener('play', handlePlay, true);
      container.removeEventListener('pause', handlePause, true);
    };
  }, [src, shouldShowOverlayControls]);

  // Sync initial state of player
  useEffect(() => {
    const video = containerRef.current?.querySelector('video');
    if (video) {
      setIsPaused(video.paused);
    } else {
      setIsPaused(true);
    }
    setShowOverlay(true);
  }, [src]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
      if (clickTimerRef.current.backward) clearTimeout(clickTimerRef.current.backward);
      if (clickTimerRef.current.forward) clearTimeout(clickTimerRef.current.forward);
    };
  }, []);

  const handlePlayPause = () => {
    const video = containerRef.current?.querySelector('video') || playerRef.current;
    if (!video) return;

    // Trigger pop scale animation
    setPlayPulse(true);
    setTimeout(() => setPlayPulse(false), 300);

    if (video.paused) {
      video.play().catch(err => console.log('Playback error:', err));
    } else {
      video.pause();
    }
  };

  const handleSeek = (offset) => {
    const video = containerRef.current?.querySelector('video') || playerRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + offset));
    resetOverlayTimer();
  };

  // Dynamic multi-click seek queuing: 1 Click = 2s, 2 Clicks = 5s, 3+ Clicks = 10s
  const handleSeekClick = (direction) => {
    const setter = direction === 'forward' ? setForwardClicks : setBackwardClicks;

    setter((prev) => {
      const nextVal = prev + 1;

      if (clickTimerRef.current[direction]) {
        clearTimeout(clickTimerRef.current[direction]);
      }

      clickTimerRef.current[direction] = setTimeout(() => {
        let offset = 2; // Default: Single Click = 2s
        if (nextVal === 2) {
          offset = 5;   // Double Click = 5s
        } else if (nextVal >= 3) {
          offset = 10;  // Triple Click = 10s
        }

        const finalOffset = direction === 'forward' ? offset : -offset;
        handleSeek(finalOffset);

        // Reset click counting states
        setter(0);
        clickTimerRef.current[direction] = null;
      }, 300);

      return nextVal;
    });
  };

  // Helper to render skip values inside seek-btn-content overlay
  const renderSkipLabel = (count) => {
    if (count === 0) return null;

    const num = count === 2 ? 5 : count >= 3 ? 10 : 2;
    const fontSize = num === 10 ? '7.5px' : '9.5px';
    return (
      <span className="seek-btn-number" style={{ fontSize }}>
        {num}
      </span>
    );
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
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
  };

  const playerStyle = {
    width: '100%',
    height: '100%',
    maxHeight: '80vh',
    objectFit: 'contain',
    outline: 'none'
  };

  // Explicit CSS variables to force all controls to show up on Mux Player
  const muxPlayerStyle = {
    ...playerStyle,
    "--playback-rate-button": "inline-flex",
    "--rendition-menu-button": "inline-flex",
    "--audio-track-menu-button": "inline-flex",
    "--captions-button": "inline-flex",
    "--pip-button": "inline-flex",
    "--fullscreen-button": "inline-flex",
    "--volume-range": "inline-flex",
    "--time-range": "inline-flex"
  };

  const renderActivePlayer = () => {
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

    // A. MUX PLAYER
    if (activePlayer === 'MUX_PLAYER') {
      if (playbackId) {
        return (
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
            onTimeUpdate={(e) => {
              if (onTimeUpdate) {
                onTimeUpdate(e.target.currentTime, e.target.duration);
              }
            }}
            style={muxPlayerStyle}
            metadata={metadata}
            fullscreenElement="lemo-premium-player-container"
          />
        );
      } else {
        // Fallback for non-Mux direct URLs
        return (
          <video
            ref={videoRef}
            src={getStreamSrc()}
            controls={showOverlay}
            autoPlay={isAutoplayEnabled}
            playsInline
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
          </video>
        );
      }
    }

    // B. VIDEO.JS PLAYER
    if (activePlayer === 'VIDEO_JS') {
      return (
        <VideoJSPlayer.Provider>
          <VideoSkin style={{ width: '100%', height: '100%' }}>
            <HlsVideo 
              src={getStreamSrc()} 
              playsInline 
              autoPlay={isAutoplayEnabled}
              controls={showOverlay} 
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
          </VideoSkin>
        </VideoJSPlayer.Provider>
      );
    }

    // C. NATIVE PLAYER (DEFAULT FALLBACK)
    return (
      <video
        ref={videoRef}
        src={getStreamSrc()}
        controls={showOverlay}
        autoPlay={isAutoplayEnabled}
        playsInline
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
      </video>
    );
  };

  // --- RENDERING PIPELINE ---

  if (isHtmlEmbed && !playbackId) {
    return (
      <div className="premium-player-wrapper" style={containerStyle}>
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
        <style dangerouslySetInnerHTML={{ __html: `
          .premium-player-wrapper iframe {
            width: 100% !important;
            height: 100% !important;
            min-height: 450px !important;
            border: none !important;
            border-radius: 12px;
          }
        `}} />
      </div>
    );
  }

  // Helper to resolve absolute upload path for watermark
  const getWatermarkUrl = (logo) => {
    if (!logo) return '';
    if (logo.startsWith('http://') || logo.startsWith('https://')) return logo;
    return `/${logo}`;
  };

  return (
    <div 
      id="lemo-premium-player-container"
      ref={containerRef}
      className={`premium-player-wrapper ${isFullscreen ? 'is-fullscreen' : 'is-inline'} ${!showOverlay ? 'controls-hidden' : ''}`} 
      style={containerStyle}
      onMouseMove={resetOverlayTimer}
      onMouseEnter={resetOverlayTimer}
      onMouseLeave={() => {
        const video = containerRef.current?.querySelector('video') || playerRef.current;
        if (video && !video.paused) {
          setShowOverlay(false);
        }
      }}
    >
      {renderActivePlayer()}

      {/* Floating Center Screen Controls Overlay */}
      {shouldShowOverlayControls && (
        <div 
          className="premium-player-screen-overlay"
          onClick={resetOverlayTimer}
        >
          {/* Left Tap Zone (Left 40% of the screen) */}
          {isRewindForwardEnabled ? (
            <div 
              className="seek-tap-zone left-zone" 
              onClick={(e) => {
                e.stopPropagation();
                handleSeekClick('backward');
              }}
            >
              <div 
                className="premium-overlay-btn" 
                style={{
                  opacity: backwardClicks > 0 ? 1 : 0,
                  transition: 'opacity 0.25s ease',
                }}
              >
                <div className="seek-btn-content">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  {renderSkipLabel(backwardClicks)}
                </div>
              </div>
            </div>
          ) : (
            <div className="seek-tap-zone left-zone-empty" style={{ width: '40%' }} />
          )}

          {/* Center Play/Pause Zone (Middle 20% of the screen) */}
          <div className="center-control-zone">
            <button 
              className={`premium-overlay-btn center-play ${!isPaused ? 'center-pause' : ''} ${playPulse ? 'play-pulse-active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              title={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>
          </div>

          {/* Right Tap Zone (Right 40% of the screen) */}
          {isRewindForwardEnabled ? (
            <div 
              className="seek-tap-zone right-zone" 
              onClick={(e) => {
                e.stopPropagation();
                handleSeekClick('forward');
              }}
            >
              <div 
                className="premium-overlay-btn" 
                style={{
                  opacity: forwardClicks > 0 ? 1 : 0,
                  transition: 'opacity 0.25s ease',
                }}
              >
                <div className="seek-btn-content">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                  {renderSkipLabel(forwardClicks)}
                </div>
              </div>
            </div>
          ) : (
            <div className="seek-tap-zone right-zone-empty" style={{ width: '40%' }} />
          )}
        </div>
      )}

      {/* Floating Watermark Layer */}
      {playerSettings?.watermark === 'YES' && playerSettings?.watermarkLogo && (
        <a 
          href={playerSettings.watermarkUrl && playerSettings.watermarkUrl !== '#' ? playerSettings.watermarkUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={`premium-player-watermark position-${(playerSettings.watermarkPosition || 'Top Right').toLowerCase().replace(' ', '-')}`}
          onClick={(e) => {
            if (!playerSettings.watermarkUrl || playerSettings.watermarkUrl === '#') {
              e.preventDefault();
            }
          }}
        >
          <img 
            src={getWatermarkUrl(playerSettings.watermarkLogo)} 
            alt="Watermark Logo" 
          />
        </a>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .premium-player-wrapper {
          --player-accent: ${accentColor};
          --player-accent-rgb: ${accentRgb};
          --player-accent-text: ${accentText};
          --player-seek-backward: none;
          --player-seek-forward: none;
          position: relative;
          min-height: 450px;
          transition: border-radius 0.2s, box-shadow 0.2s;
        }
        .premium-player-wrapper mux-player {
          --seek-backward-button: var(--player-seek-backward);
          --seek-forward-button: var(--player-seek-forward);
        }
        .premium-player-wrapper mux-player,
        .premium-player-wrapper video {
          min-height: 450px;
        }
        
        /* Fullscreen styles for the wrapper container */
        .premium-player-wrapper.is-fullscreen {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100vw !important;
          height: 100vh !important;
          min-height: 100vh !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          background: #000 !important;
        }
        .premium-player-wrapper.is-fullscreen mux-player,
        .premium-player-wrapper.is-fullscreen video {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
        }
        .premium-player-wrapper.is-fullscreen .premium-player-watermark {
          z-index: 2147483647 !important;
        }
        .premium-player-wrapper.is-fullscreen .premium-player-screen-overlay {
          z-index: 2147483646 !important;
        }
        .premium-player-wrapper.is-fullscreen .premium-player-watermark.position-bottom-right,
        .premium-player-wrapper.is-fullscreen .premium-player-watermark.position-bottom-left {
          bottom: 100px !important;
        }

        .premium-player-screen-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.45);
          opacity: 1;
          z-index: 10;
          pointer-events: auto;
          transition: background-color 0.3s ease;
        }

        .controls-hidden .premium-player-screen-overlay {
          background: transparent;
        }

        .seek-tap-zone {
          width: 40%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          pointer-events: auto;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          z-index: 11;
        }

        .center-control-zone {
          width: 20%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 12;
          pointer-events: auto;
          transition: opacity 0.3s ease;
        }

        .controls-hidden .center-control-zone {
          opacity: 0;
          pointer-events: none;
        }

        /* Synchronization of Mux Player / VideoJS / Native controls with our overlay state */
        .controls-hidden mux-player {
          --controls: none !important;
        }
        .controls-hidden mux-player::part(control-bar) {
          display: none !important;
        }
        .controls-hidden .vjs-control-bar {
          display: none !important;
        }

        /* Keyframes for Continuous Breathing Ripple */
        @keyframes ripple-breathe {
          0% {
            box-shadow: 0 0 0 6px rgba(var(--player-accent-rgb), 0.35), 0 0 0 12px rgba(var(--player-accent-rgb), 0.18);
          }
          50% {
            box-shadow: 0 0 0 11px rgba(var(--player-accent-rgb), 0.45), 0 0 0 22px rgba(var(--player-accent-rgb), 0.25);
          }
          100% {
            box-shadow: 0 0 0 6px rgba(var(--player-accent-rgb), 0.35), 0 0 0 12px rgba(var(--player-accent-rgb), 0.18);
          }
        }

        /* Keyframes for Click/Toggle Pop scale */
        @keyframes play-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.22); }
          100% { transform: scale(1); }
        }

        .premium-overlay-btn {
          width: 58px;
          height: 58px;
          background: transparent;
          border: none;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
          padding: 0;
          outline: none;
        }
        .premium-overlay-btn:hover {
          color: var(--player-accent);
          transform: scale(1.15);
          background: transparent;
        }
        
        .premium-overlay-btn.center-play {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: var(--player-accent);
          color: var(--player-accent-text);
          border: none;
          box-shadow: 0 0 0 8px rgba(var(--player-accent-rgb), 0.3), 0 0 0 16px rgba(var(--player-accent-rgb), 0.15);
          filter: none;
          animation: ripple-breathe 2s infinite ease-in-out;
          transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
        }

        .play-pulse-active {
          animation: play-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }

        .premium-overlay-btn.center-play:hover {
          background: var(--player-accent);
          color: var(--player-accent-text);
          box-shadow: 0 0 0 12px rgba(var(--player-accent-rgb), 0.4), 0 0 0 24px rgba(var(--player-accent-rgb), 0.25);
          filter: none;
        }

        /* Pause button custom style when video is playing */
        .premium-overlay-btn.center-play.center-pause {
          background: var(--player-accent);
          color: var(--player-accent-text);
          box-shadow: 0 0 0 8px rgba(var(--player-accent-rgb), 0.3), 0 0 0 16px rgba(var(--player-accent-rgb), 0.15);
        }

        .seek-btn-content {
          position: relative;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .seek-btn-number {
          position: absolute;
          top: 54%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: 800;
          color: currentColor;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1;
        }

        /* Premium Watermark styles */
        .premium-player-watermark {
          position: absolute;
          z-index: 9;
          pointer-events: auto;
          max-width: 120px;
          height: auto;
          display: block;
        }
        .premium-player-watermark img {
          max-width: 100%;
          max-height: 45px;
          height: auto;
          object-fit: contain;
          opacity: 0.75;
          transition: opacity 0.25s, transform 0.25s;
        }
        .premium-player-watermark img:hover {
          opacity: 1;
          transform: scale(1.05);
        }

        .premium-player-watermark.position-top-right {
          top: 20px;
          right: 20px;
        }
        .premium-player-watermark.position-top-left {
          top: 20px;
          left: 20px;
        }
        .premium-player-watermark.position-bottom-right {
          bottom: 80px;
          right: 20px;
        }
        .premium-player-watermark.position-bottom-left {
          bottom: 80px;
          left: 20px;
        }

        @media (max-width: 768px) {
          .premium-player-wrapper:not(:fullscreen) {
            min-height: 0 !important;
            aspect-ratio: 16/9;
            --player-seek-backward: ${isRewindForwardEnabled ? 'inline-flex' : 'none'} !important;
            --player-seek-forward: ${isRewindForwardEnabled ? 'inline-flex' : 'none'} !important;
          }
          .premium-player-wrapper:not(:fullscreen) mux-player,
          .premium-player-wrapper:not(:fullscreen) video {
            min-height: 0 !important;
            height: 100% !important;
          }


          
          /* Make center play button smaller */
          .premium-overlay-btn.center-play {
            width: 54px !important;
            height: 54px !important;
            box-shadow: 0 0 0 4px rgba(var(--player-accent-rgb), 0.3), 0 0 0 8px rgba(var(--player-accent-rgb), 0.15) !important;
            animation: ripple-breathe-mobile 2s infinite ease-in-out !important;
          }
          
          .premium-overlay-btn.center-play svg {
            width: 24px !important;
            height: 24px !important;
          }
          
          .premium-overlay-btn.center-play.center-pause {
            box-shadow: 0 0 0 4px rgba(var(--player-accent-rgb), 0.3), 0 0 0 8px rgba(var(--player-accent-rgb), 0.15) !important;
          }
          
          /* Smaller watermark for mobile screen */
          .premium-player-watermark img {
            max-height: 25px !important;
          }
          .premium-player-wrapper:not(:fullscreen) .premium-player-watermark.position-bottom-right,
          .premium-player-wrapper:not(:fullscreen) .premium-player-watermark.position-bottom-left {
            bottom: 60px !important;
          }
        }

        /* Mobile specific breathing animation */
        @keyframes ripple-breathe-mobile {
          0% {
            box-shadow: 0 0 0 4px rgba(var(--player-accent-rgb), 0.35), 0 0 0 8px rgba(var(--player-accent-rgb), 0.18);
          }
          50% {
            box-shadow: 0 0 0 7px rgba(var(--player-accent-rgb), 0.45), 0 0 0 14px rgba(var(--player-accent-rgb), 0.25);
          }
          100% {
            box-shadow: 0 0 0 4px rgba(var(--player-accent-rgb), 0.35), 0 0 0 8px rgba(var(--player-accent-rgb), 0.18);
          }
        }
      `}} />
    </div>
  );
};

export default VideoPlayer;
