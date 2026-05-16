import { useState, useEffect } from 'react';
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
import { getItem, saveItem, removeItem } from '../utils/storage';
import { useAlertStore } from '../services/stores/alertStore';

export default function LoginScreen({ navigation }: any) {
  // State declarations
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState('');
  
  const { showAlert } = useAlertStore();

  // Load saved email on mount
  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await getItem('lastUserEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberedEmail(savedEmail);
        setActiveTab('login'); // If we have saved email, default to login tab
      } else {
        setActiveTab('signup'); // No saved email, show signup tab for new users
      }
    } catch (error) {
      console.log('Error loading saved email:', error);
    }
  };

  const saveEmail = async (email: string) => {
    try {
      await saveItem('lastUserEmail', email);
    } catch (error) {
      console.log('Error saving email:', error);
    }
  };

  const clearSavedEmail = () => {
    showAlert({
      title: 'Clear Saved Email',
      message: 'Are you sure you want to clear the saved email?',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await removeItem('lastUserEmail');
            setEmail('');
            setRememberedEmail('');
            setActiveTab('signup');
            showAlert({
              title: 'Success',
              message: 'Saved email cleared!',
              type: 'success',
            });
          }
        }
      ]
    });
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      return { user: null, error: error };
    }
  };

  const handleAuth = async () => {
    if (!email.trim()) {
      showAlert({
        title: 'Error',
        message: 'Please enter your email',
        type: 'error',
      });
      return;
    }
    if (!password.trim()) {
      showAlert({
        title: 'Error',
        message: 'Please enter your password',
        type: 'error',
      });
      return;
    }
    if (activeTab === 'signup' && password.length < 6) {
      showAlert({
        title: 'Error',
        message: 'Password must be at least 6 characters',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    
    try {
      if (activeTab === 'login') {
        const { user, error } = await signIn(email, password);
        
        if (user) {
          saveEmail(email);
          showAlert({
            title: 'Success',
            message: 'Logged in successfully!',
            type: 'success',
            onDismiss: () => navigation.replace('Main'),
          });
        } else {
          let errorMessage = 'Login failed';
          if (error?.code === 'auth/user-not-found') {
            errorMessage = 'No account found. Please sign up first.';
            // Offer to switch to signup tab
            showAlert({
              title: 'Login Failed',
              message: errorMessage,
              type: 'error',
              buttons: [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Sign Up', 
                  style: 'default',
                  onPress: () => {
                    setActiveTab('signup');
                    setPassword('');
                  }
                }
              ]
            });
            return;
          } else if (error?.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
          } else if (error?.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
          } else if (error?.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Try again later.';
          } else if (error?.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Check your connection.';
          }
          showAlert({
            title: 'Login Failed',
            message: errorMessage,
            type: 'error',
          });
        }
      } else {
        try {
          const userCredential = await auth().createUserWithEmailAndPassword(email, password);
          await userCredential.user.updateProfile({ displayName: email.split('@')[0] });
          
          saveEmail(email);
          
          navigation.replace('BudgetSetup', {
            uid: userCredential.user.uid,
            email: email,
            displayName: email.split('@')[0],
          });
          
        } catch (error: any) {
          let errorMessage = 'Signup failed';
          if (error?.code === 'auth/email-already-in-use') {
            errorMessage = 'Email already registered. Please login instead.';
            // Offer to switch to login tab
            showAlert({
              title: 'Sign Up Failed',
              message: errorMessage,
              type: 'error',
              buttons: [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Login', 
                  style: 'default',
                  onPress: () => {
                    setActiveTab('login');
                    setPassword('');
                  }
                }
              ]
            });
            return;
          } else if (error?.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
          } else if (error?.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Use at least 6 characters.';
          } else if (error?.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Check your connection.';
          }
          showAlert({
            title: 'Sign Up Failed',
            message: errorMessage,
            type: 'error',
          });
        }
      }
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err?.message || 'An unexpected error occurred',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={['#0a4f3c', '#2db87a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.welcomeText}>
            {activeTab === 'login' ? 'Welcome back 👋' : 'Join SpendWise 🎉'}
          </Text>
          <Text style={styles.headingText}>
            {activeTab === 'login' ? 'Sign in to SpendWise' : 'Create an Account'}
          </Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'login' && styles.activeTab]}
              onPress={() => {
                setActiveTab('login');
                setPassword('');
              }}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => {
                setActiveTab('signup');
                setPassword('');
              }}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.formArea}>
          <Text style={styles.label}>EMAIL</Text>
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
            {rememberedEmail !== '' && activeTab === 'login' && (
              <TouchableOpacity onPress={clearSavedEmail} style={styles.clearEmailBtn}>
                <Text style={styles.clearEmailText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholderTextColor="#aaa"
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} disabled={loading}>
              <Text style={styles.inputIcon}>{showPassword ? '🔒' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'login' && (
            <TouchableOpacity 
              style={styles.forgotWrapper} 
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {activeTab === 'signup' && (
            <View style={styles.passwordHint}>
              <Text style={styles.passwordHintText}>
                🔒 Password must be at least 6 characters
              </Text>
            </View>
          )}

          {rememberedEmail !== '' && activeTab === 'login' && (
            <View style={styles.savedInfo}>
              <Text style={styles.savedInfoText}>✅ Using saved email: {rememberedEmail}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.disabledButton]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.signInText}>
              {activeTab === 'login' ? 'Sign In' : 'Create Account'}
            </Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Secure sign-in with Firebase</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.infoTextContent}>
              {activeTab === 'login' 
                ? "Don't have an account? Switch to Sign Up tab" 
                : "Already have an account? Switch to Login tab"}
            </Text>
          </View>
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
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  welcomeText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  headingText: { fontSize: 28, fontWeight: '700', color: '#ffffff', marginBottom: 24 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 28,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 24, alignItems: 'center' },
  activeTab: { backgroundColor: '#ffffff' },
  tabText: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  activeTabText: { color: '#0a4f3c', fontWeight: '600' },
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
  clearEmailBtn: { padding: 8 },
  clearEmailText: { fontSize: 16, color: '#999' },
  forgotWrapper: { alignItems: 'flex-end', marginTop: -10, marginBottom: 28 },
  forgotText: { color: '#1d9e6a', fontSize: 14, fontWeight: '500' },
  passwordHint: { alignItems: 'center', marginBottom: 16 },
  passwordHintText: { fontSize: 12, color: '#1d9e6a' },
  savedInfo: { marginBottom: 16, alignItems: 'center' },
  savedInfoText: { fontSize: 12, color: '#1d9e6a' },
  signInButton: {
    backgroundColor: '#0a4f3c',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: { opacity: 0.6 },
  signInText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#c5e8da' },
  dividerText: { fontSize: 12, color: '#888', textAlign: 'center' },
  infoText: { alignItems: 'center', paddingTop: 10 },
  infoTextContent: { fontSize: 13, color: '#0a4f3c', textAlign: 'center' },
});