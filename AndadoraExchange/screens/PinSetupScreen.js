import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { validatePin } from '../utils/validateInput';
import { globalStyles } from '../styles/globalStyles';
import { SPACING } from '../utils/constants';
import Button from '../components/Button';
import Input from '../components/Input';
import ErrorMessage from '../components/ErrorMessage';

const PinSetupScreen = ({ navigation }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const validateForm = () => {
    let isValid = true;

    // Validate PIN
    const pinValidation = validatePin(pin);
    if (!pinValidation.isValid) {
      setPinError(pinValidation.error);
      isValid = false;
    } else {
      setPinError('');
    }

    // Validate confirm PIN
    if (!confirmPin) {
      setConfirmPinError('Please confirm your PIN');
      isValid = false;
    } else if (pin !== confirmPin) {
      setConfirmPinError('PINs do not match');
      isValid = false;
    } else {
      setConfirmPinError('');
    }

    return isValid;
  };

  const handleSetupPin = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Store PIN securely
      await SecureStore.setItemAsync(`user_pin_${user.uid}`, pin);
      
      // Mark PIN as set up
      await SecureStore.setItemAsync(`pin_setup_${user.uid}`, 'true');
      
      Alert.alert(
        'PIN Setup Complete',
        'Your PIN has been set up successfully. You can now use it to secure your account.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('BiometricSetup')
          }
        ]
      );
    } catch (error) {
      console.error('PIN setup error:', error);
      setError('Failed to set up PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipPinSetup = () => {
    Alert.alert(
      'Skip PIN Setup',
      'Are you sure you want to skip PIN setup? You can set it up later in your profile settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.replace('BiometricSetup')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <View style={globalStyles.centerContainer}>
          <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: SPACING.lg }}>
            🔐
          </Text>
          
          <Text style={globalStyles.title}>Set Up Your PIN</Text>
          <Text style={[globalStyles.body, { textAlign: 'center', marginBottom: SPACING.xl }]}>
            Create a 4-6 digit PIN to secure your account and transactions
          </Text>

          {error ? (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError('')}
              showDismiss
            />
          ) : null}

          <Input
            label="Create PIN"
            placeholder="Enter 4-6 digit PIN"
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            error={pinError}
          />

          <Input
            label="Confirm PIN"
            placeholder="Re-enter your PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            error={confirmPinError}
          />

          <ErrorMessage 
            message="Your PIN will be used to authorize transactions and access sensitive features."
            type="info"
          />

          <Button
            title="Set Up PIN"
            onPress={handleSetupPin}
            loading={loading}
            disabled={loading}
            style={{ marginTop: SPACING.lg }}
          />

          <Button
            title="Skip for Now"
            onPress={skipPinSetup}
            variant="outline"
            style={{ marginTop: SPACING.md }}
          />

          <Text style={[globalStyles.caption, { textAlign: 'center', marginTop: SPACING.lg }]}>
            You can change your PIN anytime in your profile settings
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PinSetupScreen;
