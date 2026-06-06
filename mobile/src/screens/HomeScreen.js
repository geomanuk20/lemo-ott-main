import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Play, Tv, Film, Trophy, CreditCard, Clapperboard, Crown, Globe, MonitorPlay, Shield } from 'lucide-react-native';
import client from '../api/client';
import { formatImageUrl } from '../config/api';
import { AuthContext } from '../context/AuthContext';

const BANNER_HEIGHT = 260;

const isValidQuality = (quality) => {
  if (!quality) return false;
  const q = quality.trim().toLowerCase();
  return q !== '' && q !== 'active' && q !== 'inactive' && q !== 'on' && q !== 'off';
};

const isItemActive = (item, menuSettings) => {
  if (!menuSettings || !item) return true;
  const contentType = item.contentType;
  if (contentType === 'Movie' && menuSettings.movies?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Short Film' && menuSettings.shortFilms?.toUpperCase() === 'OFF') return false;
  if (contentType === 'TV Show' && menuSettings.shows?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Short Web Series' && menuSettings.webSeries?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Sports' && menuSettings.sports?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Live TV' && menuSettings.liveTv?.toUpperCase() === 'OFF') return false;
  return true;
};

const isSliderActive = (slide, menuSettings) => {
  if (!menuSettings || !slide) return true;
  const postType = slide.postType;
  if (postType === 'Movies' && menuSettings.movies?.toUpperCase() === 'OFF') return false;
  if (postType === 'TV Shows' && menuSettings.shows?.toUpperCase() === 'OFF') return false;
  if (postType === 'Sports' && menuSettings.sports?.toUpperCase() === 'OFF') return false;
  if (postType === 'Live TV' && menuSettings.liveTv?.toUpperCase() === 'OFF') return false;

  const contentType = slide.contentType;
  if (contentType === 'Movie' && menuSettings.movies?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Short Film' && menuSettings.shortFilms?.toUpperCase() === 'OFF') return false;
  if (contentType === 'TV Show' && menuSettings.shows?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Short Web Series' && menuSettings.webSeries?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Sports' && menuSettings.sports?.toUpperCase() === 'OFF') return false;
  if (contentType === 'Live TV' && menuSettings.liveTv?.toUpperCase() === 'OFF') return false;
  return true;
};

const IMDBRatingCircle = ({ rating }) => {
  const ratingVal = parseFloat(rating || '7.5');
  const normalizedRating = Math.min(Math.max(ratingVal, 0), 10);
  const size = 36;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * normalizedRating) / 10;

  return (
    <View style={styles.ratingCircleContainer}>
      <Svg width={size} height={size}>
        {/* Background Track Circle with Solid Black Fill */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={strokeWidth}
          fill="#000000"
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

export default function HomeScreen({ navigation }) {
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

  const checkIsPaid = (item, contentType) => {
    if (!item) return false;
    const t = (contentType || '').toLowerCase().trim();
    if (t === 'show' || t === 'shows' || t === 'series' || t === 'short-web-series' || t === 'web-series') {
      return (item.seriesAccess || '').toLowerCase() === 'paid';
    } else if (t === 'live' || t === 'channel' || t === 'channels' || t === 'tv-channel' || t === 'tv-channels') {
      return (item.tvAccess || '').toLowerCase() === 'paid' || (item.access || '').toLowerCase() === 'paid';
    } else {
      if (t === 'new-release' || t === 'new-releases') {
        const itemType = (item.contentType || '').toLowerCase();
        if (itemType.includes('show') || itemType.includes('series') || itemType.includes('web')) {
          return (item.seriesAccess || '').toLowerCase() === 'paid';
        }
      }
      return (item.access || '').toLowerCase() === 'paid';
    }
  };

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    sliders: [],
    movies: [],
    shows: [],
    newReleases: [],
    sports: [],
    channels: [],
    homeSections: [],
    experiences: [],
    assets: [],
  });
  const [activeSliderIndex, setActiveSliderIndex] = useState(0);
  const sliderRef = useRef(null);

  const [settings, setSettings] = useState(null);
  const [menuSettings, setMenuSettings] = useState(null);

  const fetchHomeData = async () => {
    try {
      const response = await client.get('/home-aggregated');
      
      if (response && response.data) {
        setData({
          sliders: response.data.sliders || [],
          movies: response.data.movies || [],
          shows: response.data.shows || [],
          newReleases: response.data.newReleases || [],
          sports: response.data.sports || [],
          channels: response.data.channels || [],
          homeSections: response.data.homeSections || [],
          experiences: response.data.experiences || [],
          assets: response.data.assets || [],
        });
        // Use settings from aggregated response — no separate call needed
        if (response.data.settings) {
          setSettings(response.data.settings);
        }
        if (response.data.menuSettings) {
          setMenuSettings(response.data.menuSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };


  // Autoplay sliders
  useEffect(() => {
    if (data.sliders.length > 1) {
      const interval = setInterval(() => {
        let nextIndex = activeSliderIndex + 1;
        if (nextIndex >= data.sliders.length) {
          nextIndex = 0;
        }
        setActiveSliderIndex(nextIndex);
        sliderRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSliderIndex, data.sliders]);

  const renderSliderItem = ({ item }) => {
    const imageUrl = formatImageUrl(item, 'slider');
    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        style={[styles.sliderItem, { width: windowWidth }]}
        onPress={() => {
          // If slider links to content, navigate there.
          if (item.contentId) {
            navigation.navigate('Details', { id: item.contentId, type: item.postType || 'movie' });
          } else if (item.link) {
            alert('Opening link: ' + item.link);
          }
        }}
      >
        <Image source={{ uri: imageUrl }} style={styles.sliderImage} resizeMode="cover" />
        <View style={styles.sliderOverlay}>
          <Text style={styles.sliderTitle} numberOfLines={2}>{item.title}</Text>
          
          {/* Metadata Row */}
          {(item.imdbRating || item.releaseYear || item.duration || isValidQuality(item.videoQuality)) ? (
            <View style={styles.sliderMetaRow}>
              {item.imdbRating ? <IMDBRatingCircle rating={item.imdbRating} /> : null}
              {item.releaseYear ? <Text style={styles.sliderMetaText}>{item.releaseYear}</Text> : null}
              {item.duration ? <Text style={styles.sliderMetaText}>{item.duration}</Text> : null}
              {isValidQuality(item.videoQuality) ? (
                <View style={styles.sliderQualityContainer}>
                  <Text style={styles.sliderQualityText}>{item.videoQuality}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.playBadge}>
            <Play color="#000000" size={14} fill="#000000" />
            <Text style={styles.playBadgeText}>Watch Now</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMediaCard = ({ item, type }) => {
    const imageUrl = formatImageUrl(item, 'poster');
    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => navigation.navigate('Details', { id: item._id, type })}
      >
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          {checkIsPaid(item, type) && (() => {
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
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title || item.name}</Text>
        {isValidQuality(item.videoQuality) || item.language ? (
          <View style={styles.cardBadges}>
            {isValidQuality(item.videoQuality) ? <Text style={styles.qualityBadge}>{item.videoQuality}</Text> : null}
            {item.language ? <Text style={styles.langBadge}>{item.language}</Text> : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderChannelCard = ({ item }) => {
    const imageUrl = formatImageUrl(item, 'poster');
    return (
      <TouchableOpacity
        style={styles.channelCard}
        onPress={() => navigation.navigate('Details', { id: item._id, type: 'live' })}
      >
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: imageUrl }} style={styles.channelImage} resizeMode="cover" />
          {checkIsPaid(item, 'live') && (() => {
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
        <View style={styles.liveOverlay}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.channelTitle} numberOfLines={1}>{item.title || item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderExperienceIcon = (iconName) => {
    const IconComponent = {
      Globe: Globe,
      MonitorPlay: MonitorPlay,
      Shield: Shield,
      Play: Play,
      Tv: Tv,
      Trophy: Trophy,
      CreditCard: CreditCard,
      Clapperboard: Clapperboard,
    }[iconName] || Globe;

    return <IconComponent color="#b3d332" size={24} />;
  };

  const renderExperienceSection = () => {
    if (!data.experiences || data.experiences.length === 0) return null;

    const isLandscape = windowWidth > windowHeight;

    const hasCollageImages = data.assets && data.assets.length > 0;
    
    // Render the collage images
    const renderCollage = () => {
      if (!hasCollageImages) return null;

      const activeAssets = data.assets.filter(a => a?.url);
      const count = activeAssets.length;

      if (count === 0) return null;

      if (count === 1) {
        return (
          <View style={styles.collageContainer}>
            <Image 
              source={{ uri: formatImageUrl(activeAssets[0].url) }} 
              style={styles.singleCollageImage} 
              resizeMode="cover" 
            />
          </View>
        );
      }

      if (count === 2) {
        return (
          <View style={styles.collageContainer}>
            <View style={styles.collageInnerTwo}>
              <Image 
                source={{ uri: formatImageUrl(activeAssets[0].url) }} 
                style={styles.collageTwoImg1} 
                resizeMode="cover" 
              />
              <Image 
                source={{ uri: formatImageUrl(activeAssets[1].url) }} 
                style={styles.collageTwoImg2} 
                resizeMode="cover" 
              />
            </View>
          </View>
        );
      }

      return (
        <View style={styles.collageContainer}>
          <View style={styles.collageInner}>
            <Image source={{ uri: formatImageUrl(activeAssets[0].url) }} style={styles.collageImg1} resizeMode="cover" />
            <Image source={{ uri: formatImageUrl(activeAssets[1].url) }} style={styles.collageImg2} resizeMode="cover" />
            <Image source={{ uri: formatImageUrl(activeAssets[2].url) }} style={styles.collageImg3} resizeMode="cover" />
          </View>
        </View>
      );
    };

    const renderTitle = () => (
      <Text style={styles.experienceMainTitle}>
        Best pick for hassle-free <Text style={styles.experienceMainTitleUnderline}>streaming</Text> experience.
      </Text>
    );

    const renderFeatures = () => (
      <View>
        {data.experiences.map((exp) => (
          <View key={exp._id || exp.title} style={styles.experienceFeatureItem}>
            <View style={styles.experienceFeatureIconBox}>
              {renderExperienceIcon(exp.icon)}
            </View>
            <View style={styles.experienceFeatureText}>
              <Text style={styles.experienceFeatureTitle}>{exp.title}</Text>
              <Text style={styles.experienceFeatureDesc}>{exp.description}</Text>
            </View>
          </View>
        ))}
      </View>
    );

    const renderTextContent = () => (
      <View style={styles.experienceContentWrapper}>
        {renderTitle()}
        {renderFeatures()}
      </View>
    );

    if (isLandscape) {
      return (
        <View style={[styles.experienceSectionContainer, { paddingHorizontal: 16 }]}>
          <View style={styles.experienceLandscapeLayout}>
            {hasCollageImages && (
              <View style={styles.experienceLandscapeLeft}>
                {renderCollage()}
              </View>
            )}
            <View style={isLandscape && hasCollageImages ? styles.experienceLandscapeRight : { flex: 1 }}>
              {renderTextContent()}
            </View>
          </View>
        </View>
      );
    }

    if (!hasCollageImages) {
      return (
        <View style={styles.experienceSectionContainer}>
          {renderTextContent()}
        </View>
      );
    }

    return (
      <View style={styles.experienceSectionContainer}>
        <View style={styles.experienceContentWrapper}>
          {renderTitle()}
        </View>
        {renderCollage()}
        <View style={styles.experienceContentWrapper}>
          {renderFeatures()}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b3d332" />
      </View>
    );
  }

  const activeCount = [
    (!menuSettings || menuSettings.movies?.toUpperCase() !== 'OFF' || menuSettings.shortFilms?.toUpperCase() !== 'OFF'),
    (!menuSettings || menuSettings.shows?.toUpperCase() !== 'OFF' || menuSettings.webSeries?.toUpperCase() !== 'OFF'),
    (!menuSettings || menuSettings.liveTv?.toUpperCase() !== 'OFF'),
    (!menuSettings || menuSettings.sports?.toUpperCase() !== 'OFF'),
    true // Plans
  ].filter(Boolean).length;

  const totalQuickLinksWidth = activeCount * 72 + (activeCount - 1) * 12 + 32;
  const shouldCenterQuickLinks = totalQuickLinksWidth < windowWidth;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {settings?.siteLogo ? (
          <Image 
            source={{ uri: formatImageUrl(settings.siteLogo, 'logo') }} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        ) : (
          <Text style={styles.brandLogo}>LEMO<Text style={{ color: '#b3d332' }}>OTT</Text></Text>
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate('Search')}>
          <Search color="#ffffff" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#b3d332" />}
      >
        {/* Banner Slider */}
        {data.sliders.filter(s => isSliderActive(s, menuSettings)).length > 0 && (
          <View style={styles.sliderContainer}>
            <FlatList
              ref={sliderRef}
              data={data.sliders.filter(s => isSliderActive(s, menuSettings))}
              renderItem={renderSliderItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
                setActiveSliderIndex(index);
              }}
              getItemLayout={(data, index) => ({
                length: windowWidth,
                offset: windowWidth * index,
                index,
              })}
            />
            {/* Dots Indicator */}
            <View style={styles.dotsRow}>
              {data.sliders.filter(s => isSliderActive(s, menuSettings)).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeSliderIndex === index ? styles.activeDot : null
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Quick Links Scroll Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={[
            styles.quickLinksScrollContent,
            shouldCenterQuickLinks && { justifyContent: 'center', flexGrow: 1 }
          ]}
          style={styles.quickLinksScrollStyle}
        >
          {(!menuSettings || menuSettings.movies?.toUpperCase() !== 'OFF' || menuSettings.shortFilms?.toUpperCase() !== 'OFF') && (
            <TouchableOpacity style={styles.quickLinkItem} onPress={() => navigation.navigate('MoviesTab')}>
              <View style={[styles.quickLinkIconContainer, { backgroundColor: 'rgba(255, 149, 0, 0.15)' }]}>
                <Film color="#ff9500" size={20} />
              </View>
              <Text style={styles.quickLinkLabel}>
                {(!menuSettings || menuSettings.movies?.toUpperCase() !== 'OFF') ? 'Movie' : 'Short Film'}
              </Text>
            </TouchableOpacity>
          )}

          {(!menuSettings || menuSettings.shows?.toUpperCase() !== 'OFF' || menuSettings.webSeries?.toUpperCase() !== 'OFF') && (
            <TouchableOpacity style={styles.quickLinkItem} onPress={() => navigation.navigate('ShowsTab')}>
              <View style={[styles.quickLinkIconContainer, { backgroundColor: 'rgba(175, 82, 222, 0.15)' }]}>
                <Clapperboard color="#af52de" size={20} />
              </View>
              <Text style={styles.quickLinkLabel}>
                {(!menuSettings || menuSettings.shows?.toUpperCase() !== 'OFF') ? 'Shows' : 'Web Series'}
              </Text>
            </TouchableOpacity>
          )}

          {(!menuSettings || menuSettings.liveTv?.toUpperCase() !== 'OFF') && (
            <TouchableOpacity style={styles.quickLinkItem} onPress={() => navigation.navigate('LiveTV')}>
              <View style={[styles.quickLinkIconContainer, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
                <Tv color="#ff3b30" size={20} />
              </View>
              <Text style={styles.quickLinkLabel}>Live TV</Text>
            </TouchableOpacity>
          )}

          {(!menuSettings || menuSettings.sports?.toUpperCase() !== 'OFF') && (
            <TouchableOpacity style={styles.quickLinkItem} onPress={() => navigation.navigate('Sports')}>
              <View style={[styles.quickLinkIconContainer, { backgroundColor: 'rgba(0, 122, 255, 0.15)' }]}>
                <Trophy color="#007aff" size={20} />
              </View>
              <Text style={styles.quickLinkLabel}>Sports</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.quickLinkItem} onPress={() => navigation.navigate('Subscription')}>
            <View style={[styles.quickLinkIconContainer, { backgroundColor: 'rgba(179, 211, 50, 0.15)' }]}>
              <CreditCard color="#b3d332" size={20} />
            </View>
            <Text style={styles.quickLinkLabel}>Plans</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Dynamic Sections driven by admin Home Sections config */}
        {(() => {
          // If admin has configured home sections, render them in order
          if (data.homeSections && data.homeSections.length > 0) {
            let experienceRendered = false;
            
            const renderedSections = data.homeSections.map((section) => {
              const key = section._id || section.title;
              const title = section.title;
              const type = section.sectionType;

              // Check if section is disabled in Menu Settings
              if (menuSettings) {
                if (type === 'Movie' && menuSettings.movies?.toUpperCase() === 'OFF') return null;
                if (type === 'Short Film' && menuSettings.shortFilms?.toUpperCase() === 'OFF') return null;
                if (type === 'Shows' && menuSettings.shows?.toUpperCase() === 'OFF') return null;
                if (type === 'Short Web Series' && menuSettings.webSeries?.toUpperCase() === 'OFF') return null;
                if (type === 'Live TV' && menuSettings.liveTv?.toUpperCase() === 'OFF') return null;
                if (type === 'Sports' && menuSettings.sports?.toUpperCase() === 'OFF') return null;
              }

              if (type === 'New Release') {
                const filtered = data.newReleases.filter(item => isItemActive(item, menuSettings));
                if (filtered.length > 0) {
                  return (
                    <View key={key} style={styles.sectionContainer}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                      </View>
                      <FlatList
                        data={filtered.slice(0, section.limit || 20)}
                        renderItem={({ item }) => renderMediaCard({ item, type: 'new-release' })}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                      />
                    </View>
                  );
                }
              }
              if (type === 'Movie') {
                const moviesOnly = data.movies.filter(m => m.contentType !== 'Short Film' && m.contentType !== 'short-film');
                const filtered = moviesOnly.filter(item => isItemActive(item, menuSettings));
                if (filtered.length > 0) {
                  return (
                    <View key={key} style={styles.sectionContainer}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                      </View>
                      <FlatList
                        data={filtered.slice(0, section.limit || 20)}
                        renderItem={({ item }) => renderMediaCard({ item, type: 'movie' })}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                      />
                    </View>
                  );
                }
              }
              if (type === 'Short Film') {
                const shortFilms = data.movies.filter(m => m.contentType === 'Short Film' || m.contentType === 'short-film');
                const filtered = shortFilms.filter(item => isItemActive(item, menuSettings));
                if (filtered.length > 0) {
                  const showExp = !experienceRendered;
                  experienceRendered = true;
                  return (
                    <React.Fragment key={key}>
                      {showExp && renderExperienceSection()}
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>{title}</Text>
                        </View>
                        <FlatList
                          data={filtered.slice(0, section.limit || 20)}
                          renderItem={({ item }) => renderMediaCard({ item, type: 'short-film' })}
                          keyExtractor={(item) => item._id}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.listContent}
                        />
                      </View>
                    </React.Fragment>
                  );
                }
              }
              if (type === 'Shows' || type === 'Short Web Series') {
                const filtered = data.shows.filter(item => isItemActive(item, menuSettings));
                if (filtered.length > 0) {
                  const showExp = !experienceRendered;
                  experienceRendered = true;
                  return (
                    <React.Fragment key={key}>
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>{title}</Text>
                        </View>
                        <FlatList
                          data={filtered.slice(0, section.limit || 20)}
                          renderItem={({ item }) => renderMediaCard({ item, type: 'show' })}
                          keyExtractor={(item) => item._id}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.listContent}
                        />
                      </View>
                      {showExp && renderExperienceSection()}
                    </React.Fragment>
                  );
                }
              }
              if (type === 'Live TV') {
                const filtered = data.channels.filter(item => isItemActive(item, menuSettings));
                if (filtered.length > 0) {
                  return (
                    <View key={key} style={styles.sectionContainer}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                      </View>
                      <FlatList
                        data={filtered.slice(0, section.limit || 20)}
                        renderItem={renderChannelCard}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                      />
                    </View>
                  );
                }
              }
              if (type === 'Sports') {
                const filtered = data.sports.filter(item => isItemActive(item, menuSettings));
                if (filtered.length > 0) {
                  return (
                    <View key={key} style={styles.sectionContainer}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                      </View>
                      <FlatList
                        data={filtered.slice(0, section.limit || 20)}
                        renderItem={({ item }) => renderMediaCard({ item, type: 'sports' })}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                      />
                    </View>
                  );
                }
              }
              return null;
            });

            if (!experienceRendered) {
              renderedSections.push(
                <React.Fragment key="experience_fallback_dynamic">
                  {renderExperienceSection()}
                </React.Fragment>
              );
            }
            return renderedSections;
          }

          // Fallback: default sections when no homeSections configured in admin
          return (
            <>
              {data.newReleases.filter(item => isItemActive(item, menuSettings)).length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>New Releases</Text>
                  </View>
                  <FlatList
                    data={data.newReleases.filter(item => isItemActive(item, menuSettings))}
                    renderItem={({ item }) => renderMediaCard({ item, type: 'new-release' })}
                    keyExtractor={(item) => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                </View>
              )}
              {data.movies.filter(m => m.contentType !== 'Short Film' && m.contentType !== 'short-film').filter(item => isItemActive(item, menuSettings)).length > 0 && (!menuSettings || menuSettings.movies?.toUpperCase() !== 'OFF') && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Featured Movies</Text>
                  </View>
                  <FlatList
                    data={data.movies.filter(m => m.contentType !== 'Short Film' && m.contentType !== 'short-film').filter(item => isItemActive(item, menuSettings))}
                    renderItem={({ item }) => renderMediaCard({ item, type: 'movie' })}
                    keyExtractor={(item) => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                </View>
              )}
              {data.movies.filter(m => m.contentType === 'Short Film' || m.contentType === 'short-film').filter(item => isItemActive(item, menuSettings)).length > 0 && (!menuSettings || menuSettings.shortFilms?.toUpperCase() !== 'OFF') && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Short Films</Text>
                  </View>
                  <FlatList
                    data={data.movies.filter(m => m.contentType === 'Short Film' || m.contentType === 'short-film').filter(item => isItemActive(item, menuSettings))}
                    renderItem={({ item }) => renderMediaCard({ item, type: 'short-film' })}
                    keyExtractor={(item) => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                </View>
              )}
              {renderExperienceSection()}
              {data.shows.filter(item => isItemActive(item, menuSettings)).length > 0 && (!menuSettings || menuSettings.shows?.toUpperCase() !== 'OFF' || menuSettings.webSeries?.toUpperCase() !== 'OFF') && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trending Web Series</Text>
                  </View>
                  <FlatList
                    data={data.shows.filter(item => isItemActive(item, menuSettings))}
                    renderItem={({ item }) => renderMediaCard({ item, type: 'show' })}
                    keyExtractor={(item) => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                </View>
              )}
              {data.channels.filter(item => isItemActive(item, menuSettings)).length > 0 && (!menuSettings || menuSettings.liveTv?.toUpperCase() !== 'OFF') && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Live Channels</Text>
                  </View>
                  <FlatList
                    data={data.channels.filter(item => isItemActive(item, menuSettings))}
                    renderItem={renderChannelCard}
                    keyExtractor={(item) => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                </View>
              )}
              {data.sports.filter(item => isItemActive(item, menuSettings)).length > 0 && (!menuSettings || menuSettings.sports?.toUpperCase() !== 'OFF') && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Sports Highlights</Text>
                  </View>
                  <FlatList
                    data={data.sports.filter(item => isItemActive(item, menuSettings))}
                    renderItem={({ item }) => renderMediaCard({ item, type: 'sports' })}
                    keyExtractor={(item) => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                </View>
              )}
            </>
          );
        })()}

        {/* Extra Bottom Spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  brandLogo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  logoImage: {
    width: 140,
    height: 38,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderContainer: {
    position: 'relative',
    height: BANNER_HEIGHT,
    marginBottom: 20,
  },
  sliderItem: {
    height: BANNER_HEIGHT,
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  sliderOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    padding: 20,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sliderTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  sliderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  sliderMetaText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
  },
  sliderQualityContainer: {
    backgroundColor: 'rgba(179, 211, 50, 0.12)',
    borderColor: 'rgba(179, 211, 50, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sliderQualityText: {
    color: '#b3d332',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#b3d332',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  playBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#b3d332',
    width: 14,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  cardContainer: {
    width: 110,
    marginHorizontal: 4,
  },
  cardImage: {
    width: 110,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  cardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  qualityBadge: {
    color: '#b3d332',
    fontSize: 9,
    fontWeight: '800',
    borderColor: '#b3d332',
    borderWidth: 0.5,
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  langBadge: {
    color: '#8e8e93',
    fontSize: 9,
    fontWeight: '600',
  },
  channelCard: {
    width: 130,
    marginHorizontal: 4,
    position: 'relative',
  },
  channelImage: {
    width: 130,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
  },
  liveOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  channelTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  quickLinksScrollStyle: {
    marginBottom: 16,
    marginTop: 8,
  },
  quickLinksScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickLinkItem: {
    alignItems: 'center',
    width: 72,
  },
  quickLinkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickLinkLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
  experienceSectionContainer: {
    marginVertical: 24,
    paddingVertical: 10,
  },
  experienceContentWrapper: {
    paddingHorizontal: 16,
  },
  experienceMainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 32,
    marginBottom: 28,
  },
  experienceMainTitleUnderline: {
    color: '#b3d332',
    textDecorationLine: 'underline',
    textDecorationColor: '#b3d332',
  },
  experienceFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  experienceFeatureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#121212',
    borderColor: '#1f1f1f',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  experienceFeatureText: {
    flex: 1,
  },
  experienceFeatureTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  experienceFeatureDesc: {
    color: '#8e8e93',
    fontSize: 12,
    lineHeight: 18,
  },
  collageContainer: {
    width: '100%',
    height: 280,
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleCollageImage: {
    width: 160,
    height: 260,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2a2c31',
    alignSelf: 'center',
  },
  collageInnerTwo: {
    width: 260,
    height: 250,
    position: 'relative',
    alignSelf: 'center',
  },
  collageTwoImg1: {
    position: 'absolute',
    width: 120,
    height: 220,
    left: 0,
    top: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2c31',
    zIndex: 1,
  },
  collageTwoImg2: {
    position: 'absolute',
    width: 120,
    height: 220,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2a2c31',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  collageInner: {
    width: 340,
    height: 280,
    position: 'relative',
  },
  collageImg1: {
    position: 'absolute',
    width: 110,
    height: 200,
    left: 10,
    top: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2c31',
    zIndex: 1,
  },
  collageImg2: {
    position: 'absolute',
    width: 110,
    height: 200,
    right: 10,
    top: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2c31',
    zIndex: 2,
  },
  collageImg3: {
    position: 'absolute',
    width: 140,
    height: 250,
    left: 100,
    top: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2a2c31',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  experienceLandscapeLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginVertical: 10,
  },
  experienceLandscapeLeft: {
    flex: 1.1,
    justifyContent: 'center',
  },
  experienceLandscapeRight: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingCircleContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 4,
  },
  ratingCircleTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingCircleText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
});
