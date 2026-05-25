import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  CreditCard,
  Lock,
  Globe
} from 'lucide-react';
import Loader from '../components/Loader';

const EditPaymentGateway = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [gateway, setGateway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    status: 'Active',
    settings: {
      publishableKey: '',
      secretKey: '',
      merchantId: '',
      isSandbox: true
    }
  });

  useEffect(() => {
    fetchGatewayDetails();
  }, [id]);

  const fetchGatewayDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/payment-gateways/${id}`);
      if (!response.ok) throw new Error('Gateway not found');
      const data = await response.json();
      setGateway(data);
      setFormData({
        name: data.name || '',
        status: data.status || 'Active',
        settings: {
          publishableKey: data.settings?.publishableKey || '',
          secretKey: data.settings?.secretKey || '',
          merchantId: data.settings?.merchantId || '',
          isSandbox: data.settings?.isSandbox !== false
        }
      });
    } catch (err) {
      console.error(err);
      showNotification('Error loading gateway details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: value
      }
    }));
  };

  const handleSandboxChange = (e) => {
    const isSandbox = e.target.value === 'true';
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        isSandbox
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`http://localhost:5001/api/payment-gateways/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showNotification('Payment gateway settings updated successfully');
        setTimeout(() => navigate('/admin/payment-gateway'), 1500);
      } else {
        showNotification('Error saving gateway settings', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error, please try again', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container-g">
        <Loader size="small" />
      </div>
    );
  }

  const isRazorpay = formData.name.toLowerCase() === 'razorpay';
  const isPhonePe = formData.name.toLowerCase() === 'phonepe';

  return (
    <div className="edit-gateway-page">
      {notification && (
        <div className="custom-alert-box-g">
          <div className="alert-content-g">
            {notification.type === 'success' ? (
              <CheckCircle2 size={42} color="#00c853" strokeWidth={2.5} />
            ) : (
              <XCircle size={42} color="#ff4d4d" strokeWidth={2.5} />
            )}
            <span className="alert-text-g">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="header-section-g">
        <button className="back-btn-g" onClick={() => navigate('/admin/payment-gateway')}>
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </button>
        <h1 className="page-title-g">Configure {formData.name}</h1>
        <p className="page-subtitle-g">Manage authentication keys and API credentials for online payments.</p>
      </div>

      <form onSubmit={handleSubmit} className="gateway-form-g">
        <div className="form-content-g">
          
          <div className="settings-section-g">
            <div className="section-header-g">
              <CreditCard size={20} className="section-icon-g" />
              <h2 className="section-title-g">Gateway Information</h2>
            </div>

            <div className="form-row-g">
              <label>Gateway Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                disabled 
                className="disabled-input-g"
              />
            </div>

            <div className="form-row-g">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="section-divider-g"></div>

          <div className="settings-section-g">
            <div className="section-header-g">
              <Lock size={20} className="section-icon-g" />
              <h2 className="section-title-g">API Credentials</h2>
            </div>

            {isRazorpay && (
              <>
                <div className="form-row-g">
                  <label>Key ID</label>
                  <input 
                    type="text" 
                    name="publishableKey" 
                    value={formData.settings.publishableKey} 
                    onChange={handleSettingsChange}
                    placeholder="rzp_test_..."
                    required
                  />
                </div>

                <div className="form-row-g">
                  <label>Key Secret</label>
                  <input 
                    type="password" 
                    name="secretKey" 
                    value={formData.settings.secretKey} 
                    onChange={handleSettingsChange}
                    placeholder="Enter Razorpay Secret Key"
                    required
                  />
                </div>
              </>
            )}

            {isPhonePe && (
              <>
                <div className="form-row-g">
                  <label>Client Id</label>
                  <input 
                    type="text" 
                    name="merchantId" 
                    value={formData.settings.merchantId} 
                    onChange={handleSettingsChange}
                    placeholder="Enter PhonePe Client ID"
                    required
                  />
                </div>

                <div className="form-row-g">
                  <label>API Key</label>
                  <input 
                    type="text" 
                    name="publishableKey" 
                    value={formData.settings.publishableKey} 
                    onChange={handleSettingsChange}
                    placeholder="Enter PhonePe API Key"
                    required
                  />
                </div>

                <div className="form-row-g">
                  <label>Client Version</label>
                  <input 
                    type="text" 
                    name="secretKey" 
                    value={formData.settings.secretKey} 
                    onChange={handleSettingsChange}
                    placeholder="Enter Client Version (e.g. 1)"
                    required
                  />
                </div>
              </>
            )}

            {!isRazorpay && !isPhonePe && (
              <>
                <div className="form-row-g">
                  <label>Publishable Key</label>
                  <input 
                    type="text" 
                    name="publishableKey" 
                    value={formData.settings.publishableKey} 
                    onChange={handleSettingsChange}
                    placeholder="Enter Publishable Key"
                  />
                </div>

                <div className="form-row-g">
                  <label>Secret Key</label>
                  <input 
                    type="password" 
                    name="secretKey" 
                    value={formData.settings.secretKey} 
                    onChange={handleSettingsChange}
                    placeholder="Enter Secret Key"
                  />
                </div>
              </>
            )}
          </div>

          <div className="section-divider-g"></div>

          <div className="settings-section-g">
            <div className="section-header-g">
              <Globe size={20} className="section-icon-g" />
              <h2 className="section-title-g">Environment Mode</h2>
            </div>

            <div className="form-row-g">
              <label>Transaction Mode</label>
              <select 
                name="isSandbox" 
                value={formData.settings.isSandbox ? 'true' : 'false'} 
                onChange={handleSandboxChange}
              >
                <option value="true">Sandbox / Test Mode</option>
                <option value="false">Live / Production Mode</option>
              </select>
            </div>
          </div>

          <div className="form-actions-g">
            <button type="submit" className="save-btn-g" disabled={saving}>
              {saving ? <Loader2 size={16} className="spinner-g" /> : 'Save Configurations'}
            </button>
            <button type="button" className="cancel-btn-g" onClick={() => navigate('/admin/payment-gateway')}>
              Cancel
            </button>
          </div>

        </div>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        .edit-gateway-page { background: #000; min-height: 100vh; padding: 40px 50px; color: #fff; animation: fadeIn 0.4s ease; }
        .loading-container-g { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #b3d332; }
        
        .header-section-g { margin-bottom: 35px; }
        .back-btn-g { background: transparent; border: none; color: #aaa; display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 0; font-size: 0.85rem; font-weight: 700; margin-bottom: 20px; transition: color 0.2s; }
        .back-btn-g:hover { color: #fff; }
        
        .page-title-g { font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0 0 8px 0; }
        .page-subtitle-g { font-size: 0.9rem; color: #777; margin: 0; }

        .gateway-form-g { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 40px; }
        .form-content-g { max-width: 700px; }
        
        .settings-section-g { margin-bottom: 20px; }
        .section-header-g { display: flex; align-items: center; gap: 10px; margin-bottom: 25px; }
        .section-icon-g { color: #b3d332; }
        .section-title-g { font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .section-divider-g { height: 1px; background: #1a1a1a; margin: 35px 0; width: 100%; }

        .form-row-g { display: flex; align-items: center; margin-bottom: 20px; }
        .form-row-g label { width: 180px; font-weight: 600; color: #aaa; font-size: 0.85rem; flex-shrink: 0; }
        
        .form-row-g input, .form-row-g select { 
          flex: 1;
          background: #111; 
          border: 1px solid #222; 
          padding: 12px 16px; 
          border-radius: 6px; 
          color: #fff; 
          outline: none; 
          font-size: 0.9rem; 
          transition: all 0.3s;
        }
        .form-row-g input:focus, .form-row-g select:focus { border-color: #b3d332; background: #151515; }
        .form-row-g input::placeholder { color: #444; }
        .disabled-input-g { opacity: 0.6; cursor: not-allowed; background: #1a1a1a !important; }

        .form-actions-g { display: flex; gap: 15px; margin-top: 40px; }
        .save-btn-g { background: #b3d332; color: #fff; border: none; padding: 12px 30px; border-radius: 6px; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; }
        .save-btn-g:hover { background: #b3d332; transform: translateY(-1px); box-shadow: 0 5px 15px rgba(179,211,50,0.3); }
        .save-btn-g:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .cancel-btn-g { background: transparent; border: 1px solid #333; color: #aaa; padding: 12px 30px; border-radius: 6px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.3s; }
        .cancel-btn-g:hover { border-color: #555; color: #fff; }

        .spinner-g { animation: spin-g 1s linear infinite; }
        @keyframes spin-g { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Notification */
        .custom-alert-box-g { position: fixed; top: 40px; left: 50%; transform: translateX(-50%); background: #111; border-radius: 12px; padding: 30px 60px; z-index: 9999; box-shadow: 0 20px 50px rgba(0,0,0,0.6); border: 1px solid #333; }
        .alert-content-g { display: flex; flex-direction: column; align-items: center; gap: 15px; }
        .alert-text-g { color: #fff; font-size: 1.2rem; font-weight: 800; text-align: center; }
      `}} />
    </div>
  );
};

export default EditPaymentGateway;
