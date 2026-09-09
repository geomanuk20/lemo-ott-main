import React, { useState, useEffect } from 'react';
import { 
 Play,
 Crown,
 Smartphone,
 Sparkles
} from 'lucide-react';
import Loader from '../components/Loader';
import { Link, useNavigate } from 'react-router-dom';
import FrontendLayout from '../components/FrontendLayout';

const FrontendPocketReelSeries = () => {
 const navigate = useNavigate();
 const [shows, setShows] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  try {
   const cached = localStorage.getItem('fe_menu_settings');
   if (cached) {
    const settings = JSON.parse(cached);
    if (settings.pocketReelSeries?.toUpperCase() === 'OFF') {
     navigate('/', { replace: true });
     return;
    }
   }
  } catch (err) {
   console.error('Error parsing menu settings in pocket-reel-series page:', err);
  }

  const fetchShows = async () => {
   setLoading(true);
   try {
    const res = await fetch('/api/shows?contentType=Pocket Reel Series');
    const data = await res.json();
    setShows(Array.isArray(data) ? data.filter(s => s.status === 'Active') : []);
   } catch (err) {
    console.error('Error fetching pocket reel series:', err);
   } finally {
    setLoading(false);
   }
  };
  fetchShows();
 }, [navigate]);

 const formatImageUrl = (item) => {
  if (!item) return null;
  const url = item.poster || item.thumbnail || item.image || '';
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  return `/${cleanPath}`;
 };

 return (
  <FrontendLayout isTransparent={true}>
   {/* Hero Section */}
   <section className="fe-reel-hero">
    <div className="hero-bg-container">
     <img 
      src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" 
      alt="Netflix Cinema Wall" 
      className="hero-bg-img" 
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1920&q=80";
      }}
     />
    </div>
    <div className="hero-overlay"></div>
    <div className="hero-content">
     <h1>Pocket Reel Series<span style={{ color: '#b3d332' }}>.</span></h1>
     <p>Binge-watch bite-sized vertical reel series, thrilling short drama episodes, and exclusive pocket shows.</p>
    </div>
   </section>

   {/* Content Section */}
   <section className="fe-reel-content">
    <div className="shows-grid-container">
     {loading ? (
      <div className="fe-loader"><Loader size="small" /></div>
     ) : shows.length === 0 ? (
      <div className="fe-empty-state">
       <Smartphone size={48} color="#64748b" />
       <h2>No Pocket Reel Series Available</h2>
       <p>Exciting vertical drama series are coming soon!</p>
      </div>
     ) : (
      <div className="movies-grid">
       {shows.map((show) => {
        const ratingVal = parseFloat(show.imdbRating || show.rating || '8.5');
        const percentage = (ratingVal / 10) * 100;
        const year = show.releaseYear || (show.releaseDate ? new Date(show.releaseDate).getFullYear() : '2026');
        const quality = show.videoQuality;
        const parts = (quality || '').split(' ');
        const prefix = parts[0] || '';
        const suffix = parts.slice(1).join(' ') || '';

        return (
         <Link to={`/details/show/${show._id}`} key={show._id} className="fe-movie-card-new">
          <div className="card-image-wrapper">
           {formatImageUrl(show) && <img src={formatImageUrl(show)} alt={show.title} />}
           {((show.seriesAccess || '').toLowerCase() === 'paid') && (
            <div className="fe-premium-indicator-v">
             <Crown size={14} fill="currentColor" />
            </div>
           )}
           {show.upcoming === 'Yes' ? (
             <div className="card-overlay-hover" style={{ opacity: 1 }}>
               <div style={{ color: '#b3d332', fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.5px' }}>COMING SOON</div>
             </div>
           ) : (
             <div className="card-overlay-hover">
              {quality && quality !== 'None' && (
               <div className="fe-premium-badge-v">
                <span className="badge-prefix-v">{prefix}</span>
                <span className="badge-suffix-v">{suffix}</span>
               </div>
              )}
              <div 
               className="fe-badge-rating-v" 
               style={{ background: `conic-gradient(#b3d332 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)` }}
              >
               <div className="rating-inner-v">{ratingVal.toFixed(1)}</div>
              </div>
              <div className="play-icon-v"><Play fill="white" size={24} /></div>
             </div>
           )}
          </div>
          <div className="card-info-new">
           <div className="card-meta-top">
            <span className="age-badge">{show.contentRating || '16+'}</span>
            <span className="year-text">{year}</span>
           </div>
           <span className="genre-text-red">{show.genres?.[0] || 'Reel Drama'}</span>
           <h3 className="movie-title-v">{show.title}</h3>
          </div>
         </Link>
        );
       })}
      </div>
     )}
    </div>
   </section>

   <style dangerouslySetInnerHTML={{ __html: `
    .fe-reel-hero { position: fixed; top: 0; left: 0; width: 100%; height: 50vh; min-height: 400px; display: flex; align-items: center; padding: 0 10%; color: #fff; z-index: 1; overflow: hidden; background: #07080b; }
    .hero-bg-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; overflow: hidden; }
    .hero-bg-img { width: 100%; height: 100%; object-fit: cover; object-position: center center; filter: brightness(0.8) contrast(1.1) saturate(1.25); transform: scale(1.02); }
    .hero-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%), linear-gradient(to top, #050505 0%, rgba(5,5,5,0.5) 20%, transparent 60%); z-index: 2; }
    .hero-content { position: relative; z-index: 10; max-width: 800px; padding-top: 30px; text-shadow: 0 4px 20px rgba(0,0,0,0.9); }
    .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.65); border: 1px solid rgba(179,211,50,0.6); color: #b3d332; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; padding: 5px 14px; border-radius: 20px; margin-bottom: 14px; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
    .hero-content h1 { font-size: 4.5rem; font-weight: 800; margin: 0 0 15px 0; line-height: 1.05; letter-spacing: -2px; text-shadow: 0 10px 30px rgba(0,0,0,0.95); }
    .hero-content p { font-size: 1.25rem; font-weight: 400; color: rgba(255,255,255,0.95); line-height: 1.45; max-width: 620px; text-shadow: 0 4px 18px rgba(0,0,0,0.9); }
    
    .fe-reel-content { position: relative; z-index: 10; padding: 60px 8%; background: #050505; margin-top: 50vh; min-height: 60vh; box-shadow: 0 -25px 60px rgba(0,0,0,0.9); border-top: 1px solid rgba(255,255,255,0.06); }
    .movies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 190px)); gap: 24px; justify-content: flex-start; }
    .fe-movie-card-new { display: flex; flex-direction: column; transition: 0.3s ease; }
    .fe-movie-card-new:hover { transform: translateY(-6px); }
    .card-image-wrapper { position: relative; aspect-ratio: 2/3; border-radius: 10px; overflow: hidden; margin-bottom: 12px; background: #0c0d12; box-shadow: 0 8px 24px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); transition: border-color 0.3s ease, box-shadow 0.3s ease; }
    .fe-movie-card-new:hover .card-image-wrapper { border-color: rgba(179,211,50,0.6); box-shadow: 0 12px 28px rgba(0,0,0,0.7), 0 0 15px rgba(179,211,50,0.2); }
    .card-image-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
    .fe-movie-card-new:hover .card-image-wrapper img { transform: scale(1.06); }
    .card-overlay-hover { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; flex-direction: column; justify-content: space-between; padding: 12px; opacity: 1; transition: 0.3s; z-index: 5; }
    .play-icon-v { width: 40px; height: 40px; background: #b3d332; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.85); opacity: 0; transition: 0.3s ease; box-shadow: 0 4px 14px rgba(179,211,50,0.5); }
    .fe-movie-card-new:hover .play-icon-v { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    .card-info-new { padding: 4px 2px 0; }
    .movie-title-v { color: #fff; font-size: 0.88rem; font-weight: 700; margin: 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-meta-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .age-badge { color: #aaa; font-size: 0.62rem; font-weight: 800; border: 1px solid #333; padding: 1px 5px; border-radius: 3px; }
    .year-text { color: #666; font-size: 0.7rem; font-weight: 700; }
    .genre-text-red { color: #b3d332; font-size: 0.72rem; font-weight: 800; display: block; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .fe-premium-badge-v { display: flex; border: 1px solid #000; border-radius: 2px; overflow: hidden; background: #fff; line-height: 1; height: 16px; transform: scale(0.85); transform-origin: bottom left; }
    .badge-prefix-v { background: #000; color: #fff; font-size: 0.55rem; font-weight: 400; padding: 0 4px; display: flex; align-items: center; }
    .badge-suffix-v { background: #fff; color: #000; font-size: 0.65rem; font-weight: 800; padding: 0 4px; display: flex; align-items: center; }
    .fe-badge-rating-v { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 2px; font-size: 0.7rem; font-weight: 900; color: #fff; backdrop-filter: blur(8px); background: rgba(0,0,0,0.7); box-shadow: 0 0 10px rgba(179,211,50,0.3); transition: 0.3s; position: absolute; bottom: 10px; right: 10px; }
    .rating-inner-v { background: #000; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; }
    .fe-premium-indicator-v { position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #ffca28 0%, #ff8f00 100%); color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 8; box-shadow: 0 4px 12px rgba(255,143,0,0.4); border: 1px solid rgba(255,255,255,0.2); }
    .fe-loader { height: 300px; display: flex; align-items: center; justify-content: center; width: 100%; grid-column: 1 / -1; }
    .fe-empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; gap: 12px; }
    .fe-empty-state h2 { color: #fff; font-weight: 800; margin: 0; font-size: 1.5rem; }
    .fe-empty-state p { color: #8895a5; font-size: 0.95rem; margin: 0; }
    
    @media (max-width: 992px) { 
      .movies-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 170px)); gap: 16px; } 
      .hero-content h1 { font-size: 3.2rem; } 
    }
    @media (max-width: 768px) { 
      .fe-reel-hero { position: relative; height: auto; min-height: 240px; padding: 90px 20px 40px; }
      .hero-bg-container { position: absolute; }
      .movies-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; } 
      .hero-content h1 { font-size: 2.2rem; letter-spacing: -1px; margin-bottom: 8px; } 
      .hero-content p { font-size: 0.95rem; line-height: 1.4; }
      .fe-reel-content { padding: 25px 10px; margin-top: 0; }
      .card-info-new { padding: 0; }
      .movie-title-v { font-size: 0.72rem !important; line-height: 1.25; }
      .genre-text-red { font-size: 0.6rem !important; margin-bottom: 2px; }
      .age-badge { font-size: 0.5rem !important; padding: 1px 4px; }
      .year-text { font-size: 0.6rem !important; }
      .card-meta-top { margin-bottom: 3px; }
      .card-image-wrapper { margin-bottom: 8px; }
      .fe-badge-rating-v { width: 26px !important; height: 26px !important; font-size: 0.6rem !important; bottom: 6px !important; right: 6px !important; }
      .fe-premium-indicator-v { width: 20px !important; height: 20px !important; top: 6px !important; right: 6px !important; }
      .fe-premium-indicator-v svg { width: 10px !important; height: 10px !important; }
      .fe-premium-badge-v { bottom: 6px !important; left: 6px !important; height: 14px !important; }
      .badge-prefix-v { font-size: 0.45rem !important; padding: 0 3px !important; }
      .badge-suffix-v { font-size: 0.5rem !important; padding: 0 3px !important; }
    }
    @media (max-width: 480px) {
      .fe-reel-hero { min-height: 200px; padding: 80px 15px 30px; }
      .hero-content h1 { font-size: 1.8rem; }
      .hero-content p { display: none; }
      .movies-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
      .fe-reel-content { padding: 20px 8px; }
    }
   ` }} />
  </FrontendLayout>
 );
};

export default FrontendPocketReelSeries;
