import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validateInput';
import { globalStyles } from '../styles/globalStyles';
import Button from '../components/Button';
import Input from '../components/Input';
import ErrorMessage from '../components/ErrorMessage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const { login } = useAuth();

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
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = async () => {
    setGeneralError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (!result.success) {
        setGeneralError(result.error || 'Login failed. Please try again.');
      }
      // Navigation will be handled by AuthContext state change
    } catch (error) {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const navigateToForgotPassword = () => {
    // TODO: Implement forgot password screen
    console.log('Navigate to forgot password');
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
            <Text style={globalStyles.title}>Welcome Back</Text>
            <Text style={[globalStyles.body, { textAlign: 'center', marginBottom: 32 }]}>
              Sign in to your AndadoraExchange account
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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={passwordError}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
            />

            <Button
              title="Forgot Password?"
              onPress={navigateToForgotPassword}
              variant="outline"
              style={{ marginTop: 16 }}
            />

            <View style={[globalStyles.row, { marginTop: 32 }]}>
              <Text style={globalStyles.body}>Don't have an account? </Text>
              <Button
                title="Sign Up"
                onPress={navigateToRegister}
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
