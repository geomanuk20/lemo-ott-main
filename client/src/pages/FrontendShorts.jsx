import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause,
  Crown,
  Eye,
  ThumbsUp,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX
} from 'lucide-react';
import Loader from '../components/Loader';
import { useNavigate, useLocation } from 'react-router-dom';
import FrontendLayout from '../components/FrontendLayout';

const FrontendShorts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [shorts, setShorts] = useState(() => {
    return location.state?.initialShorts || [];
  });
  const [loading, setLoading] = useState(() => {
    return !location.state?.initialShorts;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [overlayState, setOverlayState] = useState({ index: null, type: null });
  const containerRef = useRef(null);
  const videoRefs = useRef({});

  useEffect(() => {
    try {
      const cached = localStorage.getItem('fe_menu_settings');
      if (cached) {
        const settings = JSON.parse(cached);
        if (settings.shorts?.toUpperCase() === 'OFF') {
          navigate('/', { replace: true });
          return;
        }
      }
    } catch (err) {
      console.error('Error parsing menu settings in shorts page:', err);
    }

    const fetchShorts = async () => {
      if (!location.state?.initialShorts) {
        setLoading(true);
      }
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/shorts', { headers });
        const data = await res.json();
        setShorts(prev => {
          const activeShorts = Array.isArray(data) ? data.filter(s => s.status === 'Active') : [];
          const isSame = activeShorts.length === prev.length && activeShorts.every((s, i) => s._id === prev[i]?._id);
          return isSame ? prev : activeShorts;
        });
      } catch (err) {
        console.error('Error fetching shorts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShorts();
  }, [navigate]);

  // Handle scrolling to requested short video from home page redirect
  useEffect(() => {
    if (shorts.length === 0 || !containerRef.current) return;
    const targetShortId = location.state?.shortId;
    if (targetShortId) {
      const idx = shorts.findIndex(s => s._id === targetShortId);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
        // Delay scroll slightly to ensure DOM element height is resolved
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: idx * containerRef.current.clientHeight,
              behavior: 'auto'
            });
          }
        }, 100);
      }
    }
  }, [shorts, location.state, currentIndex]);

  // Handle auto-playing current video and pausing others on scroll/change
  useEffect(() => {
    if (shorts.length === 0) return;
    
    // Pause all videos
    Object.values(videoRefs.current).forEach(vid => {
      if (vid) {
        vid.pause();
      }
    });

    // Play active index video
    const activeVideo = videoRefs.current[currentIndex];
    if (activeVideo) {
      activeVideo.muted = isMuted; // Match current mute state
      activeVideo.play().catch(e => {
        if (e.name === 'NotAllowedError') {
          console.log('Autoplay with sound blocked, trying muted:', e);
          activeVideo.muted = true;
          setIsMuted(true);
          activeVideo.play().catch(err => console.log('Autoplay failed completely:', err));
        } else {
          console.log('Play request interrupted or aborted, ignoring mute fallback:', e);
        }
      });
    }
  }, [currentIndex, shorts]);

  // Handle view count update on active slide scroll (counts after 1.5s preview stay)
  useEffect(() => {
    if (shorts.length === 0 || !shorts[currentIndex]) return;
    const targetShort = shorts[currentIndex];
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shorts/${targetShort._id}/view`, {
          method: 'POST'
        });
        if (res.ok) {
          const data = await res.json();
          setShorts(prev => prev.map((s, i) => i === currentIndex ? { ...s, views: data.views } : s));
        }
      } catch (e) {
        console.error('Error updating view count:', e);
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [currentIndex, shorts.length]);

  const handleScroll = (e) => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== currentIndex && index >= 0 && index < shorts.length) {
      setCurrentIndex(index);
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, shortId: shorts[index]._id }
      });
    }
  };

  const scrollNext = () => {
    if (currentIndex < shorts.length - 1 && containerRef.current) {
      containerRef.current.scrollTo({
        top: (currentIndex + 1) * containerRef.current.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollPrev = () => {
    if (currentIndex > 0 && containerRef.current) {
      containerRef.current.scrollTo({
        top: (currentIndex - 1) * containerRef.current.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  const togglePlay = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      if (isMuted) {
        toggleMute();
        setOverlayState({ index, type: 'unmute' });
        setTimeout(() => {
          setOverlayState(prev => prev.index === index ? { index: null, type: null } : prev);
        }, 600);
        return;
      }
      if (video.paused) {
        video.play().catch(e => console.warn(e));
        setOverlayState({ index, type: 'play' });
      } else {
        video.pause();
        setOverlayState({ index, type: 'pause' });
      }
      setTimeout(() => {
        setOverlayState(prev => prev.index === index ? { index: null, type: null } : prev);
      }, 600);
    }
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    Object.values(videoRefs.current).forEach(vid => {
      if (vid) {
        vid.muted = nextMuted;
      }
    });
  };

  const handleLike = async (index) => {
    const targetShort = shorts[index];
    if (!targetShort) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please sign in to like short videos.');
      return;
    }

    try {
      const res = await fetch(`/api/shorts/${targetShort._id}/like`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });
      if (res.ok) {
        const data = await res.json();
        // data returns: { likes: short.likes, hasLiked: liked }
        setShorts(prev => prev.map((s, i) => i === index ? { ...s, likes: data.likes, hasLiked: data.hasLiked } : s));
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to update like status.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <FrontendLayout isTransparent={false} showFooter={false}>
      <div className="shorts-page-container">
        {loading ? (
          <div className="shorts-loader">
            <Loader />
          </div>
        ) : shorts.length === 0 ? (
          <div className="shorts-empty">
            <h2>No Shorts Available</h2>
            <p>Check back later for fresh vertical content!</p>
          </div>
        ) : (
          <div className="shorts-feed-wrapper">
            <div 
              className="shorts-snap-container" 
              ref={containerRef}
              onScroll={handleScroll}
            >
              {shorts.map((short, idx) => (
                <div key={short._id} className="short-player-slide">
                  <div className="short-content-container">
                    <div className="short-video-card" onClick={() => togglePlay(idx)}>
                      <video
                        ref={el => videoRefs.current[idx] = el}
                        src={short.videoUrl}
                        loop
                        playsInline
                        className="shorts-main-video"
                      />
                      
                      {/* Floating Mute Indicator Banner */}
                      {isMuted && (
                        <div className="video-sound-alert-banner" onClick={(e) => toggleMute(e)}>
                          <VolumeX size={12} style={{ marginRight: '6px' }} />
                          <span>TAP FOR SOUND</span>
                        </div>
                      )}

                      {/* Mute button overlay */}
                      <button className="video-mute-btn" onClick={(e) => toggleMute(e)}>
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>

                      {/* Play/Pause feedback overlay */}
                      {overlayState.index === idx && (
                        <div className="video-play-overlay">
                          {overlayState.type === 'play' ? <Play size={40} /> : 
                           overlayState.type === 'pause' ? <Pause size={40} /> : 
                           overlayState.type === 'unmute' ? <Volume2 size={40} /> : 
                           <VolumeX size={40} />}
                        </div>
                      )}

                      <div className="short-bottom-info">
                        <h3>@{short.title}</h3>
                        {short.description && <p>{short.description.replace(/<[^>]*>/g, '')}</p>}
                      </div>
                    </div>

                    {/* Sidebar controls (Likes, Views, VIP Badge & Navigation arrows) */}
                    <div className="short-sidebar-controls" onClick={e => e.stopPropagation()}>
                      {idx > 0 && (
                        <button className="sidebar-action-btn nav-arrow up desktop-only" onClick={scrollPrev}>
                          <div className="icon-circle">
                            <ChevronUp size={20} />
                          </div>
                        </button>
                      )}

                      <button className="sidebar-action-btn like" onClick={() => handleLike(idx)}>
                        <div className={`icon-circle ${short.hasLiked ? 'liked' : ''}`}>
                          <ThumbsUp size={20} fill={short.hasLiked ? '#b3d332' : 'none'} color={short.hasLiked ? '#b3d332' : '#fff'} />
                        </div>
                        <span style={short.hasLiked ? { color: '#b3d332' } : {}}>{short.likes || 0}</span>
                      </button>

                      <div className="sidebar-action-btn views">
                        <div className="icon-circle read-only">
                          <Eye size={20} />
                        </div>
                        <span>{short.views || 0}</span>
                      </div>

                      {short.access?.toLowerCase() === 'paid' && (
                        <div className="sidebar-action-btn premium">
                          <div className="icon-circle premium-badge">
                            <Crown size={18} fill="#000" />
                          </div>
                          <span>VIP</span>
                        </div>
                      )}

                      {idx < shorts.length - 1 && (
                        <button className="sidebar-action-btn nav-arrow down desktop-only" onClick={scrollNext}>
                          <div className="icon-circle">
                            <ChevronDown size={20} />
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --nav-height: 90px;
        }
        @media (max-width: 1024px) {
          :root {
            --nav-height: 70px;
          }
        }
        @media (max-width: 480px) {
          :root {
            --nav-height: 60px;
          }
        }

        .shorts-page-container {
          width: 100%;
          height: calc(100vh - var(--nav-height));
          margin-top: var(--nav-height);
          background: radial-gradient(circle at center, #181a20 0%, #08090b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .shorts-loader, .shorts-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          height: 100%;
          text-align: center;
        }
        .shorts-empty h2 {
          color: #b3d332;
          font-size: 1.8rem;
          margin-bottom: 10px;
          font-weight: 800;
        }
        .shorts-empty p {
          color: #888;
        }

        .shorts-feed-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .shorts-snap-container {
          width: 100%;
          max-width: 520px;
          height: 100%;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scrollbar-width: none;
          background: transparent;
          position: relative;
        }
        .shorts-snap-container::-webkit-scrollbar {
          display: none;
        }

        .short-player-slide {
          width: 100%;
          height: 100%;
          scroll-snap-align: start;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
        }

        .short-content-container {
          display: flex;
          flex-direction: row;
          align-items: flex-end;
          gap: 16px;
          width: 100%;
          height: 100%;
          justify-content: center;
          align-items: center;
          padding: 20px;
          box-sizing: border-box;
        }

        .short-video-card {
          position: relative;
          height: 82vh;
          max-height: 720px;
          aspect-ratio: 9 / 16;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        
        .shorts-main-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Floating Sound Alert Banner */
        .video-sound-alert-banner {
          position: absolute;
          top: 15px;
          left: 15px;
          background: rgba(179, 211, 50, 0.95);
          color: #000;
          font-weight: 800;
          font-size: 0.7rem;
          letter-spacing: 0.5px;
          padding: 6px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          cursor: pointer;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(179, 211, 50, 0.4);
          animation: pulseSoundBanner 2s infinite ease-in-out;
          transition: all 0.2s ease;
        }
        .video-sound-alert-banner:hover {
          background: #b3d332;
          transform: scale(1.05);
        }
        @keyframes pulseSoundBanner {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        /* Mute Button Overlay */
        .video-mute-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(8px);
          z-index: 100;
          transition: all 0.2s ease;
        }
        .video-mute-btn:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: scale(1.05);
        }

        /* Play/Pause overlay indicator */
        .video-play-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          pointer-events: none;
          animation: playOverlayFade 0.6s ease-out forwards;
        }
        @keyframes playOverlayFade {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }

        /* Sidebar stats controls overlay */
        .short-sidebar-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 100;
          padding-bottom: 20px;
        }

        .sidebar-action-btn {
          background: none;
          border: none;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .sidebar-action-btn:hover {
          transform: scale(1.08);
        }
        .sidebar-action-btn.nav-arrow:hover {
          transform: scale(1.1);
        }

         .icon-circle {
           width: 44px !important;
           height: 44px !important;
           border-radius: 50% !important;
           background: rgba(255, 255, 255, 0.08) !important;
           border: 1px solid rgba(255, 255, 255, 0.15) !important;
           display: flex !important;
           align-items: center !important;
           justify-content: center !important;
           backdrop-filter: blur(12px) !important;
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
         }
         .icon-circle svg {
           width: 20px !important;
           height: 20px !important;
           color: #ffffff !important;
           stroke: #ffffff !important;
           display: block !important;
         }
         .icon-circle.liked svg {
           color: #b3d332 !important;
           stroke: #b3d332 !important;
           fill: #b3d332 !important;
         }
         .icon-circle.premium-badge svg {
           color: #000000 !important;
           stroke: #000000 !important;
           fill: #000000 !important;
         }
        .sidebar-action-btn:hover .icon-circle {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .icon-circle.liked {
          border-color: #b3d332;
          background: rgba(179, 211, 50, 0.15);
          box-shadow: 0 0 15px rgba(179, 211, 50, 0.2);
        }
        .sidebar-action-btn.like:hover .icon-circle.liked {
          background: rgba(179, 211, 50, 0.25);
        }
        
        .icon-circle.read-only {
          cursor: default;
        }
        .sidebar-action-btn.views:hover .icon-circle.read-only {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: none;
        }

        .icon-circle.premium-badge {
          background: linear-gradient(135deg, #ffca28 0%, #ff8f00 100%);
          color: #000;
          border: none;
          box-shadow: 0 4px 10px rgba(255, 143, 0, 0.3);
        }
        .sidebar-action-btn.premium:hover .icon-circle.premium-badge {
          transform: rotate(5deg);
          box-shadow: 0 6px 15px rgba(255, 143, 0, 0.5);
        }

        .sidebar-action-btn span {
          font-size: 0.72rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.8);
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }

        /* Bottom info text overlay */
        .short-bottom-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 40px 18px 18px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
          color: #fff;
          z-index: 90;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .short-bottom-info h3 {
          font-size: 1rem;
          font-weight: 800;
          margin: 0;
          color: #fff;
          letter-spacing: 0.5px;
        }
        .short-bottom-info p {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.45;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        @media (max-width: 768px) {
          .shorts-snap-container {
            max-width: 100%;
          }
          
          .short-content-container {
            padding: 0;
          }

          .short-video-card {
            width: 100%;
            height: 100%;
            border-radius: 0;
            border: none;
            box-shadow: none;
            max-height: none;
          }

          .short-sidebar-controls {
            position: absolute;
            right: 12px;
            bottom: 80px;
            padding-bottom: 0;
            gap: 14px;
          }

           .icon-circle {
             background: rgba(0, 0, 0, 0.6) !important;
             border-color: rgba(255, 255, 255, 0.2) !important;
           }
          
          .short-bottom-info {
            padding: 40px 15px 25px;
          }
        }

        /* Hide desktop arrow buttons on mobile screen sizes */
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
        }
      ` }} />
    </FrontendLayout>
  );
};

export default FrontendShorts;
