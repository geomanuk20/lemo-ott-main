import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Flame, Search, X, Clapperboard, Crown, Filter } from 'lucide-react-native';
import client from '../api/client';
import { formatImageUrl } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import OfflineView from '../components/OfflineView';

export default function PocketReelsScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const { width: screenWidth } = useWindowDimensions();

  const numColumns = screenWidth > 768 ? 4 : screenWidth > 520 ? 3 : 2;
  const cardGap = 12;
  const horizontalPadding = 16;
  const cardWidth = Math.floor((screenWidth - (horizontalPadding * 2) - (cardGap * (numColumns - 1))) / numColumns);
  const styles = useMemo(() => getStyles(theme, cardWidth), [theme, cardWidth]);

  const isPremiumUser = () => {
    if (!user) return false;
    const plan = user.subscriptionPlan || 'Basic Plan';
    if (plan.toLowerCase() === 'basic plan' || plan.toLowerCase() === 'free') {
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
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pocketReels, setPocketReels] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [showsRes, genresRes] = await Promise.all([
        client.get('/shows'),
        client.get('/genres')
      ]);

      const allShows = Array.isArray(showsRes.data) ? showsRes.data : [];
      // Filter specifically for Pocket Reel Series / Pocket Dramas
      const reelsOnly = allShows.filter(show => {
        if (!show || (show.status && show.status.toLowerCase() !== 'active')) return false;
        const ct = (show.contentType || '').toLowerCase().trim();
        return (
          ct === 'pocket reel series' ||
          ct === 'pocket-reel-series' ||
          ct === 'pocket reels' ||
          ct === 'pocket-reels' ||
          ct === 'pocket reel'
        );
      });

      setPocketReels(reelsOnly);
      setGenres(Array.isArray(genresRes.data) ? genresRes.data : []);
      setIsOffline(false);
    } catch (error) {
      console.error('Error fetching pocket reels:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filtered reels based on search query & selected genre
  const filteredReels = useMemo(() => {
    return pocketReels.filter(reel => {
      // 1. Genre filter
      const matchesGenre = selectedGenre === 'All' || (reel.genres && reel.genres.some(g => {
        const name = typeof g === 'object' ? g.name : g;
        return name === selectedGenre;
      }));

      // 2. Search query filter
      const matchesQuery = !searchQuery.trim() || 
        (reel.title && reel.title.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
        (reel.description && reel.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      return matchesGenre && matchesQuery;
    });
  }, [pocketReels, selectedGenre, searchQuery]);

  const featuredReel = pocketReels.length > 0 ? pocketReels[0] : null;

  const renderReelCard = ({ item, index }) => {
    const posterUrl = formatImageUrl(item, 'poster') || formatImageUrl(item, 'thumbnail');
    const isPaid = (item.seriesAccess || item.access || '').toLowerCase() === 'paid';
    const isSubscribed = isPremiumUser();

    // Calculate total episodes count
    let totalEpisodes = 0;
    if (Array.isArray(item.seasons)) {
      totalEpisodes = item.seasons.reduce((acc, s) => acc + (s.episodes ? s.episodes.length : 0), 0);
    } else if (Array.isArray(item.episodes)) {
      totalEpisodes = item.episodes.length;
    }

    return (
      <TouchableOpacity
        style={styles.reelCard}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('Details', { id: item._id, type: 'show' })}
      >
        <View style={styles.posterContainer}>
          <Image source={{ uri: posterUrl }} style={styles.posterImage} resizeMode="cover" />
          
          {/* Top Badges */}
          <View style={styles.cardTopBadgeRow}>
            {isPaid ? (
              <View style={[styles.accessBadge, styles.paidBadge]}>
                <Crown size={10} color="#000000" strokeWidth={3} />
                <Text style={styles.paidBadgeText}>VIP</Text>
              </View>
            ) : null}

            {totalEpisodes > 0 && (
              <View style={styles.episodesBadge}>
                <Text style={styles.episodesBadgeText}>{totalEpisodes} Eps</Text>
              </View>
            )}
          </View>

          {/* Quick Play Button Overlay */}
          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <Play color="#000000" size={13} fill="#000000" style={{ marginLeft: 2 }} />
            </View>
          </View>

          {/* Bottom Scrim with Title & Genre */}
          <View style={styles.cardBottomOverlay}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.genres && item.genres.length > 0 && (
              <Text style={styles.cardGenre} numberOfLines={1}>
                {typeof item.genres[0] === 'object' ? item.genres[0].name : item.genres[0]}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {navigation?.canGoBack && navigation.canGoBack() ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft color={theme.text} size={24} />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.headerTitle}>Pocket Reels</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading Pocket Reels...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isOffline && pocketReels.length === 0) {
    return <OfflineView onRetry={fetchData} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        {navigation?.canGoBack && navigation.canGoBack() ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color={theme.text} size={24} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Pocket Reels</Text>
        </View>
        <TouchableOpacity 
          style={styles.searchToggleBtn} 
          onPress={() => setShowSearch(prev => !prev)}
        >
          {showSearch ? <X color={theme.text} size={20} /> : <Search color={theme.text} size={20} />}
        </TouchableOpacity>
      </View>

      {/* Expandable Search Input */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Search color={theme.textSecondary} size={16} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pocket drama series..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={theme.textSecondary} size={16} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Genre Filter Scroll Row */}
      <View style={styles.genreBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreScrollContent}>
          <TouchableOpacity
            style={[styles.genrePill, selectedGenre === 'All' && styles.genrePillActive]}
            onPress={() => setSelectedGenre('All')}
          >
            <Text style={[styles.genrePillText, selectedGenre === 'All' && styles.genrePillTextActive]}>
              All Dramas
            </Text>
          </TouchableOpacity>
          {genres.map(g => (
            <TouchableOpacity
              key={g._id || g.name}
              style={[styles.genrePill, selectedGenre === g.name && styles.genrePillActive]}
              onPress={() => setSelectedGenre(g.name)}
            >
              <Text style={[styles.genrePillText, selectedGenre === g.name && styles.genrePillTextActive]}>
                {g.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        key={`reels-grid-${numColumns}`}
        data={filteredReels}
        renderItem={renderReelCard}
        keyExtractor={item => item._id}
        numColumns={numColumns}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />
        }
        ListHeaderComponent={
          featuredReel && !searchQuery ? (
            <TouchableOpacity 
              style={styles.heroBannerCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Details', { id: featuredReel._id, type: 'show' })}
            >
              <Image 
                source={{ uri: formatImageUrl(featuredReel, 'landscape') || formatImageUrl(featuredReel, 'poster') }} 
                style={styles.heroBannerImage} 
                resizeMode="cover" 
              />
              <View style={styles.heroBannerOverlay}>
                <Text style={styles.heroTitle} numberOfLines={1}>{featuredReel.title}</Text>
                <Text style={styles.heroSubtitle} numberOfLines={2}>
                  {featuredReel.description || 'Watch full binge-worthy vertical episodes now on LEMO OTT.'}
                </Text>
                <View style={styles.heroCtaRow}>
                  <View style={styles.heroPlayBtn}>
                    <Play size={14} color="#000000" fill="#000000" />
                    <Text style={styles.heroPlayBtnText}>Start Episode 1</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Clapperboard color={theme.textSecondary} size={50} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Pocket Reels Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? `No results match "${searchQuery}"` : 'New pocket reel drama series are coming soon.'}
            </Text>
            {searchQuery ? (
              <TouchableOpacity style={styles.resetFilterBtn} onPress={() => { setSearchQuery(''); setSelectedGenre('All'); }}>
                <Text style={styles.resetFilterBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (theme, cardWidth = 160) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
    backgroundColor: theme.headerBackground,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.3,
  },
  headerFlameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  headerFlameText: {
    color: '#ff6b00',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  searchToggleBtn: {
    padding: 6,
    backgroundColor: theme.cardSecondary,
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardSecondary,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 13,
    paddingVertical: 0,
  },
  genreBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
    paddingVertical: 8,
  },
  genreScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.cardSecondary,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  genrePillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  genrePillText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  genrePillTextActive: {
    color: theme.primaryText,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 85,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroBannerCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    position: 'relative',
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  heroBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: 14,
    justifyContent: 'flex-end',
  },
  heroTopBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 14,
  },
  heroTrendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  heroTrendingText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  heroSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginBottom: 8,
  },
  heroCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  heroPlayBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  reelCard: {
    width: cardWidth,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  posterContainer: {
    width: '100%',
    height: Math.round(cardWidth * 1.45),
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
  },
  cardTopBadgeRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  paidBadge: {
    backgroundColor: theme.primary,
  },
  paidBadgeText: {
    color: '#000000',
    fontSize: 8.5,
    fontWeight: '900',
  },
  freeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  freeBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  episodesBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  episodesBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(179, 211, 50, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  cardBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  cardGenre: {
    color: theme.primary,
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: theme.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetFilterBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.cardSecondary,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 8,
  },
  resetFilterBtnText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
