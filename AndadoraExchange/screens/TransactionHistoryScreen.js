import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../api/firebase';
import { globalStyles } from '../styles/globalStyles';
import { COLORS, SPACING } from '../utils/constants';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';

const TransactionHistoryScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'gift_card', 'withdrawal', 'referral'

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, filter]);

  const loadTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const transactionsRef = collection(db, 'transactions');
      let q = query(
        transactionsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      // Apply filter
      if (filter !== 'all') {
        q = query(
          transactionsRef,
          where('userId', '==', user.uid),
          where('type', '==', filter),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const transactionsList = [];

      snapshot.forEach(doc => {
        transactionsList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setTransactions(transactionsList);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Failed to load transaction history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadTransactions(true);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'gift_card':
        return '💳';
      case 'withdrawal':
        return '💸';
      case 'referral_bonus':
        return '🎁';
      case 'admin_credit':
        return '💰';
      default:
        return '📄';
    }
  };

  const getTransactionColor = (type, status) => {
    if (status === 'failed' || status === 'rejected') {
      return COLORS.error;
    }
    
    switch (type) {
      case 'gift_card':
      case 'referral_bonus':
      case 'admin_credit':
        return COLORS.success;
      case 'withdrawal':
        return COLORS.error;
      default:
        return COLORS.text;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'failed':
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatAmount = (amount, type) => {
    const prefix = type === 'withdrawal' ? '-' : '+';
    return `${prefix}₦${Math.abs(amount).toLocaleString()}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.seconds ? 
      new Date(timestamp.seconds * 1000) : 
      new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTransactionItem = ({ item }) => (
    <Card style={{ marginVertical: SPACING.xs }}>
      <View style={globalStyles.spaceBetween}>
        <View style={[globalStyles.row, { flex: 1 }]}>
          <Text style={{ fontSize: 24, marginRight: SPACING.sm }}>
            {getTransactionIcon(item.type)}
          </Text>
          
          <View style={{ flex: 1 }}>
            <Text style={[globalStyles.body, { fontWeight: '600' }]}>
              {item.description || item.type.replace('_', ' ').toUpperCase()}
            </Text>
            
            <Text style={[globalStyles.caption, { marginTop: SPACING.xs }]}>
              {formatDate(item.createdAt)}
            </Text>
            
            {item.reference && (
              <Text style={[globalStyles.caption, { marginTop: SPACING.xs }]}>
                Ref: {item.reference}
              </Text>
            )}
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[
            globalStyles.body,
            { 
              fontWeight: 'bold',
              color: getTransactionColor(item.type, item.status)
            }
          ]}>
            {formatAmount(item.amount, item.type)}
          </Text>
          
          <Text style={[
            globalStyles.caption,
            { 
              marginTop: SPACING.xs,
              color: getStatusColor(item.status),
              fontWeight: '600'
            }
          ]}>
            {item.status?.toUpperCase() || 'PENDING'}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderFilterButtons = () => (
    <View style={[globalStyles.row, { marginBottom: SPACING.md, flexWrap: 'wrap' }]}>
      {[
        { key: 'all', label: 'All' },
        { key: 'gift_card', label: 'Gift Cards' },
        { key: 'withdrawal', label: 'Withdrawals' },
        { key: 'referral_bonus', label: 'Referrals' }
      ].map((filterOption) => (
        <TouchableOpacity
          key={filterOption.key}
          style={[
            {
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.sm,
              borderRadius: 20,
              marginRight: SPACING.sm,
              marginBottom: SPACING.sm,
              backgroundColor: filter === filterOption.key ? COLORS.accent : COLORS.surface,
              borderWidth: 1,
              borderColor: filter === filterOption.key ? COLORS.accent : COLORS.border
            }
          ]}
          onPress={() => setFilter(filterOption.key)}
        >
          <Text style={[
            globalStyles.body,
            {
              color: filter === filterOption.key ? COLORS.background : COLORS.text,
              fontSize: 14
            }
          ]}>
            {filterOption.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={globalStyles.centerContainer}>
      <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>📊</Text>
      <Text style={[globalStyles.subtitle, { textAlign: 'center' }]}>
        No Transactions Yet
      </Text>
      <Text style={[globalStyles.body, { textAlign: 'center', marginTop: SPACING.sm }]}>
        Your transaction history will appear here once you start trading gift cards.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.loadingContainer}>
          <Text style={globalStyles.body}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={globalStyles.container}>
        <ScrollView 
          contentContainerStyle={globalStyles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={globalStyles.title}>Transaction History</Text>
          
          {error ? (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError('')}
              showDismiss
            />
          ) : null}

          {renderFilterButtons()}

          {transactions.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;
