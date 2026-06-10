import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Download, Upload, ChevronLeft, ChevronRight, Trash2,
  AlertTriangle, Eye, X, CheckCircle2, XCircle, Clock, RefreshCw,
  Film, User, Mail, Phone, Globe, Calendar, CreditCard, Tag, FileText
} from 'lucide-react';
import Loader from '../components/Loader';
import * as XLSX from 'xlsx';

const API_URL = '/api/submissions';

const STATUS_OPTIONS = ['Under Review', 'Approved', 'Rejected', 'On Hold'];
const PAYMENT_FILTERS = ['', 'Pending', 'Completed', 'Failed'];

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewItem, setViewItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const importRef = useRef();
  const itemsPerPage = 10;

  useEffect(() => { fetchSubmissions(); }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotif = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  /* ─── Filter ─── */
  const filtered = submissions.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.contentName?.toLowerCase().includes(q) ||
      s.paymentId?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q);
    const matchPayment = !paymentFilter || s.paymentStatus === paymentFilter;
    const matchStatus = !statusFilter || s.reviewStatus === statusFilter;
    return matchSearch && matchPayment && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* ─── Select ─── */
  const handleSelectAll = e => {
    setSelectedIds(e.target.checked ? currentItems.map(s => s._id) : []);
  };
  const handleSelectOne = id => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  /* ─── Delete ─── */
  const confirmDelete = (type, id = null) => {
    setDeleteType(type);
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (deleteType === 'single') {
      await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
      setSubmissions(prev => prev.filter(s => s._id !== deletingId));
      setSelectedIds(prev => prev.filter(id => id !== deletingId));
      showNotif('Submission deleted successfully');
    } else {
      await fetch(`${API_URL}/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      setSubmissions(prev => prev.filter(s => !selectedIds.includes(s._id)));
      setSelectedIds([]);
      showNotif(`${selectedIds.length} submissions deleted`);
    }
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  /* ─── Update Review Status ─── */
  const handleReviewStatusChange = async (id, reviewStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmissions(prev => prev.map(s => s._id === id ? { ...s, reviewStatus } : s));
        if (viewItem?._id === id) setViewItem(prev => ({ ...prev, reviewStatus }));
        showNotif(`Status updated to ${reviewStatus}`);
      } else {
        showNotif(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      showNotif('Network error', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ─── Export to Excel ─── */
  const handleExport = () => {
    const dataToExport = filtered.map(s => ({
      'Submitted Date': s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : 'N/A',
      'Submitter Name': s.name || 'N/A',
      'Email': s.email || 'N/A',
      'Phone': s.phone || 'N/A',
      'Content Name': s.contentName || 'N/A',
      'Content Type': s.contentType || 'N/A',
      'Language': s.language || 'N/A',
      'Duration': s.duration || 'N/A',
      'Age Rating': s.ageRating || 'N/A',
      '18+ Content': s.content18Plus || 'N/A',
      'Status': s.status || 'N/A',
      'Genres': Array.isArray(s.genres) ? s.genres.join(', ') : (s.genres || 'N/A'),
      'Actors': s.actors || 'N/A',
      'Directors': s.directors || 'N/A',
      'Description': s.description || 'N/A',
      'Thumbnail Link': s.thumbnailLink || 'N/A',
      'Slider Link': s.sliderLink || 'N/A',
      'Poster Link': s.posterLink || 'N/A',
      'Trailer Link': s.trailerLink || 'N/A',
      'Video Link': s.videoLink || 'N/A',
      'Payment Method': s.paymentMethod || 'N/A',
      'Payment ID': s.paymentId || 'N/A',
      'Payment Status': s.paymentStatus || 'N/A',
      'Payment Description': s.paymentDescription || 'N/A',
      'Review Status': s.reviewStatus || 'Under Review',
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Submissions');
    XLSX.writeFile(wb, `submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotif(`Exported ${filtered.length} submissions to Excel`);
  };

  /* ─── Export as JSON ─── */
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif(`Exported ${filtered.length} submissions as JSON`);
  };

  /* ─── Import from JSON / Excel ─── */
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importRef.current.value = '';

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isJson = file.name.endsWith('.json');

    if (!isExcel && !isJson) {
      showNotif('Please select a .json, .xlsx, or .xls file', 'error');
      return;
    }

    try {
      let importData = [];

      if (isJson) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        importData = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const wb = XLSX.read(arrayBuffer);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        // Map Excel columns back to schema field names
        importData = rows.map(r => ({
          name: r['Submitter Name'] || r.name || '',
          email: r['Email'] || r.email || '',
          phone: r['Phone'] || r.phone || '',
          contentName: r['Content Name'] || r.contentName || '',
          contentType: r['Content Type'] || r.contentType || '',
          language: r['Language'] || r.language || '',
          duration: r['Duration'] || r.duration || '',
          ageRating: r['Age Rating'] || r.ageRating || '',
          content18Plus: r['18+ Content'] || r.content18Plus || '',
          status: r['Status'] || r.status || 'Active',
          genres: typeof r['Genres'] === 'string' ? r['Genres'].split(',').map(g => g.trim()) : (r.genres || []),
          actors: r['Actors'] || r.actors || '',
          directors: r['Directors'] || r.directors || '',
          description: r['Description'] || r.description || '',
          thumbnailLink: r['Thumbnail Link'] || r.thumbnailLink || '',
          sliderLink: r['Slider Link'] || r.sliderLink || '',
          posterLink: r['Poster Link'] || r.posterLink || '',
          trailerLink: r['Trailer Link'] || r.trailerLink || '',
          videoLink: r['Video Link'] || r.videoLink || '',
          paymentMethod: r['Payment Method'] || r.paymentMethod || 'PhonePe',
          paymentId: r['Payment ID'] || r.paymentId || '',
          paymentStatus: r['Payment Status'] || r.paymentStatus || 'Pending',
          paymentDescription: r['Payment Description'] || r.paymentDescription || '',
          reviewStatus: r['Review Status'] || r.reviewStatus || 'Under Review',
        }));
      }

      // Remove MongoDB-specific fields that shouldn't be re-inserted
      importData = importData.map(({ _id, __v, createdAt, updatedAt, ...rest }) => rest);

      const res = await fetch(`${API_URL}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions: importData })
      });
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message || 'Import successful');
        fetchSubmissions();
      } else {
        showNotif(data.message || 'Import failed', 'error');
      }
    } catch (err) {
      console.error('Import error:', err);
      showNotif('Import failed: ' + err.message, 'error');
    }
  };

  /* ─── Helpers ─── */
  const paymentBadge = status => {
    const map = {
      Completed: { bg: 'rgba(0,200,83,0.12)', color: '#00c853', icon: <CheckCircle2 size={12} /> },
      Failed:    { bg: 'rgba(255,77,77,0.12)', color: '#ff4d4d', icon: <XCircle size={12} /> },
      Pending:   { bg: 'rgba(255,193,7,0.12)', color: '#ffc107', icon: <Clock size={12} /> },
    };
    const s = map[status] || map.Pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        {s.icon}{status || 'Pending'}
      </span>
    );
  };

  const reviewBadge = status => {
    const map = {
      Approved:     { bg: 'rgba(179,211,50,0.12)', color: '#b3d332' },
      Rejected:     { bg: 'rgba(255,77,77,0.12)', color: '#ff4d4d' },
      'On Hold':    { bg: 'rgba(0,168,255,0.12)', color: '#00a8ff' },
      'Under Review': { bg: 'rgba(255,193,7,0.12)', color: '#ffc107' },
    };
    const s = map[status] || map['Under Review'];
    return (
      <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
        {status || 'Under Review'}
      </span>
    );
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div className="admin-submissions-pg">
      {/* Global Notification */}
      {notification && (
        <div className="sub-admin-notif">
          <div className="sub-admin-notif-inner">
            {notification.type === 'success'
              ? <CheckCircle2 size={36} color="#00c853" strokeWidth={2.5} />
              : <XCircle size={36} color="#ff4d4d" strokeWidth={2.5} />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="sub-admin-header">
        <div>
          <h1 className="sub-admin-title"><Film size={24} style={{ marginRight: 10 }} />Creator Submissions</h1>
          <p className="sub-admin-subtitle">Manage all content submission requests from creators</p>
        </div>
        <div className="sub-admin-stats">
          <div className="stat-pill">{submissions.length} <span>Total</span></div>
          <div className="stat-pill green">{submissions.filter(s => s.paymentStatus === 'Completed').length} <span>Paid</span></div>
          <div className="stat-pill yellow">{submissions.filter(s => s.paymentStatus === 'Pending').length} <span>Pending</span></div>
          <div className="stat-pill blue">{submissions.filter(s => s.reviewStatus === 'Approved').length} <span>Approved</span></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sub-filter-bar">
        <div className="sub-filter-left">
          <div className="sub-search-box">
            <Search size={16} className="sub-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, content, phone, payment ID..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setCurrentPage(1); }} className="sub-select">
            <option value="">All Payment Status</option>
            {PAYMENT_FILTERS.filter(Boolean).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="sub-select">
            <option value="">All Review Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="sub-refresh-btn" onClick={fetchSubmissions} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="sub-filter-right">
          {selectedIds.length > 0 && (
            <button className="sub-action-btn danger" onClick={() => confirmDelete('bulk')}>
              <Trash2 size={16} /> Delete ({selectedIds.length})
            </button>
          )}
          {/* Import hidden file input */}
          <input ref={importRef} type="file" accept=".json,.xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
          <button className="sub-action-btn import" onClick={() => importRef.current.click()}>
            <Upload size={16} /> Import
          </button>
          <button className="sub-action-btn export-json" onClick={handleExportJSON}>
            <Download size={16} /> JSON
          </button>
          <button className="sub-action-btn export" onClick={handleExport}>
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="sub-table-wrap">
        <table className="sub-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox"
                  onChange={handleSelectAll}
                  checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
                  style={{ width: 15, height: 15, cursor: 'pointer' }}
                />
              </th>
              <th>#</th>
              <th>Submitter</th>
              <th>Content Name</th>
              <th>Type</th>
              <th>Language</th>
              <th>Payment Status</th>
              <th>Review Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="sub-loader-cell"><Loader size="small" inline={true} /></td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan="10" className="sub-empty-cell">No submissions found.</td></tr>
            ) : currentItems.map((s, i) => (
              <tr key={s._id} className="sub-table-row">
                <td>
                  <input type="checkbox" checked={selectedIds.includes(s._id)} onChange={() => handleSelectOne(s._id)}
                    style={{ width: 15, height: 15, cursor: 'pointer' }} />
                </td>
                <td className="sub-num">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                <td>
                  <div className="sub-submitter">
                    <span className="sub-name">{s.name}</span>
                    <span className="sub-email">{s.email}</span>
                  </div>
                </td>
                <td className="sub-content-name">{s.contentName}</td>
                <td><span className="sub-type-tag">{s.contentType}</span></td>
                <td className="sub-lang">{s.language}</td>
                <td>{paymentBadge(s.paymentStatus)}</td>
                <td>
                  <select
                    value={s.reviewStatus || 'Under Review'}
                    onChange={e => handleReviewStatusChange(s._id, e.target.value)}
                    className="sub-status-select"
                    disabled={updatingId === s._id}
                    style={{ opacity: updatingId === s._id ? 0.5 : 1 }}
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="sub-date">{formatDate(s.createdAt)}</td>
                <td>
                  <div className="sub-actions">
                    <button className="sub-view-btn" onClick={() => setViewItem(s)} title="View Details"><Eye size={15} /></button>
                    <button className="sub-del-btn" onClick={() => confirmDelete('single', s._id)} title="Delete"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="sub-pagination">
          <button className="sub-pag-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft size={16} />
          </button>
          {[...Array(Math.min(totalPages, 8))].map((_, i) => (
            <button key={i} className={`sub-pag-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>
              {i + 1}
            </button>
          ))}
          {totalPages > 8 && <span style={{ color: '#555', padding: '0 5px' }}>...</span>}
          <button className="sub-pag-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight size={16} />
          </button>
          <span className="sub-pag-info">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}</span>
        </div>
      )}

      {/* View Details Modal */}
      {viewItem && (
        <div className="sub-modal-overlay" onClick={() => setViewItem(null)}>
          <div className="sub-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="sub-modal-header">
              <div>
                <h2>{viewItem.contentName}</h2>
                <p>{viewItem.contentType} • {viewItem.language} • {viewItem.duration}</p>
              </div>
              <button className="sub-modal-close" onClick={() => setViewItem(null)}><X size={22} /></button>
            </div>

            {/* Quick Status Bar */}
            <div className="sub-modal-status-bar">
              <div>{paymentBadge(viewItem.paymentStatus)}</div>
              <div>{reviewBadge(viewItem.reviewStatus || 'Under Review')}</div>
              <div className="sub-modal-date"><Calendar size={13} /> {formatDate(viewItem.createdAt)}</div>
              <div>
                <select
                  value={viewItem.reviewStatus || 'Under Review'}
                  onChange={e => handleReviewStatusChange(viewItem._id, e.target.value)}
                  className="sub-status-select"
                  disabled={updatingId === viewItem._id}
                >
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {/* Details Grid */}
            <div className="sub-modal-grid">
              {/* Submitter Info */}
              <div className="sub-modal-section">
                <h3><User size={15} /> Submitter Details</h3>
                <div className="sub-detail-row"><span>Name</span><strong>{viewItem.name}</strong></div>
                <div className="sub-detail-row"><span><Mail size={12} /> Email</span><strong>{viewItem.email}</strong></div>
                <div className="sub-detail-row"><span><Phone size={12} /> Phone</span><strong>{viewItem.phone}</strong></div>
              </div>

              {/* Content Info */}
              <div className="sub-modal-section">
                <h3><Film size={15} /> Content Info</h3>
                <div className="sub-detail-row"><span>Age Rating</span><strong>{viewItem.ageRating}</strong></div>
                <div className="sub-detail-row"><span>18+ Content</span><strong>{viewItem.content18Plus}</strong></div>
                <div className="sub-detail-row"><span>Status</span><strong>{viewItem.status}</strong></div>
              </div>

              {/* Genres */}
              <div className="sub-modal-section full">
                <h3><Tag size={15} /> Genres</h3>
                <div className="sub-genre-tags">
                  {(Array.isArray(viewItem.genres) ? viewItem.genres : [viewItem.genres]).map((g, i) => (
                    <span key={i} className="sub-genre-tag">{g}</span>
                  ))}
                </div>
              </div>

              {/* Cast */}
              <div className="sub-modal-section">
                <h3><User size={15} /> Actors</h3>
                <p className="sub-cast-text">{viewItem.actors}</p>
              </div>
              <div className="sub-modal-section">
                <h3><User size={15} /> Directors</h3>
                <p className="sub-cast-text">{viewItem.directors}</p>
              </div>

              {/* Description */}
              <div className="sub-modal-section full">
                <h3><FileText size={15} /> Description</h3>
                <p className="sub-desc-text">{viewItem.description}</p>
              </div>

              {/* Media Links */}
              <div className="sub-modal-section full">
                <h3><Globe size={15} /> Media Drive Links</h3>
                {[
                  { label: 'Thumbnail', val: viewItem.thumbnailLink },
                  { label: 'Slider Image', val: viewItem.sliderLink },
                  { label: 'Poster Image', val: viewItem.posterLink },
                  { label: 'Trailer', val: viewItem.trailerLink },
                  { label: 'Video File', val: viewItem.videoLink },
                ].map(({ label, val }) => (
                  <div key={label} className="sub-link-row">
                    <span className="sub-link-label">{label}</span>
                    <a href={val} target="_blank" rel="noopener noreferrer" className="sub-link-val">{val || 'N/A'}</a>
                  </div>
                ))}
              </div>

              {/* Payment Info */}
              <div className="sub-modal-section full">
                <h3><CreditCard size={15} /> Payment Info</h3>
                <div className="sub-detail-row"><span>Method</span><strong>{viewItem.paymentMethod}</strong></div>
                <div className="sub-detail-row"><span>Payment ID</span><strong style={{ fontFamily: 'monospace', color: '#b3d332' }}>{viewItem.paymentId || 'N/A'}</strong></div>
                <div className="sub-detail-row"><span>Status</span>{paymentBadge(viewItem.paymentStatus)}</div>
                <div className="sub-detail-row"><span>Description</span><strong>{viewItem.paymentDescription || 'N/A'}</strong></div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sub-modal-footer">
              <button className="sub-modal-del-btn" onClick={() => { setViewItem(null); confirmDelete('single', viewItem._id); }}>
                <Trash2 size={15} /> Delete Submission
              </button>
              <button className="sub-modal-close-btn" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {isDeleteModalOpen && (
        <div className="sub-modal-overlay">
          <div className="sub-del-modal">
            <AlertTriangle size={60} color="#ff4d4d" strokeWidth={1.5} />
            <h2>Are you sure?</h2>
            <p>
              {deleteType === 'bulk'
                ? `You want to delete ${selectedIds.length} submissions? This cannot be undone.`
                : 'You want to delete this submission? This cannot be undone.'}
            </p>
            <div className="sub-del-modal-btns">
              <button className="sub-cancel-btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="sub-confirm-btn" onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Base ─────────────────────────────────────────── */
        .admin-submissions-pg { padding: 24px 20px; background: #000; min-height: 100vh; color: #fff; box-sizing: border-box; }

        /* ── Notification ─────────────────────────────────── */
        .sub-admin-notif { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #0a0a0a; border: 1px solid #222; border-radius: 14px; padding: 20px 36px; z-index: 99999; box-shadow: 0 20px 50px rgba(0,0,0,0.9); animation: subNotifSlide 0.4s cubic-bezier(0.175,0.885,0.32,1.275); max-width: 90vw; }
        .sub-admin-notif-inner { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .sub-admin-notif-inner span { color: #fff; font-size: 0.95rem; font-weight: 800; text-align: center; white-space: normal; }
        @keyframes subNotifSlide { from { transform: translate(-50%,-120%); opacity:0; } to { transform: translate(-50%,0); opacity:1; } }

        /* ── Page Header ──────────────────────────────────── */
        .sub-admin-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .sub-admin-title { font-size: 1.45rem; font-weight: 800; color: #fff; margin: 0 0 4px; display: flex; align-items: center; }
        .sub-admin-subtitle { color: #555; font-size: 0.85rem; margin: 0; }
        .sub-admin-stats { display: flex; gap: 10px; flex-wrap: wrap; }
        .stat-pill { background: #111; border: 1px solid #222; border-radius: 10px; padding: 8px 14px; font-size: 1.2rem; font-weight: 800; color: #fff; display: flex; flex-direction: column; align-items: center; min-width: 60px; }
        .stat-pill span { font-size: 0.65rem; font-weight: 600; color: #555; margin-top: 2px; text-transform: uppercase; }
        .stat-pill.green { border-color: rgba(0,200,83,0.3); color: #00c853; }
        .stat-pill.yellow { border-color: rgba(255,193,7,0.3); color: #ffc107; }
        .stat-pill.blue { border-color: rgba(179,211,50,0.3); color: #b3d332; }

        /* ── Filter Bar ───────────────────────────────────── */
        .sub-filter-bar { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }
        .sub-filter-left { display: flex; gap: 10px; flex-wrap: wrap; width: 100%; }
        .sub-filter-right { display: flex; gap: 8px; flex-wrap: wrap; width: 100%; }
        .sub-search-box { position: relative; flex: 1; min-width: 200px; }
        .sub-search-box input { width: 100%; background: #111; border: 1px solid #222; color: #fff; padding: 10px 15px 10px 38px; border-radius: 30px; outline: none; font-size: 0.85rem; box-sizing: border-box; }
        .sub-search-box input:focus { border-color: #b3d332; }
        .sub-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #555; pointer-events: none; }
        .sub-select { background: #111; border: 1px solid #222; color: #fff; padding: 9px 12px; border-radius: 8px; outline: none; font-size: 0.85rem; cursor: pointer; flex: 1; min-width: 140px; }
        .sub-refresh-btn { background: #111; border: 1px solid #222; color: #888; padding: 9px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; transition: 0.2s; flex-shrink: 0; }
        .sub-refresh-btn:hover { border-color: #b3d332; color: #b3d332; }
        .sub-action-btn { border: none; padding: 9px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; white-space: nowrap; flex: 1; justify-content: center; }
        .sub-action-btn.danger { background: rgba(255,77,77,0.15); color: #ff4d4d; }
        .sub-action-btn.danger:hover { background: rgba(255,77,77,0.25); }
        .sub-action-btn.import { background: rgba(0,168,255,0.15); color: #00a8ff; }
        .sub-action-btn.import:hover { background: rgba(0,168,255,0.25); }
        .sub-action-btn.export { background: rgba(179,211,50,0.15); color: #b3d332; }
        .sub-action-btn.export:hover { background: rgba(179,211,50,0.25); }
        .sub-action-btn.export-json { background: rgba(255,193,7,0.12); color: #ffc107; }
        .sub-action-btn.export-json:hover { background: rgba(255,193,7,0.2); }

        /* ── Table ────────────────────────────────────────── */
        .sub-table-wrap { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }
        .sub-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .sub-table th { background: #111; padding: 12px 14px; font-size: 0.75rem; font-weight: 800; color: #555; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1a1a1a; text-align: left; white-space: nowrap; }
        .sub-table td { padding: 12px 14px; font-size: 0.83rem; color: #888; border-bottom: 1px solid #111; vertical-align: middle; }
        .sub-table-row:hover td { background: #0d0d0d; }
        .sub-table-row:last-child td { border-bottom: none; }
        .sub-num { color: #444; font-size: 0.78rem; }
        .sub-submitter { display: flex; flex-direction: column; gap: 2px; }
        .sub-name { color: #eee; font-weight: 700; font-size: 0.88rem; }
        .sub-email { color: #555; font-size: 0.75rem; }
        .sub-content-name { color: #b3d332; font-weight: 700; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sub-type-tag { background: rgba(0,168,255,0.1); color: #00a8ff; padding: 3px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
        .sub-lang { color: #aaa; font-size: 0.83rem; }
        .sub-date { color: #555; font-size: 0.78rem; white-space: nowrap; }
        .sub-status-select { background: #111; border: 1px solid #222; color: #fff; padding: 5px 8px; border-radius: 6px; font-size: 0.78rem; outline: none; cursor: pointer; max-width: 130px; width: 100%; }
        .sub-status-select:focus { border-color: #b3d332; }
        .sub-actions { display: flex; gap: 6px; }
        .sub-view-btn { background: rgba(179,211,50,0.1); border: 1px solid rgba(179,211,50,0.2); color: #b3d332; padding: 6px 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; transition: 0.2s; }
        .sub-view-btn:hover { background: rgba(179,211,50,0.2); }
        .sub-del-btn { background: rgba(255,77,77,0.1); border: 1px solid rgba(255,77,77,0.2); color: #ff4d4d; padding: 6px 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; transition: 0.2s; }
        .sub-del-btn:hover { background: rgba(255,77,77,0.2); }
        .sub-loader-cell { text-align: center; padding: 60px !important; }
        .sub-empty-cell { text-align: center; padding: 50px !important; color: #444; font-size: 0.9rem; }

        /* ── Pagination ───────────────────────────────────── */
        .sub-pagination { display: flex; align-items: center; gap: 4px; margin-top: 20px; flex-wrap: wrap; }
        .sub-pag-btn { background: #111; border: 1px solid #1a1a1a; color: #fff; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem; transition: 0.2s; }
        .sub-pag-btn:hover { border-color: #b3d332; color: #b3d332; }
        .sub-pag-btn.active { background: #b3d332; color: #000; border-color: #b3d332; }
        .sub-pag-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .sub-pag-info { color: #555; font-size: 0.8rem; margin-left: 8px; }

        /* ── Modals ─────────────────────────────────────────*/
        .sub-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9000; backdrop-filter: blur(6px); padding: 12px; }
        .sub-detail-modal { background: #0d0d0d; border: 1px solid #222; border-radius: 18px; width: 100%; max-width: 840px; max-height: 94vh; overflow-y: auto; animation: subModalIn 0.22s ease-out; display: flex; flex-direction: column; }
        @keyframes subModalIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .sub-modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 22px 16px; border-bottom: 1px solid #1a1a1a; gap: 12px; }
        .sub-modal-header h2 { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0 0 4px; word-break: break-word; }
        .sub-modal-header p { color: #555; font-size: 0.85rem; margin: 0; }
        .sub-modal-close { background: #1a1a1a; border: 1px solid #333; color: #888; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; flex-shrink: 0; }
        .sub-modal-close:hover { background: #222; color: #fff; }
        .sub-modal-status-bar { display: flex; align-items: center; gap: 12px; padding: 14px 22px; background: #080808; border-bottom: 1px solid #1a1a1a; flex-wrap: wrap; }
        .sub-modal-date { display: flex; align-items: center; gap: 4px; color: #555; font-size: 0.8rem; }

        /* Detail grid */
        .sub-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #1a1a1a; flex: 1; }
        .sub-modal-section { background: #0d0d0d; padding: 18px 20px; }
        .sub-modal-section.full { grid-column: 1/-1; }
        .sub-modal-section h3 { font-size: 0.72rem; font-weight: 800; color: #555; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px; display: flex; align-items: center; gap: 5px; }
        .sub-detail-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 9px; gap: 8px; }
        .sub-detail-row span { color: #555; font-size: 0.8rem; display: flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0; }
        .sub-detail-row strong { color: #eee; font-size: 0.85rem; text-align: right; word-break: break-word; }
        .sub-genre-tags { display: flex; flex-wrap: wrap; gap: 7px; }
        .sub-genre-tag { background: rgba(179,211,50,0.1); color: #b3d332; padding: 3px 11px; border-radius: 20px; font-size: 0.77rem; font-weight: 700; }
        .sub-cast-text { color: #aaa; font-size: 0.85rem; line-height: 1.6; margin: 0; word-break: break-word; }
        .sub-desc-text { color: #888; font-size: 0.85rem; line-height: 1.7; margin: 0; }
        .sub-link-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
        .sub-link-label { color: #555; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; width: 100px; flex-shrink: 0; padding-top: 2px; }
        .sub-link-val { color: #00a8ff; font-size: 0.8rem; text-decoration: none; word-break: break-all; }
        .sub-link-val:hover { text-decoration: underline; }

        /* Modal Footer */
        .sub-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 22px; border-top: 1px solid #1a1a1a; flex-wrap: wrap; }
        .sub-modal-del-btn { background: rgba(255,77,77,0.12); border: 1px solid rgba(255,77,77,0.2); color: #ff4d4d; padding: 10px 18px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.88rem; display: flex; align-items: center; gap: 7px; transition: 0.2s; }
        .sub-modal-del-btn:hover { background: rgba(255,77,77,0.2); }
        .sub-modal-close-btn { background: #b3d332; color: #000; border: none; padding: 10px 22px; border-radius: 10px; cursor: pointer; font-weight: 800; font-size: 0.88rem; transition: 0.2s; }
        .sub-modal-close-btn:hover { background: #c3e342; }

        /* Delete Confirm Modal */
        .sub-del-modal { background: #111; border: 1px solid #222; border-radius: 18px; padding: 36px 28px 26px; text-align: center; max-width: 400px; width: 100%; animation: subModalIn 0.2s ease-out; }
        .sub-del-modal h2 { color: #fff; font-size: 1.5rem; margin: 18px 0 8px; }
        .sub-del-modal p { color: #888; font-size: 0.9rem; margin-bottom: 26px; line-height: 1.5; }
        .sub-del-modal-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .sub-cancel-btn { background: #222; color: #fff; border: none; padding: 11px 26px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.92rem; transition: 0.2s; }
        .sub-cancel-btn:hover { background: #333; }
        .sub-confirm-btn { background: #ff4d4d; color: #fff; border: none; padding: 11px 26px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.92rem; transition: 0.2s; }
        .sub-confirm-btn:hover { background: #ff3333; }

        /* ══ RESPONSIVE BREAKPOINTS ══════════════════════════ */

        /* Tablet (≥768px): two-column filter row */
        @media (min-width: 768px) {
          .admin-submissions-pg { padding: 28px 26px; }
          .sub-filter-bar { flex-direction: row; align-items: flex-start; }
          .sub-filter-left { flex: 1; }
          .sub-filter-right { flex-wrap: nowrap; width: auto; }
          .sub-action-btn { flex: 0 0 auto; }
          .sub-search-box { max-width: 380px; }
          .sub-modal-grid { grid-template-columns: 1fr 1fr; }
        }

        /* Desktop (≥1024px): larger padding, wider search */
        @media (min-width: 1024px) {
          .admin-submissions-pg { padding: 30px; }
          .sub-search-box { max-width: 460px; }
          .sub-admin-title { font-size: 1.6rem; }
        }

        /* Small Mobile (≤480px): tighten everything */
        @media (max-width: 480px) {
          .admin-submissions-pg { padding: 16px 12px; }
          .sub-admin-header { flex-direction: column; gap: 14px; }
          .sub-admin-title { font-size: 1.15rem; }
          .sub-admin-stats { gap: 8px; }
          .stat-pill { padding: 7px 10px; font-size: 1rem; min-width: 52px; }
          .sub-action-btn { padding: 8px 10px; font-size: 0.78rem; gap: 4px; }
          .sub-select { font-size: 0.8rem; padding: 8px 10px; }
          .sub-search-box input { font-size: 0.8rem; padding: 9px 12px 9px 35px; }
          .sub-modal-grid { grid-template-columns: 1fr; }
          .sub-modal-section.full { grid-column: 1; }
          .sub-modal-header { padding: 16px 16px 12px; }
          .sub-modal-header h2 { font-size: 1.05rem; }
          .sub-modal-status-bar { padding: 10px 16px; gap: 8px; }
          .sub-modal-section { padding: 14px 16px; }
          .sub-modal-footer { padding: 14px 16px; justify-content: stretch; }
          .sub-modal-del-btn, .sub-modal-close-btn { flex: 1; justify-content: center; }
          .sub-detail-modal { border-radius: 14px; max-height: 97vh; }
          .sub-del-modal { padding: 28px 18px 22px; }
          .sub-del-modal h2 { font-size: 1.3rem; }
          .sub-del-modal-btns { flex-direction: column; }
          .sub-cancel-btn, .sub-confirm-btn { width: 100%; padding: 13px; }
          .sub-pagination { gap: 3px; }
          .sub-pag-btn { width: 28px; height: 28px; font-size: 0.75rem; }
          .sub-pag-info { font-size: 0.72rem; }
          .sub-admin-notif { padding: 16px 24px; }
          .sub-link-row { flex-direction: column; gap: 4px; }
          .sub-link-label { width: auto; }
        }

        /* Extra small (≤360px) */
        @media (max-width: 360px) {
          .admin-submissions-pg { padding: 12px 10px; }
          .sub-admin-title { font-size: 1rem; }
          .sub-action-btn span { display: none; }
          .sub-action-btn { padding: 9px; justify-content: center; }
        }
      ` }} />

    </div>
  );
};

export default AdminSubmissions;
