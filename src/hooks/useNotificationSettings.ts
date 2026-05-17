import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '../services/stores/notificationStore';
import { useFocusEffect } from '@react-navigation/native';

export const useNotificationSettings = () => {
  const { 
    budgetAlerts, 
    dailyReminders, 
    loading, 
    initialized,
    initialize, 
    refresh,
    toggleBudgetAlerts, 
    toggleDailyReminders 
  } = useNotificationStore();

  // Initialize only once when the hook is first used
  useEffect(() => {
    if (!initialized) {
      console.log('Initializing notification settings...');
      initialize();
    }
  }, [initialize, initialized]);

  // Refresh settings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, refreshing notification settings...');
      refresh();
      return () => {};
    }, [refresh])
  );

  return {
    budgetAlerts,
    dailyReminders,
    loading: loading || !initialized,
    toggleBudgetAlerts,
    toggleDailyReminders,
  };
};