import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { useUserStore } from '../services/stores/userStore';
import { signOut } from '../services/firebase/authService';

const COLORS = {
  primary: '#1A9B5E',
  primaryDark: '#157A4A',
  primaryLight: '#E8F7F0',
  accent: '#2EC87A',
  bg: '#F0FAF5',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#D1E9DC',
  danger: '#E53E3E',
  dangerLight: '#FFF0F0',
};

export default function ProfileScreen({ navigation }: any) {
  const { monthlyBudget, categoryBudgets, fetchBudget, setMonthlyBudget, setCategoryBudget, loading } = useUserStore();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  // Modal states
  const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
  const [tempMonthlyBudget, setTempMonthlyBudget] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tempCategoryBudget, setTempCategoryBudget] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = auth().currentUser;
    if (user) {
      setUserName(user.displayName || user.email?.split('@')[0] || 'User');
      setUserEmail(user.email || '');
    }
    await fetchBudget();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            setLogoutLoading(true);
            await signOut();
            navigation.replace('Login');
            setLogoutLoading(false);
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    const user = auth().currentUser;
    Alert.alert(
      'Edit Profile',
      'Update your display name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (newName) => {
            if (newName && user) {
              try {
                await user.updateProfile({ displayName: newName });
                setUserName(newName);
                Alert.alert('Success', 'Profile updated!');
              } catch (error) {
                Alert.alert('Error', 'Failed to update profile');
              }
            }
          },
        },
      ],
      'plain-text',
      userName
    );
  };

  // Monthly Budget Modal Handlers
  const openMonthlyBudgetModal = () => {
    setTempMonthlyBudget(monthlyBudget.toString());
    setMonthlyModalVisible(true);
  };

  const saveMonthlyBudget = async () => {
    const numAmount = parseFloat(tempMonthlyBudget);
    if (!isNaN(numAmount) && numAmount > 0) {
      await setMonthlyBudget(numAmount);
      setMonthlyModalVisible(false);
      Alert.alert('Success', `Monthly budget updated to ₹${numAmount.toLocaleString('en-IN')}`);
    } else {
      Alert.alert('Error', 'Please enter a valid amount');
    }
  };

  // Category Budget Modal Handlers
  const openCategoryBudgetModal = (category: string, currentAmount: number) => {
    setSelectedCategory(category);
    setTempCategoryBudget(currentAmount.toString());
    setCategoryModalVisible(true);
  };

  const saveCategoryBudget = async () => {
    const numAmount = parseFloat(tempCategoryBudget);
    if (!isNaN(numAmount) && numAmount >= 0) {
      await setCategoryBudget(selectedCategory, numAmount);
      setCategoryModalVisible(false);
      Alert.alert('Success', `${selectedCategory} budget updated to ₹${numAmount.toLocaleString('en-IN')}`);
    } else {
      Alert.alert('Error', 'Please enter a valid amount');
    }
  };

  if (loading && monthlyBudget === 15000 && Object.keys(categoryBudgets).length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textMuted }}>Loading budget data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile} activeOpacity={0.8}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* BUDGET Section */}
        <Text style={styles.sectionLabel}>BUDGET</Text>

        {/* Monthly Budget Card - FIXED */}
        <TouchableOpacity style={styles.settingsCard} onPress={openMonthlyBudgetModal} activeOpacity={0.8}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#E8F8F0' }]}>
            <Text style={styles.settingsIcon}>💰</Text>
          </View>
          <Text style={styles.settingsLabel}>Monthly Budget</Text>
          <Text style={styles.settingsValue}>₹{monthlyBudget.toLocaleString('en-IN')} ›</Text>
        </TouchableOpacity>

        {/* Category Budgets Card */}
        <TouchableOpacity style={styles.settingsCard} onPress={() => navigation.navigate('BudgetEdit')} activeOpacity={0.8}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#E8F8F0' }]}>
            <Text style={styles.settingsIcon}>📋</Text>
          </View>
          <Text style={styles.settingsLabel}>Category Budgets</Text>
          <Text style={styles.settingsValue}>
            {Object.keys(categoryBudgets).length} categories ›
          </Text>
        </TouchableOpacity>

        {/* Display current category budgets - Make them clickable */}
        {Object.entries(categoryBudgets).length > 0 && (
          <View style={styles.categoryList}>
            <Text style={styles.categoryListTitle}>Current Category Limits:</Text>
            {Object.entries(categoryBudgets).map(([category, amount]) => (
              <TouchableOpacity 
                key={category} 
                style={styles.categoryItem}
                onPress={() => openCategoryBudgetModal(category, amount as number)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryName}>{category}</Text>
                <View style={styles.categoryValueRow}>
                  <Text style={styles.categoryAmount}>₹{(amount as number).toLocaleString('en-IN')}</Text>
                  <Text style={styles.editIconSmall}>✏️</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* PREFERENCES Section */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>

        {/* Budget Alerts Card */}
        <View style={styles.settingsCard}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <Text style={styles.settingsIcon}>🔔</Text>
          </View>
          <Text style={styles.settingsLabel}>Budget Alerts</Text>
          <Switch
            value={budgetAlerts}
            onValueChange={setBudgetAlerts}
            trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        {/* Dark Mode Card */}
        <View style={styles.settingsCard}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#F3EEFF' }]}>
            <Text style={styles.settingsIcon}>🌙</Text>
          </View>
          <Text style={styles.settingsLabel}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        {/* Version */}
        <Text style={styles.version}>v1.0.0 · SpendWise</Text>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85} disabled={logoutLoading}>
          {logoutLoading ? (
            <ActivityIndicator color={COLORS.danger} />
          ) : (
            <Text style={styles.logoutText}>🚪  Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Monthly Budget Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={monthlyModalVisible}
        onRequestClose={() => setMonthlyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Monthly Budget</Text>
            <Text style={styles.modalSubtitle}>Enter your total monthly budget (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempMonthlyBudget}
              onChangeText={setTempMonthlyBudget}
              keyboardType="numeric"
              placeholder="Enter amount"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setMonthlyModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveMonthlyBudget}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Budget Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set {selectedCategory} Budget</Text>
            <Text style={styles.modalSubtitle}>Enter monthly budget for {selectedCategory} (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempCategoryBudget}
              onChangeText={setTempCategoryBudget}
              keyboardType="numeric"
              placeholder="Enter amount"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveCategoryBudget}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
  },
  content: {
    backgroundColor: COLORS.bg,
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  editBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: { fontSize: 18 },
  editIconSmall: { fontSize: 14, color: COLORS.primary, marginLeft: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  settingsIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: { fontSize: 20 },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  settingsValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  categoryListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.text,
  },
  categoryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    marginBottom: 16,
  },
  logoutBtn: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});