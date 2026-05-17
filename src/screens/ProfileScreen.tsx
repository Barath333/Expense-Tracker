import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { useUserStore } from '../services/stores/userStore';
import { signOut } from '../services/firebase/authService';
import { useAlertStore } from '../services/stores/alertStore';
import { useNotificationSettings } from '../hooks/useNotificationSettings';

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

// Predefined icons for custom categories
const ICON_OPTIONS = [
  '🍔', '🚕', '🛒', '💊', '📱', '🎬', '🏠', '💰', '🍕', '☕', 
  '🎮', '📚', '💪', '🎵', '✈️', '🏨', '🎁', '💻', '⌚', '👕',
  '🐶', '🐱', '🌱', '💡', '🔧', '📷', '🎨', '⚽', '🏀', '🎾'
];

export default function ProfileScreen({ navigation }: any) {
  // Move all hooks to the top, in the same order every time
  const userStore = useUserStore();
  const { 
    monthlyBudget, 
    categoryBudgets, 
    customCategories = [], 
    fetchBudget, 
    setMonthlyBudget, 
    setCategoryBudget,
    addCustomCategory,
    removeCustomCategory,
    loading 
  } = userStore;
  
  const { showAlert } = useAlertStore();
  
  // Notification settings hook
  const { 
    budgetAlerts, 
    dailyReminders, 
    loading: notificationLoading,
    toggleBudgetAlerts, 
    toggleDailyReminders 
  } = useNotificationSettings();
  
  // All useState hooks must be declared in the same order every render
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  // Modal states
  const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
  const [tempMonthlyBudget, setTempMonthlyBudget] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tempCategoryBudget, setTempCategoryBudget] = useState('');
  
  // Add Category Modal States
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  // All useEffect hooks must be in the same order
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
    showAlert({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      type: 'warning',
      buttons: [
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
    });
  };

  // Notification toggle handlers
// Notification toggle handlers - Updated version
const handleBudgetAlertsToggle = async (value: boolean) => {
  console.log('Budget alerts toggle pressed, new value:', value);
  try {
    const success = await toggleBudgetAlerts(value);
    console.log('Toggle budget alerts result:', success);
    
    if (success) {
      showAlert({
        title: 'Success',
        message: value ? 'Budget alerts enabled' : 'Budget alerts disabled',
        type: 'success',
      });
    } else {
      showAlert({
        title: 'Error',
        message: 'Failed to update notification settings',
        type: 'error',
      });
    }
  } catch (error) {
    console.error('Error in handleBudgetAlertsToggle:', error);
    showAlert({
      title: 'Error',
      message: 'An unexpected error occurred',
      type: 'error',
    });
  }
};

