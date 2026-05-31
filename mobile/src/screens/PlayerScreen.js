import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  Image,
  Animated
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, MoreHorizontal } from 'lucide-react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import client from '../api/client';
import { formatImageUrl } from '../config/api';
import CustomAlert from '../components/CustomAlert';

/* ─── Custom fullscreen-brackets icon ─── */
const FullscreenIcon = () => (
  <View style={styles.fsContainer}>
    <View style={styles.fsRow}>
      <View style={[styles.fsCorner, { borderTopWidth: 1.5, borderLeftWidth: 1.5 }]} />
      <View style={[styles.fsCorner, { borderTopWidth: 1.5, borderRightWidth: 1.5 }]} />
    </View>
    <View style={styles.fsRow}>
      <View style={[styles.fsCorner, { borderBottomWidth: 1.5, borderLeftWidth: 1.5 }]} />
      <View style={[styles.fsCorner, { borderBottomWidth: 1.5, borderRightWidth: 1.5 }]} />
    </View>
  </View>
);

/* ─── PiP icon ─── */
const PipIcon = () => (
  <View style={styles.pipWrapper}>
    <View style={styles.pipInner} />
  </View>
);

/* ─── Custom Skip SVG Icon (with number centered inside loop) ─── */
const SkipIcon = ({ direction, seconds }) => {
  const isLeft = direction === 'left';
  return (
    <View style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width="44" height="44" viewBox="0 0 44 44">
        {/* Circle Arc */}
        <Path
          d={isLeft ? "M 22,9 A 13,13 0 1,0 35,22" : "M 22,9 A 13,13 0 1,1 9,22"}
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Arrow Head */}
        <Path
          d={isLeft ? "M 22,9 L 26,5 M 22,9 L 26,13" : "M 22,9 L 18,5 M 22,9 L 18,13"}
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Centered Text */}
        <SvgText
          x="22"
          y="25.5"
          fill="#fff"
          fontSize="9.5"
          fontWeight="bold"
          textAnchor="middle"
        >
          {seconds}
        </SvgText>
      </Svg>
    </View>
  );
};

/* ── helper to parse HLS master manifest for resolutions ── */
const parseHlsManifest = async (masterUrl) => {
  try {
    if (!masterUrl || !masterUrl.includes('.m3u8')) return [];
    
    const response = await fetch(masterUrl);
    if (!response.ok) return [];
    
    const text = await response.text();
    const lines = text.split('\n');
    const options = [];
    const seenNames = new Set();
    
    // Get query string from master URL to propagate tokens/signatures
    let queryString = '';
    const queryIndex = masterUrl.indexOf('?');
    if (queryIndex !== -1) {
      queryString = masterUrl.substring(queryIndex);
    }
    
    // Parse lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        // Extract RESOLUTION
        const resMatch = line.match(/RESOLUTION=(\d+)x(\d+)/i);
        let name = '';
        if (resMatch) {
          const height = resMatch[2];
          name = `${height}p`;
        }
        
        // Next line contains the URL/path of the sub-manifest
        if (i + 1 < lines.length) {
          let urlLine = lines[i + 1].trim();
          if (urlLine && !urlLine.startsWith('#')) {
            // Resolve relative URL
            let absoluteUrl = urlLine;
            if (!urlLine.startsWith('http')) {
              // Get base URL of masterUrl
              const cleanMasterUrl = masterUrl.split('?')[0];
              const lastSlashIndex = cleanMasterUrl.lastIndexOf('/');
              const baseUrl = cleanMasterUrl.substring(0, lastSlashIndex + 1);
              
              if (urlLine.startsWith('/')) {
                // Host-relative URL
                try {
                  const urlObj = new URL(masterUrl);
                  absoluteUrl = `${urlObj.protocol}//${urlObj.host}${urlLine}`;
                } catch {
                  const hostIndex = masterUrl.indexOf('/', masterUrl.indexOf('//') + 2);
                  const host = hostIndex !== -1 ? masterUrl.substring(0, hostIndex) : masterUrl;
                  absoluteUrl = host + urlLine;
                }
              } else {
                // Path-relative URL
                absoluteUrl = baseUrl + urlLine;
              }
            }
            
            // Append query string if present (to propagate tokens)
            if (queryString) {
              if (absoluteUrl.includes('?')) {
                absoluteUrl += '&' + queryString.substring(1);
              } else {
                absoluteUrl += queryString;
              }
            }
            
            if (name && !seenNames.has(name)) {
              seenNames.add(name);
              options.push({ name, url: absoluteUrl });
            }
          }
        }
      }
    }
    
    // Sort options by resolution descending (e.g. 1080p, 720p, 480p)
    options.sort((a, b) => {
      const resA = parseInt(a.name) || 0;
      const resB = parseInt(b.name) || 0;
      return resB - resA;
    });
    
    return options;
  } catch (error) {
    console.warn('[PlayerScreen] Failed to parse HLS manifest:', error);
    return [];
  }
};

