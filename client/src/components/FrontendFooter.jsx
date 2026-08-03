import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Shield, Info, MonitorPlay } from 'lucide-react';
import { formatBrandingUrl } from '../utils/branding';

const FrontendFooter = ({ settings = null, menuSettings = null }) => {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch('/api/pages');
        const data = await res.json();
        const hardcodedSlugs = ['about-us', 'contact-us', 'privacy-policy', 'terms-of-use', 'terms-of-service', 'faq', 'help-center', 'supported-devices', 'refund-policy'];
        const dynamicPages = data.filter(p => p.status === 'Active' && !hardcodedSlugs.includes(p.slug));
        setPages(dynamicPages);
      } catch (err) {
        console.error('Pages discovery anomaly:', err);
      }
    };
    fetchPages();
  }, []);

  return (
    <footer className="fe-footer-v">
      <div className="fe-footer-content-v">
        <div className="footer-top-v">
          <div className="footer-brand-v">
            <div className="fe-logo-v">
              {formatBrandingUrl(settings?.siteLogo) ? (
                <img src={formatBrandingUrl(settings.siteLogo)} alt={settings.siteName || "LEMO OTT"} />
              ) : (
                <img src="" />
              )}
            </div>
            <p>{settings?.description || 'Elevate your cinematic experience with our high-fidelity streaming platform. Discover the best in Hollywood and world cinema.'}</p>
          </div>
          <div className="footer-links-grid-v">
            <div className="footer-col-v">
              <h4>DISCOVER</h4>
              <Link to="/">Home</Link>
              {(!menuSettings || menuSettings.movies?.toUpperCase() !== 'OFF') && <Link to="/movies">Movies</Link>}
              {(!menuSettings || menuSettings.shows?.toUpperCase() !== 'OFF') && <Link to="/shows">TV Shows</Link>}
              {(!menuSettings || menuSettings.liveTv?.toUpperCase() !== 'OFF') && <Link to="/live-tv">Live TV</Link>}
              {(!menuSettings || menuSettings.sports?.toUpperCase() !== 'OFF') && <Link to="/sports">Sports</Link>}
              {(!menuSettings || menuSettings.shortFilms?.toUpperCase() !== 'OFF') && <Link to="/short-films">Short Films</Link>}
              {(!menuSettings || menuSettings.webSeries?.toUpperCase() !== 'OFF') && <Link to="/web-series">Web Series</Link>}
              {(!menuSettings || menuSettings.shorts?.toUpperCase() !== 'OFF') && <Link to="/shorts">Shorts</Link>}
              <Link to="/subscription">Subscription</Link>
              <Link to="/submission">Submission</Link>
            </div>
            <div className="footer-col-v">
              <h4>COMPANY</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/refund-policy">Refund Policy</Link>
            </div>
            <div className="footer-col-v">
              <h4>SUPPORT & PAGES</h4>
              <Link to="/faq">FAQ</Link>
              <Link to="/help">Help Center</Link>
              <Link to="/devices">Supported Devices</Link>
              {pages.map(page => (
                <Link key={page._id} to={`/${page.slug}`}>{page.title}</Link>
              ))}
            </div>
          </div>

        </div>
        <div className="footer-bottom-v">
          <p>{settings?.copyrightText ? settings.copyrightText.replace(/Video\.com/gi, 'lemoott.com').replace(/www\.viaviweb\.com/gi, 'lemoott.com') : `© ${new Date().getFullYear()} lemoott.com. All Rights Reserved.`}</p>
          <div className="footer-icons-v">
            {settings?.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            )}
            {settings?.twitterUrl && (
              <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              </a>
            )}
            {settings?.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
            )}
            <Link to="/" aria-label="Home"><Globe size={18} /></Link>
            <Link to="/privacy" aria-label="Privacy Policy"><Shield size={18} /></Link>
            <Link to="/live-tv" aria-label="Live TV"><MonitorPlay size={18} /></Link>
            <Link to="/about" aria-label="About Us"><Info size={18} /></Link>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .fe-footer-v { background: #080808; border-top: 1px solid #1a1a1a; padding: 80px 10% 40px 10%; color: #fff; position: relative; z-index: 20; }
        .fe-footer-content-v { max-width: 1400px; margin: 0 auto; }
        
        .footer-top-v { display: flex; justify-content: space-between; gap: 80px; margin-bottom: 60px; }
        .footer-brand-v { flex: 1.5; }
        .footer-brand-v .fe-logo-v { width: 120px; height: auto; display: flex; align-items: center; margin-bottom: 25px; }
        .footer-brand-v .fe-logo-v img { width: 100%; height: auto; object-fit: contain; }
        .footer-brand-v p { color: #888; font-size: 0.95rem; line-height: 1.6; max-width: 350px; }

        .footer-links-grid-v { flex: 3; display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
        .footer-col-v h4 { color: #fff; font-size: 0.8rem; font-weight: 800; letter-spacing: 2px; margin-bottom: 25px; }
        .footer-col-v a { display: block; color: #888; text-decoration: none; font-size: 0.9rem; margin-bottom: 12px; transition: 0.3s; }
        .footer-col-v a:hover { color: #b3d332; padding-left: 5px; }

        .footer-bottom-v { border-top: 1px solid #1a1a1a; padding-top: 40px; display: flex; justify-content: space-between; align-items: center; color: #555; font-size: 0.85rem; }
        .footer-icons-v { display: flex; gap: 20px; color: #555; }
        .footer-icons-v a { color: inherit; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: 0.3s; }
        .footer-icons-v a:hover { color: #b3d332; }
        .footer-icons-v *:hover { color: #b3d332; cursor: pointer; transition: 0.3s; }

        @media (max-width: 992px) {
          .footer-top-v { flex-direction: column; gap: 40px; }
          .footer-links-grid-v { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .footer-links-grid-v { grid-template-columns: 1fr; }
          .footer-bottom-v { flex-direction: column; gap: 20px; text-align: center; }
        }
      ` }} />
    </footer>
  );
};

export default FrontendFooter;
