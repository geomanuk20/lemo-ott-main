/**
 * Utility to format image URLs consistently across the app.
 * Handles Cloudinary URLs, local paths, and fallback images.
 */
export const formatImageUrl = (item, type = 'poster') => {
  if (!item) {
    if (type === 'logo') return '/assets/LOGO PNG-01.png';
    return 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop';
  }

  // If item is already a string (direct URL)
  if (typeof item === 'string') {
    return resolvePath(item);
  }

  // Extract URL based on type
  let url = '';
  if (type === 'landscape') {
    url = item.thumbnail || item.landscapePoster || item.backdrop || item.poster || item.logo || item.posterImage || item.image || item.imageUrl || '';
  } else if (type === 'poster') {
    url = item.poster || item.posterImage || item.thumbnail || item.logo || item.image || item.imageUrl || '';
  } else if (type === 'slider') {
    url = item.image || item.sliderImage || item.thumbnail || item.landscapePoster || item.backdrop || item.imageUrl || item.poster || item.logo || '';
  } else if (type === 'thumbnail') {
    url = item.thumbnail || item.landscapePoster || item.backdrop || item.image || item.poster || item.logo || '';
  } else {
    url = item.thumbnail || item.landscapePoster || item.image || item.imageUrl || item.poster || '';
  }

  return resolvePath(url);
};

function resolvePath(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  
  const trimmedUrl = url.trim();

  // If it's already a full URL or a data URL (Base64)
  if (trimmedUrl.startsWith('http') || trimmedUrl.startsWith('//') || trimmedUrl.startsWith('data:')) {
    return trimmedUrl;
  }

  // Normalize path
  let normalizedPath = trimmedUrl;
  if (normalizedPath.startsWith('upload/')) {
    normalizedPath = normalizedPath.replace('upload/', 'uploads/');
  }

  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
  
  // Use current host for backend
  const backendBase = `${window.location.protocol}//${window.location.hostname}:5001`;
  return `${backendBase}/${cleanPath}`;
}
