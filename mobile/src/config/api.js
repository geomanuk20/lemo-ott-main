import { Platform } from 'react-native';
import Constants from 'expo-constants';

// For physical device testing, replace this with your machine's local network IP address (e.g. '192.168.1.50')
const LOCAL_IP = '192.168.1.3'; 

// Dynamically detect the host IP address (works for simulators/emulators and physical devices)
const getHostIP = () => {
  // Dynamically extract the host IP from the Expo manifest (gets the exact machine IP running Metro)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }

  // Fallback: Simulator/Emulator gets localhost, default fallback to LOCAL_IP
  return Platform.select({
    ios: 'localhost',
    android: '10.0.2.2',
    default: LOCAL_IP
  });
};

export const ACTIVE_IP = getHostIP();

export const PRODUCTION_URL = 'https://lemoott.com';

// Set to true if you want to test the production backend API during local development/simulation
const FORCE_PRODUCTION_API = false;

const useProduction = !__DEV__ || FORCE_PRODUCTION_API;

export const BASE_URL = useProduction
  ? `${PRODUCTION_URL}/api`
  : `http://${ACTIVE_IP}:5001/api`;

export const IMAGE_URL_BASE = useProduction
  ? PRODUCTION_URL
  : `http://${ACTIVE_IP}:5001`;


/**
 * Normalizes relative image paths from the server to full URLs.
 */
export const formatImageUrl = (item, type = 'poster') => {
  if (!item) {
    if (type === 'logo') return 'https://placehold.co/150x50/png?text=LEMO';
    return 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop';
  }

  // If item is already a string (direct URL)
  if (typeof item === 'string') {
    return resolvePath(item);
  }

  // Extract URL based on type
  let url = '';
  if (type === 'landscape') {
    url = item.landscapePoster || item.poster || item.logo || item.thumbnail || item.posterImage || item.image || item.imageUrl || '';
  } else if (type === 'poster') {
    url = item.poster || item.logo || item.thumbnail || item.posterImage || item.image || item.imageUrl || '';
  } else if (type === 'slider') {
    url = item.image || item.sliderImage || item.imageUrl || item.poster || item.thumbnail || item.logo || '';
  } else {
    url = item.image || item.imageUrl || item.poster || '';
  }

  return resolvePath(url);
};

function resolvePath(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop';
  
  let trimmedUrl = url.trim();

  // Replace localhost/127.0.0.1 with active IP for mobile simulation/device requests
  if (trimmedUrl.includes('localhost') || trimmedUrl.includes('127.0.0.1')) {
    trimmedUrl = trimmedUrl.replace('localhost', ACTIVE_IP).replace('127.0.0.1', ACTIVE_IP);
  }

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
  
  return `${IMAGE_URL_BASE}/${cleanPath}`;
}
