import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
  RefreshControl,
  Image,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WifiOff, RefreshCw, Smartphone, Sparkles, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function OfflineView({
  onRetry,
  title = "You're offline",
  message = "Please connect to the internet and try again.",
  fullScreen = true,
}) {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      }
    } catch (err) {
      console.warn('[OfflineView] Retry error:', err);
    } finally {
      setTimeout(() => setRetrying(false), 500);
    }
  };

  const content = (
    <View style={styles.centerWrapper}>
      {/* Visual Offline Illustration Box */}
      <View style={styles.illustrationContainer}>
        {/* Ambient Glow */}
        <View style={[styles.ambientGlow, { backgroundColor: isDark ? 'rgba(179, 211, 50, 0.08)' : 'rgba(132, 166, 0, 0.12)' }]} />

        {/* Decorative Floating Sparkles */}
        <View style={[styles.sparkle, styles.sparkleTopLeft]}>
          <Sparkles size={14} color={theme.primary} />
        </View>
        <View style={[styles.sparkle, styles.sparkleTopRight]}>
          <View style={styles.smallDot} />
        </View>
        <View style={[styles.sparkle, styles.sparkleBottomRight]}>
          <Sparkles size={12} color="#ff5252" />
        </View>

        {/* Modern Stylized Smartphone Device */}
        <View style={[styles.deviceFrame, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={[styles.deviceSpeaker, { backgroundColor: isDark ? '#353a47' : '#cbd5e1' }]} />
          
          {/* Inner Screen */}
          <View style={[styles.deviceScreen, { backgroundColor: theme.cardSecondary, borderColor: theme.cardBorder }]}>
            {/* Soft Ambient Background inside Phone */}
            <View style={styles.screenBgCircle} />

            {/* WiFi Off Vector Icon */}
            <View style={styles.wifiIconWrap}>
              <WifiOff size={40} color="#ff5252" strokeWidth={2.3} />
            </View>

            {/* Offline Cross Badge */}
            <View style={[styles.crossBadge, { borderColor: theme.cardBackground }]}>
              <X size={11} color="#ffffff" strokeWidth={3} />
            </View>
          </View>

          {/* Home Indicator Notch / Button */}
          <View style={[styles.deviceHomeButton, { borderColor: isDark ? '#353a47' : '#cbd5e1' }]} />
        </View>
      </View>

      {/* Main Offline Text */}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>

      {/* Try Again Action Button */}
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={handleRetry}
          activeOpacity={0.82}
          disabled={Boolean(retrying)}
        >
          {retrying ? (
            <ActivityIndicator size="small" color={theme.isDark ? '#000000' : '#ffffff'} />
          ) : (
            <>
              <RefreshCw size={16} color={theme.isDark ? '#000000' : '#ffffff'} strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={[styles.retryButtonText, { color: theme.isDark ? '#000000' : '#ffffff' }]}>Try Again</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal
        visible={true}
        animationType="fade"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => {}}
      >
        <SafeAreaView style={[styles.fullContainer, { backgroundColor: theme.background }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={retrying}
                onRefresh={handleRetry}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
          >
            {content}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  return <View style={[styles.inlineContainer, { backgroundColor: theme.background }]}>{content}</View>;
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  inlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  brandLogo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logoImage: {
    width: 110,
    height: 32,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  centerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 340,
    width: '100%',
  },
  illustrationContainer: {
    position: 'relative',
    width: 170,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ambientGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 10,
  },
  sparkleTopLeft: {
    top: 15,
    left: 10,
  },
  sparkleTopRight: {
    top: 22,
    right: 14,
  },
  sparkleBottomRight: {
    bottom: 30,
    right: 12,
  },
  smallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff5252',
  },
  deviceFrame: {
    width: 110,
    height: 175,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  deviceSpeaker: {
    width: 24,
    height: 3.5,
    borderRadius: 2,
    marginBottom: 6,
  },
  deviceScreen: {
    flex: 1,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  screenBgCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
  },
  wifiIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff5252',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  deviceHomeButton: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    marginTop: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 26,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 150,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
