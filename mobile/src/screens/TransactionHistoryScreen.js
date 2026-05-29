import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard, Calendar, ShieldCheck, Receipt } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';

export default function TransactionHistoryScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const res = await client.get(`/user/transactions/${user.email}`);
      setTransactions(res.data || []);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const calculateExpiryDate = (startDateStr, durationStr) => {
    if (!startDateStr) return 'N/A';
    const date = new Date(startDateStr);
    const duration = durationStr || '1 Month(s)';
    const cleanDuration = duration.toLowerCase();
    const durationNum = parseInt(cleanDuration) || 1;

    if (cleanDuration.includes('month')) {
      date.setMonth(date.getMonth() + durationNum);
    } else if (cleanDuration.includes('year')) {
      date.setFullYear(date.getFullYear() + durationNum);
    } else if (cleanDuration.includes('day')) {
      date.setDate(date.getDate() + durationNum);
    } else {
      date.setDate(date.getDate() + 30);
    }
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderTxItem = ({ item }) => {
    const isSuccess = item.status === 'SUCCESS' || item.status === 'success';

    return (
      <View style={styles.txCard}>
        <View style={styles.txHeader}>
          <Receipt color="#b3d332" size={20} />
          <Text style={styles.txPlan}>{item.planName || item.plan || 'Premium Subscription'}</Text>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.txDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{item.paymentId || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time:</Text>
            <Text style={styles.detailValue}>{formatDate(item.createdAt || item.paymentDate || item.date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expiry Date:</Text>
            <Text style={styles.detailValue}>
              {calculateExpiryDate(item.createdAt || item.paymentDate || item.date, item.planId?.duration)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Gateway:</Text>
            <Text style={styles.detailValue}>{item.gateway || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[styles.statusBadge, isSuccess ? styles.statusSuccess : styles.statusFailed]}>
              <Text style={styles.statusText}>{item.status || 'SUCCESS'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>{item.currency || 'INR'} {item.amount}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing & Invoices</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b3d332" />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CreditCard color="#444" size={54} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>No Transactions Found</Text>
          <Text style={styles.emptySubtext}>Any subscription plan purchase or billing events will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={renderTxItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#121212',
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  txCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
  },
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  txPlan: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: '#1f1f1f',
    marginBottom: 12,
  },
  txDetails: {
    gap: 8,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#8e8e93',
    fontSize: 12,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '60%',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusSuccess: {
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
  },
  statusFailed: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  amountContainer: {
    backgroundColor: '#1a1b1e',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '700',
  },
  amountValue: {
    color: '#b3d332',
    fontSize: 16,
    fontWeight: '900',
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
    lineHeight: 18,
  },
});
