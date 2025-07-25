import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthNavigator from './navigation/AuthNavigator';
import MainTabNavigator from './navigation/MainTabNavigator';
import { globalStyles } from './styles/globalStyles';

const AppContent = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return null; // Or a splash/loading screen
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainTabNavigator userProfile={userProfile} />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
