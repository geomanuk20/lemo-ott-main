import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X, Film } from 'lucide-react-native';
import client from '../api/client';
import { formatImageUrl } from '../config/api';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  // Server-side search with debounce
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const res = await client.get(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(debounceTimer);
  }, [query]);


  const renderResultItem = ({ item }) => {
    const imageUrl = formatImageUrl(item, 'poster');
    const typeMap = {
      movie: 'Movie',
      show: 'Web Series',
      sports: 'Sports',
      'new-release': 'New Release',
      live: 'Live TV',
    };
    const displayType = typeMap[item.contentType] || 'Content';
    
    return (
      <TouchableOpacity
        style={styles.resultRow}
        onPress={() => navigation.navigate('Details', { id: item._id, type: item.contentType })}
      >
        <Image source={{ uri: imageUrl }} style={styles.resultThumb} resizeMode="cover" />
        <View style={styles.resultDetails}>
          <Text style={styles.resultTitle} numberOfLines={1}>{item.title || item.name}</Text>
          <Text style={styles.resultType}>{displayType}</Text>
          {item.genres ? (
            <Text style={styles.resultGenre} numberOfLines={1}>
              {item.genres.map(g => (typeof g === 'object' ? g.name : g)).join(', ')}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        
        <View style={styles.inputContainer}>
          <Search color="#8e8e93" size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, series..."
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <X color="#8e8e93" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#b3d332" />
        </View>
      ) : query.trim().length === 0 ? (
        <View style={styles.centerContainer}>
          <Search color="#333" size={48} style={{ marginBottom: 12 }} />
          <Text style={styles.placeholderText}>Search for your favorite content</Text>
          <Text style={styles.placeholderSubtext}>Type titles, genres, or keywords above</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centerContainer}>
          <Film color="#333" size={48} style={{ marginBottom: 12 }} />
          <Text style={styles.placeholderText}>No Results Found</Text>
          <Text style={styles.placeholderSubtext}>Try searching for different keywords</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: {
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#2a2c31',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholderSubtext: {
    color: '#8e8e93',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  resultRow: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  resultThumb: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#1c1c1e',
  },
  resultDetails: {
    flex: 1,
    marginLeft: 16,
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultType: {
    color: '#b3d332',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultGenre: {
    color: '#8e8e93',
    fontSize: 12,
  },
});
