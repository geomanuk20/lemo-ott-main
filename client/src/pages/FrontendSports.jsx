import React, { useState, useEffect } from 'react';
import { 
 Search, 
 Bookmark, 
 User, 
 Menu, 
 X, 
 ChevronRight,
 Play,
 Loader2,
 Trophy,
 Crown
} from 'lucide-react';
import Loader from '../components/Loader';
import { Link, useNavigate } from 'react-router-dom';
import FrontendLayout from '../components/FrontendLayout';

const FrontendSports = () => {
 const navigate = useNavigate();
 const [sports, setSports] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  try {
   const cached = localStorage.getItem('fe_menu_settings');
   if (cached) {
    const settings = JSON.parse(cached);
    if (settings.sports?.toUpperCase() === 'OFF') {
     navigate('/', { replace: true });
     return;
    }
   }
  } catch (err) {
   console.error('Error parsing menu settings in sports page:', err);
  }

  const fetchSports = async () => {
   setLoading(true);
   try {
    const res = await fetch('/api/sports-videos');
    const data = await res.json();
    console.log('[DEBUG] Sports data raw:', data);
    // Temporarily remove filter to see everything
    const allSports = Array.isArray(data) ? data : [];
    console.log('[DEBUG] All sports count:', allSports.length);
    setSports(allSports);
   } catch (err) {
    console.error('Error fetching sports:', err);
   } finally {
    setLoading(false);
   }
  };
  fetchSports();
 }, [navigate]);

 const formatImageUrl = (item) => {
  if (!item) return null;
  // Prioritize poster for sports videos as per model
  const url = item.poster || item.thumbnail || item.image || '';
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  return `/${cleanPath}`;
 };

 return (
  <FrontendLayout isTransparent={true}>
   {/* Hero Section */}
   <section className="fe-movies-hero">
    <div className="hero-overlay"></div>
    <div className="hero-content">
     <h1>Sports<span style={{ color: '#b3d332' }}>.</span></h1>
     <p>Watch live sports, highlights and exclusive athletic events here to watch fixed</p>
    </div>
   </section>

   {/* Content Section */}
   <section className="fe-movies-content">
    <div className="sports-grid-container">
     {loading ? (
      <div className="fe-loader"><Loader size="small" /></div>
     ) : (
      <div className="movies-grid">
       {sports.map((sport) => {
        const quality = sport.videoType || '4K ULTRA';
        const prefix = quality.split(' ')[0] || '4K';
        const suffix = quality.split(' ').slice(1).join(' ') || 'ULTRA';

        const sportTitle = sport.title || 'Untitled Event';
        const categoryName = sport.category?.name || sport.categoryName || 'Live Event';

        return (
         <Link to={`/details/sports/${sport._id}`} key={sport._id} className="fe-movie-card-new">
          <div className="card-image-wrapper">
           <img 
            src={formatImageUrl(sport) || 'https://via.placeholder.com/300x168?text=Sports+Video'} 
            alt={sportTitle} 
           />
           {((sport.access || '').toLowerCase() === 'paid') && (
            <div className="fe-premium-indicator-v">
             <Crown size={14} fill="currentColor" />
            </div>
           )}
           <div className="card-overlay-hover">
            <div className="fe-premium-badge-v">
             <span className="badge-prefix-v">{prefix}</span>
             <span className="badge-suffix-v">{suffix}</span>
            </div>
            <div className="play-icon-v"><Play fill="white" size={24} /></div>
           </div>
          </div>
          <div className="card-info-new">
           <div className="card-meta-top">
            <span className="age-badge">ATHLETIC</span>
            <span className="year-text">SPORTS</span>
           </div>
           <span className="genre-text-red">{categoryName}</span>
           <h3 className="movie-title-v">{sportTitle}</h3>
          </div>
         </Link>
        );
       })}
      </div>
     )}
    </div>
   </section>

   <style dangerouslySetInnerHTML={{ __html: `
    .fe-movies-hero { position: fixed; top: 0; left: 0; width: 100%; height: 45vh; min-height: 350px; background: url('https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1920&q=80') center/cover; background-attachment: fixed; display: flex; align-items: center; padding: 0 10%; color: #fff; z-index: 1; overflow: hidden; cursor: pointer; }
    .hero-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%), linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 20%); z-index: 5; }
    .hero-content { position: relative; z-index: 10; max-width: 800px; }
    .hero-content h1 { font-size: 5rem; font-weight: 800; margin: 0 0 15px 0; line-height: 1; letter-spacing: -2px; }
    .hero-content p { font-size: 1.4rem; font-weight: 400; opacity: 0.9; color: rgba(255,255,255,0.8); line-height: 1.4; max-width: 600px; }
    
    .fe-movies-content { position: relative; z-index: 10; padding: 60px 10%; background: #050505; margin-top: 45vh; min-height: 60vh; box-shadow: 0 -20px 60px rgba(0,0,0,0.5); border-top: 1px solid rgba(255,255,255,0.05); }
    .movies-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; }
    .fe-movie-card-new { display: flex; flex-direction: column; transition: 0.3s; }
    .card-image-wrapper { position: relative; aspect-ratio: 16/9; border-radius: 4px; overflow: hidden; margin-bottom: 15px; background: #f0f0f0; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .card-image-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
    .card-overlay-hover { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding: 20px; opacity: 0; transition: 0.3s; z-index: 5; }
    .fe-movie-card-new:hover .card-overlay-hover { opacity: 1; }
    .fe-movie-card-new:hover .card-image-wrapper img { transform: scale(1.1); }
    .play-icon-v { width: 50px; height: 50px; background: #b3d332; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.8); transition: 0.3s; }
    .fe-movie-card-new:hover .play-icon-v { transform: translate(-50%, -50%) scale(1); }
    .card-info-new { padding: 0 5px; }
    .movie-title-v { color: #fff; font-size: 1rem; font-weight: 700; margin: 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .card-meta-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .age-badge { color: #aaa; font-size: 0.65rem; font-weight: 800; border: 1px solid #333; padding: 2px 6px; border-radius: 3px; }
    .year-text { color: #666; font-size: 0.75rem; font-weight: 700; }
    .genre-text-red { color: #b3d332; font-size: 0.8rem; font-weight: 800; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .fe-premium-badge-v { position: absolute; top: 15px; left: 15px; display: flex; border: 1px solid #000; border-radius: 2px; overflow: hidden; background: #fff; line-height: 1; height: 18px; }
    .badge-prefix-v { background: #000; color: #fff; font-size: 0.6rem; font-weight: 400; padding: 0 5px; display: flex; align-items: center; }
    .badge-suffix-v { background: #fff; color: #000; font-size: 0.7rem; font-weight: 800; padding: 0 5px; display: flex; align-items: center; }
    .fe-premium-indicator-v { position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #ffca28 0%, #ff8f00 100%); color: #000; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 8; box-shadow: 0 4px 15px rgba(255,143,0,0.4); border: 1px solid rgba(255,255,255,0.2); }
    
    .fe-loader { height: 300px; display: flex; align-items: center; justify-content: center; width: 100%; grid-column: span 4; }
    .spinner { animation: spin 1s linear infinite; color: #b3d332; width: 40px; height: 40px; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    
    @media (max-width: 1400px) { .movies-grid { grid-template-columns: repeat(3, 1fr); } .fe-loader { grid-column: span 3; } }
    @media (max-width: 992px) { .movies-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } .fe-loader { grid-column: span 2; } .hero-content h1 { font-size: 3.5rem; } }
    @media (max-width: 768px) { 
     .movies-grid { grid-template-columns: 1fr; gap: 20px; } 
     .fe-loader { grid-column: span 1; }
     .fe-movies-hero { height: 40vh; min-height: 300px; background-attachment: scroll; padding: 0 25px; } 
     .hero-content h1 { font-size: 2.8rem; letter-spacing: -1px; } 
     .hero-content p { font-size: 1.1rem; line-height: 1.3; }
     .fe-movies-content { padding: 40px 20px; margin-top: 40vh; } 
    }
    @media (max-width: 480px) {
     .hero-content h1 { font-size: 2.2rem; }
     .fe-movies-hero { height: 35vh; }
     .fe-movies-content { margin-top: 35vh; }
    }
   ` }} />
  </FrontendLayout>
 );
};

export default FrontendSports;
