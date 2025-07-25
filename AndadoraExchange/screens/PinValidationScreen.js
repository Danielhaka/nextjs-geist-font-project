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

const PinValidationScreen = ({ navigation, route }) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const { user } = useAuth();
  const { onSuccess, title = 'Enter Your PIN', message = 'Please enter your PIN to continue' } = route.params || {};

  const MAX_ATTEMPTS = 3;

  const validateForm = () => {
    const pinValidation = validatePin(pin);
    if (!pinValidation.isValid) {
      setPinError(pinValidation.error);
      return false;
    } else {
      setPinError('');
      return true;
    }
  };

  const handleValidatePin = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Get stored PIN
      const storedPin = await SecureStore.getItemAsync(`user_pin_${user.uid}`);
      
      if (!storedPin) {
        setError('No PIN found. Please set up your PIN first.');
        setLoading(false);
        return;
      }

      if (pin === storedPin) {
        // PIN is correct
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        } else {
          navigation.goBack();
        }
      } else {
        // PIN is incorrect
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          Alert.alert(
            'Too Many Attempts',
            'You have exceeded the maximum number of PIN attempts. Please try again later or use biometric authentication.',
            [
              {
                text: 'Use Biometric',
                onPress: () => navigation.replace('BiometricValidation', route.params)
              },
              {
                text: 'Cancel',
                onPress: () => navigation.goBack()
              }
            ]
          );
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
          setPin('');
        }
      }
    } catch (error) {
      console.error('PIN validation error:', error);
      setError('Failed to validate PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const useBiometric = () => {
    navigation.replace('BiometricValidation', route.params);
  };

  const forgotPin = () => {
    Alert.alert(
      'Forgot PIN',
      'To reset your PIN, you will need to verify your identity using biometric authentication or contact support.',
      [
        {
          text: 'Use Biometric',
          onPress: useBiometric
        },
        {
          text: 'Contact Support',
          onPress: () => navigation.navigate('HelpAndSupport')
        },
        {
          text: 'Cancel',
          style: 'cancel'
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
          
          <Text style={globalStyles.title}>{title}</Text>
          <Text style={[globalStyles.body, { textAlign: 'center', marginBottom: SPACING.xl }]}>
            {message}
          </Text>

          {error ? (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError('')}
              showDismiss
            />
          ) : null}

          {attempts > 0 && attempts < MAX_ATTEMPTS && (
            <ErrorMessage 
              message={`${MAX_ATTEMPTS - attempts} attempts remaining`}
              type="warning"
            />
          )}

          <Input
            label="Enter PIN"
            placeholder="Enter your PIN"
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            error={pinError}
            autoFocus
          />

          <Button
            title="Verify PIN"
            onPress={handleValidatePin}
            loading={loading}
            disabled={loading || attempts >= MAX_ATTEMPTS}
            style={{ marginTop: SPACING.lg }}
          />

          <Button
            title="Use Biometric Instead"
            onPress={useBiometric}
            variant="outline"
            style={{ marginTop: SPACING.md }}
          />

          <Button
            title="Forgot PIN?"
            onPress={forgotPin}
            variant="outline"
            style={{ marginTop: SPACING.sm }}
          />

          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PinValidationScreen;
