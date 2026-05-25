import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, Share2, Globe, ChevronLeft } from 'lucide-react';
import Loader from '../components/Loader';
import FrontendLayout from '../components/FrontendLayout';
import { formatBrandingUrl } from '../utils/branding';

// Stable browser device fingerprint — generated once, persisted in localStorage
const getOrCreateDeviceId = () => {
 const stored = localStorage.getItem('deviceId');
 if (stored) return stored;
 const newId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
 localStorage.setItem('deviceId', newId);
 return newId;
};

const FrontendLogin = () => {
 const location = useLocation();
 const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
 const [formData, setFormData] = useState({
  name: '',
  email: location.state?.email || '',
  password: ''
 });
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [settings, setSettings] = useState(null);
 const [socialSettings, setSocialSettings] = useState(null);
 const navigate = useNavigate();

 useEffect(() => {
  const fetchSettings = async () => {
   try {
    const res = await fetch('http://localhost:5001/api/general-settings');
    const data = await res.json();
    setSettings(data);
   } catch (err) {
    console.error('Error fetching settings:', err);
   }
  };
  fetchSettings();

  // Load Google Identity Services script
  if (!document.getElementById('google-gsi-script')) {
   const script = document.createElement('script');
   script.id = 'google-gsi-script';
   script.src = 'https://accounts.google.com/gsi/client';
   script.async = true;
   script.defer = true;
   document.head.appendChild(script);
  }

  // Fetch social settings and load Facebook SDK if configured
  const initFacebookSdk = async () => {
   try {
    const res = await fetch('http://localhost:5001/api/social-login-settings');
    const data = await res.json();
    setSocialSettings(data);
    if (data && data.facebookLogin?.toUpperCase() !== 'OFF') {
     const appId = data.facebookAppId;
     if (appId && appId !== 'Hidden in Demo') {
      // Load Facebook SDK script
      if (!document.getElementById('facebook-jssdk')) {
       window.fbAsyncInit = function() {
        window.FB.init({
         appId      : appId,
         cookie     : true,
         xfbml      : true,
         version    : 'v18.0'
        });
       };
       const script = document.createElement('script');
       script.id = 'facebook-jssdk';
       script.src = 'https://connect.facebook.net/en_US/sdk.js';
       script.async = true;
       script.defer = true;
       document.head.appendChild(script);
      }
     }
    }
   } catch (err) {
    console.error('Error initializing Facebook SDK:', err);
   }
  };
  initFacebookSdk();
 }, []);

 const sendGoogleTokenToBackend = async (accessToken) => {
  setLoading(true);
  setError('');
  setSuccess('');
  try {
   const response = await fetch('http://localhost:5001/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: accessToken, deviceId: getOrCreateDeviceId() })
   });
   const data = await response.json();
   if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.dispatchEvent(new Event('profileUpdate'));
    navigate('/');
   } else {
    setError(data.message || 'Google authentication failed');
   }
  } catch (err) {
   console.error(err);
   setError('Connection error during Google authentication.');
  } finally {
   setLoading(false);
  }
 };

 const handleGoogleClick = () => {
  if (!window.google) {
   setError('Google Login is still loading. Please try again in a moment.');
   return;
  }

  setLoading(true);
  setError('');
  setSuccess('');

  fetch('http://localhost:5001/api/social-login-settings')
   .then(res => res.json())
   .then(settings => {
    if (!settings || settings.googleLogin?.toUpperCase() === 'OFF') {
     setError('Google Login is currently disabled by the administrator.');
     setLoading(false);
     return;
    }
    if (!settings.googleClientId || settings.googleClientId === 'Hidden in Demo') {
     setError('Google Client ID is not configured in the Admin settings.');
     setLoading(false);
     return;
    }

    try {
     const client = window.google.accounts.oauth2.initTokenClient({
      client_id: settings.googleClientId,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
       if (tokenResponse.error) {
        setError('Google authorization cancelled or failed.');
        setLoading(false);
        return;
       }
       if (tokenResponse.access_token) {
        await sendGoogleTokenToBackend(tokenResponse.access_token);
       } else {
        setLoading(false);
       }
      },
      error_callback: (err) => {
       setError('Google login popup failed to open.');
       setLoading(false);
      }
     });
     client.requestAccessToken();
    } catch (err) {
     setError('Failed to initialize Google Login Client.');
     setLoading(false);
    }
   })
   .catch(err => {
    console.error('Error fetching settings for google login:', err);
    setError('Failed to fetch Social Login settings.');
    setLoading(false);
   });
 };

 const sendFacebookTokenToBackend = async (accessToken) => {
  setLoading(true);
  setError('');
  setSuccess('');
  try {
   const response = await fetch('http://localhost:5001/api/auth/facebook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: accessToken, deviceId: getOrCreateDeviceId() })
   });
   const data = await response.json();
   if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.dispatchEvent(new Event('profileUpdate'));
    navigate('/');
   } else {
    setError(data.message || 'Facebook authentication failed');
   }
  } catch (err) {
   console.error(err);
   setError('Connection error during Facebook authentication.');
  } finally {
   setLoading(false);
  }
 };

 const handleFacebookClick = () => {
  if (!window.FB) {
   setError('Facebook Login SDK is still loading or could not be loaded. Please try again.');
   return;
  }

  setLoading(true);
  setError('');
  setSuccess('');

  fetch('http://localhost:5001/api/social-login-settings')
   .then(res => res.json())
   .then(socialSettings => {
    if (!socialSettings || socialSettings.facebookLogin?.toUpperCase() === 'OFF') {
     setError('Facebook Login is currently disabled by the administrator.');
     setLoading(false);
     return;
    }
    if (!socialSettings.facebookAppId || socialSettings.facebookAppId === 'Hidden in Demo') {
     setError('Facebook App ID is not configured in the Admin settings.');
     setLoading(false);
     return;
    }

    window.FB.login((response) => {
     if (response.authResponse) {
      sendFacebookTokenToBackend(response.authResponse.accessToken);
     } else {
      setError('Facebook authorization cancelled or failed.');
      setLoading(false);
     }
    }, { scope: 'public_profile,email' });
   })
   .catch(err => {
    console.error('Error fetching settings for facebook login:', err);
    setError('Failed to fetch Social Login settings.');
    setLoading(false);
   });
 };

 const handleInputChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
  setError('');
  setSuccess('');
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');

  if (view === 'register') {
   // Email Validation
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   const trimmedEmail = formData.email.trim();
   if (!emailRegex.test(trimmedEmail)) {
    setError('Please enter a valid email address');
    setLoading(false);
    return;
   }

   // Password Validation
   if (formData.password.length < 6) {
    setError('Password must be at least 6 characters long');
    setLoading(false);
    return;
   }
  }

  let endpoint = '';
  let payload = {};

  if (view === 'login') {
   endpoint = '/api/login';
   payload = { email: formData.email.trim(), password: formData.password, deviceId: getOrCreateDeviceId() };
  } else if (view === 'register') {
   endpoint = '/api/register';
   payload = { name: formData.name, email: formData.email.trim(), password: formData.password, deviceId: getOrCreateDeviceId() };
  } else {
   endpoint = '/api/forgot-password';
   payload = { email: formData.email.trim() };
  }

  try {
   const response = await fetch(`http://localhost:5001${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
   });

   const data = await response.json();

   if (response.ok) {
    if (view === 'forgot') {
     setSuccess(data.message);
    } else {
     localStorage.setItem('token', data.token);
     localStorage.setItem('user', JSON.stringify(data.user));
     window.dispatchEvent(new Event('profileUpdate'));
     
     const from = location.state?.from || '/';
     const stateToPass = location.state?.selectedPlan ? { selectedPlan: location.state.selectedPlan } : {};
     navigate(from, { state: stateToPass });
    }
   } else {
    setError(data.message || 'Action failed');
   }
  } catch (err) {
   setError('Connection error. Please try again.');
  } finally {
   setLoading(false);
  }
 };

  const googleEnabled = socialSettings && socialSettings.googleLogin?.toUpperCase() !== 'OFF';
  const facebookEnabled = socialSettings && socialSettings.facebookLogin?.toUpperCase() !== 'OFF';

  return (
  <FrontendLayout isTransparent={true} showHeader={false} showFooter={false}>
   <div className="fe-login-page-v">
    <div className="fe-login-background-v">
     <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" alt="bg" />
     <div className="fe-login-overlay-v"></div>
    </div>

    <div className="fe-login-card-v">
     <div className="fe-login-header-v">
      <div className="fe-login-logo-v">
       {formatBrandingUrl(settings?.siteLogo) ? (
        <img src={formatBrandingUrl(settings.siteLogo)} alt={settings.siteName || "LEMO OTT"} />
       ) : (
        <img src="/assets/LOGO PNG-01.png" alt="LEMO OTT" />
       )}
      </div>
      <h1>
       {view === 'login' && 'Welcome Back'}
       {view === 'register' && 'Join Us'}
       {view === 'forgot' && 'Reset Password'}
      </h1>
      <p>
       {view === 'login' && 'Sign in to continue discovery'}
       {view === 'register' && 'Create your cinematic account'}
       {view === 'forgot' && 'Enter email to recover account'}
      </p>
     </div>

     {view !== 'forgot' && (
      <div className="fe-login-toggle-v">
       <button className={view === 'login' ? 'active' : ''} onClick={() => setView('login')}>LOGIN</button>
       <button className={view === 'register' ? 'active' : ''} onClick={() => setView('register')}>REGISTER</button>
      </div>
     )}

     {error && <div className="fe-login-error-v">{error}</div>}
     {success && <div className="fe-login-success-v">{success}</div>}

     <form onSubmit={handleSubmit} className="fe-login-form-v">
      {view === 'register' && (
       <div className="fe-login-input-group-v">
        <User size={18} />
        <input 
         type="text" 
         name="name"
         placeholder="Full Name" 
         value={formData.name}
         onChange={handleInputChange}
         required
        />
       </div>
      )}
      <div className="fe-login-input-group-v">
       <Mail size={18} />
       <input 
        type="email" 
        name="email"
        placeholder="Email Address" 
        value={formData.email}
        onChange={handleInputChange}
        required
       />
      </div>
      {view !== 'forgot' && (
       <div className="fe-login-input-group-v">
        <Lock size={18} />
        <input 
         type="password" 
         name="password"
         placeholder="Password" 
         value={formData.password}
         onChange={handleInputChange}
         required
        />
       </div>
      )}

      {view === 'login' && (
       <div className="fe-login-forgot-v">
        <button type="button" onClick={() => setView('forgot')}>
         Forgot Password?
        </button>
       </div>
      )}

      <button type="submit" className="fe-login-btn-v" disabled={loading}>
       {loading ? <Loader2 className="fe-spinner-v" size={20} /> : (
        <>
         <span>
          {view === 'login' && 'SIGN IN'}
          {view === 'register' && 'CREATE ACCOUNT'}
          {view === 'forgot' && 'SEND LINK'}
         </span>
         <ArrowRight size={18} />
        </>
       )}
      </button>
     </form>

     {view === 'forgot' && (
      <button className="fe-login-back-v" onClick={() => setView('login')}>
       <ChevronLeft size={18} />
       <span>Back to Login</span>
      </button>
     )}

     {view !== 'forgot' && (googleEnabled || facebookEnabled) && (
      <>
       <div className="fe-login-divider-v">
        <span>OR CONTINUE WITH</span>
       </div>

       <div className="fe-social-login-v" style={{ gridTemplateColumns: googleEnabled && facebookEnabled ? '1fr 1fr' : '1fr' }}>
        {googleEnabled && (
         <button className="google-v" onClick={handleGoogleClick} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
           <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
           <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
           <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
           <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Google</span>
         </button>
        )}
        {facebookEnabled && (
         <button className="facebook-v" onClick={handleFacebookClick} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
           <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
         </button>
        )}
       </div>

       <p className="fe-login-footer-v">
        {view === 'login' ? "Don't have an account?" : "Already have an account?"}
        <button type="button" onClick={() => setView(view === 'login' ? 'register' : 'login')}>
         {view === 'login' ? ' Register Now' : ' Login Here'}
        </button>
       </p>
      </>
     )}
    </div>
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .fe-login-page-v { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; padding: 40px 20px; overflow: hidden; }
    
    .fe-login-background-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; }
    .fe-login-background-v img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.4); }
    .fe-login-overlay-v { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, transparent 0%, #000 100%); }

    .fe-login-card-v { background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; width: 100%; max-width: 400px; padding: 30px 30px; box-shadow: 0 40px 100px rgba(0,0,0,0.8); animation: cardSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes cardSlideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

    .fe-login-header-v { text-align: center; margin-bottom: 20px; }
    .fe-login-logo-v { width: 180px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
    .fe-login-logo-v img { width: 100%; height: auto; object-fit: contain; }
    .fe-login-header-v h1 { font-size: 1.3rem; font-weight: 800; color: #fff; margin-bottom: 5px; }
    .fe-login-header-v p { font-size: 0.75rem; color: rgba(255,255,255,0.5); font-weight: 500; }

    .fe-login-toggle-v { background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; padding: 4px; margin-bottom: 20px; }
    .fe-login-toggle-v button { flex: 1; border: none; background: none; color: rgba(255,255,255,0.5); padding: 10px; font-weight: 700; font-size: 0.8rem; border-radius: 8px; cursor: pointer; transition: 0.3s; }
    .fe-login-toggle-v button.active { background: #fff; color: #000; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }

    .fe-login-error-v { background: rgba(255,77,77,0.1); color: #ff4d4d; border: 1px solid rgba(255,77,77,0.2); padding: 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; margin-bottom: 20px; text-align: center; }
    .fe-login-success-v { background: rgba(0,200,83,0.1); color: #00c853; border: 1px solid rgba(0,200,83,0.2); padding: 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; margin-bottom: 20px; text-align: center; }

    .fe-login-form-v { display: flex; flex-direction: column; gap: 15px; }
    .fe-login-input-group-v { position: relative; display: flex; align-items: center; }
    .fe-login-input-group-v svg { position: absolute; left: 15px; color: rgba(255,255,255,0.3); transition: 0.3s; }
    .fe-login-input-group-v input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px 15px 12px 45px; border-radius: 12px; color: #fff; font-size: 0.9rem; outline: none; transition: 0.3s; }
    .fe-login-input-group-v input:focus { border-color: #b3d332; background: rgba(179,211,50,0.02); }
    .fe-login-input-group-v input:focus + svg { color: #b3d332; }

    .fe-login-forgot-v { text-align: right; margin-top: -10px; }
    .fe-login-forgot-v button { background: none; border: none; color: rgba(255,255,255,0.4); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.3s; }
    .fe-login-forgot-v button:hover { color: #fff; }

    .fe-login-btn-v { background: #b3d332; color: #fff; border: none; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 15px 30px rgba(179,211,50,0.3); }
    .fe-login-btn-v:hover { transform: scale(1.02); background: #b3d332; box-shadow: 0 20px 40px rgba(179,211,50,0.5); }
    .fe-login-btn-v:disabled { opacity: 0.7; cursor: not-allowed; }
    .fe-spinner-v { animation: fe-spin-v 1s linear infinite; }
    @keyframes fe-spin-v {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .fe-login-back-v { background: none; border: none; color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 20px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .fe-login-back-v:hover { color: #fff; }

    .fe-login-divider-v { text-align: center; margin: 20px 0; position: relative; }
    .fe-login-divider-v::before { content: ''; position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background: rgba(255,255,255,0.1); }
    .fe-login-divider-v span { position: relative; background: #0a0a0a; padding: 0 15px; color: rgba(255,255,255,0.3); font-size: 0.65rem; font-weight: 800; letter-spacing: 1.5px; }

    .fe-social-login-v { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .fe-social-login-v button { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #fff; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.3s; }
    .fe-social-login-v button:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }
    .fe-social-login-v .google-v:hover { border-color: #4285F4; color: #4285F4; }
    .fe-social-login-v .facebook-v:hover { border-color: #1877F2; color: #1877F2; }

    .fe-login-footer-v { text-align: center; font-size: 0.9rem; color: rgba(255,255,255,0.5); font-weight: 500; }
    .fe-login-footer-v button { background: none; border: none; color: #b3d332; font-weight: 800; cursor: pointer; margin-left: 5px; }
    .fe-login-footer-v button:hover { text-decoration: underline; }

    .spinner-v { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (max-width: 480px) {
     .fe-login-card-v { padding: 25px 20px; max-width: 320px; border-radius: 20px; }
     .fe-login-header-v h1 { font-size: 1.2rem; }
     .fe-social-login-v { grid-template-columns: 1fr; gap: 8px; }
     .fe-login-input-group-v input { padding: 10px 10px 10px 40px; font-size: 0.8rem; }
     .fe-login-btn-v { padding: 10px; font-size: 0.85rem; }
    }
   ` }} />
  </FrontendLayout>
 );
};

export default FrontendLogin;
