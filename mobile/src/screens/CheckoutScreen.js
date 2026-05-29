import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Ticket, Check, CreditCard, ShieldCheck } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';

export default function CheckoutScreen({ route, navigation }) {
  const { planId, planName, price, duration } = route.params;
  const { user, setUser, logout, updateUser } = useContext(AuthContext);

  const numericPrice = parseFloat(price ? price.toString().replace(/[^\d.]/g, '') : '0') || 0;

  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedCouponPercentage, setAppliedCouponPercentage] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  
  // Pricing states
  const [finalAmount, setFinalAmount] = useState(numericPrice);
  const [discountAmount, setDiscountAmount] = useState(0);

  // WebView state for payment redirects (PhonePe)
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [gatewaysRes, couponsRes] = await Promise.all([
          client.get('/payment-gateways'),
          client.get('/coupons')
        ]);
        
        // Filter only active gateways
        const active = (gatewaysRes.data || []).filter(g => g.status === 'Active');
        setGateways(active);
        if (active.length > 0) {
          setSelectedGateway(active[0]);
        }

        // Filter active coupons for the frontend display
        const activeCoupons = (couponsRes.data || []).filter(c => 
          c.status === 'Active' && 
          c.showOnFrontend === 'ON' &&
          (c.usersAllow > c.couponUsed)
        );
        setAvailableCoupons(activeCoupons);
      } catch (error) {
        console.error('Error fetching checkout data:', error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleApplyCoupon = async (codeToApply = null) => {
    const activeCode = (typeof codeToApply === 'string' ? codeToApply : couponCode).trim();
    if (!activeCode) return;
    
    setCouponLoading(true);
    setCouponError('');
    try {
      const response = await client.post('/coupons/validate', {
        couponCode: activeCode
      });

      if (response.data && response.data.valid) {
        const percent = response.data.couponPercentage || 0;
        const discount = Math.round((numericPrice * percent) / 100);
        setDiscountAmount(discount);
        setFinalAmount(numericPrice - discount);
        setAppliedCoupon(activeCode);
        setAppliedCouponPercentage(percent);
        setCouponCode(activeCode);
      } else {
        setCouponError('Invalid coupon code.');
      }
    } catch (error) {
      console.error('Coupon error:', error);
      setCouponError(error.response?.data?.message || 'Failed to validate coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setAppliedCouponPercentage(0);
    setCouponCode('');
    setDiscountAmount(0);
    setFinalAmount(numericPrice);
  };

  const handleCheckout = async () => {
    if (!selectedGateway) {
      alert('Please select a payment gateway.');
      return;
    }

    setPaymentProcessing(true);
    
    // 1. Handlers for Redirect/PhonePe Gateway
    if (selectedGateway.name.toLowerCase().includes('phonepe')) {
      try {
        const response = await client.post('/payment/phonepe/initiate', {
          userId: user.id,
          planId,
          amount: finalAmount,
          couponCode: appliedCoupon || ''
        });

        if (response.data && response.data.redirectUrl) {
          // Open WebView URL to process PhonePe checkout
          setPaymentUrl(response.data.redirectUrl);
        } else {
          alert('Could not initiate PhonePe gateway. Please try again.');
          setPaymentProcessing(false);
        }
      } catch (error) {
        console.error('PhonePe initiation error:', error);
        if (error.response && error.response.status === 401) {
          alert('Your session has expired. Please sign in again.');
          await logout();
          navigation.navigate('Login');
        } else {
          alert(error.response?.data?.message || 'Gateway initiation failed.');
        }
        setPaymentProcessing(false);
      }
    } else {
      // 2. Handlers for Mock/Default gateway
      try {
        const response = await client.post('/payment/mock-success', {
          userId: user.id,
          planId,
          amount: finalAmount,
          couponCode: appliedCoupon || '',
          discountAmount
        });

        if (response.data && response.data.user) {
          // Update local context
          await updateUser({
            subscriptionPlan: response.data.user.subscriptionPlan,
            expiryDate: response.data.user.expiryDate
          });
          alert(`Subscription updated successfully to ${planName}!`);
          navigation.navigate('HomeTab');
        }
      } catch (error) {
        console.error('Mock Checkout failed:', error);
        if (error.response && error.response.status === 401) {
          alert('Your session has expired. Please sign in again.');
          await logout();
          navigation.navigate('Login');
        } else {
          alert('Payment processing failed. Please try again.');
        }
      } finally {
        setPaymentProcessing(false);
      }
    }
  };

  // Monitor WebView navigation states for redirect completions
  const handleWebViewStateChange = (navState) => {
    const { url } = navState;
    console.log('Payment WebView Navigated:', url);

    // If url contains success redirect keywords, capture it
    if (url.includes('/success') || url.includes('/callback/status') || url.includes('payment/success')) {
      setPaymentUrl(null);
      setPaymentProcessing(true); // Keep loading active while fetching updated user
      
      // Fetch updated user from server
      client.get(`/users/${user.id}`).then(async (res) => {
        if (res.data) {
          await updateUser(res.data);
        }
        setPaymentProcessing(false);
        alert(`Subscription purchased successfully!`);
        navigation.navigate('HomeTab');
      }).catch(err => {
        console.error('Error refreshing user details:', err);
        setPaymentProcessing(false);
        alert(`Subscription purchased successfully!`);
        navigation.navigate('HomeTab');
      });
    } else if (url.includes('/failure') || url.includes('payment/fail')) {
      setPaymentUrl(null);
      setPaymentProcessing(false);
      alert('Payment failed or cancelled.');
    }
  };

  if (paymentUrl) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <View style={styles.webHeader}>
          <TouchableOpacity onPress={() => { setPaymentUrl(null); setPaymentProcessing(false); }}>
            <ArrowLeft color="#ffffff" size={24} />
          </TouchableOpacity>
          <Text style={styles.webHeaderTitle}>Complete Payment</Text>
        </View>
        <WebView
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleWebViewStateChange}
          style={{ flex: 1, backgroundColor: '#000000' }}
          containerStyle={{ backgroundColor: '#000000' }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent.description);
            alert('Could not connect to payment gateway. Please check your network or try again.');
            setPaymentUrl(null);
            setPaymentProcessing(false);
          }}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b3d332" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Plan Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Order Summary</Text>
          <View style={styles.planSummaryRow}>
            <View>
              <Text style={styles.planName}>{planName}</Text>
              <Text style={styles.planDuration}>Validity: {duration}</Text>
            </View>
            <Text style={styles.originalPrice}>₹{numericPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Coupons Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Promo Code</Text>
          <View style={styles.couponInputRow}>
            <TextInput
              style={[
                styles.couponInput,
                appliedCoupon ? styles.disabledCouponInput : null
              ]}
              placeholder="Enter coupon code"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              autoCorrect={false}
              value={couponCode}
              onChangeText={setCouponCode}
              editable={!appliedCoupon}
            />
            {appliedCoupon ? (
              <TouchableOpacity 
                style={styles.removeBtn} 
                onPress={handleRemoveCoupon}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.applyBtn} 
                onPress={handleApplyCoupon}
                disabled={couponLoading}
              >
                {couponLoading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.applyBtnText}>Apply</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          {appliedCoupon ? (
            <Text style={styles.couponSuccessText}>
              Success! {appliedCouponPercentage}% discount applied.
            </Text>
          ) : null}
          
          {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}

          {availableCoupons.length > 0 && !appliedCoupon && (
            <View style={styles.availableCouponsWrapper}>
              <Text style={styles.availableCouponsTitle}>Available Coupons</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.couponsScrollContainer}>
                {availableCoupons.map((coupon) => (
                  <TouchableOpacity 
                    key={coupon._id}
                    style={styles.couponCard}
                    onPress={() => handleApplyCoupon(coupon.couponCode)}
                  >
                    <View style={styles.couponDottedBorder}>
                      <Text style={styles.couponCodeText}>{coupon.couponCode}</Text>
                      <Text style={styles.couponDiscountPercent}>{coupon.couponPercentage}% OFF</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Payment Gateways Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Select Payment Option</Text>
          {gateways.length === 0 ? (
            <View style={styles.mockGatewayOption}>
              <CreditCard color="#8e8e93" size={24} />
              <Text style={{ color: '#fff', marginLeft: 12 }}>Mock payment enabled (No gateways configured)</Text>
            </View>
          ) : (
            gateways.map((gw) => (
              <TouchableOpacity
                key={gw._id}
                style={[
                  styles.gatewayOption,
                  selectedGateway?._id === gw._id ? styles.activeGatewayOption : null
                ]}
                onPress={() => setSelectedGateway(gw)}
              >
                <View style={styles.radioOuter}>
                  {selectedGateway?._id === gw._id ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.gatewayName}>{gw.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bill Calculations Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Payment Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billText}>Subtotal</Text>
            <Text style={styles.billValue}>₹ {numericPrice.toFixed(2)}</Text>
          </View>
          {appliedCoupon ? (
            <View style={styles.billRow}>
              <Text style={[styles.billText, { color: '#b3d332' }]}>Discount ({appliedCouponPercentage}%)</Text>
              <Text style={[styles.billValue, { color: '#b3d332', fontWeight: '800' }]}>- ₹ {discountAmount.toFixed(2)}</Text>
            </View>
          ) : null}
          <View style={styles.billRow}>
            <Text style={styles.billText}>Tax</Text>
            <Text style={styles.billValue}>Included</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Total to pay</Text>
            <Text style={styles.totalValue}>₹ {finalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Secure badge */}
        <View style={styles.secureBadge}>
          <ShieldCheck color="#b3d332" size={16} />
          <Text style={styles.secureText}>256-bit Secure SSL Encrypted Payments</Text>
        </View>

        {/* Checkout CTA */}
        <TouchableOpacity 
          style={styles.payBtn} 
          onPress={handleCheckout}
          disabled={paymentProcessing}
        >
          {paymentProcessing ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <Text style={styles.payBtnText}>Proceed to Pay ₹{finalAmount.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
        
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
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
    gap: 16,
  },
  webHeaderTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#121212',
    borderColor: '#1f1f1f',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  planSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  planDuration: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  originalPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#b3d332',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#1a1b1e',
    borderColor: '#2a2c31',
    borderWidth: 1,
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 12,
    fontSize: 14,
    height: 44,
  },
  applyBtn: {
    backgroundColor: '#b3d332',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledCouponInput: {
    backgroundColor: '#0a0a0c',
    color: '#8e8e93',
    borderColor: '#1f1f23',
  },
  removeBtn: {
    backgroundColor: '#ff453a',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  couponSuccessText: {
    color: '#b3d332',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  couponErrorText: {
    color: '#ff4d4d',
    fontSize: 12,
    marginTop: 6,
  },
  availableCouponsWrapper: {
    marginTop: 16,
  },
  availableCouponsTitle: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  couponsScrollContainer: {
    paddingVertical: 2,
    gap: 10,
  },
  couponCard: {
    backgroundColor: '#1a1b1e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  couponDottedBorder: {
    borderWidth: 1.5,
    borderColor: '#b3d332',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponCodeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  couponDiscountPercent: {
    color: '#b3d332',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  mockGatewayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  gatewayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1b1e',
    borderColor: '#2a2c31',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  activeGatewayOption: {
    borderColor: '#b3d332',
    backgroundColor: 'rgba(179, 211, 50, 0.05)',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8e8e93',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#b3d332',
  },
  gatewayName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billText: {
    color: '#8e8e93',
    fontSize: 14,
  },
  billValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#1f1f1f',
    marginVertical: 10,
  },
  totalLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    color: '#b3d332',
    fontSize: 18,
    fontWeight: '900',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  secureText: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '600',
  },
  payBtn: {
    backgroundColor: '#b3d332',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#b3d332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  payBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
});
