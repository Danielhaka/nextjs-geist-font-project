import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles/globalStyles';
import { SPACING } from '../utils/constants';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';

const BiometricScreen = ({ navigation, route }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const { 
    mode = 'setup', // 'setup' or 'validation'
    onSuccess, 
    title = 'Biometric Authentication', 
    message = 'Use your biometric to continue' 
  } = route.params || {};

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      // Check if biometric authentication is supported
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsSupported(compatible);

      if (compatible) {
        // Check what types of biometric authentication are available
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricType(types);

        // Check if biometric records are enrolled
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsEnrolled(enrolled);
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setError('Failed to check biometric support');
    }
  };

  const getBiometricTypeText = () => {
    if (!biometricType || biometricType.length === 0) return 'biometric';
    
    if (biometricType.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (biometricType.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    } else if (biometricType.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
    return 'biometric';
  };

  const getBiometricIcon = () => {
    if (!biometricType || biometricType.length === 0) return '🔐';
    
    if (biometricType.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return '👤';
    } else if (biometricType.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return '👆';
    } else if (biometricType.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return '👁️';
    }
    return '🔐';
  };

  const handleBiometricAuth = async () => {
    if (!isSupported) {
      setError('Biometric authentication is not supported on this device');
      return;
    }

    if (!isEnrolled) {
      Alert.alert(
        'No Biometric Data',
        'Please set up biometric authentication in your device settings first.',
        [
          { text: 'OK' },
          {
            text: 'Use PIN Instead',
            onPress: () => navigation.replace('PinValidation', route.params)
          }
        ]
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Use your ${getBiometricTypeText()} to authenticate`,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        if (mode === 'setup') {
          // Save biometric preference
          await SecureStore.setItemAsync(`biometric_enabled_${user.uid}`, 'true');
          
          Alert.alert(
            'Biometric Setup Complete',
            'Biometric authentication has been enabled for your account.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('MainApp')
              }
            ]
          );
        } else {
          // Validation mode
          if (onSuccess && typeof onSuccess === 'function') {
            onSuccess();
          } else {
            navigation.goBack();
          }
        }
      } else {
        if (result.error === 'UserCancel') {
          // User cancelled, do nothing
        } else if (result.error === 'UserFallback') {
          // User chose to use PIN fallback
          navigation.replace('PinValidation', route.params);
        } else {
          setError('Biometric authentication failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setError('An error occurred during biometric authentication');
    } finally {
      setLoading(false);
    }
  };

  const skipBiometric = () => {
    if (mode === 'setup') {
      Alert.alert(
        'Skip Biometric Setup',
        'You can enable biometric authentication later in your profile settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Skip',
            onPress: () => navigation.navigate('MainApp')
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const usePinInstead = () => {
    navigation.replace('PinValidation', route.params);
  };

  if (!isSupported) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.centerContainer}>
          <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: SPACING.lg }}>
            ❌
          </Text>
          
          <Text style={globalStyles.title}>Not Supported</Text>
          <Text style={[globalStyles.body, { textAlign: 'center', marginBottom: SPACING.xl }]}>
            Biometric authentication is not supported on this device.
          </Text>

          <Button
            title="Use PIN Instead"
            onPress={usePinInstead}
          />

          <Button
            title="Skip"
            onPress={skipBiometric}
            variant="outline"
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <View style={globalStyles.centerContainer}>
          <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: SPACING.lg }}>
            {getBiometricIcon()}
          </Text>
          
          <Text style={globalStyles.title}>{title}</Text>
          <Text style={[globalStyles.body, { textAlign: 'center', marginBottom: SPACING.xl }]}>
            {mode === 'setup' 
              ? `Enable ${getBiometricTypeText()} authentication for quick and secure access to your account`
              : message
            }
          </Text>

          {error ? (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError('')}
              showDismiss
            />
          ) : null}

          {!isEnrolled && (
            <ErrorMessage 
              message={`No ${getBiometricTypeText()} data found. Please set up ${getBiometricTypeText()} in your device settings first.`}
              type="warning"
            />
          )}

          <Button
            title={`Use ${getBiometricTypeText()}`}
            onPress={handleBiometricAuth}
            loading={loading}
            disabled={loading || !isEnrolled}
            style={{ marginTop: SPACING.lg }}
          />

          <Button
            title="Use PIN Instead"
            onPress={usePinInstead}
            variant="outline"
            style={{ marginTop: SPACING.md }}
          />

          {mode === 'setup' && (
            <Button
              title="Skip for Now"
              onPress={skipBiometric}
              variant="outline"
              style={{ marginTop: SPACING.sm }}
            />
          )}

          {mode === 'validation' && (
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={{ marginTop: SPACING.sm }}
            />
          )}

          <Text style={[globalStyles.caption, { textAlign: 'center', marginTop: SPACING.lg }]}>
            Your biometric data is stored securely on your device and never shared
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BiometricScreen;
