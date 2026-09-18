import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookmarkMinus, Film, Crown } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { formatImageUrl } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import OfflineView from '../components/OfflineView';

export default function WatchlistScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { user, isAuthenticated } = useContext(AuthContext);

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
      return (item.access || '').toLowerCase() === 'paid';
    }
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [watchlist, setWatchlist] = useState([]);

  const fetchWatchlist = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      const response = await client.get(`/watchlist/${user.id}`);
      setWatchlist(response.data || []);
      setIsOffline(false);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Refresh on tab focus so admin changes reflect without manual pull-to-refresh
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchWatchlist();
    }, [fetchWatchlist])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWatchlist();
  };

  const handleRemoveFromWatchlist = async (uniqueKey, contentId, contentType, selectedEpisodeId) => {
    try {
      const response = await client.post('/watchlist/toggle', {
        userId: user.id,
        contentId: contentId || uniqueKey,
        contentType,
        selectedEpisodeId: selectedEpisodeId || null
      });
      if (response.data && response.data.status === 'removed') {
        // Optimistically filter the item from state by uniqueKey
        setWatchlist(prev => prev.filter(item => item._id !== uniqueKey));
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const renderWatchlistItem = ({ item }) => {
    const imageUrl = item.episodePoster ? formatImageUrl(item.episodePoster) : formatImageUrl(item, 'poster');
    const displayType = item.contentType === 'show' ? 'Series' : 'Movie';
    const hasEpisode = item.selectedEpisodeId || item.selectedEpisodeTitle;
    const title = item.displayTitle || item.title || item.name;
    const subtitle = item.subtitleText || (item.selectedEpisodeTitle 
      ? `E${item.selectedEpisodeNumber || 1}: ${item.selectedEpisodeTitle}`
      : (item.selectedEpisodeNumber && item.selectedEpisodeNumber > 1 ? `Episode ${item.selectedEpisodeNumber}` : displayType));
    
    const targetContentId = item.contentId || (item._id && item._id.includes('_') ? item._id.split('_')[0] : item._id);

    return (
      <View style={styles.gridItem}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Details', { 
            id: targetContentId, 
            type: item.contentType, 
            selectedEpisodeId: item.selectedEpisodeId 
          })}
          activeOpacity={0.8}
          style={{ flex: 1 }}
        >
          <View style={{ position: 'relative' }}>
            <Image source={{ uri: imageUrl }} style={styles.posterImage} resizeMode="cover" />
            {Boolean(hasEpisode) && (
              <View style={styles.savedEpPill}>
                <Text style={styles.savedEpPillText}>E{item.selectedEpisodeNumber || 1}</Text>
              </View>
            )}
            {checkIsPaid(item, item.contentType) && (() => {
              const isSubscribed = isPremiumUser();
              return (
                <View style={[
                  styles.premiumBadge,
                  isSubscribed && { backgroundColor: '#ffffff', borderColor: '#ffffff' }
                ]}>
                  <Crown 
                    color={isSubscribed ? '#000000' : '#ffd700'} 
                    size={9} 
                    fill={isSubscribed ? '#000000' : '#ffd700'} 
                  />
                  <Text style={[
                    styles.premiumBadgeText,
                    isSubscribed && { color: '#000000' }
                  ]}>PRO</Text>
                </View>
              );
            })()}
          </View>
          <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
          <Text style={[styles.itemSubtitle, hasEpisode && { color: theme.primary, fontWeight: '700' }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </TouchableOpacity>
        
        {/* Remove Button Overlay */}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveFromWatchlist(item._id, targetContentId, item.contentType, item.selectedEpisodeId)}
        >
          <BookmarkMinus color="#ff4d4d" size={16} />
        </TouchableOpacity>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Watchlist</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Film color={theme.textSecondary} size={54} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>Sign In Required</Text>
          <Text style={styles.emptySubtext}>Please sign in to view, manage, and sync your watchlist.</Text>
          <TouchableOpacity 
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.browseBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isOffline && watchlist.length === 0) {
    return (
      <OfflineView
        onRetry={async () => {
          setLoading(true);
          await fetchWatchlist();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Watchlist</Text>
      </View>

      <FlatList
        data={watchlist}
        renderItem={renderWatchlistItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Film color={theme.textSecondary} size={48} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Your watchlist is empty.</Text>
            <Text style={styles.emptySubtext}>Movies and shows you add to your watchlist will appear here.</Text>
            <TouchableOpacity 
              style={styles.browseBtn}
              onPress={() => navigation.navigate('HomeTab')}
            >
              <Text style={styles.browseBtnText}>Browse Content</Text>
            </TouchableOpacity>
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
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 85,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: '48%',
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: theme.cardBackground,
    borderWidth: 0.5,
    borderColor: theme.cardBorder,
  },
  itemTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  itemSubtitle: {
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 80,
  },
  emptyText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    color: theme.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
  },
  savedEpPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#b3d332',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savedEpPillText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
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

