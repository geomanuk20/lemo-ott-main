import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';
import CustomAlert from '../components/CustomAlert';
import OfflineView from '../components/OfflineView';

const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

export default function SubscriptionScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [plans, setPlans] = useState([]);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title, message, buttons = []) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons
    });
  };

  const fetchPlans = async () => {
    try {
      const res = await client.get('/subscription-plans');
      // Sort plans by price (free/lowest first)
      const sorted = (res.data || []).sort((a, b) => a.price - b.price);
      setPlans(sorted);
      setIsOffline(false);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  const handleSubscribe = async (plan) => {
    if (!user || (!user.id && !user._id)) {
      showAlert('Sign In Required', 'Please sign in to subscribe.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login')
        }
      ]);
      return;
    }
    const cleanPriceStr = plan.price ? plan.price.toString().replace(/[^\d.]/g, '') : '0';
    const priceVal = parseFloat(cleanPriceStr) || 0;

    if (priceVal === 0) {
      // Free plan checkout
      setLoading(true);
      try {
        const response = await client.post('/payment/free-success', {
          userId: user.id || user._id,
          planId: plan._id
        });
        if (response.data && response.data.user) {
          const updated = { ...user, ...response.data.user };
          setUser(updated);
          showAlert('Success', 'You are now on the Free Plan!', [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]);
        }
      } catch (error) {
        console.error('Free checkout error:', error);
        showAlert('Error', error.response?.data?.message || 'Failed to activate free plan');
      } finally {
        setLoading(false);
      }
    } else {
      navigation.navigate('Checkout', { 
        plan,
        planId: plan._id,
        planName: plan.planName,
        price: plan.price,
        duration: plan.duration
      });
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isExpired = user?.expiryDate && user.expiryDate < todayStr;
  const userActivePlanName = !isExpired ? user?.subscriptionPlan : null;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isOffline && plans.length === 0) {
    return (
      <OfflineView
        onRetry={async () => {
          setLoading(true);
          await fetchPlans();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {plans.length === 0 ? (
          <Text style={styles.emptyText}>No subscription plans available right now.</Text>
        ) : (
          plans.map((plan) => {
            // Strip any non-numeric/dot characters to get clean numeric value
            const cleanPriceStr = plan.price ? plan.price.toString().replace(/[^\d.]/g, '') : '0';
            const priceVal = parseFloat(cleanPriceStr) || 0;
            const isFree = priceVal === 0;
            const isUserActivePlan = Boolean(!isExpired && user?.subscriptionPlan === plan.planName);
            const isDisabled = isUserActivePlan;

            return (
              <View
                key={plan._id}
                style={[
                  styles.planCard,
                  isUserActivePlan && styles.activePlanCard
                ]}
              >
                {isUserActivePlan && (
                  <View style={styles.currentPlanLabel}>
                    <Text style={styles.currentPlanLabelText}>ACTIVE PLAN</Text>
                  </View>
                )}
                
                <Text style={styles.planName}>{plan.planName}</Text>
                
                <View style={styles.priceRow}>
                  <Text style={styles.priceSymbol}>₹</Text>
                  <Text style={styles.price}>{priceVal.toFixed(isFree ? 0 : 2)}</Text>
                  <Text style={styles.duration}>/{plan.duration || 'Month'}</Text>
                </View>

                {plan.description ? (
                  <Text style={styles.planDesc}>{stripHtml(plan.description)}</Text>
                ) : null}

                {/* Features divider */}
                <View style={styles.divider} />

                {/* Features List */}
                <View style={styles.featuresList}>
                  <View style={styles.featureRow}>
                    <Check color={theme.primary} size={16} strokeWidth={3} />
                    <Text style={styles.featureText}>
                      {plan.ads === 'ON' ? 'Contains advertisements' : 'Ad-free streaming content'}
                    </Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Check color={theme.primary} size={16} strokeWidth={3} />
                    <Text style={styles.featureText}>{plan.streamingQuality || 'HD'} video quality</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Check color={theme.primary} size={16} strokeWidth={3} />
                    <Text style={styles.featureText}>Watch on any device (Phone/TV/Web)</Text>
                  </View>
                  {plan.deviceLimit ? (
                    <View style={styles.featureRow}>
                      <Check color={theme.primary} size={16} strokeWidth={3} />
                      <Text style={styles.featureText}>Simultaneous screens: {plan.deviceLimit}</Text>
                    </View>
                  ) : null}
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                  style={[
                    styles.subscribeBtn,
                    isFree ? styles.freeBtn : styles.paidBtn,
                    isDisabled ? styles.disabledBtn : null
                  ]}
                  onPress={() => handleSubscribe(plan)}
                  disabled={Boolean(isDisabled)}
                >
                  <Text style={[styles.subscribeBtnText, isFree ? styles.freeText : styles.paidText]}>
                    {isUserActivePlan ? 'Current Plan' : isFree ? 'Select Free Plan' : user?.subscriptionPlan ? 'Upgrade Plan' : 'Subscribe Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.text,
  },
  scrollContent: {
    padding: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(179, 211, 50, 0.1)',
    borderColor: 'rgba(179, 211, 50, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 24,
  },
  badgeText: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: theme.cardBackground,
    borderColor: theme.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    position: 'relative',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  activePlanCard: {
    borderColor: theme.primary,
    borderWidth: 1.5,
    backgroundColor: theme.cardSecondary,
  },
  currentPlanLabel: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentPlanLabelText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  planName: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.text,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceSymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
    marginRight: 2,
  },
  price: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.text,
  },
  duration: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  planDesc: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.cardBorder,
    marginVertical: 16,
  },
  featuresList: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  subscribeBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeBtn: {
    backgroundColor: theme.cardSecondary,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  paidBtn: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledBtn: {
    backgroundColor: theme.cardSecondary,
    borderColor: theme.cardBorder,
  },
  subscribeBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  freeText: {
    color: theme.text,
  },
  paidText: {
    color: '#000000',
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
