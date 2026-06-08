import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, Download, Upload, FileText, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

const HEADERS_BY_TYPE = {
  movies: ['title', 'language', 'genres', 'actors', 'directors', 'imdbId', 'description', 'sortInfo', 'upcoming', 'seriesAccess', 'imdbRating', 'contentRating', 'releaseDate', 'duration', 'status', 'poster', 'thumbnail', 'trailerUrl', 'videoType', 'videoQuality', 'videoFile', 'videoFile480', 'videoFile720', 'videoFile1080', 'downloadable', 'downloadUrl', 'seoTitle', 'metaDescription', 'keywords'],
  'short-films': ['title', 'language', 'genres', 'actors', 'directors', 'imdbId', 'description', 'sortInfo', 'upcoming', 'seriesAccess', 'imdbRating', 'contentRating', 'releaseDate', 'duration', 'status', 'poster', 'thumbnail', 'trailerUrl', 'videoType', 'videoQuality', 'videoFile', 'videoFile480', 'videoFile720', 'videoFile1080', 'downloadable', 'downloadUrl', 'seoTitle', 'metaDescription', 'keywords'],
  shows: ['title', 'language', 'genres', 'actors', 'directors', 'imdbId', 'description', 'sortInfo', 'upcoming', 'seriesAccess', 'imdbRating', 'contentRating', 'releaseYear', 'rating', 'status', 'poster', 'thumbnail', 'videoQuality', 'seoTitle', 'metaDescription', 'keywords'],
  'short-web-series': ['title', 'language', 'genres', 'actors', 'directors', 'imdbId', 'description', 'sortInfo', 'upcoming', 'seriesAccess', 'imdbRating', 'contentRating', 'releaseYear', 'rating', 'status', 'poster', 'thumbnail', 'videoQuality', 'seoTitle', 'metaDescription', 'keywords'],
  'new-releases': ['title', 'language', 'genres', 'actors', 'directors', 'imdbId', 'description', 'sortInfo', 'upcoming', 'access', 'imdbRating', 'contentRating', 'releaseYear', 'duration', 'poster', 'thumbnail', 'banner', 'trailerUrl', 'videoType', 'videoQuality', 'videoFile', 'videoFile480', 'videoFile720', 'videoFile1080', 'status', 'seoTitle', 'metaDescription', 'keywords'],
  'sports-videos': ['title', 'category', 'description', 'access', 'date', 'duration', 'status', 'poster', 'landscapePoster', 'videoType', 'videoQuality', 'videoFile', 'videoFile480', 'videoFile720', 'videoFile1080', 'downloadable', 'downloadUrl', 'subtitlesActive', 'seoTitle', 'metaDescription', 'keywords'],
  'tv-channels': ['name', 'category', 'description', 'tvAccess', 'status', 'streamType', 'server1Url', 'server2Url', 'server3Url', 'embedCode', 'logo', 'seoTitle', 'metaDescription', 'keywords'],
  seasons: ['title', 'showTitle', 'status', 'poster', 'thumbnail'],
  episodes: ['title', 'showTitle', 'seasonTitle', 'imdbId', 'description', 'access', 'imdbRating', 'releaseDate', 'duration', 'status', 'poster', 'videoType', 'videoQuality', 'videoFile', 'videoFile480', 'videoFile720', 'videoFile1080', 'downloadable', 'downloadUrl', 'subtitlesActive', 'seoTitle', 'metaDescription', 'keywords'],
  actors: ['name', 'bio', 'placeOfBirth', 'birthday', 'image', 'status'],
  directors: ['name', 'bio', 'placeOfBirth', 'birthday', 'image', 'status'],
  languages: ['name', 'status'],
  genres: ['name', 'status'],
  coupons: ['couponCode', 'couponPercentage', 'usersAllow', 'couponUsed', 'expiryDate', 'status', 'showOnFrontend'],
  sliders: ['title', 'image', 'contentType', 'videoUrl', 'section', 'postType', 'contentId', 'displayOn', 'imdbRating', 'releaseYear', 'duration', 'videoQuality', 'ccActive', 'status', 'link'],
  experiences: ['title', 'description', 'icon', 'order', 'status'],
  assets: ['title', 'url', 'size', 'dimension', 'date'],
  'home-sections': ['title', 'sectionType', 'layout', 'limit', 'status', 'order'],
  'subscription-plans': ['planName', 'duration', 'price', 'deviceLimit', 'ads', 'streamingQuality', 'status', 'getStarted'],
  pages: ['title', 'slug', 'content', 'status'],
  'sub-admins': ['name', 'email', 'phone', 'status', 'role', 'password']
};

