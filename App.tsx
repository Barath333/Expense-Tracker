/**
 * Expense Tracker App
 * Entry point for the application
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation';
import CustomAlert from './src/components/CustomAlert'; // Add this import

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={isDarkMode ? '#000000' : '#0a4f3c'}
        />
        <AppNavigator />
        {/* Add CustomAlert here - it will be globally available */}
        <CustomAlert />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;