import React, { useState, useEffect } from 'react';

const Footer = () => {
  const [copyrightText, setCopyrightText] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/general-settings');
        if (response.ok) {
          const data = await response.json();
          if (data && data.copyrightText) {
            // Clean up any legacy placeholders
            const cleanedText = data.copyrightText
              .replace(/Video\.com/gi, 'lemoott.com')
              .replace(/www\.viaviweb\.com/gi, 'lemoott.com');
            setCopyrightText(cleanedText);
          }
        }
      } catch (err) {
        console.error('Error fetching footer settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const renderContent = () => {
    const textToRender = copyrightText || `Copyright © ${new Date().getFullYear()} lemoott.com. All Rights Reserved.`;
    
    // Split and highlight domain names
    const parts = textToRender.split(/(lemoott\.com|Video\.com|www\.viaviweb\.com)/gi);
    
    return (
      <p>
        {parts.map((part, index) => {
          if (/lemoott\.com|Video\.com|www\.viaviweb\.com/i.test(part)) {
            return (
              <span key={index} className="highlight">
                {part.replace(/Video\.com|www\.viaviweb\.com/gi, 'lemoott.com')}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <footer className="admin-footer">
      {renderContent()}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-footer {
          text-align: center;
          padding: 30px 0;
          border-top: 1px solid #222;
          color: #888;
          font-size: 0.95rem;
          margin-top: 40px;
          background-color: transparent;
          width: 100%;
        }

        .admin-footer .highlight {
          color: #0066ff;
          font-weight: 500;
          cursor: pointer;
        }

        .admin-footer .highlight:hover {
          text-decoration: underline;
        }
      ` }} />
    </footer>
  );
};

export default Footer;
