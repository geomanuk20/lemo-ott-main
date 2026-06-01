import React, { useState, useEffect, useCallback, useContext } from 'react';
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

const isValidQuality = (quality) => {
  if (!quality) return false;
  const q = quality.trim().toLowerCase();
  return q !== '' && q !== 'active' && q !== 'inactive' && q !== 'on' && q !== 'off';
};

export default function MoviesScreen({ navigation }) {
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
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      const [moviesRes, genresRes, languagesRes] = await Promise.all([
        client.get('/movies'),
        client.get('/genres'),
        client.get('/languages')
      ]);

      setMovies(moviesRes.data || []);
      setGenres(genresRes.data || []);
      setLanguages(languagesRes.data || []);
    } catch (error) {
      console.error('Error fetching movies screen data:', error);
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
  const filteredMovies = movies.filter(movie => {
    const matchesGenre = selectedGenre === 'All' || 
      (movie.genres && movie.genres.some(g => {
        // Handle both populate object or raw string/id
        const genreName = typeof g === 'object' ? g.name : g;
        return genreName === selectedGenre;
      }));
      
    const matchesLanguage = selectedLanguage === 'All' || 
      (movie.language && (typeof movie.language === 'object' ? movie.language.name : movie.language) === selectedLanguage);

    return matchesGenre && matchesLanguage;
  });

  const renderMovieItem = ({ item }) => {
    const imageUrl = formatImageUrl(item, 'poster');
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => navigation.navigate('Details', { id: item._id, type: 'movie' })}
      >
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: imageUrl }} style={styles.posterImage} resizeMode="cover" />
          {((item.access || '').toLowerCase() === 'paid') && (() => {
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
        <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.badgeRow}>
          {isValidQuality(item.videoQuality) ? <Text style={styles.qualityText}>{item.videoQuality}</Text> : null}
          {item.language ? <Text style={styles.langText}>{item.language}</Text> : null}
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Short Films</Text>
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

      {/* Grid of Movies */}
      <FlatList
        data={filteredMovies}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#b3d332" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No movies match the selected filters.</Text>
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
  filtersWrapper: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  filterScroll: {
    paddingHorizontal: 12,
  },
  filterBtn: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2c31',
  },
  activeFilterBtn: {
    backgroundColor: '#b3d332',
    borderColor: '#b3d332',
  },
  filterBtnText: {
    color: '#8e8e93',
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
    paddingBottom: 24,
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
    height: 240,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
  },
  movieTitle: {
    color: '#ffffff',
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
    color: '#b3d332',
    fontSize: 10,
    fontWeight: '800',
    borderColor: '#b3d332',
    borderWidth: 0.5,
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  langText: {
    color: '#8e8e93',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#8e8e93',
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
