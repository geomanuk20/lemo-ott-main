import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Image as ImageIcon, Video, HelpCircle } from 'lucide-react';
import { uploadToCloudinary } from '../utils/upload';
import Loader from '../components/Loader';

const API_URL = '/api/shorts';

const EditShort = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const thumbnailInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    status: 'Active',
    views: 0,
    likes: 0,
    access: 'Free',
    videoType: 'Local'
  });

  useEffect(() => {
    const fetchShortDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/${id}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({
            title: data.title || '',
            description: data.description || '',
            videoUrl: data.videoUrl || '',
            thumbnailUrl: data.thumbnailUrl || '',
            status: data.status || 'Active',
            views: data.views || 0,
            likes: data.likes || 0,
            access: data.access || 'Free',
            videoType: data.videoUrl && data.videoUrl.startsWith('http') && !data.videoUrl.includes('cloudinary') ? 'URL' : 'Local'
          });
        } else {
          alert('Failed to retrieve short video details.');
          navigate('/admin/shorts');
        }
      } catch (err) {
        console.error('Error fetching short:', err);
        alert('Error loading short details.');
        navigate('/admin/shorts');
      } finally {
        setFetching(false);
      }
    };

    fetchShortDetails();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const url = await uploadToCloudinary(file);
      if (url) {
        setFormData(prev => ({ ...prev, [field]: url }));
      } else {
        alert('File upload failed');
      }
    } catch (err) {
      alert('Error uploading file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!formData.videoUrl.trim()) {
      alert('Video source is required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        navigate('/admin/shorts');
      } else {
        const errorText = await response.text();
        alert(`Failed to update short: ${errorText}`);
      }
    } catch (err) {
      console.error('Error updating short:', err);
      alert('An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <Loader size="large" />;
  }

  return (
    <div className="add-short-page">
      <div className="top-nav">
        <button className="back-btn" onClick={() => navigate('/admin/shorts')}>
          <ArrowLeft size={18} />
          <span>Back to Shorts</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="short-form">
        <h2 className="section-title">Edit Short Video</h2>
        
        <div className="form-columns">
          <div className="form-column">
            <div className="form-group">
              <label>Short Title*</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="Enter Short title..." 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Enter short description..." 
                style={{ height: '120px', resize: 'none' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Access Level</label>
                <select name="access" value={formData.access} onChange={handleChange}>
                  <option value="Free">Free</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              
              <div className="form-group half">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Fake Views Override</label>
                <input 
                  type="number" 
                  name="views" 
                  value={formData.views} 
                  onChange={handleChange} 
                  min="0"
                />
              </div>
              
              <div className="form-group half">
                <label>Fake Likes Override</label>
                <input 
                  type="number" 
                  name="likes" 
                  value={formData.likes} 
                  onChange={handleChange} 
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-column">
            <div className="form-group">
              <label>Video Ingest Type</label>
              <select name="videoType" value={formData.videoType} onChange={handleChange}>
                <option value="Local">File Upload</option>
                <option value="URL">Direct Video URL</option>
              </select>
            </div>

            {formData.videoType === 'Local' ? (
              <div className="form-group">
                <label>Upload Vertical Video*</label>
                <div className="file-input-group">
                  <input 
                    type="text" 
                    name="videoUrl" 
                    value={formData.videoUrl} 
                    onChange={handleChange} 
                    placeholder="Upload video file or paste link..."
                    required
                  />
                  <button type="button" className="select-btn" onClick={() => videoInputRef.current.click()}>
                    <Video size={16} /> Upload
                  </button>
                  <input 
                    type="file" 
                    ref={videoInputRef} 
                    style={{ display: 'none' }} 
                    accept="video/*" 
                    onChange={(e) => handleFileChange(e, 'videoUrl')} 
                  />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>Direct Video URL*</label>
                <input 
                  type="text" 
                  name="videoUrl" 
                  value={formData.videoUrl} 
                  onChange={handleChange} 
                  placeholder="https://example.com/vertical-video.mp4" 
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Thumbnail Poster</label>
              <div className="file-input-group">
                <input 
                  type="text" 
                  name="thumbnailUrl" 
                  value={formData.thumbnailUrl} 
                  onChange={handleChange} 
                  placeholder="Upload image file or paste link..."
                />
                <button type="button" className="select-btn" onClick={() => thumbnailInputRef.current.click()}>
                  <ImageIcon size={16} /> Select
                </button>
                <input 
                  type="file" 
                  ref={thumbnailInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'thumbnailUrl')} 
                />
              </div>
              
              {formData.thumbnailUrl && (
                <div style={{ marginTop: '15px', width: '135px', aspectRatio: '9/16', borderRadius: '8px', border: '1px solid #2d313f', overflow: 'hidden' }}>
                  <img 
                    src={formData.thumbnailUrl} 
                    alt="Thumbnail Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-footer mt-40">
          <button type="submit" className="save-btn" disabled={loading}>
            <Save size={18} />
            <span>{loading ? 'Uploading...' : 'Update Short'}</span>
          </button>
        </div>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        .add-short-page { padding: 20px; background-color: #0c0c0c; min-height: 100vh; color: #fff; }
        .top-nav { margin-bottom: 25px; }
        .back-btn { background: transparent; border: none; color: #b3d332; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.2rem; cursor: pointer; }
        
        .section-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 30px; border-left: 5px solid #b3d332; padding-left: 15px; line-height: 1; }
        .form-columns { display: flex; gap: 50px; }
        .form-column { flex: 1; display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
        .form-group label { font-weight: 700; font-size: 1rem; }
        .form-group input, .form-group select, .form-group textarea { background: #1a1a1a; border: 1px solid #333; padding: 12px 15px; color: #fff; border-radius: 4px; outline: none; width: 100%; }
        .form-row { display: flex; gap: 20px; }
        .half { flex: 1; }
        
        .file-input-group { display: flex; }
        .file-input-group input { flex: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; }
        .select-btn { background: #444; color: #fff; border: none; padding: 0 15px; border-top-right-radius: 4px; border-bottom-right-radius: 4px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        
        .save-btn { background: #b3d332; color: #000; border: none; padding: 12px 40px; border-radius: 4px; display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: transform 0.2s; }
        .save-btn:hover { transform: translateY(-2px); }
        .save-btn:disabled { background: #555; cursor: not-allowed; }
        
        .mt-40 { margin-top: 40px; }
        
        @media (max-width: 768px) {
          .form-columns { flex-direction: column; gap: 20px; }
        }
      ` }} />
    </div>
  );
};

export default EditShort;