const LABELS = {
  movies: 'Movies',
  'short-films': 'Short Films',
  shows: 'TV Shows',
  'short-web-series': 'Short Web Series',
  'new-releases': 'New Releases',
  'sports-videos': 'Sports Videos',
  'tv-channels': 'TV Channels',
  seasons: 'Seasons',
  episodes: 'Episodes',
  actors: 'Actors',
  directors: 'Directors',
  languages: 'Languages',
  genres: 'Genres',
  coupons: 'Coupons',
  sliders: 'Sliders',
  experiences: 'Experiences',
  assets: 'Images',
  'home-sections': 'Home Sections',
  'subscription-plans': 'Subscription Plans',
  pages: 'Pages',
  'sub-admins': 'Sub Admins'
};

const API_ENDPOINTS = {
  movies: { import: '/api/movies/import', export: '/api/export/movies', defaultContentType: 'Movie', arrayKey: 'movies' },
  'short-films': { import: '/api/movies/import', export: '/api/export/short-films', defaultContentType: 'Short Film', arrayKey: 'movies' },
  shows: { import: '/api/shows/import', export: '/api/export/shows', defaultContentType: 'TV Show', arrayKey: 'shows' },
  'short-web-series': { import: '/api/shows/import', export: '/api/export/short-web-series', defaultContentType: 'Short Web Series', arrayKey: 'shows' },
  'new-releases': { import: '/api/new-releases/import', export: '/api/export/new-releases', arrayKey: 'releases' },
  'sports-videos': { import: '/api/sports-videos/import', export: '/api/export/sports-videos', arrayKey: 'videos' },
  'tv-channels': { import: '/api/tv-channels/import', export: '/api/export/tv-channels', arrayKey: 'channels' },
  seasons: { import: '/api/seasons/import', export: '/api/export/seasons', arrayKey: 'seasons' },
  episodes: { import: '/api/episodes/import', export: '/api/export/episodes', arrayKey: 'episodes' },
  actors: { import: '/api/actors/import', export: '/api/export/actors', arrayKey: 'actors' },
  directors: { import: '/api/directors/import', export: '/api/export/directors', arrayKey: 'directors' },
  languages: { import: '/api/languages/import', export: '/api/export/languages', arrayKey: 'languages' },
  genres: { import: '/api/genres/import', export: '/api/export/genres', arrayKey: 'genres' },
  coupons: { import: '/api/coupons/import', export: '/api/export/coupons', arrayKey: 'coupons' },
  sliders: { import: '/api/sliders/import', export: '/api/export/sliders', arrayKey: 'sliders' },
  experiences: { import: '/api/experiences/import', export: '/api/export/experiences', arrayKey: 'experiences' },
  assets: { import: '/api/assets/import', export: '/api/export/assets', arrayKey: 'assets' },
  'home-sections': { import: '/api/home-sections/import', export: '/api/export/home-sections', arrayKey: 'home-sections' },
  'subscription-plans': { import: '/api/subscription-plans/import', export: '/api/export/subscription-plans', arrayKey: 'subscription-plans' },
  pages: { import: '/api/pages/import', export: '/api/export/pages', arrayKey: 'pages' },
  'sub-admins': { import: '/api/sub-admins/import', export: '/api/export/sub-admins', arrayKey: 'sub-admins' }
};

