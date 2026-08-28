import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCcw, Monitor, User, LogOut, UserCircle, CheckCircle2, Film, Menu } from 'lucide-react';

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCacheAlert, setShowCacheAlert] = useState(false);
  const [profileImg, setProfileImg] = useState('https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current page name from path
  const getPageTitle = () => {
    if (location.pathname.includes('/users/edit/')) return 'EDIT USER';
    if (location.pathname.includes('/users/history/')) return 'USER HISTORY';
    if (location.pathname.includes('/short-films/add')) return 'ADD SHORT FILM';
    if (location.pathname.includes('/short-films/edit/')) return 'EDIT SHORT FILM';
    if (location.pathname.includes('/movies/add')) return 'ADD MOVIE';
    if (location.pathname.includes('/movies/edit/')) return 'EDIT MOVIE';
    if (location.pathname.includes('/shows/add')) return 'ADD SHOW';
    if (location.pathname.includes('/shows/edit/')) return 'EDIT SHOW';
    if (location.pathname.includes('/shorts/add')) return 'ADD SHORT';
    if (location.pathname.includes('/shorts/edit/')) return 'EDIT SHORT';
    if (location.pathname.includes('/short-web-series/add')) return 'ADD SHORT WEB SERIES';
    if (location.pathname.includes('/short-web-series/edit/')) return 'EDIT SHORT WEB SERIES';
    if (location.pathname.includes('/subscription-plan/edit/')) return 'EDIT SUBSCRIPTION PLAN';
    if (location.pathname.includes('/subscription-plan/add')) return 'ADD SUBSCRIPTION PLAN';
    if (location.pathname.includes('/coupons/edit/')) return 'EDIT COUPON';
    if (location.pathname.includes('/coupons/add')) return 'ADD COUPON';
    if (location.pathname.includes('/slider/edit/')) return 'EDIT SLIDER';
    if (location.pathname.includes('/slider/add')) return 'ADD SLIDER';
    if (location.pathname.includes('/home-sections/edit/')) return 'EDIT HOME SECTION';
    if (location.pathname.includes('/home-sections/add')) return 'ADD HOME SECTION';
    if (location.pathname.includes('/payment-gateway/edit/')) return 'CONFIGURE PAYMENT GATEWAY';

    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return 'DASHBOARD';

    const isId = (str) => /^[0-9a-fA-F]{24}$/.test(str) || /^[0-9a-fA-F-]{32,}$/.test(str);
    const validSegment = [...segments].reverse().find(seg => !isId(seg) && seg !== 'admin');

    if (!validSegment) return 'DASHBOARD';
    return validSegment.toUpperCase().replace(/-/g, ' ');
  };

  const fetchHeaderProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.profileImage) {
        setProfileImg(user.profileImage);
      } else if (user.id) {
        const response = await fetch(`/api/users/${user.id}`);
        const data = await response.json();
        if (data.profileImage) {
          setProfileImg(data.profileImage);
          // Sync localStorage
          user.profileImage = data.profileImage;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
    } catch (err) {
      console.error('Error fetching header profile:', err);
    }
  };

  const handleRefresh = () => {
    setShowCacheAlert(true);
    // Simulate cache clearing and then refresh the entire app
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  useEffect(() => {
    fetchHeaderProfile();

    const handleProfileUpdate = () => {
      fetchHeaderProfile();
    };

    window.addEventListener('profileUpdate', handleProfileUpdate);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('profileUpdate', handleProfileUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      {showCacheAlert && (
        <div className="custom-header-alert">
          <div className="alert-content">
            <div className="check-icon-wrapper">
              <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
            </div>
            <span className="alert-text">Cache cleared successfully</span>
          </div>
        </div>
      )}

      <div className="header-title-section">
        <button 
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => document.body.classList.toggle('sidebar-active')}
          aria-label="Toggle Sidebar"
        >
          <Menu size={22} />
        </button>
        <h1>{getPageTitle()}</h1>
      </div>
      <div className="header-actions">
        {location.pathname === '/admin/dashboard' && (
          <RefreshCcw 
            size={20} 
            className={`header-icon ${showCacheAlert ? 'spinning' : ''}`} 
            onClick={handleRefresh} 
            title="Refresh Dashboard"
          />
        )}
        <Monitor 
          size={20} 
          className="header-icon" 
          onClick={() => window.open('/', '_blank')}
          title="View Frontend"
        />
        <div className="profile-wrapper" ref={dropdownRef}>
          <div className="profile-container" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <img 
              src={profileImg} 
              alt="Profile" 
              className="profile-img"
            />
          </div>
          
          {isDropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-item" onClick={() => { navigate('/admin/profile'); setIsDropdownOpen(false); }}>
                <UserCircle size={18} />
                <span>Profile</span>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item logout" onClick={() => {
                localStorage.clear();
                navigate('/admin/login');
              }}>
                <LogOut size={18} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .header {
          height: var(--header-height, 65px);
          background-color: var(--bg-sidebar, #0f1117);
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 0 24px !important;
          border-bottom: 2px solid var(--accent-red, #ff2a2a);
          position: sticky;
          top: 0;
          z-index: 90;
          width: 100%;
          box-sizing: border-box;
        }

        .header .header-title-section {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .header .header-title-section h1 {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header .header-actions {
          display: flex !important;
          align-items: center !important;
          gap: 18px !important;
          margin-left: auto !important;
          flex-shrink: 0 !important;
          width: auto !important;
        }

        .header .header-icon {
          color: var(--text-primary, #ffffff);
          cursor: pointer;
          transition: color 0.2s;
        }

        .header .header-icon:hover {
          color: var(--accent-red, #ff2a2a);
        }

        .header .profile-container {
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .header .profile-img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: block;
        }

        @media (max-width: 768px) {
          .header {
            padding: 0 14px !important;
          }
          .header .header-actions {
            gap: 14px !important;
            margin-left: auto !important;
            width: auto !important;
          }
        }

        .custom-header-alert {
          position: fixed;
          top: 30px;
          right: 30px;
          background-color: #ffffff;
          border-radius: 4px;
          padding: 15px 30px;
          box-shadow: 0 4px 25px rgba(0,0,0,0.4);
          z-index: 9999;
          animation: alertSlideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          min-width: 400px;
        }

        @keyframes alertSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .alert-text {
          color: #333333;
          font-size: 1.3rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .header-icon.spinning {
          animation: spinOnce 0.5s ease-in-out;
          color: #00c853;
        }

        @keyframes spinOnce {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
    </header>
  );
};

export default Header;
