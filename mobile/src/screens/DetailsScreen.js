import React, { useState, useEffect, useContext } from 'react';
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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Bookmark, BookmarkCheck, ArrowLeft, Clock, Calendar, Globe, Crown } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { formatImageUrl } from '../config/api';

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

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('Failed to load content details.');

  useEffect(() => {
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

        // Check watchlist status
        if (user && user.id) {
          const wlRes = await client.get(`/watchlist/${user.id}`);
          if (wlRes.data) {
            const isMatch = wlRes.data.some(item => item._id === id);
            setInWatchlist(isMatch);
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
    if (!user || !user.id || watchlistLoading) return;
    setWatchlistLoading(true);
    try {
      const response = await client.post('/watchlist/toggle', {
        userId: user.id,
        contentId: id,
        contentType: type
      });
      if (response.data) {
        setInWatchlist(response.data.status === 'added');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handlePlayMainVideo = () => {
    if (!detail) return;

    // Check premium access
    if (detail.access === 'Paid') {
      if (!user) {
        Alert.alert(
          'Subscription Required',
          'Please sign in to access premium content.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => navigation.navigate('Login') }
          ]
        );
        return;
      }
      if (!isPremiumUser()) {
        Alert.alert(
          'Premium Content',
          'This content is only available to Premium subscribers. Upgrade your plan to watch now!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => navigation.navigate('Subscription') }
          ]
        );
        return;
      }
    }

    const videoUrl = detail.videoFile || detail.videoUrl || detail.streamUrl || detail.videoFile1080 || detail.videoFile720 || detail.videoFile480 || detail.server1Url || detail.server2Url || detail.server3Url || detail.embedUrl || '';
    const videoType = detail.videoType || detail.streamType || 'hls';

    console.log('[DetailsScreen] Playing Main Video:', { title: detail.title || detail.name, videoUrl, videoType });

    if (!videoUrl) {
      Alert.alert(
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
      videoFile480: detail.videoFile480 || ''
    });
  };

  const handlePlayEpisode = (episode) => {
    console.log('[DetailsScreen] Playing Episode:', episode);

    // Check premium access (if either the show itself is Paid or the specific episode is Paid)
    if (detail?.access === 'Paid' || episode.access === 'Paid') {
      if (!user) {
        Alert.alert(
          'Subscription Required',
          'Please sign in to access premium content.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => navigation.navigate('Login') }
          ]
        );
        return;
      }
      if (!isPremiumUser()) {
        Alert.alert(
          'Premium Content',
          'This episode is only available to Premium subscribers. Upgrade your plan to watch now!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => navigation.navigate('Subscription') }
          ]
        );
        return;
      }
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
      Alert.alert(
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
      videoFile480: episode.videoFile480 || ''
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
          <View style={styles.heroOverlay}>
            {type !== 'show' && (
              <TouchableOpacity style={styles.playIconButton} onPress={handlePlayMainVideo}>
                <Play color="#000" size={32} fill="#000" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content Meta Details */}
        <View style={styles.contentInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{detail.title || detail.name}</Text>
            {detail.access === 'Paid' && (() => {
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
          
          <View style={styles.metaRow}>
            {detail.releaseYear || detail.year ? (
              <View style={styles.metaItem}>
                <Calendar color="#8e8e93" size={14} />
                <Text style={styles.metaText}>{detail.releaseYear || detail.year}</Text>
              </View>
            ) : null}
            {detail.duration ? (
              <View style={styles.metaItem}>
                <Clock color="#8e8e93" size={14} />
                <Text style={styles.metaText}>{detail.duration}</Text>
              </View>
            ) : null}
            {detail.language ? (
              <View style={styles.metaItem}>
                <Globe color="#8e8e93" size={14} />
                <Text style={styles.metaText}>{typeof detail.language === 'object' ? detail.language.name : detail.language}</Text>
              </View>
            ) : null}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {type !== 'show' && (
              <TouchableOpacity style={styles.mainPlayBtn} onPress={handlePlayMainVideo}>
                <Play color="#000000" size={18} fill="#000000" />
                <Text style={styles.mainPlayBtnText}>Play</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.watchlistBtn, type === 'show' ? { flex: 1 } : null]} 
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
          </View>

          {/* Genre & Synopsis */}
          {genresText ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.infoLabel}>Genres</Text>
              <Text style={styles.infoValue}>{genresText}</Text>
            </View>
          ) : null}

          {detail.description || detail.synopsis ? (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.infoLabel}>Overview</Text>
              <Text style={styles.descriptionText}>{stripHtml(detail.description || detail.synopsis)}</Text>
            </View>
          ) : null}

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
                  const castImage = typeof item === 'object' && item.image ? formatImageUrl(item.image) : 'https://placehold.co/100/png?text=Cast';
                  return (
                    <View style={styles.castCard}>
                      <Image source={{ uri: castImage }} style={styles.castAvatar} />
                      <Text style={styles.castName} numberOfLines={2}>{castName}</Text>
                    </View>
                  );
                }}
              />
            </View>
          )}

          {/* Season and Episode browser (For Web Series) */}
          {type === 'show' && (seasons.length > 0 || detail?.contentType === 'Short Web Series' || detail?.contentType === 'Short Web-Series') && (
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
                          {episode.access === 'Paid' && (() => {
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
        </View>
      </ScrollView>
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  mainPlayBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#b3d332',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mainPlayBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
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
});