const ImportExportModal = ({ isOpen, onClose, type, onImportSuccess }) => {
  if (!isOpen) return null;

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('export'); // 'export' or 'import'
  const [exportFormat, setExportFormat] = useState('xlsx'); // 'xlsx' or 'csv'
  const [isExporting, setIsExporting] = useState(false);
  
  // Import states
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const label = LABELS[type] || 'Content';
  const headers = HEADERS_BY_TYPE[type] || [];
  const endpointInfo = API_ENDPOINTS[type];

  // 1. Dynamic Template Download Generator
  const handleDownloadTemplate = () => {
    try {
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, `${type}_import_template.xlsx`);
    } catch (err) {
      console.error('Error generating template:', err);
      alert('Failed to generate template sheet.');
    }
  };

  // 2. Fetch data from populated endpoint and trigger XLSX download
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpointInfo.export, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Export endpoint returned error status.');
      }
      const data = await response.json();
      
      // Selectively order columns to match template layout
      const orderedData = data.map(item => {
        const row = {};
        headers.forEach(h => {
          row[h] = item[h] !== undefined ? item[h] : '';
        });
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(orderedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, label);

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${type}_export_${dateStr}.${exportFormat}`;

      if (exportFormat === 'csv') {
        XLSX.writeFile(wb, filename, { bookType: 'csv' });
      } else {
        XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
      }
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Read spreadsheet local file and parse into preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const binaryStr = evt.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of objects
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (rawJson.length === 0) {
          setParseError('The uploaded file contains no data rows.');
          setParsedData([]);
          return;
        }

        // Validate headers roughly
        const fileHeaders = Object.keys(rawJson[0]).map(h => h.trim());
        const expectedRequired = headers.slice(0, 2); // Check at least first 2 core fields e.g. title/language
        const hasCoreFields = expectedRequired.every(req => 
          fileHeaders.some(fh => fh.toLowerCase() === req.toLowerCase())
        );

        if (!hasCoreFields) {
          setParseError(`Headers might be incorrect. Template expects at least: ${expectedRequired.join(', ')}`);
        }

        // Clean up parsed keys to match standard camelCase headers
        const cleanedData = rawJson.map(row => {
          const cleanRow = {};
          Object.keys(row).forEach(k => {
            const trimmedKey = k.trim();
            // Match lowercase key to actual header
            const matchedHeader = headers.find(h => h.toLowerCase() === trimmedKey.toLowerCase());
            if (matchedHeader) {
              cleanRow[matchedHeader] = row[k];
            } else {
              cleanRow[trimmedKey] = row[k];
            }
          });
          return cleanRow;
        });

        setParsedData(cleanedData);
      } catch (err) {
        console.error('Error parsing sheet:', err);
        setParseError('Unable to read this file. Ensure it is a valid Excel or CSV sheet.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // 4. Send parsed list to server import endpoint
  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        [endpointInfo.arrayKey]: parsedData
      };
      if (endpointInfo.defaultContentType) {
        payload.defaultContentType = endpointInfo.defaultContentType;
      }

      const response = await fetch(endpointInfo.import, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Import failed at backend.');
      }

      setImportResult(result);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      console.error('Error importing:', err);
      setImportResult({
        error: err.message || 'Server error during import'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImportTab = () => {
    setSelectedFile(null);
    setParsedData([]);
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="import-export-overlay" onClick={onClose}>
      <div className="import-export-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{label} • Import & Export</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="tabs-header">
          <button 
            className={`tab-link ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <Download size={16} />
            <span>Export Data</span>
          </button>
          <button 
            className={`tab-link ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <Upload size={16} />
            <span>Import Data</span>
          </button>
        </div>

        <div className="modal-body-scroll">
          {activeTab === 'export' && (
            <div className="tab-pane-content">
              <div className="instruction-box">
                <h3>Export Database to Sheet</h3>
                <p>Download the active listing of <strong>{label}</strong> to a spreadsheet file. You can easily modify descriptions, titles, metadata, or media file fields in Excel and re-upload the spreadsheet under the "Import" tab to bulk update or add content.</p>
              </div>

              <div className="format-selection">
                <span className="selection-label">Select File Format:</span>
                <div className="radio-group">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="format" 
                      value="xlsx" 
                      checked={exportFormat === 'xlsx'}
                      onChange={() => setExportFormat('xlsx')} 
                    />
                    <span>Excel Sheet (.xlsx)</span>
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="format" 
                      value="csv" 
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')} 
                    />
                    <span>Standard CSV (.csv)</span>
                  </label>
                </div>
              </div>

              <div className="export-action-container">
                <button 
                  className="execute-btn export-btn" 
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      <span>Generating Spreadsheet...</span>
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      <span>Export All {label}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="tab-pane-content">
              {!selectedFile ? (
                <>
                  <div className="instruction-box">
                    <h3>Import Data from Spreadsheet</h3>
                    <p>Add new records or bulk-update existing entries by matching titles and languages. Download the template file below to get a spreadsheet prepopulated with correct headers.</p>
                    <button className="template-btn" onClick={handleDownloadTemplate}>
                      <Download size={14} />
                      <span>Download Empty Excel Template</span>
                    </button>
                  </div>

                  <div 
                    className="drop-zone"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <Upload size={48} className="upload-icon-pulse" />
                    <h4>Select Excel or CSV File</h4>
                    <p>Drag and drop a file here, or click to browse</p>
                    <span className="file-hint">Supported files: .xlsx, .xls, .csv</span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".xlsx,.xls,.csv" 
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>
                </>
              ) : (
                <div className="preview-container">
                  <div className="file-info-header">
                    <div className="file-details">
                      <FileText size={20} color="#b3d332" />
                      <div>
                        <strong>{selectedFile.name}</strong>
                        <span>{(selectedFile.size / 1024).toFixed(1)} KB • {parsedData.length} records parsed</span>
                      </div>
                    </div>
                    {!isImporting && !importResult && (
                      <button className="btn-secondary" onClick={resetImportTab}>
                        Change File
                      </button>
                    )}
                  </div>

                  {parseError && (
                    <div className="validation-alert error">
                      <AlertTriangle size={20} />
                      <span>{parseError}</span>
                    </div>
                  )}

                  {!importResult && parsedData.length > 0 && (
                    <>
                      <h4 className="preview-title">Data Preview (First 5 Rows)</h4>
                      <div className="preview-table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              {headers.slice(0, 5).map(h => (
                                <th key={h}>{h}</th>
                              ))}
                              {headers.length > 5 && <th>...</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {parsedData.slice(0, 5).map((row, idx) => (
                              <tr key={idx}>
                                {headers.slice(0, 5).map(h => (
                                  <td key={h}>{row[h] !== undefined ? String(row[h]) : ''}</td>
                                ))}
                                {headers.length > 5 && <td className="text-muted">...</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="import-action-bar">
                        <button 
                          className="execute-btn import-btn"
                          onClick={handleImport}
                          disabled={isImporting}
                        >
                          {isImporting ? (
                            <>
                              <Loader2 size={18} className="spin" />
                              <span>Uploading & Processing Import...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={18} />
                              <span>Confirm and Start Import ({parsedData.length} items)</span>
                            </>
                          )}
                        </button>
                        <button 
                          className="cancel-btn-sub" 
                          onClick={resetImportTab}
                          disabled={isImporting}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}

                  {importResult && (
                    <div className="result-container">
                      {importResult.error ? (
                        <div className="result-card error">
                          <AlertTriangle size={36} />
                          <h3>Import Failed</h3>
                          <p>{importResult.error}</p>
                          <button className="btn-primary" onClick={resetImportTab}>Try Again</button>
                        </div>
                      ) : (
                        <div className="result-card success">
                          <CheckCircle2 size={48} color="#b3d332" />
                          <h3>Import Completed Successfully</h3>
                          <div className="stats-grid">
                            <div className="stat-item">
                              <span className="stat-num">{importResult.importedCount || 0}</span>
                              <span className="stat-lbl">Imported New</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-num">{importResult.updatedCount || 0}</span>
                              <span className="stat-lbl">Updated Existing</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-num error-text">{importResult.errorCount || 0}</span>
                              <span className="stat-lbl">Failed Rows</span>
                            </div>
                          </div>

                          {importResult.errors && importResult.errors.length > 0 && (
                            <div className="error-log">
                              <h4>Error Logs ({importResult.errors.length}):</h4>
                              <div className="log-entries">
                                {importResult.errors.map((err, i) => (
                                  <div key={i} className="log-entry">⚠️ {err}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="result-actions">
                            <button className="btn-primary" onClick={onClose}>
                              Done & Close
                            </button>
                            <button className="btn-secondary" onClick={resetImportTab}>
                              Import Another File
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .import-export-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 2500;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: modalFadeIn 0.3s ease-out;
        }

        .import-export-modal-content {
          background: #111;
          border: 1px solid #222;
          width: 90%;
          max-width: 650px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          max-height: 85vh;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          border-bottom: 1px solid #222;
        }

        .modal-header h2 {
          color: #fff;
          font-size: 1.4rem;
          font-weight: 700;
          margin: 0;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #ff4d4d;
        }

        .tabs-header {
          display: flex;
          border-bottom: 1px solid #222;
          background: #0b0b0b;
        }

        .tab-link {
          flex: 1;
          padding: 15px;
          background: none;
          border: none;
          color: #888;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
        }

        .tab-link:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.02);
        }

        .tab-link.active {
          color: #b3d332;
          border-bottom-color: #b3d332;
          background: rgba(179, 211, 50, 0.05);
        }

        .modal-body-scroll {
          padding: 25px;
          overflow-y: auto;
          flex: 1;
        }

        .instruction-box {
          background: #181818;
          border: 1px solid #222;
          padding: 18px;
          border-radius: 10px;
          margin-bottom: 25px;
        }

        .instruction-box h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #fff;
          font-size: 1.1rem;
        }

        .instruction-box p {
          color: #aaa;
          font-size: 0.92rem;
          line-height: 1.5;
          margin-bottom: 15px;
        }

        .template-btn {
          background: rgba(179, 211, 50, 0.1);
          border: 1px solid rgba(179, 211, 50, 0.3);
          color: #b3d332;
          padding: 8px 16px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-btn:hover {
          background: #b3d332;
          color: #000;
        }

        .format-selection {
          margin-bottom: 30px;
        }

        .selection-label {
          display: block;
          color: #fff;
          font-weight: 600;
          margin-bottom: 12px;
          font-size: 0.95rem;
        }

        .radio-group {
          display: flex;
          gap: 20px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ccc;
          cursor: pointer;
          font-size: 0.95rem;
        }

        .radio-label input {
          width: 18px;
          height: 18px;
          accent-color: #b3d332;
          cursor: pointer;
        }

        .export-action-container {
          display: flex;
          justify-content: center;
        }

        .execute-btn {
          border: none;
          color: #fff;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .execute-btn:hover {
          transform: translateY(-2px);
        }

        .execute-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .export-btn {
          background: linear-gradient(135deg, #b3d332 0%, #00a86b 100%);
          color: #000;
        }

        .import-btn {
          background: #0088ff;
        }

        .drop-zone {
          border: 2px dashed #333;
          background: #0c0c0c;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .drop-zone:hover {
          border-color: #b3d332;
          background: rgba(179, 211, 50, 0.02);
        }

        .upload-icon-pulse {
          color: #555;
          margin-bottom: 15px;
          transition: color 0.2s;
        }

        .drop-zone:hover .upload-icon-pulse {
          color: #b3d332;
        }

        .drop-zone h4 {
          color: #fff;
          margin-bottom: 8px;
          font-size: 1.1rem;
        }

        .drop-zone p {
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 12px;
        }

        .file-hint {
          font-size: 0.8rem;
          color: #555;
          display: block;
        }

        .preview-container {
          animation: slideUp 0.3s ease-out;
        }

        .file-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #181818;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #222;
        }

        .file-details {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-details div {
          display: flex;
          flex-direction: column;
        }

        .file-details strong {
          color: #fff;
          font-size: 0.95rem;
        }

        .file-details span {
          color: #888;
          font-size: 0.8rem;
        }

        .btn-secondary {
          background: #2a2a2a;
          border: 1px solid #333;
          color: #ccc;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #3a3a3a;
          color: #fff;
        }

        .validation-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-bottom: 20px;
        }

        .validation-alert.error {
          background: rgba(255, 77, 77, 0.1);
          border: 1px solid rgba(255, 77, 77, 0.2);
          color: #ff4d4d;
        }

        .preview-title {
          color: #fff;
          margin-bottom: 10px;
          font-size: 0.95rem;
        }

        .preview-table-wrapper {
          overflow-x: auto;
          border: 1px solid #222;
          border-radius: 8px;
          margin-bottom: 25px;
          max-height: 200px;
        }

        .preview-table-wrapper table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          text-align: left;
        }

        .preview-table-wrapper th {
          background: #181818;
          color: #aaa;
          padding: 10px 12px;
          font-weight: 600;
          border-bottom: 1px solid #222;
          white-space: nowrap;
        }

        .preview-table-wrapper td {
          padding: 10px 12px;
          color: #ccc;
          border-bottom: 1px solid #1a1a1a;
          white-space: nowrap;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .preview-table-wrapper tr:last-child td {
          border-bottom: none;
        }

        .import-action-bar {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .cancel-btn-sub {
          background: transparent;
          border: none;
          color: #888;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-btn-sub:hover {
          color: #fff;
        }

        .result-container {
          animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .result-card {
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid #222;
          background: #0f0f0f;
        }

        .result-card h3 {
          color: #fff;
          font-size: 1.3rem;
          margin-top: 15px;
          margin-bottom: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }

        .stat-item {
          background: #181818;
          border: 1px solid #222;
          padding: 15px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-num {
          font-size: 1.8rem;
          font-weight: 800;
          color: #b3d332;
        }

        .stat-lbl {
          font-size: 0.8rem;
          color: #888;
          margin-top: 5px;
        }

        .error-text {
          color: #ff4d4d !important;
        }

        .error-log {
          text-align: left;
          background: rgba(255, 77, 77, 0.03);
          border: 1px solid rgba(255, 77, 77, 0.1);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
          max-height: 150px;
          overflow-y: auto;
        }

        .error-log h4 {
          color: #ff4d4d;
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 0.9rem;
        }

        .log-entries {
          font-family: monospace;
          font-size: 0.8rem;
          color: #ccc;
          line-height: 1.6;
        }

        .log-entry {
          margin-bottom: 5px;
        }

        .result-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
        }

        .btn-primary {
          background: #b3d332;
          color: #000;
          border: none;
          padding: 10px 22px;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
};

export default ImportExportModal;
