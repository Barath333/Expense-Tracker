import { create } from 'zustand';

import { scheduleDailyReminder, cancelDailyReminder } from '../notificationService';
import { storage } from '../../utils/storage';

const STORAGE_KEYS = {
  BUDGET_ALERTS_ENABLED: 'budget_alerts_enabled',
  DAILY_REMINDER_ENABLED: 'daily_reminder_enabled',
};

interface NotificationState {
  budgetAlerts: boolean;
  dailyReminders: boolean;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  toggleBudgetAlerts: (enabled: boolean) => Promise<boolean>;
  toggleDailyReminders: (enabled: boolean) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  budgetAlerts: true,
  dailyReminders: true,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) {
      console.log('Notification store already initialized');
      return;
    }
    
    try {
      set({ loading: true });
      
      const budgetEnabledStr = storage.getString(STORAGE_KEYS.BUDGET_ALERTS_ENABLED);
      const dailyEnabledStr = storage.getString(STORAGE_KEYS.DAILY_REMINDER_ENABLED);
      
      const budgetAlertsValue = budgetEnabledStr !== undefined ? budgetEnabledStr === 'true' : true;
      const dailyRemindersValue = dailyEnabledStr !== undefined ? dailyEnabledStr === 'true' : true;
      
      console.log('Loading notification settings (MMKV):', { budgetAlertsValue, dailyRemindersValue });
      
      set({
        budgetAlerts: budgetAlertsValue,
        dailyReminders: dailyRemindersValue,
        loading: false,
        initialized: true,
      });
      
      if (dailyRemindersValue) {
        await scheduleDailyReminder();
      } else {
        await cancelDailyReminder();
      }
    } catch (error) {
      console.error('Error initializing notification store:', error);
      set({ loading: false, initialized: true });
    }
  },

  refresh: async () => {
    try {
      const budgetEnabledStr = storage.getString(STORAGE_KEYS.BUDGET_ALERTS_ENABLED);
      const dailyEnabledStr = storage.getString(STORAGE_KEYS.DAILY_REMINDER_ENABLED);
      
      const budgetAlertsValue = budgetEnabledStr !== undefined ? budgetEnabledStr === 'true' : true;
      const dailyRemindersValue = dailyEnabledStr !== undefined ? dailyEnabledStr === 'true' : true;
      
      set({
        budgetAlerts: budgetAlertsValue,
        dailyReminders: dailyRemindersValue,
      });
      
      return true;
    } catch (error) {
      console.error('Error refreshing notification settings:', error);
      return false;
    }
  },

  toggleBudgetAlerts: async (enabled: boolean) => {
    try {
      console.log('Toggling budget alerts to:', enabled);
      storage.set(STORAGE_KEYS.BUDGET_ALERTS_ENABLED, enabled.toString());
      set({ budgetAlerts: enabled });
      
      // Verify the save
      const saved = storage.getString(STORAGE_KEYS.BUDGET_ALERTS_ENABLED);
      console.log('Verified budget alerts saved as:', saved);
      
      return true; // Return true on success
    } catch (error) {
      console.error('Error toggling budget alerts:', error);
      return false; // Return false on error
    }
  },

  toggleDailyReminders: async (enabled: boolean) => {
    try {
      console.log('Toggling daily reminders to:', enabled);
      storage.set(STORAGE_KEYS.DAILY_REMINDER_ENABLED, enabled.toString());
      set({ dailyReminders: enabled });
      
      if (enabled) {
        await scheduleDailyReminder();
      } else {
        await cancelDailyReminder();
      }
      
      // Verify the save
      const saved = storage.getString(STORAGE_KEYS.DAILY_REMINDER_ENABLED);
      console.log('Verified daily reminders saved as:', saved);
      
      return true; // Return true on success
    } catch (error) {
      console.error('Error toggling daily reminders:', error);
      return false; // Return false on error
    }
  },
}));