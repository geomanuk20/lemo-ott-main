import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, ChevronDown, X, LayoutDashboard, UserCircle, List, LogOut } from 'lucide-react';
import { logoutUser } from '../utils/logout';

const FrontendSidebar = ({
  isMenuOpen,
  setIsMenuOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  settings = null,
  menuSettings = null
}) => {
  const location = useLocation();
  const [isAccountOpen, setIsAccountOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('token'));
  const [isLiveStreamActive, setIsLiveStreamActive] = React.useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  React.useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };

    const checkLiveStream = async () => {
      try {
        const res = await fetch('/api/live-stream/active');
        if (res.ok) {
          const data = await res.json();
          setIsLiveStreamActive(!!data.isLive);
        }
      } catch (err) {
        console.error('Error fetching active live stream state:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdate', handleStorageChange);
    checkLiveStream();

    const interval = setInterval(checkLiveStream, 20000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdate', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <>
      <div className={`fe-mobile-sidebar-v ${isMenuOpen ? 'open' : ''}`}>
        <div className="fe-sidebar-header-v">
          <div className="fe-sidebar-brand-v">
            <div className="fe-logo-v">
              {settings?.siteLogo ? (
                <img src={settings.siteLogo.startsWith('http') ? settings.siteLogo : `/${settings.siteLogo}`} alt={settings.siteName || "LEMO OTT"} />
              ) : (
                <img src="/assets/LOGO PNG-01.png" alt="LEMO OTT" />
              )}
            </div>
          </div>
        </div>
        <div className="fe-sidebar-content-v">
          <div className="fe-search-box-v">
            <input
              type="text"
              placeholder="Search movies, shows..."
              className="fe-sidebar-input-v"
              value={searchQuery}
              onFocus={() => {
                setIsSearchOpen(true);
                setIsMenuOpen(false);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
            />
            <button
              className="fe-sidebar-btn-v"
              onClick={() => {
                setIsSearchOpen(true);
                setIsMenuOpen(false);
              }}
            >
              FIND
            </button>
          </div>

          {isLoggedIn ? (
            <div className="fe-sidebar-account-section-v">
              <button
                className={`fe-sidebar-account-btn-v ${isAccountOpen ? 'active' : ''}`}
                onClick={() => setIsAccountOpen(!isAccountOpen)}
              >
                <div className="fe-sidebar-profile-v">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage.startsWith('http') ? user.profileImage : `/uploads/${user.profileImage}`}
                      alt=""
                    />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <span>MY ACCOUNT</span>
                <ChevronDown size={18} className={`fe-sidebar-chevron-v ${isAccountOpen ? 'rotate' : ''}`} />
              </button>

              <div className={`fe-sidebar-submenu-v ${isAccountOpen ? 'open' : ''}`}>
                <Link to="/user/profile" onClick={() => setIsMenuOpen(false)}>
                  <UserCircle size={16} /> Profile
                </Link>
                <Link to="/watchlist" onClick={() => setIsMenuOpen(false)}>
                  <List size={16} /> My Watchlist
                </Link>
                <button onClick={handleLogout} className="fe-sidebar-logout-v">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="fe-sidebar-signin-v" onClick={() => setIsMenuOpen(false)}>
              <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
              <span>SIGN IN</span>
            </Link>
          )}

          <div className="fe-sidebar-links-v">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>HOME</Link>
            {(!menuSettings || menuSettings.movies?.toUpperCase() !== 'OFF') && (
              <Link to="/movies" className={location.pathname === '/movies' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>MOVIES</Link>
            )}
            {(!menuSettings || menuSettings.shows?.toUpperCase() !== 'OFF') && (
              <Link to="/shows" className={location.pathname === '/shows' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>TV SHOWS</Link>
            )}
            {(!menuSettings || menuSettings.sports?.toUpperCase() !== 'OFF') && (
              <Link to="/sports" className={location.pathname === '/sports' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>SPORTS</Link>
            )}
            {(!menuSettings || menuSettings.liveTv?.toUpperCase() !== 'OFF') && (
              <Link 
                to="/live-tv" 
                className={location.pathname === '/live-tv' ? 'active' : ''} 
                onClick={() => setIsMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
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
              <Link to="/short-films" className={location.pathname === '/short-films' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>SHORT FILMS</Link>
            )}
            {(!menuSettings || menuSettings.webSeries?.toUpperCase() !== 'OFF') && (
              <Link to="/web-series" className={location.pathname === '/web-series' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>WEB SERIES</Link>
            )}
            {(!menuSettings || menuSettings.shorts?.toUpperCase() !== 'OFF') && (
              <Link to="/shorts" className={location.pathname === '/shorts' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>SHORTS</Link>
            )}
          </div>
        </div>
      </div>

      {isMenuOpen && <div className="fe-sidebar-overlay-v" onClick={() => setIsMenuOpen(false)}></div>}

      <style dangerouslySetInnerHTML={{
        __html: `
        .fe-mobile-sidebar-v { position: fixed; top: 0; left: -100%; right: auto; width: 300px; height: 100vh; background: #000; z-index: 10000; transition: 0.5s cubic-bezier(0.16, 1, 0.3, 1); padding: 0; display: flex; flex-direction: column; box-shadow: 10px 0 30px rgba(0,0,0,0.5); }
        .fe-mobile-sidebar-v.open { left: 0; }
        
        .fe-sidebar-header-v { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; background: #000; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .fe-logo-v { width: 120px; height: auto; display: flex; align-items: center; justify-content: center; }
        .fe-logo-v img { width: 100%; height: auto; object-fit: contain; }

        .fe-sidebar-content-v { padding: 30px 20px; opacity: 0; transform: translateX(-30px); transition: 0.5s 0.3s ease-out; flex: 1; overflow-y: auto; }
        .fe-mobile-sidebar-v.open .fe-sidebar-content-v { opacity: 1; transform: translateX(0); }

        .fe-search-box-v { display: flex; flex-direction: column; gap: 0; margin-bottom: 25px; border: 1px solid #333; overflow: hidden; border-radius: 4px; }
        .fe-sidebar-input-v { background: #fff; border: none; padding: 15px 20px; outline: none; font-size: 0.95rem; border-bottom: 1px solid #333; color: #000; width: 100%; }
        .fe-sidebar-btn-v { background: #1a1a1a; color: #fff; border: none; padding: 15px; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: 0.3s; }
        .fe-sidebar-btn-v:hover { background: #000; }
        
        .fe-sidebar-account-btn-v { background: #111; color: #fff; border: 1px solid #222; width: 100%; display: flex; align-items: center; gap: 15px; padding: 12px 20px; border-radius: 8px; font-weight: 700; font-size: 1rem; margin-bottom: 5px; cursor: pointer; transition: 0.3s; }
        .fe-sidebar-account-btn-v.active { border-color: #b3d332; background: rgba(179,211,50,0.05); }
        .fe-sidebar-profile-v { width: 35px; height: 35px; border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); overflow: hidden; }
        .fe-sidebar-profile-v img { width: 100%; height: 100%; object-fit: cover; }
        .fe-sidebar-chevron-v { margin-left: auto; color: #555; transition: 0.3s; }
        .fe-sidebar-chevron-v.rotate { transform: rotate(180deg); color: #b3d332; }

        .fe-sidebar-submenu-v { height: 0; overflow: hidden; transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; padding: 0 10px; }
        .fe-sidebar-submenu-v.open { height: auto; padding: 10px; margin-bottom: 20px; }
        .fe-sidebar-submenu-v a, .fe-sidebar-logout-v { color: #888; text-decoration: none; padding: 12px 15px; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 12px; border-radius: 6px; transition: 0.2s; }
        .fe-sidebar-submenu-v a:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .fe-sidebar-logout-v { background: none; border: none; width: 100%; text-align: left; cursor: pointer; color: #ff4d4d !important; }
        .fe-sidebar-logout-v:hover { background: rgba(255,77,77,0.1); }

        .fe-sidebar-signin-v { background: #b3d332; color: #fff; text-decoration: none; width: 100%; display: flex; align-items: center; gap: 15px; padding: 15px 20px; border-radius: 8px; font-weight: 800; font-size: 1rem; margin-bottom: 30px; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(179,211,50,0.2); }
        .fe-sidebar-signin-v:hover { transform: scale(1.02); background: #b3d332; }
        
        .fe-sidebar-links-v { display: flex; flex-direction: column; gap: 25px; }
        .fe-sidebar-links-v a { color: #fff; text-decoration: none; font-size: 1.05rem; font-weight: 700; letter-spacing: 1px; opacity: 0; transform: translateX(-20px); transition: 0.4s; }
        .fe-mobile-sidebar-v.open .fe-sidebar-links-v a { opacity: 0.9; transform: translateX(0); }
        .fe-mobile-sidebar-v.open .fe-sidebar-links-v a:hover, .fe-mobile-sidebar-v.open .fe-sidebar-links-v a.active { opacity: 1; color: #b3d332; }
        
        .fe-sidebar-links-v a:nth-child(1) { transition-delay: 0.4s; }
        .fe-sidebar-links-v a:nth-child(2) { transition-delay: 0.5s; }
        .fe-sidebar-links-v a:nth-child(3) { transition-delay: 0.6s; }
        .fe-sidebar-links-v a:nth-child(4) { transition-delay: 0.7s; }
        .fe-sidebar-links-v a:nth-child(5) { transition-delay: 0.8s; }

        .fe-sidebar-overlay-v { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); z-index: 9999; backdrop-filter: blur(4px); }
        @keyframes pulseLive {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      ` }} />
    </>
  );
};

export default FrontendSidebar;
