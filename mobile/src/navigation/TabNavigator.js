import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, AppState } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Film, Tv, Smartphone, Bookmark, User, Clapperboard } from 'lucide-react-native';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import MoviesScreen from '../screens/MoviesScreen';
import ShowsScreen from '../screens/ShowsScreen';
import PocketReelsScreen from '../screens/PocketReelsScreen';
import ShortsScreen from '../screens/ShortsScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function FloatingGlassTabBar({ state, descriptors, navigation, theme }) {
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => getTabBarStyles(theme), [theme]);

  // Adjust bottom offset dynamically for safe area and navigation bar
  const bottomOffset = Math.max(insets.bottom > 0 ? insets.bottom : 10, Platform.OS === 'ios' ? 12 : 8);

  return (
    <View pointerEvents="box-none" style={[styles.tabBarWrapper, { bottom: bottomOffset }]}>
      <View style={styles.floatingDock}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const renderIcon = () => {
            const iconColor = isFocused ? theme.primary : '#a1a1aa';
            const strokeWidth = isFocused ? 2.5 : 1.8;
            const size = 18;

            if (route.name === 'HomeTab') {
              return <Home color={iconColor} size={size} strokeWidth={strokeWidth} />;
            }
            if (route.name === 'MoviesTab') {
              return <Film color={iconColor} size={size} strokeWidth={strokeWidth} />;
            }
            if (route.name === 'ShowsTab') {
              return <Tv color={iconColor} size={size} strokeWidth={strokeWidth} />;
            }
            if (route.name === 'PocketReelsTab') {
              return <Smartphone color={iconColor} size={size} strokeWidth={strokeWidth} />;
            }
            if (route.name === 'ShortsTab') {
              return <Clapperboard color={iconColor} size={size} strokeWidth={strokeWidth} />;
            }
            if (route.name === 'WatchlistTab') {
              return <Bookmark color={iconColor} size={size} strokeWidth={strokeWidth} />;
            }
            if (route.name === 'ProfileTab') {
              return <User color={iconColor} size={size} strokeWidth={strokeWidth} />;
            }
            return null;
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabButton}
            >
              <View style={styles.iconWrapper}>
                {renderIcon()}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabNavigator() {
  const { theme } = useTheme();
  const [menuSettings, setMenuSettings] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const res = await client.get('/menu-settings');
        if (active && res && res.data) {
          setMenuSettings(res.data);
        }
      } catch (err) {
        console.error('Error fetching tab settings:', err);
      }
    };

    fetchSettings();

    // Poll every 6 seconds for real-time admin setting updates
    const interval = setInterval(fetchSettings, 6000);

    // Refresh immediately when user returns to the app
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchSettings();
      }
    });

    return () => {
      active = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingGlassTabBar {...props} theme={theme} />}
      sceneContainerStyle={{ backgroundColor: theme.background }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      {(!menuSettings || menuSettings.movies?.toUpperCase() !== 'OFF' || menuSettings.shortFilms?.toUpperCase() !== 'OFF') && (
        <Tab.Screen
          name="MoviesTab"
          component={MoviesScreen}
          options={{
            tabBarLabel: (menuSettings?.shortFilms?.toUpperCase() !== 'OFF' && menuSettings?.movies?.toUpperCase() === 'OFF')
              ? (menuSettings?.shortFilmsLabel || 'Short Film')
              : (menuSettings?.moviesLabel || 'Movies'),
            tabBarIcon: ({ color, size }) => <Film color={color} size={size} />,
          }}
        />
      )}
      {(!menuSettings || menuSettings.shows?.toUpperCase() !== 'OFF' || menuSettings.webSeries?.toUpperCase() !== 'OFF') && (
        <Tab.Screen
          name="ShowsTab"
          component={ShowsScreen}
          options={{
            tabBarLabel: (!menuSettings || menuSettings.shows?.toUpperCase() !== 'OFF')
              ? (menuSettings?.showsLabel || 'Shows')
              : (menuSettings?.webSeriesLabel || 'Web Series'),
            tabBarIcon: ({ color, size }) => <Tv color={color} size={size} />,
          }}
        />
      )}
      {(!menuSettings || menuSettings.pocketReelSeries?.toUpperCase() !== 'OFF') && (
        <Tab.Screen
          name="PocketReelsTab"
          component={PocketReelsScreen}
          options={{
            tabBarLabel: menuSettings?.pocketReelsLabel || 'Pocket Reel',
            tabBarIcon: ({ color, size }) => <Smartphone color={color} size={size} />,
          }}
        />
      )}
      {(!menuSettings || menuSettings.shorts?.toUpperCase() !== 'OFF') && (
        <Tab.Screen
          name="ShortsTab"
          component={ShortsScreen}
          options={{
            tabBarLabel: 'Shorts',
            tabBarIcon: ({ color, size }) => <Clapperboard color={color} size={size} />,
          }}
        />
      )}
      <Tab.Screen
        name="WatchlistTab"
        component={WatchlistScreen}
        options={{
          tabBarLabel: 'Watchlist',
          tabBarIcon: ({ color, size }) => <Bookmark color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

const getTabBarStyles = (theme) => StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 999,
  },
  floatingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 540,
    backgroundColor: 'rgba(8, 8, 12, 0.65)', // Transparent frosted dark glass
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)', // Crystal glass edge highlight
    paddingVertical: 7,
    paddingHorizontal: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 14,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 18,
    position: 'relative',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  tabLabel: {
    fontSize: 9.5,
    letterSpacing: 0.1,
    marginTop: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tabLabelActive: {
    color: theme.primary,
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#94a3b8',
    fontWeight: '600',
  },
});
