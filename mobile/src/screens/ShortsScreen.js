import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator, 
  useWindowDimensions, 
  TouchableOpacity 
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clapperboard, Heart, Eye } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import client from '../api/client';

export default function ShortsScreen({ route }) {
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screenHeight, setScreenHeight] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const listRef = useRef(null);
  const initialShortId = route?.params?.initialShortId;
  const initialScrollHandledRef = useRef(false);

  const currentHeight = screenHeight || height;
  const aspectRatio = width / currentHeight;
  const isTablet = aspectRatio > 0.65;

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const res = await client.get('/shorts');
        if (res && res.data) {
          // Only show active status shorts
          const activeShorts = res.data.filter(s => !s.status || s.status.toLowerCase() === 'active');
          setShorts(activeShorts);
        }
      } catch (err) {
        console.error('Error fetching shorts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShorts();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  // Reset scroll handled flag when initialShortId changes
  useEffect(() => {
    initialScrollHandledRef.current = false;
  }, [initialShortId]);

  // Scroll to index if initialShortId is passed
  useEffect(() => {
    if (initialShortId && shorts.length > 0 && !initialScrollHandledRef.current) {
      const index = shorts.findIndex(s => s._id === initialShortId);
      if (index !== -1) {
        initialScrollHandledRef.current = true;
        setActiveVideoIndex(index);
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index, animated: false });
        }, 150);
      }
    }
  }, [initialShortId, shorts]);

  const getItemLayout = (data, index) => ({
    length: screenHeight,
    offset: screenHeight * index,
    index,
  });

  const viewedShortsRef = useRef(new Set());

  // Increment views count on active short
  useEffect(() => {
    if (shorts.length > 0 && shorts[activeVideoIndex]) {
      const activeShort = shorts[activeVideoIndex];
      const shortId = activeShort._id;
      
      if (!viewedShortsRef.current.has(shortId)) {
        viewedShortsRef.current.add(shortId);
        
        client.post(`/shorts/${shortId}/view`)
          .then(() => {
            setShorts(prevShorts => 
              prevShorts.map(s => s._id === shortId ? { ...s, views: (s.views || 0) + 1 } : s)
            );
          })
          .catch(err => console.error('Error incrementing view:', err));
      }
    }
  }, [activeVideoIndex, shorts]);

  const handleLike = async (item) => {
    try {
      const res = await client.post(`/shorts/${item._id}/like`);
      if (res && res.data) {
        setShorts(prevShorts => 
          prevShorts.map(s => {
            if (s._id === item._id) {
              const newHasLiked = !s.hasLiked;
              const newLikes = newHasLiked ? (s.likes || 0) + 1 : Math.max((s.likes || 0) - 1, 0);
              return { ...s, hasLiked: newHasLiked, likes: newLikes };
            }
            return s;
          })
        );
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Please log in to like shorts');
    }
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (loading) {
    return (
      <View style={styles.darkContainer}>
        <ActivityIndicator size="large" color="#b3d332" />
      </View>
    );
  }

  if (shorts.length === 0) {
    return (
      <View style={styles.darkContainer}>
        <Clapperboard color="#b3d332" size={48} />
        <Text style={styles.emptyText}>No Shorts Available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={(e) => setScreenHeight(e.nativeEvent.layout.height)}>
      {screenHeight > 0 && (
        <FlatList
          ref={listRef}
          data={shorts}
          keyExtractor={(item) => item._id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          renderItem={({ item, index }) => (
            <View style={{ width, height: screenHeight, position: 'relative', backgroundColor: '#000' }}>
              <Video
                source={{ uri: item.videoUrl }}
                style={styles.videoPlayer}
                resizeMode={isTablet ? ResizeMode.CONTAIN : ResizeMode.COVER}
                shouldPlay={isFocused && index === activeVideoIndex}
                isLooping
                useNativeControls={false}
              />
              
              {/* Right Interaction Actions Sidebar */}
              <View style={styles.rightActionsContainer}>
                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item)}>
                    <Heart 
                      color={item.hasLiked ? '#ff2d55' : '#ffffff'} 
                      fill={item.hasLiked ? '#ff2d55' : 'transparent'} 
                      size={22} 
                    />
                  </TouchableOpacity>
                  <Text style={styles.actionText}>{item.likes || 0}</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <View style={styles.actionButton}>
                    <Eye color="#ffffff" size={22} />
                  </View>
                  <Text style={styles.actionText}>{item.views || 0}</Text>
                </View>
              </View>

              {/* Title & Description Overlay */}
              <View style={styles.overlayTextContainer}>
                <Text style={styles.shortTitle}>@{item.title || 'Short'}</Text>
                {item.description ? <Text style={styles.shortDesc}>{item.description}</Text> : null}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  darkContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  emptyText: {
    color: '#8e8e93',
    fontSize: 16,
    fontWeight: '600',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  overlayTextContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 80,
    zIndex: 10,
  },
  shortTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  shortDesc: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  rightActionsContainer: {
    position: 'absolute',
    bottom: 50,
    right: 16,
    alignItems: 'center',
    gap: 20,
    zIndex: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
