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
import { User, Mail, CreditCard, LogOut, Calendar } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { formatImageUrl } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';

export default function ProfileScreen({ navigation }) {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [userDetails, setUserDetails] = useState(user);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [settings, setSettings] = useState(null);

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
    const fetchGeneralSettings = async () => {
      try {
        const res = await client.get('/general-settings');
        setSettings(res.data);
      } catch (err) {
        console.warn('Error fetching general settings on ProfileScreen:', err);
      }
    };
    fetchGeneralSettings();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b3d332" />
      </View>
    );
  }

  const avatarUrl = userDetails?.profileImage ? formatImageUrl(userDetails.profileImage) : null;
  // Use correct field names from MongoDB User schema
  const activePlan = userDetails?.subscriptionPlan || userDetails?.activePlan || 'Basic Plan';
  const planExpiry = userDetails?.expiryDate || userDetails?.planExpiry
    ? formatDate(userDetails?.expiryDate || userDetails?.planExpiry)
    : 'N/A';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#b3d332" />
          ) : undefined
        }
        contentContainerStyle={styles.scrollContent}
      >
        {isAuthenticated ? (
          <>
            {/* User Card */}
            <View style={styles.profileCard}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>{getInitials(userDetails?.name)}</Text>
                </View>
              )}
              <Text style={styles.profileName}>{userDetails?.name || 'User Name'}</Text>
              
              <View style={styles.infoRow}>
                <Mail color="#8e8e93" size={16} />
                <Text style={styles.infoText}>{userDetails?.email}</Text>
              </View>

              <TouchableOpacity 
                style={styles.editProfileLink} 
                onPress={() => navigation.navigate('EditProfile', { userDetails })}
              >
                <Text style={styles.editProfileLinkText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Subscription Info Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Subscription Status</Text>
              <View style={styles.planContainer}>
                <View style={styles.planHeader}>
                  <CreditCard color="#b3d332" size={24} />
                  <Text style={styles.planName}>{activePlan}</Text>
                </View>
                <View style={styles.planExpiryRow}>
                  <Calendar color="#8e8e93" size={14} />
                  <Text style={styles.planExpiryText}>Expires: {planExpiry}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.upgradeBtn}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <Text style={styles.upgradeBtnText}>Upgrade / Change Plan</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Transaction History Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Payment History</Text>
              </View>
              {transactions.length === 0 ? (
                <Text style={styles.emptyTransText}>No payment history found.</Text>
              ) : (
                <>
                  {transactions.slice(0, 3).map((tx) => (
                    <View key={tx._id} style={styles.txRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.txPlan}>{tx.planName || tx.plan || 'Premium Subscription'}</Text>
                        <Text style={styles.txDate}>{formatDate(tx.createdAt || tx.paymentDate || tx.date)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.txAmount}>
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
                      <Text style={styles.viewAllText}>View All History</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </>
        ) : (
          /* Unauthenticated Prompt Card */
          <View style={[styles.sectionCard, { alignItems: 'center', paddingVertical: 30 }]}>
            <User color="#444" size={54} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>Sign In Required</Text>
            <Text style={[styles.emptySubtext, { paddingHorizontal: 20 }]}>
              Please sign in to access your profile, transactions, and subscription plans.
            </Text>
            <TouchableOpacity 
              style={styles.browseBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.browseBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* COMPANY Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>COMPANY</Text>
          <TouchableOpacity 
            style={styles.pageLinkRow} 
            onPress={() => navigation.navigate('StaticPage', { title: 'About Us', slug: 'about-us' })}
          >
            <Text style={styles.pageLinkText}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.pageLinkRow} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Contact Us', slug: 'contact-us' })}
          >
            <Text style={styles.pageLinkText}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.pageLinkRow} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Privacy Policy', slug: 'privacy-policy' })}
          >
            <Text style={styles.pageLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.pageLinkRow} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Terms of Service', slug: 'terms-of-service' })}
          >
            <Text style={styles.pageLinkText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.pageLinkRow} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Refund Policy', slug: 'refund-policy' })}
          >
            <Text style={styles.pageLinkText}>Refund Policy</Text>
          </TouchableOpacity>
        </View>



        {/* SUPPORT & PAGES Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SUPPORT & PAGES</Text>
          <TouchableOpacity 
            style={styles.pageLinkRow} 
            onPress={() => navigation.navigate('StaticPage', { title: 'FAQ', slug: 'faq' })}
          >
            <Text style={styles.pageLinkText}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.pageLinkRow} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Help Center', slug: 'help-center' })}
          >
            <Text style={styles.pageLinkText}>Help Center</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.pageLinkRow} 
            onPress={() => navigation.navigate('StaticPage', { title: 'Supported Devices', slug: 'supported-devices' })}
          >
            <Text style={styles.pageLinkText}>Supported Devices</Text>
          </TouchableOpacity>
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
          <Text style={styles.versionText}>
            Lemo OTT  v{Constants.expoConfig?.version || '1.0.5'}
          </Text>
        </View>

        {/* Padding Bottom */}
        <View style={{ height: 20 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    backgroundColor: '#1c1c1e',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#b3d332',
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
    color: '#ffffff',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#8e8e93',
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
  },
  planContainer: {
    backgroundColor: '#1a1b1e',
    borderColor: '#2a2c31',
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  planExpiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planExpiryText: {
    color: '#8e8e93',
    fontSize: 12,
  },
  emptyTransText: {
    color: '#8e8e93',
    fontSize: 13,
    fontStyle: 'italic',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
    paddingVertical: 12,
  },
  txPlan: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  txDate: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    color: '#ffffff',
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
    backgroundColor: '#b3d332',
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
    borderBottomColor: '#1f1f1f',
  },
  pageLinkText: {
    color: '#e5e5ea',
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
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#8e8e93',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  browseBtn: {
    backgroundColor: '#b3d332',
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
    color: '#b3d332',
    fontWeight: '800',
    fontSize: 14,
  },
  editProfileLink: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
  },
  editProfileLinkText: {
    color: '#b3d332',
    fontWeight: '700',
    fontSize: 12,
  },
  versionBadge: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  versionText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
