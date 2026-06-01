import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
 Play, 
 Plus, 
 Share2, 
 Clock, 
 Calendar, 
 Eye, 
 Star,
 ChevronRight,
 Loader2,
 Check,
 Bookmark,
 Crown,
 X
} from 'lucide-react';
import Loader from '../components/Loader';
import FrontendLayout from '../components/FrontendLayout';
import VideoPlayer from '../components/VideoPlayer';

const formatViews = (count, docId = '') => {
  let num = parseInt(count, 10);
  if (isNaN(num) || num === 0) {
    if (docId && docId.length >= 8) {
      const hexPart = docId.substring(0, 8);
      const seed = parseInt(hexPart, 16);
      num = (seed % 1900) + 100;
    } else {
      num = 500;
    }
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M Views';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K Views';
  }
  return num + ' Views';
};
const isItemActive = (item, type, menuSettings) => {
  if (!menuSettings || !item) return true;

  let contentType = item.contentType;
  if (!contentType) {
    const normType = type ? type.toLowerCase().trim() : '';
    if (normType === 'movie' || normType === 'movies' || normType === 'new-release') {
      contentType = 'Movie';
    } else if (normType === 'short-film') {
      contentType = 'Short Film';
    } else if (normType === 'show' || normType === 'shows' || normType === 'series') {
      contentType = 'TV Show';
    } else if (normType === 'short-web-series') {
      contentType = 'Short Web Series';
    } else if (normType === 'sports' || normType === 'sport') {
      contentType = 'Sports';
    } else if (normType === 'live' || normType === 'channel' || normType === 'channels' || normType === 'tv-channel' || normType === 'tv-channels') {
      contentType = 'Live TV';
    } else if (normType === 'episode' || normType === 'episodes' || normType === 'season' || normType === 'seasons') {
      if (item.showId && typeof item.showId === 'object') {
        contentType = item.showId.contentType || 'TV Show';
      } else {
        contentType = 'TV Show';
      }
    }
  }

  // Fallback check if contentType is still undefined
  if (!contentType) {
    if (item.logo || item.channelName || item.name) {
      contentType = 'Live TV';
    } else if (item.sportsCategory) {
      contentType = 'Sports';
    } else {
      contentType = 'Movie';
    }
  }

  if (contentType === 'Movie' && menuSettings.movies?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Short Film' && menuSettings.shortFilms?.toUpperCase() === 'OFF') return false;
  if (contentType === 'TV Show' && menuSettings.shows?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Short Web Series' && menuSettings.webSeries?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Sports' && menuSettings.sports?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Live TV' && menuSettings.liveTv?.toUpperCase() === 'OFF') return false;

  return true;
};

const checkIsPaid = (item, contentType) => {
  if (!item) return false;
  const t = (contentType || '').toLowerCase().trim();
  if (t === 'show' || t === 'shows' || t === 'series' || t === 'short-web-series' || t === 'web-series') {
    return (item.seriesAccess || '').toLowerCase() === 'paid';
  } else if (t === 'live' || t === 'channel' || t === 'channels' || t === 'tv-channel' || t === 'tv-channels') {
    return (item.tvAccess || '').toLowerCase() === 'paid' || (item.access || '').toLowerCase() === 'paid';
  } else {
    // movie, movies, short-film, sports, new-releases, new-release, etc.
    return (item.access || '').toLowerCase() === 'paid';
  }
};

const FrontendDetails = () => {
 const { type, id } = useParams();
 const cleanType = type ? type.toLowerCase().trim() : '';
 const navigate = useNavigate();
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(false);
 const [related, setRelated] = useState([]);
 const [isWatchlisted, setIsWatchlisted] = useState(false);
 const [notification, setNotification] = useState(null);
 const [isShareModalOpen, setIsShareModalOpen] = useState(false);
 const [seasons, setSeasons] = useState([]);
 const [episodes, setEpisodes] = useState([]);
 const [selectedSeasonId, setSelectedSeasonId] = useState('');
 const [activeVideoUrl, setActiveVideoUrl] = useState(null);
 const [showNextBtn, setShowNextBtn] = useState(false);
 const [playerSettings, setPlayerSettings] = useState(null);
 const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handlePlayVideo = (url, targetEpisode = null) => {
    // Ensure user is signed in to play ANY video
    if (!user || !user.id) {
      alert('Please login to watch videos.');
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    setActiveVideoUrl(url);

     // Increment view count when video is played
     if (id && type) {
       fetch(`/api/contents/${type}/${id}/view`, {
         method: 'POST'
       })
       .then(res => res.json())
       .then(resData => {
         if (resData && resData.success) {
           setData(prev => {
             if (!prev) return prev;
             return { ...prev, views: resData.views };
           });
         }
       })
       .catch(err => console.error('Error incrementing view count:', err));
     }
   };

  useEffect(() => {
    setShowNextBtn(false);
  }, [activeVideoUrl]);

   useEffect(() => {
     if (data && (cleanType === 'episode' || cleanType === 'episodes')) {
       const url = data.videoFile || data.videoUrl || data.streamUrl || data.videoFile1080 || data.videoFile720 || data.videoFile480;
       if (url) {
         handlePlayVideo(url);
       }
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [data, cleanType]);

 useEffect(() => {
  const fetchDetails = async () => {
    setLoading(true);
    try {
     let normalizedType = type ? type.toLowerCase().trim() : '';
     let endpoint = '';
      if (normalizedType === 'movie' || normalizedType === 'movies' || normalizedType === 'short-film' || normalizedType === 'new-release') {
       endpoint = `/api/movies/${id}`;
      } else if (normalizedType === 'show' || normalizedType === 'shows' || normalizedType === 'series' || normalizedType === 'short-web-series') {
       endpoint = `/api/shows/${id}`;
      } else if (normalizedType === 'sports' || normalizedType === 'sport') {
       endpoint = `/api/sports-videos/${id}`;
      } else if (normalizedType === 'live' || normalizedType === 'channel' || normalizedType === 'channels' || normalizedType === 'tv-channel' || normalizedType === 'tv-channels') {
       endpoint = `/api/tv-channels/${id}`;
      } else if (normalizedType === 'new-releases') {
       endpoint = `/api/new-releases/${id}`;
      } else if (normalizedType === 'episode' || normalizedType === 'episodes') {
       endpoint = `/api/episodes/${id}`;
      } else if (normalizedType === 'season' || normalizedType === 'seasons') {
       endpoint = `/api/seasons/${id}`;
      }
  
      let response = await fetch(`${endpoint}`);
      let result = null;
      if (response.ok) {
       try {
        result = await response.json();
       } catch (err) {
        console.error('Error parsing details JSON:', err);
       }
      }

      // Universal fallback chain: if initial request fails or returns null/error, query other resource collections.
      if (!result || result.message || result.message === 'Cast to ObjectId failed') {
       const fallbackRoutes = [
        { path: '/api/shows', typeKey: 'show' },
        { path: '/api/movies', typeKey: 'movie' },
        { path: '/api/new-releases', typeKey: 'new-release' },
        { path: '/api/tv-channels', typeKey: 'live' },
        { path: '/api/sports-videos', typeKey: 'sports' },
        { path: '/api/episodes', typeKey: 'episode' }
       ];
       
       for (const route of fallbackRoutes) {
        if (endpoint === `${route.path}/${id}`) continue;
        try {
         const fallbackRes = await fetch(`${route.path}/${id}`);
         if (fallbackRes.ok) {
          const tempResult = await fallbackRes.json();
          if (tempResult && !tempResult.message && tempResult._id) {
           result = tempResult;
           normalizedType = route.typeKey;
           console.log(`[FALLBACK] Successfully matched ID ${id} to ${route.path} (type key: ${normalizedType})`);
           break;
          }
         }
        } catch (err) {
         console.error(`Error querying fallback route ${route.path}:`, err);
        }
       }
      }

      // Check active setting for redirect
      try {
        const cached = localStorage.getItem('fe_menu_settings');
        if (cached && result) {
          const settings = JSON.parse(cached);
          if (!isItemActive(result, type, settings)) {
            navigate('/', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error('Error redirecting in details page:', err);
      }

      setData(result);
 
     if (normalizedType === 'show' || normalizedType === 'shows' || normalizedType === 'series' || normalizedType === 'short-web-series') {
      const seasonsRes = await fetch(`/api/seasons?showId=${id}`);
      if (seasonsRes.ok) {
       const seasonsData = await seasonsRes.json();
       setSeasons(seasonsData);
       if (seasonsData.length > 0) {
        setSelectedSeasonId(seasonsData[0]._id);
       }
      }
      const episodesRes = await fetch(`/api/episodes?showId=${id}`);
      if (episodesRes.ok) {
       const episodesData = await episodesRes.json();
       setEpisodes(episodesData);
      }
     } else if (normalizedType === 'episode' || normalizedType === 'episodes') {
      let showIdStr = '';
      if (result.showId) {
       showIdStr = typeof result.showId === 'object' ? (result.showId._id || result.showId.id) : result.showId;
      }
      let seasonIdStr = '';
      if (result.seasonId) {
       seasonIdStr = typeof result.seasonId === 'object' ? (result.seasonId._id || result.seasonId.id) : result.seasonId;
      }
      
      if (showIdStr) {
       const seasonsRes = await fetch(`/api/seasons?showId=${showIdStr}`);
       if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json();
        setSeasons(seasonsData);
       }
       const episodesRes = await fetch(`/api/episodes?showId=${showIdStr}`);
       if (episodesRes.ok) {
        const episodesData = await episodesRes.json();
        setEpisodes(episodesData);
       }
      }
      if (seasonIdStr) {
       setSelectedSeasonId(seasonIdStr);
      }
     } else if (normalizedType === 'season' || normalizedType === 'seasons') {
      let showIdStr = '';
      if (result.showId) {
       showIdStr = typeof result.showId === 'object' ? (result.showId._id || result.showId.id) : result.showId;
      }
      if (showIdStr) {
       const seasonsRes = await fetch(`/api/seasons?showId=${showIdStr}`);
       if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json();
        setSeasons(seasonsData);
       }
       const episodesRes = await fetch(`/api/episodes?showId=${showIdStr}`);
       if (episodesRes.ok) {
        const episodesData = await episodesRes.json();
        setEpisodes(episodesData);
       }
      }
      setSelectedSeasonId(id);
     } else {
      setSeasons([]);
      setEpisodes([]);
      setSelectedSeasonId('');
     }
 
    // Fetch related content
    let relatedEndpoint = '';
    if (normalizedType === 'movie' || normalizedType === 'movies' || normalizedType === 'short-film' || normalizedType === 'new-release') {
     relatedEndpoint = '/api/movies';
    } else if (normalizedType === 'show' || normalizedType === 'shows' || normalizedType === 'series' || normalizedType === 'short-web-series') {
     relatedEndpoint = '/api/shows';
    } else if (normalizedType === 'sports' || normalizedType === 'sport') {
     relatedEndpoint = '/api/sports-videos';
    } else if (normalizedType === 'live' || normalizedType === 'channel' || normalizedType === 'channels' || normalizedType === 'tv-channel' || normalizedType === 'tv-channels') {
     relatedEndpoint = '/api/tv-channels';
    } else if (normalizedType === 'new-releases') {
     relatedEndpoint = '/api/new-releases';
    } else if (normalizedType === 'episode' || normalizedType === 'episodes' || normalizedType === 'season' || normalizedType === 'seasons') {
     relatedEndpoint = '/api/shows';
    }
    const relatedResponse = await fetch(`${relatedEndpoint}`);
    const relatedResult = await relatedResponse.json();
    let parentId = '';
    if (result && result.showId) {
     parentId = typeof result.showId === 'object' ? (result.showId._id || result.showId.id) : result.showId;
    }
    
    // Filter related items to exclude disabled ones
    let finalRelated = Array.isArray(relatedResult) ? relatedResult.filter(item => item._id !== id && item._id !== parentId) : [];
    try {
      const cached = localStorage.getItem('fe_menu_settings');
      if (cached) {
        const settings = JSON.parse(cached);
        finalRelated = finalRelated.filter(item => isItemActive(item, normalizedType, settings));
      }
    } catch (err) {
      console.error('Error filtering related content:', err);
    }
    
    setRelated(finalRelated.slice(0, 6));

    // Check watchlist
    if (user.id) {
     const wlResponse = await fetch(`/api/watchlist/${user.id}`);
     const wlData = await wlResponse.json();
     if (Array.isArray(wlData)) {
      setIsWatchlisted(wlData.some(item => item._id === id));
     }
    } else {
     const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
     setIsWatchlisted(watchlist.some(item => item.id === id));
    }
   } catch (err) {
    console.error('Error fetching details:', err);
   } finally {
    setLoading(false);
   }
  };

  fetchDetails();
  window.scrollTo(0, 0);
 }, [type, id]);

 useEffect(() => {
  const fetchPlayerSettings = async () => {
   try {
    const response = await fetch('/api/player-settings');
    if (response.ok) {
     const psData = await response.json();
     setPlayerSettings(psData);
    }
   } catch (err) {
    console.error('Error fetching player settings:', err);
   }
  };
  fetchPlayerSettings();
 }, []);

 const handleWatchlist = async () => {
  if (!user.id) {
   // Fallback to local storage for guest
   const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
   if (isWatchlisted) {
    const updated = watchlist.filter(item => item.id !== id);
    localStorage.setItem('watchlist', JSON.stringify(updated));
    setIsWatchlisted(false);
    showNotification('Removed from guest watchlist');
   } else {
    watchlist.push({ id, type, title: data.title, poster: data.poster });
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    setIsWatchlisted(true);
    showNotification('Added to guest watchlist');
   }
   return;
  }

  const cleanType = type ? type.toLowerCase().trim() : '';
  let normalizedWatchlistType = 'movie';
  if (cleanType === 'show' || cleanType === 'shows' || cleanType === 'series' || cleanType === 'short-web-series') {
   normalizedWatchlistType = 'show';
  } else if (cleanType === 'sports' || cleanType === 'sport') {
   normalizedWatchlistType = 'sports';
  } else if (cleanType === 'live' || cleanType === 'channel' || cleanType === 'channels' || cleanType === 'tv-channel' || cleanType === 'tv-channels') {
   normalizedWatchlistType = 'live';
  }

  try {
   const response = await fetch('/api/watchlist/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, contentId: id, contentType: normalizedWatchlistType })
   });
   const result = await response.json();
   if (response.ok) {
    setIsWatchlisted(result.status === 'added');
    showNotification(result.message);
   }
  } catch (err) {
   console.error('Error toggling watchlist:', err);
  }
 };

 const handleShare = async (platform) => {
  const url = window.location.href;
  const imageUrl = formatImageUrl(data, 'poster');
  const text = `Check out ${data.title} on LEMO OTT!`;
  const fullMessage = `${text}\n\n🎬 Watch now: ${url}`;
  let shareUrl = '';

  switch (platform) {
   case 'whatsapp':
    // WhatsApp doesn't support direct image sharing via URL easily in the message, but including it helps some crawlers
    shareUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
    break;
   case 'facebook':
    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    break;
   case 'twitter':
    shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    break;
   case 'copy':
    try {
     if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
     } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
     }
     showNotification('Link copied to clipboard!');
    } catch (err) {
     console.error('Copy failed:', err);
    }
    setIsShareModalOpen(false);
    return;
   default:
    break;
  }

  if (shareUrl) {
   window.open(shareUrl, '_blank');
   setIsShareModalOpen(false);
  }
 };

 const showNotification = (message) => {
  setNotification(message);
  setTimeout(() => setNotification(null), 4000);
 };

 const formatImageUrl = (item, typePref = 'poster') => {
  if (!item) return '';
  // If we passed a string directly instead of an object
  if (typeof item === 'string') {
   if (item.startsWith('http')) return item;
   const cleanPath = item.startsWith('/') ? item.substring(1) : item;
   return `/${cleanPath}`;
  }
  
  const url = item[typePref] || item.poster || item.logo || item.thumbnail || item.image || '';
  if (!url || typeof url !== 'string' || url.trim() === '') return '';
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  return `/${cleanPath}`;
 };

 const getTitle = (item) => {
  if (!item) return '';
  return item.title || item.name || item.channelName || '';
 };

  // Loading guard removed

 if (loading) {
  return (
   <FrontendLayout isTransparent={true} showFooter={true}>
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
     <Loader />
    </div>
   </FrontendLayout>
  );
 }

 if (!data) return <FrontendLayout><div style={{padding: '150px', textAlign: 'center', color: '#fff'}}>Content not found</div></FrontendLayout>;

 return (
  <FrontendLayout isTransparent={true}>
   <div className="fe-details-page-v">
    {notification && (
     <div className="fe-watchlist-notification-v">
      <div className="note-content-v">
       <Bookmark size={18} />
       <span>{notification}</span>
      </div>
      <Link to="/watchlist" className="view-wl-btn-v">VIEW WATCHLIST</Link>
     </div>
    )}

    {isShareModalOpen && (
     <div className="fe-share-modal-overlay-v" onClick={() => setIsShareModalOpen(false)}>
      <div className="fe-share-modal-v" onClick={e => e.stopPropagation()}>
       <div className="share-modal-header-v">
        <h3>Share this Content</h3>
        <button className="close-share-v" onClick={() => setIsShareModalOpen(false)}><X size={20} /></button>
       </div>
       
       <div className="share-preview-card-v">
        <div className="share-preview-img-v">
         <img src={formatImageUrl(data, 'poster')} alt="" />
        </div>
        <div className="share-preview-info-v">
         <h4>{data.title}</h4>
         <p>{(data.genres || []).join(', ') || 'Action'}</p>
        </div>
       </div>

       <div className="share-options-grid-v">
        <div className="share-option-v whatsapp-v" onClick={() => handleShare('whatsapp')}>
         <div className="share-icon-v"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.002 12.048c0 2.12.554 4.189 1.605 6.04L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.637 0 12.048-5.414 12.05-12.05a11.83 11.83 0 00-3.53-8.513z"/></svg></div>
         <span>WhatsApp</span>
        </div>
        <div className="share-option-v facebook-v" onClick={() => handleShare('facebook')}>
         <div className="share-icon-v"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>
         <span>Facebook</span>
        </div>
        <div className="share-option-v twitter-v" onClick={() => handleShare('twitter')}>
         <div className="share-icon-v"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg></div>
         <span>Twitter</span>
        </div>
        <div className="share-option-v copy-v" onClick={() => handleShare('copy')}>
         <div className="share-icon-v"><Share2 size={24} /></div>
         <span>Copy Link</span>
        </div>
       </div>
      </div>
     </div>
    )}
    
    {/* Main Content Hero */}
    <div className="fe-details-hero-v">
     <div className="fe-details-container-v">
      
      {/* Left: Poster/Video Preview */}
      <div className="fe-details-visual-v">
       <div className="fe-poster-wrapper-v">
        {(() => {
         const imgUrl = formatImageUrl(data, 'poster') || formatImageUrl(data, 'thumbnail') || (data.showId && typeof data.showId === 'object' && (formatImageUrl(data.showId, 'poster') || formatImageUrl(data.showId, 'thumbnail')));
         console.log('[DEBUG] Detail Image URL:', imgUrl);
         return <img src={imgUrl} alt={getTitle(data)} />;
        })()}
        <div className="fe-poster-overlay-v">
          <div className="fe-big-play-btn-v" onClick={() => {
           const filteredEpisodes = episodes.filter(ep => {
            if (data.contentType === 'Short Web Series') return true;
            if (!ep.seasonId) return false;
            const epSeasonIdStr = typeof ep.seasonId === 'object' ? (ep.seasonId._id || ep.seasonId.id || '').toString() : ep.seasonId.toString();
            const currentSeasonIdStr = selectedSeasonId ? selectedSeasonId.toString() : '';
            return epSeasonIdStr && currentSeasonIdStr && epSeasonIdStr === currentSeasonIdStr;
           });
           const firstEp = data.contentType === 'Short Web Series' ? episodes[0] : filteredEpisodes[0];
           const url = data.videoFile || data.videoUrl || data.streamUrl || data.videoFile1080 || data.videoFile720 || data.videoFile480 || 
                       data.server1Url || data.server2Url || data.server3Url || data.embedCode ||
                       (firstEp && (firstEp.videoFile || firstEp.videoUrl || firstEp.videoFile1080 || firstEp.videoFile720 || firstEp.videoFile480));
           if (url) {
            handlePlayVideo(url, firstEp);
           } else {
            alert('Video not available for this content.');
           }
          }}>
          <div className="pulse-ring-v"></div>
          <Play size={40} fill="white" />
         </div>
        </div>
       </div>
       
       {/* Bottom Stats */}
       <div className="fe-visual-stats-v">
        <div className="stat-item-v"><Eye size={16} /> <span>{formatViews(data.views, data._id)}</span></div>
        <div className="stat-item-v"><Calendar size={16} /> <span>{new Date(data.releaseDate || data.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span></div>
        <div className="stat-item-v"><Clock size={16} /> <span>{data.duration || '2h 30m'}</span></div>
        {(() => {
         const ratingVal = parseFloat(data.imdbRating || '7.5');
         const percentage = (ratingVal / 10) * 100;
         return (
          <div 
           className="fe-rating-circle-v" 
           style={{ background: `conic-gradient(#b3d332 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)` }}
          >
           <div className="rating-inner-v">
            <span className="imdb-val-v">{ratingVal.toFixed(1)}</span>
           </div>
          </div>
         );
        })()}
       </div>

       {/* Action Buttons */}
       <div className="fe-visual-actions-v">
        <button className={`action-btn-v watchlist-v ${isWatchlisted ? 'active' : ''}`} onClick={handleWatchlist}>
         {isWatchlisted ? <Check size={18} /> : <Plus size={18} />}
         <span>{isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
        </button>
        <button className="action-btn-v share-v" onClick={() => setIsShareModalOpen(true)}>
         <Share2 size={18} />
         <span>Share</span>
        </button>
       </div>
      </div>

      {/* Right: Info */}
      <div className="fe-details-info-v">
       {(() => {
        const parentShowTitle = data.showId && typeof data.showId === 'object' ? data.showId.title : '';
        if (parentShowTitle) {
         const normalizedType = type ? type.toLowerCase().trim() : '';
         const isSeason = normalizedType === 'season' || normalizedType === 'seasons';
         return (
          <span className="fe-episode-parent-show-v">
           {isSeason ? 'SEASON OF' : 'EPISODE OF'} <strong>{parentShowTitle}</strong>
          </span>
         );
        }
        return null;
       })()}
       <h1 className="fe-info-title-v">{getTitle(data)}</h1>
       <div className="fe-info-meta-top-v">
        <span className="meta-genre-v">{
         ((data.genres && data.genres.length > 0 ? data.genres : (data.showId && typeof data.showId === 'object' && data.showId.genres)) || []).join(' | ') || 'Drama'
        }</span>
        <span className="meta-sep-v">|</span>
        <span className="meta-lang-v">{data.language || (data.showId && typeof data.showId === 'object' && data.showId.language) || 'English'}</span>
       </div>

        {data.trailerUrl && data.trailerUrl.trim() !== "" && (
         <button className="fe-trailer-btn-v" onClick={() => window.open(data.trailerUrl, '_blank')}>
          <Play size={18} fill="currentColor" /> WATCH TRAILER
         </button>
        )}

        {(cleanType === 'live' || cleanType === 'channel' || cleanType === 'channels' || cleanType === 'tv-channel' || cleanType === 'tv-channels') && (
         <div className="fe-live-servers-v" style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0, textAlign: 'left' }}>Available Streaming Servers:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
           {data.server1Url && (
            <button 
             className="action-btn-v" 
             style={{ 
               background: activeVideoUrl === data.server1Url ? '#b3d332' : 'rgba(255,255,255,0.08)',
               color: activeVideoUrl === data.server1Url ? '#000' : '#fff',
               border: activeVideoUrl === data.server1Url ? 'none' : '1px solid rgba(255,255,255,0.1)',
               padding: '10px 18px',
               borderRadius: '25px',
               fontSize: '0.85rem',
               fontWeight: 800,
               cursor: 'pointer',
               transition: '0.3s'
             }}
             onClick={() => handlePlayVideo(data.server1Url)}
            >
             Server 1 (Primary)
            </button>
           )}
           {data.server2Url && (
            <button 
             className="action-btn-v" 
             style={{ 
               background: activeVideoUrl === data.server2Url ? '#b3d332' : 'rgba(255,255,255,0.08)',
               color: activeVideoUrl === data.server2Url ? '#000' : '#fff',
               border: activeVideoUrl === data.server2Url ? 'none' : '1px solid rgba(255,255,255,0.1)',
               padding: '10px 18px',
               borderRadius: '25px',
               fontSize: '0.85rem',
               fontWeight: 800,
               cursor: 'pointer',
               transition: '0.3s'
             }}
             onClick={() => handlePlayVideo(data.server2Url)}
            >
             Server 2 (Backup)
            </button>
           )}
           {data.server3Url && (
            <button 
             className="action-btn-v" 
             style={{ 
               background: activeVideoUrl === data.server3Url ? '#b3d332' : 'rgba(255,255,255,0.08)',
               color: activeVideoUrl === data.server3Url ? '#000' : '#fff',
               border: activeVideoUrl === data.server3Url ? 'none' : '1px solid rgba(255,255,255,0.1)',
               padding: '10px 18px',
               borderRadius: '25px',
               fontSize: '0.85rem',
               fontWeight: 800,
               cursor: 'pointer',
               transition: '0.3s'
             }}
             onClick={() => handlePlayVideo(data.server3Url)}
            >
             Server 3 (Backup)
            </button>
           )}
           {data.embedCode && (
            <button 
             className="action-btn-v" 
             style={{ 
               background: activeVideoUrl === data.embedCode ? '#b3d332' : 'rgba(255,255,255,0.08)',
               color: activeVideoUrl === data.embedCode ? '#000' : '#fff',
               border: activeVideoUrl === data.embedCode ? 'none' : '1px solid rgba(255,255,255,0.1)',
               padding: '10px 18px',
               borderRadius: '25px',
               fontSize: '0.85rem',
               fontWeight: 800,
               cursor: 'pointer',
               transition: '0.3s'
             }}
             onClick={() => handlePlayVideo(data.embedCode)}
            >
             External Player
            </button>
           )}
          </div>
         </div>
        )}

       {(type === 'movie' || type === 'show' || type === 'shows' || type === 'series' || type === 'short-web-series' || type === 'new-releases' || type === 'episode' || type === 'episodes' || type === 'season' || type === 'seasons') && (
        <div className="fe-info-cast-v">
         <p><strong>Actors:</strong> {
          (data.actors && data.actors.length > 0 ? data.actors : (data.showId && typeof data.showId === 'object' && data.showId.actors)) && 
          (data.actors && data.actors.length > 0 ? data.actors : (data.showId && data.showId.actors)).length > 0
          ? (data.actors && data.actors.length > 0 ? data.actors : data.showId.actors).map(a => typeof a === 'object' ? a.name : a).join(', ') 
          : 'N/A'
         }</p>
         <p><strong>Directors:</strong> {
          (data.directors && data.directors.length > 0 ? data.directors : (data.showId && typeof data.showId === 'object' && data.showId.directors)) && 
          (data.directors && data.directors.length > 0 ? data.directors : (data.showId && data.showId.directors)).length > 0
          ? (data.directors && data.directors.length > 0 ? data.directors : data.showId.directors).map(d => typeof d === 'object' ? d.name : d).join(', ') 
          : 'N/A'
         }</p>
        </div>
       )}

       <div className="fe-info-desc-v">
        <div dangerouslySetInnerHTML={{ __html: data.description || (data.showId && typeof data.showId === 'object' && data.showId.description) || 'No description available for this title.' }} />
       </div>
      </div>

     </div>
    </div>

    {/* TV Show Seasons & Episodes Section */}
    {(seasons.length > 0 || data.contentType === 'Short Web Series') && (
     <section className="fe-episodes-section-v">
      
      {/* Seasons Gallery Section */}
      {data.contentType !== 'Short Web Series' && seasons.length > 0 && (
       <div className="fe-seasons-block-v">
        <h2 className="fe-seasons-title-v">Seasons</h2>
        <div className="fe-seasons-grid-v">
         {seasons.map((season) => (
          <div 
           key={season._id} 
           className={`fe-season-card-v ${selectedSeasonId === season._id ? 'active' : ''}`}
           onClick={() => {
            navigate(`/details/seasons/${season._id}`);
           }}
          >
           <div className="fe-season-poster-wrapper-v">
            <img src={formatImageUrl(season, 'poster') || formatImageUrl(season, 'thumbnail')} alt={season.title} />
           </div>
           <h3 className="fe-season-card-title-v">{season.title}</h3>
          </div>
         ))}
        </div>
       </div>
      )}

      {/* Episodes Block Section */}
      {(() => {
       const isShortWeb = data.contentType === 'Short Web Series';
       let filteredEpisodes = episodes;
       let seasonNameText = '';
       
       if (!isShortWeb) {
        const selectedSeasonObj = seasons.find(s => s._id === selectedSeasonId);
        seasonNameText = selectedSeasonObj ? `${data.title} - ${selectedSeasonObj.title}` : '';
        filteredEpisodes = episodes.filter(ep => ep.seasonId === selectedSeasonId || (ep.seasonId && (ep.seasonId._id === selectedSeasonId || ep.seasonId === selectedSeasonId)));
       } else {
        seasonNameText = `${data.title} - Episodes`;
       }
       
       return (
        <div className="fe-episodes-block-v">
         {seasonNameText && <h2 className="fe-episodes-block-title-v">{seasonNameText}</h2>}
         {filteredEpisodes.length === 0 ? (
          <div className="no-episodes-v">No episodes available.</div>
         ) : (
          <div className="fe-episodes-grid-v">
           {filteredEpisodes.map((ep, idx) => (
            <div 
             key={ep._id} 
             className="fe-episode-card-v"
             onClick={() => {
              navigate(`/details/episodes/${ep._id}`);
             }}
            >
             <div className="fe-episode-thumb-wrapper-v">
              <img src={formatImageUrl(ep, 'poster') || formatImageUrl(ep, 'thumbnail')} alt={ep.title} />
              <div className="fe-episode-hover-play-v">
               <Play size={20} fill="white" color="white" />
              </div>
              {((data?.seriesAccess || '').toLowerCase() === 'paid' && (ep.access || '').toLowerCase() === 'paid') && (
               <div className="fe-episode-crown-tag-v">
                <Crown size={12} fill="white" color="white" />
               </div>
              )}
             </div>
             <h3 className="fe-episode-card-title-v">{ep.title}</h3>
            </div>
           ))}
          </div>
         )}
        </div>
       );
      })()}
     </section>
    )}

    {/* You May Also Like Section */}
    <section className="fe-related-section-v">
     <div className="section-header-v">
      <h2>You May Also Like</h2>
     </div>
     <div className={`fe-related-grid-v ${cleanType === 'sports' ? 'grid-sports-v' : cleanType === 'live' ? 'grid-live-v' : ''}`}>
      {related.map((item) => {
       let cardType = type;
       if (cleanType === 'show' || cleanType === 'shows' || cleanType === 'series' || cleanType === 'short-web-series' || cleanType === 'episode' || cleanType === 'episodes' || cleanType === 'season' || cleanType === 'seasons') {
        cardType = cleanType === 'short-web-series' ? 'short-web-series' : 'shows';
       }
       const isSports = cleanType === 'sports';
       const isLive = cleanType === 'live';
       return (
        <Link to={`/details/${cardType}/${item._id}`} key={item._id} className={`fe-related-card-v ${isSports ? 'related-sports-v' : isLive ? 'related-live-v' : ''}`}>
         <div className="related-poster-v">
          <img src={formatImageUrl(item, isSports ? 'landscape' : 'poster')} alt={getTitle(item)} />
          {checkIsPaid(item, isSports ? 'sports' : isLive ? 'live' : (cardType === 'shows' || cardType === 'short-web-series') ? 'show' : 'movie') && <div className="premium-tag-v"><Crown size={11} fill="currentColor" /></div>}
         </div>
         <h3>{getTitle(item)}</h3>
        </Link>
       );
      })}
     </div>
    </section>

    {/* Fullscreen Cinema Player Overlay */}
    {activeVideoUrl && (() => {
      const filteredEpisodes = episodes.filter(ep => {
        if (data.contentType === 'Short Web Series') return true;
        if (!ep.seasonId) return false;
        const epSeasonIdStr = typeof ep.seasonId === 'object' ? (ep.seasonId._id || ep.seasonId.id || '').toString() : ep.seasonId.toString();
        const currentSeasonIdStr = selectedSeasonId ? selectedSeasonId.toString() : '';
        return epSeasonIdStr && currentSeasonIdStr && epSeasonIdStr === currentSeasonIdStr;
      });

      const currentEpIndex = filteredEpisodes.findIndex(ep => {
        const epUrl = ep.videoFile || ep.videoUrl || ep.videoFile1080 || ep.videoFile720 || ep.videoFile480;
        return epUrl === activeVideoUrl;
      });

      const nextEpisode = currentEpIndex !== -1 && currentEpIndex < filteredEpisodes.length - 1 
        ? filteredEpisodes[currentEpIndex + 1] 
        : null;

      const getCurrentSubtitles = () => {
        if (!data) return { active: 'Inactive', list: [] };
        if (cleanType === 'shows' || cleanType === 'web-series' || cleanType === 'short-web-series') {
          const currentEp = episodes.find(ep => {
            const epUrl = ep.videoFile || ep.videoUrl || ep.videoFile1080 || ep.videoFile720 || ep.videoFile480;
            return epUrl === activeVideoUrl;
          });
          if (currentEp) {
            return {
              active: currentEp.subtitlesActive || 'Inactive',
              list: currentEp.subtitles || []
            };
          }
        }
        return {
          active: data.subtitlesActive || 'Inactive',
          list: data.subtitles || []
        };
      };

      const currentSubs = getCurrentSubtitles();

      return (
       <div className="fe-cinema-overlay-v">
        <div className="fe-cinema-container-v">
         <div className="fe-cinema-header-v">
          <button className="fe-cinema-close-v" onClick={() => setActiveVideoUrl(null)}>
           <X size={20} /> CLOSE PLAYER
          </button>
         </div>
         
         <div className="fe-cinema-content-v">
          {/* Left: Video Player */}
          <div className="fe-cinema-main-v">
           <VideoPlayer 
            src={activeVideoUrl} 
            videoTitle={data?.title}
            playerSettings={playerSettings}
            videoId={data?._id}
             subtitles={currentSubs.list}
             subtitlesActive={currentSubs.active}
             onEnded={() => {
               if (nextEpisode) {
                 const nextUrl = nextEpisode.videoFile || nextEpisode.videoUrl || nextEpisode.videoFile1080 || nextEpisode.videoFile720 || nextEpisode.videoFile480;
                 if (nextUrl) {
                   handlePlayVideo(nextUrl, nextEpisode);
                 }
               }
             }}
             onTimeUpdate={(currentTime, duration) => {
               if (duration && duration > 0) {
                 const timeRemaining = duration - currentTime;
                 if (timeRemaining <= 5) {
                   setShowNextBtn(true);
                 } else {
                   setShowNextBtn(false);
                 }
               }
             }}
           />

           {/* Floating Next Episode Button */}
           {nextEpisode && showNextBtn && (
            <button 
             className="fe-cinema-next-btn-v"
             onClick={() => {
              const nextUrl = nextEpisode.videoFile || nextEpisode.videoUrl || nextEpisode.videoFile1080 || nextEpisode.videoFile720 || nextEpisode.videoFile480;
              if (nextUrl) handlePlayVideo(nextUrl, nextEpisode);
             }}
            >
             <span className="btn-label-v">NEXT EPISODE</span>
             <div className="btn-title-row-v">
               <span className="btn-title-v">{nextEpisode.title}</span>
               <ChevronRight size={16} style={{ flexShrink: 0 }} />
             </div>
            </button>
           )}
          </div>

          {/* Right: Other Episodes Sidebar */}
          {(seasons.length > 0 || data.contentType === 'Short Web Series') && (
           <div className="fe-cinema-sidebar-v">
            <h3>Other Episodes</h3>
            <div className="fe-cinema-sidebar-list-v">
             {filteredEpisodes.map((ep, idx) => {
              const epUrl = ep.videoFile || ep.videoUrl || ep.videoFile1080 || ep.videoFile720 || ep.videoFile480;
              const isCurrentlyPlaying = activeVideoUrl === epUrl;
              return (
               <div 
                key={ep._id} 
                className={`fe-sidebar-episode-item-v ${isCurrentlyPlaying ? 'active' : ''}`}
                onClick={() => {
                 if (epUrl) {
                  handlePlayVideo(epUrl, ep);
                 } else {
                  alert('Video not available for this episode.');
                 }
                }}
               >
                <div className="fe-sidebar-episode-thumb-v">
                 <img src={formatImageUrl(ep, 'poster') || formatImageUrl(ep, 'thumbnail')} alt={ep.title} />
                 {isCurrentlyPlaying && (
                  <div className="playing-now-badge-v">PLAYING</div>
                 )}
                </div>
                <div className="fe-sidebar-episode-info-v">
                 <span className="ep-num-v">Episode {idx + 1}</span>
                 <h4>{ep.title}</h4>
                </div>
               </div>
              );
             })}
            </div>
           </div>
          )}
         </div>
        </div>
       </div>
      );
    })()}

   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    /* Seasons & Episodes Section styles */
    .fe-episodes-section-v { padding: 60px 5%; background: #080808; border-top: 1px solid #111; }
    .episodes-header-v { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
    .episodes-header-v h2 { font-size: 1.8rem; font-weight: 800; }
    
    .fe-seasons-block-v { margin-bottom: 40px; }
    .fe-seasons-title-v { font-size: 1.8rem; font-weight: 800; margin-bottom: 25px; color: #fff; }
    
    .fe-seasons-grid-v { display: flex; gap: 25px; overflow-x: auto; padding-bottom: 15px; scrollbar-width: thin; scrollbar-color: #333 #000; }
    .fe-seasons-grid-v::-webkit-scrollbar { height: 6px; }
    .fe-seasons-grid-v::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    
    .fe-season-card-v { flex: 0 0 170px; cursor: pointer; transition: 0.3s; }
    .fe-season-poster-wrapper-v { width: 100%; aspect-ratio: 2/3; border-radius: 12px; overflow: hidden; border: 2px solid #222; margin-bottom: 12px; transition: 0.3s; position: relative; }
    .fe-season-poster-wrapper-v img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
    
    .fe-season-card-v:hover .fe-season-poster-wrapper-v { border-color: #555; transform: translateY(-5px); }
    .fe-season-card-v:hover .fe-season-poster-wrapper-v img { transform: scale(1.05); }
    
    .fe-season-card-v.active .fe-season-poster-wrapper-v { border-color: #b3d332; box-shadow: 0 0 20px rgba(179,211,50,0.3); }
    .fe-season-card-title-v { font-size: 0.95rem; font-weight: 700; color: #aaa; transition: 0.3s; margin: 0; text-align: left; }
    
    .fe-season-card-v.active .fe-season-card-title-v { color: #b3d332; font-weight: 800; }
    
    .no-episodes-v { padding: 40px; text-align: center; color: #888; font-size: 1.1rem; }
    
    .fe-episodes-block-v { margin-top: 50px; border-top: 1px solid #111; padding-top: 40px; }
    .fe-episodes-block-title-v { font-size: 1.8rem; font-weight: 800; margin-bottom: 25px; color: #fff; text-align: left; }
    
    .fe-episodes-grid-v { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 15px; scrollbar-width: thin; scrollbar-color: #333 #000; }
    .fe-episodes-grid-v::-webkit-scrollbar { height: 6px; }
    .fe-episodes-grid-v::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    
    .fe-episode-card-v { flex: 0 0 240px; cursor: pointer; transition: 0.3s; }
    
    .fe-episode-thumb-wrapper-v { width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; border: 1px solid #222; margin-bottom: 12px; transition: 0.3s; position: relative; background: #000; }
    .fe-episode-thumb-wrapper-v img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
    
    .fe-episode-card-v:hover .fe-episode-thumb-wrapper-v { border-color: #444; transform: translateY(-5px); }
    .fe-episode-card-v:hover .fe-episode-thumb-wrapper-v img { transform: scale(1.05); }
    
    .fe-episode-hover-play-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; }
    .fe-episode-card-v:hover .fe-episode-hover-play-v { opacity: 1; }
    
    .fe-episode-crown-tag-v { position: absolute; top: 10px; right: 10px; background: #ff0000; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); }
    
    .fe-episode-card-title-v { font-size: 0.9rem; font-weight: 700; color: #aaa; transition: 0.3s; margin: 0; text-align: left; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    .fe-episode-card-v:hover .fe-episode-card-title-v { color: #fff; }
    
    /* Fullscreen Cinema Player styles */
    .fe-cinema-overlay-v { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #050505; z-index: 999999; display: flex; flex-direction: column; padding: 15px 25px 25px 25px; box-sizing: border-box; overflow: hidden; }
    .fe-cinema-container-v { display: flex; flex-direction: column; width: 100%; height: 100%; max-width: 100%; margin: 0 auto; gap: 15px; }
    
    .fe-cinema-header-v { display: flex; align-items: center; justify-content: flex-end; width: 100%; }
    .fe-cinema-close-v { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: opacity 0.3s ease, border-color 0.3s, color 0.3s, background-color 0.3s; padding: 8px 16px; border-radius: 20px; }
    .fe-cinema-close-v:hover { color: #b3d332; border-color: #b3d332; background: rgba(179,211,50,0.1); }
    .fe-cinema-container-v:has(.controls-hidden) .fe-cinema-close-v { opacity: 0; pointer-events: none; }
    
    .fe-cinema-content-v { display: flex; gap: 30px; width: 100%; flex: 1; min-height: 0; }
    
    /* Left Video */
    .fe-cinema-main-v { flex: 1; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 16px; overflow: hidden; border: 1px solid #222; box-shadow: 0 30px 100px rgba(0,0,0,0.8); height: 100%; position: relative; }
    .fe-cinema-video-v { width: 100%; height: 100%; object-fit: contain; }
    
    /* Floating Next Episode Button Styles */
    .fe-cinema-next-btn-v {
      position: absolute;
      top: 50%;
      right: 40px;
      transform: translateY(-50%);
      background: #b3d332;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      color: #000;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 3px;
      box-shadow: 0 10px 30px rgba(179,211,50,0.4);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 10;
      border: 1px solid rgba(255,255,255,0.1);
      text-align: left;
    }
    .fe-cinema-next-btn-v:hover {
      transform: translateY(-50%) scale(1.05);
      background: #fff;
      box-shadow: 0 15px 40px rgba(255,255,255,0.3);
    }
    .fe-cinema-next-btn-v .btn-label-v {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 1px;
      opacity: 0.8;
      text-transform: uppercase;
    }
    .fe-cinema-next-btn-v .btn-title-v {
      font-size: 0.9rem;
      font-weight: 800;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .fe-cinema-next-btn-v .btn-title-row-v {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
    }
    
    /* Right Sidebar for Other Episodes */
    .fe-cinema-sidebar-v { width: 340px; background: #0f0f0f; border-radius: 16px; border: 1px solid #222; display: flex; flex-direction: column; padding: 20px; box-sizing: border-box; height: 100%; }
    .fe-cinema-sidebar-v h3 { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0 0 20px 0; border-bottom: 1px solid #222; padding-bottom: 15px; text-align: left; }
    
    .fe-cinema-sidebar-list-v { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; scrollbar-width: thin; scrollbar-color: #333 #000; padding-right: 5px; }
    .fe-cinema-sidebar-list-v::-webkit-scrollbar { width: 4px; }
    .fe-cinema-sidebar-list-v::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    
    .fe-sidebar-episode-item-v { display: flex; gap: 12px; cursor: pointer; transition: 0.3s; padding: 8px; border-radius: 8px; border: 1px solid transparent; background: #141414; }
    .fe-sidebar-episode-item-v:hover { background: #1d1d1d; border-color: #333; }
    .fe-sidebar-episode-item-v.active { background: rgba(179,211,50,0.06); border-color: #b3d332; }
    
    .fe-sidebar-episode-thumb-v { width: 110px; aspect-ratio: 16/9; border-radius: 6px; overflow: hidden; background: #000; flex-shrink: 0; position: relative; }
    .fe-sidebar-episode-thumb-v img { width: 100%; height: 100%; object-fit: cover; }
    .playing-now-badge-v { position: absolute; bottom: 4px; right: 4px; background: #b3d332; color: #000; font-size: 0.5rem; font-weight: 900; padding: 2px 4px; border-radius: 3px; }
    
    .fe-sidebar-episode-info-v { display: flex; flex-direction: column; justify-content: center; min-width: 0; text-align: left; }
    .fe-sidebar-episode-info-v .ep-num-v { font-size: 0.7rem; font-weight: 800; color: #b3d332; text-transform: uppercase; margin-bottom: 3px; }
    .fe-sidebar-episode-info-v h4 { font-size: 0.85rem; font-weight: 700; color: #fff; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }
    .fe-sidebar-episode-item-v.active h4 { color: #b3d332; }

    .fe-details-page-v { background: #000; min-height: 100vh; padding-top: 100px; color: #fff; }
    
    .fe-details-hero-v { padding: 40px 5%; position: relative; }
    .fe-details-container-v { max-width: 1400px; margin: 0 auto; display: flex; gap: 50px; align-items: flex-start; }
    
    /* Visual Left */
    .fe-details-visual-v { flex: 0 0 55%; position: relative; }
    .fe-poster-wrapper-v { width: 100%; border-radius: 20px; overflow: hidden; position: relative; aspect-ratio: 16/9; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
    .fe-poster-wrapper-v img { width: 100%; height: 100%; object-fit: cover; }
    .fe-poster-overlay-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; }
    .fe-big-play-btn-v { width: 80px; height: 80px; background: #b3d332; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); color: #fff; position: relative; box-shadow: 0 0 30px rgba(22,196,127,0.5); z-index: 2; }
    .fe-big-play-btn-v:hover { transform: scale(1.1); background: #fff; color: #000; }
    .fe-big-play-btn-v:hover .pulse-ring-v { border-color: #fff; }

    .pulse-ring-v {
     position: absolute; width: 100%; height: 100%; border: 4px solid #b3d332; border-radius: 50%;
     animation: pulse-ripple 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    @keyframes pulse-ripple {
     0% { transform: scale(1); opacity: 0.8; }
     100% { transform: scale(2); opacity: 0; }
    }

    .fe-visual-stats-v { display: flex; align-items: center; gap: 12px; margin-top: 20px; color: #888; font-size: 0.75rem; font-weight: 600; }
    .stat-item-v { display: flex; align-items: center; gap: 6px; }
    .stat-item-v svg { width: 14px; height: 14px; }
    
    .fe-rating-circle-v { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 2px; font-size: 0.8rem; font-weight: 900; color: #fff; background: rgba(0,0,0,0.5); box-shadow: 0 0 15px rgba(22,196,127,0.2); animation: scaleIn 0.5s ease-out; }
    .rating-inner-v { background: #000; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; }
    .imdb-val-v { color: #b3d332; }

    @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }

    .fe-visual-actions-v { display: flex; gap: 15px; margin-top: 30px; }
    .action-btn-v { border: none; padding: 10px 20px; border-radius: 4px; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; }
    .watchlist-v { background: #b3d332; color: #fff; }
    .watchlist-v.active { background: #333; }
    .share-v { background: #0088ff; color: #fff; }
    .action-btn-v:hover { transform: translateY(-3px); filter: brightness(1.1); }

    /* Info Right */
    .fe-details-info-v { flex: 1; padding-top: 10px; }
    .fe-episode-parent-show-v { font-size: 0.8rem; font-weight: 800; color: #b3d332; text-transform: uppercase; margin-bottom: 10px; display: inline-block; letter-spacing: 1.5px; }
    .fe-info-title-v { font-size: 2.2rem; font-weight: 800; margin-bottom: 8px; line-height: 1.1; }
    .fe-info-meta-top-v { display: flex; align-items: center; gap: 12px; color: #aaa; font-weight: 700; margin-bottom: 20px; font-size: 0.9rem; }
    .meta-genre-v { color: #fff; }
    
    .fe-trailer-btn-v { background: #ff9800; color: #fff; border: none; padding: 14px 28px; border-radius: 8px; font-weight: 800; font-size: 0.85rem; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; margin-bottom: 40px; box-shadow: 0 10px 20px rgba(255,152,0,0.2); }
    .fe-trailer-btn-v:hover { background: #f57c00; transform: translateY(-2px); box-shadow: 0 15px 30px rgba(255,152,0,0.4); }

    .fe-info-cast-v { margin-bottom: 25px; border-left: 2px solid #b3d332; padding-left: 15px; }
    .fe-info-cast-v p { margin-bottom: 8px; color: #ddd; font-size: 0.85rem; line-height: 1.4; }
    .fe-info-cast-v strong { color: #fff; font-weight: 700; min-width: 80px; display: inline-block; }

    .fe-info-desc-v { color: #888; font-size: 0.9rem; line-height: 1.6; max-width: 800px; }

    /* Related Section */
    .fe-related-section-v { padding: 80px 5%; }
    .section-header-v { margin-bottom: 40px; border-bottom: 1px solid #222; padding-bottom: 20px; }
    .section-header-v h2 { font-size: 2rem; font-weight: 800; }
    
    .fe-related-grid-v { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 30px; }
    .fe-related-card-v { text-decoration: none; transition: 0.3s; }
    .related-poster-v { border-radius: 12px; overflow: hidden; aspect-ratio: 2/3; margin-bottom: 15px; position: relative; }
    .related-poster-v img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
    .fe-related-card-v:hover .related-poster-v img { transform: scale(1.1); }
    .fe-related-card-v h3 { font-size: 1rem; font-weight: 700; color: #fff; }
    
    /* Sports Overrides */
    .fe-related-grid-v.grid-sports-v {
     grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;
    }
    .fe-related-card-v.related-sports-v .related-poster-v {
     aspect-ratio: 16/9 !important;
     border-radius: 12px !important;
    }
    
    /* Live TV Channel Overrides */
    .fe-related-grid-v.grid-live-v {
     grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)) !important;
     gap: 20px !important;
    }
    .fe-related-card-v.related-live-v .related-poster-v {
     aspect-ratio: 1/1 !important;
     background: #15181e !important;
     border: 1px solid rgba(255,255,255,0.06) !important;
     border-radius: 16px !important;
     display: flex !important;
     align-items: center !important;
     justify-content: center !important;
    }
    .fe-related-card-v.related-live-v .related-poster-v img {
     width: 100% !important;
     height: 100% !important;
     object-fit: contain !important;
     padding: 15px !important;
    }
    .fe-related-card-v.related-live-v h3 {
     text-align: center !important;
     font-size: 0.85rem !important;
     margin-top: 8px !important;
    }
    
    .premium-tag-v { position: absolute; top: 10px; right: 10px; background: #ff9800; color: #000; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }

    @media (max-width: 1200px) {
     .fe-info-title-v { font-size: 2.8rem; }
     .fe-details-container-v { flex-direction: column; }
     .fe-details-visual-v { flex: 1; width: 100%; }
    }

    @media (max-width: 768px) {
     .fe-info-title-v { font-size: 2rem; }
     .fe-visual-stats-v { flex-wrap: wrap; gap: 15px; }
     .fe-info-meta-top-v { font-size: 0.9rem; margin-bottom: 20px; }
     .fe-info-desc-v { font-size: 0.95rem; }
     .fe-related-grid-v { grid-template-columns: repeat(2, 1fr); gap: 15px; }
     .fe-related-grid-v.grid-sports-v {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 15px !important;
     }
     .fe-related-grid-v.grid-live-v {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 12px !important;
     }
     .fe-related-card-v.related-live-v .related-poster-v {
      border-radius: 12px !important;
     }
     .fe-related-card-v.related-live-v .related-poster-v img {
      padding: 8px !important;
     }

     /* Cinema Overlay Mobile Responsiveness */
     .fe-cinema-overlay-v {
      padding: 10px;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
     }
     .fe-cinema-container-v {
      gap: 10px;
      height: 100%;
      display: flex;
      flex-direction: column;
     }
     .fe-cinema-content-v {
      flex-direction: column;
      gap: 15px;
      flex: 1;
      min-height: 0;
     }
     .fe-cinema-main-v {
      flex-shrink: 0;
      width: 100%;
      height: auto;
      aspect-ratio: 16/9;
     }
     .fe-cinema-sidebar-v {
      width: 100%;
      flex: 1;
      min-height: 0;
      border-radius: 12px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
     }
     .fe-cinema-next-btn-v {
      right: 15px;
      padding: 8px 16px;
     }
     .fe-cinema-next-btn-v .btn-title-v {
      font-size: 0.8rem;
      max-width: 100px;
     }
    }

    .fe-watchlist-notification-v { 
     position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); 
     background: #b3d332; color: #fff; padding: 12px 25px; border-radius: 12px; 
     display: flex; align-items: center; gap: 20px; z-index: 10000; 
     font-weight: 800; box-shadow: 0 20px 40px rgba(0,0,0,0.5); 
     animation: noteSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
     border: 1px solid rgba(255,255,255,0.2);
    }
    .note-content-v { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; }
    .view-wl-btn-v { background: #fff; color: #b3d332; padding: 6px 15px; border-radius: 6px; font-size: 0.7rem; text-decoration: none !important; transition: 0.3s; }
    .view-wl-btn-v:hover { background: #000; color: #fff; }
    
    .fe-share-modal-overlay-v { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 20000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
    .fe-share-modal-v { background: #111; border: 1px solid #222; border-radius: 20px; width: 90%; max-width: 400px; padding: 25px; animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .share-modal-header-v { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; }
    .share-modal-header-v h3 { margin: 0; font-size: 1.2rem; font-weight: 800; }
    .close-share-v { background: none; border: none; color: #888; cursor: pointer; transition: 0.3s; }
    .close-share-v:hover { color: #fff; transform: rotate(90deg); }
    
    .share-preview-card-v { background: #1a1a1a; border-radius: 12px; padding: 12px; display: flex; gap: 15px; align-items: center; margin-bottom: 25px; border: 1px solid #333; }
    .share-preview-img-v { width: 60px; height: 90px; border-radius: 6px; overflow: hidden; }
    .share-preview-img-v img { width: 100%; height: 100%; object-fit: cover; }
    .share-preview-info-v h4 { margin: 0 0 5px 0; font-size: 0.95rem; font-weight: 700; color: #fff; }
    .share-preview-info-v p { margin: 0; font-size: 0.75rem; color: #888; }

    .share-options-grid-v { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
    .share-option-v { display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; }
    .share-option-v:hover { transform: translateY(-5px); }
    .share-icon-v { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; }
    .share-option-v span { font-size: 0.7rem; font-weight: 700; color: #888; }
    
    .whatsapp-v .share-icon-v { background: #25D366; }
    .facebook-v .share-icon-v { background: #1877F2; }
    .twitter-v .share-icon-v { background: #1DA1F2; }
    .copy-v .share-icon-v { background: #444; }
    
    @keyframes modalSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes noteSlideUp { from { transform: translate(-50%, 40px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
   ` }} />
  </FrontendLayout>
 );
};

export default FrontendDetails;
