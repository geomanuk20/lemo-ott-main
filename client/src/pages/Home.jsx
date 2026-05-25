import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Plus, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Clock, 
  Calendar, 
  ChevronDown, 
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Menu,
  X,
  AlertCircle,
  Check,
  Loader2,
  Globe,
  MonitorPlay,
  Shield,
  Crown
} from 'lucide-react';
import Loader from '../components/Loader';
import { Link, useNavigate } from 'react-router-dom';
import FrontendLayout from '../components/FrontendLayout';
import FrontendFooter from '../components/FrontendFooter';
import { formatImageUrl } from '../utils/image';

const isItemActive = (item, type, menuSettings) => {
  if (!menuSettings || !item) return true;

  // New Releases have their own section and are never hidden by menu settings
  const normType = type ? type.toLowerCase().trim() : '';
  if (normType === 'new-release' || normType === 'new-releases') return true;

  let contentType = item.contentType;
  if (!contentType) {
    if (normType === 'movie' || normType === 'movies') {
      contentType = 'Movie';
    } else if (normType === 'short-film') {
      contentType = 'Short Film';
    } else if (normType === 'show' || normType === 'shows' || normType === 'series') {
      contentType = 'TV Show';
    } else if (normType === 'short-web-series') {
      contentType = 'Short Web Series';
    } else if (normType === 'sports' || normType === 'sport') {
      contentType = 'Sports';
    } else if (normType === 'live' || normType === 'channel' || normType === 'channels' || normType === 'tv-channel' || normType === 'tv-channels') {
      contentType = 'Live TV';
    } else if (normType === 'episode' || normType === 'episodes' || normType === 'season' || normType === 'seasons') {
      if (item.showId && typeof item.showId === 'object') {
        contentType = item.showId.contentType || 'TV Show';
      } else {
        contentType = 'TV Show';
      }
    }
  }

  // Fallback check if contentType is still undefined
  if (!contentType) {
    if (item.logo || item.channelName || item.name) {
      contentType = 'Live TV';
    } else if (item.sportsCategory) {
      contentType = 'Sports';
    } else {
      contentType = 'Movie';
    }
  }

  if (contentType === 'Movie' && menuSettings.movies?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Short Film' && menuSettings.shortFilms?.toUpperCase() === 'OFF') return false;
  if (contentType === 'TV Show' && menuSettings.shows?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Short Web Series' && menuSettings.webSeries?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Sports' && menuSettings.sports?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Live TV' && menuSettings.liveTv?.toUpperCase() === 'OFF') return false;

  return true;
};

const isSliderActive = (slide, menuSettings) => {
  if (!menuSettings || !slide) return true;
  const postType = slide.postType;
  if (postType === 'Movies' && menuSettings.movies?.toUpperCase() === 'OFF') return false;
  if (postType === 'TV Shows' && menuSettings.shows?.toUpperCase() === 'OFF') return false;
  if (postType === 'Sports' && menuSettings.sports?.toUpperCase() === 'OFF') return false;
  if (postType === 'Live TV' && menuSettings.liveTv?.toUpperCase() === 'OFF') return false;
  
  const contentType = slide.contentType;
  if (contentType === 'Movie' && menuSettings.movies?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Short Film' && menuSettings.shortFilms?.toUpperCase() === 'OFF') return false;
  if (contentType === 'TV Show' && menuSettings.shows?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Short Web Series' && menuSettings.webSeries?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Sports' && menuSettings.sports?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Live TV' && menuSettings.liveTv?.toUpperCase() === 'OFF') return false;

  return true;
};

const Home = () => {
  const navigate = useNavigate();
  const [sliders, setSliders] = useState([]);
  const [movies, setMovies] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [shows, setShows] = useState([]);
  const [sports, setSports] = useState([]);
  const [channels, setChannels] = useState([]);
  const [sportsChannels, setSportsChannels] = useState([]);
  const [assets, setAssets] = useState([]);
  const [homeSections, setHomeSections] = useState([]);
  const sportsRef = useRef(null);
  const channelsRef = useRef(null);
  const [sportsScroll, setSportsScroll] = useState({ canLeft: false, canRight: false });
  const [channelsScroll, setChannelsScroll] = useState({ canLeft: false, canRight: false });
  const [experiences, setExperiences] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subMessage, setSubMessage] = useState({ text: '', type: '' });
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Movies');
  const [settings, setSettings] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sportsCategories, setSportsCategories] = useState([]);

  useEffect(() => {
    if (subMessage.text) {
      const timer = setTimeout(() => {
        setSubMessage({ text: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [subMessage]);

  useEffect(() => {
    // Read current menu settings for filtering
    let mSettings = null;
    try {
      const cachedMenu = localStorage.getItem('fe_menu_settings');
      if (cachedMenu) mSettings = JSON.parse(cachedMenu);
    } catch (e) {}

    // Load from cache first for instant rendering
    const cachedData = localStorage.getItem('home_data_cache');
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        setSettings(data.settings);

        const filteredSliders = (data.sliders || []).filter(s => isSliderActive(s, mSettings));
        const filteredMovies = (data.movies || []).filter(m => isItemActive(m, 'movie', mSettings));
        const filteredNewReleases = (data.newReleases || []).filter(nr => isItemActive(nr, 'new-release', mSettings));
        const filteredShows = (data.shows || []).filter(s => isItemActive(s, 'show', mSettings));
        const filteredSports = (data.sports || []).filter(sp => isItemActive(sp, 'sports', mSettings));
        const filteredChannels = (data.channels || []).filter(c => isItemActive(c, 'live', mSettings));

        const filteredHomeSections = (data.homeSections || []).filter(sec => {
          const type = sec.sectionType;
          if (type === 'Movie' && mSettings?.movies?.toUpperCase() === 'OFF') return false;
          if (type === 'Shows' && mSettings?.shows?.toUpperCase() === 'OFF') return false;
          if (type === 'Sports' && mSettings?.sports?.toUpperCase() === 'OFF') return false;
          if (type === 'Live TV' && mSettings?.liveTv?.toUpperCase() === 'OFF') return false;
          if (type === 'Short Film' && mSettings?.shortFilms?.toUpperCase() === 'OFF') return false;
          if (type === 'Short Web Series' && mSettings?.webSeries?.toUpperCase() === 'OFF') return false;
          // 'New Release', 'Language', 'Genre' sections always show
          return true;
        });

        setSliders(filteredSliders);
        setMovies(filteredMovies);
        setNewReleases(filteredNewReleases);
        setShows(filteredShows);
        setSports(filteredSports);
        setChannels(filteredChannels);
        setAssets(data.assets || []);
        setExperiences(data.experiences || []);
        setSportsCategories(data.sportsCategories || []);
        setHomeSections(filteredHomeSections);
        
        setSportsChannels(filteredChannels.filter(c => {
          const isSport = c.category?.name?.toLowerCase().includes('sports') || c.channelCategory?.toLowerCase().includes('sports');
          return isSport;
        }));
        
        setLoading(false); // Can stop loading if we have cached data
      } catch (e) {
        console.warn('Failed to parse home cache');
      }
    }

    const fetchData = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        // Fetch menu settings first to keep them perfectly in sync
        let freshMenuSettings = null;
        try {
          const menuRes = await fetch('http://localhost:5001/api/menu-settings');
          if (menuRes.ok) {
            freshMenuSettings = await menuRes.json();
            localStorage.setItem('fe_menu_settings', JSON.stringify(freshMenuSettings));
          }
        } catch (err) {
          console.error('Error fetching menu settings in home:', err);
        }

        const currentMenuSettings = freshMenuSettings || mSettings;

        const response = await fetch('http://localhost:5001/api/home-aggregated', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Aggregated fetch failed');
        
        const data = await response.json();
        
        const filteredSliders = (data.sliders || []).filter(s => isSliderActive(s, currentMenuSettings));
        const filteredMovies = (data.movies || []).filter(m => isItemActive(m, 'movie', currentMenuSettings));
        const filteredNewReleases = (data.newReleases || []).filter(nr => isItemActive(nr, 'new-release', currentMenuSettings));
        const filteredShows = (data.shows || []).filter(s => isItemActive(s, 'show', currentMenuSettings));
        const filteredSports = (data.sports || []).filter(sp => isItemActive(sp, 'sports', currentMenuSettings));
        const filteredChannels = (data.channels || []).filter(c => isItemActive(c, 'live', currentMenuSettings));

        const filteredHomeSections = (data.homeSections || []).filter(sec => {
          const type = sec.sectionType;
          if (type === 'Movie' && currentMenuSettings?.movies?.toUpperCase() === 'OFF') return false;
          if (type === 'Shows' && currentMenuSettings?.shows?.toUpperCase() === 'OFF') return false;
          if (type === 'Sports' && currentMenuSettings?.sports?.toUpperCase() === 'OFF') return false;
          if (type === 'Live TV' && currentMenuSettings?.liveTv?.toUpperCase() === 'OFF') return false;
          if (type === 'Short Film' && currentMenuSettings?.shortFilms?.toUpperCase() === 'OFF') return false;
          if (type === 'Short Web Series' && currentMenuSettings?.webSeries?.toUpperCase() === 'OFF') return false;
          return true;
        });

        // Update state with fresh data
        setSettings(data.settings);
        setSliders(filteredSliders);
        setMovies(filteredMovies);
        setNewReleases(filteredNewReleases);
        setShows(filteredShows);
        setSports(filteredSports);
        setChannels(filteredChannels);
        setHomeSections(filteredHomeSections);
        
        setSportsChannels(filteredChannels.filter(c => {
          const isSport = c.category?.name?.toLowerCase().includes('sports') || c.channelCategory?.toLowerCase().includes('sports');
          return isSport;
        }));
        
        setAssets(data.assets || []);
        setExperiences(data.experiences || []);
        setSportsCategories(data.sportsCategories || []);
        
        // Cache for next time
        localStorage.setItem('home_data_cache', JSON.stringify(data));
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Error fetching aggregated home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 80) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const checkScroll = (ref, setter) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setter({
        canLeft: scrollLeft > 5,
        canRight: scrollLeft + clientWidth < scrollWidth - 5
      });
    }
  };

  // Auto-slide effect
  useEffect(() => {
    if (sliders.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliders]);

  useEffect(() => {
    checkScroll(sportsRef, setSportsScroll);
    checkScroll(channelsRef, setChannelsScroll);
  }, [sports, channels]);


 

  if (loading) {
    return (
      <FrontendLayout isTransparent={true} showFooter={true}>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader />
        </div>
      </FrontendLayout>
    );
  }

  // formatImageUrl is now imported from utils/image

 const nextSlide = () => {
  setCurrentSlide(prev => (prev + 1) % (sliders.length || 1));
 };

 const prevSlide = () => {
  setCurrentSlide(prev => (prev - 1 + (sliders.length || 1)) % (sliders.length || 1));
 };

 const handleMouseDown = (e) => setDragStart(e.clientX);
 const handleMouseUp = (e) => {
  if (dragStart === null) return;
  const diff = dragStart - e.clientX;
  if (diff > 100) nextSlide();
  if (diff < -100) prevSlide();
  setDragStart(null);
 };


 const handleOpenModal = (content, type) => {
  setSelectedContent({ ...content, type });
  setShowModal(true);
 };

  const categories = [
   { title: "NEW RELEASES", type: "new-releases", movies: newReleases.length > 0 ? newReleases.slice(0, 15) : movies.slice(6, 20) },
   { title: "POPULAR MOVIES", type: "movies", movies: movies.slice(0, 15) },
   { title: "BEST IN SPORTS", type: "sports", movies: sports }
  ];

 return (
  <FrontendLayout isTransparent={true} showFooter={false}>
   {/* Hero Section */}
   <section className="fe-hero-v">
    {Array.isArray(sliders) && sliders.length > 0 ? (
     sliders.map((slide, i) => (
      <div key={slide._id} className={`fe-hero-slide-v ${i === currentSlide ? 'active' : ''}`}>
       <div className="fe-hero-bg-v">
        {slide.videoUrl ? (
         <video
          src={slide.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="fe-hero-video-v"
         />
        ) : (
         formatImageUrl(slide, 'slider') ? (
          <img src={formatImageUrl(slide, 'slider')} alt={slide.title} />
         ) : (
          <div className="fe-hero-placeholder-v" style={{ background: '#111', width: '100%', height: '100%' }}></div>
         )
        )}
        <div className="fe-hero-overlay-v"></div>
       </div>

       <div className="fe-hero-content-v">
        <div className="fe-hero-tag-v">
         <div className="tag-line-v"></div>
         <span>FEATURED CONTENT</span>
        </div>
        <h1 className="fe-hero-title-v">{slide.title}</h1>
        <div className="fe-hero-meta-v">
         {(() => {
          const ratingVal = parseFloat(slide.imdbRating || '4.8');
          const percentage = (ratingVal / 10) * 100;
          return (
           <div 
            className="fe-hero-rating-circle-v" 
            style={{ background: `conic-gradient(#b3d332 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)` }}
           >
            <div className="rating-inner-v">{ratingVal.toFixed(1)}</div>
           </div>
          );
         })()}
         <div className="meta-imdb-box-v">
          <div className="imdb-label-v">IMDb</div>
          <div className="imdb-score-text-v">{slide.imdbRating || '4.8'}</div>
         </div>
         <div className="meta-item-v">{slide.year || '2024'}</div>
         <div className="meta-cc-v">CC</div>
         <div className="meta-item-v">{slide.duration || '2h 15m'}</div>
        </div>
        <div className="fe-hero-desc-v" dangerouslySetInnerHTML={{ __html: slide.description || "Dive into a world of cinematic excellence. Experience the best in storytelling with our featured selection of the month." }} />
        <div className="fe-hero-actions-v">
         <button 
          className="fe-btn-primary-v" 
          onClick={(e) => {
           e.stopPropagation();
           let targetLink = slide.link;
           
           // Auto-construct link if manual link is missing
           if (!targetLink && slide.contentId && slide.postType) {
            const typeMap = {
             'Movies': 'movie',
             'TV Shows': 'show',
             'Sports': 'sports',
             'Live TV': 'live'
            };
            const type = typeMap[slide.postType] || 'movie';
            targetLink = `/details/${type}/${slide.contentId}`;
           }

           if (targetLink) {
            if (targetLink.startsWith('http')) {
             window.location.href = targetLink;
            } else {
             navigate(targetLink);
            }
           }
          }}
         >
          WATCH NOW
         </button>
        </div>
       </div>
      </div>
     ))
    ) : (
     <div className="fe-hero-slide-v active">
      <div className="fe-hero-bg-v">
       <div className="fe-hero-placeholder-v" style={{ background: '#111', width: '100%', height: '100%' }}></div>
       <div className="fe-hero-overlay-v"></div>
      </div>
      <div className="fe-hero-content-v">
       <div className="fe-hero-actions-v"><button className="fe-btn-primary-v">WATCH NOW</button></div>
      </div>
     </div>
    )}
    <div className="fe-hero-slider-dots-v">
     {sliders.map((_, i) => (
      <div
       key={i}
       className={`dot-v ${i === currentSlide ? 'active' : ''}`}
       onClick={() => setCurrentSlide(i)}
      >
       {i === currentSlide && <div className="dot-progress-v"></div>}
      </div>
     ))}
    </div>
   </section>

   {/* Main Content Area */}
   <div className="fe-content-v">
    <>


      {/* Dynamic Homepage Sections */}
      {homeSections.map((section, idx) => {
        let contentEl = null;

        if (section.sectionType === 'Movie') {
          const sectionMovies = movies.slice(0, section.limit || 15);
          if (sectionMovies.length > 0) {
            contentEl = (
              <div key={section._id} className="fe-row-v fe-featured-row-v">
                <div className="row-header-v">
                  <h2 className="row-title-v">{section.title}</h2>
                  <Link to="/view-all/movies/Movies" className="row-more-v">
                    VIEW ALL <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="fe-movie-list-v">
                  {sectionMovies.map((m) => (
                    <div 
                      key={m._id} 
                      className="fe-movie-card-v"
                      onClick={() => handleOpenModal(m, 'movie')}
                    >
                      {formatImageUrl(m, 'poster') && (
                        <img src={formatImageUrl(m, 'poster')} alt={m.title} />
                      )}
                      {m.access === 'Paid' && (
                        <div className="fe-premium-indicator-v">
                          <Crown size={12} fill="currentColor" />
                        </div>
                      )}
                      <div className="fe-card-hover-v">
                        <div className="fe-hover-content-v">
                          <div className="fe-play-btn-v"><Play size={20} fill="white" /></div>
                          <div className="fe-card-badges-v">
                            {(() => {
                              const quality = m.videoQuality || '4K Ultra HD';
                              const parts = quality.split(' ');
                              const prefix = parts[0] || '4K';
                              const suffix = parts.slice(1).join(' ') || 'Ultra HD';
                              return (
                                <div className="fe-premium-badge-v">
                                  <span className="badge-prefix-v">{prefix}</span>
                                  <span className="badge-suffix-v">{suffix}</span>
                                </div>
                              );
                            })()}
                            {(() => {
                              const ratingVal = parseFloat(m.imdbRating || '4.8');
                              const percentage = (ratingVal / 10) * 100;
                              return (
                                <div 
                                  className="fe-badge-rating-v" 
                                  style={{ background: `conic-gradient(#b3d332 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)` }}
                                >
                                  <div className="rating-inner-v">{m.imdbRating || '4.8'}</div>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="fe-card-info-meta-v">{m.genres?.[0] || m.genre?.[0] || 'Thriller'}</div>
                          <h3 className="fe-card-info-title-v">{m.title}</h3>
                          <div className="fe-card-meta-v">
                            <span>{m.language || 'Malayalam'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        } else if (section.sectionType === 'Shows') {
          const sectionShows = shows.slice(0, section.limit || 6);
          if (sectionShows.length > 0) {
            contentEl = (
              <section key={section._id} className="fe-watch-online-v" style={{ padding: '0 5%', margin: '40px 0' }}>
                <div className="watch-online-header-v">
                  <div style={{ textAlign: 'left' }}>
                    <span className="watch-online-tag-v">ONLINE STREAMING</span>
                    <h2 className="watch-online-title-v">{section.title}</h2>
                  </div>
                  <Link to="/shows" className="row-more-v" style={{ marginBottom: '10px' }}>
                    VIEW ALL <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="watch-online-grid-v">
                  {sectionShows.map((show) => (
                    <div 
                      key={show._id} 
                      className="online-movie-card-v"
                      onClick={() => handleOpenModal(show, 'shows')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="online-movie-poster-v">
                        {formatImageUrl(show, 'poster') && (
                          <img src={formatImageUrl(show, 'poster')} alt={show.title} />
                        )}
                        {show.seriesAccess === 'Paid' && (
                          <div className="fe-premium-indicator-v">
                            <Crown size={12} fill="currentColor" />
                          </div>
                        )}
                        <div className="online-card-overlay-v">
                          {(() => {
                            const quality = show.videoQuality || '4K Ultra HD';
                            const parts = quality.split(' ');
                            const prefix = parts[0] || '4K';
                            const suffix = parts.slice(1).join(' ') || 'Ultra HD';
                            return (
                              <div className="fe-premium-badge-v">
                                <span className="badge-prefix-v">{prefix}</span>
                                <span className="badge-suffix-v">{suffix}</span>
                              </div>
                            );
                          })()}
                          {(() => {
                            const ratingVal = parseFloat(show.imdbRating || show.rating || '4.8');
                            const percentage = (ratingVal / 10) * 100;
                            return (
                              <div 
                                className="online-rating-v" 
                                style={{ background: `conic-gradient(#b3d332 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)` }}
                              >
                                <div className="rating-inner-v">{show.imdbRating || show.rating || '4.8'}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="online-movie-meta-v">
                        <div className="meta-top-v">
                          <span className="meta-type-v">{show.contentRating || 'TV-G'}</span>
                          <span className="meta-year-v">{show.releaseYear || 2024}</span>
                        </div>
                        <div className="meta-genre-v">{Array.isArray(show.genres) ? show.genres[0] : (show.genre || 'Action')}</div>
                        <h3 className="meta-title-v">{show.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }
        } else if (section.sectionType === 'Sports') {
          const sectionSports = sports.slice(0, section.limit || 15);
          if (sectionSports.length > 0) {
            contentEl = (
              <div key={section._id} className="fe-row-v fe-landscape-row-v">
                <div className="row-header-v">
                  <h2 className="row-title-v">{section.title}</h2>
                  <Link to="/view-all/sports/Sports" className="row-more-v">
                    VIEW ALL <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="fe-landscape-list-container-v">
                  <div className="fe-landscape-list-v">
                    {sectionSports.map((item) => (
                      <div key={item._id} className="fe-landscape-card-v outside-content-v" onClick={() => handleOpenModal(item, 'sports')}>
                        <div className="fe-landscape-img-wrapper-v">
                          <img src={formatImageUrl(item, 'landscape')} alt={item.title} />
                          {item.access === 'Paid' && (
                            <div className="fe-premium-indicator-v">
                              <Crown size={12} fill="currentColor" />
                            </div>
                          )}
                          {item.videoQuality && (
                            <div className="fe-quality-badge-v">
                              {(() => {
                                const q = item.videoQuality || 'HD';
                                const qLower = q.toLowerCase();
                                if (qLower.includes('8k')) return '8K';
                                if (qLower.includes('4k')) return '4K';
                                if (qLower.includes('ultra')) return 'ULTRA';
                                if (qLower.includes('full')) return 'FHD';
                                if (qLower.includes('hdr')) return 'HDR';
                                if (qLower.includes('hd')) return 'HD';
                                return q.split(' ')[0].toUpperCase();
                              })()}
                            </div>
                          )}
                        </div>
                        <div className="fe-sports-card-info-under-v">
                          <div className="card-title-under-v">{item.title}</div>
                          {item.category && (
                            <div className="card-cat-under-v">{typeof item.category === 'object' ? item.category.name : 'Sports'}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
        } else if (section.sectionType === 'Live TV') {
          const sectionChannels = channels.slice(0, section.limit || 50);
          if (sectionChannels.length > 0) {
            contentEl = (
              <section key={section._id} className="fe-row-v fe-landscape-row-v">
                <div className="row-header-v">
                  <h2 className="row-title-v">{section.title}</h2>
                  <Link to="/view-all/live/Live TV" className="row-more-v">
                    VIEW ALL <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="fe-landscape-list-container-v">
                  {channelsScroll.canLeft && (
                    <button className="nav-btn-v prev-v" onClick={() => channelsRef.current.scrollBy({left: -600, behavior: 'smooth'})}><ChevronRight size={20} style={{transform: 'rotate(180deg)'}} /></button>
                  )}
                  <div 
                    className="fe-landscape-list-v" 
                    ref={channelsRef}
                    onScroll={() => checkScroll(channelsRef, setChannelsScroll)}
                  >
                    {sectionChannels.map((item) => (
                      <div key={item._id} className="fe-channel-card-v" onClick={() => handleOpenModal(item, 'live')}>
                        <div className="channel-logo-wrapper-v">
                          <img src={formatImageUrl(item, 'poster')} alt={item.name} />
                          {(item.tvAccess === 'Paid' || item.access === 'Paid') && (
                            <div className="fe-premium-indicator-v">
                              <Crown size={12} fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div className="channel-info-under-v">
                          <div className="channel-title-v">{item.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {channelsScroll.canRight && (
                    <button className="nav-btn-v next-v" onClick={() => channelsRef.current.scrollBy({left: 600, behavior: 'smooth'})}><ChevronRight size={20} /></button>
                  )}
                </div>
              </section>
            );
          }
        } else if (section.sectionType === 'New Release') {
          const sectionNewReleases = newReleases.slice(0, section.limit || 15);
          if (sectionNewReleases.length > 0) {
            contentEl = (
              <div key={section._id} className="fe-row-v fe-featured-row-v">
                <div className="row-header-v">
                  <h2 className="row-title-v">{section.title}</h2>
                  <Link to="/view-all/new-releases/New Releases" className="row-more-v">
                    VIEW ALL <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="fe-movie-list-v">
                  {sectionNewReleases.map((m) => (
                    <div 
                      key={m._id} 
                      className="fe-movie-card-v"
                      onClick={() => handleOpenModal(m, 'new-releases')}
                    >
                      {formatImageUrl(m, 'poster') && (
                        <img src={formatImageUrl(m, 'poster')} alt={m.title} />
                      )}
                      {m.access === 'Paid' && (
                        <div className="fe-premium-indicator-v">
                          <Crown size={12} fill="currentColor" />
                        </div>
                      )}
                      <div className="fe-card-hover-v">
                        <div className="fe-hover-content-v">
                          <div className="fe-play-btn-v"><Play size={20} fill="white" /></div>
                          <div className="fe-card-badges-v">
                            {(() => {
                              const quality = m.videoQuality || '4K Ultra HD';
                              const parts = quality.split(' ');
                              const prefix = parts[0] || '4K';
                              const suffix = parts.slice(1).join(' ') || 'Ultra HD';
                              return (
                                <div className="fe-premium-badge-v">
                                  <span className="badge-prefix-v">{prefix}</span>
                                  <span className="badge-suffix-v">{suffix}</span>
                                </div>
                              );
                            })()}
                            {(() => {
                              const ratingVal = parseFloat(m.imdbRating || '4.8');
                              const percentage = (ratingVal / 10) * 100;
                              return (
                                <div 
                                  className="fe-badge-rating-v" 
                                  style={{ background: `conic-gradient(#b3d332 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)` }}
                                >
                                  <div className="rating-inner-v">{m.imdbRating || '4.8'}</div>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="fe-card-info-meta-v">{m.genres?.[0] || m.genre?.[0] || 'New Release'}</div>
                          <h3 className="fe-card-info-title-v">{m.title}</h3>
                          <div className="fe-card-meta-v">
                            <span>{m.language || 'Malayalam'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        } else if (section.sectionType === 'Short Film') {
          const shortFilms = movies.filter(m => m.contentType === 'Short Film').slice(0, section.limit || 15);
          if (shortFilms.length > 0) {
            contentEl = (
              <div key={section._id} className="fe-row-v fe-featured-row-v">
                <div className="row-header-v">
                  <h2 className="row-title-v">{section.title}</h2>
                  <Link to="/view-all/short-film/Short Films" className="row-more-v">
                    VIEW ALL <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="fe-movie-list-v">
                  {shortFilms.map((m) => (
                    <div 
                      key={m._id} 
                      className="fe-movie-card-v"
                      onClick={() => handleOpenModal(m, 'short-film')}
                    >
                      {formatImageUrl(m, 'poster') && (
                        <img src={formatImageUrl(m, 'poster')} alt={m.title} />
                      )}
                      {m.access === 'Paid' && (
                        <div className="fe-premium-indicator-v">
                          <Crown size={12} fill="currentColor" />
                        </div>
                      )}
                      <div className="fe-card-hover-v">
                        <div className="fe-hover-content-v">
                          <div className="fe-play-btn-v"><Play size={20} fill="white" /></div>
                          <div className="fe-card-badges-v">
                            {(() => {
                              const quality = m.videoQuality || '4K Ultra HD';
                              const parts = quality.split(' ');
                              const prefix = parts[0] || '4K';
                              const suffix = parts.slice(1).join(' ') || 'Ultra HD';
                              return (
                                <div className="fe-premium-badge-v">
                                  <span className="badge-prefix-v">{prefix}</span>
                                  <span className="badge-suffix-v">{suffix}</span>
                                </div>
                              );
                            })()}
                            {(() => {
                              const ratingVal = parseFloat(m.imdbRating || '4.8');
                              const percentage = (ratingVal / 10) * 100;
                              return (
                                <div 
                                  className="fe-badge-rating-v" 
                                  style={{ background: `conic-gradient(#b3d332 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)` }}
                                >
                                  <div className="rating-inner-v">{m.imdbRating || '4.8'}</div>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="fe-card-info-meta-v">{m.genres?.[0] || m.genre?.[0] || 'Short Film'}</div>
                          <h3 className="fe-card-info-title-v">{m.title}</h3>
                          <div className="fe-card-meta-v">
                            <span>{m.language || 'Malayalam'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        } else if (section.sectionType === 'Short Web Series') {
          const shortWebSeries = shows.filter(s => s.contentType === 'Short Web Series').slice(0, section.limit || 6);
          if (shortWebSeries.length > 0) {
            contentEl = (
              <section key={section._id} className="fe-watch-online-v" style={{ padding: '0 5%', margin: '40px 0' }}>
                <div className="watch-online-header-v">
                  <div style={{ textAlign: 'left' }}>
                    <span className="watch-online-tag-v">SHORT WEB SERIES</span>
                    <h2 className="watch-online-title-v">{section.title}</h2>
                  </div>
                  <Link to="/web-series" className="row-more-v" style={{ marginBottom: '10px' }}>
                    VIEW ALL <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="watch-online-grid-v">
                  {shortWebSeries.map((show) => (
                    <div 
                      key={show._id} 
                      className="online-movie-card-v"
                      onClick={() => handleOpenModal(show, 'short-web-series')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="online-movie-poster-v">
                        {formatImageUrl(show, 'poster') && (
                          <img src={formatImageUrl(show, 'poster')} alt={show.title} />
                        )}
                        {show.seriesAccess === 'Paid' && (
                          <div className="fe-premium-indicator-v">
                            <Crown size={12} fill="currentColor" />
                          </div>
                        )}
                        <div className="online-card-overlay-v">
                          {(() => {
                            const quality = show.videoQuality || '4K Ultra HD';
                            const parts = quality.split(' ');
                            const prefix = parts[0] || '4K';
                            const suffix = parts.slice(1).join(' ') || 'Ultra HD';
                            return (
                              <div className="fe-premium-badge-v">
                                <span className="badge-prefix-v">{prefix}</span>
                                <span className="badge-suffix-v">{suffix}</span>
                              </div>
                            );
                          })()}
                          {(() => {
                            const ratingVal = parseFloat(show.imdbRating || show.rating || '4.8');
                            const percentage = (ratingVal / 10) * 100;
                            return (
                              <div 
                                className="online-rating-v" 
                                style={{ background: `conic-gradient(#b3d332 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)` }}
                              >
                                <div className="rating-inner-v">{show.imdbRating || show.rating || '4.8'}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="online-movie-meta-v">
                        <div className="meta-top-v">
                          <span className="meta-type-v">{show.contentRating || 'TV-G'}</span>
                          <span className="meta-year-v">{show.releaseYear || 2024}</span>
                        </div>
                        <div className="meta-genre-v">{Array.isArray(show.genres) ? show.genres[0] : (show.genre || 'Web Series')}</div>
                        <h3 className="meta-title-v">{show.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }
        }

        // Render Experience Promos after the 2nd row for pleasant pacing
        if (idx === 1 && assets.length > 0) {
          return (
            <React.Fragment key={section._id || idx}>
              {contentEl}
              <section className="fe-experience-section-v">
                <div className="fe-experience-container-v">
                  <div className="fe-experience-visual-v">
                    <div className="visual-collage-v">
                      {assets[0]?.url && (
                        <img 
                          src={assets[0]?.url} 
                          alt="Experience 1" className="collage-img-1" 
                        />
                      )}
                      {assets[1]?.url && (
                        <img 
                          src={assets[1]?.url} 
                          alt="Experience 2" className="collage-img-2" 
                        />
                      )}
                      {assets[2]?.url && (
                        <img 
                          src={assets[2]?.url} 
                          alt="Experience 3" className="collage-img-3" 
                        />
                      )}
                    </div>
                  </div>
                  <div className="fe-experience-info-v">
                    <h2 className="exp-main-title-v">Best pick for hassle-free <span>streaming</span> experience.</h2>
                    {experiences.length > 0 && experiences.map((exp) => {
                      const IconComponent = {
                        Globe: Globe,
                        MonitorPlay: MonitorPlay,
                        Shield: Shield,
                        Zap: Globe,
                        Film: MonitorPlay,
                        PlayCircle: MonitorPlay
                      }[exp.icon] || Globe;

                      return (
                        <div key={exp._id} className="exp-feature-v">
                          <div className="exp-feature-icon-v"><IconComponent size={32} /></div>
                          <div className="exp-feature-text-v">
                            <h3>{exp.title}</h3>
                            <p>{exp.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </React.Fragment>
          );
        }

        return contentEl;
      })}

      {/* Fallback if homeSections didn't load or is empty, render experience block alone */}
      {homeSections.length < 2 && assets.length > 0 && (
        <section className="fe-experience-section-v">
          <div className="fe-experience-container-v">
            <div className="fe-experience-visual-v">
              <div className="visual-collage-v">
                {assets[0]?.url && (
                  <img 
                    src={assets[0]?.url} 
                    alt="Experience 1" className="collage-img-1" 
                  />
                )}
                {assets[1]?.url && (
                  <img 
                    src={assets[1]?.url} 
                    alt="Experience 2" className="collage-img-2" 
                  />
                )}
                {assets[2]?.url && (
                  <img 
                    src={assets[2]?.url} 
                    alt="Experience 3" className="collage-img-3" 
                  />
                )}
              </div>
            </div>
            <div className="fe-experience-info-v">
              <h2 className="exp-main-title-v">Best pick for hassle-free <span>streaming</span> experience.</h2>
              {experiences.length > 0 && experiences.map((exp) => {
                const IconComponent = {
                  Globe: Globe,
                  MonitorPlay: MonitorPlay,
                  Shield: Shield,
                  Zap: Globe,
                  Film: MonitorPlay,
                  PlayCircle: MonitorPlay
                }[exp.icon] || Globe;

                return (
                  <div key={exp._id} className="exp-feature-v">
                    <div className="exp-feature-icon-v"><IconComponent size={32} /></div>
                    <div className="exp-feature-text-v">
                      <h3>{exp.title}</h3>
                      <p>{exp.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
     </>
     
     {/* Subscription CTA Section */}
     <div className="fe-subscription-cta-v">
      <div className="fe-cta-content-v">
       <h2>Never Miss the Action</h2>
       <p>Subscribe to our premium plan for exclusive live sports, movies, and TV shows.</p>
       <div className="fe-cta-input-group-v">
        <input 
         type="email" 
         placeholder="Enter your email address" 
         className="fe-cta-email-v" 
         value={subEmail}
         onChange={(e) => {
          setSubEmail(e.target.value);
          setSubMessage({ text: '', type: '' }); // clear error on type
         }}
        />
        <button 
         className="fe-cta-btn-v" 
         onClick={() => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!subEmail.trim()) {
           setSubMessage({ text: 'Please enter your email address first.', type: 'error' });
           return;
          }
          if (!emailRegex.test(subEmail)) {
           setSubMessage({ text: 'Please enter a valid email format.', type: 'error' });
           return;
          }
          
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          const token = localStorage.getItem('token');
          if (user && token) {
           navigate('/subscription');
          } else {
           navigate('/login', { state: { email: subEmail } });
          }
         }}
        >
         Subscribe Now
        </button>
       </div>
        {subMessage.text && (
         <div className={`lemo-toast-notification-v ${subMessage.type}`}>
          <div className="lemo-toast-accent-v" />
          <div className="lemo-toast-body-v">
           {subMessage.type === 'error' ? (
            <AlertCircle size={18} className="lemo-toast-icon-v error" />
           ) : (
            <Check size={18} className="lemo-toast-icon-v success" />
           )}
           <span>{subMessage.text}</span>
          </div>
          <button className="lemo-toast-close-v" onClick={() => setSubMessage({ text: '', type: '' })}>
           <X size={14} />
          </button>
         </div>
        )}
      </div>
     </div>

    {/* Quick View Modal */}
    {showModal && selectedContent && (
     <div className="fe-quick-modal-overlay-v" onClick={() => setShowModal(false)}>
      <div className="fe-quick-modal-v" onClick={e => e.stopPropagation()}>
       <button className="close-modal-v" onClick={() => setShowModal(false)}><Loader size="small" inline={true} /></button>
       <div className="modal-banner-v">
        <img src={formatImageUrl(selectedContent, 'slider')} alt="" />
        <div className="banner-overlay-v"></div>
        <div className="banner-content-v">
         <h2 className="modal-title-v">{selectedContent.title || selectedContent.name || selectedContent.channelName}</h2>
         <div className="modal-meta-v">
          {(selectedContent.type === 'movie' || selectedContent.type === 'show') && (
           <span className="rating-v"><Star size={16} fill="#b3d332" color="#b3d332" /> {selectedContent.imdbRating || '8.2'}</span>
          )}
          <span>{selectedContent.year || selectedContent.releaseYear || new Date(selectedContent.createdAt).getFullYear()}</span>
          <span>{selectedContent.type?.toUpperCase()}</span>
          {selectedContent.videoQuality && (
           <div className="fe-quality-badge-v" style={{ position: 'static', display: 'inline-block', margin: '0' }}>
            {(() => {
             const q = selectedContent.videoQuality || 'HD';
             const qLower = q.toLowerCase();
             if (qLower.includes('8k')) return '8K';
             if (qLower.includes('4k')) return '4K';
             if (qLower.includes('ultra')) return 'ULTRA';
             if (qLower.includes('full')) return 'FHD';
             if (qLower.includes('hdr')) return 'HDR';
             return q.split(' ')[0].toUpperCase();
            })()}
           </div>
          )}
          {selectedContent.duration && <span>{selectedContent.duration}</span>}
         </div>
        </div>
       </div>
       <div className="modal-body-v">
        <div className="modal-desc-v" dangerouslySetInnerHTML={{ __html: selectedContent.description || "Experience the thrill of this cinematic masterpiece. Full details, cast, and high-quality streaming options available now." }} />
        <div className="modal-actions-v">
         <Link to={`/details/${selectedContent.type}/${selectedContent._id}`} className="modal-btn-primary-v">
          <Play size={20} fill="white" /> WATCH NOW
         </Link>
         <button className="modal-btn-secondary-v" onClick={() => setShowModal(false)}>CLOSE</button>
        </div>
       </div>
      </div>
     </div>
    )}

    <FrontendFooter settings={settings} />
   </div>

   <style dangerouslySetInnerHTML={{
    __html: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    .frontend-wrapper { background: #050505; color: #fff; min-height: 100vh; font-family: 'Inter', sans-serif; overflow-x: hidden; }
    .fe-loading-v { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; z-index: 999999; }
    .ios-spinner-v { position: relative; width: 60px; height: 60px; }
    .spoke-v { position: absolute; left: 28px; top: 0; width: 4px; height: 16px; background: #ffffff !important; border-radius: 10px; transform-origin: 2px 30px; animation: ios-fade 0.8s linear infinite; opacity: 0; }
    @keyframes ios-fade { 0% { opacity: 1; } 100% { opacity: 0.1; } }
    
    .spoke-1 { transform: rotate(0deg); animation-delay: -0.8s; }
    .spoke-2 { transform: rotate(18deg); animation-delay: -0.76s; }
    .spoke-3 { transform: rotate(36deg); animation-delay: -0.72s; }
    .spoke-4 { transform: rotate(54deg); animation-delay: -0.68s; }
    .spoke-5 { transform: rotate(72deg); animation-delay: -0.64s; }
    .spoke-6 { transform: rotate(90deg); animation-delay: -0.6s; }
    .spoke-7 { transform: rotate(108deg); animation-delay: -0.56s; }
    .spoke-8 { transform: rotate(126deg); animation-delay: -0.52s; }
    .spoke-9 { transform: rotate(144deg); animation-delay: -0.48s; }
    .spoke-10 { transform: rotate(162deg); animation-delay: -0.44s; }
    .spoke-11 { transform: rotate(180deg); animation-delay: -0.4s; }
    .spoke-12 { transform: rotate(198deg); animation-delay: -0.36s; }
    .spoke-13 { transform: rotate(216deg); animation-delay: -0.32s; }
    .spoke-14 { transform: rotate(234deg); animation-delay: -0.28s; }
    .spoke-15 { transform: rotate(252deg); animation-delay: -0.24s; }
    .spoke-16 { transform: rotate(270deg); animation-delay: -0.2s; }
    .spoke-17 { transform: rotate(288deg); animation-delay: -0.16s; }
    .spoke-18 { transform: rotate(306deg); animation-delay: -0.12s; }
    .spoke-19 { transform: rotate(324deg); animation-delay: -0.08s; }
    .spoke-20 { transform: rotate(342deg); animation-delay: -0.04s; }

    .fe-profile-v { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }

    /* Hero */
    .fe-hero-v { position: fixed; top: 0; left: 0; height: 100vh; height: 100dvh; width: 100%; overflow: hidden; z-index: 1; cursor: pointer; user-select: none; }
    .fe-hero-slide-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; visibility: hidden; transition: 1.5s ease-in-out; display: flex; align-items: center; padding: 0 80px 0 140px; z-index: 1; }
    .fe-hero-slide-v.active { opacity: 1; visibility: visible; z-index: 2; }
    .fe-hero-bg-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
    .fe-hero-bg-v img, .fe-hero-video-v { width: 100vw; height: 100dvh; object-fit: cover; object-position: center; pointer-events: none; }
    .fe-hero-overlay-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, #000 0%, transparent 60%), linear-gradient(to right, rgba(0,0,0,0.9) 0%, transparent 70%), rgba(0,0,0,0.2); z-index: 2; pointer-events: none; }
    .fe-hero-content-v { max-width: 700px; z-index: 10; transform: translateY(60px); opacity: 0; transition: 0.8s 0.5s ease-out; margin-top: 0; position: relative; }
    .fe-hero-slide-v.active .fe-hero-content-v { transform: translateY(0); opacity: 1; }
    .fe-hero-tag-v { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .tag-line-v { width: 3px; height: 18px; background: #b3d332; }
    .fe-hero-tag-v span { font-size: 0.75rem; font-weight: 800; letter-spacing: 2px; color: rgba(255,255,255,0.8); }
    .fe-hero-title-v { font-size: 5rem; font-weight: 800; margin: 0 0 25px 0; line-height: 1; text-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .fe-hero-meta-v { display: flex; align-items: center; gap: 20px; margin-bottom: 35px; }
    
    .fe-hero-rating-circle-v { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 3px; position: relative; box-shadow: 0 0 20px rgba(22,196,127,0.2); }
    .fe-hero-rating-circle-v .rating-inner-v { background: #000; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.1rem; font-weight: 900; }

    .meta-imdb-box-v { display: flex; align-items: center; gap: 8px; }
    .imdb-label-v { background: #f5c518; color: #000; padding: 3px 6px; border-radius: 4px; font-weight: 900; font-size: 0.8rem; }
    .imdb-score-text-v { color: #fff; font-weight: 800; font-size: 1rem; }
    
    .meta-item-v { color: #fff; font-size: 1.1rem; font-weight: 700; }
    .meta-cc-v { color: #fff; border: 1px solid rgba(255,255,255,0.4); padding: 1px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 800; }
    .meta-item-v { font-weight: 700; font-size: 0.85rem; color: rgba(255,255,255,0.9); }
    .fe-hero-desc-v { font-size: 1.05rem; line-height: 1.6; color: rgba(255,255,255,0.7); margin-bottom: 40px; max-width: 600px; }
    .fe-btn-primary-v { background: #b3d332; color: #fff; border: none; padding: 18px 50px; font-weight: 800; font-size: 0.9rem; letter-spacing: 2px; cursor: pointer; transition: 0.3s; border-radius: 4px; box-shadow: 0 10px 20px rgba(179,211,50,0.2); }
    .fe-btn-primary-v:hover { transform: scale(1.05); background: #b3d332; box-shadow: 0 15px 30px rgba(179,211,50,0.4); }
    .fe-hero-slider-dots-v { position: absolute; right: 60px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 15px; z-index: 100; }
    .dot-v { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.2); cursor: pointer; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(255,255,255,0.1); }
    .dot-v:hover { background: rgba(255,255,255,0.5); }
    .dot-v.active { background: rgba(255,255,255,0.1); height: 40px; border-radius: 10px; box-shadow: 0 0 15px rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.2); position: relative; overflow: hidden; }
    .dot-progress-v { position: absolute; top: 0; left: 0; width: 100%; background: #fff; animation: dotFill-v 5s linear forwards; }
    @keyframes dotFill-v { from { height: 0; } to { height: 100%; } }

    /* Content Rows */
    .row-title-with-badge-v { display: flex; align-items: center; gap: 15px; }
    .row-badge-v { background: #b3d332; color: #000; font-size: 0.65rem; font-weight: 900; padding: 4px 10px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .row-badge-v.premium-v { background: linear-gradient(135deg, #ffca28 0%, #ff8f00 100%); }
    .empty-section-v { background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 40px; text-align: center; color: #666; font-size: 0.9rem; font-style: italic; }
    .fe-content-v { background: #000; position: relative; z-index: 10; margin-top: 100vh; margin-top: 100dvh; padding: 40px 0; }

    /* Experience Section */
    .fe-experience-section-v { padding: 80px 5%; background: #000; color: #fff; }
    .fe-experience-container-v { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; gap: 80px; }
    
    .fe-experience-visual-v { flex: 1; position: relative; height: 600px; }
    .visual-collage-v { position: relative; width: 100%; height: 100%; }
    .visual-collage-v img { position: absolute; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); object-fit: cover; }
    
    .collage-img-1 { width: 450px; height: 550px; left: 0; top: 0; z-index: 1; }
    .collage-img-2 { width: 350px; height: 250px; right: 0; bottom: 80px; z-index: 3; }
    .collage-img-3 { width: 400px; height: 300px; left: 150px; bottom: 20px; z-index: 2; }
    
    .exp-badge-v { position: absolute; left: 140px; bottom: 120px; z-index: 10; background: #000; padding: 25px; border-radius: 20px; border: 1px solid #222; box-shadow: 0 30px 60px rgba(0,0,0,0.8); min-width: 280px; }
    .badge-tag-v { font-size: 0.65rem; font-weight: 800; color: #888; letter-spacing: 2px; margin-bottom: 10px; display: block; }
    .badge-title-v { font-size: 2.2rem; font-weight: 900; color: #fff; margin: 0 0 20px 0; line-height: 1; }
    .badge-btn-v { background: #b3d332; color: #fff; padding: 10px 25px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; display: inline-block; cursor: pointer; transition: transform 0.2s; }
    .badge-btn-v:hover { transform: scale(1.05); }

    .fe-experience-info-v { flex: 1; }
    .exp-main-title-v { font-size: 3.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 50px; }
    .exp-main-title-v span { text-decoration: underline; text-decoration-color: #b3d332; }
    
    .exp-feature-v { display: flex; gap: 25px; margin-bottom: 40px; align-items: flex-start; }
    .exp-feature-icon-v { color: #555; transition: color 0.3s; }
    .exp-feature-v:hover .exp-feature-icon-v { color: #b3d332; }
    
    .exp-feature-text-v h3 { font-size: 1.5rem; font-weight: 700; margin: 0 0 8px 0; color: #fff; }
    .exp-feature-text-v p { color: #888; font-size: 1rem; line-height: 1.6; margin: 0; }

    @media (max-width: 1200px) {
     .exp-main-title-v { font-size: 2.5rem; }
     .fe-experience-visual-v { height: 500px; }
     .collage-img-1 { width: 350px; height: 450px; }
     .collage-img-2 { width: 280px; height: 200px; }
     .collage-img-3 { width: 320px; height: 240px; }
    }

    @media (max-width: 992px) {
     .fe-experience-container-v { display: block; }
     .fe-experience-visual-v { display: block; height: 480px; width: 100%; max-width: 500px; margin: 0 auto 10px auto; position: relative; }
     .fe-experience-info-v { display: block; position: relative; z-index: 50; background: #000; width: 100%; margin-top: 0; }
     .exp-main-title-v { text-align: center; font-size: 2.2rem; line-height: 1.2; margin-bottom: 30px; }
     .exp-feature-v { max-width: 600px; margin: 0 auto 30px auto; }
     .exp-badge-v { display: none; }
    }

    @media (max-width: 768px) {
     .fe-experience-section-v { padding: 40px 5%; }
     .fe-experience-visual-v { height: 420px; margin-bottom: 0; }
     .collage-img-1 { width: 280px; height: 320px; left: 50%; transform: translateX(-50%); top: 0; }
     .collage-img-2 { width: 180px; height: 130px; bottom: 40px; right: 0; }
     .collage-img-3 { width: 200px; height: 150px; left: 0; bottom: 10px; }
     .exp-feature-text-v h3 { font-size: 1.1rem; }
     .exp-feature-text-v p { font-size: 0.85rem; }
    }

    /* Watch Online Section */
    .fe-watch-online-v { padding: 80px 5%; background: #000; text-align: center; }
    .watch-online-header-v { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 50px; text-align: left; }
    .watch-online-tag-v { font-size: 0.8rem; font-weight: 800; color: #888; letter-spacing: 3px; display: block; margin-bottom: 10px; }
    .watch-online-title-v { font-size: 3rem; font-weight: 800; color: #fff; margin: 0; }
    
    .watch-online-grid-v { display: grid; grid-template-columns: repeat(6, 1fr); gap: 25px; max-width: 1400px; margin: 0 auto; }
    .online-movie-card-v { text-align: left; }
    
    .online-movie-poster-v { position: relative; border-radius: 8px; overflow: hidden; aspect-ratio: 2/3; margin-bottom: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .online-movie-poster-v img { width: 100%; height: 100%; object-fit: cover; }
    .online-movie-poster-v::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%); opacity: 0; transition: 0.3s ease; z-index: 4; }
    .online-movie-card-v:hover .online-movie-poster-v::after { opacity: 1; }
    
    .online-card-overlay-v { position: absolute; bottom: 12px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: center; z-index: 5; opacity: 0; transition: 0.3s ease; }
    .online-movie-card-v:hover .online-card-overlay-v { opacity: 1; }
    .online-quality-v { background: #fff; color: #000; font-size: 0.6rem; font-weight: 900; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
    .online-rating-v { width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.85rem; font-weight: 900; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); box-shadow: 0 0 15px rgba(22,196,127,0.3); padding: 2px; position: relative; }
    .rating-inner-v { background: #000; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; }
    
    .online-movie-meta-v { display: flex; flex-direction: column; gap: 4px; padding: 0 5px; }
    .meta-top-v { display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; color: #777; font-weight: 800; margin-bottom: 2px; }
    .meta-type-v { border: 1px solid #333; padding: 2px 6px; border-radius: 4px; color: #aaa; }
    .meta-genre-v { color: #b3d332; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .meta-title-v { color: #fff; font-size: 1.05rem; font-weight: 800; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    @media (max-width: 1200px) {
     .watch-online-grid-v { grid-template-columns: repeat(4, 1fr); }
    }

    @media (max-width: 768px) {
     .watch-online-title-v { font-size: 2.2rem; }
     .watch-online-grid-v { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px; }
     .online-quality-v { font-size: 0.5rem; padding: 3px 6px; }
     .online-rating-v { width: 30px; height: 30px; font-size: 0.7rem; }
     .meta-title-v { font-size: 0.95rem; }
    }

    @media (max-width: 480px) {
     .watch-online-title-v { font-size: 1.8rem; }
     .watch-online-grid-v { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
     .meta-title-v { font-size: 0.85rem; }
     .watch-online-header-v { margin-bottom: 25px; }
    }

    .fe-row-v { margin-bottom: 60px; padding: 0 5%; }
    .row-header-v { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .row-title-v { font-size: clamp(1.2rem, 2vw, 1.8rem); font-weight: 800; letter-spacing: 1px; color: #fff; }
    .row-more-v { font-size: 0.75rem; font-weight: 800; color: #b3d332; letter-spacing: 2px; text-decoration: none; display: flex; align-items: center; gap: 8px; opacity: 0.8; transition: 0.3s; }
    .row-more-v:hover { opacity: 1; transform: translateX(5px); }

    .fe-movie-list-v { display: flex; gap: 25px; overflow-x: auto; padding-bottom: 30px; scroll-snap-type: x mandatory; }
    .fe-movie-list-v::-webkit-scrollbar { height: 4px; }
    .fe-movie-list-v::-webkit-scrollbar-track { background: #111; }
    .fe-movie-list-v::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }

    .fe-movie-card-v { width: 220px; height: 330px; flex-shrink: 0; position: relative; border-radius: 12px; overflow: hidden; transition: 0.5s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; scroll-snap-align: start; }
    .fe-featured-row-v .fe-movie-card-v { width: 260px; height: 390px; }
    
    .fe-movie-card-v img { width: 100%; height: 100%; object-fit: cover; display: block; transition: 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    .fe-movie-card-v:hover { transform: scale(1.05); z-index: 100; box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
    .fe-movie-card-v:hover img { transform: scale(1.1); }
    .fe-card-hover-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%); opacity: 1; transition: 0.3s; display: flex; flex-direction: column; justify-content: flex-end; padding: 15px; }
    .fe-play-btn-v { width: 45px; height: 45px; background: #b3d332; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; transform: scale(0); opacity: 0; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .fe-movie-card-v:hover .fe-play-btn-v { transform: scale(1); opacity: 1; }

    .fe-card-badges-v { display: flex; gap: 8px; margin-bottom: 8px; transform: translateY(10px); opacity: 0; transition: 0.3s ease 0.1s; align-items: center; }
    .fe-movie-card-v:hover .fe-card-badges-v { transform: translateY(0); opacity: 1; }
    
    .fe-premium-badge-v { display: flex; border: 1px solid #000; border-radius: 2px; overflow: hidden; background: #fff; line-height: 1; height: 18px; }
    .badge-prefix-v { background: #000; color: #fff; font-size: 0.65rem; font-weight: 400; padding: 0 6px; display: flex; align-items: center; justify-content: center; }
    .badge-suffix-v { background: #fff; color: #000; font-size: 0.75rem; font-weight: 800; padding: 0 6px; display: flex; align-items: center; justify-content: center; letter-spacing: -0.2px; }

    .fe-badge-rating-v { width: 36px; height: 36px; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.75rem; font-weight: 800; border-radius: 50%; backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(22,196,127,0.2); padding: 2px; position: relative; }
    .fe-premium-indicator-v { position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #ffca28 0%, #ff8f00 100%); color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 8; box-shadow: 0 4px 15px rgba(255,143,0,0.4); border: 1px solid rgba(255,255,255,0.2); }
    .fe-card-info-title-v { font-size: 0.9rem; font-weight: 800; margin-bottom: 4px; transition: 0.3s; color: #fff; }
    .fe-card-info-meta-v { font-size: 0.65rem; font-weight: 800; background: #b3d332; color: #fff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; padding: 3px 8px; border-radius: 4px; display: inline-block; width: fit-content; opacity: 0; transform: translateY(5px); transition: 0.4s; }
    .fe-movie-card-v:hover .fe-card-info-meta-v { opacity: 1; transform: translateY(0); }
    .fe-card-meta-v { font-size: 0.7rem; color: rgba(255,255,255,0.7); display: flex; align-items: center; gap: 6px; font-weight: 600; }
    .fe-card-meta-v .dot { color: #b3d332; font-weight: 900; }

    /* Responsive */
    @media (max-width: 1024px) {
     .fe-navbar-v { padding: 0 20px; height: 70px; }
     .desktop-only { display: none !important; }
     .fe-mobile-toggle-v { display: block; }
     .fe-nav-center-v { display: none; }
     .fe-hero-v, .fe-hero-slide-v, .fe-hero-bg-v, .fe-hero-bg-v img, .fe-hero-video-v { height: 70vh; height: 70dvh; }
     .fe-content-v { margin-top: 70vh; margin-top: 70dvh; padding: 40px 20px; }
     .fe-hero-slide-v { padding: 0 40px; }
     .fe-hero-content-v { padding: 0; max-width: 90%; }
     .fe-hero-title-v { font-size: 2.4rem; margin-bottom: 15px; }
     .fe-hero-desc-v { font-size: 0.9rem; line-height: 1.5; margin-bottom: 25px; }
     .fe-hero-meta-v { gap: 10px; margin-bottom: 20px; scale: 0.9; transform-origin: left; }
     .fe-btn-primary-v { padding: 12px 30px; font-size: 0.8rem; }
     .fe-card-info-title-v { font-size: 0.8rem !important; }
     .fe-movie-card-v { width: 180px; height: 270px; }
    }
    @media (max-width: 768px) {
     .fe-hero-v { 
      height: 42vh !important; 
      height: 42dvh !important; 
      min-height: 42dvh !important; 
     }
     .fe-hero-slide-v, .fe-hero-bg-v, .fe-hero-bg-v img, .fe-hero-video-v, .fe-hero-overlay-v { 
      height: 100% !important; 
      width: 100% !important; 
      min-height: 100% !important;
     }
     .fe-content-v { margin-top: 42vh !important; margin-top: 42dvh !important; }
     .fe-hero-slide-v { padding: 0 15px 15px 15px !important; align-items: flex-end !important; }
     .fe-hero-content-v { max-width: 90% !important; }
     .fe-hero-slide-v.active .fe-hero-content-v { transform: translateY(15px) !important; opacity: 1 !important; }
     .fe-hero-title-v { font-size: 1.2rem !important; margin-bottom: 5px !important; }
     .fe-hero-desc-v { font-size: 0.65rem !important; -webkit-line-clamp: 2 !important; line-height: 1.2 !important; margin-bottom: 8px !important; }
     .fe-hero-meta-v { scale: 0.75 !important; transform-origin: left !important; margin-bottom: 10px !important; display: flex !important; flex-wrap: nowrap !important; gap: 15px !important; width: max-content !important; }
     .fe-hero-slider-dots-v { right: 8px !important; scale: 0.45 !important; bottom: 15px !important; top: auto !important; transform: none !important; }
     .fe-btn-primary-v { padding: 10px 25px !important; font-size: 0.7rem !important; letter-spacing: 1px !important; }
     .fe-card-info-title-v { font-size: 0.65rem !important; }
     .fe-card-info-meta-v { font-size: 0.5rem !important; padding: 2px 5px !important; }
     .fe-card-meta-v { font-size: 0.55rem !important; }
     .fe-movie-card-v { width: 140px; height: 210px; }
     .fe-featured-row-v .fe-movie-card-v { width: 160px; height: 240px; }
     .row-title-v { font-size: 1rem; }
     .row-more-v { font-size: 0.55rem !important; gap: 4px !important; letter-spacing: 1px !important; }

     /* Mobile Card Play button, badges, ratings overrides */
     .fe-play-btn-v { width: 30px !important; height: 30px !important; margin-bottom: 5px !important; }
     .fe-play-btn-v svg { width: 12px !important; height: 12px !important; }
     .fe-premium-badge-v { height: 14px !important; border-radius: 1px !important; border: 1px solid #000 !important; }
     .badge-prefix-v { font-size: 0.45rem !important; padding: 0 3px !important; }
     .badge-suffix-v { font-size: 0.5rem !important; padding: 0 3px !important; }
     .online-rating-v { width: 22px !important; height: 22px !important; font-size: 0.55rem !important; box-shadow: none !important; }
     .rating-inner-v { font-size: 0.55rem !important; }
     .online-card-overlay-v { bottom: 6px !important; left: 6px !important; right: 6px !important; }
     .fe-card-badges-v { gap: 4px !important; margin-bottom: 4px !important; }
    }

    .fe-quick-modal-overlay-v { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); padding: 20px; }
    .fe-quick-modal-v { background: #0a0a0a; width: 100%; max-width: 800px; border-radius: 24px; overflow: hidden; border: 1px solid #222; position: relative; animation: modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .close-modal-v { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.5); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
    .close-modal-v:hover { background: #b3d332; transform: rotate(90deg); }
    
    .modal-banner-v { position: relative; width: 100%; height: 350px; }
    .modal-banner-v img { width: 100%; height: 100%; object-fit: cover; }
    .banner-overlay-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, #0a0a0a 0%, transparent 100%); }
    .banner-content-v { position: absolute; bottom: 30px; left: 40px; right: 40px; }
    .modal-title-v { font-size: 3rem; font-weight: 800; margin: 0 0 15px 0; }
    .modal-meta-v { display: flex; gap: 20px; align-items: center; font-weight: 700; color: #888; }
    .rating-v { color: #fff; display: flex; align-items: center; gap: 6px; }
    
    .modal-body-v { padding: 40px; }
    .modal-desc-v { color: #aaa; line-height: 1.8; font-size: 1.1rem; margin-bottom: 40px; }
    .modal-actions-v { display: flex; gap: 15px; }
    .modal-btn-primary-v { background: #b3d332; color: #fff; padding: 15px 40px; border-radius: 8px; font-weight: 800; text-decoration: none; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
    .modal-btn-primary-v:hover { transform: scale(1.05); background: #b3d332; }
    .modal-btn-secondary-v { background: #222; color: #fff; border: none; padding: 15px 30px; border-radius: 8px; font-weight: 800; cursor: pointer; transition: 0.3s; }
    .modal-btn-secondary-v:hover { background: #333; }

    /* Unified Quality Badge */
    .fe-quality-badge-v {
     position: absolute;
     top: 10px;
     left: 10px;
     background: #b3d332;
     color: #000;
     padding: 3px 8px;
     border-radius: 4px;
     font-weight: 900;
     font-size: 0.65rem;
     letter-spacing: 0.5px;
     text-transform: uppercase;
     z-index: 10;
     box-shadow: 0 4px 10px rgba(0,0,0,0.5);
     border: 1px solid rgba(255,255,255,0.1);
    }
    .modal-btn-secondary-v:hover { background: #333; }

    @keyframes modalPop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    
    @media (max-width: 768px) {
     .modal-banner-v { height: 200px; }
     .modal-title-v { font-size: 1.8rem; }
     .modal-body-v { padding: 20px; }
     .modal-desc-v { font-size: 0.9rem; margin-bottom: 25px; }
     .modal-btn-primary-v { flex: 1; justify-content: center; font-size: 0.8rem; padding: 12px; }
     .modal-btn-secondary-v { display: none; }
    }

    .fe-landscape-row-v { margin-bottom: 50px; }
    
    .fe-landscape-list-container-v { position: relative; display: flex; align-items: center; }
    .fe-landscape-list-v { display: flex; gap: 20px; overflow-x: auto; scroll-behavior: smooth; padding: 10px 0; -ms-overflow-style: none; scrollbar-width: none; align-items: flex-start !important; }
    .fe-landscape-list-v::-webkit-scrollbar { display: none; }
    
    .fe-landscape-card-v { flex: 0 0 calc(25% - 15px) !important; aspect-ratio: 16/9; position: relative; border-radius: 12px; overflow: hidden; cursor: pointer; transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); border: 1px solid rgba(255,255,255,0.05); }
    .fe-landscape-card-v img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
    .fe-landscape-card-v:hover { transform: scale(1.05); border-color: #b3d332; z-index: 10; box-shadow: 0 15px 30px rgba(0,0,0,0.6); }
    .fe-landscape-card-v:hover img { transform: scale(1.1); }
    .fe-landscape-card-v:hover .card-title-v { opacity: 1; transform: translateY(0); }
    
    /* Sports Cards Outside Content Styles */
    .fe-landscape-card-v.outside-content-v {
     flex: 0 0 calc(25% - 15px) !important;
     overflow: visible !important;
     aspect-ratio: auto !important;
     background: transparent !important;
     border: none !important;
     box-shadow: none !important;
     transform: none !important;
    }
    .fe-landscape-img-wrapper-v {
     position: relative;
     width: 100%;
     height: 0;
     padding-bottom: 56.25%;
     border-radius: 12px;
     overflow: hidden;
     border: 1px solid rgba(255,255,255,0.05);
     transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    .fe-landscape-img-wrapper-v img {
     position: absolute;
     top: 0;
     left: 0;
     width: 100% !important;
     height: 100% !important;
     object-fit: cover !important;
     transition: 0.5s;
    }
    .fe-landscape-card-v.outside-content-v:hover .fe-landscape-img-wrapper-v {
     transform: scale(1.05);
     border-color: #b3d332;
     box-shadow: 0 15px 30px rgba(0,0,0,0.6);
    }
    .fe-landscape-card-v.outside-content-v:hover img {
     transform: scale(1.1);
    }
    .fe-sports-card-info-under-v {
     padding: 10px 4px 0 4px;
     text-align: left;
     height: 72px;
     display: flex;
     flex-direction: column;
     justify-content: flex-start;
    }
    .card-title-under-v {
     font-size: 0.95rem;
     font-weight: 700;
     color: #fff;
     margin-bottom: 4px;
     display: -webkit-box;
     -webkit-line-clamp: 2;
     -webkit-box-orient: vertical;
     overflow: hidden;
     text-overflow: ellipsis;
     line-height: 1.3;
     height: 2.6rem;
     transition: 0.3s;
    }
    .fe-landscape-card-v.outside-content-v:hover .card-title-under-v {
     color: #b3d332;
    }
    .card-cat-under-v {
     font-size: 0.75rem;
     font-weight: 600;
     color: rgba(255,255,255,0.5);
     text-transform: uppercase;
     letter-spacing: 0.5px;
    }
    
    .card-overlay-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%); display: flex; align-items: flex-end; padding: 15px; }
    .card-title-v { color: #fff; font-size: 1rem; font-weight: 700; opacity: 0.8; transition: 0.3s; transform: translateY(5px); }
        /* Live TV channel cards style */
     .fe-channel-card-v {
      flex: 0 0 140px !important;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
     }
     .channel-logo-wrapper-v {
      width: 100%;
      aspect-ratio: 1/1;
      border-radius: 20px;
      overflow: hidden;
      background: #15181e;
      border: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
     }
     .channel-logo-wrapper-v img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 20px;
      transition: 0.5s;
     }
     .fe-channel-card-v:hover .channel-logo-wrapper-v {
      border-color: #b3d332;
     }
     .channel-info-under-v {
      margin-top: 10px;
      text-align: center;
      width: 100%;
     }
     .channel-title-v {
      font-size: 0.9rem;
      font-weight: 700;
      color: rgba(255,255,255,0.8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: 0.3s;
     }
     .fe-channel-card-v:hover .channel-title-v {
      color: #b3d332;
     }
    
    .nav-btn-v { position: absolute; width: 45px; height: 45px; background: #b3d332; color: #fff; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 20; box-shadow: 0 5px 15px rgba(22, 196, 127, 0.4); transition: 0.3s; }
    .nav-btn-v:hover { transform: scale(1.1); background: #b3d332; }
    .prev-v { left: -22px; }
    .next-v { right: -22px; }
 
    @media (max-width: 1200px) {
     .fe-landscape-card-v { flex: 0 0 calc(33.33% - 14px); }
     .fe-landscape-card-v.outside-content-v { flex: 0 0 calc(33.33% - 14px) !important; }
    }
    @media (max-width: 992px) {
     .fe-landscape-card-v { flex: 0 0 calc(50% - 10px); }
     .fe-landscape-card-v.outside-content-v { flex: 0 0 calc(50% - 10px) !important; }
    }
    @media (max-width: 600px) {
     .fe-landscape-card-v { flex: 0 0 calc(100% - 0px); }
     .nav-btn-v { display: none; }
    }
    
    @media (max-width: 768px) {
     /* Force Sports card size to be small on mobile */
     .fe-landscape-card-v.outside-content-v {
      flex: 0 0 220px !important;
      aspect-ratio: 16/9 !important;
      overflow: hidden !important;
      border-radius: 8px !important;
      border: 1px solid rgba(255,255,255,0.05) !important;
      position: relative !important;
     }
     .fe-landscape-card-v.outside-content-v .fe-landscape-img-wrapper-v {
      height: 0 !important;
      padding-bottom: 56.25% !important;
      border: none !important;
      border-radius: 0 !important;
      transform: none !important;
     }
     /* Move the info back INSIDE the card as an overlay on mobile */
     .fe-landscape-card-v.outside-content-v .fe-sports-card-info-under-v {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%) !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-end !important;
      padding: 10px !important;
      z-index: 5 !important;
      pointer-events: none !important;
     }
     .fe-landscape-card-v.outside-content-v .card-title-under-v {
      font-size: 0.75rem !important;
      margin-bottom: 2px !important;
      white-space: nowrap !important;
      color: #fff !important;
     }
     .fe-landscape-card-v.outside-content-v .card-cat-under-v {
      font-size: 0.55rem !important;
      color: rgba(255,255,255,0.7) !important;
     }
     
     /* Responsive Channel Overrides */
     .fe-channel-card-v {
      flex: 0 0 100px !important;
     }
     .channel-logo-wrapper-v {
      border-radius: 14px;
     }
     .channel-logo-wrapper-v img {
      padding: 12px;
     }
     .channel-title-v {
      font-size: 0.75rem;
     }
     }
    }

    /* Subscription CTA Styles */
    .fe-subscription-cta-v {
     padding: 60px 5%;
     background: linear-gradient(135deg, rgba(179, 211, 50, 0.1) 0%, rgba(0,0,0,0.8) 100%);
     border-top: 1px solid rgba(255,255,255,0.05);
     border-bottom: 1px solid rgba(255,255,255,0.05);
     margin-bottom: 50px;
     margin-top: 20px;
     display: flex;
     justify-content: center;
     text-align: center;
    }
    .fe-cta-content-v {
     max-width: 600px;
     width: 100%;
     margin: 0 auto;
     display: flex;
     flex-direction: column;
     align-items: center;
     text-align: center;
    }
    .fe-cta-content-v h2 {
     font-size: 2.2rem;
     font-weight: 800;
     color: #fff;
     margin-bottom: 15px;
     width: 100%;
    }
    .fe-cta-content-v p {
     color: #aaa;
     font-size: 1rem;
     margin-bottom: 30px;
     line-height: 1.5;
     width: 100%;
    }
    .fe-cta-input-group-v {
     display: flex;
     gap: 15px;
     align-items: center;
     justify-content: center;
     width: 100%;
    }
     .lemo-toast-notification-v {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 100000;
      background: rgba(15, 15, 15, 0.85);
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
      max-width: 380px;
      width: calc(100% - 60px);
      animation: lemoToastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
     }
     .lemo-toast-accent-v {
      position: absolute;
      left: 0;
      top: 0;
      width: 5px;
      height: 100%;
     }
     .lemo-toast-notification-v.error .lemo-toast-accent-v {
      background: #ff4d4d;
      box-shadow: 0 0 15px rgba(255, 77, 77, 0.6);
     }
     .lemo-toast-notification-v.success .lemo-toast-accent-v {
      background: #b3d332;
      box-shadow: 0 0 15px rgba(179, 211, 50, 0.6);
     }
     .lemo-toast-body-v {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.4;
      text-align: left;
     }
     .lemo-toast-icon-v {
      flex-shrink: 0;
     }
     .lemo-toast-icon-v.error {
      color: #ff4d4d;
     }
     .lemo-toast-icon-v.success {
      color: #b3d332;
     }
     .lemo-toast-close-v {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 6px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
     }
     .lemo-toast-close-v:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      transform: rotate(90deg);
     }
     @keyframes lemoToastIn {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
     }
    .fe-cta-email-v {
     flex: 1;
     background: rgba(255,255,255,0.08);
     border: 1px solid rgba(255,255,255,0.2);
     padding: 16px 20px;
     border-radius: 8px;
     color: #fff;
     font-size: 1.05rem;
     outline: none;
     transition: 0.3s;
     width: 100%;
    }
    .fe-cta-email-v:focus {
     border-color: #b3d332;
     background: rgba(255,255,255,0.12);
    }
    .fe-cta-email-v::placeholder {
     color: rgba(255,255,255,0.4);
    }
    .fe-cta-btn-v {
     background: #b3d332;
     color: #000;
     border: none;
     padding: 16px 35px;
     border-radius: 8px;
     font-weight: 800;
     font-size: 1.05rem;
     cursor: pointer;
     transition: 0.3s;
     white-space: nowrap;
    }
    .fe-cta-btn-v:hover {
     background: #9ab829;
     transform: translateY(-2px);
     box-shadow: 0 10px 20px rgba(179,211,50,0.3);
    }
    @media (max-width: 600px) {
     .fe-cta-input-group-v {
      flex-direction: column;
      width: 100%;
     }
     .fe-cta-email-v {
      width: 100%;
      padding: 18px 20px;
      font-size: 1.1rem;
     }
     .fe-cta-btn-v {
      width: 100%;
      padding: 18px 20px;
      font-size: 1.1rem;
     }
     .fe-subscription-cta-v {
      padding: 40px 5%;
     }
     .fe-cta-content-v h2 {
      font-size: 1.8rem;
     }
    }
   ` }} />
  </FrontendLayout>
 );
};

export default Home;
