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
 Tv,
 Crown
} from 'lucide-react';
import Loader from '../components/Loader';
import { Link, useNavigate } from 'react-router-dom';
import FrontendLayout from '../components/FrontendLayout';

const FrontendLiveTV = () => {
 const navigate = useNavigate();
 const [channels, setChannels] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  try {
   const cached = localStorage.getItem('fe_menu_settings');
   if (cached) {
    const settings = JSON.parse(cached);
    if (settings.liveTv?.toUpperCase() === 'OFF') {
     navigate('/', { replace: true });
     return;
    }
   }
  } catch (err) {
   console.error('Error parsing menu settings in live-tv page:', err);
  }

  const fetchChannels = async () => {
   setLoading(true);
   try {
    const res = await fetch('/api/tv-channels');
    const data = await res.json();
    let fetchedChannels = Array.isArray(data) ? data.filter(c => c.status === 'Active') : [];
    
    // Fetch active native live stream
    try {
      const activeStreamRes = await fetch('/api/live-stream/active');
      const activeStream = await activeStreamRes.json();
      if (activeStream) {
        if (activeStream.isLive) {
          const nativeStreamCard = {
            _id: 'lemo-live',
            name: activeStream.streamTitle,
            logo: activeStream.poster || 'https://images.unsplash.com/photo-1542204172-e7052809f852?w=800&q=80',
            tvAccess: 'free',
            category: { name: activeStream.streamCategory },
            isNativeStream: true,
            viewers: activeStream.viewers
          };
          fetchedChannels = [nativeStreamCard, ...fetchedChannels];
        } else if (activeStream.isScheduled && activeStream.scheduledTime) {
          const scheduledStreamCard = {
            _id: 'lemo-live',
            name: activeStream.streamTitle,
            logo: activeStream.poster || 'https://images.unsplash.com/photo-1542204172-e7052809f852?w=800&q=80',
            tvAccess: 'free',
            category: { name: activeStream.streamCategory },
            isNativeStream: true,
            isScheduled: true,
            scheduledTime: activeStream.scheduledTime
          };
          fetchedChannels = [scheduledStreamCard, ...fetchedChannels];
        }
      }
    } catch (err) {
      console.error('Error fetching active native stream:', err);
    }
    
    setChannels(fetchedChannels);
   } catch (err) {
    console.error('Error fetching channels:', err);
   } finally {
    setLoading(false);
   }
  };
  fetchChannels();
 }, [navigate]);

 const formatImageUrl = (item) => {
  if (!item) return null;
  const url = item.logo || item.poster || item.thumbnail || item.image || '';
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
     <h1>Live TV<span style={{ color: '#b3d332' }}>.</span></h1>
     <p>Watch live channels and broadcast events here to watch fixed</p>
    </div>
   </section>

   {/* Content Section */}
   <section className="fe-movies-content">
    <div className="channels-grid-container">
     {loading ? (
      <div className="fe-loader"><Loader size="small" /></div>
     ) : (
      <div className="movies-grid">
        {channels.map((channel) => {
         const quality = 'FULL HD';
         const prefix = '1080P';
         const suffix = 'FHD';

         if (channel.isScheduled) {
           return (
            <div 
              key={channel._id} 
              className="fe-movie-card-new native-live-card scheduled-card"
              style={{ cursor: 'default' }}
            >
              <div className="card-image-wrapper" style={{ border: '2px dashed #b3d332', opacity: 0.85 }}>
               {formatImageUrl(channel) && <img src={formatImageUrl(channel)} alt={channel.name} style={{ filter: 'brightness(0.6) grayscale(30%)' }} />}
               <div className="fe-live-badge-v" style={{ background: '#b3d332', boxShadow: '0 0 15px rgba(179, 211, 50, 0.6)', color: '#000' }}>
                <span>SCHEDULED</span>
               </div>
              </div>
              <div className="card-info-new">
               <div className="card-meta-top">
                <span className="age-badge" style={{ color: '#b3d332', borderColor: '#b3d332' }}>
                 📅 UPCOMING
                </span>
                <span className="year-text" style={{ color: '#b3d332', fontWeight: '800' }}>
                 {new Date(channel.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
               </div>
               <span className="genre-text-red" style={{ color: '#b3d332' }}>
                 Starts at {new Date(channel.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
              <h3 className="movie-title-v">{channel.name}</h3>
             </div>
            </div>
           );
         }

         return (
          <Link 
            to={`/details/live/${channel._id}`} 
            key={channel._id} 
            className={`fe-movie-card-new ${channel.isNativeStream ? 'native-live-card' : ''}`}
          >
          <div className="card-image-wrapper">
           {formatImageUrl(channel) && <img src={formatImageUrl(channel)} alt={channel.name} />}
           {(!channel.isNativeStream && (((channel.tvAccess || '').toLowerCase() === 'paid' || (channel.access || '').toLowerCase() === 'paid'))) && (
            <div className="fe-premium-indicator-v">
             <Crown size={14} fill="currentColor" />
            </div>
           )}
           <div className="card-overlay-hover">
            <div className="fe-premium-badge-v">
             <span className="badge-prefix-v">{channel.isNativeStream ? 'NATIVE' : prefix}</span>
             <span className="badge-suffix-v">{channel.isNativeStream ? 'STREAM' : suffix}</span>
            </div>
            <div className="fe-live-badge-v" style={channel.isNativeStream ? { background: '#ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)' } : {}}>
             <div className="live-dot-v"></div>
             <span>LIVE</span>
            </div>
            <div className="play-icon-v"><Play fill="white" size={24} /></div>
           </div>
          </div>
          <div className="card-info-new">
           <div className="card-meta-top">
            <span className="age-badge" style={channel.isNativeStream ? { color: '#ef4444', borderColor: '#ef4444' } : {}}>
             {channel.isNativeStream ? '🔴 ONLINE' : (channel.tvAccess || 'PAID')}
            </span>
            <span className="year-text" style={channel.isNativeStream ? { color: '#b3d332', fontWeight: '800' } : {}}>
             {channel.isNativeStream ? `${channel.viewers || 120} WATCHING` : 'BROADCAST'}
            </span>
           </div>
           <span className="genre-text-red">{channel.isNativeStream ? 'LEMO Live Broadcast' : (channel.category?.name || 'Entertainment')}</span>
           <h3 className="movie-title-v">{channel.name}</h3>
          </div>
         </Link>
        );
       })}
      </div>
     )}
    </div>
   </section>

   <style dangerouslySetInnerHTML={{ __html: `
    .fe-movies-hero { position: fixed; top: 0; left: 0; width: 100%; height: 45vh; min-height: 350px; background: url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80') center/cover; background-attachment: fixed; display: flex; align-items: center; padding: 0 10%; color: #fff; z-index: 1; overflow: hidden; cursor: pointer; }
    .hero-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%), linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 20%); z-index: 5; }
    .hero-content { position: relative; z-index: 10; max-width: 800px; }
    .hero-content h1 { font-size: 5rem; font-weight: 800; margin: 0 0 15px 0; line-height: 1; letter-spacing: -2px; }
    .hero-content p { font-size: 1.4rem; font-weight: 400; opacity: 0.9; color: rgba(255,255,255,0.8); line-height: 1.4; max-width: 600px; }
    
    .fe-movies-content { position: relative; z-index: 10; padding: 60px 10%; background: #050505; margin-top: 45vh; min-height: 60vh; box-shadow: 0 -20px 60px rgba(0,0,0,0.5); border-top: 1px solid rgba(255,255,255,0.05); }
    .movies-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; }
    .fe-movie-card-new { display: flex; flex-direction: column; transition: 0.3s; text-decoration: none; }
    .fe-movie-card-new.native-live-card .card-image-wrapper { border: 2px solid #b3d332; box-shadow: 0 0 20px rgba(179,211,50,0.4); }
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
    .fe-premium-badge-v { position: absolute; bottom: 15px; left: 15px; display: flex; border: 1px solid #000; border-radius: 2px; overflow: hidden; background: #fff; line-height: 1; height: 18px; }
    .badge-prefix-v { background: #000; color: #fff; font-size: 0.6rem; font-weight: 400; padding: 0 5px; display: flex; align-items: center; }
    .badge-suffix-v { background: #fff; color: #000; font-size: 0.7rem; font-weight: 800; padding: 0 5px; display: flex; align-items: center; }
    .fe-premium-indicator-v { position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #ffca28 0%, #ff8f00 100%); color: #000; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 8; box-shadow: 0 4px 15px rgba(255,143,0,0.4); border: 1px solid rgba(255,255,255,0.2); }
    
    .fe-live-badge-v { position: absolute; top: 15px; right: 15px; background: #b3d332; color: #fff; font-size: 0.65rem; font-weight: 900; padding: 4px 10px; border-radius: 4px; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 15px rgba(179,211,50,0.5); }
    .live-dot-v { width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: pulseLive 1.5s infinite; }
    @keyframes pulseLive { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }

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

export default FrontendLiveTV;
