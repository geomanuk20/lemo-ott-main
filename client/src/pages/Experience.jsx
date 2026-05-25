import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Plus, 
 Edit, 
 X, 
 RotateCw, 
 Loader2, 
 AlertTriangle,
 CheckCircle2,
 PlayCircle,
 Tv,
 Film,
 Zap,
 XCircle,
 Settings,
 Save,
 Globe,
 MonitorPlay,
 Shield
} from 'lucide-react';
import Loader from '../components/Loader';

const Experience = () => {
 const navigate = useNavigate();
 const [experiences, setExperiences] = useState([]);
 const [loading, setLoading] = useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [deletingId, setDeletingId] = useState(null);
 const [editingExp, setEditingExp] = useState(null);
 const [newExp, setNewExp] = useState({ title: '', description: '', icon: 'Globe', status: 'Active' });
 const [notification, setNotification] = useState(null);

 useEffect(() => {
  fetchExperiences();
 }, []);

 const fetchExperiences = async () => {
  setLoading(true);
  try {
   const response = await fetch('/api/experiences');
   if (!response.ok) throw new Error('Fetch failed');
   const data = await response.json();
   setExperiences(data);
  } catch (err) {
   console.error('Fetch error:', err);
  } finally {
   setLoading(false);
  }
 };

 const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 3000);
 };

 const handleStatusToggle = async (exp) => {
  const newStatus = exp.status === 'Active' ? 'Inactive' : 'Active';
  try {
   const response = await fetch(`/api/experiences/${exp._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
   });
   if (!response.ok) throw new Error('Update failed');
   
   setExperiences(prev => prev.map(e => 
    e._id === exp._id ? { ...e, status: newStatus } : e
   ));
   showNotification(`Status updated to ${newStatus}`);
  } catch (err) {
   showNotification('Failed to update status', 'error');
  }
 };

 const executeDelete = async () => {
  try {
   const response = await fetch(`/api/experiences/${deletingId}`, {
    method: 'DELETE'
   });
   if (!response.ok) throw new Error('Delete failed');
   
   setExperiences(prev => prev.filter(exp => exp._id !== deletingId));
   setIsDeleteModalOpen(false);
   showNotification('Experience removed from database');
  } catch (err) {
   showNotification('Failed to delete experience', 'error');
  }
 };

 const handleEdit = (exp) => {
  setEditingExp({ ...exp });
  setIsEditModalOpen(true);
 };

 const saveEdit = async () => {
  if (!editingExp.title || !editingExp.description) return showNotification('Required fields missing', 'error');
  
  try {
   const response = await fetch(`/api/experiences/${editingExp._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(editingExp)
   });
   if (!response.ok) throw new Error('Update failed');
   const updated = await response.json();

   setExperiences(prev => prev.map(exp => exp._id === updated._id ? updated : exp));
   setIsEditModalOpen(false);
   showNotification('Experience updated successfully');
  } catch (err) {
   showNotification('Failed to save changes', 'error');
  }
 };

 const handleAdd = async () => {
  if (!newExp.title || !newExp.description) return showNotification('Required fields missing', 'error');
  
  try {
   const response = await fetch('/api/experiences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newExp)
   });
   if (!response.ok) throw new Error('Creation failed');
   const created = await response.json();

   setExperiences(prev => [...prev, created]);
   setIsAddModalOpen(false);
   setNewExp({ title: '', description: '', icon: 'Globe', status: 'Active' });
   showNotification('New experience added to database');
  } catch (err) {
   showNotification('Failed to create experience', 'error');
  }
 };
 if (loading) return <Loader />;

 return (
  <div className="experience-page">
   {notification && (
    <div className="custom-alert-box">
     <div className="alert-content">
      {notification.type === 'success' ? (
       <CheckCircle2 size={42} color="#b3d332" strokeWidth={2.5} />
      ) : notification.type === 'error' ? (
       <XCircle size={42} color="#ff4d4d" strokeWidth={2.5} />
      ) : (
       <Zap size={42} color="#0088ff" strokeWidth={2.5} />
      )}
      <span className="alert-text">{notification.message}</span>
     </div>
    </div>
   )}

   <div className="experience-controls-top">
    <button className="add-experience-btn" onClick={() => setIsAddModalOpen(true)}>
     <Plus size={18} strokeWidth={3} />
     <span>Add New Experience</span>
    </button>
   </div>

   <div className="experience-grid">
    {experiences.map((exp) => {
      const IconComponent = {
       Globe: Globe,
       MonitorPlay: MonitorPlay,
       Shield: Shield,
       Zap: Zap,
       Film: Film,
       PlayCircle: PlayCircle
      }[exp.icon] || Zap;

      return (
       <div key={exp._id} className="experience-card">
        <div className="exp-icon-box">
         <IconComponent size={32} color="#b3d332" />
         <span className="exp-icon-text">{exp.icon}</span>
        </div>
        <div className="exp-info">
         <div className="exp-header">
          <h3 className="exp-title">{exp.title}</h3>
         </div>
         <p className="exp-desc">{exp.description}</p>
         
         <div className="exp-actions-row">
          <div className="left-btns">
           <button className="circle-btn edit" onClick={() => handleEdit(exp)}>
            <Edit size={14} />
           </button>
           <button className="circle-btn delete" onClick={() => {
            setDeletingId(exp._id);
            setIsDeleteModalOpen(true);
           }}>
            <X size={16} strokeWidth={3} />
           </button>
          </div>
          <div className="right-toggle">
           <span className={`status-label ${exp.status.toLowerCase()}`}>{exp.status}</span>
           <label className="switch">
            <input 
             type="checkbox" 
             checked={exp.status === 'Active'} 
             onChange={() => handleStatusToggle(exp)}
            />
            <span className="slider-round"></span>
           </label>
          </div>
         </div>
        </div>
       </div>
      );
     })}
   </div>

   {/* Delete Modal */}
   {isDeleteModalOpen && (
    <div className="modal-overlay-exp">
     <div className="exp-modal delete">
      <AlertTriangle size={60} color="#ff4d4d" />
      <h2>Confirm Delete</h2>
      <p>Are you sure you want to remove this experience? This action cannot be undone.</p>
      <div className="exp-modal-footer">
       <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
       <button className="btn-confirm-delete" onClick={executeDelete}>Delete Now</button>
      </div>
     </div>
    </div>
   )}

   {/* Edit Modal */}
   {isEditModalOpen && editingExp && (
    <div className="modal-overlay-exp">
     <div className="exp-modal edit">
      <div className="modal-header">
       <Settings size={24} color="#b3d332" />
       <h2>Edit Experience</h2>
      </div>
      <div className="exp-form">
       <div className="form-group">
        <label>Experience Title</label>
        <input 
         type="text" 
         value={editingExp.title} 
         onChange={(e) => setEditingExp({...editingExp, title: e.target.value})}
         placeholder="e.g. Access while traveling"
        />
       </div>
       <div className="form-group">
        <label>Description</label>
        <textarea 
         value={editingExp.description} 
         onChange={(e) => setEditingExp({...editingExp, description: e.target.value})}
         placeholder="Describe the feature benefit..."
         rows={3}
         style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }}
        />
       </div>
       <div className="form-group">
        <label>Lucide Icon Name</label>
        <select 
         value={editingExp.icon} 
         onChange={(e) => setEditingExp({...editingExp, icon: e.target.value})}
         style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '8px' }}
        >
         <option value="Globe">Globe</option>
         <option value="MonitorPlay">MonitorPlay</option>
         <option value="Shield">Shield</option>
         <option value="Zap">Zap</option>
         <option value="Film">Film</option>
         <option value="PlayCircle">PlayCircle</option>
        </select>
       </div>
      </div>
      <div className="exp-modal-footer">
       <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Discard</button>
       <button className="btn-save" onClick={saveEdit}>Save Changes</button>
      </div>
     </div>
    </div>
   )}

   {/* Add Modal */}
   {isAddModalOpen && (
    <div className="modal-overlay-exp">
     <div className="exp-modal edit">
      <div className="modal-header">
       <Plus size={24} color="#b3d332" />
       <h2>New Experience</h2>
      </div>
      <div className="exp-form">
       <div className="form-group">
        <label>Experience Title</label>
        <input 
         type="text" 
         value={newExp.title} 
         onChange={(e) => setNewExp({...newExp, title: e.target.value})}
         placeholder="e.g. Access while traveling"
        />
       </div>
       <div className="form-group">
        <label>Description</label>
        <textarea 
         value={newExp.description} 
         onChange={(e) => setNewExp({...newExp, description: e.target.value})}
         placeholder="Describe the feature benefit..."
         rows={3}
         style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }}
        />
       </div>
       <div className="form-group">
        <label>Lucide Icon Name</label>
        <select 
         value={newExp.icon} 
         onChange={(e) => setNewExp({...newExp, icon: e.target.value})}
         style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '8px' }}
        >
         <option value="Globe">Globe</option>
         <option value="MonitorPlay">MonitorPlay</option>
         <option value="Shield">Shield</option>
         <option value="Zap">Zap</option>
         <option value="Film">Film</option>
         <option value="PlayCircle">PlayCircle</option>
        </select>
       </div>
      </div>
      <div className="exp-modal-footer">
       <button className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
       <button className="btn-save" onClick={handleAdd}>Add Experience</button>
      </div>
     </div>
    </div>
   )}

   <style dangerouslySetInnerHTML={{ __html: `
    .experience-page { padding: 30px; animation: fadeIn 0.4s ease-out; position: relative; min-height: calc(100vh - 100px); }
    
    .loading-container { grid-column: 1 / -1; width: 100%; min-height: 500px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; color: #b3d332; font-weight: 800; font-size: 1.2rem; letter-spacing: 2px; }
    .ios-spinner-v { position: relative; width: 80px; height: 80px; }
    .spoke-v { position: absolute; left: 35px; top: 0; width: 10px; height: 24px; background: #ffffff !important; border-radius: 12px; transform-origin: 5px 40px; animation: ios-fade 1s linear infinite; opacity: 0; }
    @keyframes ios-fade { 0% { opacity: 1; } 100% { opacity: 0.15; } }
    
    .spoke-1 { transform: rotate(0deg); animation-delay: -1s; }
    .spoke-2 { transform: rotate(30deg); animation-delay: -0.916s; }
    .spoke-3 { transform: rotate(60deg); animation-delay: -0.833s; }
    .spoke-4 { transform: rotate(90deg); animation-delay: -0.75s; }
    .spoke-5 { transform: rotate(120deg); animation-delay: -0.666s; }
    .spoke-6 { transform: rotate(150deg); animation-delay: -0.583s; }
    .spoke-7 { transform: rotate(180deg); animation-delay: -0.5s; }
    .spoke-8 { transform: rotate(210deg); animation-delay: -0.416s; }
    .spoke-9 { transform: rotate(240deg); animation-delay: -0.333s; }
    .spoke-10 { transform: rotate(270deg); animation-delay: -0.25s; }
    .spoke-11 { transform: rotate(300deg); animation-delay: -0.166s; }
    .spoke-12 { transform: rotate(330deg); animation-delay: -0.083s; }

    .experience-controls-top { margin-bottom: 30px; }
    .add-experience-btn { background: #b3d332; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(22, 196, 127, 0.2); }
    .add-experience-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(22, 196, 127, 0.3); }

    .experience-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 25px; }
    
    .experience-card { background: #1a1a1a; border-radius: 16px; padding: 25px; border: 1px solid #222; display: flex; gap: 20px; transition: all 0.3s; position: relative; }
    .experience-card:hover { border-color: #b3d332; transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    
    .exp-icon-box { width: 80px; height: 80px; background: #111; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #222; flex-shrink: 0; }
    .exp-icon-text { font-size: 0.7rem; font-weight: 800; color: #555; margin-top: 5px; text-transform: uppercase; }
    
    .exp-info { flex: 1; }
    .exp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .exp-title { color: #fff; font-size: 1.1rem; font-weight: 700; margin: 0; }
    .exp-type-badge { background: rgba(22, 196, 127, 0.1); color: #b3d332; font-size: 0.65rem; font-weight: 800; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; border: 1px solid rgba(22, 196, 127, 0.2); }
    
    .exp-desc { color: #888; font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px; }
    
    .exp-actions-row { display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #222; }
    .left-btns { display: flex; gap: 10px; }
    
    .circle-btn { width: 34px; height: 34px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: #fff; }
    .circle-btn.edit { background: #333; }
    .circle-btn.delete { background: #ff4d4d; }
    .circle-btn:hover { transform: scale(1.1); }
    
    .right-toggle { display: flex; align-items: center; gap: 12px; }
    .status-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
    .status-label.active { color: #b3d332; }
    .status-label.inactive { color: #ff4d4d; }

    .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider-round { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 34px; }
    .slider-round:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider-round { background-color: #b3d332; }
    input:checked + .slider-round:before { transform: translateX(22px); }

    /* Modals */
    .modal-overlay-exp { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(8px); }
    .exp-modal { background: #1a1a1a; padding: 40px; border-radius: 24px; text-align: center; border: 1px solid #333; max-width: 450px; width: 90%; animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .exp-modal.edit { text-align: left; }
    .modal-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
    .modal-header h2 { color: #fff; font-size: 1.5rem; margin: 0; }
    
    .exp-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { color: #aaa; font-size: 0.85rem; font-weight: 600; }
    .form-group input, .form-group select { background: #111; border: 1px solid #333; color: #fff; padding: 12px 15px; border-radius: 8px; outline: none; transition: border-color 0.3s; }
    .form-group input:focus, .form-group select:focus { border-color: #b3d332; }
    
    .exp-modal-footer { display: flex; gap: 15px; margin-top: 35px; }
    .btn-cancel { flex: 1; background: #333; color: #fff; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-weight: 700; transition: background 0.2s; }
    .btn-save { flex: 1.5; background: #b3d332; color: #fff; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-weight: 700; transition: opacity 0.2s; }
    .btn-confirm-delete { flex: 1.5; background: #ff4d4d; color: #fff; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-weight: 700; }
    .btn-save:hover, .btn-confirm-delete:hover { opacity: 0.9; }

    .custom-alert-box { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: #000; border-radius: 16px; padding: 25px 50px; z-index: 20000; box-shadow: 0 10px 50px rgba(0,0,0,1); animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid #333; }
    .alert-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .alert-text { color: #fff; font-size: 1.1rem; font-weight: 700; text-align: center; }
    
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
   ` }} />
  </div>
 );
};

export default Experience;
