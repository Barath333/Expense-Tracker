import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import auth from '@react-native-firebase/auth';

import OnboardingScreen from '../onboarding/onboarding';
import LoginScreen from '../auth/LoginScreen';
import TabNavigator from './TabNavigator';
import BudgetSetupScreen from '../screens/BudgetSetupScreen';
import BudgetEditScreen from '../screens/BudgetEditScreen';
import { storage } from '../utils/storage';
import ProfileScreen from '../screens/ProfileScreen';
import ForgotPasswordScreen from '../auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

const COLORS = {
  primary: '#1A9B5E',
};

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkInitialRoute = async () => {
      try {
        const currentUser = auth().currentUser;
        const hasSeenOnboarding = storage.getString('hasSeenOnboarding') === 'true';
        
        if (currentUser) {
          setInitialRoute('Main');
        } else if (hasSeenOnboarding) {
          setInitialRoute('Login');
        } else {
          setInitialRoute('Onboarding');
        }
      } catch (error) {
        console.log('Error checking initial route:', error);
        setInitialRoute('Login');
      } finally {
        setIsChecking(false);
      }
    };

    checkInitialRoute();

    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        setInitialRoute('Main');
      } else {
        const hasSeenOnboarding = storage.getString('hasSeenOnboarding') === 'true';
        setInitialRoute(hasSeenOnboarding ? 'Login' : 'Onboarding');
      }
    });

    return () => unsubscribe();
  }, []);

  if (isChecking) {
    return null;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute || 'Login'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="BudgetSetup" component={BudgetSetupScreen} />
          <Stack.Screen name="BudgetEdit" component={BudgetEditScreen} />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ 
              headerShown: false,
              presentation: 'card',
            }}
          />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Main" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}