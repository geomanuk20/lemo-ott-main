import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';

const API_URL = '/api/popup-ads';

const FrontendPopupAd = () => {
  const location = useLocation();
  const [adConfig, setAdConfig] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // Never show on admin or login redirection routes
    if (location.pathname.startsWith('/admin') || location.pathname === '/mobile-auth') {
      return;
    }

    const checkAndFetchAd = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) return;

        const data = await response.json();
        if (!data || data.status !== 'ON') return;

        // Check target page filter
        if (data.targetPages === 'home_only' && location.pathname !== '/') {
          return;
        }

        // Frequency evaluations
        const freq = data.frequency || 'every_session';
        const now = Date.now();

        if (freq === 'every_session') {
          const sessionSeen = sessionStorage.getItem('fe_popup_ad_seen');
          if (sessionSeen) return;
        } else if (freq === 'once_per_day') {
          const lastSeenStr = localStorage.getItem('fe_popup_ad_last_seen');
          if (lastSeenStr) {
            const lastSeen = parseInt(lastSeenStr, 10);
            if (now - lastSeen < 24 * 60 * 60 * 1000) {
              return; // Less than 24h passed
            }
          }
        } else if (freq === 'once') {
          const seenOnce = localStorage.getItem('fe_popup_ad_seen_once');
          if (seenOnce) return;
        }

        // Validate that there is content to show
        if (data.displayType === 'image' && !data.imageUrl) {
          return;
        }
        if (data.displayType === 'custom_code' && !data.customCode) {
          return;
        }

        setAdConfig(data);

        // Calculate delay
        const delayMs = Math.max(0, (Number(data.delaySeconds) || 0) * 1000);
        const timer = setTimeout(() => {
          setIsVisible(true);
          setHasTriggered(true);

          // Mark frequency as seen when displayed
          if (freq === 'every_session') {
            sessionStorage.setItem('fe_popup_ad_seen', 'true');
          } else if (freq === 'once_per_day') {
            localStorage.setItem('fe_popup_ad_last_seen', String(Date.now()));
          } else if (freq === 'once') {
            localStorage.setItem('fe_popup_ad_seen_once', 'true');
          }
        }, delayMs);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Error loading frontend popup ad:', err);
      }
    };

    checkAndFetchAd();
  }, [location.pathname]);

  // Handle auto-close timer
  useEffect(() => {
    if (isVisible && adConfig && Number(adConfig.autoCloseSeconds) > 0) {
      const closeTimer = setTimeout(() => {
        setIsVisible(false);
      }, Number(adConfig.autoCloseSeconds) * 1000);

      return () => clearTimeout(closeTimer);
    }
  }, [isVisible, adConfig]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleBannerClick = () => {
    if (adConfig?.targetUrl) {
      if (adConfig.openInNewTab) {
        window.open(adConfig.targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = adConfig.targetUrl;
      }
    }
  };

  if (!isVisible || !adConfig) {
    return null;
  }

  return (
    <div className="fe-popup-ad-overlay" onClick={handleClose}>
      <div 
        className="fe-popup-ad-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        {adConfig.showCloseButton !== false && (
          <button 
            type="button" 
            className="fe-popup-ad-close" 
            onClick={handleClose}
            aria-label="Close Advertisement"
          >
            <X size={20} />
          </button>
        )}

        {/* Optional Title Header */}
        {adConfig.title && (
          <div className="fe-popup-ad-header">
            <h3>{adConfig.title}</h3>
          </div>
        )}

        {/* Ad Body */}
        {adConfig.displayType === 'image' ? (
          <div className="fe-popup-ad-body">
            {adConfig.imageUrl && (
              <div 
                className={`fe-popup-ad-image-box ${adConfig.targetUrl ? 'clickable' : ''}`}
                onClick={adConfig.targetUrl ? handleBannerClick : undefined}
              >
                <img 
                  src={adConfig.imageUrl} 
                  alt={adConfig.title || 'Special Promotion'} 
                  className="fe-popup-ad-img"
                  loading="eager"
                />
              </div>
            )}

            {adConfig.buttonText && adConfig.targetUrl && (
              <div className="fe-popup-ad-footer">
                <button 
                  type="button"
                  className="fe-popup-ad-cta-btn"
                  onClick={handleBannerClick}
                >
                  <span>{adConfig.buttonText}</span>
                  <ExternalLink size={15} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="fe-popup-ad-custom-code"
            dangerouslySetInnerHTML={{ __html: adConfig.customCode || '' }}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .fe-popup-ad-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 20px;
          box-sizing: border-box;
          animation: feFadeIn 0.3s ease-out;
        }

        .fe-popup-ad-card {
          position: relative;
          background: #11141b;
          border: 1px solid rgba(179, 211, 50, 0.28);
          border-radius: 16px;
          max-width: 540px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(179, 211, 50, 0.12);
          animation: feScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          color: #fff;
        }

        .fe-popup-ad-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 20;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }
        .fe-popup-ad-close:hover {
          background: #ff4d4d;
          border-color: #ff4d4d;
          transform: rotate(90deg) scale(1.08);
        }

        .fe-popup-ad-header {
          padding: 16px 20px;
          background: #151922;
          border-bottom: 1px solid #202633;
          padding-right: 50px;
        }
        .fe-popup-ad-header h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.2px;
        }

        .fe-popup-ad-body {
          display: flex;
          flex-direction: column;
        }

        .fe-popup-ad-image-box {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #090a0d;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fe-popup-ad-image-box.clickable {
          cursor: pointer;
        }
        .fe-popup-ad-img {
          width: 100%;
          max-height: 400px;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        .fe-popup-ad-image-box.clickable:hover .fe-popup-ad-img {
          transform: scale(1.02);
        }

        .fe-popup-ad-footer {
          padding: 14px 20px;
          background: #141720;
          border-top: 1px solid #202633;
          display: flex;
          justify-content: flex-end;
        }

        .fe-popup-ad-cta-btn {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(179, 211, 50, 0.3);
        }
        .fe-popup-ad-cta-btn:hover {
          background: #c7eb38;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(179, 211, 50, 0.45);
        }

        .fe-popup-ad-custom-code {
          padding: 20px;
          color: #fff;
          overflow: auto;
          max-height: 80vh;
        }

        @keyframes feFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes feScaleUp {
          from { transform: scale(0.9) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        @media (max-width: 600px) {
          .fe-popup-ad-card {
            border-radius: 12px;
            max-width: 95vw;
          }
          .fe-popup-ad-img {
            max-height: 280px;
          }
          .fe-popup-ad-cta-btn {
            width: 100%;
            justify-content: center;
            padding: 12px;
          }
        }
      ` }} />
    </div>
  );
};

export default FrontendPopupAd;
