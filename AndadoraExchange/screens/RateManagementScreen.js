import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import ratesAPI from '../api/rates';
import { validateAmount } from '../utils/validateInput';
import { globalStyles } from '../styles/globalStyles';
import { COLORS, SPACING, GIFT_CARD_TYPES } from '../utils/constants';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';

const RateManagementScreen = ({ navigation }) => {
  const [rates, setRates] = useState({});
  const [selectedCard, setSelectedCard] = useState('');
  const [buyRate, setBuyRate] = useState('');
  const [sellRate, setSellRate] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [buyRateError, setBuyRateError] = useState('');
  const [sellRateError, setSellRateError] = useState('');

  const { user, userProfile } = useAuth();

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin' || userProfile?.isAdmin === true;

  useEffect(() => {
    if (isAdmin) {
      loadRates();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedCard && rates[selectedCard]) {
      const cardRate = rates[selectedCard];
      setBuyRate(cardRate.buyRate?.toString() || '');
      setSellRate(cardRate.sellRate?.toString() || '');
      setStatus(cardRate.status || 'active');
    } else {
      setBuyRate('');
      setSellRate('');
      setStatus('active');
    }
  }, [selectedCard, rates]);

  const loadRates = async () => {
    try {
      setLoading(true);
      const result = await ratesAPI.getCurrentRates();
      
      if (result.success) {
        setRates(result.data);
        if (!selectedCard && Object.keys(result.data).length > 0) {
          setSelectedCard(Object.keys(result.data)[0]);
        }
      } else {
        setError(result.error || 'Failed to load rates');
      }
    } catch (error) {
      console.error('Error loading rates:', error);
      setError('Failed to load rates');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;

    // Validate buy rate
    const buyRateValidation = validateAmount(buyRate);
    if (!buyRateValidation.isValid) {
      setBuyRateError('Please enter a valid buy rate');
      isValid = false;
    } else {
      const buyRateNum = parseFloat(buyRate);
      if (buyRateNum <= 0 || buyRateNum > 1) {
        setBuyRateError('Buy rate must be between 0 and 1');
        isValid = false;
      } else {
        setBuyRateError('');
      }
    }

    // Validate sell rate
    const sellRateValidation = validateAmount(sellRate);
    if (!sellRateValidation.isValid) {
      setSellRateError('Please enter a valid sell rate');
      isValid = false;
    } else {
      const sellRateNum = parseFloat(sellRate);
      if (sellRateNum <= 0 || sellRateNum > 1) {
        setSellRateError('Sell rate must be between 0 and 1');
        isValid = false;
      } else if (sellRateNum <= parseFloat(buyRate)) {
        setSellRateError('Sell rate must be higher than buy rate');
        isValid = false;
      } else {
        setSellRateError('');
      }
    }

    // Validate card selection
    if (!selectedCard) {
      setError('Please select a gift card type');
      isValid = false;
    }

    return isValid;
  };

  const handleUpdateRate = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    Alert.alert(
      'Update Rate',
      `Are you sure you want to update the rate for ${selectedCard}?\n\nBuy Rate: ${buyRate}\nSell Rate: ${sellRate}\nStatus: ${status.toUpperCase()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: processRateUpdate
        }
      ]
    );
  };

  const processRateUpdate = async () => {
    setUpdating(true);
    
    try {
      const rateData = {
        buyRate: parseFloat(buyRate),
        sellRate: parseFloat(sellRate),
        status,
        currency: 'NGN',
        updatedBy: user.uid
      };

      const result = await ratesAPI.updateRate(selectedCard, rateData);
      
      if (result.success) {
        Alert.alert('Success', 'Rate updated successfully');
        await loadRates(); // Reload rates
      } else {
        setError(result.error || 'Failed to update rate');
      }
    } catch (error) {
      console.error('Error updating rate:', error);
      setError('An unexpected error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const renderCardSelector = () => (
    <Card>
      <Text style={globalStyles.subtitle}>Select Gift Card Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm }}>
        {GIFT_CARD_TYPES.map((cardType) => (
          <Button
            key={cardType}
            title={cardType}
            onPress={() => setSelectedCard(cardType)}
            variant={selectedCard === cardType ? 'primary' : 'outline'}
            style={{
              margin: SPACING.xs,
              paddingHorizontal: SPACING.sm,
              minHeight: 'auto'
            }}
            textStyle={{ fontSize: 14 }}
          />
        ))}
      </View>
    </Card>
  );

  const renderCurrentRate = () => {
    if (!selectedCard || !rates[selectedCard]) return null;

    const currentRate = rates[selectedCard];
    
    return (
      <Card style={{ backgroundColor: COLORS.surface }}>
        <Text style={globalStyles.subtitle}>Current Rate - {selectedCard}</Text>
        
        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={globalStyles.body}>Buy Rate:</Text>
          <Text style={[globalStyles.body, { fontWeight: 'bold' }]}>
            {currentRate.buyRate}
          </Text>
        </View>

        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={globalStyles.body}>Sell Rate:</Text>
          <Text style={[globalStyles.body, { fontWeight: 'bold' }]}>
            {currentRate.sellRate}
          </Text>
        </View>

        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={globalStyles.body}>Status:</Text>
          <Text style={[
            globalStyles.body, 
            { 
              fontWeight: 'bold',
              color: currentRate.status === 'active' ? COLORS.success : COLORS.error
            }
          ]}>
            {currentRate.status?.toUpperCase()}
          </Text>
        </View>

        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={globalStyles.body}>Last Updated:</Text>
          <Text style={globalStyles.caption}>
            {currentRate.lastUpdated ? 
              new Date(currentRate.lastUpdated.seconds * 1000).toLocaleString() : 
              'N/A'
            }
          </Text>
        </View>
      </Card>
    );
  };

  const renderRateForm = () => (
    <Card>
      <Text style={globalStyles.subtitle}>Update Rate</Text>
      
      <Input
        label="Buy Rate (0.00 - 1.00)"
        placeholder="e.g., 0.82"
        value={buyRate}
        onChangeText={setBuyRate}
        keyboardType="decimal-pad"
        error={buyRateError}
      />

      <Input
        label="Sell Rate (0.00 - 1.00)"
        placeholder="e.g., 0.85"
        value={sellRate}
        onChangeText={setSellRate}
        keyboardType="decimal-pad"
        error={sellRateError}
      />

      <Text style={[globalStyles.subtitle, { marginTop: SPACING.md, marginBottom: SPACING.sm }]}>
        Status
      </Text>
      <View style={[globalStyles.row, { marginBottom: SPACING.md }]}>
        <Button
          title="Active"
          onPress={() => setStatus('active')}
          variant={status === 'active' ? 'primary' : 'outline'}
          style={{ flex: 1, marginRight: SPACING.sm }}
        />
        <Button
          title="Inactive"
          onPress={() => setStatus('inactive')}
          variant={status === 'inactive' ? 'primary' : 'outline'}
          style={{ flex: 1, marginLeft: SPACING.sm }}
        />
      </View>

      <Button
        title="Update Rate"
        onPress={handleUpdateRate}
        loading={updating}
        disabled={updating || !selectedCard}
      />
    </Card>
  );

  const renderRateHistory = () => (
    <Card>
      <Text style={globalStyles.subtitle}>Rate History</Text>
      <Button
        title="View Rate History"
        onPress={() => navigation.navigate('RateHistory', { cardType: selectedCard })}
        variant="outline"
        disabled={!selectedCard}
      />
    </Card>
  );

  const renderQuickActions = () => (
    <Card>
      <Text style={globalStyles.subtitle}>Quick Actions</Text>
      
      <Button
        title="Bulk Update Rates"
        onPress={() => navigation.navigate('BulkRateUpdate')}
        variant="outline"
        style={{ marginBottom: SPACING.sm }}
      />

      <Button
        title="Rate Analytics"
        onPress={() => navigation.navigate('RateAnalytics')}
        variant="outline"
      />
    </Card>
  );

  if (!isAdmin) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.centerContainer}>
          <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🚫</Text>
          <Text style={globalStyles.title}>Access Denied</Text>
          <Text style={[globalStyles.body, { textAlign: 'center' }]}>
            You don't have permission to manage rates.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.loadingContainer}>
          <Text style={globalStyles.body}>Loading rates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <Text style={globalStyles.title}>Rate Management</Text>
        
        {error ? (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError('')}
            showDismiss
          />
        ) : null}

        <ErrorMessage 
          message="⚠️ Rate changes affect all new transactions immediately. Please double-check values before updating."
          type="warning"
        />

        {renderCardSelector()}
        {renderCurrentRate()}
        {renderRateForm()}
        {renderRateHistory()}
        {renderQuickActions()}

        <ErrorMessage 
          message="💡 Buy rate is what users receive per dollar. Sell rate is for future selling features. Keep buy rate lower than sell rate."
          type="info"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default RateManagementScreen;
