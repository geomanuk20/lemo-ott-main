import React, { useState, useEffect, useContext } from 'react';
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
import { ArrowLeft, Check, Sparkles } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';

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
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState([]);

  const fetchPlans = async () => {
    try {
      const res = await client.get('/subscription-plans');
      // Sort plans by price (free/lowest first)
      const sorted = (res.data || []).sort((a, b) => a.price - b.price);
      setPlans(sorted);
    } catch (error) {
      console.error('Error fetching plans:', error);
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
    if (!user || !user.id) {
      alert('Please sign in to subscribe.');
      navigation.navigate('Login');
      return;
    }
    const cleanPriceStr = plan.price ? plan.price.toString().replace(/[^\d.]/g, '') : '0';
    const priceVal = parseFloat(cleanPriceStr) || 0;

    if (priceVal === 0) {
      // Free plan checkout
      setLoading(true);
      try {
        const response = await client.post('/payment/free-success', {
          userId: user.id,
          planId: plan._id
        });
        if (response.data && response.data.user) {
          // Update profile plan info in context
          const updatedUser = { 
            ...user, 
            subscriptionPlan: response.data.user.subscriptionPlan, 
            expiryDate: response.data.user.expiryDate 
          };
          setUser(updatedUser);
          alert('Subscribed successfully to the Free plan!');
          navigation.navigate('HomeTab');
        }
      } catch (error) {
        console.error('Error subscribing to free plan:', error);
        alert(error.response?.data?.message || 'Free subscription failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Paid plan -> go to Checkout Screen
      navigation.navigate('Checkout', {
        planId: plan._id,
        planName: plan.planName,
        price: priceVal,
        duration: plan.duration
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b3d332" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#b3d332" />}
      >
        <View style={styles.badgeContainer}>
          <Sparkles color="#b3d332" size={20} fill="#b3d332" />
          <Text style={styles.badgeText}>Upgrade for unlimited streaming</Text>
        </View>

        {plans.length === 0 ? (
          <Text style={styles.emptyText}>No subscription plans available at the moment.</Text>
        ) : (
          plans.map((plan) => {
            // Strip any non-numeric/dot characters to get clean numeric value
            const cleanPriceStr = plan.price ? plan.price.toString().replace(/[^\d.]/g, '') : '0';
            const priceVal = parseFloat(cleanPriceStr) || 0;
            const isFree = priceVal === 0;
            const isUserActivePlan = user?.subscriptionPlan === plan.planName;

            return (
              <View key={plan._id} style={[styles.planCard, isUserActivePlan ? styles.activePlanCard : null]}>
                {isUserActivePlan && (
                  <View style={styles.currentPlanLabel}>
                    <Text style={styles.currentPlanLabelText}>ACTIVE NOW</Text>
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
                    <Check color="#b3d332" size={16} strokeWidth={3} />
                    <Text style={styles.featureText}>Ad-free streaming content</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Check color="#b3d332" size={16} strokeWidth={3} />
                    <Text style={styles.featureText}>Full HD 1080p video quality</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Check color="#b3d332" size={16} strokeWidth={3} />
                    <Text style={styles.featureText}>Watch on any device (Phone/TV/Web)</Text>
                  </View>
                  {plan.deviceLimit ? (
                    <View style={styles.featureRow}>
                      <Check color="#b3d332" size={16} strokeWidth={3} />
                      <Text style={styles.featureText}>Simultaneous screens: {plan.deviceLimit}</Text>
                    </View>
                  ) : null}
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                  style={[
                    styles.subscribeBtn,
                    isFree ? styles.freeBtn : styles.paidBtn,
                    isUserActivePlan ? styles.disabledBtn : null
                  ]}
                  onPress={() => handleSubscribe(plan)}
                  disabled={isUserActivePlan}
                >
                  <Text style={[styles.subscribeBtnText, isFree ? styles.freeText : styles.paidText]}>
                    {isUserActivePlan ? 'Current Plan' : isFree ? 'Select Free Plan' : 'Subscribe Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
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
    color: '#b3d332',
    fontSize: 13,
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: '#121212',
    borderColor: '#1f1f1f',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    position: 'relative',
  },
  activePlanCard: {
    borderColor: '#b3d332',
    borderWidth: 1.5,
    backgroundColor: '#161712',
  },
  currentPlanLabel: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#b3d332',
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
    color: '#ffffff',
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
    color: '#ffffff',
    marginRight: 2,
  },
  price: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
  },
  duration: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600',
  },
  planDesc: {
    fontSize: 13,
    color: '#8e8e93',
    lineHeight: 18,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#1f1f1f',
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
    color: '#e5e5ea',
    fontSize: 13,
  },
  subscribeBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeBtn: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2a2c31',
  },
  paidBtn: {
    backgroundColor: '#b3d332',
    shadowColor: '#b3d332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledBtn: {
    backgroundColor: '#2a2c31',
    borderColor: '#2a2c31',
  },
  subscribeBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  freeText: {
    color: '#ffffff',
  },
  paidText: {
    color: '#000000',
  },
  emptyText: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
