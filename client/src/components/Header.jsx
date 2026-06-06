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
    const path = location.pathname.split('/').pop();
    if (!path || path === 'admin') return 'DASHBOARD';
    return path.toUpperCase().replace('-', ' ');
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
          title="Toggle Sidebar"
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
