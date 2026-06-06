import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Play, Star, Loader2, Crown } from 'lucide-react';
import Loader from '../components/Loader';
import FrontendLayout from '../components/FrontendLayout';
import { formatImageUrl } from '../utils/image';

const isActive = (status) => {
  if (status === undefined || status === null) return true;
  if (typeof status === 'boolean') return status;
  const str = String(status).toLowerCase().trim();
  return str === 'active' || str === 'true' || str === '1';
};

const isItemActive = (item, menuSettings) => {
  if (!menuSettings || !item) return true;
  
  let contentType = item.contentType;
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

const FrontendViewAll = () => {
 const { type, title } = useParams();
 const navigate = useNavigate();
 const [items, setItems] = useState([]);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
  try {
    const cached = localStorage.getItem('fe_menu_settings');
    if (cached) {
      const settings = JSON.parse(cached);
      if (type === 'movies' && settings.movies?.toUpperCase() === 'OFF') {
        navigate('/', { replace: true });
        return;
      }
      if (type === 'short-film' && settings.shortFilms?.toUpperCase() === 'OFF') {
        navigate('/', { replace: true });
        return;
      }
      if (type === 'shows' && settings.shows?.toUpperCase() === 'OFF') {
        navigate('/', { replace: true });
        return;
      }
      if (type === 'short-web-series' && settings.webSeries?.toUpperCase() === 'OFF') {
        navigate('/', { replace: true });
        return;
      }
      if (type === 'sports' && settings.sports?.toUpperCase() === 'OFF') {
        navigate('/', { replace: true });
        return;
      }
      if (type === 'live' && settings.liveTv?.toUpperCase() === 'OFF') {
        navigate('/', { replace: true });
        return;
      }
    }
  } catch (err) {
    console.error('Error redirecting in view-all:', err);
  }

  const fetchData = async () => {
   setLoading(true);
   try {
    let url = '';
    if (type === 'movies' || type === 'short-film') url = '/api/movies';
    else if (type === 'shows' || type === 'short-web-series') url = '/api/shows';
    else if (type === 'sports') url = '/api/sports-videos';
    else if (type === 'live') url = '/api/tv-channels';
    else if (type === 'new-releases') url = '/api/new-releases';

    const res = await fetch(url);
    const data = await res.json();
    
    let filteredData = Array.isArray(data) ? data.filter(item => isActive(item.status)) : [];

    // Filter items based on menu settings
    try {
      const cached = localStorage.getItem('fe_menu_settings');
      if (cached) {
        const settings = JSON.parse(cached);
        filteredData = filteredData.filter(item => isItemActive(item, settings));
      }
    } catch (err) {
      console.error('Error filtering view-all list:', err);
    }

    if (type === 'short-film') {
      filteredData = filteredData.filter(item => item.contentType === 'Short Film');
    } else if (type === 'short-web-series') {
      filteredData = filteredData.filter(item => item.contentType === 'Short Web Series');
    }

    // Special filtering for "Popular", "Trending", etc if needed
    if (title?.toLowerCase().includes('popular')) {
      // Sort by views or rating if available
      filteredData.sort((a, b) => parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0));
    }

    setItems(filteredData);
   } catch (err) {
    console.error('Error fetching section data:', err);
   } finally {
    setLoading(false);
   }
  };

  fetchData();
  window.scrollTo(0, 0);
 }, [type, title, navigate]);


 return (
  <FrontendLayout isTransparent={false}>
   <div className="fe-viewall-page-v">
    <div className="fe-viewall-header-v">
     <button className="back-btn-v" onClick={() => navigate(-1)}>
      <ChevronLeft size={24} />
     </button>
     <div className="header-info-v">
      <span className="type-tag-v">{type?.toUpperCase().replace('-', ' ')}</span>
      <h1>{title?.replace(/%20/g, ' ')}</h1>
     </div>
    </div>

    {items.length === 0 && !loading ? (
     <div className="empty-state-v">
      <p>No content found in this section.</p>
     </div>
    ) : (
     <div className="fe-viewall-grid-v">
      {items.map((item) => (
       <Link 
        to={`/details/${(type === 'shows' || type === 'short-web-series') ? 'show' : type === 'live' ? 'live' : type === 'sports' ? 'sports' : 'movie'}/${item._id}`} 
        key={item._id} 
        className="fe-grid-card-v"
       >
        <div className="card-poster-v">
         <img src={formatImageUrl(item, 'poster')} alt={item.title || item.name} />
          {(((type === 'shows' || type === 'short-web-series') ? (item.seriesAccess || '').toLowerCase() === 'paid' : type === 'live' ? ((item.tvAccess || '').toLowerCase() === 'paid' || (item.access || '').toLowerCase() === 'paid') : (item.access || '').toLowerCase() === 'paid')) && (
           <div className="premium-badge-v">
            <Crown size={12} fill="currentColor" />
           </div>
          )}
          <div className="card-overlay-v">
           {item.upcoming === 'Yes' ? (
             <div style={{ color: '#b3d332', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '1px' }}>COMING SOON</div>
           ) : (
             <div className="play-icon-v"><Play size={24} fill="white" /></div>
           )}
          </div>
        </div>
        <div className="card-info-v">
         {type !== 'live' && (
          <div className="card-meta-v">
           <span className="rating-v"><Star size={12} fill="#b3d332" color="#b3d332" /> {item.imdbRating || '7.5'}</span>
           <span className="year-v">{item.releaseYear || item.year || 2024}</span>
          </div>
         )}
         <h3>{item.title || item.name}</h3>
        </div>
       </Link>
      ))}
     </div>
    )}
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .fe-viewall-page-v { min-height: 100vh; background: #050505; padding: 120px 5% 60px; color: #fff; }
    
    .fe-viewall-header-v { display: flex; align-items: center; gap: 20px; margin-bottom: 50px; }
    .back-btn-v { background: rgba(255,255,255,0.05); border: 1px solid #222; color: #fff; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
    .back-btn-v:hover { background: #b3d332; border-color: #b3d332; transform: translateX(-5px); }
    
    .header-info-v h1 { font-size: 2.5rem; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
    .type-tag-v { color: #b3d332; font-size: 0.8rem; font-weight: 800; letter-spacing: 2px; }

    .fe-viewall-grid-v { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 30px; }
    
    .fe-grid-card-v { background: #0a0a0a; border-radius: 12px; overflow: hidden; border: 1px solid #1a1a1a; transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); text-decoration: none; }
    .fe-grid-card-v:hover { transform: translateY(-10px); border-color: #b3d332; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    
    .card-poster-v { position: relative; aspect-ratio: 2/3; overflow: hidden; }
    .card-poster-v img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s; }
    .fe-grid-card-v:hover .card-poster-v img { transform: scale(1.1); }
    
    .premium-badge-v { position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #ffca28 0%, #ff8f00 100%); color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 5; }
    
    .card-overlay-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; }
    .fe-grid-card-v:hover .card-overlay-v { opacity: 1; }
    .play-icon-v { width: 50px; height: 50px; background: #b3d332; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: scale(0.5); transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .fe-grid-card-v:hover .play-icon-v { transform: scale(1); }
    
    .card-info-v { padding: 15px; }
    .card-meta-v { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.75rem; font-weight: 700; color: #888; }
    .rating-v { color: #fff; display: flex; align-items: center; gap: 4px; }
    .card-info-v h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .fe-loading-v { height: 50vh; display: flex; align-items: center; justify-content: center; }
    .spinner-v { animation: spin 1s linear infinite; color: #b3d332; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
     .fe-viewall-grid-v { grid-template-columns: repeat(2, 1fr); gap: 15px; }
     .header-info-v h1 { font-size: 1.5rem; }
     .fe-viewall-page-v { padding-top: 100px; }
    }
   ` }} />
  </FrontendLayout>
 );
};

export default FrontendViewAll;
