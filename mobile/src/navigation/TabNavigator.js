import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Film, Tv, Bookmark, User } from 'lucide-react-native';
import client from '../api/client';

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import MoviesScreen from '../screens/MoviesScreen';
import ShowsScreen from '../screens/ShowsScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const [menuSettings, setMenuSettings] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const res = await client.get('/home-aggregated');
        if (active && res && res.data && res.data.menuSettings) {
          setMenuSettings(res.data.menuSettings);
        }
      } catch (err) {
        console.error('Error fetching tab settings:', err);
      }
    };
    fetchSettings();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: '#000000' }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#1a1a1a',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#b3d332', // Brand Lime Accent
        tabBarInactiveTintColor: '#8e8e93',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
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
            tabBarLabel: 'Short Film',
            tabBarIcon: ({ color, size }) => <Film color={color} size={size} />,
          }}
        />
      )}
      {(!menuSettings || menuSettings.shows?.toUpperCase() !== 'OFF' || menuSettings.webSeries?.toUpperCase() !== 'OFF') && (
        <Tab.Screen
          name="ShowsTab"
          component={ShowsScreen}
          options={{
            tabBarLabel: 'Web Series',
            tabBarIcon: ({ color, size }) => <Tv color={color} size={size} />,
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
