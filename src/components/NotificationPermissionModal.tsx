// components/NotificationPermissionModal.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onGranted: () => void;
}

const COLORS = {
  primary: '#1A9B5E',
  primaryDark: '#157A4A',
  primaryLight: '#E8F7F0',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
};

export const NotificationPermissionModal = ({ visible, onClose, onGranted }: Props) => {
  const requestPermission = async () => {
    const settings = await notifee.requestPermission();
    
    if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
      onGranted();
    }
    onClose();
  };

  const handleLater = () => {
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔔</Text>
          </View>
          
          <Text style={styles.title}>Enable Notifications</Text>
          <Text style={styles.message}>
            Stay on top of your finances! Get budget alerts and daily reminders to track your expenses.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💰</Text>
              <Text style={styles.featureText}>Budget alerts when you reach 80%</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⏰</Text>
              <Text style={styles.featureText}>Daily reminders at 9:30 PM</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Real-time spending updates</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.enableButton} onPress={requestPermission}>
            <Text style={styles.enableButtonText}>Enable Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.laterButton} onPress={handleLater}>
            <Text style={styles.laterButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 48,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  enableButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  enableButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  laterButtonText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});