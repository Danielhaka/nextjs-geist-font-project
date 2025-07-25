import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../api/firebase';
import { globalStyles } from '../styles/globalStyles';
import { COLORS, SPACING } from '../utils/constants';
import Button from '../components/Button';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';

const AdminDashboardScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('submissions');
  const [giftCardSubmissions, setGiftCardSubmissions] = useState([]);
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    pendingSubmissions: 0,
    pendingKyc: 0,
    pendingWithdrawals: 0,
    totalUsers: 0
  });

  const { user, userProfile } = useAuth();

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin' || userProfile?.isAdmin === true;

  useEffect(() => {
    if (user && isAdmin) {
      loadDashboardData();
    }
  }, [user, isAdmin]);

  const loadDashboardData = () => {
    try {
      setLoading(true);
      
      // Load gift card submissions
      const submissionsRef = collection(db, 'giftCardSubmissions');
      const submissionsQuery = query(
        submissionsRef,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
        const submissions = [];
        snapshot.forEach(doc => {
          submissions.push({ id: doc.id, ...doc.data() });
        });
        setGiftCardSubmissions(submissions);
      });

      // Load KYC submissions
      const kycRef = collection(db, 'kycSubmissions');
      const kycQuery = query(
        kycRef,
        where('status', '==', 'pending'),
        orderBy('submittedAt', 'desc')
      );

      const unsubscribeKyc = onSnapshot(kycQuery, (snapshot) => {
        const kyc = [];
        snapshot.forEach(doc => {
          kyc.push({ id: doc.id, ...doc.data() });
        });
        setKycSubmissions(kyc);
      });

      // Load withdrawal requests
      const withdrawalsRef = collection(db, 'withdrawalRequests');
      const withdrawalsQuery = query(
        withdrawalsRef,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
        const withdrawals = [];
        snapshot.forEach(doc => {
          withdrawals.push({ id: doc.id, ...doc.data() });
        });
        setWithdrawalRequests(withdrawals);
      });

      loadStats();
      setLoading(false);

      return () => {
        unsubscribeSubmissions();
        unsubscribeKyc();
        unsubscribeWithdrawals();
      };
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get pending submissions count
      const submissionsSnapshot = await getDocs(
        query(collection(db, 'giftCardSubmissions'), where('status', '==', 'pending'))
      );
      
      // Get pending KYC count
      const kycSnapshot = await getDocs(
        query(collection(db, 'kycSubmissions'), where('status', '==', 'pending'))
      );
      
      // Get pending withdrawals count
      const withdrawalsSnapshot = await getDocs(
        query(collection(db, 'withdrawalRequests'), where('status', '==', 'pending'))
      );
      
      // Get total users count
      const usersSnapshot = await getDocs(collection(db, 'users'));

      setStats({
        pendingSubmissions: submissionsSnapshot.size,
        pendingKyc: kycSnapshot.size,
        pendingWithdrawals: withdrawalsSnapshot.size,
        totalUsers: usersSnapshot.size
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    setRefreshing(false);
  };

  const handleGiftCardAction = async (submissionId, action, amount = 0) => {
    try {
      const submissionRef = doc(db, 'giftCardSubmissions', submissionId);
      
      const updateData = {
        status: action,
        reviewedAt: new Date(),
        reviewedBy: user.uid
      };

      if (action === 'approved' && amount > 0) {
        updateData.approvedAmount = amount;
        // TODO: Credit user wallet
      }

      await updateDoc(submissionRef, updateData);
      
      Alert.alert('Success', `Gift card submission ${action} successfully`);
    } catch (error) {
      console.error('Error updating submission:', error);
      setError(`Failed to ${action} submission`);
    }
  };

  const handleKycAction = async (kycId, action, reason = null) => {
    try {
      const kycRef = doc(db, 'kycSubmissions', kycId);
      
      const updateData = {
        status: action,
        reviewedAt: new Date(),
        reviewedBy: user.uid
      };

      if (action === 'rejected' && reason) {
        updateData.rejectionReason = reason;
      }

      await updateDoc(kycRef, updateData);
      
      // Update user profile
      if (action === 'approved') {
        const userRef = doc(db, 'users', kycId);
        await updateDoc(userRef, { kycStatus: 'approved' });
      }
      
      Alert.alert('Success', `KYC submission ${action} successfully`);
    } catch (error) {
      console.error('Error updating KYC:', error);
      setError(`Failed to ${action} KYC submission`);
    }
  };

  const renderStatsCards = () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.md }}>
      <Card style={{ flex: 1, margin: SPACING.xs, backgroundColor: COLORS.accent }}>
        <Text style={[globalStyles.body, { color: COLORS.background, textAlign: 'center' }]}>
          Pending Submissions
        </Text>
        <Text style={[globalStyles.title, { color: COLORS.background, textAlign: 'center' }]}>
          {stats.pendingSubmissions}
        </Text>
      </Card>
      
      <Card style={{ flex: 1, margin: SPACING.xs, backgroundColor: COLORS.warning }}>
        <Text style={[globalStyles.body, { color: COLORS.background, textAlign: 'center' }]}>
          Pending KYC
        </Text>
        <Text style={[globalStyles.title, { color: COLORS.background, textAlign: 'center' }]}>
          {stats.pendingKyc}
        </Text>
      </Card>
      
      <Card style={{ flex: 1, margin: SPACING.xs, backgroundColor: COLORS.success }}>
        <Text style={[globalStyles.body, { color: COLORS.background, textAlign: 'center' }]}>
          Total Users
        </Text>
        <Text style={[globalStyles.title, { color: COLORS.background, textAlign: 'center' }]}>
          {stats.totalUsers}
        </Text>
      </Card>
    </View>
  );

  const renderTabButtons = () => (
    <View style={[globalStyles.row, { marginBottom: SPACING.md }]}>
      {[
        { key: 'submissions', label: 'Gift Cards' },
        { key: 'kyc', label: 'KYC' },
        { key: 'withdrawals', label: 'Withdrawals' }
      ].map((tab) => (
        <Button
          key={tab.key}
          title={tab.label}
          onPress={() => setActiveTab(tab.key)}
          variant={activeTab === tab.key ? 'primary' : 'outline'}
          style={{ 
            flex: 1, 
            marginHorizontal: SPACING.xs,
            minHeight: 'auto'
          }}
          textStyle={{ fontSize: 14 }}
        />
      ))}
    </View>
  );

  const renderGiftCardSubmission = ({ item }) => (
    <Card style={globalStyles.adminCard}>
      <View style={[globalStyles.spaceBetween, { marginBottom: SPACING.sm }]}>
        <Text style={[globalStyles.subtitle, { fontSize: 16 }]}>
          {item.cardType} - ${item.cardValue}
        </Text>
        <Text style={globalStyles.pendingStatus}>PENDING</Text>
      </View>
      
      <Text style={globalStyles.body}>User: {item.userEmail}</Text>
      <Text style={globalStyles.caption}>
        Submitted: {new Date(item.createdAt.seconds * 1000).toLocaleString()}
      </Text>
      
      <View style={[globalStyles.row, { marginTop: SPACING.md }]}>
        <Button
          title="Approve"
          onPress={() => handleGiftCardAction(item.id, 'approved', item.calculatedAmount)}
          style={{ flex: 1, marginRight: SPACING.sm, backgroundColor: COLORS.success }}
        />
        <Button
          title="Reject"
          onPress={() => handleGiftCardAction(item.id, 'rejected')}
          style={{ flex: 1, marginLeft: SPACING.sm, backgroundColor: COLORS.error }}
        />
      </View>
    </Card>
  );

  const renderKycSubmission = ({ item }) => (
    <Card style={globalStyles.adminCard}>
      <View style={[globalStyles.spaceBetween, { marginBottom: SPACING.sm }]}>
        <Text style={[globalStyles.subtitle, { fontSize: 16 }]}>
          {item.idType?.toUpperCase()} - {item.idNumber}
        </Text>
        <Text style={globalStyles.pendingStatus}>PENDING</Text>
      </View>
      
      <Text style={globalStyles.body}>User: {item.userEmail}</Text>
      <Text style={globalStyles.caption}>
        Submitted: {new Date(item.submittedAt.seconds * 1000).toLocaleString()}
      </Text>
      
      <View style={[globalStyles.row, { marginTop: SPACING.md }]}>
        <Button
          title="Approve"
          onPress={() => handleKycAction(item.id, 'approved')}
          style={{ flex: 1, marginRight: SPACING.sm, backgroundColor: COLORS.success }}
        />
        <Button
          title="Reject"
          onPress={() => handleKycAction(item.id, 'rejected', 'Document quality issues')}
          style={{ flex: 1, marginLeft: SPACING.sm, backgroundColor: COLORS.error }}
        />
      </View>
    </Card>
  );

  const renderWithdrawalRequest = ({ item }) => (
    <Card style={globalStyles.adminCard}>
      <View style={[globalStyles.spaceBetween, { marginBottom: SPACING.sm }]}>
        <Text style={[globalStyles.subtitle, { fontSize: 16 }]}>
          ₦{item.amount?.toLocaleString()}
        </Text>
        <Text style={globalStyles.pendingStatus}>PENDING</Text>
      </View>
      
      <Text style={globalStyles.body}>User: {item.userEmail}</Text>
      <Text style={globalStyles.body}>Bank: {item.bankName}</Text>
      <Text style={globalStyles.body}>Account: {item.accountNumber}</Text>
      <Text style={globalStyles.caption}>
        Requested: {new Date(item.createdAt.seconds * 1000).toLocaleString()}
      </Text>
      
      <View style={[globalStyles.row, { marginTop: SPACING.md }]}>
        <Button
          title="Process"
          onPress={() => navigation.navigate('ProcessWithdrawal', { withdrawal: item })}
          style={{ flex: 1, backgroundColor: COLORS.success }}
        />
      </View>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'submissions':
        return (
          <FlatList
            data={giftCardSubmissions}
            renderItem={renderGiftCardSubmission}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={[globalStyles.body, { textAlign: 'center', marginTop: SPACING.lg }]}>
                No pending gift card submissions
              </Text>
            }
          />
        );
      case 'kyc':
        return (
          <FlatList
            data={kycSubmissions}
            renderItem={renderKycSubmission}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={[globalStyles.body, { textAlign: 'center', marginTop: SPACING.lg }]}>
                No pending KYC submissions
              </Text>
            }
          />
        );
      case 'withdrawals':
        return (
          <FlatList
            data={withdrawalRequests}
            renderItem={renderWithdrawalRequest}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={[globalStyles.body, { textAlign: 'center', marginTop: SPACING.lg }]}>
                No pending withdrawal requests
              </Text>
            }
          />
        );
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.centerContainer}>
          <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🚫</Text>
          <Text style={globalStyles.title}>Access Denied</Text>
          <Text style={[globalStyles.body, { textAlign: 'center' }]}>
            You don't have permission to access the admin dashboard.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.loadingContainer}>
          <Text style={globalStyles.body}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView 
        contentContainerStyle={globalStyles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={globalStyles.title}>Admin Dashboard</Text>
        
        {error ? (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError('')}
            showDismiss
          />
        ) : null}

        {renderStatsCards()}

        <View style={[globalStyles.row, { marginBottom: SPACING.md }]}>
          <Button
            title="Rate Management"
            onPress={() => navigation.navigate('RateManagement')}
            variant="outline"
            style={{ flex: 1, marginRight: SPACING.sm }}
          />
          <Button
            title="User Management"
            onPress={() => navigation.navigate('UserManagement')}
            variant="outline"
            style={{ flex: 1, marginLeft: SPACING.sm }}
          />
        </View>

        {renderTabButtons()}
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboardScreen;
