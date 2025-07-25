import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../api/firebase';
import { globalStyles } from '../styles/globalStyles';
import { COLORS, SPACING, LOYALTY_TIERS } from '../utils/constants';
import Button from '../components/Button';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';

const ProfileScreen = ({ navigation }) => {
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadReferralStats();
    }
  }, [user]);

  const loadReferralStats = async () => {
    try {
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, where('referrerId', '==', user.uid));
      const snapshot = await getDocs(q);

      let totalReferrals = 0;
      let pendingReferrals = 0;
      let completedReferrals = 0;
      let totalEarnings = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        totalReferrals++;
        
        if (data.status === 'pending') {
          pendingReferrals++;
        } else if (data.status === 'completed') {
          completedReferrals++;
          totalEarnings += data.bonusAmount || 0;
        }
      });

      setReferralStats({
        totalReferrals,
        pendingReferrals,
        completedReferrals,
        totalEarnings
      });
    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const result = await logout();
            if (!result.success) {
              setError(result.error);
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  const shareReferralCode = async () => {
    try {
      const referralMessage = `Join me on AndadoraExchange and start trading gift cards! Use my referral code: ${userProfile?.referralCode} to get a $5 bonus after completing KYC verification. Download the app now!`;
      
      await Share.share({
        message: referralMessage,
        title: 'Join AndadoraExchange'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share referral code');
    }
  };

  const copyReferralCode = () => {
    // TODO: Implement clipboard copy
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const getTierInfo = () => {
    const currentTier = userProfile?.loyaltyTier || 'BRONZE';
    return LOYALTY_TIERS[currentTier];
  };

  const getNextTierInfo = () => {
    const currentTier = userProfile?.loyaltyTier || 'BRONZE';
    const transactionCount = userProfile?.transactionCount || 0;
    
    if (currentTier === 'BRONZE' && transactionCount < 10) {
      return { tier: 'SILVER', needed: 10 - transactionCount };
    } else if (currentTier === 'SILVER' && transactionCount < 50) {
      return { tier: 'GOLD', needed: 50 - transactionCount };
    }
    return null;
  };

  const renderWalletCard = () => (
    <Card style={{ backgroundColor: COLORS.accent }}>
      <Text style={[globalStyles.subtitle, { color: COLORS.background, textAlign: 'center' }]}>
        Wallet Balance
      </Text>
      <Text style={[globalStyles.walletBalance, { color: COLORS.background }]}>
        ₦{(userProfile?.walletBalance || 0).toLocaleString()}
      </Text>
      
      <View style={[globalStyles.row, { justifyContent: 'space-around', marginTop: SPACING.md }]}>
        <Button
          title="Withdraw"
          onPress={() => navigation.navigate('Withdraw')}
          variant="outline"
          style={{ 
            flex: 1, 
            marginRight: SPACING.sm,
            borderColor: COLORS.background
          }}
          textStyle={{ color: COLORS.background }}
        />
        <Button
          title="History"
          onPress={() => navigation.navigate('TransactionHistory')}
          variant="outline"
          style={{ 
            flex: 1, 
            marginLeft: SPACING.sm,
            borderColor: COLORS.background
          }}
          textStyle={{ color: COLORS.background }}
        />
      </View>
    </Card>
  );

  const renderLoyaltyCard = () => {
    const tierInfo = getTierInfo();
    const nextTier = getNextTierInfo();

    return (
      <Card>
        <Text style={globalStyles.subtitle}>Loyalty Tier</Text>
        
        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.sm }]}>
          <Text style={globalStyles.body}>Current Tier:</Text>
          <View style={[
            globalStyles.tierBadge,
            tierInfo.name === 'Bronze' ? globalStyles.bronzeTier :
            tierInfo.name === 'Silver' ? globalStyles.silverTier :
            globalStyles.goldTier
          ]}>
            <Text style={[
              globalStyles.tierBadge,
              { color: tierInfo.name === 'Silver' ? COLORS.text : COLORS.background }
            ]}>
              {tierInfo.name}
            </Text>
          </View>
        </View>

        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={globalStyles.body}>Bonus Rate:</Text>
          <Text style={[globalStyles.body, { fontWeight: 'bold' }]}>
            {((tierInfo.bonusRate - 1) * 100).toFixed(0)}% extra
          </Text>
        </View>

        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={globalStyles.body}>Transactions:</Text>
          <Text style={[globalStyles.body, { fontWeight: 'bold' }]}>
            {userProfile?.transactionCount || 0}
          </Text>
        </View>

        {nextTier && (
          <ErrorMessage
            message={`Complete ${nextTier.needed} more transactions to reach ${nextTier.tier} tier!`}
            type="info"
          />
        )}
      </Card>
    );
  };

  const renderReferralCard = () => (
    <Card>
      <Text style={globalStyles.subtitle}>Referral Program</Text>
      
      <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.sm }]}>
        <Text style={globalStyles.body}>Your Referral Code:</Text>
        <View style={[globalStyles.row]}>
          <Text style={[globalStyles.body, { fontWeight: 'bold', marginRight: SPACING.sm }]}>
            {userProfile?.referralCode}
          </Text>
          <Button
            title="Copy"
            onPress={copyReferralCode}
            variant="outline"
            style={{ 
              paddingHorizontal: SPACING.sm, 
              paddingVertical: SPACING.xs,
              marginVertical: 0,
              minHeight: 'auto'
            }}
            textStyle={{ fontSize: 12 }}
          />
        </View>
      </View>

      <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
        <Text style={globalStyles.body}>Total Referrals:</Text>
        <Text style={[globalStyles.body, { fontWeight: 'bold' }]}>
          {referralStats.totalReferrals}
        </Text>
      </View>

      <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
        <Text style={globalStyles.body}>Pending:</Text>
        <Text style={[globalStyles.body, { color: COLORS.warning }]}>
          {referralStats.pendingReferrals}
        </Text>
      </View>

      <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
        <Text style={globalStyles.body}>Completed:</Text>
        <Text style={[globalStyles.body, { color: COLORS.success }]}>
          {referralStats.completedReferrals}
        </Text>
      </View>

      <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
        <Text style={globalStyles.body}>Total Earnings:</Text>
        <Text style={[globalStyles.body, { fontWeight: 'bold', color: COLORS.success }]}>
          ₦{referralStats.totalEarnings.toLocaleString()}
        </Text>
      </View>

      <Button
        title="Share Referral Code"
        onPress={shareReferralCode}
        style={{ marginTop: SPACING.md }}
      />

      <ErrorMessage
        message="Earn ₦5 for each friend who signs up and completes KYC verification!"
        type="info"
      />
    </Card>
  );

  const renderAccountCard = () => (
    <Card>
      <Text style={globalStyles.subtitle}>Account Information</Text>
      
      <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
        <Text style={globalStyles.body}>Email:</Text>
        <Text style={globalStyles.body}>{user?.email}</Text>
      </View>

      <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
        <Text style={globalStyles.body}>KYC Status:</Text>
        <Text style={[
          globalStyles.body,
          { 
            color: userProfile?.kycStatus === 'approved' ? COLORS.success : 
                   userProfile?.kycStatus === 'rejected' ? COLORS.error : 
                   COLORS.warning
          }
        ]}>
          {userProfile?.kycStatus?.toUpperCase() || 'PENDING'}
        </Text>
      </View>

      <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
        <Text style={globalStyles.body}>Member Since:</Text>
        <Text style={globalStyles.body}>
          {userProfile?.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
        </Text>
      </View>

      {userProfile?.kycStatus !== 'approved' && (
        <Button
          title="Upload ID for KYC"
          onPress={() => navigation.navigate('UploadID')}
          variant="outline"
          style={{ marginTop: SPACING.md }}
        />
      )}
    </Card>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <Text style={globalStyles.title}>Profile</Text>
        
        {error ? (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError('')}
            showDismiss
          />
        ) : null}

        {renderWalletCard()}
        {renderLoyaltyCard()}
        {renderReferralCard()}
        {renderAccountCard()}

        <View style={{ marginTop: SPACING.lg }}>
          <Button
            title="Help & Support"
            onPress={() => navigation.navigate('HelpAndSupport')}
            variant="outline"
          />
          
          <Button
            title="Terms & Privacy"
            onPress={() => navigation.navigate('Terms')}
            variant="outline"
          />

          <Button
            title="Logout"
            onPress={handleLogout}
            loading={loading}
            style={{ 
              backgroundColor: COLORS.error,
              marginTop: SPACING.md
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
