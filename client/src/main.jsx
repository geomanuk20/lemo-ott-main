import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

// Global fetch interceptor to dynamically rewrite hardcoded localhost API endpoints to the active Hostinger deployment URL
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (typeof url === 'string') {
    if (url.startsWith('http://localhost:5001/api') || url.startsWith('http://localhost:5001/uploads') || url.startsWith('http://localhost:5001/upload')) {
      const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
      url = url.replace('http://localhost:5001', apiBase);
    }
  }
  return originalFetch(url, options);
};


// Global window.alert override for Lemo OTT Custom Glassmorphic Toast Notifications
window.alert = (message) => {
  let container = document.getElementById('lemo-global-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'lemo-global-toast-container';
    const style = document.createElement('style');
    style.innerHTML = `
      #lemo-global-toast-container {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 9999999;
        display: flex;
        flex-direction: column;
        gap: 15px;
        pointer-events: none;
      }
      .lemo-global-toast {
        background: rgba(15, 15, 15, 0.9);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
        max-width: 380px;
        min-width: 300px;
        animation: lemoToastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
        position: relative;
        pointer-events: auto;
      }
      .lemo-global-toast-accent {
        position: absolute;
        left: 0;
        top: 0;
        width: 5px;
        height: 100%;
        background: #b3d332;
        box-shadow: 0 0 15px rgba(179, 211, 50, 0.6);
      }
      .lemo-global-toast.error .lemo-global-toast-accent {
        background: #ff4d4d;
        box-shadow: 0 0 15px rgba(255, 77, 77, 0.6);
      }
      .lemo-global-toast-body {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #fff;
        font-size: 0.95rem;
        font-weight: 600;
        line-height: 1.4;
        text-align: left;
      }
      .lemo-global-toast-icon {
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .lemo-global-toast.success .lemo-global-toast-icon {
        color: #b3d332;
      }
      .lemo-global-toast.error .lemo-global-toast-icon {
        color: #ff4d4d;
      }
      .lemo-global-toast-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 6px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 16px;
        line-height: 1;
      }
      .lemo-global-toast-close:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        transform: rotate(90deg);
      }
      @keyframes lemoToastIn {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes lemoToastOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(-20px) scale(0.95); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const isError = /fail|error|invalid|required|missing|check|wrong/i.test(message);
  toast.className = `lemo-global-toast ${isError ? 'error' : 'success'}`;
  
  toast.innerHTML = `
    <div class="lemo-global-toast-accent"></div>
    <div class="lemo-global-toast-body">
      <span class="lemo-global-toast-icon">${isError ? '⚠️' : '✓'}</span>
      <span>${message}</span>
    </div>
    <button class="lemo-global-toast-close">×</button>
  `;

  const closeBtn = toast.querySelector('.lemo-global-toast-close');
  const dismiss = () => {
    toast.style.animation = 'lemoToastOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  };
  closeBtn.addEventListener('click', dismiss);

  setTimeout(dismiss, 4000);
  container.appendChild(toast);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
