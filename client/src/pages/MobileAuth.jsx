import React, { useEffect, useState } from 'react';

const MobileAuth = () => {
  const [status, setStatus] = useState('Processing login request...');

  useEffect(() => {
    try {
      // Google OAuth redirects with the token in the hash (fragment identifier)
      // e.g., https://lemoott.com/mobile-auth#access_token=ya29.a0AfH6S...&token_type=Bearer...
      const hash = window.location.hash || window.location.search;
      if (!hash) {
        setStatus('No authentication token found. Please try logging in from the Lemo OTT app.');
        return;
      }

      const params = new URLSearchParams(hash.replace(/^#/, '?'));
      const accessToken = params.get('access_token');

      if (accessToken) {
        setStatus('Authentication successful! Redirecting you back to the Lemo OTT app...');
        // Redirect to the mobile app's deep link scheme
        const deepLink = `lemoott://login?token=${encodeURIComponent(accessToken)}`;
        window.location.href = deepLink;

        // Fallback: If deep link fails to open automatically within 2 seconds, show a button
        setTimeout(() => {
          setStatus('If you were not redirected, tap the button below to open Lemo OTT.');
        }, 2000);
      } else {
        setStatus('Failed to extract Google Access Token. Please go back to the app and retry.');
      }
    } catch (err) {
      console.error('Error handling mobile redirect:', err);
      setStatus('An error occurred during redirect.');
    }
  }, []);

  const handleOpenApp = () => {
    const hash = window.location.hash || window.location.search;
    const params = new URLSearchParams(hash.replace(/^#/, '?'));
    const accessToken = params.get('access_token');
    if (accessToken) {
      window.location.href = `lemoott://login?token=${encodeURIComponent(accessToken)}`;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '400px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        border: '1px solid #2a2a2a'
      }}>
        <h2 style={{ color: '#b3d332', marginBottom: '16px', fontSize: '24px', fontWeight: '800' }}>
          Lemo OTT Login
        </h2>
        <p style={{ color: '#cccccc', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
          {status}
        </p>
        {(status.includes('tap') || status.includes('button')) && (
          <button
            onClick={handleOpenApp}
            style={{
              backgroundColor: '#b3d332',
              color: '#000000',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Open Lemo OTT App
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileAuth;
