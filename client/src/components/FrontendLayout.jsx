import React, { useState, useEffect } from 'react';
import FrontendNavbar from './FrontendNavbar';
import FrontendSidebar from './FrontendSidebar';
import FrontendFooter from './FrontendFooter';

const isActive = (status) => {
  if (status === undefined || status === null) return true;
  if (typeof status === 'boolean') return status;
  const str = String(status).toLowerCase().trim();
  return str === 'active' || str === 'true' || str === '1';
};

const FrontendLayout = ({ children, isTransparent = true, showFooter = true, showHeader = true, hideNavElements = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('fe_general_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [menuSettings, setMenuSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('fe_menu_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const fetchSearchData = async () => {
      let combined = [];

      // 1. Movies & Short Films
      try {
        const res = await fetch('/api/movies');
        if (res.ok) {
          const data = await res.json();
          const active = Array.isArray(data) ? data.filter(m => isActive(m.status)) : [];
          combined.push(...active.map(m => ({
            _id: m._id,
            title: m.title,
            poster: m.poster || m.thumbnail,
            contentType: m.contentType || 'Movie',
            routeType: 'movie',
            status: m.status
          })));
        }
      } catch (err) {
        console.error('Error fetching movies for search:', err);
      }

      // 2. TV Shows & Short Web Series
      try {
        const res = await fetch('/api/shows');
        if (res.ok) {
          const data = await res.json();
          const active = Array.isArray(data) ? data.filter(s => isActive(s.status)) : [];
          combined.push(...active.map(s => ({
            _id: s._id,
            title: s.title,
            poster: s.poster || s.thumbnail,
            contentType: s.contentType || 'TV Show',
            routeType: 'show',
            status: s.status
          })));
        }
      } catch (err) {
        console.error('Error fetching shows for search:', err);
      }

      // 3. Sports Videos
      try {
        const res = await fetch('/api/sports-videos');
        if (res.ok) {
          const data = await res.json();
          const active = Array.isArray(data) ? data.filter(sp => isActive(sp.status)) : [];
          combined.push(...active.map(sp => ({
            _id: sp._id,
            title: sp.title,
            poster: sp.poster || sp.landscapePoster,
            contentType: 'Sports',
            routeType: 'sports',
            status: sp.status
          })));
        }
      } catch (err) {
        console.error('Error fetching sports for search:', err);
      }

      // 4. Live TV Channels
      try {
        const res = await fetch('/api/tv-channels');
        if (res.ok) {
          const data = await res.json();
          const active = Array.isArray(data) ? data.filter(c => isActive(c.status)) : [];
          combined.push(...active.map(c => ({
            _id: c._id,
            title: c.name,
            poster: c.logo,
            contentType: 'Live TV',
            routeType: 'tv-channel',
            status: c.status
          })));
        }
      } catch (err) {
        console.error('Error fetching tv-channels for search:', err);
      }

      // 5. New Releases (Shorts)
      try {
        const res = await fetch('/api/new-releases');
        if (res.ok) {
          const data = await res.json();
          const active = Array.isArray(data) ? data.filter(nr => isActive(nr.status)) : [];
          combined.push(...active.map(nr => ({
            _id: nr._id,
            title: nr.title,
            poster: nr.poster || nr.thumbnail,
            contentType: 'New Release',
            routeType: 'new-releases',
            status: nr.status
          })));
        }
      } catch (err) {
        console.error('Error fetching new-releases for search:', err);
      }

      setMovies(combined);
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/general-settings');
        const data = await res.json();
        setSettings(data);
        localStorage.setItem('fe_general_settings', JSON.stringify(data));
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    const fetchMenuSettings = async () => {
      try {
        const res = await fetch('/api/menu-settings');
        if (res.ok) {
          const data = await res.json();
          setMenuSettings(data);
          localStorage.setItem('fe_menu_settings', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Error fetching menu settings:', err);
      }
    };

    fetchSearchData();
    fetchSettings();
    fetchMenuSettings();
  }, []);

  useEffect(() => {
    const updateSubscriptionClass = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const todayStr = new Date().toISOString().split('T')[0];
        const isExpired = user.expiryDate && user.expiryDate < todayStr;
        const isSubscribed = user.subscriptionPlan && user.subscriptionPlan !== 'Basic Plan' && !isExpired;
        
        if (isSubscribed) {
          document.body.classList.add('user-subscribed');
        } else {
          document.body.classList.remove('user-subscribed');
        }
      } catch (e) {
        console.error('Error updating subscription body class:', e);
      }
    };

    updateSubscriptionClass();

    // Listen for custom events when profile/user updates
    window.addEventListener('profileUpdate', updateSubscriptionClass);
    return () => {
      window.removeEventListener('profileUpdate', updateSubscriptionClass);
      document.body.classList.remove('user-subscribed');
    };
  }, []);

  return (
    <div className="frontend-wrapper">
      {showHeader && (
        <FrontendNavbar 
          isTransparent={isTransparent}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          movies={movies}
          settings={settings}
          menuSettings={menuSettings}
          hideNavElements={hideNavElements}
        />
      )}
  
      {showHeader && (
        <FrontendSidebar 
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          setIsSearchOpen={setIsSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          settings={settings}
          menuSettings={menuSettings}
        />
      )}

      <main className="fe-main-content">
        {children}
        {showFooter && <FrontendFooter settings={settings} />}
      </main>


      <style dangerouslySetInnerHTML={{ __html: `
        .frontend-wrapper { background: #050505; color: #fff; min-height: 100vh; font-family: 'Inter', sans-serif; overflow-x: hidden; position: relative; }
        .fe-main-content { position: relative; z-index: 10; }
        .fe-main-content:has(.fe-cinema-overlay-v) { z-index: 99999 !important; }
      ` }} />
    </div>
  );
};

export default FrontendLayout;
