import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { setBudgetAlertsEnabled, setDailyRemindersEnabled, scheduleDailyReminder } from '../services/notificationService';
import { checkNotificationPermissions, requestNotificationPermissions, showPermissionDeniedDialog } from '../services/permissionService';

const { width, height } = Dimensions.get('window');
const COLORS = {
  primary: '#1A9B5E',
  primaryDark: '#157A4A',
  primaryLight: '#E8F7F0',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#D1E9DC',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const NotificationPreferencePopup = ({ visible, onClose, onComplete }: Props) => {
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      checkPermissions();
      animateIn();
    } else {
      animateOut();
    }
  }, [visible]);

  const animateIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkPermissions = async () => {
    setCheckingPermissions(true);
    const granted = await checkNotificationPermissions();
    setHasPermissions(granted);
    setCheckingPermissions(false);
  };

  const requestPermissions = async () => {
    const granted = await requestNotificationPermissions();
    setHasPermissions(granted);
    
    if (!granted) {
      showPermissionDeniedDialog(() => {
        onClose();
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // First, check/request permissions
      let granted = hasPermissions;
      if (!granted) {
        granted = await requestPermissions();
        if (!granted) {
          setSaving(false);
          return;
        }
      }
      
      // Save preferences
      await setBudgetAlertsEnabled(budgetAlerts);
      await setDailyRemindersEnabled(dailyReminders);
      
      if (dailyReminders) {
        await scheduleDailyReminder();
      }
      
      onComplete();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (checkingPermissions) {
    return (
      <Modal transparent visible={visible} animationType="none">
        <View style={styles.overlay}>
          <View style={styles.popupContainer}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Checking permissions...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleSkip}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleSkip}
        />
        
        <Animated.View
          style={[
            styles.popupContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🔔</Text>
            </View>
            <Text style={styles.title}>Stay Updated!</Text>
            <Text style={styles.subtitle}>
              Choose how you want to receive notifications
            </Text>
          </LinearGradient>

          <View style={styles.content}>
            {/* Permission Status */}
            {!hasPermissions && (
              <View style={styles.permissionWarning}>
                <Text style={styles.permissionWarningIcon}>⚠️</Text>
                <Text style={styles.permissionWarningText}>
                  Allow notifications to receive alerts
                </Text>
              </View>
            )}

            {/* Budget Alerts Option */}
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={styles.optionIconText}>💰</Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Budget Alerts</Text>
                  <Text style={styles.optionDescription}>
                    Get alerts at 80% and 100% of budget
                  </Text>
                </View>
              </View>
              <Switch
                value={budgetAlerts}
                onValueChange={setBudgetAlerts}
                trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                thumbColor={COLORS.white}
                disabled={!hasPermissions}
              />
            </View>

            {/* Daily Reminders Option */}
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={styles.optionIconText}>⏰</Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Daily Reminders</Text>
                  <Text style={styles.optionDescription}>
                    Remind me at 9:30 PM to log expenses
                  </Text>
                </View>
              </View>
              <Switch
                value={dailyReminders}
                onValueChange={setDailyReminders}
                trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                thumbColor={COLORS.white}
                disabled={!hasPermissions}
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                You can change these anytime in Profile → Notifications
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={saving}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Saving...' : 'Continue'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    width: width,
    height: height,
  },
  popupContainer: {
    width: width - 40,
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerGradient: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 8,
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconText: {
    fontSize: 22,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primaryDark,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  permissionWarningIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  permissionWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    fontWeight: '500',
  },
});