/* ── helper to resolve video URL ── */
const resolveVideoUrl = async (url, type) => {
  if (!url) return null;

  // If it's already a resolved HLS rendition/sub-manifest URL, return it as-is
  if (url.startsWith('http') && (url.includes('rendition.m3u8') || url.includes('/rendition') || url.includes('manifest.m3u8'))) {
    return url;
  }

  const isMux = type === 'MUX_PLAYER'
    || url.includes('mux.com')
    || (!url.includes('.') && url.length > 15);

  if (isMux) {
    let pid = url;
    const m = url.match(/(?:stream|player)\.mux\.com\/([a-zA-Z0-9]+)/);
    if (m) pid = m[1];
    try {
      const r = await client.get(`/mux/sign-token?playbackId=${pid}`);
      return r.data?.token
        ? `https://stream.mux.com/${pid}.m3u8?token=${r.data.token}`
        : `https://stream.mux.com/${pid}.m3u8`;
    } catch {
      return `https://stream.mux.com/${pid}.m3u8`;
    }
  } else {
    let u = url;
    if (u.startsWith('//')) u = 'https:' + u;

    // Normalize backslashes (Windows) to forward slashes
    u = u.replace(/\\/g, '/');

    if (u.includes('localhost') || u.includes('127.0.0.1')) {
      const { ACTIVE_IP } = require('../config/api');
      u = u.replace('localhost', ACTIVE_IP).replace('127.0.0.1', ACTIVE_IP);
    }

    if (u && !u.startsWith('http') && !u.startsWith('data:')) {
      const { IMAGE_URL_BASE } = require('../config/api');
      
      let path = u;
      // Strip leading public/ or public\ folder if present
      if (path.startsWith('public/')) {
        path = path.substring(7);
      }
      
      // Ensure upload/ becomes uploads/
      if (path.startsWith('upload/')) {
        path = 'uploads/' + path.substring(7);
      }
      
      // Remove leading slash if any
      if (path.startsWith('/')) {
        path = path.substring(1);
      }
      
      u = `${IMAGE_URL_BASE}/${path}`;
    }
    return u;
  }
};