const handleDailyRemindersToggle = async (value: boolean) => {
  console.log('Daily reminders toggle pressed, new value:', value);
  try {
    const success = await toggleDailyReminders(value);
    console.log('Toggle daily reminders result:', success);
    
    if (success) {
      showAlert({
        title: 'Success',
        message: value 
          ? 'Daily reminders enabled. You will receive notifications at 9:30 PM.' 
          : 'Daily reminders disabled',
        type: 'success',
      });
    } else {
      showAlert({
        title: 'Error',
        message: 'Failed to update notification settings',
        type: 'error',
      });
    }
  } catch (error) {
    console.error('Error in handleDailyRemindersToggle:', error);
    showAlert({
      title: 'Error',
      message: 'An unexpected error occurred',
      type: 'error',
    });
  }
};
 

  // Monthly Budget Modal Handlers
  const openMonthlyBudgetModal = () => {
    setTempMonthlyBudget(monthlyBudget.toString());
    setMonthlyModalVisible(true);
  };

  const saveMonthlyBudget = async () => {
    const numAmount = parseFloat(tempMonthlyBudget);
    if (!isNaN(numAmount) && numAmount > 0) {
      const result = await setMonthlyBudget(numAmount);
      if (result.success) {
        setMonthlyModalVisible(false);
        showAlert({
          title: 'Success',
          message: `Monthly budget updated to ₹${numAmount.toLocaleString('en-IN')}`,
          type: 'success',
        });
      } else {
        showAlert({
          title: 'Error',
          message: result.error || 'Failed to update monthly budget',
          type: 'error',
        });
      }
    } else {
      showAlert({
        title: 'Error',
        message: 'Please enter a valid amount',
        type: 'error',
      });
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
      const result = await setCategoryBudget(selectedCategory, numAmount);
      if (result.success) {
        setCategoryModalVisible(false);
        showAlert({
          title: 'Success',
          message: `${selectedCategory} budget updated to ₹${numAmount.toLocaleString('en-IN')}`,
          type: 'success',
        });
      } else {
        showAlert({
          title: 'Error',
          message: result.error || 'Failed to update category budget',
          type: 'error',
        });
      }
    } else {
      showAlert({
        title: 'Error',
        message: 'Please enter a valid amount',
        type: 'error',
      });
    }
  };

  // Add Custom Category Handlers
  const openAddCategoryModal = () => {
    setNewCategoryName('');
    setNewCategoryIcon('📌');
    setNewCategoryBudget('');
    setAddCategoryModalVisible(true);
  };

  const handleAddCustomCategory = async () => {
    if (!newCategoryName.trim()) {
      showAlert({
        title: 'Error',
        message: 'Please enter a category name',
        type: 'error',
      });
      return;
    }

    const categoryName = newCategoryName.trim();
    
    // Check against default categories
    const defaultCategories = ['Food', 'Travel', 'Shopping', 'Health', 'Bills', 'Entertainment', 'Rent', 'Other'];
    if (defaultCategories.includes(categoryName)) {
      showAlert({
        title: 'Error',
        message: 'This is a default category. Please choose a different name.',
        type: 'error',
      });
      return;
    }
    
    if (categoryBudgets[categoryName] || (customCategories && customCategories.some((c: any) => c.name === categoryName))) {
      showAlert({
        title: 'Error',
        message: 'Category already exists',
        type: 'error',
      });
      return;
    }

    const budgetNum = parseFloat(newCategoryBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      showAlert({
        title: 'Error',
        message: 'Please enter a valid budget amount',
        type: 'error',
      });
      return;
    }

    setAddingCategory(true);
    try {
      const result = await addCustomCategory(categoryName, newCategoryIcon, budgetNum);
      if (result && result.success) {
        setAddCategoryModalVisible(false);
        setNewCategoryName('');
        setNewCategoryIcon('📌');
        setNewCategoryBudget('');
        showAlert({
          title: 'Success',
          message: `${categoryName} category added successfully!`,
          type: 'success',
        });
        // Refresh the budget data to ensure UI updates
        await fetchBudget();
      } else {
        showAlert({
          title: 'Error',
          message: result?.error || 'Failed to add category',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Error adding category:', error);
      showAlert({
        title: 'Error',
        message: error.message || 'Failed to add category. Please try again.',
        type: 'error',
      });
    } finally {
      setAddingCategory(false);
    }
  };

  const handleRemoveCustomCategory = (categoryName: string) => {
    showAlert({
      title: 'Remove Category',
      message: `Are you sure you want to remove "${categoryName}"?`,
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeCustomCategory(categoryName);
              if (result && result.success) {
                showAlert({
                  title: 'Success',
                  message: `${categoryName} category removed`,
                  type: 'success',
                });
                await fetchBudget();
              } else {
                showAlert({
                  title: 'Error',
                  message: result?.error || 'Failed to remove category',
                  type: 'error',
                });
              }
            } catch (error: any) {
              showAlert({
                title: 'Error',
                message: error.message || 'Failed to remove category',
                type: 'error',
              });
            }
          }
        }
      ]
    });
  };

  // Icon Picker Modal
  const renderIconPickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showIconPicker}
      onRequestClose={() => setShowIconPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose an Icon</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((item, index) => (
                <TouchableOpacity
                  key={`icon-${index}-${item}`}
                  style={[styles.iconOption, newCategoryIcon === item && styles.iconOptionSelected]}
                  onPress={() => {
                    setNewCategoryIcon(item);
                    setShowIconPicker(false);
                  }}
                >
                  <Text style={styles.iconOptionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity
            style={styles.closeModalBtn}
            onPress={() => setShowIconPicker(false)}
          >
            <Text style={styles.closeModalBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading && monthlyBudget === 15000 && Object.keys(categoryBudgets).length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
          <View style={styles.placeholder} />
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card - No edit button */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
        </View>

        {/* BUDGET Section */}
        <Text style={styles.sectionLabel}>BUDGET</Text>

        {/* Monthly Budget Card */}
        <TouchableOpacity style={styles.settingsCard} onPress={openMonthlyBudgetModal} activeOpacity={0.8}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#E8F8F0' }]}>
            <Text style={styles.settingsIcon}>💰</Text>
          </View>
          <Text style={styles.settingsLabel}>Monthly Budget</Text>
          <Text style={styles.settingsValue}>₹{monthlyBudget.toLocaleString('en-IN')} ›</Text>
        </TouchableOpacity>

        {/* Category Budgets Section */}
        <View style={styles.categoryHeader}>
          <Text style={styles.sectionLabel}>CATEGORY BUDGETS</Text>
          <TouchableOpacity onPress={openAddCategoryModal} style={styles.addCategoryBtn}>
            <Text style={styles.addCategoryBtnText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {/* Display all categories (default + custom) */}
        <View style={styles.categoryList}>
          {Object.entries(categoryBudgets).map(([category, amount]) => {
            const isCustomCategory = customCategories && customCategories.some((c: any) => c.name === category);
            const categoryIcon = isCustomCategory 
              ? (customCategories.find((c: any) => c.name === category)?.icon || '📌')
              : getDefaultIcon(category);
            
            return (
              <View key={category} style={styles.categoryItem}>
                <TouchableOpacity 
                  style={styles.categoryInfo}
                  onPress={() => openCategoryBudgetModal(category, amount as number)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{categoryIcon}</Text>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryAmount}>₹{(amount as number).toLocaleString('en-IN')}</Text>
                </TouchableOpacity>
                {isCustomCategory && (
                  <TouchableOpacity
                    onPress={() => handleRemoveCustomCategory(category)}
                    style={styles.removeCategoryBtn}
                  >
                    <Text style={styles.removeCategoryBtnText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          
          {Object.keys(categoryBudgets).length === 0 && (
            <Text style={styles.emptyText}>No categories added yet. Tap "+ Add New" to create one.</Text>
          )}
        </View>

        {/* NOTIFICATIONS Section */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>

        {/* Budget Alerts Card */}
        <View style={styles.settingsCard}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <Text style={styles.settingsIcon}>💰</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingsLabel}>Budget Alerts</Text>
            <Text style={styles.settingDescription}>Get alerts when you reach 80% of budget</Text>
          </View>
          <Switch
            value={budgetAlerts}
            onValueChange={handleBudgetAlertsToggle}
            trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
            thumbColor={COLORS.white}
            disabled={notificationLoading}
          />
        </View>

        {/* Daily Reminders Card */}
        <View style={styles.settingsCard}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.settingsIcon}>⏰</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingsLabel}>Daily Reminders</Text>
            <Text style={styles.settingDescription}>Remind me at 9:30 PM to update expenses</Text>
          </View>
          <Switch
            value={dailyReminders}
            onValueChange={handleDailyRemindersToggle}
            trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
            thumbColor={COLORS.white}
            disabled={notificationLoading}
          />
        </View>

        {/* Appearance Section */}
        <Text style={styles.sectionLabel}>APPEARANCE</Text>

        {/* Dark Mode Card */}
        <View style={styles.settingsCard}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#F3EEFF' }]}>
            <Text style={styles.settingsIcon}>🌙</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingsLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Coming soon</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
            thumbColor={COLORS.white}
            disabled={true}
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

      {/* Add Custom Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addCategoryModalVisible}
        onRequestClose={() => setAddCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Category</Text>
            
            <Text style={styles.modalLabel}>Category Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g., Coffee, Gym, Subscription"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.modalLabel}>Category Icon</Text>
            <TouchableOpacity
              style={styles.iconPickerBtn}
              onPress={() => setShowIconPicker(true)}
            >
              <Text style={styles.iconPickerText}>{newCategoryIcon}</Text>
              <Text style={styles.iconPickerChange}>Change</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalLabel}>Monthly Budget (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategoryBudget}
              onChangeText={setNewCategoryBudget}
              keyboardType="numeric"
              placeholder="Enter budget"
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddCategoryModalVisible(false)}
                disabled={addingCategory}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddCustomCategory}
                disabled={addingCategory}
              >
                {addingCategory ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Add Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Icon Picker Modal */}
      {renderIconPickerModal()}
    </SafeAreaView>
  );
}

// Helper function to get default icons for standard categories
const getDefaultIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    'Food': '🍔',
    'Travel': '🚕',
    'Shopping': '🛒',
    'Health': '💊',
    'Bills': '📱',
    'Entertainment': '🎬',
    'Rent': '🏠',
    'Other': '💰',
  };
  return iconMap[category] || '📌';
};

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addCategoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  addCategoryBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  settingsValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingDescription: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  categoryList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  removeCategoryBtn: {
    padding: 8,
    marginLeft: 8,
  },
  removeCategoryBtnText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    paddingVertical: 20,
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
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
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
  iconPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  iconPickerText: { fontSize: 30 },
  iconPickerChange: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  closeModalBtn: { marginTop: 15, paddingVertical: 10, alignItems: 'center' },
  closeModalBtnText: { color: '#999', fontWeight: '500' },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOption: { 
    width: 50, 
    height: 50, 
    justifyContent: 'center', 
    alignItems: 'center', 
    margin: 5, 
    borderRadius: 10, 
    backgroundColor: '#f5f5f5' 
  },
  iconOptionSelected: { 
    backgroundColor: COLORS.primary, 
    borderWidth: 2, 
    borderColor: '#fff' 
  },
  iconOptionText: { fontSize: 28 },
});