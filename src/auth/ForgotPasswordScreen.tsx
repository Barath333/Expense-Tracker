import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import { useAlertStore } from '../services/stores/alertStore';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { showAlert } = useAlertStore();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showAlert({
        title: 'Error',
        message: 'Please enter your email address',
        type: 'error',
      });
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      showAlert({
        title: 'Error',
        message: 'Please enter a valid email address',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      await auth().sendPasswordResetEmail(email);
      setEmailSent(true);
      showAlert({
        title: 'Password Reset Email Sent',
        message: `We've sent a password reset link to ${email}.\n\nPlease check your inbox and follow the instructions to reset your password.`,
        type: 'success',
        buttons: [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      showAlert({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <LinearGradient
            colors={['#0a4f3c', '#2db87a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.welcomeText}>Check Your Email 📧</Text>
            <Text style={styles.headingText}>Password Reset Link Sent</Text>
          </LinearGradient>

          <View style={styles.formArea}>
            <View style={styles.successCard}>
              <Text style={styles.successIcon}>✉️</Text>
              <Text style={styles.successTitle}>Reset link sent to:</Text>
              <Text style={styles.successEmail}>{email}</Text>
              <Text style={styles.successMessage}>
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A9B5E" />
              ) : (
                <Text style={styles.resendButtonText}>Resend Email</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={['#0a4f3c', '#2db87a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.welcomeText}>Trouble signing in?</Text>
          <Text style={styles.headingText}>Reset Password</Text>
          <Text style={styles.subHeadingText}>
            Enter your email and we'll send you a link to reset your password
          </Text>
        </LinearGradient>

        <View style={styles.formArea}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#aaa"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.disabledButton]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.resetButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.backToLoginText}>← Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Remember your password?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.signupButtonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eaf7f1' },
  scroll: { flexGrow: 1 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  welcomeText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  headingText: { fontSize: 28, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  subHeadingText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  formArea: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  label: { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 1.2, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2db87a',
    paddingHorizontal: 14,
    marginBottom: 20,
    height: 54,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1a1a1a' },
  resetButton: {
    backgroundColor: '#0a4f3c',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: { opacity: 0.6 },
  resetButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  backToLogin: { alignItems: 'center', marginBottom: 20 },
  backToLoginText: { color: '#1d9e6a', fontSize: 14, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#c5e8da' },
  dividerText: { fontSize: 12, color: '#888', textAlign: 'center' },
  signupButton: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2db87a',
  },
  signupButtonText: { color: '#0a4f3c', fontSize: 16, fontWeight: '700' },
  // Success screen styles
  successCard: {
    backgroundColor: '#E8F7F0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 16, fontWeight: '600', color: '#0a4f3c', marginBottom: 8 },
  successEmail: { fontSize: 14, color: '#1A9B5E', fontWeight: '500', marginBottom: 12 },
  successMessage: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 18 },
  backButton: {
    backgroundColor: '#0a4f3c',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  backButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  resendButton: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2db87a',
  },
  resendButtonText: { color: '#0a4f3c', fontSize: 16, fontWeight: '700' },
});