import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Tv } from 'lucide-react-native';
import client from '../api/client';
import { formatImageUrl } from '../config/api';

export default function LiveTVScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchData = async () => {
    try {
      const [channelsRes, categoriesRes] = await Promise.all([
        client.get('/tv-channels'),
        client.get('/tv-categories')
      ]);
      setChannels(channelsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching Live TV data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredChannels = channels.filter(channel => {
    if (selectedCategory === 'All') return true;
    const channelCatName = typeof channel.category === 'object' ? channel.category?.name : channel.category;
    return channelCatName === selectedCategory;
  });

  const renderChannelItem = ({ item }) => {
    const logoUrl = formatImageUrl(item, 'landscape');
    return (
      <TouchableOpacity
        style={styles.channelRow}
        onPress={() => navigation.navigate('Details', { id: item._id, type: 'live' })}
      >
        <Image source={{ uri: logoUrl }} style={styles.channelLogo} resizeMode="cover" />
        <View style={styles.channelInfo}>
          <Text style={styles.channelName} numberOfLines={1}>{item.title || item.name}</Text>
          <Text style={styles.categoryName}>
            {typeof item.category === 'object' ? item.category?.name : 'Entertainment'}
          </Text>
        </View>
        <View style={styles.liveIndicator}>
          <Tv color="#ff3b30" size={14} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b3d332" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live TV Channels</Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <TouchableOpacity
            style={[styles.categoryBtn, selectedCategory === 'All' ? styles.activeCategoryBtn : null]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'All' ? styles.activeCategoryText : null]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat._id}
              style={[styles.categoryBtn, selectedCategory === cat.name ? styles.activeCategoryBtn : null]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.name ? styles.activeCategoryText : null]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Channels List */}
      <FlatList
        data={filteredChannels}
        renderItem={renderChannelItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#b3d332" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No channels available in this category.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  categoriesWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  categoriesScroll: {
    paddingHorizontal: 12,
  },
  categoryBtn: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2c31',
  },
  activeCategoryBtn: {
    backgroundColor: '#b3d332',
    borderColor: '#b3d332',
  },
  categoryText: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '700',
  },
  activeCategoryText: {
    color: '#000000',
  },
  listContent: {
    padding: 16,
  },
  channelRow: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderColor: '#1f1f1f',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  channelLogo: {
    width: 90,
    height: 54,
    borderRadius: 6,
    backgroundColor: '#1c1c1e',
  },
  channelInfo: {
    flex: 1,
    marginLeft: 16,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#8e8e93',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  liveText: {
    color: '#ff3b30',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
  },
});
