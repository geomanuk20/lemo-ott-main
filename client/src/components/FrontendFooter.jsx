import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Shield, Info, MonitorPlay } from 'lucide-react';
import { formatBrandingUrl } from '../utils/branding';

const FrontendFooter = ({ settings = null }) => {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch('/api/pages');
        const data = await res.json();
        // Filter out the hardcoded pages so we don't have duplicates
        const hardcodedSlugs = ['about-us', 'contact-us', 'privacy-policy', 'terms-of-use', 'faq', 'help-center', 'supported-devices'];
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
              <Link to="/movies">Movies</Link>
              <Link to="/shows">TV Shows</Link>
              <Link to="/live-tv">Live TV</Link>
              <Link to="/subscription">Subscription</Link>
              <Link to="/submission">Submission</Link>
            </div>
            <div className="footer-col-v">
              <h4>COMPANY</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
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
          <p>{settings?.copyrightText || '© 2024 VIDEO OTT Platform. All Rights Reserved.'}</p>
          <div className="footer-icons-v">
            <Globe size={18} />
            <Shield size={18} />
            <MonitorPlay size={18} />
            <Info size={18} />
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
        .footer-icons-v { display: flex; gap: 20px; color: #333; }
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
