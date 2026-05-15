import notifee, { AndroidImportance, EventType, AndroidStyle } from '@notifee/react-native';

// Initialize notifications
export const initializeNotifications = async () => {
  try {
    // Request permissions
    await notifee.requestPermission();
    
    // Create notification channel for Android
    await notifee.createChannel({
      id: 'budget_alerts',
      name: 'Budget Alerts',
      description: 'Notifications when you approach or exceed your budget',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });
    
    // Create channel for category alerts
    await notifee.createChannel({
      id: 'category_alerts',
      name: 'Category Budget Alerts',
      description: 'Notifications for category budget limits',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });
    
    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

// Show budget alert notification
export const showBudgetAlert = async (
  percentageSpent: number,
  totalSpent: number,
  monthlyBudget: number
) => {
  try {
    const isExceeded = percentageSpent >= 100;
    const title = isExceeded ? '🚨 Budget Exceeded!' : '⚠️ Budget Alert';
    const body = isExceeded
      ? `You have exceeded your monthly budget of ₹${monthlyBudget.toLocaleString('en-IN')}! Total spent: ₹${totalSpent.toLocaleString('en-IN')}`
      : `You've spent ${Math.round(percentageSpent)}% of your ₹${monthlyBudget.toLocaleString('en-IN')} budget. ₹${(monthlyBudget - totalSpent).toLocaleString('en-IN')} remaining.`;
    
    await notifee.displayNotification({
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
    const isExceeded = percentage >= 100;
    const title = isExceeded 
      ? `🚨 ${category} Budget Exceeded!` 
      : `⚠️ ${category} Budget Alert`;
    const body = isExceeded
      ? `You've exceeded your ${category} budget of ₹${budget.toLocaleString('en-IN')}! Spent: ₹${spent.toLocaleString('en-IN')}`
      : `You've spent ${Math.round(percentage)}% of your ${category} budget (₹${budget.toLocaleString('en-IN')}). Remaining: ₹${(budget - spent).toLocaleString('en-IN')}`;
    
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: 'category_alerts',
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
      }
    }
  });
};