import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '../onboarding/onboarding';
import LoginScreen from '../auth/LoginScreen';
import TabNavigator from './TabNavigator';
import BudgetSetupScreen from '../screens/BudgetSetupScreen';
import BudgetEditScreen from '../screens/BudgetEditScreen';
import { storage } from '../utils/storage'; // ← add this
import ProfileScreen from '../screens/ProfileScreen';
import ForgotPasswordScreen from '../auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  // Sync read — resolves before first render, zero flash
  const hasLaunched = storage.getString('hasLaunched') === 'true';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasLaunched ? 'Login' : 'Onboarding'} // ← add this
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
            presentation: 'card', // This gives smooth transition
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
  );
}