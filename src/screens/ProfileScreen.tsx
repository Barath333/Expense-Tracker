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
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { useUserStore } from '../services/stores/userStore';
import { signOut } from '../services/firebase/authService';
import { useAlertStore } from '../services/stores/alertStore';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { checkNotificationPermissions, requestNotificationPermissions, showPermissionDeniedDialog } from '../services/permissionService';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getSavedLanguage } from '../i18n';

import LanguageQuickSwitchModal from '../components/LanguageQuickSwitchModal';

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
  const [hasNotificationPermissions, setHasNotificationPermissions] = useState(true);

  const { t, i18n } = useTranslation();
  const [showLangModal, setShowLangModal] = useState(false);
  
  // Track the actual display state for toggles (respecting permissions)
  const [displayBudgetAlerts, setDisplayBudgetAlerts] = useState(false);
  const [displayDailyReminders, setDisplayDailyReminders] = useState(false);
  
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

  // Check notification permissions on mount and when screen focuses
  useEffect(() => {
    checkPermissions();
  }, []);

  // Update display toggles when permissions or actual settings change
  useEffect(() => {
    // Only show toggles as enabled if:
    // 1. User has granted permissions, AND
    // 2. The setting is actually enabled
    if (hasNotificationPermissions) {
      setDisplayBudgetAlerts(budgetAlerts);
      setDisplayDailyReminders(dailyReminders);
    } else {
      // When permissions are denied, always show toggles as OFF
      setDisplayBudgetAlerts(false);
      setDisplayDailyReminders(false);
    }
  }, [hasNotificationPermissions, budgetAlerts, dailyReminders]);

  const checkPermissions = async () => {
    const hasPermissions = await checkNotificationPermissions();
    setHasNotificationPermissions(hasPermissions);
  };

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

  // Helper function to calculate total category budgets
  const calculateTotalCategoryBudget = (excludeCategory?: string): number => {
    let total = 0;
    
    Object.entries(categoryBudgets).forEach(([category, amount]) => {
      if (excludeCategory && category === excludeCategory) return;
      const numAmount = typeof amount === 'number' ? amount : parseFloat(amount as any);
      if (!isNaN(numAmount) && numAmount > 0) {
        total += numAmount;
      }
    });
    
    return total;
  };

  // Validate if new category budget would exceed monthly budget
  const wouldExceedBudget = (newAmount: number, categoryToExclude?: string): boolean => {
    const currentTotal = calculateTotalCategoryBudget(categoryToExclude);
    const newTotal = currentTotal + newAmount;
    return newTotal > monthlyBudget;
  };

  // Get remaining budget for a category
  const getRemainingBudget = (categoryToExclude?: string): number => {
    const currentTotal = calculateTotalCategoryBudget(categoryToExclude);
    return monthlyBudget - currentTotal;
  };

  const handleLogout = async () => {
    showAlert({
      title: t('profile.logoutTitle'),
      message: t('profile.logoutMessage'),
      type: 'warning',
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.logout'), 
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

  // Notification toggle handlers with permission checks
  const handleBudgetAlertsToggle = async (value: boolean) => {
    console.log('Budget alerts toggle pressed, new value:', value);
    
    // If permissions are not granted, show dialog and return
    if (!hasNotificationPermissions) {
      showPermissionDeniedDialog(async () => {
        // After returning from settings, recheck permissions
        const hasPermissions = await checkNotificationPermissions();
        setHasNotificationPermissions(hasPermissions);
        if (hasPermissions && value) {
          // If permissions now granted and user wants to enable, do it
          const success = await toggleBudgetAlerts(value);
          if (success) {
            setDisplayBudgetAlerts(value);
            showAlert({
              title: t('common.success'),
              message: value ? t('profile.budgetAlertsEnabled') : t('profile.budgetAlertsDisabled'),
              type: 'success',
            });
          }
        }
      });
      return;
    }
    
    try {
      const success = await toggleBudgetAlerts(value);
      console.log('Toggle budget alerts result:', success);
      
      if (success) {
        setDisplayBudgetAlerts(value);
        showAlert({
          title: t('common.success'),
          message: value ? t('profile.budgetAlertsEnabled') : t('profile.budgetAlertsDisabled'),
          type: 'success',
        });
      } else {
        showAlert({
          title: t('common.error'),
          message: t('profile.notificationToggleFailed'),
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error in handleBudgetAlertsToggle:', error);
      showAlert({
        title: t('common.error'),
        message: t('profile.notificationToggleError'),
        type: 'error',
      });
    }
  };

  const handleDailyRemindersToggle = async (value: boolean) => {
    console.log('Daily reminders toggle pressed, new value:', value);
    
    // If permissions are not granted, show dialog and return
    if (!hasNotificationPermissions) {
      showPermissionDeniedDialog(async () => {
        // After returning from settings, recheck permissions
        const hasPermissions = await checkNotificationPermissions();
        setHasNotificationPermissions(hasPermissions);
        if (hasPermissions && value) {
          // If permissions now granted and user wants to enable, do it
          const success = await toggleDailyReminders(value);
          if (success) {
            setDisplayDailyReminders(value);
            showAlert({
              title: t('common.success'),
              message: value ? t('profile.dailyRemindersEnabled') : t('profile.dailyRemindersDisabled'),
              type: 'success',
            });
          }
        }
      });
      return;
    }
    
    try {
      const success = await toggleDailyReminders(value);
      console.log('Toggle daily reminders result:', success);
      
      if (success) {
        setDisplayDailyReminders(value);
        showAlert({
          title: t('common.success'),
          message: value ? t('profile.dailyRemindersEnabled') : t('profile.dailyRemindersDisabled'),
          type: 'success',
        });
      } else {
        showAlert({
          title: t('common.error'),
          message: t('profile.notificationToggleFailed'),
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error in handleDailyRemindersToggle:', error);
      showAlert({
        title: t('common.error'),
        message: t('profile.notificationToggleError'),
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
      // Check if current category budgets exceed the new monthly budget
      const currentTotal = calculateTotalCategoryBudget();
      if (currentTotal > numAmount) {
        showAlert({
          title: t('profile.cannotReduceBudgetTitle'),
          message: t('profile.cannotReduceBudgetMessage', {
            total: currentTotal.toLocaleString('en-IN'),
            budget: numAmount.toLocaleString('en-IN'),
            excess: (currentTotal - numAmount).toLocaleString('en-IN'),
          }),
          type: 'warning',
          buttons: [
            { text: t('common.ok'), style: 'default' }
          ]
        });
        return;
      }
      
      const result = await setMonthlyBudget(numAmount);
      if (result.success) {
        setMonthlyModalVisible(false);
        showAlert({
          title: t('common.success'),
          message: t('profile.monthlyBudgetUpdated', { amount: numAmount.toLocaleString('en-IN') }),
          type: 'success',
        });
      } else {
        showAlert({
          title: t('common.error'),
          message: result.error || t('profile.monthlyBudgetUpdateFailed'),
          type: 'error',
        });
      }
    } else {
      showAlert({
        title: t('common.error'),
        message: t('profile.errorEnterValidAmount'),
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
      // Check if this would exceed the monthly budget
      if (wouldExceedBudget(numAmount, selectedCategory)) {
        const remaining = getRemainingBudget(selectedCategory);
        showAlert({
          title: t('profile.budgetLimitExceededTitle'),
          message: t('profile.categoryBudgetExceededMessage', {
            category: selectedCategory,
            amount: numAmount.toLocaleString('en-IN'),
            remaining: remaining.toLocaleString('en-IN'),
          }),
          type: 'warning',
          buttons: [
            { text: t('common.ok'), style: 'default' }
          ]
        });
        return;
      }
      
      const result = await setCategoryBudget(selectedCategory, numAmount);
      if (result.success) {
        setCategoryModalVisible(false);
        showAlert({
          title: t('common.success'),
          message: t('profile.categoryBudgetUpdated', {
            category: selectedCategory,
            amount: numAmount.toLocaleString('en-IN'),
          }),
          type: 'success',
        });
      } else {
        showAlert({
          title: t('common.error'),
          message: result.error || t('profile.categoryBudgetUpdateFailed'),
          type: 'error',
        });
      }
    } else {
      showAlert({
        title: t('common.error'),
        message: t('profile.errorEnterValidAmount'),
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
        title: t('common.error'),
        message: t('profile.errorEnterCategoryName'),
        type: 'error',
      });
      return;
    }

    const categoryName = newCategoryName.trim();
    
    // Check against default categories
    const defaultCategories = ['Food', 'Travel', 'Shopping', 'Health', 'Bills', 'Entertainment', 'Rent', 'Other'];
    if (defaultCategories.includes(categoryName)) {
      showAlert({
        title: t('common.error'),
        message: t('profile.errorDefaultCategory'),
        type: 'error',
      });
      return;
    }
    
    if (categoryBudgets[categoryName] || (customCategories && customCategories.some((c: any) => c.name === categoryName))) {
      showAlert({
        title: t('common.error'),
        message: t('profile.errorCategoryExists'),
        type: 'error',
      });
      return;
    }

    const budgetNum = parseFloat(newCategoryBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      showAlert({
        title: t('common.error'),
        message: t('profile.errorInvalidBudgetAmount'),
        type: 'error',
      });
      return;
    }

    // Check if adding this category would exceed monthly budget
    if (wouldExceedBudget(budgetNum)) {
      const remaining = getRemainingBudget();
      showAlert({
        title: t('profile.budgetLimitExceededTitle'),
        message: t('profile.addCategoryExceededMessage', {
          name: categoryName,
          amount: budgetNum.toLocaleString('en-IN'),
          remaining: remaining.toLocaleString('en-IN'),
        }),
        type: 'warning',
        buttons: [
          { text: t('common.ok'), style: 'default' }
        ]
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
          title: t('common.success'),
          message: t('profile.categoryAddedSuccess', { name: categoryName }),
          type: 'success',
        });
        await fetchBudget();
      } else {
        showAlert({
          title: t('common.error'),
          message: result?.error || t('profile.categoryAddFailed'),
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Error adding category:', error);
      showAlert({
        title: t('common.error'),
        message: error.message || t('profile.categoryAddError'),
        type: 'error',
      });
    } finally {
      setAddingCategory(false);
    }
  };

  const handleRemoveCustomCategory = (categoryName: string) => {
    showAlert({
      title: t('profile.removeCategoryTitle'),
      message: t('profile.removeCategoryMessage', { name: categoryName }),
      type: 'warning',
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.remove'), 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeCustomCategory(categoryName);
              if (result && result.success) {
                showAlert({
                  title: t('common.success'),
                  message: t('profile.categoryRemovedSuccess', { name: categoryName }),
                  type: 'success',
                });
                await fetchBudget();
              } else {
                showAlert({
                  title: t('common.error'),
                  message: result?.error || t('profile.categoryRemoveFailed'),
                  type: 'error',
                });
              }
            } catch (error: any) {
              showAlert({
                title: t('common.error'),
                message: error.message || t('profile.categoryRemoveError'),
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
          <Text style={styles.modalTitle}>{t('profile.chooseIcon')}</Text>
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
            <Text style={styles.closeModalBtnText}>{t('common.cancel')}</Text>
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
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textMuted }}>{t('profile.loadingBudgetData')}</Text>
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
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={styles.placeholder} />
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
        </View>

        {/* BUDGET Section */}
        <Text style={styles.sectionLabel}>{t('profile.budgetSection')}</Text>

        {/* Monthly Budget Card */}
        <TouchableOpacity style={styles.settingsCard} onPress={openMonthlyBudgetModal} activeOpacity={0.8}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#E8F8F0' }]}>
            <Text style={styles.settingsIcon}>💰</Text>
          </View>
          <Text style={styles.settingsLabel}>{t('profile.monthlyBudget')}</Text>
          <Text style={styles.settingsValue}>₹{monthlyBudget.toLocaleString('en-IN')} ›</Text>
        </TouchableOpacity>

        {/* Category Budgets Section */}
        <View style={styles.categoryHeader}>
          <Text style={styles.sectionLabel}>{t('profile.categoryBudgetsSection')}</Text>
          <TouchableOpacity onPress={openAddCategoryModal} style={styles.addCategoryBtn}>
            <Text style={styles.addCategoryBtnText}>{t('profile.addNew')}</Text>
          </TouchableOpacity>
        </View>

        {/* Display all categories */}
        <View style={styles.categoryList}>
          {Object.entries(categoryBudgets).map(([category, amount]) => {
            const isCustomCategory = customCategories && customCategories.some((c: any) => c.name === category);
            const categoryIcon = isCustomCategory 
              ? (customCategories.find((c: any) => c.name === category)?.icon || '📌')
              : getDefaultIcon(category);
            
            const isOverBudget = calculateTotalCategoryBudget() > monthlyBudget;
            
            return (
              <View key={category} style={styles.categoryItem}>
                <TouchableOpacity 
                  style={styles.categoryInfo}
                  onPress={() => openCategoryBudgetModal(category, amount as number)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{categoryIcon}</Text>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={[styles.categoryAmount, isOverBudget && styles.warningText]}>
                    ₹{(amount as number).toLocaleString('en-IN')}
                  </Text>
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
            <Text style={styles.emptyText}>{t('profile.noCategories')}</Text>
          )}
        </View>

        {/* Budget Summary */}
        <View style={[styles.summaryCard, calculateTotalCategoryBudget() > monthlyBudget && styles.warningCard]}>
          <Text style={styles.summaryTitle}>{t('profile.summaryTitle')}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('profile.totalCategoryBudgets')}</Text>
            <Text style={[styles.summaryValue, calculateTotalCategoryBudget() > monthlyBudget && styles.warningText]}>
              ₹{calculateTotalCategoryBudget().toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.summaryRow, calculateTotalCategoryBudget() > monthlyBudget && styles.warningRow]}>
            <Text style={styles.summaryLabel}>{t('profile.remaining')}</Text>
            <Text style={[styles.summaryValue, calculateTotalCategoryBudget() > monthlyBudget && styles.warningText]}>
              ₹{getRemainingBudget().toLocaleString('en-IN')}
            </Text>
          </View>
          {calculateTotalCategoryBudget() > monthlyBudget && (
            <Text style={styles.warningMessage}>
              {t('profile.exceedMessage', { amount: (calculateTotalCategoryBudget() - monthlyBudget).toLocaleString('en-IN') })}
            </Text>
          )}
        </View>

        {/* LANGUAGE Section */}
        <Text style={styles.sectionLabel}>{t('language.selectLanguage').toUpperCase()}</Text>
        <TouchableOpacity 
          style={styles.settingsCard} 
          onPress={() => setShowLangModal(true)} 
          activeOpacity={0.8}
        >
          <View style={[styles.settingsIconWrap, { backgroundColor: '#E8F8F0' }]}>
            <Text style={styles.settingsIcon}>🌐</Text>
          </View>
          <Text style={styles.settingsLabel}>{t('language.changeLanguage')}</Text>
          <Text style={styles.settingsValue}>
            {i18n.language === 'ta' ? t('language.tamil') : t('language.english')} ›
          </Text>
        </TouchableOpacity>

        {/* NOTIFICATIONS Section */}
        <Text style={styles.sectionLabel}>{t('profile.notificationsSection')}</Text>

        {/* Permission Warning */}
        {!hasNotificationPermissions && (
          <View style={styles.permissionWarning}>
            <Text style={styles.permissionWarningIcon}>🔔</Text>
            <Text style={styles.permissionWarningText}>
              {t('profile.permissionWarning')}
            </Text>
          </View>
        )}

        {/* Budget Alerts Card */}
        <View style={styles.settingsCard}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <Text style={styles.settingsIcon}>💰</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingsLabel}>{t('profile.budgetAlertsTitle')}</Text>
            <Text style={styles.settingDescription}>
              {hasNotificationPermissions 
                ? t('profile.budgetAlertsDescriptionEnabled')
                : t('profile.budgetAlertsDescriptionDisabled')}
            </Text>
          </View>
          <Switch
            value={displayBudgetAlerts}
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
            <Text style={styles.settingsLabel}>{t('profile.dailyRemindersTitle')}</Text>
            <Text style={styles.settingDescription}>
              {hasNotificationPermissions 
                ? t('profile.dailyRemindersDescriptionEnabled')
                : t('profile.dailyRemindersDescriptionDisabled')}
            </Text>
          </View>
          <Switch
            value={displayDailyReminders}
            onValueChange={handleDailyRemindersToggle}
            trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
            thumbColor={COLORS.white}
            disabled={notificationLoading}
          />
        </View>

        {/* Appearance Section */}
        <Text style={styles.sectionLabel}>{t('profile.appearanceSection')}</Text>

        {/* Dark Mode Card */}
        <View style={styles.settingsCard}>
          <View style={[styles.settingsIconWrap, { backgroundColor: '#F3EEFF' }]}>
            <Text style={styles.settingsIcon}>🌙</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingsLabel}>{t('profile.darkMode')}</Text>
            <Text style={styles.settingDescription}>{t('profile.comingSoon')}</Text>
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
        <Text style={styles.version}>{t('profile.version')}</Text>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85} disabled={logoutLoading}>
          {logoutLoading ? (
            <ActivityIndicator color={COLORS.danger} />
          ) : (
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <LanguageQuickSwitchModal
        visible={showLangModal} 
        onClose={() => setShowLangModal(false)} 
      />

      {/* Monthly Budget Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={monthlyModalVisible}
        onRequestClose={() => setMonthlyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.setMonthlyBudgetTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.setMonthlyBudgetSubtitle')}</Text>
            <TextInput
              style={styles.modalInput}
              value={tempMonthlyBudget}
              onChangeText={setTempMonthlyBudget}
              keyboardType="numeric"
              placeholder={t('profile.enterAmountPlaceholder')}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setMonthlyModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveMonthlyBudget}
              >
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
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
            <Text style={styles.modalTitle}>{t('profile.setCategoryBudgetTitle', { category: selectedCategory })}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.setCategoryBudgetSubtitle', { category: selectedCategory })}</Text>
            <Text style={styles.modalRemaining}>
              {t('profile.remainingBudgetAvailable', { amount: getRemainingBudget(selectedCategory).toLocaleString('en-IN') })}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={tempCategoryBudget}
              onChangeText={setTempCategoryBudget}
              keyboardType="numeric"
              placeholder={t('profile.enterAmountPlaceholder')}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveCategoryBudget}
              >
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Custom Category Modal */}
      {/* Add Custom Category Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={addCategoryModalVisible}
  onRequestClose={() => setAddCategoryModalVisible(false)}
>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
  >
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { maxHeight: '85%' }]}>
        <Text style={styles.modalTitle}>{t('profile.addCustomCategoryTitle')}</Text>
        
        {/* Wrap everything except buttons in ScrollView */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"  // ← KEY FIX for Samsung
        >
          <Text style={styles.modalLabel}>{t('profile.categoryNameLabel')}</Text>
          <TextInput
            style={styles.modalInput}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            placeholder={t('profile.categoryNamePlaceholder')}
            placeholderTextColor="#999"
          />
          
          <Text style={styles.modalLabel}>{t('profile.categoryIconLabel')}</Text>
          <TouchableOpacity
            style={styles.iconPickerBtn}
            onPress={() => setShowIconPicker(true)}
          >
            <Text style={styles.iconPickerText}>{newCategoryIcon}</Text>
            <Text style={styles.iconPickerChange}>{t('profile.change')}</Text>
          </TouchableOpacity>
          
          <Text style={styles.modalLabel}>{t('profile.monthlyBudgetFieldLabel')}</Text>
          <Text style={styles.modalRemaining}>
            {t('profile.remainingBudgetAvailable', { amount: getRemainingBudget().toLocaleString('en-IN') })}
          </Text>
          <TextInput
            style={styles.modalInput}
            value={newCategoryBudget}
            onChangeText={setNewCategoryBudget}
            keyboardType="numeric"
            placeholder={t('profile.enterBudgetPlaceholder')}
            placeholderTextColor="#999"
          />
        </ScrollView>

        {/* Buttons OUTSIDE ScrollView so they're always visible */}
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setAddCategoryModalVisible(false)}
            disabled={addingCategory}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleAddCustomCategory}
            disabled={addingCategory}
          >
            {addingCategory ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>{t('profile.addCategory')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </KeyboardAvoidingView>
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
  justifyContent: 'center',      // ← keep this
  alignItems: 'center',
  padding: 20,                   // ← add padding so modal doesn't touch edges
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
  modalRemaining: {
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
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
  summaryCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  warningCard: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  warningRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.danger,
    marginTop: 8,
    paddingTop: 8,
  },
  warningText: {
    color: COLORS.danger,
  },
  warningMessage: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 8,
    textAlign: 'center',
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
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