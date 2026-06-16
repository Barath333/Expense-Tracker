import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation';
import CustomAlert from './src/components/CustomAlert';
import LanguageSelectModal from './src/components/LanguageSelectModal';
import { useNotificationStore } from './src/services/stores/notificationStore';
import './src/i18n';
import { getSavedLanguage } from './src/i18n';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const initializeNotifications = useNotificationStore((state) => state.initialize);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [checkingLanguage, setCheckingLanguage] = useState(true);

  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  useEffect(() => {
    const lang = getSavedLanguage();
    if (!lang) {
      setShowLanguageModal(true);
    }
    setCheckingLanguage(false);
  }, []);

  if (checkingLanguage) return <></>; // or a splash/loader

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={isDarkMode ? '#000000' : '#0a4f3c'}
        />
        <AppNavigator />
        <CustomAlert />
        <LanguageSelectModal
          visible={showLanguageModal}
          onComplete={() => setShowLanguageModal(false)}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;