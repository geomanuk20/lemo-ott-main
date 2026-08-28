import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = '/api/popup-ads';

const FrontendPopupAd = () => {
  const location = useLocation();
  const [settings, setSettings] = useState(null);
  const [adsList, setAdsList] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    // Never show on admin or mobile-auth redirection routes
    if (location.pathname.startsWith('/admin') || location.pathname === '/mobile-auth') {
      return;
    }

    const checkAndFetchAds = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) return;

        const data = await response.json();
        if (!data) return;

        const config = data.settings || data;
        if (config.status !== 'ON') return;

        // Target page check
        if (config.targetPages === 'home_only' && location.pathname !== '/') {
          return;
        }

        // Frequency evaluations
        const freq = config.frequency || 'every_session';
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

        // Get active ads
        let validAds = [];
        if (Array.isArray(data.ads) && data.ads.length > 0) {
          validAds = data.ads.filter(a => a.status === 'ON' && ((a.displayType === 'image' && a.imageUrl) || (a.displayType === 'custom_code' && a.customCode)));
        } else if (data.imageUrl || data.customCode) {
          // Fallback legacy single ad
          validAds = [{
            title: data.title || '',
            imageUrl: data.imageUrl || '',
            targetUrl: data.targetUrl || '',
            buttonText: data.buttonText || '',
            openInNewTab: data.openInNewTab !== undefined ? data.openInNewTab : true,
            displayType: data.displayType || 'image',
            customCode: data.customCode || ''
          }];
        }

        if (validAds.length === 0) return;

        // Handle display modes
        const mode = config.displayMode || 'carousel';
        let chosenAds = validAds;

        if (mode === 'random') {
          const randomIndex = Math.floor(Math.random() * validAds.length);
          chosenAds = [validAds[randomIndex]];
        } else if (mode === 'rotation') {
          // Rotate based on local visit count
          const visitCount = parseInt(localStorage.getItem('fe_popup_rot_idx') || '0', 10);
          const pickIndex = visitCount % validAds.length;
          chosenAds = [validAds[pickIndex]];
          localStorage.setItem('fe_popup_rot_idx', String(visitCount + 1));
        }

        setSettings(config);
        setAdsList(chosenAds);
        setActiveSlideIndex(0);

        // Calculate delay
        const delayMs = Math.max(0, (Number(config.delaySeconds) || 0) * 1000);
        const timer = setTimeout(() => {
          setIsVisible(true);

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
        console.error('Error loading frontend popup ads:', err);
      }
    };

    checkAndFetchAds();
  }, [location.pathname]);

  // Handle auto-slide carousel in carousel mode
  useEffect(() => {
    if (!isVisible || adsList.length <= 1 || isPaused) return;

    const autoplay = settings?.carouselAutoplay !== false;
    if (!autoplay) return;

    const intervalSeconds = Number(settings?.carouselInterval) || 4;
    const slideTimer = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % adsList.length);
    }, Math.max(2, intervalSeconds) * 1000);

    return () => clearInterval(slideTimer);
  }, [isVisible, adsList.length, isPaused, settings?.carouselAutoplay, settings?.carouselInterval]);

  // Handle auto-close timer
  useEffect(() => {
    if (isVisible && settings && Number(settings.autoCloseSeconds) > 0) {
      const closeTimer = setTimeout(() => {
        setIsVisible(false);
      }, Number(settings.autoCloseSeconds) * 1000);

      return () => clearTimeout(closeTimer);
    }
  }, [isVisible, settings]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handlePrevSlide = (e) => {
    e?.stopPropagation();
    setActiveSlideIndex(prev => (prev - 1 + adsList.length) % adsList.length);
  };

  const handleNextSlide = (e) => {
    e?.stopPropagation();
    setActiveSlideIndex(prev => (prev + 1) % adsList.length);
  };

  const handleAdClick = (ad) => {
    if (ad?.targetUrl) {
      if (ad.openInNewTab !== false) {
        window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = ad.targetUrl;
      }
    }
  };

  // Touch swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40 && adsList.length > 1) {
      if (diff > 0) {
        handleNextSlide();
      } else {
        handlePrevSlide();
      }
    }
    touchStartX.current = null;
  };

  if (!isVisible || !settings || adsList.length === 0) {
    return null;
  }

  const currentAd = adsList[activeSlideIndex] || adsList[0];
  const hasMultiple = adsList.length > 1;
  const showFooter = hasMultiple || (currentAd.buttonText && currentAd.targetUrl);

  return (
    <div className="fe-popup-ad-overlay" onClick={handleClose}>
      <div 
        className="fe-popup-ad-card" 
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        {settings.showCloseButton !== false && (
          <button 
            type="button" 
            className="fe-popup-ad-close" 
            onClick={handleClose}
            aria-label="Close Advertisement"
          >
            <X size={18} />
          </button>
        )}

        {/* Optional Title Header */}
        {currentAd?.title && (
          <div className="fe-popup-ad-header">
            <h3>{currentAd.title}</h3>
            {hasMultiple && (
              <span className="fe-slide-counter">
                {activeSlideIndex + 1}/{adsList.length}
              </span>
            )}
          </div>
        )}

        {/* Ad Body */}
        {currentAd?.displayType === 'image' ? (
          <div className="fe-popup-ad-body">
            {currentAd.imageUrl && (
              <div 
                className={`fe-popup-ad-image-box ${currentAd.targetUrl ? 'clickable' : ''}`}
                onClick={currentAd.targetUrl ? () => handleAdClick(currentAd) : undefined}
              >
                <img 
                  src={currentAd.imageUrl} 
                  alt={currentAd.title || 'Special Promotion'} 
                  className="fe-popup-ad-img"
                  loading="eager"
                />

                {/* Left / Right Carousel Navigation */}
                {hasMultiple && (
                  <>
                    <button 
                      type="button" 
                      className="fe-carousel-arrow arrow-left" 
                      onClick={handlePrevSlide}
                      aria-label="Previous Ad"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      type="button" 
                      className="fe-carousel-arrow arrow-right" 
                      onClick={handleNextSlide}
                      aria-label="Next Ad"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Footer with CTA and Pagination Dots */}
            {showFooter && (
              <div className="fe-popup-ad-footer">
                {hasMultiple ? (
                  <div className="fe-carousel-dots">
                    {adsList.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`fe-dot ${i === activeSlideIndex ? 'active' : ''}`}
                        onClick={() => setActiveSlideIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                ) : <div />}

                {currentAd.buttonText && currentAd.targetUrl && (
                  <button 
                    type="button"
                    className="fe-popup-ad-cta-btn"
                    onClick={() => handleAdClick(currentAd)}
                  >
                    <span>{currentAd.buttonText}</span>
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="fe-popup-ad-custom-body">
            <div 
              className="fe-popup-ad-custom-code"
              dangerouslySetInnerHTML={{ __html: currentAd.customCode || '' }}
            />
            {hasMultiple && (
              <div className="fe-custom-nav-bar">
                <button type="button" className="fe-custom-arrow" onClick={handlePrevSlide}>
                  <ChevronLeft size={15} /> Prev
                </button>
                <div className="fe-carousel-dots">
                  {adsList.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`fe-dot ${i === activeSlideIndex ? 'active' : ''}`}
                      onClick={() => setActiveSlideIndex(i)}
                    />
                  ))}
                </div>
                <button type="button" className="fe-custom-arrow" onClick={handleNextSlide}>
                  Next <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .fe-popup-ad-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.72);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 14px;
          box-sizing: border-box;
          animation: feFadeIn 0.25s ease-out;
        }

        .fe-popup-ad-card {
          position: relative;
          background: #0d0f14;
          border: 1px solid rgba(179, 211, 50, 0.35);
          border-radius: 14px;
          max-width: 540px;
          max-height: 90vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(179, 211, 50, 0.12);
          animation: feScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          color: #fff;
          box-sizing: border-box;
        }

        .fe-popup-ad-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 60;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        }
        .fe-popup-ad-close:hover {
          background: #ff4d4d;
          border-color: #ff4d4d;
          transform: rotate(90deg) scale(1.06);
        }

        .fe-popup-ad-header {
          padding: 12px 16px;
          background: #141720;
          border-bottom: 1px solid #1f2533;
          padding-right: 50px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .fe-popup-ad-header h3 {
          margin: 0;
          font-size: 0.96rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fe-slide-counter {
          font-size: 0.72rem;
          color: #b3d332;
          font-weight: 700;
          background: rgba(179, 211, 50, 0.12);
          padding: 2px 7px;
          border-radius: 8px;
          border: 1px solid rgba(179, 211, 50, 0.25);
          flex-shrink: 0;
          margin-left: 8px;
        }

        .fe-popup-ad-body {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .fe-popup-ad-image-box {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fe-popup-ad-image-box.clickable {
          cursor: pointer;
        }
        .fe-popup-ad-img {
          width: 100%;
          height: auto;
          max-height: 70vh;
          object-fit: contain;
          display: block;
          transition: transform 0.3s ease;
          animation: slideFadeIn 0.25s ease;
        }
        .fe-popup-ad-image-box.clickable:hover .fe-popup-ad-img {
          transform: scale(1.015);
        }

        .fe-carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(10, 12, 16, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 40;
          transition: all 0.2s ease;
        }
        .fe-carousel-arrow.arrow-left { left: 10px; }
        .fe-carousel-arrow.arrow-right { right: 10px; }
        .fe-carousel-arrow:hover {
          background: #b3d332;
          color: #000;
          border-color: #b3d332;
          transform: translateY(-50%) scale(1.08);
        }

        .fe-popup-ad-footer {
          padding: 10px 16px;
          background: #12151d;
          border-top: 1px solid #1e2430;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .fe-carousel-dots {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .fe-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2b3342;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.2s ease;
        }
        .fe-dot.active {
          background: #b3d332;
          width: 20px;
          border-radius: 10px;
        }

        .fe-popup-ad-cta-btn {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.84rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(179, 211, 50, 0.25);
          margin-left: auto;
        }
        .fe-popup-ad-cta-btn:hover {
          background: #c7eb38;
          transform: translateY(-1px);
        }

        .fe-popup-ad-custom-body {
          display: flex;
          flex-direction: column;
        }
        .fe-popup-ad-custom-code {
          padding: 16px;
          color: #fff;
          overflow: auto;
          max-height: 70vh;
        }
        .fe-custom-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: #10131a;
          border-top: 1px solid #1a202c;
        }
        .fe-custom-arrow {
          background: #181c26;
          border: 1px solid #282f3d;
          color: #fff;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }
        .fe-custom-arrow:hover {
          background: #b3d332;
          color: #000;
        }

        @keyframes feFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes feScaleUp {
          from { transform: scale(0.92) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        @keyframes slideFadeIn {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }

        @media (max-width: 480px) {
          .fe-popup-ad-overlay {
            padding: 8px;
          }
          .fe-popup-ad-card {
            border-radius: 12px;
            max-width: 98vw;
            max-height: 94vh;
          }
          .fe-popup-ad-img {
            max-height: 55vh;
          }
          .fe-popup-ad-footer {
            padding: 8px 12px;
          }
          .fe-popup-ad-cta-btn {
            padding: 8px 14px;
            font-size: 0.8rem;
          }
          .fe-carousel-arrow {
            width: 30px;
            height: 30px;
          }
        }
      ` }} />
    </div>
  );
};

export default FrontendPopupAd;
