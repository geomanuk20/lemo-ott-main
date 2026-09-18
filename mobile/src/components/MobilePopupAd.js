import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Image,
  TouchableOpacity,
  Pressable,
  Linking,
  useWindowDimensions,
  Animated,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react-native';
import client from '../api/client';
import { formatImageUrl } from '../config/api';

// In-memory flag for session-level ad tracking
let hasShownThisSession = false;

export default function MobilePopupAd() {
  const { width, height } = useWindowDimensions();
  const [settings, setSettings] = useState(null);
  const [adsList, setAdsList] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(4 / 5);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const checkAndFetchAds = async () => {
      try {
        const res = await client.get('/popup-ads');
        if (!res || !res.data) return;

        const data = res.data;
        const config = data.settings || data;
        if (config.status !== 'ON') return;

        // Frequency evaluations
        const freq = config.frequency || 'every_session';
        const now = Date.now();
        const campaignKey = `mobile_popup_ad_${config._id || 'main'}_${config.updatedAt || '0'}`;

        if (freq === 'every_session') {
          if (hasShownThisSession) return;
        } else if (freq === 'once_per_day') {
          const lastSeenStr = await AsyncStorage.getItem('mobile_popup_ad_last_seen');
          if (lastSeenStr) {
            const lastSeen = parseInt(lastSeenStr, 10);
            if (now - lastSeen < 24 * 60 * 60 * 1000) {
              return; // Less than 24h passed
            }
          }
        } else if (freq === 'once') {
          const seenCampaign = await AsyncStorage.getItem(campaignKey);
          if (seenCampaign) return;
        }

        // Extract valid ads
        let validAds = [];
        if (Array.isArray(data.ads) && data.ads.length > 0) {
          validAds = data.ads.filter(a => a.status === 'ON' && a.imageUrl);
        } else if (data.imageUrl) {
          validAds = [{
            title: data.title || '',
            imageUrl: data.imageUrl || '',
            targetUrl: data.targetUrl || '',
            buttonText: data.buttonText || '',
            openInNewTab: data.openInNewTab !== undefined ? data.openInNewTab : true,
            displayType: data.displayType || 'image',
          }];
        }

        if (validAds.length === 0 || !isMounted) return;

        // Handle display modes
        const mode = config.displayMode || 'carousel';
        let chosenAds = validAds;

        if (mode === 'random') {
          const randomIndex = Math.floor(Math.random() * validAds.length);
          chosenAds = [validAds[randomIndex]];
        } else if (mode === 'rotation') {
          const visitCountStr = await AsyncStorage.getItem('mobile_popup_rot_idx');
          const visitCount = parseInt(visitCountStr || '0', 10);
          const pickIndex = visitCount % validAds.length;
          chosenAds = [validAds[pickIndex]];
          await AsyncStorage.setItem('mobile_popup_rot_idx', String(visitCount + 1));
        }

        setSettings(config);
        setAdsList(chosenAds);
        setActiveSlideIndex(0);

        // Preload image size for natural aspect ratio
        const firstAd = chosenAds[0];
        if (firstAd?.imageUrl) {
          const formattedUrl = formatImageUrl(firstAd.imageUrl);
          Image.getSize(
            formattedUrl,
            (imgW, imgH) => {
              if (imgW > 0 && imgH > 0 && isMounted) {
                const ratio = Math.max(0.65, Math.min(1.8, imgW / imgH));
                setAspectRatio(ratio);
              }
            },
            () => {
              // fallback default ratio
            }
          );
        }

        // Delay timer
        const delayMs = Math.max(200, (Number(config.delaySeconds) || 0) * 1000);
        setTimeout(async () => {
          if (!isMounted) return;

          hasShownThisSession = true;
          scaleAnim.setValue(0.85);
          opacityAnim.setValue(0);
          setIsVisible(true);

          // Animate in
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 8,
              tension: 65,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start();

          // Save frequency record
          if (freq === 'once_per_day') {
            await AsyncStorage.setItem('mobile_popup_ad_last_seen', String(Date.now()));
          } else if (freq === 'once') {
            await AsyncStorage.setItem(campaignKey, 'true');
          }
        }, delayMs);
      } catch (err) {
        console.warn('[MobilePopupAd] Error checking popup ads:', err.message || err);
      }
    };

    checkAndFetchAds();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update aspect ratio when active slide changes
  useEffect(() => {
    if (!adsList || adsList.length === 0) return;
    const current = adsList[activeSlideIndex];
    if (current?.imageUrl) {
      setImageLoading(true);
      const formattedUrl = formatImageUrl(current.imageUrl);
      Image.getSize(
        formattedUrl,
        (imgW, imgH) => {
          if (imgW > 0 && imgH > 0) {
            const ratio = Math.max(0.65, Math.min(1.8, imgW / imgH));
            setAspectRatio(ratio);
          }
        },
        () => {}
      );
    }
  }, [activeSlideIndex, adsList]);

  // Carousel autoplay
  useEffect(() => {
    if (!isVisible || adsList.length <= 1 || isPaused) return;

    const autoplay = settings?.carouselAutoplay !== false;
    if (!autoplay) return;

    const intervalSec = Number(settings?.carouselInterval) || 4;
    const timer = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % adsList.length);
    }, Math.max(2, intervalSec) * 1000);

    return () => clearInterval(timer);
  }, [isVisible, adsList.length, isPaused, settings?.carouselAutoplay, settings?.carouselInterval]);

  // Auto-close timer
  useEffect(() => {
    if (isVisible && settings && Number(settings.autoCloseSeconds) > 0) {
      const closeTimer = setTimeout(() => {
        handleClose();
      }, Number(settings.autoCloseSeconds) * 1000);

      return () => clearTimeout(closeTimer);
    }
  }, [isVisible, settings]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const handleAdPress = (ad) => {
    if (ad?.targetUrl && ad.targetUrl.trim() !== '') {
      let target = ad.targetUrl.trim();
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = `https://${target}`;
      }
      Linking.openURL(target).catch(err => {
        console.warn('[MobilePopupAd] Could not open URL:', err);
      });
      handleClose();
    }
  };

  if (!isVisible || !settings || adsList.length === 0) {
    return null;
  }

  const currentAd = adsList[activeSlideIndex] || adsList[0];
  const imageUrl = currentAd?.imageUrl ? formatImageUrl(currentAd.imageUrl) : null;
  const modalWidth = Math.min(width - 32, 380);
  const maxImgHeight = Math.min(height * 0.62, 480);
  const computedImgHeight = Math.min(maxImgHeight, modalWidth / aspectRatio);

  const showClose = settings.showCloseButton !== false;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop overlay */}
        <Pressable style={styles.backdrop} onPress={handleClose} />

        {/* Modal Card Content */}
        <Animated.View
          style={[
            styles.modalCard,
            {
              width: modalWidth,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Close Icon Button */}
          {showClose && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X color="#ffffff" size={16} strokeWidth={2.5} />
            </TouchableOpacity>
          )}

          {/* Main Image Banner Clickable Area */}
          <TouchableOpacity
            activeOpacity={currentAd.targetUrl ? 0.92 : 1}
            onPress={() => handleAdPress(currentAd)}
            style={[styles.imageContainer, { height: computedImgHeight }]}
          >
            {imageUrl ? (
              <>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.adImage}
                  resizeMode="cover"
                  onLoadStart={() => setImageLoading(true)}
                  onLoad={() => setImageLoading(false)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
                {imageLoading && (
                  <View style={styles.imageLoader}>
                    <ActivityIndicator color="#b3d332" size="small" />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.adTitleText}>{currentAd.title || 'Special Announcement'}</Text>
              </View>
            )}

            {/* Carousel Nav Arrows */}
            {adsList.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navArrow, styles.navArrowLeft]}
                  activeOpacity={0.85}
                  onPress={(e) => {
                    e.stopPropagation();
                    setActiveSlideIndex(prev => (prev - 1 + adsList.length) % adsList.length);
                  }}
                >
                  <ChevronLeft color="#fff" size={18} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navArrow, styles.navArrowRight]}
                  activeOpacity={0.85}
                  onPress={(e) => {
                    e.stopPropagation();
                    setActiveSlideIndex(prev => (prev + 1) % adsList.length);
                  }}
                >
                  <ChevronRight color="#fff" size={18} strokeWidth={2.5} />
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>

          {/* Footer Banner / CTA Button */}
          {(currentAd.title || currentAd.buttonText || adsList.length > 1) ? (
            <View style={styles.footerContainer}>
              {currentAd.title ? (
                <Text style={styles.adTitle} numberOfLines={1}>
                  {currentAd.title}
                </Text>
              ) : null}

              {adsList.length > 1 && (
                <View style={styles.dotsRow}>
                  {adsList.map((_, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setActiveSlideIndex(idx)}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <View
                        style={[
                          styles.dot,
                          idx === activeSlideIndex && styles.dotActive,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {currentAd.buttonText && currentAd.targetUrl ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleAdPress(currentAd)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnText}>
                    {currentAd.buttonText}
                  </Text>
                  <ExternalLink color="#000000" size={14} strokeWidth={2.5} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
  },
  modalCard: {
    backgroundColor: '#0a0a0c',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 25,
    position: 'relative',
    zIndex: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 60,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#0a0a0c',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  placeholderBox: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adTitleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 30,
  },
  navArrowLeft: {
    left: 8,
  },
  navArrowRight: {
    right: 8,
  },
  footerContainer: {
    padding: 14,
    backgroundColor: '#0a0a0c',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  adTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#b3d332',
  },
  actionBtn: {
    backgroundColor: '#b3d332',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    marginTop: 2,
  },
  actionBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
