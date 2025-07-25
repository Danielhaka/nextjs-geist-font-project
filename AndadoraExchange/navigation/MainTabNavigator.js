import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { COLORS } from '../utils/constants';

// Import screens
import GiftCardScreen from '../screens/GiftCardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import UploadIDScreen from '../screens/UploadIDScreen';
import HelpAndSupportScreen from '../screens/HelpAndSupportScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import RateManagementScreen from '../screens/RateManagementScreen';
import PinValidationScreen from '../screens/PinValidationScreen';
import BiometricScreen from '../screens/BiometricScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const GiftCardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="GiftCardMain" component={GiftCardScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="Withdraw" component={WithdrawScreen} />
    <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
    <Stack.Screen name="UploadID" component={UploadIDScreen} />
    <Stack.Screen name="HelpAndSupport" component={HelpAndSupportScreen} />
    <Stack.Screen name="PinValidation" component={PinValidationScreen} />
    <Stack.Screen name="BiometricValidation" component={BiometricScreen} />
  </Stack.Navigator>
);

const HistoryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HistoryMain" component={TransactionHistoryScreen} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminMain" component={AdminDashboardScreen} />
    <Stack.Screen name="RateManagement" component={RateManagementScreen} />
  </Stack.Navigator>
);

// Custom tab bar icon component
const TabIcon = ({ label, focused }) => (
  <Text style={{
    fontSize: 24,
    color: focused ? COLORS.accent : COLORS.textSecondary
  }}>
    {getTabIcon(label)}
  </Text>
);

const getTabIcon = (label) => {
  switch (label) {
    case 'Trade':
      return '💳';
    case 'Profile':
      return '👤';
    case 'History':
      return '📊';
    case 'Admin':
      return '⚙️';
    default:
      return '📱';
  }
};

const MainTabNavigator = ({ userProfile }) => {
  const isAdmin = userProfile?.role === 'admin' || userProfile?.isAdmin === true;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        )
      })}
    >
      <Tab.Screen 
        name="Trade" 
        component={GiftCardStack}
        options={{
          tabBarLabel: 'Trade'
        }}
      />
      
      <Tab.Screen 
        name="History" 
        component={HistoryStack}
        options={{
          tabBarLabel: 'History'
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile'
        }}
      />
      
      {isAdmin && (
        <Tab.Screen 
          name="Admin" 
          component={AdminStack}
          options={{
            tabBarLabel: 'Admin'
          }}
        />
      )}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
