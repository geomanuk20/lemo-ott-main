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
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown } from 'lucide-react-native';
import client from '../api/client';
import { formatImageUrl } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import OfflineView from '../components/OfflineView';

const isValidQuality = (quality) => {
  if (!quality) return false;
  const q = quality.trim().toLowerCase();
  return q !== '' && q !== 'active' && q !== 'inactive' && q !== 'on' && q !== 'off';
};

export default function ShowsScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { user } = useContext(AuthContext);

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
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [shows, setShows] = useState([]);
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [menuSettings, setMenuSettings] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      const [showsRes, genresRes, languagesRes, menuRes] = await Promise.all([
        client.get('/shows'),
        client.get('/genres'),
        client.get('/languages'),
        client.get('/menu-settings')
      ]);

      setShows(showsRes.data || []);
      setGenres(genresRes.data || []);
      setLanguages(languagesRes.data || []);
      setMenuSettings(menuRes.data || null);
      setIsOffline(false);
    } catch (error) {
      console.error('Error fetching shows screen data:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter logic
  const filteredShows = shows.filter(show => {
    // 0. Filter by active status
    if (show.status && show.status.toLowerCase() !== 'active') return false;

    const rawCt = (show.contentType || show.type || show.postType || '').toLowerCase().trim();
    const isShortWeb = rawCt === 'short web series' || rawCt === 'short-web-series' || rawCt === 'web-series' || rawCt === 'web series';
    const isPocketReel = rawCt === 'pocket reel series' || rawCt === 'pocket-reel-series' || rawCt === 'pocket reels' || rawCt === 'pocket-reels' || rawCt === 'pocket reel';
    const isTvShow = !isShortWeb && !isPocketReel;

    // ShowsScreen is strictly for TV Shows and Web Series - Pocket Reels have their own dedicated screen/tab
    if (isPocketReel) return false;

    // 1. Filter by Menu Settings enabled switches & content types
    if (menuSettings) {
      const showsOff = menuSettings.shows?.toUpperCase() === 'OFF';
      const webSeriesOff = menuSettings.webSeries?.toUpperCase() === 'OFF';

      if (isTvShow && showsOff) return false;
      if (isShortWeb && webSeriesOff) return false;

      if (menuSettings.showsContent) {
        const allowed = menuSettings.showsContent.map(s => (s || '').toLowerCase().trim());
        if (allowed.length > 0 && !allowed.includes(rawCt) && rawCt !== '') {
          return false;
        }
      }
    }

    // 2. Filter by Genre
    if (selectedGenre !== 'All') {
      const g = show.genre;
      if (Array.isArray(g)) {
        if (!g.some(item => (typeof item === 'object' ? item.name : item) === selectedGenre)) {
          return false;
        }
      } else if (typeof g === 'object' && g !== null) {
        if (g.name !== selectedGenre) return false;
      } else if (typeof g === 'string') {
        if (g !== selectedGenre) return false;
      } else {
        return false;
      }
    }

    // 3. Filter by Language
    if (selectedLanguage !== 'All') {
      const l = show.language;
      if (Array.isArray(l)) {
        if (!l.some(item => (typeof item === 'object' ? item.name : item) === selectedLanguage)) {
          return false;
        }
      } else if (typeof l === 'object' && l !== null) {
        if (l.name !== selectedLanguage) return false;
      } else if (typeof l === 'string') {
        if (l !== selectedLanguage) return false;
      } else {
        return false;
      }
    }

    return true;
  });

  const getHeaderTitle = () => {
    if (!menuSettings) return 'Shows';
    const showsOn = menuSettings.shows?.toUpperCase() !== 'OFF';
    const webSeriesOn = menuSettings.webSeries?.toUpperCase() !== 'OFF';
    const pocketReelOn = menuSettings.pocketReelSeries?.toUpperCase() !== 'OFF';

    if (showsOn) return menuSettings.showsLabel || 'Shows';
    if (pocketReelOn) return menuSettings.pocketReelsLabel || 'Pocket Reel';
    if (webSeriesOn) return menuSettings.webSeriesLabel || 'Web Series';
    return 'Shows';
  };

  const renderShowItem = ({ item }) => {
    const isLocked = item.isPremium && !isPremiumUser();
    const posterUri = formatImageUrl(item.poster || item.thumbnail);
    const genreStr = Array.isArray(item.genre) 
      ? item.genre.map(g => (typeof g === 'object' ? g.name : g)).join(', ')
      : (typeof item.genre === 'object' && item.genre !== null ? item.genre.name : item.genre || '');
    
    const langStr = Array.isArray(item.language)
      ? item.language.map(l => (typeof l === 'object' ? l.name : l)).join(', ')
      : (typeof item.language === 'object' && item.language !== null ? item.language.name : item.language || '');

    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Details', { id: item._id, type: 'shows' })}
      >
        <View>
          <Image
            source={{ uri: posterUri || 'https://via.placeholder.com/300x450' }}
            style={styles.posterImage}
            resizeMode="cover"
          />
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Crown size={10} color="#ffd700" />
              <Text style={styles.premiumBadgeText}>{isLocked ? 'VIP' : 'UNLOCKED'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.showTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.badgeRow}>
          {isValidQuality(item.quality) && (
            <Text style={styles.qualityText}>{item.quality}</Text>
          )}
          {langStr ? (
            <Text style={styles.langText} numberOfLines={1}>{langStr}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isOffline && shows.length === 0) {
    return (
      <OfflineView
        onRetry={async () => {
          setLoading(true);
          await fetchData();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
      </View>

      {/* Filter Options */}
      <View style={styles.filtersWrapper}>
        {/* Genre Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterBtn, selectedGenre === 'All' ? styles.activeFilterBtn : null]}
            onPress={() => setSelectedGenre('All')}
          >
            <Text style={[styles.filterBtnText, selectedGenre === 'All' ? styles.activeFilterText : null]}>All Genres</Text>
          </TouchableOpacity>
          {genres.map(genre => (
            <TouchableOpacity
              key={genre._id}
              style={[styles.filterBtn, selectedGenre === genre.name ? styles.activeFilterBtn : null]}
              onPress={() => setSelectedGenre(genre.name)}
            >
              <Text style={[styles.filterBtnText, selectedGenre === genre.name ? styles.activeFilterText : null]}>{genre.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Language Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll, { marginTop: 8 }]}>
          <TouchableOpacity
            style={[styles.filterBtn, selectedLanguage === 'All' ? styles.activeFilterBtn : null]}
            onPress={() => setSelectedLanguage('All')}
          >
            <Text style={[styles.filterBtnText, selectedLanguage === 'All' ? styles.activeFilterText : null]}>All Languages</Text>
          </TouchableOpacity>
          {languages.map(lang => (
            <TouchableOpacity
              key={lang._id}
              style={[styles.filterBtn, selectedLanguage === lang.name ? styles.activeFilterBtn : null]}
              onPress={() => setSelectedLanguage(lang.name)}
            >
              <Text style={[styles.filterBtnText, selectedLanguage === lang.name ? styles.activeFilterText : null]}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid of Shows */}
      <FlatList
        data={filteredShows}
        renderItem={renderShowItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No shows match the selected filters.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.text,
  },
  filtersWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
    backgroundColor: theme.background,
  },
  filterScroll: {
    paddingHorizontal: 12,
  },
  filterBtn: {
    backgroundColor: theme.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  activeFilterBtn: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterBtnText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#000000',
    fontWeight: '800',
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 85,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: '48%',
  },
  posterImage: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: theme.cardBackground,
    borderWidth: 0.5,
    borderColor: theme.cardBorder,
  },
  showTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  qualityText: {
    color: theme.primary,
    fontSize: 10,
    fontWeight: '800',
    borderColor: theme.primary,
    borderWidth: 0.5,
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  langText: {
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#ffd700',
    gap: 3,
  },
  premiumBadgeText: {
    color: '#ffd700',
    fontSize: 8,
    fontWeight: '800',
  },
});
