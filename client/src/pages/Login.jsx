import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const Login = () => {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const navigate = useNavigate();

 const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
   const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
   });

   const data = await response.json();

   if (response.ok) {
    // Discovery: Validate Admin Permissions
    const userRole = (data.user.role || '').toLowerCase();
    if (userRole !== 'admin' && userRole !== 'sub-admin') {
     setError('Access Denied: You do not have discovery permissions for the Admin Panel.');
     setLoading(false);
     return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    navigate('/admin/dashboard');
   } else {
    setError(data.message || 'Login failed');
   }
  } catch (err) {
   setError('Connection error. Please check if server is running.');
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="login-page">
   <div className="login-logo">VIDEO</div>
   <div className="login-box">
    <h2 className="login-title">SIGN IN</h2>
    {error && <div className="login-error" style={{ color: '#ff4d4d', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}
    <form onSubmit={handleLogin} className="login-form">
     <div className="input-group">
      <input 
       type="email" 
       placeholder="Email" 
       value={email}
       onChange={(e) => setEmail(e.target.value)}
       required
      />
     </div>
     <div className="input-group">
      <input 
       type="password" 
       placeholder="Password" 
       value={password}
       onChange={(e) => setPassword(e.target.value)}
       required
      />
     </div>
     <div className="login-options">
      <label className="remember-me">
       <input type="checkbox" />
       <span>Remember me</span>
      </label>
     </div>
     <button type="submit" className="login-btn" disabled={loading}>
      {loading ? 'LOGGING IN...' : 'LOGIN'}
     </button>
    </form>
    <div className="forgot-password">
     <Lock size={14} />
     <span>Forgot your password?</span>
    </div>
   </div>
  </div>
 );
};

export default Login;
