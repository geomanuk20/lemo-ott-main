/**
 * Utility to format image URLs for branding (logo, favicon)
 * Handles Cloudinary URLs, local paths, and fallback to defaults
 */
export const DEFAULT_LOGO_URL = '/assets/logo.png';

export const formatBrandingUrl = (url, fallback = DEFAULT_LOGO_URL) => {
  if (!url) {
    return fallback;
  }
  
  const trimmedUrl = url.trim();
  
  // If it's already a full URL (Cloudinary, etc.)
  if (trimmedUrl.startsWith('http') || trimmedUrl.startsWith('//') || trimmedUrl.startsWith('data:')) {
    return trimmedUrl;
  }
  
  // Normalize upload/ to uploads/ for legacy support
  let normalizedPath = trimmedUrl;
  if (normalizedPath.startsWith('upload/')) {
    normalizedPath = normalizedPath.replace('upload/', 'uploads/');
  }
  
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
  
  // Use the current host but with port 5001 for the backend
  const backendBase = `${window.location.protocol}//${window.location.hostname}:5001`;
  return `${backendBase}/${cleanPath}`;
};

export const syncFavicon = (url) => {
  if (!url) return;
  
  const href = formatBrandingUrl(url, '/favicon.svg');
  
  // Update multiple icon rel types to ensure browser catches it
  const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
  
  rels.forEach(rel => {
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    
    // Reset type attribute if it's a Cloudinary/external image (usually png/jpg/ico)
    if (href.startsWith('http')) {
      link.removeAttribute('type');
    }
    
    link.href = href;
  });
};
