import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Loader from '../components/Loader';

const AddHomeSection = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
  title: '',
  sectionType: '',
  status: 'Active',
  limit: 10,
  order: 0
 });

 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
 };

 const handleSave = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
   const response = await fetch('/api/home-sections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });
   if (response.ok) {
    navigate('/admin/home/sections');
   }
  } catch (err) {
   console.error('Error saving home section:', err);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="add-actor-page">
   <div className="top-nav">
    <button className="back-link" onClick={() => navigate(-1)}>
     <ArrowLeft size={20} color="#b3d332" strokeWidth={3} />
     <span>Back</span>
    </button>
   </div>

   <form onSubmit={handleSave} className="actor-form-compact">
    <div className="form-row-custom">
     <label>Home Section Title*</label>
     <div className="input-col">
      <input 
       type="text" 
       name="title" 
       value={formData.title} 
       onChange={handleChange} 
       required 
      />
     </div>
    </div>

    <div className="form-row-custom">
     <label>Type</label>
     <div className="input-col">
       <select name="sectionType" value={formData.sectionType} onChange={handleChange}>
        <option value="">Select</option>
        <option value="Movie">Movie</option>
        <option value="New Release">New Release</option>
        <option value="Short Film">Short Film</option>
        <option value="Short Web Series">Short Web Series</option>
        <option value="Shows">Shows</option>
        <option value="Sports">Sports</option>
        <option value="Live TV">Live TV</option>
       </select>
     </div>
    </div>

    <div className="form-row-custom">
     <label>Limit (Items Count)</label>
     <div className="input-col">
      <input 
       type="number" 
       name="limit" 
       value={formData.limit} 
       onChange={(e) => setFormData(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))}
       min={1}
       max={100}
       required 
      />
     </div>
    </div>

    <div className="form-row-custom">
     <label>Display Order</label>
     <div className="input-col">
      <input 
       type="number" 
       name="order" 
       value={formData.order} 
       onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
       min={0}
       required 
      />
     </div>
    </div>

    <div className="form-row-custom">
     <label>Status</label>
     <div className="input-col">
      <select name="status" value={formData.status} onChange={handleChange}>
       <option value="Active">Active</option>
       <option value="Inactive">Inactive</option>
      </select>
     </div>
    </div>

    <div className="form-footer">
     <button type="submit" className="save-btn-red" disabled={loading}>
      {loading ? <Loader size="small" inline={true} /> : 'Save'}
     </button>
    </div>
   </form>

   <style dangerouslySetInnerHTML={{ __html: `
    .add-actor-page { padding: 20px 30px; animation: fadeIn 0.4s ease-out; }
    .top-nav { margin-bottom: 30px; }
    .back-link { background: none; border: none; display: flex; align-items: center; gap: 10px; color: #b3d332; font-weight: 800; font-size: 1.2rem; cursor: pointer; padding: 0; }
    
    .actor-form-compact { max-width: 900px; background: #1a1a1a; padding: 40px; border-radius: 12px; border: 1px solid #333; }
    .form-row-custom { display: flex; margin-bottom: 15px; align-items: center; }
    .form-row-custom label { width: 180px; color: #fff; font-size: 1rem; font-weight: 600; }
    .input-col { flex: 1; }
    
    .input-col input[type="text"], 
    .input-col select {
     width: 100%; background: #262626; border: 1px solid #333; padding: 12px 20px; color: #fff; border-radius: 4px; outline: none; font-size: 1rem; appearance: none;
    }
    .input-col select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 15px center; background-size: 18px; }

    .form-footer { margin-top: 30px; display: flex; justify-content: flex-start; padding-left: 180px; }
    .save-btn-red { background: #b3d332; color: #fff; border: none; padding: 10px 35px; border-radius: 4px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: opacity 0.2s; }
    .save-btn-red:hover { opacity: 0.9; }
    .save-btn-red:disabled { opacity: 0.6; cursor: not-allowed; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
   ` }} />
  </div>
 );
};

export default AddHomeSection;
