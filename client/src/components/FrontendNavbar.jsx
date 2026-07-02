import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logoutUser } from '../utils/logout';
import { Search, Bookmark, User, Menu, X, LayoutDashboard, UserCircle, List, LogOut, ChevronDown } from 'lucide-react';
import { formatBrandingUrl } from '../utils/branding';

const isActive = (status) => {
  if (status === undefined || status === null) return true;
  if (typeof status === 'boolean') return status;
  const str = String(status).toLowerCase().trim();
  return str === 'active' || str === 'true' || str === '1';
};

const isMenuSettingActive = (item, menuSettings) => {
  if (!menuSettings) return true;

  const type = item.contentType;
  if (type === 'Movie' && menuSettings.movies?.toUpperCase() === 'OFF') return false;
  if (type === 'Short Film' && menuSettings.shortFilms?.toUpperCase() === 'OFF') return false;
  if (type === 'TV Show' && menuSettings.shows?.toUpperCase() === 'OFF') return false;
  if (type === 'Short Web Series' && menuSettings.webSeries?.toUpperCase() === 'OFF') return false;
  if (type === 'Sports' && menuSettings.sports?.toUpperCase() === 'OFF') return false;
  if (type === 'Live TV' && menuSettings.liveTv?.toUpperCase() === 'OFF') return false;

  return true;
};

