import { Platform, Linking, Alert } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { storage } from '../utils/storage';

const STORAGE_KEYS = {
  PERMISSION_ASKED: 'notification_permission_asked',
};

export const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const settings = await notifee.requestPermission();
    const granted = settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    
    if (granted) {
      storage.set(STORAGE_KEYS.PERMISSION_ASKED, true);
    }
    
    return granted;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

export const openAppSettings = () => {
  if (Platform.OS === 'android') {
    Linking.openSettings();
  } else {
    Linking.openURL('app-settings:');
  }
};

export const showPermissionDeniedDialog = (onGoToSettings?: () => void) => {
  Alert.alert(
    'Notifications Disabled',
    'Please enable notifications in Settings to receive budget alerts and daily reminders.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Open Settings', 
        onPress: () => {
          openAppSettings();
          if (onGoToSettings) onGoToSettings();
        }
      }
    ]
  );
};

export const shouldShowPermissionRequest = async (): Promise<boolean> => {
  const hasAsked = storage.getBoolean(STORAGE_KEYS.PERMISSION_ASKED);
  const isGranted = await checkNotificationPermissions();
  
  // Show if not granted and haven't asked before
  return !isGranted && !hasAsked;
};