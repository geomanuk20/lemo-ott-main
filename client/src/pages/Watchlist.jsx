import React, { useState, useEffect } from 'react';
import { Bookmark, Play, Trash2, Loader2, ArrowLeft, Heart } from 'lucide-react';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';
import FrontendLayout from '../components/FrontendLayout';

const Watchlist = () => {
 const navigate = useNavigate();
 const user = JSON.parse(localStorage.getItem('user') || '{}');
 const [watchlist, setWatchlist] = useState([]);
 const [loading, setLoading] = useState(true);
 const [notification, setNotification] = useState(null);

 const fetchWatchlist = async () => {
  if (!user.id) {
   setLoading(false);
   return;
  }
  setLoading(true);
  try {
   const response = await fetch(`/api/watchlist/${user.id}`);
   const data = await response.json();
   setWatchlist(Array.isArray(data) ? data : (data.items || data.watchlist || []));
  } catch (err) {
   console.error('Error fetching watchlist:', err);
   setWatchlist([]);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchWatchlist();
 }, []);

 const removeFromWatchlist = async (contentId, contentType) => {
  try {
   const response = await fetch('/api/watchlist/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, contentId, contentType })
   });
   if (response.ok) {
    setWatchlist(prev => prev.filter(item => item._id !== contentId));
    showNotification('Removed from watchlist');
   }
  } catch (err) {
   console.error('Error removing from watchlist:', err);
  }
 };

 const showNotification = (message) => {
  setNotification(message);
  setTimeout(() => setNotification(null), 3000);
 };

 const formatImageUrl = (item, typePref = 'thumbnail') => {
  if (!item) return '';
  const url = item[typePref] || item.thumbnail || item.poster || item.image || '';
  if (!url || typeof url !== 'string' || url.trim() === '') return '';
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  return `/${cleanPath}`;
 };

 return (
  <FrontendLayout isTransparent={true}>
   <div className="fe-watchlist-page-v">
    {notification && (
     <div className="fe-watchlist-notification-v">
      <Bookmark size={18} />
      <span>{notification}</span>
     </div>
    )}

    <div className="fe-watchlist-header-v">
     <div className="header-left-v">
      <button className="back-btn-v" onClick={() => navigate(-1)}>
       <ArrowLeft size={20} />
      </button>
      <div className="header-title-v">
       <h1>My Watchlist</h1>
       <p>{watchlist.length} {watchlist.length === 1 ? 'item' : 'items'} saved</p>
      </div>
     </div>
    </div>

    {loading ? (
     <div className="watchlist-loader-v">
      <Loader size="small" inline={true} />
      <p>Loading your favorites...</p>
     </div>
    ) : watchlist.length === 0 ? (
     <div className="empty-watchlist-v">
      <div className="empty-icon-v">
       <Bookmark size={80} />
      </div>
      <h2>Your watchlist is empty</h2>
      <p>Content you save will appear here for easy access later.</p>
      <button className="browse-btn-v" onClick={() => navigate('/')}>Browse Content</button>
     </div>
    ) : (
     <div className="watchlist-grid-v">
      {watchlist.map((item) => (
       <div key={item._id} className="watchlist-card-v">
        <div className="card-image-v">
         <img 
          src={formatImageUrl(item) || 'https://via.placeholder.com/400x225?text=No+Preview'} 
          alt={item.title} 
         />
         <div className="card-overlay-v">
          <button className="play-overlay-btn-v" onClick={() => navigate(`/${item.contentType}/${item._id}`)}>
           <Play size={24} fill="currentColor" />
          </button>
          <button className="remove-btn-v" onClick={() => removeFromWatchlist(item._id, item.contentType)}>
           <Trash2 size={18} />
          </button>
         </div>
         <div className="card-type-badge-v">{item.contentType.toUpperCase()}</div>
        </div>
        <div className="card-info-v">
         <h3>{item.title}</h3>
         <div className="card-meta-v">
          <span>{item.year || '2026'}</span>
          <span className="dot-v">•</span>
          <span>{item.duration || item.totalSeasons + ' Seasons' || '2h 15m'}</span>
         </div>
        </div>
       </div>
      ))}
     </div>
    )}
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .fe-watchlist-page-v { min-height: 100vh; background: #050505; padding: 120px 5% 60px; color: #fff; }
    
    .fe-watchlist-header-v { margin-bottom: 40px; }
    .header-left-v { display: flex; align-items: center; gap: 20px; }
    .back-btn-v { background: rgba(255,255,255,0.05); border: 1px solid #222; color: #fff; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
    .back-btn-v:hover { background: #b3d332; border-color: #b3d332; transform: translateX(-5px); }
    .header-title-v h1 { font-size: 2.5rem; font-weight: 800; margin: 0; }
    .header-title-v p { color: #888; font-weight: 700; font-size: 1rem; margin: 5px 0 0 0; }

    .watchlist-grid-v { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
    
    .watchlist-card-v { background: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid #222; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; }
    .watchlist-card-v:hover { transform: translateY(-10px); border-color: #b3d332; box-shadow: 0 15px 30px rgba(0,0,0,0.5); }
    
    .card-image-v { position: relative; aspect-ratio: 16/9; overflow: hidden; }
    .card-image-v img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
    .watchlist-card-v:hover .card-image-v img { transform: scale(1.1); }
    
    .card-overlay-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; gap: 15px; }
    .watchlist-card-v:hover .card-overlay-v { opacity: 1; }
    
    .play-overlay-btn-v { width: 50px; height: 50px; background: #fff; color: #000; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
    .play-overlay-btn-v:hover { transform: scale(1.1); background: #b3d332; color: #fff; }
    
    .remove-btn-v { width: 40px; height: 40px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
    .remove-btn-v:hover { background: #ff4d4d; border-color: #ff4d4d; }
    
    .card-type-badge-v { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.8); color: #b3d332; font-size: 0.65rem; font-weight: 900; padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(179,211,50,0.3); letter-spacing: 1px; }
    
    .card-info-v { padding: 20px; }
    .card-info-v h3 { font-size: 1.1rem; font-weight: 750; margin: 0 0 8px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card-meta-v { display: flex; align-items: center; gap: 10px; color: #666; font-size: 0.85rem; font-weight: 700; }
    .dot-v { color: #333; }

    .watchlist-loader-v { height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; color: #666; }
    .spinner-v { animation: spin 1s linear infinite; color: #b3d332; }
    
    .empty-watchlist-v { height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .empty-icon-v { color: #1a1a1a; margin-bottom: 25px; animation: pulse 2s infinite; }
    .empty-watchlist-v h2 { font-size: 2rem; font-weight: 800; margin-bottom: 10px; }
    .empty-watchlist-v p { color: #666; font-size: 1.1rem; margin-bottom: 30px; max-width: 400px; }
    .browse-btn-v { background: #b3d332; color: #fff; border: none; padding: 15px 40px; border-radius: 30px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(179,211,50,0.2); }
    .browse-btn-v:hover { transform: scale(1.05); background: #b3d332; box-shadow: 0 15px 30px rgba(179,211,50,0.4); }

    .fe-watchlist-notification-v { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: #fff; color: #000; padding: 15px 30px; border-radius: 12px; display: flex; align-items: center; gap: 12px; z-index: 10000; font-weight: 800; box-shadow: 0 20px 40px rgba(0,0,0,0.5); animation: noteSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
    @keyframes noteSlideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

    @media (max-width: 768px) {
     .watchlist-grid-v { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
     .header-title-v h1 { font-size: 1.8rem; }
    }
   ` }} />
  </FrontendLayout>
 );
};

export default Watchlist;