export default function PlayerScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const {
    videoTitle,
    videoUrl,
    videoType,
    videoFile1080,
    videoFile720,
    videoFile480
  } = route.params;
  const insets = useSafeAreaInsets();

  const videoRef = useRef(null);
  const hideTimer = useRef(null);

  // Pulse wave animation values for when player is paused
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isAnimActive = true;
    const isPaused = !status.isPlaying;

    if (isPaused) {
      ring1Scale.setValue(1);
      ring1Opacity.setValue(0.6);
      ring2Scale.setValue(1);
      ring2Opacity.setValue(0.6);

      const animateRing1 = () => {
        if (!isAnimActive) return;
        ring1Scale.setValue(1);
        ring1Opacity.setValue(0.6);
        Animated.parallel([
          Animated.timing(ring1Scale, {
            toValue: 1.75,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ring1Opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          })
        ]).start(() => {
          if (isAnimActive) animateRing1();
        });
      };

      const animateRing2 = () => {
        if (!isAnimActive) return;
        ring2Scale.setValue(1);
        ring2Opacity.setValue(0.6);
        Animated.parallel([
          Animated.timing(ring2Scale, {
            toValue: 1.75,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ring2Opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          })
        ]).start(() => {
          if (isAnimActive) animateRing2();
        });
      };

      animateRing1();
      const delayTimeout = setTimeout(() => {
        animateRing2();
      }, 1000);

      return () => {
        isAnimActive = false;
        clearTimeout(delayTimeout);
        ring1Scale.setValue(1);
        ring1Opacity.setValue(0);
        ring2Scale.setValue(1);
        ring2Opacity.setValue(0);
      };
    } else {
      ring1Scale.setValue(1);
      ring1Opacity.setValue(0);
      ring2Scale.setValue(1);
      ring2Opacity.setValue(0);
    }
  }, [status.isPlaying]);

  const [loading, setLoading]           = useState(true);
  const [resolvedUrl, setResolvedUrl]   = useState(null);
  const [status, setStatus]             = useState({});
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed]               = useState(1.0);
  const [muted, setMuted]               = useState(false);
  const [barWidth, setBarWidth]         = useState(1);   // measured progress-bar width
  const [logoUrl, setLogoUrl]           = useState(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title, message, buttons = []) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons
    });
  };

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await client.get('/general-settings');
        if (res.data?.siteLogo) {
          setLogoUrl(formatImageUrl(res.data.siteLogo, 'logo'));
        }
      } catch (err) {
        console.warn('Failed to load logo settings:', err);
      }
    };
    fetchLogo();
  }, []);

  // Quality menu state and refs
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [shouldPlayNextState, setShouldPlayNextState] = useState(true);
  const [qualityOptions, setQualityOptions] = useState([
    { name: 'Auto', url: videoUrl }
  ]);
  const savedPositionRef = useRef(0);
  const wasPlayingRef = useRef(true);
  const shouldSeekRef = useRef(false);
  const lastRequestedQualityRef = useRef(null);

  const isPremiumUser = () => {
    if (!user) return false;
    const plan = user.subscriptionPlan || 'Basic Plan';
    if (plan.toLowerCase() === 'basic plan') {
      return false;
    }
    if (user.expiryDate) {
      try {
        const expiry = new Date(user.expiryDate);
        const now = new Date();
        if (expiry < now) return false;
      } catch (e) {
        console.warn('Failed to parse expiry date:', e);
      }
    }
    return true;
  };

  const isPremiumQuality = (qualityName) => {
    if (qualityName === '1080p' || qualityName === '1440p' || qualityName === '2160p' || qualityName === '4K') {
      return true;
    }
    const height = parseInt(qualityName);
    if (!isNaN(height) && height >= 1080) {
      return true;
    }
    return false;
  };

  /* ── hide status bar for immersive fullscreen ── */
  useEffect(() => {
    StatusBar.setHidden(true, 'fade');
    return () => StatusBar.setHidden(false, 'fade');
  }, []);

  // Dynamically load screen orientation to prevent crash if not installed
  let ScreenOrientation;
  try {
    ScreenOrientation = require('expo-screen-orientation');
  } catch (e) {
    // not installed
  }

  /* ── auto-lock orientation to portrait on mount ── */
  useEffect(() => {
    const lock = async () => {
      if (ScreenOrientation) {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch (e) {
          console.warn('Failed to lock orientation:', e);
        }
      }
    };
    lock();
    return () => {
      const unlock = async () => {
        if (ScreenOrientation) {
          try {
            await ScreenOrientation.unlockAsync();
          } catch (e) {
            console.warn('Failed to unlock orientation:', e);
          }
        }
      };
      unlock();
    };
  }, []);

  const toggleFullscreen = async () => {
    if (ScreenOrientation) {
      try {
        const current = await ScreenOrientation.getOrientationAsync();
        const isLandscape = 
          current === ScreenOrientation.Orientation.LANDSCAPE_LEFT || 
          current === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
        if (isLandscape) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  /* ── auto-hide controls after 4 s while playing ── */
  const resetHideTimer = () => {
    clearTimeout(hideTimer.current);
    if (status.isPlaying && !showQualityMenu) {
      hideTimer.current = setTimeout(() => setShowControls(false), 4000);
    }
  };

  useEffect(() => {
    resetHideTimer();
    return () => clearTimeout(hideTimer.current);
  }, [showControls, status.isPlaying, showQualityMenu]);

  const handleTap = () => {
    setShowControls(v => !v);
  };

  /* ── resolve initial video URL ── */
  useEffect(() => {
    let active = true;
    const resolve = async () => {
      setLoading(true);
      const u = await resolveVideoUrl(videoUrl, videoType);
      if (active && (lastRequestedQualityRef.current === null || lastRequestedQualityRef.current === 'Auto')) {
        if (u) {
          setResolvedUrl(u);
        } else {
          setLoading(false);
        }
      }
    };
    resolve();
    return () => {
      active = false;
    };
  }, [videoUrl, videoType]);

  /* ── reset quality when navigating to a new video ── */
  useEffect(() => {
    setSelectedQuality('Auto');
    setQualityOptions([{ name: 'Auto', url: videoUrl }]);
  }, [videoUrl]);

  /* ── parse HLS master manifest for resolutions ── */
  useEffect(() => {
    const fetchQualities = async () => {
      if (selectedQuality !== 'Auto' || !resolvedUrl) return;
      
      const parsed = await parseHlsManifest(resolvedUrl);
      if (parsed && parsed.length > 0) {
        setQualityOptions([
          { name: 'Auto', url: videoUrl },
          ...parsed
        ]);
      } else {
        // Fall back to database files if manifest parsing yielded nothing
        const dbOptions = [
          { name: 'Auto', url: videoUrl }
        ];
        if (videoFile1080) dbOptions.push({ name: '1080p', url: videoFile1080 });
        if (videoFile720) dbOptions.push({ name: '720p', url: videoFile720 });
        if (videoFile480) dbOptions.push({ name: '480p', url: videoFile480 });
        setQualityOptions(dbOptions);
      }
    };
    fetchQualities();
  }, [resolvedUrl]);

  const handleLoad = async () => {
    setLoading(false);
    if (shouldSeekRef.current && videoRef.current) {
      shouldSeekRef.current = false;
      try {
        if (speed !== 1.0) {
          await videoRef.current.setRateAsync(speed, true);
        }
        await videoRef.current.setIsMutedAsync(muted);
        await videoRef.current.setPositionAsync(savedPositionRef.current);
        if (wasPlayingRef.current) {
          await videoRef.current.playAsync();
        } else {
          await videoRef.current.pauseAsync();
        }
      } catch (e) {
        console.warn('[PlayerScreen] Failed to restore playback state:', e);
      }
    }
  };

  const handleQualityChange = async (qualityName, rawUrl) => {
    setShowQualityMenu(false);
    if (qualityName === selectedQuality) return;

    // Check premium access
    if (isPremiumQuality(qualityName) && !isPremiumUser()) {
      showAlert(
        'Premium Feature',
        '1080p, 1440p, and 2160p (4K) qualities are only available to Premium subscribers. Upgrade your plan to access high-definition streaming!',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade Now', 
            onPress: async () => {
              if (videoRef.current) {
                try {
                  await videoRef.current.pauseAsync();
                } catch (e) {
                  // ignore
                }
              }
              navigation.navigate('Subscription');
            } 
          }
        ]
      );
      return;
    }

    lastRequestedQualityRef.current = qualityName;
    setLoading(true);

    // Save playback state
    savedPositionRef.current = status.positionMillis || 0;
    wasPlayingRef.current = status.isPlaying || false;
    shouldSeekRef.current = true;
    setShouldPlayNextState(status.isPlaying || false);

    // Resolve URL
    const resolved = await resolveVideoUrl(rawUrl, videoType);
    
    // Ignore stale request results if a different quality was requested since starting this request
    if (lastRequestedQualityRef.current !== qualityName) {
      return;
    }

    if (!resolved) {
      setLoading(false);
      shouldSeekRef.current = false;
      return;
    }

    if (resolved === resolvedUrl) {
      setLoading(false);
      shouldSeekRef.current = false;
      setSelectedQuality(qualityName);
      return;
    }

    setSelectedQuality(qualityName);
    setResolvedUrl(resolved);
  };

  /* ── helpers ── */
  const fmt = (ms) => {
    if (!ms || isNaN(ms)) return '0:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const togglePlay = async () => {
    if (!videoRef.current) return;
    status.isPlaying ? await videoRef.current.pauseAsync()
                     : await videoRef.current.playAsync();
  };

  const seek = async (delta) => {
    if (!videoRef.current || !status.positionMillis) return;
    const next = Math.min(
      status.durationMillis || 0,
      Math.max(0, status.positionMillis + delta)
    );
    await videoRef.current.setPositionAsync(next);
  };

  const cycleSpeed = async () => {
    if (!videoRef.current) return;
    const next = speed === 1.0 ? 1.25 : speed === 1.25 ? 1.5 : speed === 1.5 ? 2.0 : 1.0;
    await videoRef.current.setRateAsync(next, true);
    setSpeed(next);
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;
    await videoRef.current.setIsMutedAsync(!muted);
    setMuted(v => !v);
  };

  const seekByTouch = (e) => {
    if (!videoRef.current || !status.durationMillis || barWidth <= 1) return;
    const pct = Math.min(1, Math.max(0, e.nativeEvent.locationX / barWidth));
    videoRef.current.setPositionAsync(pct * status.durationMillis);
  };

  const progress = status.durationMillis
    ? (status.positionMillis / status.durationMillis) * 100
    : 0;

  const [leftTaps, setLeftTaps] = useState(0);
  const [rightTaps, setRightTaps] = useState(0);
  const leftTimer = useRef(null);
  const rightTimer = useRef(null);

  const getSecondsForTaps = (taps) => {
    if (taps <= 2) return 2;
    if (taps === 3) return 5;
    return 10;
  };

  const handleLeftPress = () => {
    resetHideTimer();
    setLeftTaps(prev => {
      const next = prev + 1;
      clearTimeout(leftTimer.current);
      leftTimer.current = setTimeout(async () => {
        const secs = getSecondsForTaps(next);
        await seek(-secs * 1000);
        setLeftTaps(0);
      }, 650);
      return next;
    });
  };

  const handleRightPress = () => {
    resetHideTimer();
    setRightTaps(prev => {
      const next = prev + 1;
      clearTimeout(rightTimer.current);
      rightTimer.current = setTimeout(async () => {
        const secs = getSecondsForTaps(next);
        await seek(secs * 1000);
        setRightTaps(0);
      }, 650);
      return next;
    });
  };

  const leftSecs = leftTaps > 0 ? getSecondsForTaps(leftTaps) : 2;
  const rightSecs = rightTaps > 0 ? getSecondsForTaps(rightTaps) : 2;

  /* ─── detect embedded URLs ─── */
  const getYtId  = (u) => { const m = u?.match(/(?:youtu\.be\/|v=|embed\/)([^#&?]{11})/); return m?.[1]; };
  const getViId  = (u) => { const m = u?.match(/vimeo\.com\/(?:video\/)?(\d+)/); return m?.[1]; };

  const isMuxVideo = videoType === 'MUX_PLAYER'
    || videoUrl?.includes('mux.com')
    || (!videoUrl?.includes('.') && videoUrl?.length > 15);

  const isEmbed = !isMuxVideo && (
    videoType === 'Embed Code'
    || videoUrl?.includes('youtube.com')
    || videoUrl?.includes('youtu.be')
    || videoUrl?.includes('vimeo.com')
    || videoUrl?.trim().startsWith('<')
  );

  const renderEmbed = () => {
    const ytId = getYtId(videoUrl);
    const viId = getViId(videoUrl);
    let src = ytId ? `https://www.youtube.com/embed/${ytId}?autoplay=1&controls=1&rel=0`
             : viId ? `https://player.vimeo.com/video/${viId}?autoplay=1`
             : videoUrl?.includes('youtube.com/embed/') || videoUrl?.includes('player.vimeo.com/') ? videoUrl
             : null;

    if (!src && (videoType === 'Embed Code' || videoUrl?.trim().startsWith('<'))) {
      const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>*{margin:0;padding:0;box-sizing:border-box}body,html{width:100%;height:100%;background:#000;display:flex;justify-content:center;align-items:center;overflow:hidden}iframe,video,object,embed{width:100%!important;height:100%!important;border:none}</style></head><body>${videoUrl}</body></html>`;
      return (
        <WebView 
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} 
          containerStyle={{ backgroundColor: '#000000' }}
          source={{ html }} 
          javaScriptEnabled 
          domStorageEnabled 
          allowsFullscreenVideo 
          onLoadStart={() => setLoading(true)} 
          onLoadEnd={() => setLoading(false)} 
        />
      );
    }
    if (!src) return null;
    return (
      <WebView 
        style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} 
        containerStyle={{ backgroundColor: '#000000' }}
        source={{ uri: src }} 
        javaScriptEnabled 
        domStorageEnabled 
        allowsFullscreenVideo 
        onLoadStart={() => setLoading(true)} 
        onLoadEnd={() => setLoading(false)} 
      />
    );
  };

  /* ─── safe-area aware padding ─── */
  const pt = Math.max(10, insets.top);
  const pb = Math.max(12, insets.bottom);
  const ph = Math.max(16, Math.max(insets.left, insets.right));

  return (
    <View style={styles.root}>
      {/* Metro recompile trigger */}

      {/* ── Video layer ── */}
      {isEmbed ? (
        renderEmbed()
      ) : resolvedUrl ? (
        <View style={StyleSheet.absoluteFill}>
          <Video
            ref={videoRef}
            source={{ uri: resolvedUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls={false}
            shouldPlay={shouldPlayNextState}
            onPlaybackStatusUpdate={s => setStatus(() => s)}
            onLoadStart={() => setLoading(true)}
            onLoad={handleLoad}
            onError={e => {
              console.error('[PlayerScreen] Video error:', e);
              setLoading(false);
              shouldSeekRef.current = false;
              showAlert(
                'Playback Error',
                'Failed to load the video in the selected quality. Please check your internet connection.'
              );
            }}
          />
          {/* Logo Watermark (Top Right) */}
          <View style={[styles.watermarkContainer, { top: pt + 6, right: ph }]} pointerEvents="none">
            {logoUrl ? (
              <Image 
                source={{ uri: logoUrl }} 
                style={styles.watermarkImage} 
                resizeMode="contain" 
              />
            ) : (
              <Text style={styles.watermarkText}>
                LEMO<Text style={{ color: '#b3d332' }}>OTT</Text>
              </Text>
            )}
          </View>
        </View>
      ) : null}

      {/* ── Tap interceptor ── */}
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      {/* ── Custom Controls Overlay ── */}
      {!isEmbed && showControls && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

          {/* dim backdrop */}
          <View style={styles.dimBg} pointerEvents="none" />

          {/* ── TOP BAR ── */}
          <View style={[styles.topBar, { paddingTop: pt, paddingHorizontal: ph }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ArrowLeft color="#fff" size={22} />
            </TouchableOpacity>
            <Text style={styles.titleText} numberOfLines={1}>{videoTitle || ''}</Text>
          </View>

          {/* ── CENTER CONTROLS (skip + play/pause) ── */}
          <View style={styles.centerControls} pointerEvents="box-none">
            <TouchableOpacity onPress={handleLeftPress} style={styles.centerCircle} activeOpacity={0.7}>
              <SkipIcon direction="left" seconds={leftSecs} />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlay} style={[styles.centerCircle, styles.centerPlayCircle]} activeOpacity={0.7}>
              {!status.isPlaying && (
                <>
                  <Animated.View style={[styles.pulseRing, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} pointerEvents="none" />
                  <Animated.View style={[styles.pulseRing, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} pointerEvents="none" />
                </>
              )}
              {status.isPlaying
                ? <Play  color="#000" size={32} fill="#000" style={{ marginLeft: 4 }} />
                : <Pause color="#000" size={32} fill="#000" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRightPress} style={styles.centerCircle} activeOpacity={0.7}>
              <SkipIcon direction="right" seconds={rightSecs} />
            </TouchableOpacity>
          </View>

          {/* ── BOTTOM BAR ── */}
          <View style={[styles.bottomBar, { paddingBottom: pb, paddingHorizontal: ph }]}>

            {/* Progress bar */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={seekByTouch}
              onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
              style={styles.seekBarHit}
            >
              <View style={styles.seekTrack}>
                <View style={[styles.seekFill, { width: `${progress}%` }]} />
                <View style={[styles.seekThumb, { left: `${progress}%` }]} />
              </View>
            </TouchableOpacity>

            {/* Controls row */}
            <View style={styles.ctrlRow}>
              {/* LEFT */}
              <View style={styles.ctrlLeft}>
                <TouchableOpacity onPress={togglePlay} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {status.isPlaying
                    ? <Pause color="#b3d332" size={20} fill="#b3d332" />
                    : <Play  color="#b3d332" size={20} fill="#b3d332" />}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => seek(-10000)} style={styles.skipBtn}>
                  <Text style={styles.skipTxt}>◂10</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => seek(10000)} style={styles.skipBtn}>
                  <Text style={styles.skipTxt}>10▸</Text>
                </TouchableOpacity>


                <Text style={styles.timeTxt}>
                  {fmt(status.positionMillis)} / {fmt(status.durationMillis)}
                </Text>

                <TouchableOpacity onPress={toggleMute} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {muted
                    ? <VolumeX color="#fff" size={20} />
                    : <Volume2 color="#fff" size={20} />}
                </TouchableOpacity>
              </View>

              {/* RIGHT */}
              <View style={styles.ctrlRight}>
                {qualityOptions && qualityOptions.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => setShowQualityMenu(true)} 
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MoreHorizontal color="#fff" size={20} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={cycleSpeed} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.speedTxt}>{speed === 1.0 ? '1' : speed}x</Text>
                </TouchableOpacity>

                <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <PipIcon />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleFullscreen} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <FullscreenIcon />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ── Quality Menu Overlay ── */}
      {showQualityMenu && (
        <TouchableWithoutFeedback onPress={() => setShowQualityMenu(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.qualityMenuContainer, { bottom: pb + 56, right: ph + 16 }]}>
                {qualityOptions.map((opt) => {
                  const isPremium = isPremiumQuality(opt.name);
                  const isSubscribed = isPremiumUser();
                  return (
                    <TouchableOpacity
                      key={opt.name}
                      style={styles.menuItem}
                      onPress={() => handleQualityChange(opt.name, opt.url)}
                    >
                      <View style={styles.menuItemContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.checkIcon}>
                            {selectedQuality === opt.name ? '✓ ' : '   '}
                          </Text>
                          <Text style={[
                            styles.menuItemText,
                            selectedQuality === opt.name && styles.menuItemActiveText
                          ]}>
                            {opt.name}
                          </Text>
                        </View>
                        {isPremium && (
                          <View style={[
                            styles.proBadge,
                            isSubscribed && styles.proBadgeActive
                          ]}>
                            <Text style={styles.proBadgeText}>PRO</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Embedded back button */}
      {isEmbed && (
        <View style={[styles.embedBack, { paddingTop: pt, paddingLeft: ph }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#fff" size={22} />
            <Text style={styles.titleText} numberOfLines={1}>{videoTitle || ''}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Spinner */}
      {loading && (
        <View style={styles.spinnerOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#b3d332" />
        </View>
      )}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  /* overlays */
  dimBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* top bar */
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingBottom: 12,
    gap: 12,
    zIndex: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },

  /* bottom bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingTop: 6,
    zIndex: 20,
  },

  /* seek bar */
  seekBarHit: {
    width: '100%',
    paddingVertical: 10,
  },
  seekTrack: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 2,
    position: 'relative',
  },
  seekFill: {
    height: '100%',
    backgroundColor: '#b3d332',
    borderRadius: 2,
  },
  seekThumb: {
    position: 'absolute',
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#b3d332',
    transform: [{ translateX: -5 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 2,
  },

  /* controls row */
  ctrlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  ctrlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ctrlRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  /* skip buttons */
  skipBtn: {
    paddingHorizontal: 4,
  },
  skipTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  /* time & speed */
  timeTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  speedTxt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* pip icon */
  pipWrapper: {
    width: 20,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 2,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 1.5,
  },
  pipInner: {
    width: 6,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 0.5,
  },

  /* fullscreen brackets icon */
  fsContainer: {
    width: 18,
    height: 14,
    justifyContent: 'space-between',
  },
  fsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fsCorner: {
    width: 5,
    height: 4,
    borderColor: '#fff',
  },

  /* embedded back overlay */
  embedBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingBottom: 12,
  },
  /* ── center controls ── */
  centerControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    zIndex: 15,
  },
  centerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  centerPlayCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(179, 211, 50, 0.95)',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#b3d332',
    zIndex: -1,
  },
  centerSkipIcon: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '400',
  },
  centerSkipLabel: {
    position: 'absolute',
    bottom: 8,
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.01)',
    zIndex: 90,
  },
  qualityMenuContainer: {
    position: 'absolute',
    width: 150,
    backgroundColor: 'rgba(18, 18, 18, 0.96)',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 100,
  },
  menuItem: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  checkIcon: {
    color: '#b3d332',
    fontSize: 13,
    fontWeight: 'bold',
    width: 18,
  },
  menuItemText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  menuItemActiveText: {
    color: '#b3d332',
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: '#b3d332',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  proBadgeActive: {
    backgroundColor: '#b3d332',
  },
  proBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
  },
  watermarkContainer: {
    position: 'absolute',
    zIndex: 10,
    opacity: 0.8,
  },
  watermarkImage: {
    width: 80,
    height: 24,
  },
  watermarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
