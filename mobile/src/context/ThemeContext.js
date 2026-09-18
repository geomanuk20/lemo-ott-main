import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@lemo_mobile_theme';

export const THEMES = {
  dark: {
    mode: 'dark',
    isDark: true,
    background: '#000000',
    surface: '#000000',
    cardBackground: '#08080a',
    cardSecondary: '#111114',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    primary: '#b3d332',
    primaryText: '#000000',
    headerBackground: '#000000', // Seamless pitch black matching background
    headerBorder: 'rgba(255, 255, 255, 0.08)',
    tabBarBackground: '#000000', // Midnight pitch black
    tabBarBorder: 'rgba(255, 255, 255, 0.08)',
    tabBarActive: '#b3d332',
    tabBarInactive: '#808080',
    inputBackground: '#0b0b0e',
    inputBorder: '#222226',
    divider: '#161619',
    danger: '#ff4d4d',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
    statusBarStyle: 'light',
    statusBarBg: '#000000',
  },
  light: {
    mode: 'light',
    isDark: false,
    background: '#f4f6fa',
    surface: '#ffffff',
    cardBackground: '#ffffff',
    cardSecondary: '#f0f3f8',
    cardBorder: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    primary: '#84a600',
    primaryText: '#ffffff',
    headerBackground: '#f4f6fa', // Seamless light slate matching background
    headerBorder: '#e2e8f0',
    tabBarBackground: '#ffffff',
    tabBarBorder: '#e2e8f0',
    tabBarActive: '#789900',
    tabBarInactive: '#64748b',
    inputBackground: '#f8fafc',
    inputBorder: '#cbd5e1',
    divider: '#e2e8f0',
    danger: '#ef4444',
    badgeBg: 'rgba(0, 0, 0, 0.06)',
    statusBarStyle: 'dark',
    statusBarBg: '#f4f6fa',
  }
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themeMode, setThemeModeState] = useState('dark'); // 'dark' | 'light'
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'dark' || saved === 'light')) {
          setThemeModeState(saved);
        } else {
          setThemeModeState('dark'); // Default to sleek dark mode
        }
      } catch (err) {
        console.warn('[ThemeContext] Error loading saved theme:', err);
      } finally {
        setLoaded(true);
      }
    };
    loadSavedTheme();
  }, []);

  const setThemeMode = async (mode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('[ThemeContext] Error saving theme:', err);
    }
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setThemeMode(next);
  };

  // Determine active theme object
  const activeMode = themeMode === 'system'
    ? (systemColorScheme === 'light' ? 'light' : 'dark')
    : themeMode;

  const theme = THEMES[activeMode] || THEMES.dark;
  const isDark = theme.isDark;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        isDark,
        setThemeMode,
        toggleTheme,
        loaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: THEMES.dark,
      themeMode: 'dark',
      isDark: true,
      setThemeMode: () => {},
      toggleTheme: () => {},
      loaded: true,
    };
  }
  return context;
};
