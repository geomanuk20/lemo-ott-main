import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
  Alert,
  Share,
  Modal,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Bookmark, BookmarkCheck, ArrowLeft, Clock, Calendar, Globe, Crown, Eye, Share2, Star } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import CustomAlert from '../components/CustomAlert';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { formatImageUrl, PRODUCTION_URL } from '../config/api';

const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

const AvatarImage = ({ item, style }) => {
  const name = typeof item === 'object' ? item.name : (item || '');
  const imageUrl = typeof item === 'object' && item.image ? formatImageUrl(item.image) : null;
  const [hasError, setHasError] = useState(!imageUrl || imageUrl.includes('placehold.co'));

  useEffect(() => {
    setHasError(!imageUrl || imageUrl.includes('placehold.co'));
  }, [imageUrl]);

  const getInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (hasError) {
    return (
      <View style={[style, styles.initialsAvatar]}>
        <Text style={styles.initialsText}>{getInitials(name)}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      onError={() => setHasError(true)}
    />
  );
};

const formatViews = (count, docId = '') => {
  let num = parseInt(count, 10);
  if (isNaN(num) || num === 0) {
    if (docId && docId.length >= 8) {
      const hexPart = docId.substring(0, 8);
      const seed = parseInt(hexPart, 16);
      num = (seed % 1900) + 100;
    } else {
      num = 500;
    }
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M Views';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K Views';
  }
  return num + ' Views';
};

const formatReleaseDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch (e) {
    return '';
  }
};

const IMDBRatingCircle = ({ rating }) => {
  const ratingVal = parseFloat(rating || '7.5');
  const normalizedRating = Math.min(Math.max(ratingVal, 0), 10);
  const size = 44;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * normalizedRating) / 10;

  return (
    <View style={styles.ratingCircleContainer}>
      <Svg width={size} height={size}>
        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Active Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#b3d332"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ratingCircleTextContainer}>
        <Text style={styles.ratingCircleText}>{normalizedRating.toFixed(1)}</Text>
      </View>
    </View>
  );
};

const getNormalizedType = (rawType) => {
  if (!rawType) return 'movie';
  const t = rawType.toLowerCase().trim();
  
  if (t === 'movie' || t === 'movies' || t === 'short-film' || t === 'short film') {
    return 'movie';
  }
  if (t === 'show' || t === 'shows' || t === 'tv show' || t === 'tv-show' || t === 'tv shows' || t === 'web series' || t === 'web-series' || t === 'short web series' || t === 'short web-series') {
    return 'show';
  }
  if (t === 'sports' || t === 'sports-videos' || t === 'sports videos' || t === 'sport') {
    return 'sports';
  }
  if (t === 'live' || t === 'live tv' || t === 'live-tv' || t === 'live tvs' || t === 'channel' || t === 'tv-channels' || t === 'tv-channel') {
    return 'live';
  }
  if (t === 'new-release' || t === 'new release' || t === 'new-releases' || t === 'new releases') {
    return 'new-release';
  }
  return t;
};

