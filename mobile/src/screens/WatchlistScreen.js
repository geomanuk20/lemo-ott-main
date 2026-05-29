import React, { useState, useEffect, useContext, useCallback } from 'react';
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

export default function WatchlistScreen({ navigation }) {
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watchlist, setWatchlist] = useState([]);

  const fetchWatchlist = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      const response = await client.get(`/watchlist/${user.id}`);
      setWatchlist(response.data || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
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

  const handleRemoveFromWatchlist = async (contentId, contentType) => {
    try {
      const response = await client.post('/watchlist/toggle', {
        userId: user.id,
        contentId,
        contentType
      });
      if (response.data && response.data.status === 'removed') {
        // Optimistically filter the item from state
        setWatchlist(prev => prev.filter(item => item._id !== contentId));
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const renderWatchlistItem = ({ item }) => {
    const imageUrl = formatImageUrl(item, 'poster');
    const displayType = item.contentType === 'show' ? 'Series' : 'Movie';
    
    return (
      <View style={styles.gridItem}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Details', { id: item._id, type: item.contentType })}
          activeOpacity={0.8}
          style={{ flex: 1 }}
        >
          <View style={{ position: 'relative' }}>
            <Image source={{ uri: imageUrl }} style={styles.posterImage} resizeMode="cover" />
            {item.access === 'Paid' && (() => {
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
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title || item.name}</Text>
          <Text style={styles.itemSubtitle}>{displayType}</Text>
        </TouchableOpacity>
        
        {/* Remove Button Overlay */}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveFromWatchlist(item._id, item.contentType)}
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
          <Film color="#444" size={54} style={{ marginBottom: 16 }} />
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b3d332" />
      </View>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#b3d332" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Film color="#444" size={48} style={{ marginBottom: 12 }} />
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 24,
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
    height: 240,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  itemSubtitle: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 80,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#8e8e93',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: '#b3d332',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
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
