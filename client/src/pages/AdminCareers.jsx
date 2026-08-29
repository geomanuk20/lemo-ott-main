import React, { useState, useEffect } from 'react';
import {
  Briefcase, Search, Plus, Edit2, Trash2, Eye, X, CheckCircle2,
  XCircle, MapPin, Clock, Award, Building, Mail, Download, RefreshCw, AlertTriangle
} from 'lucide-react';
import Loader from '../components/Loader';
import * as XLSX from 'xlsx';

const API_URL = '/api/careers';

const DEPARTMENTS = ['All', 'Editorial', 'Marketing', 'Operations', 'Engineering', 'Production', 'Support', 'Finance'];
const JOB_TYPES = ['Full Time', 'Part Time', 'Contract', 'Internship'];

const AdminCareers = () => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [notification, setNotification] = useState(null);

  // Modals
  const [viewItem, setViewItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const [deletingId, setDeletingId] = useState(null);

  // Form State
  const initialFormState = {
    _id: null,
    title: '',
    department: 'Editorial',
    location: 'Kerala',
    experience: '1-3 years',
    qualification: 'Graduate',
    jobType: 'Full Time',
    description: '',
    contactEmail: 'careers@lemoott.com',
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setCareers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching careers:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotif = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter
  const filtered = careers.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      c.title?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.qualification?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchDept = deptFilter === 'All' || c.department === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Select
  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? currentItems.map(c => c._id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotif('Job title is required', 'error');
      return;
    }
    setFormSubmitting(true);
    try {
      const url = formData._id ? `${API_URL}/${formData._id}` : API_URL;
      const method = formData._id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (res.ok) {
        showNotif(formData._id ? 'Job opening updated' : 'New job opening created');
        setIsEditModalOpen(false);
        setFormData(initialFormState);
        fetchCareers();
      } else {
        showNotif(result.message || 'Operation failed', 'error');
      }
    } catch (err) {
      showNotif('Network error', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Status Toggle
  const handleToggleStatus = async (career) => {
    const newStatus = career.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`${API_URL}/${career._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setCareers(prev => prev.map(c => c._id === career._id ? { ...c, status: newStatus } : c));
        showNotif(`Status changed to ${newStatus}`);
      }
    } catch (err) {
      showNotif('Failed to update status', 'error');
    }
  };

  // Delete
  const confirmDelete = (type, id = null) => {
    setDeleteType(type);
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    try {
      if (deleteType === 'single') {
        await fetch(`${API_URL}/${deletingId}`, { method: 'DELETE' });
        setCareers(prev => prev.filter(c => c._id !== deletingId));
        setSelectedIds(prev => prev.filter(id => id !== deletingId));
        showNotif('Job opening deleted');
      } else {
        await fetch(`${API_URL}/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds })
        });
        setCareers(prev => prev.filter(c => !selectedIds.includes(c._id)));
        setSelectedIds([]);
        showNotif(`${selectedIds.length} openings deleted`);
      }
    } catch (err) {
      showNotif('Delete failed', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  // Export
  const handleExportExcel = () => {
    const dataToExport = filtered.map(c => ({
      'Job Title': c.title,
      'Department': c.department,
      'Location': c.location,
      'Experience': c.experience,
      'Qualification': c.qualification,
      'Job Type': c.jobType,
      'Contact Email': c.contactEmail,
      'Status': c.status,
      'Created Date': c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Careers');
    XLSX.writeFile(wb, `careers_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotif(`Exported ${filtered.length} careers to Excel`);
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setIsEditModalOpen(true);
  };

  const openEditModal = (career) => {
    setFormData({
      _id: career._id,
      title: career.title || '',
      department: career.department || 'Editorial',
      location: career.location || 'Kerala',
      experience: career.experience || '1-3 years',
      qualification: career.qualification || 'Graduate',
      jobType: career.jobType || 'Full Time',
      description: career.description || '',
      contactEmail: career.contactEmail || 'careers@lemoott.com',
      status: career.status || 'Active'
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="admin-careers-pg">
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
          <h1 className="sub-admin-title">
            <Briefcase size={24} style={{ marginRight: 10, color: '#b3d332' }} />
            Career Openings
          </h1>
          <p className="sub-admin-subtitle">Create and manage job postings displayed on the website career page</p>
        </div>
        <div className="sub-admin-stats">
          <div className="stat-pill">{careers.length} <span>Total</span></div>
          <div className="stat-pill green">{careers.filter(c => c.status === 'Active').length} <span>Active</span></div>
          <div className="stat-pill red">{careers.filter(c => c.status === 'Inactive').length} <span>Inactive</span></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sub-filter-bar">
        <div className="sub-filter-left">
          <div className="sub-search-box">
            <Search size={16} className="sub-search-icon" />
            <input
              type="text"
              placeholder="Search by title, department, location, qualification..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <select
            value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            className="sub-select"
          >
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>

          <div className="sub-select-refresh-row">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="sub-select"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button className="sub-refresh-btn" onClick={fetchCareers} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="sub-filter-right">
          {selectedIds.length > 0 && (
            <button className="sub-action-btn danger" onClick={() => confirmDelete('bulk')}>
              <Trash2 size={16} /> Delete ({selectedIds.length})
            </button>
          )}
          <button className="sub-action-btn export" onClick={handleExportExcel}>
            <Download size={16} /> Excel
          </button>
          <button className="sub-action-btn primary-add" onClick={openAddModal}>
            <Plus size={16} /> Add Opening
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="sub-table-wrap">
        <table className="sub-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
                  style={{ width: 15, height: 15, cursor: 'pointer' }}
                />
              </th>
              <th>#</th>
              <th>Job Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Experience</th>
              <th>Qualification</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="sub-loader-cell"><Loader size="small" inline={true} /></td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan="9" className="sub-empty-cell">No career openings found.</td></tr>
            ) : currentItems.map((c, i) => (
              <tr key={c._id} className="sub-table-row">
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c._id)}
                    onChange={() => handleSelectOne(c._id)}
                    style={{ width: 15, height: 15, cursor: 'pointer' }}
                  />
                </td>
                <td className="sub-num">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                <td>
                  <div className="career-title-cell">
                    <span className="career-title-text">{c.title}</span>
                    <span className="career-badge-type">{c.jobType || 'Full Time'}</span>
                  </div>
                </td>
                <td><span className="career-dept-tag">{c.department || 'General'}</span></td>
                <td>
                  <span className="career-loc-tag">
                    <MapPin size={12} style={{ marginRight: 4 }} />
                    {c.location || 'Kerala'}
                  </span>
                </td>
                <td>{c.experience || 'N/A'}</td>
                <td>{c.qualification || 'N/A'}</td>
                <td>
                  <button
                    onClick={() => handleToggleStatus(c)}
                    className={`status-pill-btn ${c.status === 'Active' ? 'active' : 'inactive'}`}
                    title="Click to toggle status"
                  >
                    {c.status === 'Active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {c.status}
                  </button>
                </td>
                <td>
                  <div className="sub-actions">
                    <button className="sub-view-btn" onClick={() => setViewItem(c)} title="View Details">
                      <Eye size={15} />
                    </button>
                    <button className="sub-edit-btn" onClick={() => openEditModal(c)} title="Edit Opening">
                      <Edit2 size={15} />
                    </button>
                    <button className="sub-del-btn" onClick={() => confirmDelete('single', c._id)} title="Delete">
                      <Trash2 size={15} />
                    </button>
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
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`sub-pag-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="sub-pag-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next
          </button>
          <span className="sub-pag-info">
            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
          </span>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="sub-modal-overlay" onClick={() => setViewItem(null)}>
          <div className="sub-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="sub-modal-header">
              <div>
                <h2>{viewItem.title}</h2>
                <p>{viewItem.department} • {viewItem.jobType} • {viewItem.location}</p>
              </div>
              <button className="sub-modal-close" onClick={() => setViewItem(null)}><X size={22} /></button>
            </div>

            <div className="sub-modal-grid">
              <div className="sub-modal-section">
                <h3><Clock size={15} /> Experience Required</h3>
                <p className="career-modal-val">{viewItem.experience}</p>
              </div>
              <div className="sub-modal-section">
                <h3><Award size={15} /> Qualification</h3>
                <p className="career-modal-val">{viewItem.qualification}</p>
              </div>
              <div className="sub-modal-section">
                <h3><MapPin size={15} /> Location</h3>
                <p className="career-modal-val">{viewItem.location}</p>
              </div>
              <div className="sub-modal-section">
                <h3><Mail size={15} /> HR Contact Email</h3>
                <p className="career-modal-val">{viewItem.contactEmail || 'careers@lemoott.com'}</p>
              </div>

              {viewItem.description && (
                <div className="sub-modal-section full">
                  <h3>Job Description</h3>
                  <p className="career-modal-desc">{viewItem.description}</p>
                </div>
              )}
            </div>

            <div className="sub-modal-footer">
              <button className="sub-edit-btn-modal" onClick={() => { setViewItem(null); openEditModal(viewItem); }}>
                <Edit2 size={14} /> Edit
              </button>
              <button className="sub-modal-close-btn" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isEditModalOpen && (
        <div className="sub-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="sub-detail-modal form-modal" onClick={e => e.stopPropagation()}>
            <div className="sub-modal-header">
              <h2>{formData._id ? 'Edit Job Opening' : 'Add New Job Opening'}</h2>
              <button className="sub-modal-close" onClick={() => setIsEditModalOpen(false)}><X size={22} /></button>
            </div>

            <form onSubmit={handleSave} className="career-form">
              <div className="form-grid-2">
                <div className="career-form-group full">
                  <label>Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. News Producer / Sub-Editor"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="career-form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Editorial, Marketing, Tech"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                <div className="career-form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Kerala, Thiruvananthapuram"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="career-form-group">
                  <label>Experience</label>
                  <input
                    type="text"
                    placeholder="e.g. 3-6 years"
                    value={formData.experience}
                    onChange={e => setFormData({ ...formData, experience: e.target.value })}
                  />
                </div>

                <div className="career-form-group">
                  <label>Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. PG in Journalism / Mass Media"
                    value={formData.qualification}
                    onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </div>

                <div className="career-form-group">
                  <label>Job Type</label>
                  <select
                    value={formData.jobType}
                    onChange={e => setFormData({ ...formData, jobType: e.target.value })}
                  >
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="career-form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="career-form-group full">
                  <label>HR Contact Email</label>
                  <input
                    type="email"
                    placeholder="careers@lemoott.com"
                    value={formData.contactEmail}
                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>

                <div className="career-form-group full">
                  <label>Job Description / Responsibilities</label>
                  <textarea
                    rows="4"
                    placeholder="Outline key job roles, requirements, and day-to-day duties..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="sub-modal-footer">
                <button type="button" className="sub-modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="sub-save-btn" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : formData._id ? 'Update Opening' : 'Publish Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="sub-modal-overlay">
          <div className="sub-del-modal">
            <AlertTriangle size={56} color="#ff4d4d" strokeWidth={1.5} />
            <h2>Are you sure?</h2>
            <p>
              {deleteType === 'bulk'
                ? `You are about to delete ${selectedIds.length} career postings. This cannot be undone.`
                : 'You are about to delete this job opening. This cannot be undone.'}
            </p>
            <div className="sub-del-modal-btns">
              <button className="sub-cancel-btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="sub-confirm-del-btn" onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .admin-careers-pg { padding: 30px; background: #0b0c10; min-height: 100vh; color: #fff; }
        .sub-admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .sub-admin-title { font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; color: #fff; margin: 0; }
        .sub-admin-subtitle { color: #888; font-size: 0.88rem; margin-top: 5px; }
        .sub-admin-stats { display: flex; gap: 12px; }
        .stat-pill { background: #16181f; border: 1px solid #232733; padding: 6px 16px; border-radius: 8px; font-weight: 800; font-size: 1.1rem; display: flex; flex-direction: column; align-items: center; min-width: 65px; }
        .stat-pill span { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; color: #888; margin-top: 2px; }
        .stat-pill.green { color: #00c853; border-color: rgba(0,200,83,0.3); }
        .stat-pill.red { color: #ff4d4d; border-color: rgba(255,77,77,0.3); }

        .sub-filter-bar { display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
        .sub-filter-left { display: flex; gap: 12px; align-items: center; flex: 1; flex-wrap: wrap; }
        .sub-search-box { position: relative; min-width: 280px; flex: 1; }
        .sub-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #666; }
        .sub-search-box input { width: 100%; background: #16181f; border: 1px solid #232733; border-radius: 8px; padding: 10px 14px 10px 38px; color: #fff; font-size: 0.88rem; outline: none; }
        .sub-search-box input:focus { border-color: #b3d332; }

        .sub-select { background: #16181f; border: 1px solid #232733; border-radius: 8px; padding: 10px 14px; color: #fff; font-size: 0.88rem; outline: none; cursor: pointer; }
        .sub-select:focus { border-color: #b3d332; }
        .sub-select-refresh-row { display: flex; gap: 8px; align-items: center; }
        .sub-refresh-btn { background: #16181f; border: 1px solid #232733; color: #aaa; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .sub-refresh-btn:hover { color: #fff; border-color: #b3d332; }

        .sub-filter-right { display: flex; gap: 10px; align-items: center; }
        .sub-action-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: 0.2s; }
        .sub-action-btn.export { background: #16181f; border-color: #232733; color: #fff; }
        .sub-action-btn.export:hover { border-color: #b3d332; }
        .sub-action-btn.danger { background: rgba(255,77,77,0.15); border-color: rgba(255,77,77,0.3); color: #ff4d4d; }
        .sub-action-btn.primary-add { background: #b3d332; color: #000; font-weight: 700; }
        .sub-action-btn.primary-add:hover { background: #c5e839; }

        .sub-table-wrap { background: #16181f; border: 1px solid #232733; border-radius: 12px; overflow-x: auto; margin-bottom: 20px; }
        .sub-table { width: 100%; border-collapse: collapse; text-align: left; }
        .sub-table th { background: #1a1d26; color: #888; font-size: 0.78rem; text-transform: uppercase; font-weight: 700; padding: 14px 16px; border-bottom: 1px solid #232733; white-space: nowrap; }
        .sub-table-row { border-bottom: 1px solid #1f2330; transition: background 0.2s; }
        .sub-table-row:hover { background: rgba(255,255,255,0.02); }
        .sub-table td { padding: 14px 16px; font-size: 0.88rem; color: #ddd; vertical-align: middle; }
        .sub-num { color: #666; font-size: 0.8rem; }

        .career-title-cell { display: flex; flex-direction: column; gap: 4px; }
        .career-title-text { font-weight: 700; color: #fff; font-size: 0.95rem; }
        .career-badge-type { display: inline-block; font-size: 0.7rem; color: #888; text-transform: uppercase; }
        .career-dept-tag { background: rgba(179,211,50,0.1); color: #b3d332; padding: 3px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; }
        .career-loc-tag { display: inline-flex; align-items: center; color: #aaa; font-size: 0.84rem; }

        .status-pill-btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 20px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; transition: 0.2s; }
        .status-pill-btn.active { background: rgba(0,200,83,0.12); color: #00c853; border: 1px solid rgba(0,200,83,0.3); }
        .status-pill-btn.inactive { background: rgba(255,77,77,0.12); color: #ff4d4d; border: 1px solid rgba(255,77,77,0.3); }

        .sub-actions { display: flex; gap: 8px; }
        .sub-view-btn, .sub-edit-btn, .sub-del-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #282c3c; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .sub-view-btn { background: #1c202d; color: #4dabf7; }
        .sub-view-btn:hover { background: #4dabf7; color: #000; }
        .sub-edit-btn { background: #1c202d; color: #b3d332; }
        .sub-edit-btn:hover { background: #b3d332; color: #000; }
        .sub-del-btn { background: #1c202d; color: #ff4d4d; }
        .sub-del-btn:hover { background: #ff4d4d; color: #fff; }

        .sub-pagination { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
        .sub-pag-btn { background: #16181f; border: 1px solid #232733; color: #fff; min-width: 34px; height: 34px; border-radius: 6px; cursor: pointer; font-size: 0.82rem; }
        .sub-pag-btn.active { background: #b3d332; color: #000; font-weight: 700; border-color: #b3d332; }
        .sub-pag-info { color: #888; font-size: 0.8rem; margin-left: 10px; }

        /* Modals */
        .sub-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
        .sub-detail-modal { background: #16181f; border: 1px solid #282c3c; border-radius: 14px; width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; padding: 25px; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
        .sub-modal-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #232733; padding-bottom: 15px; margin-bottom: 20px; }
        .sub-modal-header h2 { font-size: 1.3rem; margin: 0; color: #fff; font-weight: 700; }
        .sub-modal-header p { color: #888; margin: 5px 0 0; font-size: 0.85rem; }
        .sub-modal-close { background: none; border: none; color: #888; cursor: pointer; padding: 4px; }
        .sub-modal-close:hover { color: #fff; }

        .sub-modal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
        .sub-modal-section { background: #12141a; border: 1px solid #202430; border-radius: 8px; padding: 14px; }
        .sub-modal-section.full { grid-column: 1 / -1; }
        .sub-modal-section h3 { font-size: 0.78rem; text-transform: uppercase; color: #888; margin: 0 0 8px; display: flex; align-items: center; gap: 6px; }
        .career-modal-val { margin: 0; font-weight: 700; color: #fff; font-size: 0.95rem; }
        .career-modal-desc { margin: 0; color: #bbb; font-size: 0.88rem; line-height: 1.5; white-space: pre-line; }

        .sub-modal-footer { display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #232733; padding-top: 15px; }
        .sub-modal-close-btn { background: #232733; border: none; color: #fff; padding: 9px 18px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
        .sub-save-btn { background: #b3d332; border: none; color: #000; font-weight: 700; padding: 9px 20px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
        .sub-save-btn:hover { background: #c5e839; }
        .sub-edit-btn-modal { background: #1c202d; border: 1px solid #282c3c; color: #b3d332; padding: 9px 18px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }

        /* Form */
        .form-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
        .career-form-group { display: flex; flex-direction: column; gap: 6px; }
        .career-form-group.full { grid-column: 1 / -1; }
        .career-form-group label { font-size: 0.8rem; font-weight: 600; color: #aaa; }
        .career-form-group input, .career-form-group select, .career-form-group textarea {
          background: #12141a; border: 1px solid #282c3c; border-radius: 6px; padding: 9px 12px; color: #fff; font-size: 0.88rem; outline: none; font-family: inherit;
        }
        .career-form-group input:focus, .career-form-group select:focus, .career-form-group textarea:focus {
          border-color: #b3d332;
        }

        /* Delete Modal */
        .sub-del-modal { background: #16181f; border: 1px solid #282c3c; border-radius: 14px; max-width: 440px; padding: 30px; text-align: center; }
        .sub-del-modal h2 { margin: 15px 0 10px; color: #fff; }
        .sub-del-modal p { color: #888; font-size: 0.9rem; margin-bottom: 25px; line-height: 1.4; }
        .sub-del-modal-btns { display: flex; gap: 12px; justify-content: center; }
        .sub-cancel-btn { background: #232733; border: none; color: #fff; padding: 10px 24px; border-radius: 6px; cursor: pointer; }
        .sub-confirm-del-btn { background: #ff4d4d; border: none; color: #fff; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 700; }

        /* Global Alert Notification */
        .sub-admin-notif { position: fixed; top: 30px; right: 30px; z-index: 99999; }
        .sub-admin-notif-inner { background: #16181f; border: 1px solid #282c3c; border-radius: 10px; padding: 12px 20px; display: flex; align-items: center; gap: 12px; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        `
      }} />
    </div>
  );
};

export default AdminCareers;
