import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Share,
  Linking,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, CreditCard, LogOut, Calendar, Moon, Sun, Smartphone, Palette, Check } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';
import { formatImageUrl } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';

export default function ProfileScreen({ navigation }) {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [userDetails, setUserDetails] = useState(user);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [settings, setSettings] = useState(null);
  const [customPages, setCustomPages] = useState([]);

  const fetchProfileData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      // Fetch updated user info & transactions in parallel
      const [userRes, transRes] = await Promise.all([
        client.get(`/users/${user.id}`),
        client.get(`/user/transactions/${user.email}`)
      ]);

      if (userRes.data) {
        setUserDetails(userRes.data);
      }
      setTransactions(transRes.data || []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Auto-refresh when profile tab is focused
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user) {
        setLoading(true);
        fetchProfileData();
      } else {
        setLoading(false);
      }
    }, [fetchProfileData, isAuthenticated, user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  useEffect(() => {
    const fetchGeneralAndPages = async () => {
      try {
        const [genRes, pagesRes] = await Promise.all([
          client.get('/general-settings').catch(() => ({ data: null })),
          client.get('/pages').catch(() => ({ data: [] }))
        ]);
        if (genRes?.data) setSettings(genRes.data);
        if (pagesRes?.data && Array.isArray(pagesRes.data)) {
          const hardcodedSlugs = ['about-us', 'contact-us', 'privacy-policy', 'terms-of-use', 'terms-of-service', 'terms', 'faq', 'help-center', 'supported-devices', 'refund-policy', 'careers', 'career'];
          const dynamicList = pagesRes.data.filter(p => p.status === 'Active' && !hardcodedSlugs.includes(p.slug));
          setCustomPages(dynamicList);
        }
      } catch (err) {
        console.warn('Error fetching general/pages settings on ProfileScreen:', err);
      }
    };
    fetchGeneralAndPages();
  }, []);

  const handleShareApp = async () => {
    try {
      const shareUrl = Platform.OS === 'ios'
        ? (settings?.appleStoreUrl || 'https://apps.apple.com/in/developer/vishal-pamar/id1')
        : (settings?.googlePlayUrl || 'https://play.google.com/store/apps/dev?id=71574785');
      
      const message = `Check out Lemo OTT! Watch your favorite TV shows, movies, live channels, and sports on the go.\n\nDownload now: ${shareUrl}`;
      
      await Share.share({
        message,
        url: shareUrl,
        title: 'Share Lemo OTT'
      });
    } catch (error) {
      console.warn('Error sharing app:', error);
    }
  };

  const handleRateApp = async () => {
    try {
      const rateUrl = Platform.OS === 'ios'
        ? (settings?.appleStoreUrl || 'https://apps.apple.com/in/developer/vishal-pamar/id1')
        : (settings?.googlePlayUrl || 'https://play.google.com/store/apps/dev?id=71574785');
      
      const supported = await Linking.canOpenURL(rateUrl);
      if (supported) {
        await Linking.openURL(rateUrl);
      } else {
        console.warn("Don't know how to open URI: " + rateUrl);
      }
    } catch (error) {
      console.warn('Error opening store link:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const avatarUrl = userDetails?.profileImage ? formatImageUrl(userDetails.profileImage) : null;
  const activePlan = userDetails?.subscriptionPlan || userDetails?.activePlan || 'Basic Plan';
  const planExpiry = userDetails?.expiryDate || userDetails?.planExpiry
    ? formatDate(userDetails?.expiryDate || userDetails?.planExpiry)
    : 'N/A';

  const isBasePlan = !userDetails?.subscriptionPlan || 
    activePlan?.toLowerCase().includes('basic') || 
    activePlan?.toLowerCase().includes('base') || 
    activePlan?.toLowerCase().includes('free') ||
    (userDetails?.expiryDate && userDetails.expiryDate.startsWith('2099')) ||
    (planExpiry && planExpiry.includes('2099')) ||
    planExpiry === 'N/A';

  const dynamicStyles = {
    container: { backgroundColor: theme.background },
    header: { backgroundColor: theme.headerBackground, borderBottomColor: theme.headerBorder },
    headerTitle: { color: theme.text },
    card: { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
    cardTitle: { color: theme.text },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    pageLinkRow: { borderBottomColor: theme.divider },
    pageLinkText: { color: theme.text },
    planContainer: { backgroundColor: theme.cardSecondary, borderColor: theme.cardBorder },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>My Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          ) : undefined
        }
        contentContainerStyle={styles.scrollContent}
      >
        {isAuthenticated ? (
          <>
            {/* User Card */}
            <View style={[styles.profileCard, dynamicStyles.card]}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('EditProfile', { userDetails })}
                activeOpacity={0.8}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarPlaceholderText}>{getInitials(userDetails?.name)}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={[styles.profileName, dynamicStyles.cardTitle]}>{userDetails?.name || 'User Name'}</Text>
              
              <View style={styles.infoRow}>
                <Mail color={theme.textSecondary} size={16} />
                <Text style={[styles.infoText, dynamicStyles.textSecondary]}>{userDetails?.email}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.editProfileLink, { borderColor: theme.cardBorder }]} 
                onPress={() => navigation.navigate('EditProfile', { userDetails })}
              >
                <Text style={[styles.editProfileLinkText, { color: theme.primary }]}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Subscription Info Card */}
            <View style={[styles.sectionCard, dynamicStyles.card]}>
              <Text style={[styles.sectionTitle, dynamicStyles.cardTitle]}>Subscription Status</Text>
              <View style={[styles.planContainer, dynamicStyles.planContainer]}>
                <View style={[styles.planHeader, isBasePlan && { marginBottom: 16 }]}>
                  <CreditCard color={theme.primary} size={24} />
                  <Text style={[styles.planName, dynamicStyles.cardTitle]}>{activePlan}</Text>
                </View>
                {!isBasePlan && planExpiry && planExpiry !== 'N/A' && (
                  <View style={styles.planExpiryRow}>
                    <Calendar color={theme.textSecondary} size={14} />
                    <Text style={[styles.planExpiryText, dynamicStyles.textSecondary]}>Expires: {planExpiry}</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={[styles.upgradeBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <Text style={styles.upgradeBtnText}>Upgrade / Change Plan</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Transaction History Card */}
            <View style={[styles.sectionCard, dynamicStyles.card]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, dynamicStyles.cardTitle]}>Payment History</Text>
              </View>
              {transactions.length === 0 ? (
                <Text style={[styles.emptyTransText, dynamicStyles.textSecondary]}>No payment history found.</Text>
              ) : (
                <>
                  {transactions.slice(0, 3).map((tx) => (
                    <View key={tx._id} style={[styles.txRow, { borderBottomColor: theme.divider }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.txPlan, dynamicStyles.cardTitle]}>{tx.planName || tx.plan || 'Premium Subscription'}</Text>
                        <Text style={[styles.txDate, dynamicStyles.textSecondary]}>{formatDate(tx.createdAt || tx.paymentDate || tx.date)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.txAmount, dynamicStyles.cardTitle]}>
                          {tx.currency || 'INR'} {tx.amount}
                        </Text>
                        <View style={[styles.statusBadge, tx.status === 'SUCCESS' || tx.status === 'success' ? styles.statusSuccess : styles.statusFailed]}>
                          <Text style={styles.statusText}>{tx.status || 'SUCCESS'}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  
                  {transactions.length > 3 && (
                    <TouchableOpacity 
                      style={styles.viewAllBtn} 
                      onPress={() => navigation.navigate('TransactionHistory')}
                    >
                      <Text style={[styles.viewAllText, { color: theme.primary }]}>View All History</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </>
        ) : (
          /* Unauthenticated Prompt Card */
          <View style={[styles.sectionCard, dynamicStyles.card, { alignItems: 'center', paddingVertical: 30 }]}>
            <User color={theme.textSecondary} size={54} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyText, dynamicStyles.cardTitle]}>Sign In Required</Text>
            <Text style={[styles.emptySubtext, dynamicStyles.textSecondary, { paddingHorizontal: 20 }]}>
              Please sign in to access your profile, transactions, and subscription plans.
            </Text>
            <TouchableOpacity 
              style={[styles.browseBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.browseBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* APPEARANCE & THEME Card - Compact Segmented Control */}
        <View style={[styles.sectionCard, dynamicStyles.card, styles.compactThemeCard]}>
          <View style={styles.compactThemeHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.compactThemeIconBox, { backgroundColor: theme.isDark ? 'rgba(179, 211, 50, 0.12)' : 'rgba(132, 166, 0, 0.12)' }]}>
                <Palette size={15} color={theme.primary} />
              </View>
              <Text style={[styles.sectionTitle, dynamicStyles.cardTitle, styles.compactThemeTitle]}>
                APPEARANCE
              </Text>
            </View>
            <View style={[styles.compactCurrentTag, { backgroundColor: theme.cardSecondary, borderColor: theme.cardBorder }]}>
              <Text style={[styles.compactCurrentTagText, { color: theme.primary }]}>
                {themeMode === 'light' ? 'Light' : 'Dark'}
              </Text>
            </View>
          </View>

          {/* Compact Dual Segment Pill */}
          <View style={[styles.compactSegmentTrack, { backgroundColor: theme.cardSecondary, borderColor: theme.cardBorder }]}>
            {/* Dark Mode Segment */}
            <TouchableOpacity
              style={[
                styles.compactSegmentPill,
                themeMode === 'dark' && [
                  styles.compactSegmentPillActive,
                  { 
                    backgroundColor: theme.isDark ? '#000000' : '#ffffff', 
                    borderColor: theme.isDark ? theme.primary : 'rgba(0,0,0,0.12)' 
                  }
                ]
              ]}
              onPress={() => setThemeMode('dark')}
              activeOpacity={0.8}
            >
              <Moon 
                size={14} 
                color={themeMode === 'dark' ? '#b3d332' : theme.textMuted} 
                strokeWidth={2.4} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[
                styles.compactSegmentLabel,
                { color: themeMode === 'dark' ? (theme.isDark ? '#ffffff' : '#000000') : theme.textSecondary },
                themeMode === 'dark' && { fontWeight: '800' }
              ]}>
                Dark
              </Text>
              {themeMode === 'dark' && (
                <View style={[styles.compactActiveDot, { backgroundColor: theme.primary }]} />
              )}
            </TouchableOpacity>

            {/* Light Mode Segment */}
            <TouchableOpacity
              style={[
                styles.compactSegmentPill,
                themeMode === 'light' && [
                  styles.compactSegmentPillActive,
                  { 
                    backgroundColor: theme.isDark ? '#111114' : '#ffffff', 
                    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : theme.primary 
                  }
                ]
              ]}
              onPress={() => setThemeMode('light')}
              activeOpacity={0.8}
            >
              <Sun 
                size={14} 
                color={themeMode === 'light' ? '#f59e0b' : theme.textMuted} 
                strokeWidth={2.4} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[
                styles.compactSegmentLabel,
                { color: themeMode === 'light' ? (theme.isDark ? '#ffffff' : '#0f172a') : theme.textSecondary },
                themeMode === 'light' && { fontWeight: '800' }
              ]}>
                Light
              </Text>
              {themeMode === 'light' && (
                <View style={[styles.compactActiveDot, { backgroundColor: '#f59e0b' }]} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* CREATOR & SUBMISSION Card */}
        <View style={[styles.sectionCard, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.cardTitle]}>CREATOR HUB</Text>
          <TouchableOpacity 
            style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
            onPress={() => navigation.navigate('Submission')}
          >
            <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>Creator Submission</Text>
          </TouchableOpacity>
        </View>

        {/* COMPANY Card */}
        <View style={[styles.sectionCard, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.cardTitle]}>COMPANY</Text>
          <TouchableOpacity 
            style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
            onPress={() => navigation.navigate('StaticPage', { title: 'About Us', slug: 'about-us' })}
          >
            <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
            onPress={() => navigation.navigate('Careers')}
          >
            <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>Careers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Contact Us', slug: 'contact-us' })}
          >
            <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Privacy Policy', slug: 'privacy-policy' })}
          >
            <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Terms of Service', slug: 'terms-of-service' })}
          >
            <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Refund Policy', slug: 'refund-policy' })}
          >
            <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>Refund Policy</Text>
          </TouchableOpacity>
        </View>

        {/* SUPPORT & PAGES Card */}
        <View style={[styles.sectionCard, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.cardTitle]}>SUPPORT & PAGES</Text>
          <TouchableOpacity 
            style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
            onPress={() => navigation.navigate('StaticPage', { title: 'FAQ', slug: 'faq' })}
          >
            <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Help Center', slug: 'help-center' })}
          >
            <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>Help Center</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Supported Devices', slug: 'supported-devices' })}
          >
            <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>Supported Devices</Text>
          </TouchableOpacity>
          {customPages.map((page) => (
            <TouchableOpacity 
              key={page._id}
              style={[styles.pageLinkRow, dynamicStyles.pageLinkRow]} 
              onPress={() => navigation.navigate('StaticPage', { title: page.title, slug: page.slug })}
            >
              <Text style={[styles.pageLinkText, dynamicStyles.pageLinkText]}>{page.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut color="#ff4d4d" size={18} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        {/* App Version Badge */}
        <View style={styles.versionBadge}>
          <Text style={[styles.versionText, { color: theme.textMuted }]}>
            Lemo OTT  v{Constants.expoConfig?.version || '1.0.5'}
          </Text>
        </View>

        {/* Padding Bottom for Floating Tab Dock */}
        <View style={{ height: 85 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholderText: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  compactThemeCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  compactThemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  compactThemeIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  compactThemeTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  compactCurrentTag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  compactCurrentTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  compactSegmentTrack: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
    height: 42,
  },
  compactSegmentPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  compactSegmentPillActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  compactSegmentLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  compactActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  planContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
  },
  planExpiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planExpiryText: {
    fontSize: 12,
  },
  emptyTransText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  txPlan: {
    fontSize: 14,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusSuccess: {
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
  },
  statusFailed: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#ff4d4d',
    fontSize: 15,
    fontWeight: '700',
  },
  upgradeBtn: {
    marginTop: 14,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
  pageLinkRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pageLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  browseBtn: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontWeight: '800',
    fontSize: 14,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  profileActionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  editProfileLink: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 16,
  },
  editProfileLinkText: {
    fontWeight: '700',
    fontSize: 12,
  },
  quickCartoonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 16,
  },
  quickCartoonBtnText: {
    fontWeight: '800',
    fontSize: 12,
  },
  versionBadge: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
