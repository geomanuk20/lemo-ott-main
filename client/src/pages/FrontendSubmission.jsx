import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Copy, 
  CreditCard, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText,
  Clock,
  Calendar,
  Film
} from 'lucide-react';
import FrontendLayout from '../components/FrontendLayout';
import { useNavigate, useLocation } from 'react-router-dom';

const FrontendSubmission = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // ── Auth Guard: redirect to login if not logged in ──
  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/submission' }, replace: true });
    }
  }, [token, navigate]);

  const [validationErrors, setValidationErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [paymentSuccessTxn, setPaymentSuccessTxn] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const fetchUserSubmissions = async () => {
    if (!loggedInUser.email) return;
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/submissions?email=${encodeURIComponent(loggedInUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        setUserSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (loggedInUser.email) {
      fetchUserSubmissions();
    }
  }, [loggedInUser.email]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const txn = params.get('txn');
    if (paymentStatus === 'success') {
      setPaymentSuccessTxn(txn || 'completed');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'failed') {
      showNotification('PhonePe payment failed or was cancelled. Please try again.', 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'error') {
      showNotification('An error occurred during payment processing.', 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);


  // Form State
  const [step, setStep] = useState(1); // 1 = Content Details, 2 = Payment Details
  const [formData, setFormData] = useState({
    name: loggedInUser.username || loggedInUser.name || '',
    email: loggedInUser.email || '',
    phone: '',
    contentName: '',
    language: '',
    genres: [],
    otherGenre: '',
    actors: '',
    directors: '',
    thumbnailLink: '',
    sliderLink: '',
    posterLink: '',
    trailerLink: '',
    videoLink: '',
    description: '',
    contentType: '',
    otherContentType: '',
    duration: '',
    ageRating: '',
    content18Plus: '',
    status: '',
    otherStatus: '',
    paymentDescription: '',
    paymentMethod: 'PhonePe'
  });


  // Genre Constants
  const GENRES_LIST = [
    'Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 
    'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 
    'Sci-Fi', 'Thriller', 'Documentary', 'Animation', 'Other:'
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleGenreChange = (genre) => {
    setFormData(prev => {
      let updatedGenres = [...prev.genres];
      if (updatedGenres.includes(genre)) {
        updatedGenres = updatedGenres.filter(g => g !== genre);
      } else {
        updatedGenres.push(genre);
      }
      return { ...prev, genres: updatedGenres };
    });

    if (validationErrors.genres) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy.genres;
        return copy;
      });
    }
  };

  const validateStep1 = () => {
    const errors = {};
    const requiredFields = [
      'name', 'email', 'phone', 'contentName', 'language', 
      'actors', 'directors', 'thumbnailLink', 'sliderLink', 
      'posterLink', 'videoLink', 'description', 
      'contentType', 'duration', 'ageRating', 'content18Plus', 'status'
    ];

    requiredFields.forEach(field => {
      if (!formData[field] || String(formData[field]).trim() === '') {
        errors[field] = 'This field is required';
      }
    });

    if (formData.genres.length === 0) {
      errors.genres = 'Select at least one genre';
    }

    if (formData.genres.includes('Other:') && (!formData.otherGenre || formData.otherGenre.trim() === '')) {
      errors.otherGenre = 'Please specify other genre';
    }

    if (formData.contentType === 'Other:' && (!formData.otherContentType || formData.otherContentType.trim() === '')) {
      errors.otherContentType = 'Please specify other content type';
    }

    if (formData.status === 'Other:' && (!formData.otherStatus || formData.otherStatus.trim() === '')) {
      errors.otherStatus = 'Please specify other status';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo(0, 0);
    } else {
      showNotification('Please fill in all required fields marked with *', 'error');
    }
  };

  const handleBack = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.paymentMethod) {
      showNotification('Please select a payment method', 'error');
      return;
    }

    setProcessing(true);

    // Prepare genres list
    let finalGenres = [...formData.genres];
    if (finalGenres.includes('Other:')) {
      finalGenres = finalGenres.filter(g => g !== 'Other:');
      if (formData.otherGenre) {
        finalGenres.push(formData.otherGenre);
      }
    }

    // Prepare contentType & status value
    const finalContentType = formData.contentType === 'Other:' ? formData.otherContentType : formData.contentType;
    const finalStatus = formData.status === 'Other:' ? formData.otherStatus : formData.status;

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      contentName: formData.contentName,
      language: formData.language,
      genres: finalGenres,
      actors: formData.actors,
      directors: formData.directors,
      thumbnailLink: formData.thumbnailLink,
      sliderLink: formData.sliderLink,
      posterLink: formData.posterLink,
      trailerLink: formData.trailerLink,
      videoLink: formData.videoLink,
      description: formData.description,
      contentType: finalContentType,
      duration: formData.duration,
      ageRating: formData.ageRating,
      content18Plus: formData.content18Plus,
      status: finalStatus,
      paymentDescription: formData.paymentDescription,
      paymentMethod: formData.paymentMethod
    };

    if (formData.paymentMethod === 'PhonePe') {
      try {
        const response = await fetch('/api/payment/phonepe/initiate-submission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            submissionData: payload
          })
        });

        const data = await response.json();
        if (response.ok && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          showNotification(data.message || 'Failed to initiate PhonePe payment', 'error');
          setProcessing(false);
        }
      } catch (err) {
        console.error(err);
        showNotification('Network error during PhonePe initiation', 'error');
        setProcessing(false);
      }
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showNotification('Submission successfully completed! Under Review.', 'success');
        setTimeout(() => {
          if (token) {
            navigate('/user/profile');
          } else {
            navigate('/');
          }
        }, 3000);
      } else {
        const errorData = await response.json();
        showNotification(errorData.message || 'Submission failed. Please try again.', 'error');
        setProcessing(false);
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error during submission', 'error');
      setProcessing(false);
    }
  };

  return (
    <FrontendLayout isTransparent={true}>
      {notification && (
        <div className="custom-alert-box-v">
          <div className="alert-content-v">
            {notification.type === 'success' ? (
              <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
            ) : (
              <XCircle size={42} color="#ff4d4d" strokeWidth={2.5} />
            )}
            <span className="alert-text-v">{notification.message}</span>
          </div>
        </div>
      )}

      {processing && (
        <div className="fe-plans-loader-overlay-v">
          <Loader2 size={50} className="spinner-v" />
          <p style={{ marginTop: '15px', fontWeight: 600, color: '#fff' }}>Saving your submission details...</p>
        </div>
      )}

      <div className="fe-submission-page-v">
        <div className="fe-submission-header-v">
          <span className="fe-sub-tag-v">CREATORS PANEL</span>
          <h1>Short Film & Web Series <span>Submission</span></h1>
          <p>Submit your creative projects directly to Lemo OTT. Complete the form details and pay review fees to initiate the review cycle.</p>
        </div>

        {/* Multi-step progress bar */}
        {!paymentSuccessTxn && (
          <div className="fe-stepper-v">
            <div className={`step-item-v ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-num-v">
                {step > 1 ? <Check size={16} /> : '1'}
              </div>
              <span>Submission Details</span>
            </div>
            <div className="step-line-v"></div>
            <div className={`step-item-v ${step === 2 ? 'active' : ''}`}>
              <div className="step-num-v">2</div>
              <span>Payment details</span>
            </div>
          </div>
        )}

        {/* Main Glassmorphic Form Container / Success Container */}
        {paymentSuccessTxn ? (
          <div className="fe-submission-success-card animate-fade-in-v">
            <CheckCircle2 size={80} color="#b3d332" style={{ margin: '0 auto 25px', display: 'block' }} />
            <h2>Submission & Payment Successful!</h2>
            <p className="success-desc-v">
              Your creative project details have been successfully uploaded and the review fee of <strong>₹500</strong> has been processed via PhonePe.
            </p>
            <div className="success-txn-box-v">
              <span>TRANSACTION ID</span>
              <strong>{paymentSuccessTxn}</strong>
            </div>
            <div className="success-actions-v">
              <button 
                type="button" 
                className="btn-primary-v" 
                onClick={() => {
                  // Reset form for a new submission
                  setPaymentSuccessTxn(null);
                  setStep(1);
                  setFormData({
                    name: loggedInUser.username || loggedInUser.name || '',
                    email: loggedInUser.email || '',
                    phone: '',
                    contentName: '',
                    language: '',
                    genres: [],
                    otherGenre: '',
                    actors: '',
                    directors: '',
                    thumbnailLink: '',
                    sliderLink: '',
                    posterLink: '',
                    trailerLink: '',
                    videoLink: '',
                    description: '',
                    contentType: '',
                    otherContentType: '',
                    duration: '',
                    ageRating: '',
                    content18Plus: '',
                    status: '',
                    otherStatus: '',
                    paymentDescription: '',
                    paymentMethod: 'PhonePe'
                  });
                  setValidationErrors({});
                  fetchUserSubmissions();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Submit Another <ArrowRight size={18} />
              </button>
              <button 
                type="button" 
                className="btn-secondary-v" 
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (token) {
                    navigate('/user/profile');
                  } else {
                    navigate('/');
                  }
                }}
              >
                {localStorage.getItem('token') ? 'Go to Profile' : 'Go to Home'} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="fe-submission-form-card">
            {step === 1 ? (
            <div className="form-section-v animate-fade-in-v">
              <div className="section-title-wrapper-v">
                <FileText size={20} color="#b3d332" />
                <h2>Section 1 of 2: Film/Series Details</h2>
              </div>
              
              <div className="form-grid-v">
                {/* Name */}
                <div className={`form-group-v ${validationErrors.name ? 'has-error' : ''}`}>
                  <label>Name <span className="req-star">*</span></label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Enter your name"
                  />
                  {validationErrors.name && <span className="error-text-v">{validationErrors.name}</span>}
                </div>

                {/* Email Address */}
                <div className={`form-group-v ${validationErrors.email ? 'has-error' : ''}`}>
                  <label>Email Address <span className="req-star">*</span></label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="Enter your email address"
                  />
                  {validationErrors.email && <span className="error-text-v">{validationErrors.email}</span>}
                </div>

                {/* Phone Number */}
                <div className={`form-group-v ${validationErrors.phone ? 'has-error' : ''}`}>
                  <label>Phone Number <span className="req-star">*</span></label>
                  <input 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="Enter your phone number"
                  />
                  {validationErrors.phone && <span className="error-text-v">{validationErrors.phone}</span>}
                </div>

                {/* Short Film/Web Series Name */}
                <div className={`form-group-v ${validationErrors.contentName ? 'has-error' : ''}`}>
                  <label>Short Film / Web Series Name <span className="req-star">*</span></label>
                  <input 
                    type="text" 
                    name="contentName" 
                    value={formData.contentName} 
                    onChange={handleChange} 
                    placeholder="Enter short film or web series name"
                  />
                  {validationErrors.contentName && <span className="error-text-v">{validationErrors.contentName}</span>}
                </div>

                {/* Language */}
                <div className={`form-group-v ${validationErrors.language ? 'has-error' : ''}`}>
                  <label>Language <span className="req-star">*</span></label>
                  <select name="language" value={formData.language} onChange={handleChange}>
                    <option value="">Select Language</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Malayalam">Malayalam</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Marathi">Marathi</option>
                  </select>
                  {validationErrors.language && <span className="error-text-v">{validationErrors.language}</span>}
                </div>

                {/* Content Type */}
                <div className={`form-group-v ${validationErrors.contentType ? 'has-error' : ''}`}>
                  <label>Content Type <span className="req-star">*</span></label>
                  <div className="radio-group-v">
                    <label className="radio-label-v">
                      <input 
                        type="radio" 
                        name="contentType" 
                        value="Short Film"
                        checked={formData.contentType === 'Short Film'}
                        onChange={handleChange}
                      />
                      <span>Short Film</span>
                    </label>
                    <label className="radio-label-v">
                      <input 
                        type="radio" 
                        name="contentType" 
                        value="Web Series"
                        checked={formData.contentType === 'Web Series'}
                        onChange={handleChange}
                      />
                      <span>Web Series</span>
                    </label>
                    <label className="radio-label-v">
                      <input 
                        type="radio" 
                        name="contentType" 
                        value="Other:"
                        checked={formData.contentType === 'Other:'}
                        onChange={handleChange}
                      />
                      <span>Other</span>
                    </label>
                  </div>
                  {formData.contentType === 'Other:' && (
                    <input 
                      type="text" 
                      name="otherContentType" 
                      value={formData.otherContentType} 
                      onChange={handleChange} 
                      placeholder="Specify other content type"
                      style={{ marginTop: '10px' }}
                    />
                  )}
                  {(validationErrors.contentType || validationErrors.otherContentType) && (
                    <span className="error-text-v">{validationErrors.contentType || validationErrors.otherContentType}</span>
                  )}
                </div>

                {/* Duration */}
                <div className={`form-group-v ${validationErrors.duration ? 'has-error' : ''}`}>
                  <label>Duration <span className="req-star">*</span></label>
                  <input 
                    type="text" 
                    name="duration" 
                    value={formData.duration} 
                    onChange={handleChange} 
                    placeholder="Example : 2h 15m"
                  />
                  {validationErrors.duration && <span className="error-text-v">{validationErrors.duration}</span>}
                </div>

                {/* Age Rating */}
                <div className={`form-group-v ${validationErrors.ageRating ? 'has-error' : ''}`}>
                  <label>Age Rating <span className="req-star">*</span></label>
                  <select name="ageRating" value={formData.ageRating} onChange={handleChange}>
                    <option value="">Select Age Rating</option>
                    <option value="U">U</option>
                    <option value="U/A 7+">U/A 7+</option>
                    <option value="U/A 13+">U/A 13+</option>
                    <option value="U/A 16+">U/A 16+</option>
                    <option value="A (18+)">A (18+)</option>
                  </select>
                  {validationErrors.ageRating && <span className="error-text-v">{validationErrors.ageRating}</span>}
                </div>

                {/* 18+ Content */}
                <div className={`form-group-v ${validationErrors.content18Plus ? 'has-error' : ''}`}>
                  <label>18+ Content <span className="req-star">*</span></label>
                  <div className="radio-group-v">
                    <label className="radio-label-v">
                      <input 
                        type="radio" 
                        name="content18Plus" 
                        value="Yes"
                        checked={formData.content18Plus === 'Yes'}
                        onChange={handleChange}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="radio-label-v">
                      <input 
                        type="radio" 
                        name="content18Plus" 
                        value="No"
                        checked={formData.content18Plus === 'No'}
                        onChange={handleChange}
                      />
                      <span>No</span>
                    </label>
                  </div>
                  {validationErrors.content18Plus && <span className="error-text-v">{validationErrors.content18Plus}</span>}
                </div>

                {/* Status */}
                <div className={`form-group-v ${validationErrors.status ? 'has-error' : ''}`}>
                  <label>Status <span className="req-star">*</span></label>
                  <div className="radio-group-v">
                    <label className="radio-label-v">
                      <input 
                        type="radio" 
                        name="status" 
                        value="Active"
                        checked={formData.status === 'Active'}
                        onChange={handleChange}
                      />
                      <span>Active</span>
                    </label>
                    <label className="radio-label-v">
                      <input 
                        type="radio" 
                        name="status" 
                        value="Inactive"
                        checked={formData.status === 'Inactive'}
                        onChange={handleChange}
                      />
                      <span>Inactive</span>
                    </label>
                    <label className="radio-label-v">
                      <input 
                        type="radio" 
                        name="status" 
                        value="Upcoming"
                        checked={formData.status === 'Upcoming'}
                        onChange={handleChange}
                      />
                      <span>Upcoming</span>
                    </label>
                    <label className="radio-label-v">
                      <input 
                        type="radio" 
                        name="status" 
                        value="Other:"
                        checked={formData.status === 'Other:'}
                        onChange={handleChange}
                      />
                      <span>Other</span>
                    </label>
                  </div>
                  {formData.status === 'Other:' && (
                    <input 
                      type="text" 
                      name="otherStatus" 
                      value={formData.otherStatus} 
                      onChange={handleChange} 
                      placeholder="Specify other status"
                      style={{ marginTop: '10px' }}
                    />
                  )}
                  {(validationErrors.status || validationErrors.otherStatus) && (
                    <span className="error-text-v">{validationErrors.status || validationErrors.otherStatus}</span>
                  )}
                </div>
              </div>

              {/* Genres Checklist */}
              <div className={`form-group-v genre-section-v ${validationErrors.genres ? 'has-error' : ''}`}>
                <label>Genres <span className="req-star">*</span></label>
                <div className="genres-grid-v">
                  {GENRES_LIST.map(genre => (
                    <label key={genre} className="genre-checkbox-label-v">
                      <input 
                        type="checkbox"
                        checked={formData.genres.includes(genre)}
                        onChange={() => handleGenreChange(genre)}
                      />
                      <span className="chk-box-v"></span>
                      <span>{genre === 'Other:' ? 'Other' : genre}</span>
                    </label>
                  ))}
                </div>
                {formData.genres.includes('Other:') && (
                  <input 
                    type="text" 
                    name="otherGenre" 
                    value={formData.otherGenre} 
                    onChange={handleChange} 
                    placeholder="Specify other genre"
                    style={{ marginTop: '15px', maxWidth: '300px' }}
                  />
                )}
                {(validationErrors.genres || validationErrors.otherGenre) && (
                  <span className="error-text-v" style={{ marginTop: '8px', display: 'block' }}>{validationErrors.genres || validationErrors.otherGenre}</span>
                )}
              </div>

              <div className="form-grid-v">
                {/* Actors */}
                <div className={`form-group-v full-width-v ${validationErrors.actors ? 'has-error' : ''}`}>
                  <label>Actors <span className="req-star">*</span></label>
                  <input 
                    type="text" 
                    name="actors" 
                    value={formData.actors} 
                    onChange={handleChange} 
                    placeholder="Enter actor names separated by commas"
                  />
                  {validationErrors.actors && <span className="error-text-v">{validationErrors.actors}</span>}
                </div>

                {/* Directors */}
                <div className={`form-group-v full-width-v ${validationErrors.directors ? 'has-error' : ''}`}>
                  <label>Directors <span className="req-star">*</span></label>
                  <input 
                    type="text" 
                    name="directors" 
                    value={formData.directors} 
                    onChange={handleChange} 
                    placeholder="Enter Directors names separated by commas"
                  />
                  {validationErrors.directors && <span className="error-text-v">{validationErrors.directors}</span>}
                </div>

                {/* Thumbnail Drive Link */}
                <div className={`form-group-v full-width-v ${validationErrors.thumbnailLink ? 'has-error' : ''}`}>
                  <div className="label-row-v">
                    <label>Thumbnail Image Drive Link <span className="req-star">*</span></label>
                    <span className="info-side-v">(Recommended resolution : 180x140)</span>
                  </div>
                  <input 
                    type="text" 
                    name="thumbnailLink" 
                    value={formData.thumbnailLink} 
                    onChange={handleChange} 
                    placeholder="Enter Google Drive URL for Thumbnail"
                  />
                  {validationErrors.thumbnailLink && <span className="error-text-v">{validationErrors.thumbnailLink}</span>}
                </div>

                {/* Slider Image Drive Link */}
                <div className={`form-group-v full-width-v ${validationErrors.sliderLink ? 'has-error' : ''}`}>
                  <div className="label-row-v">
                    <label>Slider Image Drive Link <span className="req-star">*</span></label>
                    <span className="info-side-v">(Recommended resolution : 1920x1080 / 16:9 aspect ratio)</span>
                  </div>
                  <input 
                    type="text" 
                    name="sliderLink" 
                    value={formData.sliderLink} 
                    onChange={handleChange} 
                    placeholder="Enter Google Drive URL for Slider"
                  />
                  {validationErrors.sliderLink && <span className="error-text-v">{validationErrors.sliderLink}</span>}
                </div>

                {/* Poster Image Drive Link */}
                <div className={`form-group-v full-width-v ${validationErrors.posterLink ? 'has-error' : ''}`}>
                  <div className="label-row-v">
                    <label>Poster Image Drive Link <span className="req-star">*</span></label>
                    <span className="info-side-v">(Recommended resolution : 800x450)</span>
                  </div>
                  <input 
                    type="text" 
                    name="posterLink" 
                    value={formData.posterLink} 
                    onChange={handleChange} 
                    placeholder="Enter Google Drive URL for Poster"
                  />
                  {validationErrors.posterLink && <span className="error-text-v">{validationErrors.posterLink}</span>}
                </div>

                {/* Trailer Drive Link */}
                <div className={`form-group-v full-width-v ${validationErrors.trailerLink ? 'has-error' : ''}`}>
                  <label>Trailer Drive Link <span style={{ color: '#666', fontSize: '0.75rem', fontWeight: 600 }}>(Optional)</span></label>
                  <input 
                    type="text" 
                    name="trailerLink" 
                    value={formData.trailerLink} 
                    onChange={handleChange} 
                    placeholder="Enter google drive url for trailer"
                  />
                  {validationErrors.trailerLink && <span className="error-text-v">{validationErrors.trailerLink}</span>}
                </div>

                {/* Video File Drive Link */}
                <div className={`form-group-v full-width-v ${validationErrors.videoLink ? 'has-error' : ''}`}>
                  <label>Video File Drive Link <span className="req-star">*</span></label>
                  <input 
                    type="text" 
                    name="videoLink" 
                    value={formData.videoLink} 
                    onChange={handleChange} 
                    placeholder="Enter google drive url for main video file"
                  />
                  {validationErrors.videoLink && <span className="error-text-v">{validationErrors.videoLink}</span>}
                </div>
              </div>

              {/* Description */}
              <div className={`form-group-v ${validationErrors.description ? 'has-error' : ''}`} style={{ marginTop: '20px' }}>
                <label>Description <span className="req-star">*</span></label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows="5"
                  placeholder="Enter content synopsis / details..."
                />
                {validationErrors.description && <span className="error-text-v">{validationErrors.description}</span>}
              </div>

              {/* Action Buttons */}
              <div className="form-actions-v" style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-primary-v submit-btn-v" onClick={handleNext}>
                  Next Section <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="form-section-v animate-fade-in-v">
              <div className="section-title-wrapper-v">
                <CreditCard size={20} color="#b3d332" />
                <h2>Section 2 of 2: Review Fees & Payment Details</h2>
              </div>

              <div className="payment-notice-v">
                <AlertCircle size={20} color="#b3d332" />
                <p>
                  Submission Review Fees: <strong>₹500 /-</strong>. Pay the reviewing fee online using PhonePe gateway to complete the submission process.
                </p>
              </div>

              {/* Payment Methods */}
              <div className="payment-grid-v">
                <div className="payment-instructions-v">
                  <h4>PhonePe Online Checkout</h4>
                  <p>You will be securely redirected to the PhonePe checkout gateway to pay the submission review fee of <strong>₹500</strong> online using UPI, Card, or NetBanking.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-actions-v" style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn-secondary-v back-btn-v" onClick={handleBack}>
                  <ArrowLeft size={18} /> Back
                </button>
                <button type="button" className="btn-primary-v submit-btn-v" onClick={handleSubmit}>
                  Pay ₹500 & Submit <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Your Previous Submissions Section */}
        {userSubmissions.filter(sub => sub.paymentStatus === 'Completed').length > 0 && (
          <div className="fe-previous-submissions-card animate-fade-in-v" style={{ marginTop: '50px' }}>
            <div className="section-title-wrapper-v">
              <Film size={20} color="#b3d332" />
              <h2>Your Submissions ({userSubmissions.filter(sub => sub.paymentStatus === 'Completed').length})</h2>
            </div>
            
            <div className="submissions-list-table-v">
              <table>
                <thead>
                  <tr>
                    <th>Content Name</th>
                    <th>Type</th>
                    <th>Language</th>
                    <th>Submitted On</th>
                    <th>Review Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userSubmissions.filter(sub => sub.paymentStatus === 'Completed').map((sub) => (
                    <tr key={sub._id}>
                      <td className="content-name-td">{sub.contentName}</td>
                      <td>{sub.contentType}</td>
                      <td>{sub.language}</td>
                      <td>
                        <span className="date-display-v">
                          <Calendar size={13} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} />
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className={`review-status-badge-v ${(sub.reviewStatus || 'Under Review').toLowerCase().replace(/\s+/g, '-')}`}>
                          {sub.reviewStatus === 'Under Review' ? <Clock size={12} style={{ marginRight: '5px', display: 'inline', verticalAlign: 'middle' }} /> : null}
                          {sub.reviewStatus === 'Approved' ? <CheckCircle2 size={12} style={{ marginRight: '5px', display: 'inline', verticalAlign: 'middle' }} /> : null}
                          {sub.reviewStatus === 'Rejected' ? <XCircle size={12} style={{ marginRight: '5px', display: 'inline', verticalAlign: 'middle' }} /> : null}
                          {sub.reviewStatus || 'Under Review'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .fe-submission-page-v { min-height: 100vh; background: #050505; padding: 140px 5% 80px; color: #fff; }
        
        .fe-submission-success-card { max-width: 600px; margin: 0 auto; background: rgba(10, 10, 10, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(179,211,50,0.2); border-radius: 24px; padding: 50px 40px; text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
        .fe-submission-success-card h2 { font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0 0 15px 0; }
        .success-desc-v { font-size: 1.05rem; color: #aaa; line-height: 1.6; margin-bottom: 30px; }
        .success-desc-v strong { color: #b3d332; }
        .success-txn-box-v { background: #070707; border: 1px solid #1a1a1a; border-radius: 12px; padding: 16px 20px; display: inline-flex; flex-direction: column; gap: 6px; margin-bottom: 40px; text-align: center; min-width: 280px; }
        .success-txn-box-v span { font-size: 0.72rem; font-weight: 800; color: #666; letter-spacing: 1.5px; }
        .success-txn-box-v strong { color: #b3d332; font-family: monospace; font-size: 1.15rem; }
        .success-actions-v { display: flex; justify-content: center; }
        
        .fe-submission-header-v { max-width: 800px; margin: 0 auto 50px; text-align: center; }
        .fe-sub-tag-v { font-size: 0.75rem; font-weight: 800; color: #b3d332; letter-spacing: 3px; display: block; margin-bottom: 15px; }
        .fe-submission-header-v h1 { font-size: clamp(2.2rem, 4.5vw, 3.8rem); font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
        .fe-submission-header-v h1 span { color: #b3d332; }
        .fe-submission-header-v p { font-size: 1.05rem; color: #888; line-height: 1.6; }

        /* Stepper progress bar */
        .fe-stepper-v { display: flex; align-items: center; justify-content: center; max-width: 600px; margin: 0 auto 40px; gap: 15px; }
        .step-item-v { display: flex; align-items: center; gap: 10px; color: #555; font-weight: 600; font-size: 0.9rem; transition: 0.3s; }
        .step-item-v.active { color: #b3d332; }
        .step-item-v.completed { color: #fff; }
        .step-num-v { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #555; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; transition: 0.3s; }
        .step-item-v.active .step-num-v { border-color: #b3d332; background: rgba(179,211,50,0.1); color: #b3d332; }
        .step-item-v.completed .step-num-v { border-color: #b3d332; background: #b3d332; color: #000; }
        .step-line-v { height: 2px; width: 60px; background: #222; flex-grow: 0; }
        .step-item-v.completed + .step-line-v { background: #b3d332; }

        /* Form Card Layout */
        .fe-submission-form-card { max-width: 900px; margin: 0 auto; background: rgba(10, 10, 10, 0.6); backdrop-filter: blur(20px); border: 1px solid #1a1a1a; border-radius: 24px; padding: 45px; box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
        
        .section-title-wrapper-v { display: flex; align-items: center; gap: 12px; margin-bottom: 35px; padding-bottom: 15px; border-bottom: 1px solid #1a1a1a; }
        .section-title-wrapper-v h2 { font-size: 1.4rem; font-weight: 800; color: #fff; margin: 0; }

        .fe-submission-page-v .form-grid-v { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }

        .form-group-v { display: flex; flex-direction: column; gap: 8px; text-align: left; }
        .form-group-v.full-width-v { grid-column: 1 / -1; }
        .label-row-v { display: flex; justify-content: space-between; align-items: baseline; width: 100%; gap: 10px; }
        .info-side-v { font-size: 0.72rem; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group-v label { font-size: 0.85rem; font-weight: 700; color: #aaa; letter-spacing: 0.5px; text-transform: uppercase; margin: 0; }
        .req-star { color: #ff4d4d; margin-left: 2px; }

        .form-group-v input[type="text"],
        .form-group-v input[type="email"],
        .form-group-v select,
        .form-group-v textarea { background: #070707; border: 1px solid #222; border-radius: 10px; padding: 14px 16px; color: #fff; font-size: 0.95rem; font-weight: 500; transition: 0.3s; outline: none; width: 100%; box-sizing: border-box; }

        .form-group-v input:focus,
        .form-group-v select:focus,
        .form-group-v textarea:focus { border-color: #b3d332; box-shadow: 0 0 15px rgba(179,211,50,0.15); background: #0c0c0c; }

        /* Error States */
        .form-group-v.has-error input,
        .form-group-v.has-error select,
        .form-group-v.has-error textarea { border-color: #ff4d4d !important; }
        .error-text-v { color: #ff4d4d; font-size: 0.8rem; font-weight: 700; }

        /* Radio Options custom */
        .radio-group-v { display: flex; flex-direction: column; gap: 12px; margin-top: 5px; }
        .radio-group-v.horizontal-v { flex-direction: row; gap: 30px; }
        .radio-label-v { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem; font-weight: 600; color: #ccc; transition: 0.2s; }
        .radio-label-v input[type="radio"] { appearance: none; -webkit-appearance: none; width: 18px; height: 18px; border: 2px solid #444; border-radius: 50%; outline: none; cursor: pointer; transition: 0.2s; position: relative; margin: 0; }
        .radio-label-v input[type="radio"]:checked { border-color: #b3d332; }
        .radio-label-v input[type="radio"]:checked::after { content: ''; position: absolute; top: 4px; left: 4px; width: 6px; height: 6px; background: #b3d332; border-radius: 50%; }
        .radio-label-v:hover { color: #fff; }

        /* Genre Checkboxes Grid */
        .genre-section-v { margin-top: 30px; margin-bottom: 30px; }
        .genres-grid-v { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; margin-top: 10px; }
        .genre-checkbox-label-v { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #bbb; transition: 0.2s; position: relative; }
        .genre-checkbox-label-v input[type="checkbox"] { display: none; }
        .chk-box-v { width: 18px; height: 18px; border: 2px solid #444; border-radius: 4px; display: inline-block; position: relative; transition: 0.2s; }
        .genre-checkbox-label-v input:checked + .chk-box-v { border-color: #b3d332; background: rgba(179,211,50,0.1); }
        .genre-checkbox-label-v input:checked + .chk-box-v::after { content: '✓'; position: absolute; top: -1px; left: 3px; font-size: 11px; color: #b3d332; font-weight: 900; }
        .genre-checkbox-label-v:hover { color: #fff; }

        /* Step 2: Payment notice & Details */
        .payment-notice-v { display: flex; align-items: center; gap: 12px; background: rgba(179,211,50,0.08); border: 1px solid rgba(179,211,50,0.2); border-radius: 12px; padding: 16px 20px; margin-bottom: 30px; color: #ddd; font-size: 0.95rem; line-height: 1.5; }
        .payment-notice-v p strong { color: #b3d332; font-size: 1.1rem; }
        
        .payment-grid-v { display: flex; flex-direction: column; gap: 20px; }
        .payment-instructions-v { background: #070707; border: 1px solid #1a1a1a; border-radius: 16px; padding: 25px; text-align: left; }
        .payment-instructions-v h4 { font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0 0 10px 0; }
        .payment-instructions-v p { font-size: 0.9rem; color: #888; margin: 0 0 20px 0; }
        
        .upi-id-box-v { display: flex; align-items: center; justify-content: space-between; background: #000; border: 1px solid #222; border-radius: 10px; padding: 12px 16px; max-width: 320px; }
        .upi-id-box-v code { color: #b3d332; font-size: 1.1rem; font-weight: 700; font-family: monospace; }
        .upi-id-box-v button { background: transparent; border: none; color: #888; cursor: pointer; transition: 0.2s; padding: 6px; border-radius: 6px; display: flex; align-items: center; }
        .upi-id-box-v button:hover { color: #fff; background: rgba(255,255,255,0.05); }

        .bank-details-box-v { background: #000; border: 1px solid #222; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; max-width: 450px; }
        .bank-details-box-v p { font-size: 0.95rem; color: #ccc; margin: 0; display: flex; justify-content: space-between; }
        .bank-details-box-v p strong { color: #888; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; }
        .copy-bank-btn-v { margin-top: 10px; align-self: flex-start; }

        /* Buttons Styling */
        .btn-primary-v { background: #b3d332; color: #000; border: none; padding: 14px 28px; border-radius: 10px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px; justify-content: center; box-shadow: 0 5px 15px rgba(179,211,50,0.25); outline: none; }
        .btn-primary-v:hover { background: #c3e342; transform: scale(1.02); box-shadow: 0 8px 25px rgba(179,211,50,0.45); }
        
        .btn-secondary-v { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 14px 28px; border-radius: 10px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px; justify-content: center; outline: none; }
        .btn-secondary-v:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); }

        /* Animations & Modals */
        .animate-fade-in-v { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* Alert and Loader custom */
        .custom-alert-box-v { position: fixed; top: 40px; left: 50%; transform: translateX(-50%); background: #0a0a0a; border-radius: 12px; padding: 25px 50px; z-index: 99999; box-shadow: 0 20px 50px rgba(0,0,0,0.8); border: 1px solid #1a1a1a; animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .alert-content-v { display: flex; flex-direction: column; align-items: center; gap: 15px; }
        .alert-text-v { color: #fff; font-size: 1.05rem; font-weight: 800; text-align: center; }
        @keyframes slideDown { from { transform: translate(-50%, -150%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

        .fe-plans-loader-overlay-v { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(5,5,5,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 99999; }
        .spinner-v { animation: spin 1s linear infinite; color: #b3d332; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Previous Submissions Card & Table */
        .fe-previous-submissions-card { max-width: 900px; margin: 50px auto 0; background: rgba(10, 10, 10, 0.6); backdrop-filter: blur(20px); border: 1px solid #1a1a1a; border-radius: 24px; padding: 45px; box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
        .submissions-list-table-v { overflow-x: auto; margin-top: 20px; }
        .submissions-list-table-v table { width: 100%; border-collapse: collapse; min-width: 650px; text-align: left; }
        .submissions-list-table-v th { padding: 15px 20px; border-bottom: 2px solid #222; color: #888; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .submissions-list-table-v td { padding: 18px 20px; border-bottom: 1px solid #141414; font-size: 0.95rem; color: #ccc; font-weight: 500; }
        .submissions-list-table-v tr:hover td { background: rgba(255,255,255,0.02); color: #fff; }
        
        .content-name-td { font-weight: 700 !important; color: #fff !important; }
        .date-display-v { font-size: 0.9rem; color: #999; display: flex; align-items: center; }
        
        /* Badges */
        .payment-status-badge-v { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .payment-status-badge-v.completed { background: rgba(0, 200, 83, 0.1); color: #00c853; border: 1px solid rgba(0, 200, 83, 0.2); }
        .payment-status-badge-v.pending { background: rgba(255, 179, 0, 0.1); color: #ffb300; border: 1px solid rgba(255, 179, 0, 0.2); }
        .payment-status-badge-v.failed { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.2); }

        .review-status-badge-v { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .review-status-badge-v.under-review { background: rgba(0, 188, 212, 0.1); color: #00bcd4; border: 1px solid rgba(0, 188, 212, 0.2); }
        .review-status-badge-v.approved { background: rgba(0, 200, 83, 0.1); color: #00c853; border: 1px solid rgba(0, 200, 83, 0.2); }
        .review-status-badge-v.rejected { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.2); }
        .review-status-badge-v.on-hold { background: rgba(255, 179, 0, 0.1); color: #ffb300; border: 1px solid rgba(255, 179, 0, 0.2); }

        @media (max-width: 1024px) {
          .fe-submission-page-v { padding: 120px 6% 60px; }
          .fe-submission-form-card, .fe-previous-submissions-card { padding: 35px 25px; }
        }
        @media (max-width: 768px) {
          .fe-submission-page-v { padding: 110px 4% 50px; }
          .fe-submission-form-card, .fe-previous-submissions-card { padding: 30px 20px; border-radius: 16px; }
          .fe-submission-header-v h1 { font-size: 2rem; }
          .fe-submission-header-v p { font-size: 0.95rem; }
          .fe-submission-page-v .form-grid-v { grid-template-columns: repeat(2, 1fr); }
          .genres-grid-v { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
          .radio-group-v.horizontal-v { flex-direction: column; gap: 10px; }
        }
        @media (max-width: 576px) {
          .fe-stepper-v { gap: 10px; }
          .step-line-v { width: 30px; }
          .step-item-v span { font-size: 0.8rem; }
          .label-row-v { flex-direction: column; align-items: flex-start; gap: 2px; }
          .info-side-v { font-size: 0.68rem; margin-top: 2px; }
          .fe-submission-page-v .form-grid-v { grid-template-columns: 1fr; }
          .genres-grid-v { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 400px) {
          .fe-stepper-v { gap: 8px; }
          .step-line-v { width: 20px; }
          .step-item-v span { display: none; }
          .fe-submission-form-card { padding: 25px 15px; }
        }
      ` }} />
    </FrontendLayout>
  );
};

export default FrontendSubmission;
