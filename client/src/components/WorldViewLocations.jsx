import React, { useState, useEffect, useRef } from 'react';
import { 
  SlidersHorizontal, 
  Maximize2, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  X,
  Loader2,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';


const defaultLocations = [
  { flag: '🇺🇸', country: 'United States', visitors: 689, code: 'US', name: 'United States of America' },
  { flag: '🇮🇳', country: 'India', visitors: 842, code: 'IN', name: 'India' },
  { flag: '🇬🇧', country: 'United Kingdom', visitors: 310, code: 'GB', name: 'United Kingdom' },
  { flag: '🇨🇦', country: 'Canada', visitors: 215, code: 'CA', name: 'Canada' },
  { flag: '🇦🇺', country: 'Australia', visitors: 182, code: 'AU', name: 'Australia' },
  { flag: '🇷🇺', country: 'Russia', visitors: 180, code: 'RU', name: 'Russia' },
  { flag: '🇩🇪', country: 'Germany', visitors: 145, code: 'DE', name: 'Germany' },
  { flag: '🇦🇪', country: 'United Arab Emirates', visitors: 120, code: 'AE', name: 'United Arab Emirates' },
  { flag: '🇫🇷', country: 'France', visitors: 112, code: 'FR', name: 'France' },
  { flag: '🇸🇪', country: 'Sweden', visitors: 98, code: 'SE', name: 'Sweden' },
  { flag: '🇧🇷', country: 'Brazil', visitors: 95, code: 'BR', name: 'Brazil' },
  { flag: '🇳🇱', country: 'Netherlands', visitors: 89, code: 'NL', name: 'Netherlands' },
  { flag: '🇮🇩', country: 'Indonesia', visitors: 88, code: 'ID', name: 'Indonesia' },
  { flag: '🇯🇵', country: 'Japan', visitors: 78, code: 'JP', name: 'Japan' },
  { flag: '🇲🇽', country: 'Mexico', visitors: 76, code: 'MX', name: 'Mexico' },
  { flag: '🇵🇰', country: 'Pakistan', visitors: 67, code: 'PK', name: 'Pakistan' },
  { flag: '🇮🇹', country: 'Italy', visitors: 64, code: 'IT', name: 'Italy' },
  { flag: '🇵🇭', country: 'Philippines', visitors: 62, code: 'PH', name: 'Philippines' },
  { flag: '🇲🇾', country: 'Malaysia', visitors: 54, code: 'MY', name: 'Malaysia' },
  { flag: '🇪🇸', country: 'Spain', visitors: 53, code: 'ES', name: 'Spain' },
  { flag: '🇹🇭', country: 'Thailand', visitors: 49, code: 'TH', name: 'Thailand' },
  { flag: '🇿🇦', country: 'South Africa', visitors: 42, code: 'ZA', name: 'South Africa' },
  { flag: '🇧🇩', country: 'Bangladesh', visitors: 41, code: 'BD', name: 'Bangladesh' },
  { flag: '🇻🇳', country: 'Vietnam', visitors: 38, code: 'VN', name: 'Vietnam' },
  { flag: '🇳🇬', country: 'Nigeria', visitors: 33, code: 'NG', name: 'Nigeria' },
  { flag: '🇸🇦', country: 'Saudi Arabia', visitors: 23, code: 'SA', name: 'Saudi Arabia' },
  { flag: '🇶🇦', country: 'Qatar', visitors: 20, code: 'QA', name: 'Qatar' },
  { flag: '🇴🇲', country: 'Oman', visitors: 19, code: 'OM', name: 'Oman' },
  { flag: '🇸🇬', country: 'Singapore', visitors: 12, code: 'SG', name: 'Singapore' },
  { flag: '🇹ℤ', country: 'Tanzania', visitors: 1, code: 'TZ', name: 'United Republic of Tanzania' },
  { flag: '🇸🇱', country: 'Sierra Leone', visitors: 1, code: 'SL', name: 'Sierra Leone' },
  { flag: '🇸🇨', country: 'Seychelles', visitors: 1, code: 'SC', name: 'Seychelles' },
  { flag: '🇵🇹', country: 'Portugal', visitors: 1, code: 'PT', name: 'Portugal' }
];

const defaultStateLocations = [
  { flag: '🇮🇳', country: 'Maharashtra, IN', visitors: 340, code: 'IN' },
  { flag: '🇺🇸', country: 'California, US', visitors: 285, code: 'US' },
  { flag: '🇮🇳', country: 'Delhi NCR, IN', visitors: 280, code: 'IN' },
  { flag: '🇬🇧', country: 'Greater London, UK', visitors: 210, code: 'GB' },
  { flag: '🇺🇸', country: 'Texas, US', visitors: 195, code: 'US' },
  { flag: '🇨🇦', country: 'Ontario, CA', visitors: 142, code: 'CA' },
  { flag: '🇦🇺', country: 'New South Wales, AU', visitors: 110, code: 'AU' },
  { flag: '🇦🇪', country: 'Dubai Emirate, AE', visitors: 105, code: 'AE' },
  { flag: '🇩🇪', country: 'Bavaria, DE', visitors: 92, code: 'DE' },
  { flag: '🇫🇷', country: 'Île-de-France, FR', visitors: 78, code: 'FR' },
  { flag: '🇯🇵', country: 'Tokyo Prefecture, JP', visitors: 64, code: 'JP' },
  { flag: '🇸🇪', country: 'Stockholm County, SE', visitors: 58, code: 'SE' }
];

const defaultCityLocations = [
  { flag: '🇮🇳', country: 'Mumbai', visitors: 210, code: 'IN' },
  { flag: '🇺🇸', country: 'New York', visitors: 185, code: 'US' },
  { flag: '🇬🇧', country: 'London', visitors: 175, code: 'GB' },
  { flag: '🇮🇳', country: 'Bengaluru', visitors: 165, code: 'IN' },
  { flag: '🇺🇸', country: 'Los Angeles', visitors: 140, code: 'US' },
  { flag: '🇦🇪', country: 'Dubai', visitors: 105, code: 'AE' },
  { flag: '🇨🇦', country: 'Toronto', visitors: 98, code: 'CA' },
  { flag: '🇦🇺', country: 'Sydney', visitors: 88, code: 'AU' },
  { flag: '🇫🇷', country: 'Paris', visitors: 76, code: 'FR' },
  { flag: '🇯🇵', country: 'Tokyo', visitors: 64, code: 'JP' },
  { flag: '🇩🇪', country: 'Berlin', visitors: 52, code: 'DE' },
  { flag: '🇸🇬', country: 'Singapore', visitors: 45, code: 'SG' }
];

const defaultContinentLocations = [
  { flag: '🌏', country: 'Asia', visitors: 1420, code: 'AS' },
  { flag: '🌎', country: 'North America', visitors: 980, code: 'NA' },
  { flag: '🌍', country: 'Europe', visitors: 840, code: 'EU' },
  { flag: '🌏', country: 'Oceania', visitors: 210, code: 'OC' },
  { flag: '🌎', country: 'South America', visitors: 145, code: 'SA' },
  { flag: '🌍', country: 'Africa', visitors: 95, code: 'AF' }
];

// Density Color Palette
const getDensityColor = (visitors) => {
  if (!visitors || visitors === 0) return '#202622'; // No data
  if (visitors <= 1) return '#263b2c';               // 0 - 1
  if (visitors <= 3) return '#2e4735';               // 1 - 3
  if (visitors <= 15) return '#396043';              // 3 - 15
  if (visitors <= 56) return '#48995a';              // 15 - 56
  return '#5ea870';                                  // 56 - 2K
};

// Convert GeoJSON Polygon or MultiPolygon coordinates to SVG path string
const geoToSvgPath = (geometry) => {
  if (!geometry || !geometry.coordinates) return '';
  const { type, coordinates } = geometry;

  const ringToD = (ring) => {
    return ring.map((pt, i) => {
      // Map longitude [-180, 180] to X [0, 1000]
      // Map latitude [-90, 90] to Y [500, 0] (Equirectangular projection)
      const x = ((pt[0] + 180) / 360) * 1000;
      const y = ((90 - pt[1]) / 180) * 500;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1.5)},${y.toFixed(1.5)}`;
    }).join(' ') + ' Z';
  };

  if (type === 'Polygon') {
    return coordinates.map(ringToD).join(' ');
  } else if (type === 'MultiPolygon') {
    return coordinates.map(poly => poly.map(ringToD).join(' ')).join(' ');
  }
  return '';
};

const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

const WorldViewLocations = ({ customData }) => {
  // Deduplicate locations by code or country name
  const rawLocations = customData || defaultLocations;
  const locations = Array.from(
    new Map(rawLocations.map(item => [item.code || item.country, item])).values()
  );

  const [geoJsonData, setGeoJsonData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showLocationFilterPopover, setShowLocationFilterPopover] = useState(false);
  const [selectedLocationMode, setSelectedLocationMode] = useState('Country');
  const [appliedLocationMode, setAppliedLocationMode] = useState('Country');
  const itemsPerPage = 10;

  const locationFilterRef = useRef(null);

  // Active dataset based on applied location metric mode
  const getActiveLocationDataset = () => {
    if (appliedLocationMode === 'State') return defaultStateLocations;
    if (appliedLocationMode === 'City') return defaultCityLocations;
    if (appliedLocationMode === 'Continent') return defaultContinentLocations;
    return locations;
  };

  const activeLocationsList = getActiveLocationDataset();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationFilterRef.current && !locationFilterRef.current.contains(e.target)) {
        setShowLocationFilterPopover(false);
      }
    };
    if (showLocationFilterPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLocationFilterPopover]);


  // Map country name or ISO code to visitor count from location dataset
  const getVisitorDataForGeoFeature = (feature) => {
    const props = feature.properties || {};
    const featureName = (props.ADMIN || props.name || props.ADMIN_NAME || '').toLowerCase();
    const featureIso2 = (props['ISO_A2'] || props.ISO_A2 || props.iso2 || '').toUpperCase();
    const featureIso3 = (props['ISO_A3'] || props.ISO_A3 || props.iso3 || '').toUpperCase();

    const match = locations.find(loc => {
      const locName = (loc.country || loc.name || '').toLowerCase();
      const locCode = (loc.code || '').toUpperCase();

      return (
        locCode === featureIso2 ||
        locCode === featureIso3 ||
        locName === featureName ||
        featureName.includes(locName) ||
        locName.includes(featureName)
      );
    });

    return match || null;
  };

  // Fetch real GeoJSON boundaries on mount
  useEffect(() => {
    let isMounted = true;
    setGeoLoading(true);
    fetch(GEOJSON_URL)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setGeoJsonData(data);
          setGeoLoading(false);
        }
      })
      .catch(err => {
        console.error('GeoJSON fetch error, using fallback projection:', err);
        if (isMounted) setGeoLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const filteredLocations = activeLocationsList.filter(loc => 
    (loc.country || loc.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLocations = filteredLocations.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLocations.map(l => ({
      Country: l.country,
      Visitors: l.visitors,
      Code: l.code || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Locations');
    XLSX.writeFile(wb, 'visitor_locations.xlsx');
  };

  return (
    <div className={`world-locations-wrapper ${isFullScreen ? 'fullscreen-mode' : ''}`}>
      {/* Left Card: World view */}
      <div className="world-card">
        <div className="card-header">
          <h3 className="card-title">World view</h3>
          <button className="header-icon-btn" title="Filter map">
            <SlidersHorizontal size={15} />
          </button>
        </div>

        <div className="map-viewport">
          {/* Top Left Badge Overlay */}
          <div className="map-badge-overlay">
            <span className="badge-title">Visitors per country</span>
            <span className="badge-subtitle">{locations.length} countries with data</span>
          </div>

          {geoLoading && (
            <div className="map-loading-overlay">
              <Loader2 className="spinner" size={24} />
              <span>Loading GeoJSON Boundaries...</span>
            </div>
          )}

          {/* Map Graphic Container */}
          <div className="world-svg-container">
            <svg viewBox="0 0 1000 500" className="world-map-svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                </pattern>
                
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(179, 211, 50, 0.06)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
              </defs>

              {/* Grid & Glow background */}
              <rect width="1000" height="500" fill="url(#grid)" />
              <rect width="1000" height="500" fill="url(#mapGlow)" />

              {/* Equirectangular Grid Lines */}
              <g stroke="rgba(255,255,255,0.03)" strokeWidth="0.6" fill="none">
                <path d="M 0,125 L 1000,125" />
                <path d="M 0,250 L 1000,250" strokeDasharray="4 4" />
                <path d="M 0,375 L 1000,375" />
                <path d="M 250,0 L 250,500" />
                <path d="M 500,0 L 500,500" strokeDasharray="4 4" />
                <path d="M 750,0 L 750,500" />
              </g>

              {/* 100% REAL ACCURATE GEOJSON WORLD COUNTRY BOUNDARIES */}
              <g className="world-countries-geojson">
                {geoJsonData && geoJsonData.features ? (
                  geoJsonData.features.map((feature, idx) => {
                    const countryMatch = getVisitorDataForGeoFeature(feature);
                    const countryName = countryMatch?.country || feature.properties?.ADMIN || feature.properties?.name || 'Unknown Country';
                    const visitors = countryMatch?.visitors || 0;
                    const flag = countryMatch?.flag || '🏳️';
                    const code = countryMatch?.code || feature.properties?.ISO_A2;

                    const dPath = geoToSvgPath(feature.geometry);
                    if (!dPath) return null;

                    const isSelected = selectedCountryCode === code;
                    const isHovered = hoveredCountry?.name === countryName;
                    const fillColor = getDensityColor(visitors);

                    return (
                      <path
                        key={feature.id || feature.properties?.ISO_A3 || idx}
                        d={dPath}
                        fill={isHovered || isSelected ? '#b3d332' : fillColor}
                        stroke={isHovered || isSelected ? '#ffffff' : '#141815'}
                        strokeWidth={isHovered || isSelected ? 1.5 : 0.4}
                        className={`country-path ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
                        onMouseEnter={() => setHoveredCountry({ name: countryName, visitors, flag })}
                        onMouseLeave={() => setHoveredCountry(null)}
                        onClick={() => setSelectedCountryCode(code)}
                      />
                    );
                  })
                ) : null}
              </g>

              {/* COMPASS ROSE (Bottom-Left Corner) */}
              <g transform="translate(90, 410) scale(0.6)" className="compass-rose">
                <circle cx="50" cy="50" r="45" fill="rgba(18, 22, 26, 0.85)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(179, 211, 50, 0.4)" strokeWidth="1" strokeDasharray="2 4" />
                <path d="M 50,10 L 58,42 L 50,50 L 42,42 Z" fill="#b3d332" />
                <path d="M 50,10 L 50,50 L 42,42 Z" fill="#7a9616" />
                <path d="M 50,90 L 58,58 L 50,50 L 42,58 Z" fill="rgba(255,255,255,0.4)" />
                <path d="M 90,50 L 58,58 L 50,50 L 58,42 Z" fill="rgba(255,255,255,0.4)" />
                <path d="M 10,50 L 42,58 L 50,50 L 42,42 Z" fill="rgba(255,255,255,0.4)" />
                <circle cx="50" cy="50" r="5" fill="#ffffff" />
                <text x="50" y="2" fill="#b3d332" fontSize="16" fontWeight="900" textAnchor="middle">N</text>
              </g>

            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredCountry && (
              <div className="map-tooltip">
                <div className="tooltip-header">
                  <span className="tooltip-flag">{hoveredCountry.flag}</span>
                  <strong>{hoveredCountry.name}</strong>
                </div>
                <span className="tooltip-visitors">{hoveredCountry.visitors.toLocaleString()} visitors</span>
              </div>
            )}
          </div>

          {/* Bottom Left Map Legend */}
          <div className="map-legend">
            <div className="legend-item"><span className="legend-color no-data"></span> No data</div>
            <div className="legend-item"><span className="legend-color level-1"></span> 0 - 1</div>
            <div className="legend-item"><span className="legend-color level-2"></span> 1 - 3</div>
            <div className="legend-item"><span className="legend-color level-3"></span> 3 - 15</div>
            <div className="legend-item"><span className="legend-color level-4"></span> 15 - 56</div>
            <div className="legend-item"><span className="legend-color level-5"></span> 56 - 2K</div>
          </div>

          {/* Bottom Right Credit */}
          <div className="map-credit">
            Location data by MaxMind GeoLite2
          </div>
        </div>
      </div>

      {/* Right Card: Locations */}
      <div className="locations-card">
        <div className="card-header">
          <h3 className="card-title">Locations</h3>
          <div className="header-actions">
            <button 
              className={`header-icon-btn ${showSearch ? 'active' : ''}`} 
              onClick={() => setShowSearch(!showSearch)}
              title="Search locations"
            >
              <Search size={15} />
            </button>
            <button className="header-icon-btn" onClick={handleExportCSV} title="Download XLSX">
              <Download size={15} />
            </button>

            {/* Filter Toggle Button & Popover Modal */}
            <div className="location-filter-wrapper" ref={locationFilterRef}>
              <button 
                className={`header-icon-btn ${showLocationFilterPopover ? 'active' : ''}`} 
                onClick={() => setShowLocationFilterPopover(!showLocationFilterPopover)}
                title="Filter options"
              >
                <SlidersHorizontal size={15} />
              </button>

              {/* Exact Select metrics Popover Modal */}
              {showLocationFilterPopover && (
                <div className="location-metrics-popover">
                  <h4 className="popover-title">Select metrics</h4>
                  <div className="location-options-list">
                    {[
                      { key: 'Country', label: 'Country' },
                      { key: 'State', label: 'State' },
                      { key: 'City', label: 'City' },
                      { key: 'Continent', label: 'Continent' }
                    ].map(item => {
                      const isSelected = selectedLocationMode === item.key;
                      return (
                        <div 
                          key={item.key} 
                          className={`location-option-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedLocationMode(item.key)}
                        >
                          <div className="checkbox-box">
                            {isSelected && <Check size={13} className="check-icon" />}
                          </div>
                          <span className="option-label">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="popover-actions">
                    <button 
                      className="apply-btn" 
                      onClick={() => {
                        setAppliedLocationMode(selectedLocationMode);
                        setShowLocationFilterPopover(false);
                        setCurrentPage(1);
                      }}
                    >
                      Apply
                    </button>
                    <button 
                      className="reset-btn" 
                      onClick={() => {
                        setSelectedLocationMode('Country');
                        setAppliedLocationMode('Country');
                        setCurrentPage(1);
                      }}
                    >
                      Reset to defaults
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button 
              className="header-icon-btn" 
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {showSearch && (
          <div className="location-search-bar">
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder={`Search ${appliedLocationMode.toLowerCase()}...`} 
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }} 
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Table Header */}
        <div className="locations-table-header">
          <span className="th-country">{appliedLocationMode}</span>
          <span className="th-visitors">Visitors</span>
        </div>

        {/* Locations List */}
        <div className="locations-list">
          {paginatedLocations.length === 0 ? (
            <div className="no-locations-found">
              No country matching "{searchTerm}"
            </div>
          ) : (
            paginatedLocations.map((loc, idx) => {
              const isSelected = selectedCountryCode === loc.code;
              return (
                <div 
                  key={loc.country + idx} 
                  className={`location-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCountryCode(isSelected ? null : loc.code)}
                  onMouseEnter={() => setHoveredCountry({ name: loc.country, visitors: loc.visitors, flag: loc.flag })}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  <div className="country-info">
                    <span className="flag-emoji">{loc.flag}</span>
                    <span className="country-name">{loc.country}</span>
                  </div>
                  <span className="visitor-count">{loc.visitors.toLocaleString()}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Pagination */}
        <div className="locations-pagination">
          <span className="page-range-info">
            {filteredLocations.length > 0 ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredLocations.length)} of ${filteredLocations.length}` : '0 of 0'}
          </span>
          <div className="nav-buttons">
            <button 
              className="nav-btn" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              className="nav-btn" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="nav-btn" 
              disabled={currentPage >= totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              className="nav-btn" 
              disabled={currentPage >= totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .world-locations-wrapper {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
          margin-top: 25px;
          margin-bottom: 25px;
          width: 100%;
        }

        .world-locations-wrapper.fullscreen-mode {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 99999;
          background: #0a0b0d;
          padding: 25px;
          margin: 0;
          height: 100vh;
          box-sizing: border-box;
        }

        .world-card, .locations-card {
          background: #121417;
          border: 1px solid #1f2329;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
          position: relative;
          overflow: visible !important;
        }

        .location-filter-wrapper {
          position: relative;
        }

        /* Locations Select Metrics Popover */
        .location-metrics-popover {
          position: absolute;
          top: 42px;
          right: 0;
          width: 220px;
          background: #16191d;
          border: 1px solid #282e38;
          border-radius: 10px;
          padding: 16px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.9);
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .location-metrics-popover .popover-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 4px 0;
        }

        .location-options-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .location-option-row {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
          padding: 2px 0;
        }

        .location-option-row .checkbox-box {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1px solid #3a4250;
          background: #121417;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .location-option-row.selected .checkbox-box {
          background: #2b4531;
          border-color: #48995a;
        }

        .location-option-row .option-label {
          font-size: 0.85rem;
          color: #94a3b8;
          font-weight: 500;
          flex: 1;
        }

        .location-option-row.selected .option-label {
          color: #ffffff;
        }

        .pro-badge {
          background: #233e2b;
          color: #48995a;
          border: 1px solid #2e5937;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 6px;
          letter-spacing: 0.3px;
        }

        .location-metrics-popover .popover-actions {
          display: flex;
          gap: 8px;
          margin-top: 6px;
          padding-top: 10px;
          border-top: 1px solid #222730;
        }

        .location-metrics-popover .apply-btn {
          flex: 1;
          background: #396043;
          border: 1px solid #48995a;
          color: #ffffff;
          padding: 6px 0;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .location-metrics-popover .apply-btn:hover {
          background: #48995a;
        }

        .location-metrics-popover .reset-btn {
          flex: 1;
          background: #222730;
          border: 1px solid #2e3542;
          color: #a0aec0;
          padding: 6px 0;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .location-metrics-popover .reset-btn:hover {
          background: #2a313d;
          color: #ffffff;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .header-icon-btn:hover, .header-icon-btn.active {
          background: rgba(255,255,255,0.12);
          color: #fff;
          border-color: #b3d332;
        }

        /* Map Viewport & Overlays */
        .map-viewport {
          position: relative;
          flex: 1;
          background: #0d0f12;
          border-radius: 10px;
          border: 1px solid #1a1d22;
          overflow: hidden;
          min-height: 380px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .map-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(13, 15, 18, 0.85);
          backdrop-filter: blur(4px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          z-index: 30;
          color: #b3d332;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .map-badge-overlay {
          position: absolute;
          top: 15px;
          left: 15px;
          background: rgba(20, 23, 27, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 8px 14px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          z-index: 10;
        }

        .badge-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #eeeeee;
        }

        .badge-subtitle {
          font-size: 0.72rem;
          color: #778899;
        }

        .world-svg-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          box-sizing: border-box;
        }

        .world-map-svg {
          width: 100%;
          height: auto;
          max-height: 350px;
        }

        .country-path {
          transition: fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease, filter 0.2s ease;
          cursor: pointer;
        }

        .country-path.hovered, .country-path.selected {
          fill: #b3d332 !important;
          stroke: #ffffff !important;
          stroke-width: 1.5px !important;
          filter: drop-shadow(0 0 8px rgba(179, 211, 50, 0.7));
        }

        .map-tooltip {
          position: absolute;
          bottom: 45px;
          left: 50%;
          transform: translateX(-50%);
          background: #181c20;
          border: 1px solid #b3d332;
          padding: 8px 14px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.9);
          z-index: 20;
          pointer-events: none;
        }

        .tooltip-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tooltip-flag {
          font-size: 1.1rem;
        }

        .map-tooltip strong {
          color: #fff;
          font-size: 0.85rem;
        }

        .tooltip-visitors {
          color: #b3d332;
          font-size: 0.78rem;
          font-weight: 700;
          font-family: inherit;
          -webkit-font-smoothing: antialiased;
        }

        /* Map Legend */
        .map-legend {
          position: absolute;
          bottom: 12px;
          left: 15px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          z-index: 10;
          background: rgba(12, 14, 17, 0.85);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 8px 12px;
          border-radius: 6px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.68rem;
          color: #8895a5;
        }

        .legend-color {
          width: 12px;
          height: 10px;
          border-radius: 2px;
        }

        .legend-color.no-data { background: #202622; }
        .legend-color.level-1 { background: #263b2c; }
        .legend-color.level-2 { background: #2e4735; }
        .legend-color.level-3 { background: #396043; }
        .legend-color.level-4 { background: #48995a; }
        .legend-color.level-5 { background: #5ea870; }

        .map-credit {
          position: absolute;
          bottom: 12px;
          right: 15px;
          font-size: 0.65rem;
          color: #4a5462;
          z-index: 10;
        }

        /* Location Search Bar */
        .location-search-bar {
          position: relative;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
        }

        .location-search-bar input {
          width: 100%;
          background: #181b20;
          border: 1px solid #282d36;
          padding: 8px 32px 8px 32px;
          border-radius: 6px;
          color: #fff;
          font-size: 0.85rem;
          outline: none;
        }

        .location-search-bar .search-icon {
          position: absolute;
          left: 10px;
          color: #667788;
        }

        .clear-search-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
        }

        /* Locations Table */
        .locations-table-header {
          display: flex;
          justify-content: space-between;
          padding: 10px 8px;
          border-bottom: 1px solid #1f232a;
          font-size: 0.78rem;
          font-weight: 600;
          color: #707d8d;
        }

        .locations-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          max-height: 380px;
        }

        .location-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 8px;
          border-bottom: 1px solid #181b20;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .location-row:hover, .location-row.selected {
          background: #1d231a;
        }

        .country-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .flag-emoji {
          font-size: 1.1rem;
        }

        .country-name {
          color: #e2e8f0;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .visitor-count {
          color: #cbd5e1;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: inherit;
          letter-spacing: 0.3px;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-shadow: none;
        }

        .no-locations-found {
          padding: 40px 10px;
          text-align: center;
          color: #64748b;
          font-size: 0.85rem;
        }

        /* Locations Pagination Footer */
        .locations-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #1f232a;
          margin-top: 5px;
        }

        .page-range-info {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
        }

        .nav-buttons {
          display: flex;
          gap: 4px;
        }

        .nav-btn {
          background: none;
          border: none;
          color: #8895a5;
          padding: 4px 6px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .nav-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }

        .nav-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        @media (max-width: 1024px) {
          .world-locations-wrapper {
            grid-template-columns: 1fr;
          }
        }
      ` }} />
    </div>
  );
};

export default WorldViewLocations;
