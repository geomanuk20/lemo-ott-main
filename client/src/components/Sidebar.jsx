import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Globe, 
  Film, 
  Tv, 
  Trophy, 
  MonitorPlay, 
  Users, 
  Home, 
  CreditCard, 
  Tag, 
  Wallet, 
  FileText, 
  Settings, 
  PlusCircle,
  PlayCircle,
  Smartphone,
  Bell,
  RefreshCw,
  Send,
  Share2,
  Shield,
  Wrench,
  ChevronRight,
  UserCircle,
  Layers,
  Image,
  List,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { formatBrandingUrl } from '../utils/branding';

const Sidebar = () => {
  const [openSub, setOpenSub] = useState(null);
  const [notification, setNotification] = useState(null);
  const [settings, setSettings] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/general-settings');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error('Settings discovery anomaly:', err);
      }
    };
    fetchSettings();
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSubAdmin = user.role === 'sub-admin';

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { name: 'Language', icon: <Globe size={20} />, path: '/admin/language' },
    { name: 'Genres', icon: <Tag size={20} />, path: '/admin/genres' },
    { name: 'Movies', icon: <Film size={20} />, path: '/admin/movies' },
    { name: 'Short Film', icon: <PlayCircle size={20} />, path: '/admin/short-films' },
    { 
      name: 'Short Web Series', 
      icon: <Tv size={20} />, 
      path: '/admin/short-web-series', 
      hasSub: true,
      subItems: [
        { name: 'Series', icon: <Image size={16} />, path: '/admin/short-web-series' },
        { name: 'Episodes', icon: <List size={16} />, path: '/admin/short-web-series/episodes' },
      ]
    },
    { name: 'New Release', icon: <PlayCircle size={20} />, path: '/admin/new-release' },
    { 
      name: 'TV Shows', 
      icon: <Tv size={20} />, 
      path: '/admin/tv-shows', 
      hasSub: true,
      subItems: [
        { name: 'Shows', icon: <Image size={16} />, path: '/admin/tv-shows/shows' },
        { name: 'Seasons', icon: <Bell size={16} color="#ff4d4d" />, path: '/admin/tv-shows/seasons' },
        { name: 'Episodes', icon: <List size={16} />, path: '/admin/tv-shows/episodes' },
      ]
    },
    { 
      name: 'Sports', 
      icon: <Trophy size={20} />, 
      path: '/admin/sports', 
      hasSub: true,
      subItems: [
        { name: 'Sports Category', icon: <Layers size={16} />, path: '/admin/sports/category' },
        { name: 'Sports Video', icon: <PlayCircle size={16} />, path: '/admin/sports/video' },
      ]
    },
    // Only show these to Master Admin
    { 
      name: 'Cast & Crew', 
      icon: <UserCircle size={20} />, 
      path: '/admin/cast-crew', 
      hasSub: true,
      subItems: [
        { name: 'Actors', icon: <Users size={16} />, path: '/admin/cast-crew/actors' },
        { name: 'Directors', icon: <UserCircle size={16} />, path: '/admin/cast-crew/directors' },
      ]
    },
    ...(!isSubAdmin ? [
      { 
        name: 'Live TV', 
        icon: <MonitorPlay size={20} />, 
        path: '/admin/live-tv', 
        hasSub: true,
        subItems: [
          { name: 'TV Category', icon: <Layers size={16} />, path: '/admin/live-tv/category' },
          { name: 'TV Channel', icon: <Tv size={16} />, path: '/admin/live-tv/channel' },
        ]
      },
    ] : []),
    { 
      name: 'Home', 
      icon: <Home size={20} />, 
      path: '/admin/home', 
      hasSub: true,
      subItems: [
        { name: 'Slider', icon: <Image size={16} />, path: '/admin/home/slider' },
        { name: 'Experience', icon: <PlayCircle size={16} />, path: '/admin/home/experience' },
        { name: 'Images', icon: <Image size={16} />, path: '/admin/home/images' },
        { name: 'Home Sections', icon: <Layers size={16} />, path: '/admin/home/sections' },
      ]
    },
    // Only show these to Master Admin
    ...(!isSubAdmin ? [
      { 
        name: 'Users', 
        icon: <Users size={20} />, 
        path: '/admin/users', 
        hasSub: true,
        subItems: [
          { name: 'Users', icon: <Users size={16} />, path: '/admin/users/list' },
          { name: 'Sub Admin', icon: <UserCircle size={16} />, path: '/admin/users/sub-admin' },
          { name: 'Deleted Users', icon: <FileText size={16} />, path: '/admin/users/deleted' },
        ]
      },
      { name: 'Subscription Plan', icon: <CreditCard size={20} />, path: '/admin/subscription-plan' },
      { name: 'Coupons', icon: <Tag size={20} />, path: '/admin/coupons' },
      { name: 'Payment Gateway', icon: <Wallet size={20} />, path: '/admin/payment-gateway' },
      { name: 'Transactions', icon: <FileText size={20} />, path: '/admin/transactions' },
      { 
        name: 'Pages', 
        icon: <FileText size={20} />, 
        path: '/admin/pages', 
        hasSub: true,
        subItems: [
          { name: 'Pages', icon: <FileText size={16} />, path: '/admin/pages/list' },
          { name: 'Add Pages', icon: <PlusCircle size={16} />, path: '/admin/pages/add' },
        ]
      },
      { 
        name: 'Player Settings', 
        icon: <PlayCircle size={20} />, 
        path: '/admin/player-settings',
        hasSub: true,
        subItems: [
          { name: 'Player Settings', icon: <PlayCircle size={16} />, path: '/admin/player-settings/config' },
          { name: 'Player Ads', icon: <Tag size={16} />, path: '/admin/player-settings/ads' },
        ]
      },
      { 
        name: 'Settings', 
        icon: <Settings size={20} />, 
        path: '/admin/settings',
        hasSub: true,
        subItems: [
          { name: 'General', icon: <Settings size={16} />, path: '/admin/settings/general' },
          { name: 'SMTP Email', icon: <Send size={16} />, path: '/admin/settings/smtp' },
          { name: 'Social Login', icon: <Share2 size={16} />, path: '/admin/settings/social-login' },
          { name: 'Menu', icon: <List size={16} />, path: '/admin/settings/menu' },
          { name: 'reCAPTCHA', icon: <Shield size={16} />, path: '/admin/settings/recaptcha' },
          { name: 'Website Banner Ads', icon: <Image size={16} />, path: '/admin/settings/banner-ads' },
          { name: 'Site Maintenance', icon: <Wrench size={16} />, path: '/admin/settings/maintenance' },
        ]
      },
      { 
        name: 'Android App', 
        icon: <Smartphone size={20} />, 
        path: '/admin/android-app',
        hasSub: true,
        subItems: [
          { name: 'App Verify', icon: <CheckCircle2 size={16} />, path: '/admin/android-app/verify' },
          { name: 'App Settings', icon: <Settings size={16} />, path: '/admin/android-app/settings' },
          { name: 'Ad Settings', icon: <Tag size={16} />, path: '/admin/android-app/ads' },
          { name: 'Notification', icon: <Bell size={16} />, path: '/admin/android-app/notification' },
        ]
      },
    ] : [])
  ];

  const filteredMenuItems = menuItems; // Already filtered by spread logic above

  const handleToggleSub = (name) => {
    if (openSub === name) {
      setOpenSub(null);
    } else {
      setOpenSub(name);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearCache = () => {
    localStorage.clear();
    showNotification('System Cache Cleared Successfully');
  };

  return (
    <>
      {notification && (
        <div className="custom-alert-box-global">
          <div className="alert-content-global">
            {notification.type === 'success' ? (
              <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
            ) : (
              <XCircle size={42} color="#ff4d4d" strokeWidth={2.5} />
            )}
            <span className="alert-text-global">{notification.message}</span>
          </div>
        </div>
      )}
      <div className="sidebar">
        <div className="logo-section">
          {formatBrandingUrl(settings?.siteLogo) ? (
            <img src={formatBrandingUrl(settings.siteLogo)} alt={settings.siteName || "LEMO OTT"} className="admin-logo-img" />
          ) : (
            <img src="/assets/LOGO PNG-01.png" alt="LEMO OTT" className="admin-logo-img" />
          )}
        </div>
      <nav className="nav-menu">
        {menuItems.map((item, index) => (
          <div key={index}>
            {item.hasSub ? (
              <>
                <div 
                  className={`nav-item ${openSub === item.name || location.pathname.startsWith(item.path) ? 'open' : ''} ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                  onClick={() => handleToggleSub(item.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  <ChevronRight size={14} className="chevron" />
                </div>
                {(openSub === item.name || location.pathname.startsWith(item.path)) && item.subItems && (
                  <div className="sub-menu">
                    {item.subItems.map((sub, idx) => (
                      <NavLink 
                        key={idx} 
                        to={sub.path} 
                        className={({ isActive }) => `sub-item ${isActive ? 'active' : ''}`}
                      >
                        {sub.icon}
                        <span>{sub.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            )}
          </div>
        ))}
        
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        .clear-cache-btn { margin-top: 20px; color: #ff4d4d !important; cursor: pointer; transition: all 0.3s; }
        .clear-cache-btn:hover { background: rgba(255, 77, 77, 0.1) !important; color: #b3d332 !important; }
        .nav-divider { height: 1px; background: #222; margin: 15px 20px; }

        /* Global Notification Style - Upgraded & Forced Dark */
        .custom-alert-box-global { position: fixed !important; top: 50px !important; left: 50% !important; transform: translateX(-50%) !important; background: #000000 !important; border: 1px solid #333 !important; border-radius: 16px !important; padding: 30px 60px !important; z-index: 9999999 !important; box-shadow: 0 20px 50px rgba(0,0,0,1) !important; animation: slideDownGlobal 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important; display: block !important; }
        .alert-content-global { display: flex !important; flex-direction: column !important; align-items: center !important; gap: 20px !important; width: 100% !important; }
        .alert-text-global { color: #ffffff !important; font-size: 1.2rem !important; font-weight: 800 !important; text-align: center !important; white-space: nowrap !important; letter-spacing: 0.5px !important; text-transform: uppercase !important; }
        .admin-logo-img { width: 140px; height: auto; padding: 10px; }
        @keyframes slideDownGlobal { from { transform: translate(-50%, -150%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      ` }} />
    </div>
  </>
  );
};

export default Sidebar;