export default function DetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const type = getNormalizedType(route.params.type);
  const { user } = useContext(AuthContext);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const heroHeight = isLandscape ? windowHeight * 0.75 : windowWidth * 0.5625;

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

  const checkIsPaid = (item, contentType) => {
    if (!item) return false;
    const t = (contentType || '').toLowerCase().trim();
    if (t === 'show' || t === 'shows' || t === 'series' || t === 'short-web-series' || t === 'web-series') {
      return (item.seriesAccess || '').toLowerCase() === 'paid';
    } else if (t === 'live' || t === 'channel' || t === 'channels' || t === 'tv-channel' || t === 'tv-channels') {
      return (item.tvAccess || '').toLowerCase() === 'paid' || (item.access || '').toLowerCase() === 'paid';
    } else {
      // movie, movies, short-film, sports, new-releases, new-release, etc.
      return (item.access || '').toLowerCase() === 'paid';
    }
  };

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [related, setRelated] = useState([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('Failed to load content details.');

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startPulse = () => {
      pulseAnim.setValue(0);
      Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ).start();
    };

    if (detail && !loading) {
      startPulse();
    }
  }, [detail, loading]);

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
    setRelated([]);
    const fetchDetails = async () => {
      try {
        let endpoint = '';
        if (type === 'movie') endpoint = `/movies/${id}`;
        else if (type === 'show') endpoint = `/shows/${id}`;
        else if (type === 'sports') endpoint = `/sports-videos/${id}`;
        else if (type === 'live') endpoint = `/tv-channels/${id}`;
        else if (type === 'new-release') endpoint = `/new-releases/${id}`;

        const res = await client.get(endpoint);
        setDetail(res.data);

        // Fetch related content
        let relatedEndpoint = '';
        if (type === 'movie') relatedEndpoint = '/movies';
        else if (type === 'show') relatedEndpoint = '/shows';
        else if (type === 'sports') relatedEndpoint = '/sports-videos';
        else if (type === 'live') relatedEndpoint = '/tv-channels';
        else if (type === 'new-release') relatedEndpoint = '/new-releases';

        if (relatedEndpoint) {
          try {
            const relatedRes = await client.get(relatedEndpoint);
            if (relatedRes && relatedRes.data) {
              const relatedResult = Array.isArray(relatedRes.data) ? relatedRes.data : [];
              const parentId = res.data?.showId ? (typeof res.data.showId === 'object' ? (res.data.showId._id || res.data.showId.id) : res.data.showId) : '';
              const finalRelated = relatedResult
                .filter(item => item._id !== id && item._id !== parentId && item.status === 'Active')
                .slice(0, 6);
              setRelated(finalRelated);
            }
          } catch (err) {
            console.error('Error fetching related content:', err);
          }
        }

        // If it's a TV show, load seasons and episodes
        if (type === 'show') {
          const [seasonsRes, episodesRes] = await Promise.all([
            client.get(`/seasons?showId=${id}`),
            client.get(`/episodes?showId=${id}`)
          ]);
          setSeasons(seasonsRes.data || []);
          setEpisodes(episodesRes.data || []);
          if (seasonsRes.data && seasonsRes.data.length > 0) {
            setSelectedSeason(seasonsRes.data[0]._id);
          }
        }

        // Check watchlist status and user rating status
        if (user && user.id) {
          const [wlRes, rateRes] = await Promise.all([
            client.get(`/watchlist/${user.id}`),
            client.get(`/ratings/status?userId=${user.id}&contentId=${id}`).catch(() => null)
          ]);
          if (wlRes && wlRes.data) {
            const isMatch = wlRes.data.some(item => item._id === id);
            setInWatchlist(isMatch);
          }
          if (rateRes && rateRes.data && rateRes.data.rated) {
            setUserRating(rateRes.data.rating);
            setSelectedRating(rateRes.data.rating);
          }
        }
      } catch (error) {
        console.error('Error fetching details:', error);
        if (error.response && error.response.status === 403) {
          setErrorMsg('This content is currently unavailable.');
        } else {
          setErrorMsg('Failed to load content details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, type, user]);

  const handleWatchlistToggle = async () => {
    if (!user || !user.id) {
      navigation.navigate('Login');
      return;
    }
    if (watchlistLoading) return;
    setWatchlistLoading(true);
    try {
      const response = await client.post('/watchlist/toggle', {
        userId: user.id,
        contentId: id,
        contentType: type
      });
      setInWatchlist(response.data.status === 'added');
      showNotification(response.data.message);
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleShare = async () => {
    if (!detail) return;
    try {
      const shareType = type === 'new-release' ? 'new-release' : type;
      const shareUrl = `${PRODUCTION_URL}/${shareType}/${id}`;
      const titleText = detail.title || detail.name || 'Content';
      const message = `Check out ${titleText} on LEMO OTT!\n\n🎬 Watch now: ${shareUrl}`;

      await Share.share({
        message: message,
        url: shareUrl,
        title: titleText,
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  };

  const handleRateSubmit = async () => {
    if (!user || !user.id) {
      setRatingModalVisible(false);
      showAlert(
        'Sign In Required',
        'Please sign in to rate content.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      showAlert('Selection Required', 'Please select at least 1 star to rate.');
      return;
    }

    setRatingSubmitting(true);
    try {
      const response = await client.post('/ratings', {
        userId: user.id,
        contentId: id,
        contentType: type,
        rating: selectedRating
      });

      if (response.data) {
        setUserRating(selectedRating);
        // Dynamically update the average rating and ratings count on the details page instantly
        setDetail(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            imdbRating: response.data.averageRating,
            ratingsCount: response.data.ratingsCount
          };
        });
        setRatingModalVisible(false);
        showAlert('Thank You', 'Your rating has been submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showAlert('Submission Failed', 'Failed to submit rating. Please try again.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handlePlayTrailer = () => {
    if (!detail || !detail.trailerUrl) return;

    // Only signed-in users can play trailers
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    console.log('[DetailsScreen] Playing Trailer URL:', detail.trailerUrl);

    const isEmbed = detail.trailerUrl.trim().startsWith('<') ||
                    detail.trailerUrl.includes('youtube.com') ||
                    detail.trailerUrl.includes('youtu.be') ||
                    detail.trailerUrl.includes('vimeo.com');

    navigation.navigate('Player', {
      videoTitle: `${detail.title || detail.name} - Trailer`,
      videoUrl: detail.trailerUrl,
      videoType: isEmbed ? 'Embed Code' : 'URL',
      videoId: `${detail._id}_trailer`,
      videoFile1080: '',
      videoFile720: '',
      videoFile480: ''
    });
  };

  const handlePlayMainVideo = () => {
    if (!detail) return;

    // Only signed-in users can play videos
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    // Gating check for Paid content
    const isPaidContent = checkIsPaid(detail, type);
    if (isPaidContent && !isPremiumUser()) {
      showAlert(
        'Premium Content',
        'This content is only available to Premium subscribers. Upgrade your plan to watch!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Plan', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    const videoUrl = detail.videoFile || detail.videoUrl || detail.streamUrl || detail.videoFile1080 || detail.videoFile720 || detail.videoFile480 || detail.server1Url || detail.server2Url || detail.server3Url || detail.embedUrl || detail.embedCode || '';
    let videoType = detail.videoType || detail.streamType || 'hls';
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim().startsWith('<')) {
      videoType = 'Embed Code';
    }

    console.log('[DetailsScreen] Playing Main Video:', { title: detail.title || detail.name, videoUrl, videoType });

    if (!videoUrl) {
      showAlert(
        'Video Unavailable',
        'No playable video URL is configured for this video.'
      );
      return;
    }

    // Increment view counts
    client.post(`/contents/${type}/${id}/view`).catch(err => console.warn(err));

    navigation.navigate('Player', {
      videoTitle: detail.title || detail.name,
      videoUrl: videoUrl,
      videoType: videoType,
      videoId: detail._id,
      videoFile1080: detail.videoFile1080 || '',
      videoFile720: detail.videoFile720 || '',
      videoFile480: detail.videoFile480 || '',
      contentType: type,
      subtitles: detail.subtitles || [],
      subtitlesActive: detail.subtitlesActive || 'Inactive'
    });
  };

  const handlePlayEpisode = (episode) => {
    console.log('[DetailsScreen] Playing Episode:', episode);

    // Only signed-in users can play videos
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    // Gating check for Paid episode
    const seriesIsPaid = checkIsPaid(detail, 'show');
    const episodeIsPaid = (episode.access || '').toLowerCase() === 'paid';
    if ((seriesIsPaid || episodeIsPaid) && !isPremiumUser()) {
      showAlert(
        'Premium Content',
        'This episode is only available to Premium subscribers. Upgrade your plan to watch!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Plan', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }
    
    // Check all potential video URL fields
    const videoUrl = episode.videoFile || 
                     episode.videoUrl || 
                     episode.streamUrl || 
                     episode.videoFile1080 || 
                     episode.videoFile720 || 
                     episode.videoFile480 || 
                     episode.server1Url || 
                     episode.server2Url || 
                     episode.server3Url || 
                     episode.embedUrl || 
                     '';
                     
    const videoType = episode.videoType || episode.streamType || 'hls';

    if (!videoUrl) {
      showAlert(
        'Video Unavailable',
        'No playable video URL is configured for this episode.'
      );
      return;
    }

    navigation.navigate('Player', {
      videoTitle: `${detail.title} - ${episode.title}`,
      videoUrl: videoUrl,
      videoType: videoType,
      videoId: episode._id,
      videoFile1080: episode.videoFile1080 || '',
      videoFile720: episode.videoFile720 || '',
      videoFile480: episode.videoFile480 || '',
      subtitles: episode.subtitles || [],
      subtitlesActive: episode.subtitlesActive || 'Inactive'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b3d332" />
      </View>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#ffffff" size={20} />
            <Text style={{ color: '#fff', marginLeft: 8 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const posterUrl = formatImageUrl(detail, 'landscape');
  const genresText = detail.genres 
    ? detail.genres.map(g => (typeof g === 'object' ? g.name : g)).join(', ')
    : '';

  // Filter episodes for the currently selected season
  const currentEpisodes = episodes.filter(ep => {
    if (detail?.contentType?.toLowerCase().includes('short')) return true;
    if (!ep.seasonId) return false;
    const epSeasonIdStr = typeof ep.seasonId === 'object' ? (ep.seasonId?._id || ep.seasonId?.id || '').toString() : ep.seasonId.toString();
    const currentSeasonIdStr = selectedSeason ? selectedSeason.toString() : '';
    return epSeasonIdStr && currentSeasonIdStr && epSeasonIdStr === currentSeasonIdStr;
  });

  return (
    <View style={styles.container}>
      {/* Absolute Back Button */}
      <SafeAreaView style={styles.absoluteHeader} pointerEvents="box-none">
        <TouchableOpacity style={styles.backButtonCircle} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#ffffff" size={22} />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Poster / Hero Section */}
        <View style={[styles.heroContainer, { width: windowWidth, height: heroHeight }]}>
          <Image source={{ uri: posterUrl }} style={styles.heroImage} resizeMode="cover" />
          
          {detail.upcoming?.toLowerCase() === 'yes' ? (
            <View style={styles.heroUpcomingOverlay}>
              <View style={styles.mobileUpcomingBadgeOverlay}>
                <Text style={styles.mobileUpcomingBadgeOverlayText}>COMING SOON</Text>
              </View>
            </View>
          ) : (
            type !== 'show' && (
              <View style={styles.heroPlayOverlay}>
                <View style={styles.playWithWaveContainer}>
                  <Animated.View
                    style={[
                      styles.waveRipple,
                      {
                        transform: [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 2.2],
                            }),
                          },
                        ],
                        opacity: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 0],
                        }),
                      },
                    ]}
                  />
                  <TouchableOpacity style={styles.playIconButtonSmall} onPress={handlePlayMainVideo} activeOpacity={0.8}>
                    <Play color="#000" size={20} fill="#000" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        </View>

        {/* Content Meta Details */}
        <View style={styles.contentInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{detail.title || detail.name}</Text>
            {checkIsPaid(detail, type) && (() => {
              const isSubscribed = isPremiumUser();
              return (
                <View style={[
                  styles.premiumDetailBadge,
                  isSubscribed && { backgroundColor: '#ffffff' }
                ]}>
                  <Crown 
                    color={isSubscribed ? '#000000' : '#000000'} 
                    size={12} 
                    fill={isSubscribed ? '#000000' : '#000000'} 
                  />
                  <Text style={[
                    styles.premiumDetailText,
                    isSubscribed && { color: '#000000' }
                  ]}>PREMIUM</Text>
                </View>
              );
            })()}
          </View>
          
          {/* Bottom Stats / Metadata section */}
          <View style={styles.visualStatsRow}>
            <View style={styles.statsList}>
              <View style={styles.statItem}>
                <Eye color="#8e8e93" size={16} />
                <Text style={styles.statText}>{formatViews(detail.views, detail._id)}</Text>
              </View>
              <View style={styles.statItem}>
                <Calendar color="#8e8e93" size={16} />
                <Text style={styles.statText}>
                  {formatReleaseDate(detail.releaseDate || detail.createdAt) || detail.releaseYear || detail.year || 'N/A'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Clock color="#8e8e93" size={16} />
                <Text style={styles.statText}>{detail.duration || '2h 30m'}</Text>
              </View>
            </View>
            
            <View style={styles.ratingSectionContainer}>
              <IMDBRatingCircle rating={detail.imdbRating} />
              <Text style={styles.ratingsCountText}>
                {detail.ratingsCount && detail.ratingsCount > 0 
                  ? `${detail.ratingsCount} ${detail.ratingsCount === 1 ? 'rating' : 'ratings'}`
                  : 'No ratings'}
              </Text>
            </View>
          </View>

          {/* Action buttons container */}
          <View style={styles.actionsContainer}>
            {type !== 'show' && (
              detail.upcoming?.toLowerCase() === 'yes' ? (
                <View style={[styles.mainPlayBtn, { backgroundColor: '#333', opacity: 0.6 }]}>
                  <Text style={[styles.mainPlayBtnText, { color: '#888' }]}>Coming Soon</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.mainPlayBtn} onPress={handlePlayMainVideo}>
                  <Play color="#000000" size={18} fill="#000000" />
                  <Text style={styles.mainPlayBtnText}>Play</Text>
                </TouchableOpacity>
              )
            )}

            {detail.trailerUrl && detail.trailerUrl.trim() !== '' ? (
              <TouchableOpacity style={styles.trailerBtn} onPress={handlePlayTrailer}>
                <Play color="#ffffff" size={18} fill="#ffffff" />
                <Text style={styles.trailerBtnText}>Watch Trailer</Text>
              </TouchableOpacity>
            ) : null}
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity 
                style={styles.watchlistBtn} 
                onPress={handleWatchlistToggle}
                disabled={watchlistLoading}
              >
                {inWatchlist ? (
                  <>
                    <BookmarkCheck color="#b3d332" size={18} />
                    <Text style={[styles.watchlistBtnText, { color: '#b3d332' }]}>In Watchlist</Text>
                  </>
                ) : (
                  <>
                    <Bookmark color="#ffffff" size={18} />
                    <Text style={styles.watchlistBtnText}>Add Watchlist</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Share2 color="#ffffff" size={18} />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.rateBtn} onPress={() => setRatingModalVisible(true)}>
                <Star color={userRating > 0 ? '#b3d332' : '#ffffff'} size={18} fill={userRating > 0 ? '#b3d332' : 'transparent'} />
                <Text style={[styles.rateBtnText, userRating > 0 && { color: '#b3d332' }]}>
                  {userRating > 0 ? `Rated ${userRating}★` : 'Rate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Genre, Language & Synopsis */}
          {genresText ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.infoLabel}>Genres</Text>
              <Text style={styles.infoValue}>{genresText}</Text>
            </View>
          ) : null}

          {detail.language ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.infoLabel}>Language</Text>
              <Text style={styles.infoValue}>{typeof detail.language === 'object' ? detail.language.name : detail.language}</Text>
            </View>
          ) : null}

          {detail.description || detail.synopsis ? (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.infoLabel}>Overview</Text>
              <Text style={styles.descriptionText}>{stripHtml(detail.description || detail.synopsis)}</Text>
            </View>
          ) : null}

          {/* Directors Section */}
          {(detail.directors && detail.directors.length > 0) && (
            <View style={[styles.castContainer, { marginBottom: 15 }]}>
              <Text style={styles.infoLabel}>Director{detail.directors.length > 1 ? 's' : ''}</Text>
              <FlatList
                data={detail.directors}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, idx) => idx.toString()}
                renderItem={({ item }) => {
                  const directorName = typeof item === 'object' ? item.name : item;
                  return (
                    <View style={styles.castCard}>
                      <AvatarImage item={item} style={styles.castAvatar} />
                      <Text style={styles.castName} numberOfLines={2}>{directorName}</Text>
                    </View>
                  );
                }}
              />
            </View>
          )}

          {/* Cast & Crew Section */}
          {(detail.actors && detail.actors.length > 0) && (
            <View style={styles.castContainer}>
              <Text style={styles.infoLabel}>Cast & Crew</Text>
              <FlatList
                data={detail.actors}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, idx) => idx.toString()}
                renderItem={({ item }) => {
                  const castName = typeof item === 'object' ? item.name : item;
                  return (
                    <View style={styles.castCard}>
                      <AvatarImage item={item} style={styles.castAvatar} />
                      <Text style={styles.castName} numberOfLines={2}>{castName}</Text>
                    </View>
                  );
                }}
              />
            </View>
          )}

          {/* Season and Episode browser (For Web Series) */}
          {detail.upcoming?.toLowerCase() === 'yes' ? (
            <View style={styles.upcomingEpisodesWrapper}>
              <Text style={styles.upcomingEpisodesTitle}>Episodes Coming Soon</Text>
              <Text style={styles.upcomingEpisodesSubtitle}>Stay tuned! Episodes will be available soon.</Text>
            </View>
          ) : type === 'show' && (seasons.length > 0 || detail?.contentType === 'Short Web Series' || detail?.contentType === 'Short Web-Series') && (
            <View style={styles.seasonsWrapper}>
              <Text style={styles.infoLabel}>Episodes</Text>
              
              {/* Season Tabs Selector */}
              {!detail?.contentType?.toLowerCase().includes('short') && seasons.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonTabs}>
                  {seasons.map((season) => (
                    <TouchableOpacity
                      key={season._id}
                      style={[styles.seasonTabBtn, selectedSeason === season._id ? styles.activeSeasonTab : null]}
                      onPress={() => setSelectedSeason(season._id)}
                    >
                      <Text style={[styles.seasonTabBtnText, selectedSeason === season._id ? styles.activeSeasonTabBtnText : null]}>
                        {season.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Episode list */}
              {currentEpisodes.length === 0 ? (
                <Text style={styles.emptyEpisodes}>No episodes uploaded for this season.</Text>
              ) : (
                currentEpisodes.map((episode) => {
                  const epThumb = formatImageUrl(episode.thumbnail || detail.poster || detail.landscapePoster);
                  return (
                    <TouchableOpacity
                      key={episode._id}
                      style={styles.episodeRow}
                      onPress={() => handlePlayEpisode(episode)}
                    >
                      <Image source={{ uri: epThumb }} style={styles.episodeThumb} resizeMode="cover" />
                      <View style={styles.episodeDetails}>
                        <View style={styles.episodeTitleRow}>
                          <Text style={styles.episodeTitle} numberOfLines={1}>{episode.title}</Text>
                          {(((detail?.seriesAccess || '').toLowerCase() === 'paid' && (episode.access || '').toLowerCase() === 'paid')) && (() => {
                             const isSubscribed = isPremiumUser();
                             return (
                               <View style={[
                                 styles.episodePremiumBadge,
                                 isSubscribed && { backgroundColor: '#ffffff', borderColor: '#ffffff' }
                               ]}>
                                 <Crown 
                                   color={isSubscribed ? '#000000' : '#ffd700'} 
                                   size={9} 
                                   fill={isSubscribed ? '#000000' : '#ffd700'} 
                                 />
                                 <Text style={[
                                   styles.episodePremiumText,
                                   isSubscribed && { color: '#000000' }
                                 ]}>PRO</Text>
                               </View>
                             );
                           })()}
                        </View>
                        <Text style={styles.episodeDesc} numberOfLines={2}>
                          {stripHtml(episode.description) || 'Watch now.'}
                        </Text>
                        <View style={styles.episodeDurationRow}>
                          <Clock color="#8e8e93" size={12} />
                          <Text style={styles.episodeDurationText}>{episode.duration || 'N/A'}</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.episodePlayBtn} onPress={() => handlePlayEpisode(episode)}>
                        <Play color="#000000" size={12} fill="#000000" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* You May Also Like Section */}
          {related.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedHeader}>You May Also Like</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.relatedScrollContent}
              >
                {related.map((item) => {
                  const itemThumb = formatImageUrl(item, type === 'sports' ? 'landscape' : 'poster');
                  const itemTitle = item.title || item.name || '';
                  const itemIsPaid = checkIsPaid(item, type);
                  
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.relatedCard}
                      onPress={() => {
                        if (navigation.push) {
                          navigation.push('Details', { id: item._id, type: type });
                        } else {
                          navigation.navigate('Details', { id: item._id, type: type });
                        }
                      }}
                    >
                      <View style={styles.relatedPosterContainer}>
                        <Image source={{ uri: itemThumb }} style={styles.relatedPoster} resizeMode="cover" />
                        {itemIsPaid && (
                          <View style={styles.relatedCrownBadge}>
                            <Crown color="#ffd700" size={10} fill="#ffd700" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.relatedCardTitle} numberOfLines={1}>
                        {itemTitle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModalContent}>
            <Text style={styles.ratingModalTitle}>Rate This Content</Text>
            <Text style={styles.ratingModalSubtitle}>{detail.title || detail.name}</Text>
            
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((starVal) => (
                <TouchableOpacity
                  key={starVal}
                  onPress={() => setSelectedRating(starVal)}
                  style={styles.starTouch}
                >
                  <Star
                    size={32}
                    color={starVal <= selectedRating ? '#b3d332' : '#8e8e93'}
                    fill={starVal <= selectedRating ? '#b3d332' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRatingModalVisible(false)}
                disabled={ratingSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleRateSubmit}
                disabled={ratingSubmitting}
              >
                {ratingSubmitting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  absoluteHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 10,
  },
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#b3d332',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#b3d332',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  contentInfo: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  visualStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  statsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '600',
  },
  ratingSectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  ratingCircleContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ratingCircleTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingCircleText: {
    color: '#b3d332',
    fontSize: 11,
    fontWeight: '900',
  },
  ratingsCountText: {
    color: '#8e8e93',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 20,
    width: '100%',
  },
  mainPlayBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#b3d332',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mainPlayBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  trailerBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trailerBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  watchlistBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderColor: '#2a2c31',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  watchlistBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0088ff',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  rateBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderColor: '#2a2c31',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rateBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ratingModalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1c1c1e',
    borderColor: '#2a2c31',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  ratingModalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  ratingModalSubtitle: {
    color: '#8e8e93',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  starTouch: {
    padding: 4,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#2a2c31',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: '#b3d332',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#e5e5ea',
    lineHeight: 22,
  },
  castContainer: {
    marginBottom: 20,
  },
  castCard: {
    width: 70,
    marginRight: 16,
    alignItems: 'center',
  },
  castAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1c1c1e',
    marginBottom: 6,
  },
  initialsAvatar: {
    backgroundColor: '#2a2c31',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  initialsText: {
    color: '#b3d332',
    fontSize: 18,
    fontWeight: '900',
  },
  castName: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  seasonsWrapper: {
    marginTop: 10,
  },
  seasonTabs: {
    marginBottom: 16,
  },
  seasonTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1c1c1e',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2c31',
  },
  activeSeasonTab: {
    backgroundColor: '#b3d332',
    borderColor: '#b3d332',
  },
  seasonTabBtnText: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '700',
  },
  activeSeasonTabBtnText: {
    color: '#000000',
  },
  emptyEpisodes: {
    color: '#8e8e93',
    fontStyle: 'italic',
    fontSize: 13,
    paddingVertical: 10,
  },
  episodeRow: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderColor: '#1f1f1f',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  episodeThumb: {
    width: 100,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#1c1c1e',
  },
  episodeDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  episodeTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  episodeDesc: {
    color: '#8e8e93',
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 4,
  },
  episodeDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  episodeDurationText: {
    color: '#8e8e93',
    fontSize: 10,
    fontWeight: '600',
  },
  episodePlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#b3d332',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  premiumDetailBadge: {
    backgroundColor: '#ffd700',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
    marginBottom: 10,
  },
  premiumDetailText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  episodeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  episodePremiumBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#ffd700',
    gap: 2.5,
  },
  episodePremiumText: {
    color: '#ffd700',
    fontSize: 7.5,
    fontWeight: '800',
  },
  relatedSection: {
    marginTop: 25,
    marginBottom: 20,
  },
  relatedHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  relatedScrollContent: {
    paddingLeft: 16,
    paddingRight: 1,
  },
  relatedCard: {
    width: 110,
    marginRight: 15,
  },
  relatedPosterContainer: {
    width: 110,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  relatedPoster: {
    width: '100%',
    height: '100%',
  },
  relatedCrownBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedCardTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  mobileUpcomingBadgeOverlay: {
    backgroundColor: '#b3d332',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  mobileUpcomingBadgeOverlayText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  upcomingEpisodesWrapper: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 20,
  },
  upcomingEpisodesTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  upcomingEpisodesSubtitle: {
    color: '#8e8e93',
    fontSize: 13,
    textAlign: 'center',
  },
  heroUpcomingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlayOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 15,
  },
  playWithWaveContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  waveRipple: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(179, 211, 50, 0.4)',
  },
  playIconButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#b3d332',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#b3d332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
});