const FrontendNavbar = ({
  isTransparent = true,
  isMenuOpen,
  setIsMenuOpen,
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  movies = [],
  hideNavElements = false,
  settings = null,
  menuSettings = null
}) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(false);
  const [scheduledStream, setScheduledStream] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };

    const checkLiveStream = async () => {
      try {
        const res = await fetch('/api/live-stream/active');
        if (res.ok) {
          const data = await res.json();
          setIsLiveStreamActive(!!data.isLive);
          
          if (!data.isLive && data.isScheduled && data.scheduledTime) {
            setScheduledStream({
              title: data.streamTitle,
              time: data.scheduledTime,
              category: data.streamCategory
            });
            const dismissed = sessionStorage.getItem('dismiss_schedule_banner');
            if (!dismissed) {
              setShowBanner(true);
            }
          } else {
            setScheduledStream(null);
            setShowBanner(false);
          }
        }
      } catch (err) {
        console.error('Error fetching active live stream state:', err);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdate', handleStorageChange);
    checkLiveStream();

    const interval = setInterval(checkLiveStream, 20000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdate', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
  };

  const formatImageUrl = (item) => {
    if (!item) return null;
    const url = item.poster || item.thumbnail || item.image || '';
    if (!url || typeof url !== 'string' || url.trim() === '') return null;
    if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `/${cleanPath}`;
  };

  return (
    <>
      {showBanner && scheduledStream && (
        <div className="fe-schedule-banner">
          <div className="banner-content">
            <span className="banner-icon">📅</span>
            <span className="banner-text">
              Upcoming Live: <strong>{scheduledStream.title}</strong> scheduled for{' '}
              <span className="highlight-time">
                {new Date(scheduledStream.time).toLocaleString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </span>
            <Link to="/live-tv" className="banner-link">View Details</Link>
          </div>
          <button 
            className="banner-close" 
            onClick={() => {
              setShowBanner(false);
              sessionStorage.setItem('dismiss_schedule_banner', 'true');
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <nav 
        className={`fe-navbar-v ${isTransparent && !scrolled ? 'transparent' : 'scrolled'} ${isSearchOpen ? 'hidden' : ''}`}
        style={showBanner && scheduledStream ? { top: '38px' } : {}}
      >
        <div className="fe-nav-left">
          <Link to="/" className={`fe-logo-v ${isMenuOpen ? 'hidden' : ''}`}>
            {formatBrandingUrl(settings?.siteLogo) ? (
              <img src={formatBrandingUrl(settings.siteLogo)} alt={settings.siteName || "LEMO OTT"} />
            ) : (
              <img src="" />
            )}
          </Link>
        </div>
        {!hideNavElements && (
          <div className="fe-nav-center-v desktop-only">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>HOME</Link>
            {(!menuSettings || menuSettings.movies?.toUpperCase() !== 'OFF') && (
              <Link to="/movies" className={location.pathname === '/movies' ? 'active' : ''}>MOVIES</Link>
            )}
            {(!menuSettings || menuSettings.shows?.toUpperCase() !== 'OFF') && (
              <Link to="/shows" className={location.pathname === '/shows' ? 'active' : ''}>TV SHOWS</Link>
            )}
            {(!menuSettings || menuSettings.sports?.toUpperCase() !== 'OFF') && (
              <Link to="/sports" className={location.pathname === '/sports' ? 'active' : ''}>SPORTS</Link>
            )}
            {(!menuSettings || menuSettings.liveTv?.toUpperCase() !== 'OFF') && (
              <Link 
                to="/live-tv" 
                className={location.pathname === '/live-tv' ? 'active' : ''}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                LIVE TV
                {isLiveStreamActive && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    background: '#ff4d4d',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px #ff4d4d',
                    display: 'inline-block',
                    animation: 'pulseLive 1.5s infinite'
                  }}></span>
                )}
              </Link>
            )}
            {(!menuSettings || menuSettings.shortFilms?.toUpperCase() !== 'OFF') && (
              <Link to="/short-films" className={location.pathname === '/short-films' ? 'active' : ''}>SHORT FILMS</Link>
            )}
            {(!menuSettings || menuSettings.webSeries?.toUpperCase() !== 'OFF') && (
              <Link to="/web-series" className={location.pathname === '/web-series' ? 'active' : ''}>WEB SERIES</Link>
            )}
            {(!menuSettings || menuSettings.shorts?.toUpperCase() !== 'OFF') && (
              <Link to="/shorts" className={location.pathname === '/shorts' ? 'active' : ''}>SHORTS</Link>
            )}
          </div>
        )}
        <div className="fe-nav-right">
          {!hideNavElements && (
            <>
              <Search size={20} className="fe-nav-icon desktop-only" onClick={() => setIsSearchOpen(true)} />
              <Link to={isLoggedIn ? "/watchlist" : "/login"}>
                <Bookmark size={20} className="fe-nav-icon desktop-only" />
              </Link>
            </>
          )}
          {!hideNavElements && (
            <>
              {isLoggedIn ? (
                <div className="fe-account-v desktop-only" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <div className="fe-profile-v">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage.startsWith('http') ? user.profileImage : `/uploads/${user.profileImage}`}
                        alt=""
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <span>{user.name?.split(' ')[0] || 'ACCOUNT'}</span>
                  <ChevronDown size={14} className={`fe-dropdown-arrow-v ${isDropdownOpen ? 'rotate' : ''}`} />

                  {isDropdownOpen && (
                    <div className="fe-dropdown-menu-v">
                      <Link to="/user/profile" className="fe-dropdown-item-v">
                        <UserCircle size={16} />
                        <span>Profile</span>
                      </Link>
                      <Link to="/watchlist" className="fe-dropdown-item-v">
                        <List size={16} />
                        <span>My Watchlist</span>
                      </Link>
                      <div className="fe-dropdown-divider-v"></div>
                      <button onClick={handleLogout} className="fe-dropdown-item-v logout-v">
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="fe-signin-btn-v desktop-only">
                  <LogOut size={16} className="rotate-180" />
                  <span>SIGN IN</span>
                </Link>
              )}
              <div className={`fe-mobile-toggle-v ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <Menu size={24} className="icon-menu-v" />
                <X size={24} className="icon-close-v" />
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fe-search-overlay-v">
          <button className="fe-search-close-v" onClick={() => setIsSearchOpen(false)}>
            <X size={32} />
          </button>

          <div className="fe-search-container-v">
            <div className="fe-search-input-group-v">
              <label>SEARCH</label>
              <input
                type="text"
                placeholder="Search movies, shows, sports..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="fe-search-results-v">
              {searchQuery.length > 0 ? (
                <div className="fe-search-category-v">
                  <h3>Results</h3>
                  <div className="fe-search-row-v">
                    {movies
                      .filter(m => isActive(m.status) && isMenuSettingActive(m, menuSettings) && m.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 16)
                      .map(m => (
                        <Link
                          to={`/details/${m.routeType}/${m._id}`}
                          key={m._id}
                          className="fe-search-card-v"
                          onClick={() => setIsSearchOpen(false)}
                          style={{ textDecoration: 'none' }}
                        >
                          <div className="fe-search-poster-v" style={{ position: 'relative' }}>
                            {formatImageUrl(m) && <img src={formatImageUrl(m)} alt={m.title} />}
                            <span className={`fe-search-badge-v category-${m.routeType}`}>
                              {m.contentType}
                            </span>
                          </div>
                          <span className="fe-search-card-title-v">{m.title}</span>
                        </Link>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="fe-search-empty-v">Start typing to search...</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .fe-navbar-v { position: fixed; top: 0; left: 0; width: 100%; height: 90px; display: flex; align-items: center; justify-content: space-between; padding: 0 60px; z-index: 11000; transition: 0.5s cubic-bezier(0.16, 1, 0.3, 1); background: transparent; }
        .fe-navbar-v.hidden { opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-20px); }
        .fe-navbar-v.transparent { background: transparent; }
        .fe-navbar-v.scrolled { background: rgba(5, 5, 5, 0.8) !important; backdrop-filter: blur(15px) !important; height: 75px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); }
        
        .fe-nav-left { display: flex; align-items: center; }
        .fe-logo-v { width: 180px; height: auto; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
        .fe-logo-v.hidden { opacity: 0; pointer-events: none; }
        .fe-logo-v img { width: 100%; height: auto; object-fit: contain; }
        
        .fe-nav-center-v { display: flex; gap: 35px; align-items: center; }
        .fe-nav-center-v a { color: #fff; text-decoration: none; font-size: 0.85rem; font-weight: 800; letter-spacing: 1.5px; opacity: 0.6; transition: 0.3s; }
        .fe-nav-center-v a:hover, .fe-nav-center-v a.active { opacity: 1; color: #b3d332; }
        
        .fe-nav-right { display: flex; align-items: center; gap: 25px; }
        .fe-nav-icon { color: #fff; cursor: pointer; transition: 0.3s; }
        .fe-nav-icon:hover { color: #b3d332; transform: scale(1.1); }
        
        .fe-account-v { display: flex; align-items: center; gap: 10px; cursor: pointer; position: relative; padding: 5px 10px; border-radius: 30px; transition: 0.3s; }
        .fe-account-v:hover { background: rgba(255,255,255,0.05); }
        .fe-account-v span { font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; color: rgba(255,255,255,0.8); }
        .fe-profile-v { width: 32px; height: 32px; border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); overflow: hidden; }
        .fe-dropdown-arrow-v { color: rgba(255,255,255,0.4); transition: 0.3s; }
        .fe-dropdown-arrow-v.rotate { transform: rotate(180deg); }
        
        .fe-dropdown-menu-v { position: absolute; top: calc(100% + 15px); right: 0; background: #111; border: 1px solid #222; border-radius: 12px; min-width: 200px; padding: 10px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); animation: feDropdownSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1); z-index: 100; }
        @keyframes feDropdownSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .fe-dropdown-item-v { display: flex; align-items: center; gap: 12px; padding: 12px 15px; color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.85rem; font-weight: 600; border-radius: 8px; transition: 0.2s; border: none; background: none; width: 100%; text-align: left; cursor: pointer; }
        .fe-dropdown-item-v:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .fe-dropdown-item-v.logout-v { color: #ff4d4d; }
        .fe-dropdown-item-v.logout-v:hover { background: rgba(255,77,77,0.1); }
        .fe-dropdown-divider-v { height: 1px; background: #222; margin: 8px 10px; }
        
        .fe-signin-btn-v { background: #b3d332; color: #fff; text-decoration: none; padding: 10px 25px; border-radius: 30px; font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; transition: 0.3s; box-shadow: 0 10px 20px rgba(179,211,50,0.2); }
        .fe-signin-btn-v:hover { transform: scale(1.05); background: #b3d332; box-shadow: 0 15px 30px rgba(179,211,50,0.4); }
        .rotate-180 { transform: rotate(180deg); }
        
        .fe-search-overlay-v { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: #000; z-index: 12000; padding: 100px 10%; display: flex; flex-direction: column; animation: feFadeIn 0.4s ease-out; }
        @keyframes feFadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .fe-search-close-v { position: absolute; top: 30px; right: 60px; background: none; border: none; color: #fff; cursor: pointer; transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; }
        .fe-search-close-v:hover { transform: rotate(90deg) scale(1.2); color: #b3d332; }
        .fe-mobile-toggle-v { display: none; cursor: pointer; color: #fff; position: relative; z-index: 11000; transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); width: 40px; height: 40px; align-items: center; justify-content: center; }
        .fe-mobile-toggle-v:hover { transform: scale(1.15); color: #b3d332; }
        .fe-mobile-toggle-v.active:hover { transform: scale(1.15) rotate(90deg); }
        .fe-mobile-toggle-v svg { transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .icon-close-v { display: none; }
        .fe-mobile-toggle-v.active .icon-menu-v { display: none; }
        .fe-mobile-toggle-v.active .icon-close-v { display: block; color: #b3d332; }

        @media (max-width: 1024px) {
          .desktop-only { display: none !important; }
          .fe-mobile-toggle-v { display: flex; }
          .fe-navbar-v { padding: 0 20px; height: 70px; position: fixed; background: transparent; transition: background 0.4s ease; }
          .fe-navbar-v.transparent { background: transparent !important; }
          .fe-navbar-v.scrolled { background: rgba(5,5,5,0.85) !important; backdrop-filter: blur(10px) !important; }
          .fe-logo-v { width: 140px; }
        }
        @media (max-width: 480px) {
          .fe-navbar-v { padding: 0 15px; height: 60px; }
          .fe-logo-v { width: 120px; }
          .fe-nav-right { gap: 12px; }
        }

        /* Search Overlay */
        .fe-search-overlay-v { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95); z-index: 6000; backdrop-filter: blur(20px); display: flex; flex-direction: column; align-items: center; padding-top: 100px; animation: searchFadeIn 0.3s ease-out; }
        @keyframes searchFadeIn { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
        .fe-search-close-v { position: absolute; top: 40px; right: 40px; background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; transition: 0.3s; }
        .fe-search-close-v:hover { color: #b3d332; transform: rotate(90deg); }
        .fe-search-container-v { width: 90%; max-width: 1400px; }
        .fe-search-input-group-v { display: flex; flex-direction: column; gap: 8px; margin-bottom: 40px; }
        .fe-search-input-group-v label { color: rgba(255,255,255,0.7); font-size: 0.7rem; font-weight: 800; letter-spacing: 1.5px; }
        .fe-search-input-group-v input { background: rgba(255,255,255,0.03); border: 1px solid #333; padding: 12px 20px; color: #fff; font-size: 1rem; font-weight: 500; outline: none; border-radius: 4px; width: 100%; }
        .fe-search-results-v { height: calc(100vh - 350px); overflow-y: auto; }
        .fe-search-category-v h3 { color: #fff; font-size: 1.2rem; font-weight: 800; margin-bottom: 25px; text-transform: uppercase; }
        .fe-search-row-v { display: flex; gap: 25px; flex-wrap: wrap; }
        .fe-search-card-v { width: 160px; transition: 0.3s; cursor: pointer; }
        .fe-search-poster-v { width: 100%; aspect-ratio: 2/3; border-radius: 8px; overflow: hidden; background: #111; margin-bottom: 12px; position: relative; }
        .fe-search-poster-v img { width: 100%; height: 100%; object-fit: cover; }
        .fe-search-card-title-v { color: #fff; font-size: 0.85rem; font-weight: 700; opacity: 0.6; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        
        .fe-search-badge-v {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(0, 0, 0, 0.75);
          color: #b3d332;
          font-size: 0.55rem;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: 1px solid rgba(179, 211, 50, 0.3);
          backdrop-filter: blur(4px);
          z-index: 5;
        }
        .fe-search-badge-v.category-show {
          color: #00cc66;
          border-color: rgba(0, 204, 102, 0.3);
        }
        .fe-search-badge-v.category-sports {
          color: #ffd700;
          border-color: rgba(255, 215, 0, 0.3);
        }
        .fe-search-badge-v.category-tv-channel {
          color: #ff4d4d;
          border-color: rgba(255, 77, 77, 0.3);
        }
        .fe-schedule-banner {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(90deg, #12141a 0%, #1c1e24 100%);
          border-bottom: 2px solid #b3d332;
          color: #fff;
          z-index: 13000;
          padding: 8px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          height: 38px;
          box-sizing: border-box;
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        .fe-schedule-banner .banner-content {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .fe-schedule-banner .banner-icon {
          font-size: 1rem;
        }
        .fe-schedule-banner .highlight-time {
          color: #b3d332;
          font-weight: 700;
          text-shadow: 0 0 10px rgba(179,211,50,0.3);
          margin-left: 5px;
        }
        .fe-schedule-banner .banner-link {
          background: #b3d332;
          color: #000;
          text-decoration: none;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          transition: 0.3s;
          margin-left: 10px;
        }
        .fe-schedule-banner .banner-link:hover {
          background: #fff;
          transform: translateY(-1px);
        }
        .fe-schedule-banner .banner-close {
          background: none;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: 0.3s;
        }
        .fe-schedule-banner .banner-close:hover {
          color: #ff4d4d;
        }

        @keyframes pulseLive {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 768px) {
          .fe-schedule-banner {
            height: auto;
            min-height: 38px;
            padding: 6px 12px;
            font-size: 0.75rem;
          }
          .fe-schedule-banner .banner-content {
            gap: 6px;
            flex-wrap: nowrap;
            overflow: hidden;
          }
          .fe-schedule-banner .banner-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: calc(100vw - 120px);
          }
          .fe-schedule-banner .banner-link {
            flex-shrink: 0;
            font-size: 0.65rem;
            padding: 2px 7px;
          }
        }
      ` }} />
    </>
  );
};

export default FrontendNavbar;
