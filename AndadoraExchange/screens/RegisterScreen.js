import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validateConfirmPassword, validateReferralCode } from '../utils/validateInput';
import { globalStyles } from '../styles/globalStyles';
import Button from '../components/Button';
import Input from '../components/Input';
import ErrorMessage from '../components/ErrorMessage';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [referralCodeError, setReferralCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);

  const { register } = useAuth();

  const validateForm = () => {
    let isValid = true;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      isValid = false;
    } else {
      setEmailError('');
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error);
      isValid = false;
    } else {
      setPasswordError('');
    }

    // Validate confirm password
    const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      setConfirmPasswordError(confirmPasswordValidation.error);
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    // Validate referral code if provided
    if (referralCode.trim()) {
      const referralValidation = validateReferralCode(referralCode.trim().toUpperCase());
      if (!referralValidation.isValid) {
        setReferralCodeError(referralValidation.error);
        isValid = false;
      } else {
        setReferralCodeError('');
      }
    } else {
      setReferralCodeError('');
    }

    return isValid;
  };

  const handleRegister = async () => {
    setGeneralError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const referralCodeToUse = referralCode.trim() ? referralCode.trim().toUpperCase() : null;
      const result = await register(email, password, referralCodeToUse);
      
      if (!result.success) {
        setGeneralError(result.error || 'Registration failed. Please try again.');
      }
      // Navigation will be handled by AuthContext state change
    } catch (error) {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const toggleReferralInput = () => {
    setShowReferralInput(!showReferralInput);
    if (!showReferralInput) {
      setReferralCode('');
      setReferralCodeError('');
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView 
        style={globalStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={globalStyles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={globalStyles.centerContainer}>
            <Text style={globalStyles.title}>Create Account</Text>
            <Text style={[globalStyles.body, { textAlign: 'center', marginBottom: 32 }]}>
              Join AndadoraExchange and start trading gift cards
            </Text>

            {generalError ? (
              <ErrorMessage 
                message={generalError} 
                onDismiss={() => setGeneralError('')}
                showDismiss
              />
            ) : null}

            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
            />

            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={passwordError}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={confirmPasswordError}
            />

            {!showReferralInput ? (
              <Button
                title="Have a referral code?"
                onPress={toggleReferralInput}
                variant="outline"
                style={{ marginBottom: 16 }}
              />
            ) : (
              <View>
                <Input
                  label="Referral Code (Optional)"
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChangeText={(text) => setReferralCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  error={referralCodeError}
                />
                
                <ErrorMessage 
                  message="Enter your friend's referral code to get started with a bonus!"
                  type="info"
                  style={{ marginBottom: 16 }}
                />

                <Button
                  title="Remove referral code"
                  onPress={toggleReferralInput}
                  variant="outline"
                  style={{ marginBottom: 16 }}
                />
              </View>
            )}

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
            />

            <View style={[globalStyles.row, { marginTop: 32 }]}>
              <Text style={globalStyles.body}>Already have an account? </Text>
              <Button
                title="Sign In"
                onPress={navigateToLogin}
                variant="outline"
                style={{ 
                  paddingHorizontal: 16, 
                  paddingVertical: 8, 
                  marginVertical: 0,
                  minHeight: 'auto'
                }}
                textStyle={{ fontSize: 16 }}
              />
            </View>

            <Text style={[globalStyles.caption, { textAlign: 'center', marginTop: 24 }]}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
