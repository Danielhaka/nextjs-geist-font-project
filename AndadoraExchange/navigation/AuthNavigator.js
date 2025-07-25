import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import PinValidationScreen from '../screens/PinValidationScreen';
import BiometricScreen from '../screens/BiometricScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PinSetup" component={PinSetupScreen} />
      <Stack.Screen name="PinValidation" component={PinValidationScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricScreen} />
      <Stack.Screen name="BiometricValidation" component={BiometricScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
