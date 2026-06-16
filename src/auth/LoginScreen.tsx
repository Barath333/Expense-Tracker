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
import { useTranslation } from 'react-i18next';
import { getItem, saveItem, removeItem } from '../utils/storage';
import { useAlertStore } from '../services/stores/alertStore';

export default function LoginScreen({ navigation }: any) {
  const { t } = useTranslation();
  
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
      title: t('auth.clearSavedEmailTitle'),
      message: t('auth.clearSavedEmailMessage'),
      type: 'warning',
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.clear'),
          style: 'destructive',
          onPress: async () => {
            await removeItem('lastUserEmail');
            setEmail('');
            setRememberedEmail('');
            setActiveTab('signup');
            showAlert({
              title: t('common.success'),
              message: t('auth.savedEmailCleared'),
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
        title: t('common.error'),
        message: t('auth.errorEnterEmail'),
        type: 'error',
      });
      return;
    }
    if (!password.trim()) {
      showAlert({
        title: t('common.error'),
        message: t('auth.errorEnterPassword'),
        type: 'error',
      });
      return;
    }
    if (activeTab === 'signup' && password.length < 6) {
      showAlert({
        title: t('common.error'),
        message: t('auth.errorPasswordLength'),
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
            title: t('common.success'),
            message: t('auth.loginSuccess'),
            type: 'success',
            onDismiss: () => navigation.replace('Main'),
          });
        } else {
          let errorMessage = t('auth.loginFailed');
          if (error?.code === 'auth/user-not-found') {
            errorMessage = t('auth.errorUserNotFound');
            // Offer to switch to signup tab
            showAlert({
              title: t('auth.loginFailed'),
              message: errorMessage,
              type: 'error',
              buttons: [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                  text: t('auth.signUp'), 
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
            errorMessage = t('auth.errorWrongPassword');
          } else if (error?.code === 'auth/invalid-email') {
            errorMessage = t('auth.errorInvalidEmail');
          } else if (error?.code === 'auth/too-many-requests') {
            errorMessage = t('auth.errorTooManyRequests');
          } else if (error?.code === 'auth/network-request-failed') {
            errorMessage = t('auth.errorNetwork');
          }
          showAlert({
            title: t('auth.loginFailed'),
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
          let errorMessage = t('auth.signUpFailed');
          if (error?.code === 'auth/email-already-in-use') {
            errorMessage = t('auth.errorEmailInUse');
            // Offer to switch to login tab
            showAlert({
              title: t('auth.signUpFailed'),
              message: errorMessage,
              type: 'error',
              buttons: [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                  text: t('auth.login'), 
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
            errorMessage = t('auth.errorInvalidEmail');
          } else if (error?.code === 'auth/weak-password') {
            errorMessage = t('auth.errorWeakPassword');
          } else if (error?.code === 'auth/network-request-failed') {
            errorMessage = t('auth.errorNetwork');
          }
          showAlert({
            title: t('auth.signUpFailed'),
            message: errorMessage,
            type: 'error',
          });
        }
      }
    } catch (err: any) {
      showAlert({
        title: t('common.error'),
        message: err?.message || t('auth.errorGeneric'),
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
            {activeTab === 'login' ? t('auth.welcomeBack') : t('auth.joinApp')}
          </Text>
          <Text style={styles.headingText}>
            {activeTab === 'login' ? t('auth.signInTitle') : t('auth.signUpTitle')}
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
                {t('auth.login')}
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
                {t('auth.signUp')}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.formArea}>
          <Text style={styles.label}>{t('auth.emailLabel')}</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
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

          <Text style={styles.label}>{t('auth.passwordLabel')}</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
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
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          )}

          {activeTab === 'signup' && (
            <View style={styles.passwordHint}>
              <Text style={styles.passwordHintText}>
                {t('auth.passwordHint')}
              </Text>
            </View>
          )}

          {rememberedEmail !== '' && activeTab === 'login' && (
            <View style={styles.savedInfo}>
              <Text style={styles.savedInfoText}>
                {t('auth.usingSavedEmail', { email: rememberedEmail })}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.disabledButton]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.signInText}>
              {activeTab === 'login' ? t('auth.signIn') : t('auth.createAccount')}
            </Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.secureSignIn')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.infoTextContent}>
              {activeTab === 'login' 
                ? t('auth.noAccount')
                : t('auth.haveAccount')}
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