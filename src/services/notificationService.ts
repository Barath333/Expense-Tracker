import notifee, { AndroidImportance, EventType, AndroidStyle, TriggerType } from '@notifee/react-native';
import { storage } from '../utils/storage';


// Storage keys for notification preferences
const STORAGE_KEYS = {
  BUDGET_ALERTS_ENABLED: 'budget_alerts_enabled',
  DAILY_REMINDER_ENABLED: 'daily_reminder_enabled',
};

// Initialize notifications
export const initializeNotifications = async () => {
  try {
    await notifee.requestPermission();
    
    // Create channel for budget alerts
    await notifee.createChannel({
      id: 'budget_alerts',
      name: 'Budget Alerts',
      description: 'Notifications when you approach or exceed your budget',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });
    
    // Create channel for daily reminders
    await notifee.createChannel({
      id: 'daily_reminders',
      name: 'Daily Reminders',
      description: 'Daily reminders to update expenses',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });
    
    // Initialize default settings
    await initializeNotificationSettings();
    
    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

// Initialize default settings
const initializeNotificationSettings = async () => {
  const budgetEnabled = storage.getString(STORAGE_KEYS.BUDGET_ALERTS_ENABLED);
  const dailyEnabled = storage.getString(STORAGE_KEYS.DAILY_REMINDER_ENABLED);
  
  if (budgetEnabled === undefined) {
    storage.set(STORAGE_KEYS.BUDGET_ALERTS_ENABLED, 'true');
  }
  if (dailyEnabled === undefined) {
    storage.set(STORAGE_KEYS.DAILY_REMINDER_ENABLED, 'true');
  }
};

// Check if budget alerts are enabled
export const areBudgetAlertsEnabled = async () => {
  const enabled = storage.getString(STORAGE_KEYS.BUDGET_ALERTS_ENABLED);
  return enabled === 'true';
};

// Check if daily reminders are enabled
export const areDailyRemindersEnabled = async () => {
  const enabled = storage.getString(STORAGE_KEYS.DAILY_REMINDER_ENABLED);
  return enabled === 'true';
};

// Set budget alerts preference
export const setBudgetAlertsEnabled = async (enabled: boolean) => {
  storage.set(STORAGE_KEYS.BUDGET_ALERTS_ENABLED, enabled.toString());
  return enabled;
};

// Set daily reminders preference
export const setDailyRemindersEnabled = async (enabled: boolean) => {
  storage.set(STORAGE_KEYS.DAILY_REMINDER_ENABLED, enabled.toString());
  
  if (enabled) {
    await scheduleDailyReminder();
  } else {
    await cancelDailyReminder();
  }
  return enabled;
};

// Schedule daily reminder for 9:30 PM
export const scheduleDailyReminder = async () => {
  try {
    // Cancel any existing triggers first
    await notifee.cancelTriggerNotification('daily_reminder');
    
    // Set trigger for 9:30 PM daily
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: getNextTriggerTime(),
      repeatFrequency: 'daily',
    };
    
    await notifee.createTriggerNotification(
      {
        id: 'daily_reminder',
        title: '💡 Expense Update Reminder',
        body: "Don't forget to log your expenses for today! Keep your budget on track.",
        android: {
          channelId: 'daily_reminders',
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          autoCancel: true,
        },
        ios: {
          sound: 'default',
        },
        data: {
          screen: 'Add',
          type: 'daily_reminder',
        },
      },
      trigger
    );
    
    console.log('Daily reminder scheduled for 9:30 PM');
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
};

// Calculate next trigger time (today at 9:30 PM or tomorrow if past)
const getNextTriggerTime = () => {
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(21, 30, 0, 0); // 9:30 PM
  
  if (now > targetTime) {
    // If already past 9:30 PM, schedule for tomorrow
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  return targetTime.getTime();
};

// Cancel daily reminder
export const cancelDailyReminder = async () => {
  try {
    await notifee.cancelTriggerNotification('daily_reminder');
    console.log('Daily reminder cancelled');
  } catch (error) {
    console.error('Error cancelling daily reminder:', error);
  }
};

// Show budget alert notification (checks if enabled)
export const showBudgetAlert = async (
  percentageSpent: number,
  totalSpent: number,
  monthlyBudget: number
) => {
  try {
    const enabled = await areBudgetAlertsEnabled();
    if (!enabled) {
      console.log('Budget alerts are disabled, skipping notification');
      return;
    }
    
    const isExceeded = percentageSpent >= 100;
    const title = isExceeded ? '🚨 Budget Exceeded!' : '⚠️ Budget Alert';
    const body = isExceeded
      ? `You have exceeded your monthly budget of ₹${monthlyBudget.toLocaleString('en-IN')}! Total spent: ₹${totalSpent.toLocaleString('en-IN')}`
      : `You've spent ${Math.round(percentageSpent)}% of your ₹${monthlyBudget.toLocaleString('en-IN')} budget. ₹${(monthlyBudget - totalSpent).toLocaleString('en-IN')} remaining.`;
    
    await notifee.displayNotification({
      id: `budget_alert_${Date.now()}`,
      title,
      body,
      android: {
        channelId: 'budget_alerts',
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        style: { type: AndroidStyle.BIGTEXT, text: body },
        autoCancel: true,
      },
      ios: {
        sound: 'default',
      },
      data: {
        screen: 'Home',
        type: 'budget_alert',
      },
    });
  } catch (error) {
    console.error('Error showing budget alert:', error);
  }
};

// Show category budget alert
export const showCategoryBudgetAlert = async (
  category: string,
  spent: number,
  budget: number,
  percentage: number
) => {
  try {
    const enabled = await areBudgetAlertsEnabled();
    if (!enabled) {
      console.log('Budget alerts are disabled, skipping notification');
      return;
    }
    
    const isExceeded = percentage >= 100;
    const title = isExceeded 
      ? `🚨 ${category} Budget Exceeded!` 
      : `⚠️ ${category} Budget Alert`;
    const body = isExceeded
      ? `You've exceeded your ${category} budget of ₹${budget.toLocaleString('en-IN')}! Spent: ₹${spent.toLocaleString('en-IN')}`
      : `You've spent ${Math.round(percentage)}% of your ${category} budget (₹${budget.toLocaleString('en-IN')}). Remaining: ₹${(budget - spent).toLocaleString('en-IN')}`;
    
    await notifee.displayNotification({
      id: `category_alert_${Date.now()}`,
      title,
      body,
      android: {
        channelId: 'budget_alerts',
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        style: { type: AndroidStyle.BIGTEXT, text: body },
        autoCancel: true,
      },
      ios: {
        sound: 'default',
      },
      data: {
        screen: 'Analytics',
        category: category,
        type: 'category_alert',
      },
    });
  } catch (error) {
    console.error('Error showing category alert:', error);
  }
};

// Setup notification press handler
export const setupNotificationListener = (navigation: any) => {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      const screen = detail.notification?.data?.screen;
      if (screen === 'Home') {
        navigation.navigate('Home');
      } else if (screen === 'Analytics') {
        navigation.navigate('Analytics');
      } else if (screen === 'Add') {
        navigation.navigate('Add');
      }
    }
  });
};