import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAlertStore } from '../services/stores/alertStore';


const { width, height } = Dimensions.get('window');

const getColors = (type: string) => {
  switch (type) {
    case 'success':
      return {
        gradient: ['#2db87a', '#0a4f3c'],
        icon: '✓',
        iconBg: '#2db87a',
      };
    case 'error':
      return {
        gradient: ['#ff6b6b', '#c92a2a'],
        icon: '✕',
        iconBg: '#ff6b6b',
      };
    case 'warning':
      return {
        gradient: ['#ffd43b', '#f59f00'],
        icon: '⚠',
        iconBg: '#ffd43b',
      };
    case 'info':
      return {
        gradient: ['#4dabf7', '#1864ab'],
        icon: 'ℹ',
        iconBg: '#4dabf7',
      };
    default:
      return {
        gradient: ['#2db87a', '#0a4f3c'],
        icon: '✓',
        iconBg: '#2db87a',
      };
  }
};

const CustomAlert = () => {
  const {
    visible,
    title,
    message,
    type,
    buttons,
    hideAlert,
  } = useAlertStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;


  useEffect(() => {
  console.log('🔔 CustomAlert component mounted');
  return () => console.log('🔔 CustomAlert component unmounted');
}, []);

useEffect(() => {
  console.log('🔔 CustomAlert visibility changed:', visible);
  console.log('🔔 Alert data:', { title, message, type });
}, [visible, title, message, type]);

  useEffect(() => {
    if (visible) {
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
    } else {
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
    }
  }, [visible, fadeAnim, scaleAnim]);

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return styles.cancelButton;
      case 'destructive':
        return styles.destructiveButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return styles.cancelButtonText;
      case 'destructive':
        return styles.destructiveButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  const colors = getColors(type);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={hideAlert}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={hideAlert}
        />
        
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.iconBg }]}>
            <Text style={styles.iconText}>{colors.icon}</Text>
          </View>

          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contentGradient}
          >
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    getButtonStyle(button.style),
                  ]}
                  onPress={() => {
                    if (button.onPress) button.onPress();
                    hideAlert();
                  }}
                >
                  <Text style={getButtonTextStyle(button.style)}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
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
  alertContainer: {
    width: width - 48,
    maxWidth: 340,
    backgroundColor: 'white',
    borderRadius: 20,
    // overflow: 'hidden',
    alignItems: 'center',
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
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -35,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  contentGradient: {
    padding: 24,
    paddingTop: 8,
    width: '100%',
      overflow: 'hidden',      // ← ADD HERE
  borderRadius: 20,  
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  button: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  defaultButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  destructiveButton: {
    backgroundColor: 'rgba(255,100,100,0.3)',
  },
  defaultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  destructiveButtonText: {
    color: '#ffcccc',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlert;