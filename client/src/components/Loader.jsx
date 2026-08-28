import React from 'react';

const Loader = ({ size = 'default', inline = false, overlay = false }) => {
  if (size === 'button' || size === 'tiny') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle'
      }}>
        <span style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid rgba(0, 0, 0, 0.25)',
          borderTopColor: '#000',
          animation: 'loader-spin 0.6s linear infinite'
        }} />
        <style>{`
          @keyframes loader-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </span>
    );
  }

  const spinnerSize = size === 'small' ? 32 : size === 'large' ? 72 : 52;
  const borderWidth = size === 'small' ? 3 : 4;

  const spinner = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '14px'
    }}>
      <div style={{
        width: spinnerSize,
        height: spinnerSize,
        borderRadius: '50%',
        border: `${borderWidth}px solid rgba(179, 211, 50, 0.15)`,
        borderTopColor: '#b3d332',
        borderRightColor: '#b3d332',
        animation: 'loader-spin 0.75s linear infinite',
        boxShadow: '0 0 18px rgba(179, 211, 50, 0.3)'
      }} />
      <style>{`
        @keyframes loader-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (overlay) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
      }}>
        {spinner}
      </div>
    );
  }

  if (inline) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '6px 0'
      }}>
        {spinner}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', width: '100%'
    }}>
      {spinner}
    </div>
  );
};

export default Loader;
