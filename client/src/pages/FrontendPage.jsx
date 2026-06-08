import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Loader from '../components/Loader';
import FrontendLayout from '../components/FrontendLayout';

const FrontendPage = ({ fixedSlug = null }) => {
 const { slug: routeSlug } = useParams();
 const slug = fixedSlug || routeSlug;

 const [pageData, setPageData] = useState(null);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
  const fetchPage = async () => {
   try {
    setLoading(true);
    // We fetch all pages and find the one that matches the slug
    // since the API currently only supports fetching all or by ID
    const response = await fetch('/api/pages');
    const pages = await response.json();
    const foundPage = pages.find(p => p.slug === slug);
    setPageData(foundPage || null);
   } catch (error) {
    console.error('Error fetching page data:', error);
   } finally {
    setLoading(false);
   }
  };

  if (slug) {
   fetchPage();
  }
 }, [slug]);

 const handleBodyClick = (e) => {
  const anchor = e.target.closest('a');
  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href) return;

  // 1. If it starts with mailto:, it is correct
  if (href.startsWith('mailto:')) return;

  // 2. If it is a raw email address (e.g. support@lemoott.com)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(href.trim())) {
    e.preventDefault();
    window.location.href = `mailto:${href.trim()}`;
    return;
  }

  // 3. If it is a web link but doesn't start with http/https and is not relative/internal route
  if (
    href.startsWith('www.') || 
    (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('/') && !href.startsWith('#') && href.includes('.'))
  ) {
    e.preventDefault();
    const targetUrl = href.startsWith('www.') ? `https://${href}` : `https://${href}`;
    window.open(targetUrl, '_blank');
    return;
  }
 };

 return (
  <FrontendLayout isTransparent={false} showHeader={true} showFooter={true}>
   <div className="fe-page-container-v">
    {loading ? (
     <div className="fe-page-loading-v">
      <Loader size="small" />
     </div>
    ) : pageData ? (
     <div className="fe-page-content-v">
      <h1 className="fe-page-title-v">{pageData.title}</h1>
      <div 
       className="fe-page-body-v" 
       onClick={handleBodyClick}
       dangerouslySetInnerHTML={{ __html: pageData.content || '<p>No content available for this page yet.</p>' }} 
      />
     </div>
    ) : (
     <div className="fe-page-not-found-v">
      <h1>404</h1>
      <p>The page you are looking for does not exist.</p>
     </div>
    )}
   </div>

   <style dangerouslySetInnerHTML={{ __html: `
    .fe-page-container-v {
     min-height: calc(100vh - 400px);
     padding: 150px 5% 80px 5%;
     max-width: 1200px;
     margin: 0 auto;
     color: #fff;
     font-family: 'Inter', sans-serif;
    }
    
    .fe-page-loading-v {
     display: flex;
     justify-content: center;
     align-items: center;
     height: 50vh;
     color: #b3d332;
    }
    
    .fe-spinner-v {
     animation: spin 1s linear infinite;
    }
    
    .fe-page-title-v {
     font-size: 3rem;
     font-weight: 800;
     margin-bottom: 40px;
     color: #fff;
     letter-spacing: -1px;
     position: relative;
     padding-bottom: 20px;
    }
    
    .fe-page-title-v::after {
     content: '';
     position: absolute;
     left: 0;
     bottom: 0;
     width: 60px;
     height: 4px;
     background: #b3d332;
     border-radius: 2px;
    }

    .fe-page-body-v {
     font-size: 1.1rem;
     line-height: 1.8;
     color: rgba(255, 255, 255, 0.85);
    }

    .fe-page-body-v h1, 
    .fe-page-body-v h2, 
    .fe-page-body-v h3 {
     color: #fff;
     margin-top: 40px;
     margin-bottom: 20px;
     font-weight: 700;
    }

    .fe-page-body-v p {
     margin-bottom: 20px;
    }

    .fe-page-body-v a {
     color: #b3d332;
     text-decoration: none;
     transition: 0.3s;
    }

    .fe-page-body-v a:hover {
     color: #fff;
     text-decoration: underline;
    }

    .fe-page-body-v ul, 
    .fe-page-body-v ol {
     margin-bottom: 20px;
     padding-left: 20px;
    }

    .fe-page-body-v li {
     margin-bottom: 10px;
    }

    .fe-page-not-found-v {
     text-align: center;
     padding: 100px 0;
    }

    .fe-page-not-found-v h1 {
     font-size: 6rem;
     font-weight: 900;
     color: #b3d332;
     margin: 0 0 20px 0;
    }

    .fe-page-not-found-v p {
     font-size: 1.2rem;
     color: #888;
    }

    @media (max-width: 768px) {
     .fe-page-container-v {
      padding-top: 120px;
     }
     .fe-page-title-v {
      font-size: 2.2rem;
     }
     .fe-page-body-v {
      font-size: 1rem;
     }
    }
   ` }} />
  </FrontendLayout>
 );
};

export default FrontendPage;
