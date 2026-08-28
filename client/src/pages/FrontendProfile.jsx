import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Edit2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Camera, 
  Bookmark, 
  LogOut, 
  CreditCard, 
  FileText, 
  Calendar, 
  Download, 
  Eye, 
  ChevronDown, 
  Play,
  Palette,
  Moon,
  Sun,
  Sparkles,
  Sliders,
  Tv,
  Check
} from 'lucide-react';
import Loader from '../components/Loader';
import FrontendLayout from '../components/FrontendLayout';
import { logoutUser } from '../utils/logout';
import { useToast } from '../context/ToastContext';

const FrontendProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    password: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    user.profileImage 
      ? (user.profileImage.startsWith('http') ? user.profileImage : `/uploads/${user.profileImage}`)
      : null
  );
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [transactions, setTransactions] = useState([]);
  const [fullUser, setFullUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  const handleTabClick = (tab) => {
    if (window.innerWidth <= 992) {
      setActiveTab(activeTab === tab ? null : tab);
    } else {
      setActiveTab(tab);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}`);
        const data = await res.json();
        setFullUser(data);
        
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data, id: data._id }));
        
        const transRes = await fetch(`/api/user/transactions/${user.email}`);
        const transData = await transRes.json();
        setTransactions(transData);

        // Fetch watchlist data
        setLoadingWatchlist(true);
        const wlRes = await fetch(`/api/watchlist/${user.id}`);
        const wlData = await wlRes.json();
        setWatchlist(Array.isArray(wlData) ? wlData : (wlData.items || wlData.watchlist || []));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoadingWatchlist(false);
      }
    };
    if (user.id) {
      fetchUserData();
    }
  }, [user.id, user.email]);

  const removeFromWatchlist = async (contentId, contentType) => {
    try {
      const response = await fetch('/api/watchlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, contentId, contentType })
      });
      if (response.ok) {
        setWatchlist(prev => prev.filter(item => item._id !== contentId));
        toast.success('Removed from watchlist');
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      toast.error('Failed to remove from watchlist');
    }
  };

  const formatImageUrl = (item, typePref = 'thumbnail') => {
    if (!item) return '';
    const url = item[typePref] || item.thumbnail || item.poster || item.image || '';
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `/${cleanPath}`;
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    if (formData.password) data.append('password', formData.password);
    if (profileImage) data.append('profileImage', profileImage);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        body: data
      });

      if (response.ok) {
        const updatedUser = await response.json();
        const newUserObj = {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          profileImage: updatedUser.profileImage,
          phone: updatedUser.phone,
          status: updatedUser.status,
          subscriptionPlan: updatedUser.subscriptionPlan,
          expiryDate: updatedUser.expiryDate
        };
        localStorage.setItem('user', JSON.stringify(newUserObj));
        setUser(newUserObj);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
        window.dispatchEvent(new Event('profileUpdate'));
      } else {
        const err = await response.json();
        toast.error(err.message || 'Update failed');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };



  const handleLogout = () => {
    logoutUser();
  };

  return (
    <FrontendLayout isTransparent={true}>
      <div className="fe-profile-page-v">
        <div className="fe-profile-container-v">
          
          {/* Left Sidebar */}
          <div className="fe-profile-sidebar-v">
            <div className="fe-profile-avatar-v">
              <div className="avatar-wrapper-v">
                {previewUrl ? (
                  <img src={previewUrl} alt="User" />
                ) : (
                  <div className="avatar-placeholder-v"><User size={60} /></div>
                )}
                {isEditing && (
                  <label className="avatar-upload-v">
                    <Camera size={20} />
                    <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                  </label>
                )}
              </div>
              <h3>{user.name}</h3>
            </div>

            <div className="fe-profile-nav-v">
              <button 
                className={activeTab === 'account' ? 'active' : ''} 
                onClick={() => handleTabClick('account')}
              >
                <User size={18} /> Account Info
              </button>

              <button 
                className={activeTab === 'subscription' ? 'active' : ''} 
                onClick={() => handleTabClick('subscription')}
              >
                <CreditCard size={18} /> Subscription
              </button>

              <button 
                className={activeTab === 'billing' ? 'active' : ''} 
                onClick={() => handleTabClick('billing')}
              >
                <FileText size={18} /> Billing History
              </button>

              <button 
                className={activeTab === 'watchlist' ? 'active' : ''} 
                onClick={() => handleTabClick('watchlist')}
              >
                <Bookmark size={18} /> My Watchlist
              </button>

              <button className="logout-v" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="fe-profile-content-v">
            
            {/* 1. Account Info Section */}
            <div className={`fe-accordion-item-v ${activeTab === 'account' ? 'active' : ''}`}>
              <div className="fe-accordion-header-v" onClick={() => handleTabClick('account')}>
                <h3><User size={18} /> Account Info</h3>
                <ChevronDown size={18} className="chevron-icon-v" />
              </div>
              <div className="fe-accordion-content-v">
                <div className="content-header-v">
                  <h2>Account Settings</h2>
                  {!isEditing && (
                    <button type="button" className="edit-toggle-v" onClick={() => setIsEditing(true)}>
                      <Edit2 size={16} /> Edit Profile
                    </button>
                  )}
                </div>

                <form onSubmit={handleSave} className="fe-profile-form-v">
                  <div className="form-grid-v">
                    <div className="form-group-v">
                      <label><User size={16} /> Full Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name} 
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="form-group-v">
                      <label><Mail size={16} /> Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email} 
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="form-group-v">
                      <label><Phone size={16} /> Phone Number</label>
                      <input 
                        type="text" 
                        name="phone"
                        value={formData.phone} 
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter your phone"
                      />
                    </div>
                    {isEditing && (
                      <div className="form-group-v full-v">
                        <label>Change Password</label>
                        <input 
                          type="password" 
                          name="password"
                          value={formData.password} 
                          onChange={handleInputChange}
                          placeholder="Leave blank to keep current password"
                        />
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="form-actions-v">
                      <button type="button" className="cancel-btn-v" onClick={() => setIsEditing(false)}>Cancel</button>
                      <button type="submit" className="save-btn-v" disabled={loading}>
                        {loading ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Loader2 className="spinner-v" size={18} /> Saving...
                          </span>
                        ) : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* 2. Subscription Section */}
            <div className={`fe-accordion-item-v ${activeTab === 'subscription' ? 'active' : ''}`}>
              <div className="fe-accordion-header-v" onClick={() => handleTabClick('subscription')}>
                <h3><CreditCard size={18} /> Subscription</h3>
                <ChevronDown size={18} className="chevron-icon-v" />
              </div>
              <div className="fe-accordion-content-v">
                <div className="content-header-v">
                  <h2>My Subscription</h2>
                </div>
                <div className="plan-card-premium-v">
                  <div className="plan-badge-v">{fullUser?.subscriptionPlan || 'No Plan'}</div>
                  <div className="plan-status-v">
                    <span className="status-indicator-v active"></span>
                    {fullUser?.status === 'Active' ? 'Active Subscription' : 'Inactive'}
                  </div>
                  <div className="plan-details-v">
                    <div className="detail-item-v">
                      <Calendar size={20} />
                      <div>
                        <label>Expires On</label>
                        <span>{fullUser?.expiryDate || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="detail-item-v">
                      <CreditCard size={20} />
                      <div>
                        <label>Payment Method</label>
                        <span>Credit Card (Ending in 4242)</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="upgrade-btn-v" 
                    onClick={() => navigate('/subscription')}
                  >
                    Change / Upgrade Plan
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Billing Section */}
            <div className={`fe-accordion-item-v ${activeTab === 'billing' ? 'active' : ''}`}>
              <div className="fe-accordion-header-v" onClick={() => handleTabClick('billing')}>
                <h3><FileText size={18} /> Billing History</h3>
                <ChevronDown size={18} className="chevron-icon-v" />
              </div>
              <div className="fe-accordion-content-v">
                <div className="content-header-v">
                  <h2>Billing History</h2>
                </div>
                <div className="invoice-table-v">
                  {transactions.length > 0 ? (
                    <>
                      <table>
                        <thead>
                          <tr>
                            <th>Time / Date</th>
                            <th>Plan</th>
                            <th>Amount</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(tx => (
                            <tr key={tx._id}>
                              <td>{tx.paymentDate}</td>
                              <td>{tx.plan}</td>
                              <td>{tx.amount}</td>
                              <td>
                                <button className="view-invoice-v" title="View Invoice" onClick={() => setSelectedTransaction(tx)}>
                                  <Eye size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {transactions.length > itemsPerPage && (
                        <div className="fe-pagination-v">
                          <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          >
                            Prev
                          </button>
                          <span>Page {currentPage} of {Math.ceil(transactions.length / itemsPerPage)}</span>
                          <button 
                            disabled={currentPage === Math.ceil(transactions.length / itemsPerPage)} 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(transactions.length / itemsPerPage)))}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-invoices-v">
                      <FileText size={48} />
                      <p>No billing records found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Watchlist Section */}
            <div className={`fe-accordion-item-v ${activeTab === 'watchlist' ? 'active' : ''}`}>
              <div className="fe-accordion-header-v" onClick={() => handleTabClick('watchlist')}>
                <h3><Bookmark size={18} /> My Watchlist</h3>
                <ChevronDown size={18} className="chevron-icon-v" />
              </div>
              <div className="fe-accordion-content-v">
                <div className="content-header-v">
                  <h2>My Watchlist</h2>
                </div>
                {loadingWatchlist ? (
                  <div className="watchlist-loader-v" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '15px' }}>
                    <Loader2 className="spinner-v" size={32} />
                    <p style={{ color: '#888', fontWeight: 600 }}>Loading your watchlist...</p>
                  </div>
                ) : watchlist.length === 0 ? (
                  <div className="empty-watchlist-v" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '250px', color: '#666', textAlign: 'center' }}>
                    <Bookmark size={60} style={{ color: '#222', marginBottom: '20px' }} />
                    <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, marginBottom: '10px' }}>Your watchlist is empty</h3>
                    <p style={{ maxWidth: '300px', fontSize: '0.9rem', marginBottom: '20px' }}>Content you save will appear here for easy access later.</p>
                  </div>
                ) : (
                  <div className="watchlist-grid-v">
                    {watchlist.map((item) => (
                      <div key={item._id} className="watchlist-card-v">
                        <div className="card-image-v">
                          <img 
                            src={formatImageUrl(item) || 'https://via.placeholder.com/400x225?text=No+Preview'} 
                            alt={item.title} 
                          />
                          <button 
                            className="remove-btn-v" 
                            onClick={() => removeFromWatchlist(item._id, item.contentType)}
                          >
                            <XCircle size={16} />
                          </button>
                          <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', color: '#b3d332', fontSize: '0.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(179,211,50,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {item.contentType?.toUpperCase()}
                          </div>
                        </div>
                        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 750, color: '#fff', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#555', fontWeight: 700 }}>
                              {item.year || '2026'}
                            </span>
                            <button 
                              className="watch-btn-v"
                              onClick={() => navigate(`/details/${item.contentType?.toLowerCase()}/${item._id}`)}
                            >
                              <Play size={10} fill="currentColor" /> Watch
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>



            {/* Mobile-only links */}
            <div className="fe-mobile-link-row-v logout-v fe-mobile-only-v" onClick={handleLogout}>
              <h3><LogOut size={18} /> Logout</h3>
              <ChevronDown size={18} className="chevron-icon-v" style={{ transform: 'rotate(-90deg)' }} />
            </div>
          </div>
        </div>

        {/* Invoice Modal */}
        {selectedTransaction && (
          <div className="fe-invoice-modal-overlay-v" onClick={() => setSelectedTransaction(null)}>
            <div className="fe-invoice-modal-v" onClick={e => e.stopPropagation()}>
              <div className="modal-header-v">
                <h3>Invoice Details</h3>
                <button className="close-btn-v" onClick={() => setSelectedTransaction(null)}><XCircle size={24} /></button>
              </div>
              <div className="modal-body-v">
                <div className="invoice-detail-row-v">
                  <span className="label-v">Transaction ID</span>
                  <span className="value-v">{selectedTransaction.paymentId}</span>
                </div>
                <div className="invoice-detail-row-v">
                  <span className="label-v">Date & Time</span>
                  <span className="value-v">{selectedTransaction.paymentDate}</span>
                </div>
                <div className="invoice-detail-row-v">
                  <span className="label-v">Email ID</span>
                  <span className="value-v">{fullUser?.email || user.email}</span>
                </div>
                <div className="invoice-detail-row-v">
                  <span className="label-v">Plan Name</span>
                  <span className="value-v">{selectedTransaction.plan}</span>
                </div>
                <div className="invoice-detail-row-v">
                  <span className="label-v">Expiry Date</span>
                  <span className="value-v">{fullUser?.expiryDate || 'N/A'}</span>
                </div>
                <div className="invoice-detail-row-v">
                  <span className="label-v">Amount Paid</span>
                  <span className="value-v highlight-v">
                    {selectedTransaction.amount && selectedTransaction.amount.toString().includes('₹') 
                      ? selectedTransaction.amount 
                      : `₹${selectedTransaction.amount}`}
                  </span>
                </div>
                <div className="invoice-detail-row-v">
                  <span className="label-v">Status</span>
                  <span className="value-v status-v">{selectedTransaction.status || 'Completed'}</span>
                </div>
              </div>
              <div className="modal-footer-v">
                <button className="done-btn-v" onClick={() => setSelectedTransaction(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .fe-profile-page-v { 
          min-height: 100vh; 
          background: var(--bg-main, #050505); 
          padding: 120px 5% 60px; 
          color: var(--text-primary, #fff); 
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        .fe-profile-container-v { 
          max-width: 1200px; 
          margin: 0 auto; 
          display: grid; 
          grid-template-columns: 320px 1fr; 
          gap: 40px; 
        }
        
        .fe-profile-sidebar-v { 
          background: var(--bg-sidebar, #0a0a0a); 
          border: 1px solid var(--border-color, #222); 
          border-radius: 16px; 
          padding: 40px 20px; 
          height: fit-content; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .fe-profile-avatar-v { text-align: center; margin-bottom: 40px; }
        .avatar-wrapper-v { position: relative; width: 120px; height: 120px; margin: 0 auto 20px; }
        .avatar-wrapper-v img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent-lime, #b3d332); }
        .avatar-placeholder-v { width: 100%; height: 100%; border-radius: 50%; background: var(--bg-hover, #1a1a1a); display: flex; align-items: center; justify-content: center; color: var(--text-secondary, #444); border: 3px solid var(--border-color, #333); }
        .avatar-upload-v { position: absolute; bottom: 0; right: 0; background: var(--accent-lime, #b3d332); color: #000; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
        .avatar-upload-v:hover { transform: scale(1.1); }
        .fe-profile-avatar-v h3 { font-size: 1.4rem; font-weight: 800; margin: 0 0 5px 0; color: var(--text-primary, #fff); }
        .fe-profile-avatar-v p { font-size: 0.75rem; font-weight: 800; color: var(--accent-lime, #b3d332); letter-spacing: 1.5px; }

        .fe-profile-nav-v { display: flex; flex-direction: column; gap: 10px; }
        .fe-profile-nav-v button { background: none; border: none; color: var(--text-secondary, #888); display: flex; align-items: center; gap: 15px; padding: 15px 20px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: 0.3s; text-align: left; }
        .fe-profile-nav-v button:hover { background: var(--bg-hover, rgba(255,255,255,0.05)); color: var(--text-primary, #fff); }
        .fe-profile-nav-v button.active { background: rgba(179,211,50,0.12); color: var(--accent-lime, #b3d332); }
        .fe-profile-nav-v button.logout-v { color: #ff4d4d; margin-top: 20px; border-top: 1px solid var(--border-color, #222); border-radius: 0; }
        .fe-profile-nav-v button.logout-v:hover { background: rgba(255,77,77,0.1); }

        .fe-profile-content-v { 
          background: var(--bg-sidebar, #0a0a0a); 
          border: 1px solid var(--border-color, #222); 
          border-radius: 16px; 
          padding: 40px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .content-header-v { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .content-header-v h2 { font-size: 1.8rem; font-weight: 800; margin: 0; color: var(--text-primary, #fff); }
        .edit-toggle-v { background: var(--bg-hover, rgba(255,255,255,0.05)); color: var(--text-primary, #fff); border: 1px solid var(--border-color, #333); padding: 10px 20px; border-radius: 30px; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; }
        .edit-toggle-v:hover { background: var(--text-primary, #fff); color: var(--bg-main, #000); }

        .fe-profile-form-v .form-grid-v { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .form-group-v.full-v { grid-column: span 2; }
        .form-group-v label { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 700; color: var(--text-secondary, #888); margin-bottom: 12px; }
        .form-group-v input { width: 100%; background: var(--bg-card, #111); border: 1px solid var(--border-color, #222); padding: 15px 20px; border-radius: 12px; color: var(--text-primary, #fff); font-size: 1rem; font-weight: 600; transition: 0.3s; outline: none; }
        .form-group-v input:focus { border-color: var(--accent-lime, #b3d332); background: var(--bg-main, #000); box-shadow: 0 0 20px rgba(179,211,50,0.1); }
        .form-group-v input:disabled { opacity: 0.6; cursor: not-allowed; }

        .form-actions-v { display: flex; justify-content: flex-end; gap: 20px; margin-top: 30px; padding-top: 25px; border-top: 1px solid var(--border-color, #222); }
        .cancel-btn-v { background: none; border: 1px solid var(--border-color, #333); color: var(--text-secondary, #888); padding: 12px 30px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.3s; }
        .cancel-btn-v:hover { color: var(--text-primary, #fff); border-color: #555; }
        .save-btn-v { background: var(--accent-lime, #b3d332); color: #000; border: none; padding: 12px 40px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(179,211,50,0.2); }
        .save-btn-v:hover { transform: scale(1.03); background: #c5ea38; box-shadow: 0 15px 30px rgba(179,211,50,0.4); }

        /* Appearance Section Styles */
        .fe-appearance-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .appearance-group-card {
          background: var(--bg-card, #11141b);
          border: 1px solid var(--border-color, #1e2430);
          border-radius: 14px;
          padding: 24px;
          transition: all 0.3s ease;
        }
        .group-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-color, #1a202c);
          padding-bottom: 12px;
        }
        .group-card-head h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary, #fff);
          letter-spacing: -0.2px;
        }
        .text-lime { color: var(--accent-lime, #b3d332); }

        .theme-options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 18px;
        }
        .theme-box-choice {
          background: var(--bg-card-inner, #0d0f14);
          border: 2px solid var(--border-color, #202634);
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .theme-box-choice:hover {
          border-color: #3b465c;
          transform: translateY(-2px);
        }
        .theme-box-choice.active {
          border-color: var(--accent-lime, #b3d332);
          background: rgba(179, 211, 50, 0.08);
          box-shadow: 0 0 20px rgba(179, 211, 50, 0.2);
        }

        .theme-preview {
          height: 75px;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .oled-preview { background: #000000; border-color: #222; }
        .oled-preview .preview-top-bar { height: 14px; background: #151515; width: 100%; }
        .oled-preview .preview-dot { width: 8px; height: 8px; border-radius: 50%; background: #b3d332; position: absolute; bottom: 10px; left: 10px; }

        .navy-preview { background: #060b14; border-color: rgba(56, 189, 248, 0.3); }
        .navy-preview .preview-top-bar { height: 14px; background: #131c31; width: 100%; }
        .navy-preview .preview-dot { width: 8px; height: 8px; border-radius: 50%; background: #00c0ff; position: absolute; bottom: 10px; left: 10px; }

        .light-preview { background: #ffffff; border-color: #cbd5e1; }
        .light-preview .preview-top-bar { height: 14px; background: #e2e8f0; width: 100%; }
        .light-preview .preview-dot { width: 8px; height: 8px; border-radius: 50%; background: #65a30d; position: absolute; bottom: 10px; left: 10px; }

        .theme-label-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary, #fff);
        }
        .check-active { color: var(--accent-lime, #b3d332); }

        /* Light mode specific overrides */
        [data-theme="light_mode"] .fe-profile-page-v {
          background: #f4f6fa;
          color: #0f172a;
        }
        [data-theme="light_mode"] .fe-profile-sidebar-v,
        [data-theme="light_mode"] .fe-profile-content-v {
          background: #ffffff;
          border-color: #e2e8f0;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
        }
        [data-theme="light_mode"] .appearance-group-card {
          background: #f8fafc;
          border-color: #e2e8f0;
        }
        [data-theme="light_mode"] .theme-box-choice {
          background: #ffffff;
          border-color: #e2e8f0;
        }
        [data-theme="light_mode"] .form-group-v input {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        [data-theme="light_mode"] .form-group-v input:focus {
          background: #ffffff;
          border-color: #65a30d;
        }
        [data-theme="light_mode"] .fe-profile-avatar-v h3,
        [data-theme="light_mode"] .content-header-v h2,
        [data-theme="light_mode"] .group-card-head h4,
        [data-theme="light_mode"] .theme-label-wrap span {
          color: #0f172a;
        }
        [data-theme="light_mode"] .fe-profile-nav-v button {
          color: #475569;
        }
        [data-theme="light_mode"] .fe-profile-nav-v button:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        [data-theme="light_mode"] .plan-card-premium-v {
          background: #ffffff;
          border-color: #e2e8f0;
        }
        [data-theme="light_mode"] .plan-badge-v {
          color: #0f172a;
        }
        [data-theme="light_mode"] .detail-item-v span {
          color: #0f172a;
        }

        /* Midnight Navy specific overrides */
        [data-theme="midnight_navy"] .fe-profile-page-v {
          background: #060b14;
        }
        [data-theme="midnight_navy"] .fe-profile-sidebar-v,
        [data-theme="midnight_navy"] .fe-profile-content-v {
          background: #0c1322;
          border-color: rgba(56, 189, 248, 0.16);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        [data-theme="midnight_navy"] .appearance-group-card {
          background: #10192d;
          border-color: rgba(56, 189, 248, 0.16);
        }
        [data-theme="midnight_navy"] .theme-box-choice {
          background: #090e1a;
          border-color: rgba(56, 189, 248, 0.2);
        }

        /* Subscription & Billing Tabs Styles */
        .plan-card-premium-v { background: var(--bg-card, #111); border: 1px solid var(--border-color, #222); border-radius: 20px; padding: 40px; position: relative; overflow: hidden; }
        .plan-card-premium-v::before { content: ''; position: absolute; top: -50%; right: -20%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(179,211,50,0.1) 0%, transparent 70%); border-radius: 50%; }
        .plan-badge-v { font-size: 2.5rem; font-weight: 900; color: var(--text-primary, #fff); margin-bottom: 10px; }
        .plan-status-v { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.85rem; color: var(--accent-lime, #b3d332); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 40px; }
        .status-indicator-v { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-lime, #b3d332); box-shadow: 0 0 10px var(--accent-lime, #b3d332); }
        
        .plan-details-v { display: flex; flex-direction: column; gap: 25px; margin-bottom: 40px; }
        .detail-item-v { display: flex; align-items: center; gap: 20px; }
        .detail-item-v svg { color: var(--text-secondary, #444); }
        .detail-item-v label { display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary, #555); text-transform: uppercase; margin-bottom: 4px; }
        .detail-item-v span { font-size: 1.1rem; font-weight: 700; color: var(--text-primary, #fff); }
        
        .upgrade-btn-v { background: var(--text-primary, #fff); color: var(--bg-main, #000); border: none; padding: 15px 30px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: 0.3s; }
        .upgrade-btn-v:hover { background: var(--accent-lime, #b3d332); color: #000; transform: translateY(-3px); }

        .invoice-table-v { overflow-x: auto; }
        .invoice-table-v table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .invoice-table-v th { text-align: left; padding: 15px 20px; border-bottom: 1px solid var(--border-color, #222); color: var(--text-secondary, #444); font-size: 0.85rem; font-weight: 800; text-transform: uppercase; }
        .invoice-table-v td { padding: 20px; border-bottom: 1px solid var(--border-color, #111); font-weight: 600; color: var(--text-secondary, #aaa); }
        .invoice-table-v tr:hover td { background: var(--bg-hover, #111); color: var(--text-primary, #fff); }
        .view-invoice-v { background: var(--bg-hover, rgba(255,255,255,0.05)); border: 1px solid var(--border-color, #222); color: var(--text-primary, #fff); width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
        .view-invoice-v:hover { background: var(--text-primary, #fff); color: var(--bg-main, #000); border-color: var(--text-primary, #fff); }
        
        .no-invoices-v p { margin-top: 15px; font-weight: 700; font-size: 1.1rem; color: var(--text-secondary, #888); }

        .watchlist-grid-v { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 25px; margin-top: 10px; }
        .watchlist-card-v { background: var(--bg-card, #111); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color, #222); display: flex; flex-direction: column; position: relative; transition: 0.3s ease; }
        .watchlist-card-v:hover { transform: translateY(-5px); border-color: var(--accent-lime, #b3d332); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
        .card-image-v { position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden; }
        .card-image-v img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .watchlist-card-v:hover .card-image-v img { transform: scale(1.05); }
        .watchlist-card-v .remove-btn-v { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; z-index: 10; transition: 0.3s; }
        .watchlist-card-v .remove-btn-v:hover { background: #ff4d4d !important; border-color: #ff4d4d; }
        .watchlist-card-v .watch-btn-v { background: var(--accent-lime, #b3d332); border: none; border-radius: 20px; padding: 6px 16px; color: #000; font-size: 0.75rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.3s; }
        .watchlist-card-v .watch-btn-v:hover { background: #fff; color: #000; transform: translateY(-1px); }

        .fe-pagination-v { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 25px; padding-top: 20px; border-top: 1px solid var(--border-color, #222); }
        .fe-pagination-v button { background: var(--bg-hover, rgba(255,255,255,0.05)); border: 1px solid var(--border-color, #333); color: var(--text-primary, #fff); padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.3s; }
        .fe-pagination-v button:hover:not(:disabled) { background: var(--accent-lime, #b3d332); color: #000; border-color: var(--accent-lime, #b3d332); }
        .fe-pagination-v button:disabled { opacity: 0.5; cursor: not-allowed; }
        .fe-pagination-v span { font-size: 0.9rem; font-weight: 700; color: var(--text-secondary, #888); }

        .fe-invoice-modal-overlay-v { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease; }
        .fe-invoice-modal-v { background: var(--bg-sidebar, #111); border: 1px solid var(--border-color, #333); border-radius: 16px; width: 90%; max-width: 500px; padding: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .fe-invoice-modal-v .modal-header-v { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, #222); padding-bottom: 20px; margin-bottom: 20px; }
        .fe-invoice-modal-v .modal-header-v h3 { font-size: 1.5rem; font-weight: 800; color: var(--text-primary, #fff); margin: 0; }
        .fe-invoice-modal-v .close-btn-v { background: none; border: none; color: var(--text-secondary, #888); cursor: pointer; transition: 0.3s; }
        .fe-invoice-modal-v .close-btn-v:hover { color: #ff4d4d; }
        .fe-invoice-modal-v .modal-body-v { display: flex; flex-direction: column; gap: 15px; }
        .invoice-detail-row-v { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--border-color, #222); }
        .invoice-detail-row-v .label-v { color: var(--text-secondary, #888); font-weight: 700; font-size: 0.9rem; }
        .invoice-detail-row-v .value-v { color: var(--text-primary, #fff); font-weight: 800; font-size: 1rem; }
        .invoice-detail-row-v .highlight-v { color: var(--accent-lime, #b3d332); font-size: 1.2rem; }
        .invoice-detail-row-v .status-v { background: rgba(179,211,50,0.1); color: var(--accent-lime, #b3d332); padding: 5px 12px; border-radius: 6px; font-size: 0.8rem; }
        .fe-invoice-modal-v .modal-footer-v { margin-top: 30px; text-align: center; }
        .fe-invoice-modal-v .done-btn-v { background: var(--text-primary, #fff); color: var(--bg-main, #000); border: none; padding: 12px 40px; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.3s; width: 100%; }
        .fe-invoice-modal-v .done-btn-v:hover { background: var(--accent-lime, #b3d332); color: #000; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .spinner-v { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .fe-accordion-header-v {
          display: none;
        }
        .fe-accordion-item-v {
          display: none;
        }
        .fe-accordion-item-v.active {
          display: block;
        }
        .fe-mobile-only-v {
          display: none;
        }
        
        @media (max-width: 992px) {
          .fe-profile-container-v { grid-template-columns: 1fr; gap: 20px; }
          .fe-profile-sidebar-v { position: relative; padding: 30px; }
          .fe-profile-nav-v { display: none; }
          
          .fe-profile-content-v {
            background: none;
            border: none;
            padding: 0;
          }
          
          .fe-accordion-item-v {
            display: block;
            background: var(--bg-sidebar, #0a0a0a);
            border: 1px solid var(--border-color, #222);
            border-radius: 12px;
            margin-bottom: 12px;
            overflow: hidden;
          }
          
          .fe-accordion-header-v {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            cursor: pointer;
            background: var(--bg-card, #111);
            transition: 0.3s;
          }
          
          .fe-accordion-header-v:hover {
            background: var(--bg-hover, #161616);
          }
          
          .fe-accordion-header-v h3 {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1rem;
            font-weight: 700;
            margin: 0;
            color: var(--text-primary, #fff);
          }
          
          .fe-accordion-header-v h3 svg {
            color: var(--text-secondary, #888);
          }
          
          .fe-accordion-item-v.active .fe-accordion-header-v h3 svg {
            color: var(--accent-lime, #b3d332);
          }
          
          .fe-accordion-item-v.active .fe-accordion-header-v {
            border-bottom: 1px solid var(--border-color, #222);
            background: var(--bg-sidebar, #0a0a0a);
          }
          
          .chevron-icon-v {
            color: var(--text-secondary, #888);
            transition: transform 0.3s ease;
          }
          
          .fe-accordion-item-v.active .chevron-icon-v {
            transform: rotate(180deg);
            color: var(--accent-lime, #b3d332);
          }
          
          .fe-accordion-content-v {
            display: none;
            padding: 24px;
          }
          
          .fe-accordion-item-v.active .fe-accordion-content-v {
            display: block;
          }
          
          .fe-mobile-only-v {
            display: flex;
          }
          
          .fe-mobile-link-row-v {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: var(--bg-sidebar, #0a0a0a);
            border: 1px solid var(--border-color, #222);
            border-radius: 12px;
            margin-bottom: 12px;
            cursor: pointer;
          }
          
          .fe-mobile-link-row-v h3 {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1rem;
            font-weight: 700;
            margin: 0;
            color: var(--text-primary, #fff);
          }
          
          .fe-mobile-link-row-v.logout-v h3 {
            color: #ff4d4d;
          }
        }
        
        @media (max-width: 600px) {
          .fe-profile-form-v .form-grid-v { grid-template-columns: 1fr; }
          .form-group-v.full-v { grid-column: auto; }
          .content-header-v h2 { font-size: 1.5rem; }
          
          .invoice-table-v table { min-width: 100%; }
          .invoice-table-v th { padding: 10px; font-size: 0.65rem; }
          .invoice-table-v td { padding: 10px; font-size: 0.75rem; }
          
          .fe-accordion-content-v {
            padding: 16px;
          }

          .theme-options-grid {
            grid-template-columns: 1fr;
          }
        }
      ` }} />
    </FrontendLayout>
  );
};

export default FrontendProfile;
