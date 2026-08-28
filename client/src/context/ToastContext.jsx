import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev.slice(-3), newToast]); // Keep up to 4 toasts max

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    show: showToast,
    success: (msg, dur) => showToast(msg, 'success', dur),
    error: (msg, dur) => showToast(msg, 'error', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
    info: (msg, dur) => showToast(msg, 'info', dur),
    dismiss: removeToast
  };

  return (
    <ToastContext.Provider value={{ showToast, toast, removeToast }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="lemo-toast-portal-root" aria-live="polite">
        {toasts.map((item) => {
          const type = item.type || 'success';
          return (
            <div 
              key={item.id} 
              className={`lemo-toast-card-item ${type}`}
              role="alert"
            >
              {/* Left Accent Glow Bar */}
              <div className={`lemo-toast-accent-bar ${type}`} />

              {/* Matching Icon Badge */}
              <div className={`lemo-toast-icon-badge ${type}`}>
                {type === 'error' && <AlertCircle size={18} strokeWidth={2.5} className="toast-icon-error" />}
                {type === 'warning' && <AlertTriangle size={18} strokeWidth={2.5} className="toast-icon-warning" />}
                {type === 'info' && <Info size={18} strokeWidth={2.5} className="toast-icon-info" />}
                {type === 'success' && <CheckCircle2 size={18} strokeWidth={2.5} className="toast-icon-success" />}
              </div>

              {/* Message Body */}
              <div className="lemo-toast-message-wrap">
                <p className="lemo-toast-text">{item.message}</p>
              </div>

              {/* Close / Dismiss button */}
              <button 
                type="button" 
                className="lemo-toast-dismiss-btn" 
                onClick={() => removeToast(item.id)}
                aria-label="Close notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg) => console.log('[Toast fallback]:', msg),
      toast: {
        success: (msg) => console.log('[Toast Success]:', msg),
        error: (msg) => console.log('[Toast Error]:', msg),
        warning: (msg) => console.log('[Toast Warning]:', msg),
        info: (msg) => console.log('[Toast Info]:', msg),
        dismiss: () => {}
      },
      removeToast: () => {}
    };
  }
  return context;
};

export default ToastContext;
