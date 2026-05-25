import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
 Lock, 
 Eye, 
 EyeOff, 
 Loader2, 
 CheckCircle2, 
 ArrowLeft,
 ShieldCheck,
 XCircle
} from 'lucide-react';
import Loader from '../components/Loader';

const ResetPassword = () => {
 const [searchParams] = useSearchParams();
 const token = searchParams.get('token');
 const navigate = useNavigate();

 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState(false);

 // Discovery: Validate Token Presence
 if (!token && !success) {
  return (
   <div className="auth-gateway-v">
    <div className="auth-card-v error-card-v">
     <XCircle size={64} color="#ff4d4d" className="error-icon-v" />
     <h1>Invalid Discovery Link</h1>
     <p>The password reset link is missing its security token. Please request a new discovery link from the Forgot Password gateway.</p>
     <button onClick={() => navigate('/login')} className="auth-btn-v">
      Back to Login
     </button>
    </div>
    {styles}
   </div>
  );
 }

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (password.length < 6) {
   setError('Password must be at least 6 characters long');
   return;
  }

  if (password !== confirmPassword) {
   setError('Passwords do not match');
   return;
  }

  setLoading(true);

  try {
   const response = await fetch('/api/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
   });

   const data = await response.json();

   if (response.ok) {
    setSuccess(true);
    setTimeout(() => navigate('/login'), 3000);
   } else {
    setError(data.message || 'Failed to reset password');
   }
  } catch (err) {
   setError('Connection error. Please try again.');
  } finally {
   setLoading(false);
  }
 };

 if (success) {
  return (
   <div className="auth-gateway-v">
    <div className="auth-card-v success-card-v">
     <CheckCircle2 size={64} color="#00c853" className="success-icon-v" />
     <h1>Password Reset!</h1>
     <p>Your password has been updated successfully.</p>
     <p className="redirect-text-v">Redirecting to login gateway...</p>
     <button onClick={() => navigate('/login')} className="auth-btn-v">
      Go to Login
     </button>
    </div>
    {styles}
   </div>
  );
 }

 return (
  <div className="auth-gateway-v">
   <div className="auth-card-v">
    <div className="auth-header-v">
     <div className="icon-badge-v">
      <ShieldCheck size={32} color="#b3d332" />
     </div>
     <h1>Create New Password</h1>
     <p>Set a strong password to secure your discovery account.</p>
    </div>

    <form onSubmit={handleSubmit} className="auth-form-v">
     {error && <div className="error-message-v">{error}</div>}

     <div className="input-group-v">
      <label>New Password</label>
      <div className="input-wrapper-v">
       <Lock className="input-icon-v" size={18} />
       <input 
        type={showPassword ? "text" : "password"} 
        placeholder="Min. 6 characters" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
       />
       <button 
        type="button" 
        className="eye-btn-v"
        onClick={() => setShowPassword(!showPassword)}
       >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
       </button>
      </div>
     </div>

     <div className="input-group-v">
      <label>Confirm New Password</label>
      <div className="input-wrapper-v">
       <Lock className="input-icon-v" size={18} />
       <input 
        type={showPassword ? "text" : "password"} 
        placeholder="Repeat password" 
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
       />
      </div>
     </div>

     <button type="submit" className="auth-btn-v" disabled={loading}>
      {loading ? <Loader size="small" inline={true} /> : 'Reset Password'}
     </button>

     <button 
      type="button" 
      className="back-btn-v"
      onClick={() => navigate('/login')}
     >
      <ArrowLeft size={16} />
      Back to Login
     </button>
    </form>
   </div>
   {styles}
  </div>
 );
};

const styles = (
 <style>{`
  .auth-gateway-v {
   background: radial-gradient(circle at center, #1a1a1a 0%, #050505 100%);
   min-height: 100vh;
   display: flex;
   align-items: center;
   justify-content: center;
   padding: 20px;
   font-family: 'Inter', system-ui, sans-serif;
  }
  .auth-card-v {
   background: rgba(15, 15, 15, 0.8);
   backdrop-filter: blur(20px);
   border: 1px solid rgba(255, 255, 255, 0.05);
   border-radius: 24px;
   width: 100%;
   max-width: 420px;
   padding: 40px;
   box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
   animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .success-card-v { text-align: center; }
  .error-card-v { text-align: center; }
  .success-icon-v { margin-bottom: 20px; animation: scaleIn 0.5s ease; }
  .error-icon-v { margin-bottom: 20px; animation: scaleIn 0.5s ease; }
  .redirect-text-v { color: #666; font-size: 0.9rem; margin: 10px 0 20px; }

  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }

  .auth-header-v { text-align: center; margin-bottom: 35px; }
  .icon-badge-v { 
   background: rgba(255, 0, 0, 0.1);
   width: 64px;
   height: 64px;
   border-radius: 20px;
   display: flex;
   align-items: center;
   justify-content: center;
   margin: 0 auto 20px;
  }
  .auth-header-v h1 { color: #fff; font-size: 1.75rem; font-weight: 800; margin-bottom: 10px; }
  .auth-header-v p { color: #888; font-size: 0.95rem; line-height: 1.5; }

  .auth-form-v { display: flex; flex-direction: column; gap: 20px; }
  .input-group-v { display: flex; flex-direction: column; gap: 8px; }
  .input-group-v label { color: #bbb; font-size: 0.85rem; font-weight: 600; padding-left: 4px; }
  
  .input-wrapper-v { 
   position: relative;
   display: flex;
   align-items: center;
  }
  .input-icon-v { position: absolute; left: 16px; color: #555; pointer-events: none; }
  .input-wrapper-v input {
   width: 100%;
   background: #111;
   border: 1.5px solid #222;
   border-radius: 14px;
   padding: 14px 45px;
   color: #fff;
   font-size: 0.95rem;
   transition: all 0.3s;
  }
  .input-wrapper-v input:focus { border-color: #b3d332; background: #000; outline: none; box-shadow: 0 0 0 4px rgba(255, 0, 0, 0.1); }
  
  .eye-btn-v { position: absolute; right: 16px; background: none; border: none; color: #555; cursor: pointer; padding: 0; }
  .eye-btn-v:hover { color: #fff; }

  .auth-btn-v {
   background: #b3d332;
   color: #fff;
   border: none;
   border-radius: 14px;
   padding: 16px;
   font-size: 1rem;
   font-weight: 700;
   cursor: pointer;
   transition: all 0.3s;
   margin-top: 10px;
   display: flex;
   align-items: center;
   justify-content: center;
  }
  .auth-btn-v:hover { background: #cc0000; transform: translateY(-1px); box-shadow: 0 10px 20px -10px rgba(255, 0, 0, 0.5); }
  .auth-btn-v:disabled { opacity: 0.7; cursor: not-allowed; }

  .back-btn-v {
   background: none;
   border: none;
   color: #666;
   font-size: 0.9rem;
   font-weight: 600;
   display: flex;
   align-items: center;
   justify-content: center;
   gap: 8px;
   cursor: pointer;
   transition: all 0.3s;
  }
  .back-btn-v:hover { color: #fff; }

  .error-message-v {
   background: rgba(255, 77, 77, 0.1);
   border-left: 3px solid #ff4d4d;
   color: #ff4d4d;
   padding: 12px 16px;
   border-radius: 8px;
   font-size: 0.85rem;
   font-weight: 600;
  }

  .spinner { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
 `}</style>
);

export default ResetPassword;
