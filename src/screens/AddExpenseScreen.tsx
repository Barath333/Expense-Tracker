import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/TabNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTranslation } from 'react-i18next';
import { uploadReceipt } from '../services/firebase/storageService';
import { addExpense } from '../services/firebase/expenseService';
import { useExpenseStore } from '../services/stores/expenseStore';
import { initializeNotifications, showBudgetAlert, showCategoryBudgetAlert } from '../services/notificationService';
import { getMonthlyBudget } from '../services/firebase/budgetService';
import { useUserStore } from '../services/stores/userStore';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, startOfWeek, endOfWeek, addDays, isToday } from 'date-fns';
import { useAlertStore } from '../services/stores/alertStore';

type Props = BottomTabScreenProps<TabParamList, 'Add'>;

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
};

// Default categories (keep English IDs for logic, labels will be translated)
const DEFAULT_CATEGORIES = [
  { id: 'Food', icon: '🍔', labelKey: 'categories.Food' },
  { id: 'Travel', icon: '🚕', labelKey: 'categories.Travel' },
  { id: 'Shopping', icon: '🛒', labelKey: 'categories.Shopping' },
  { id: 'Health', icon: '💊', labelKey: 'categories.Health' },
  { id: 'Bills', icon: '📱', labelKey: 'categories.Bills' },
  { id: 'Entertainment', icon: '🎬', labelKey: 'categories.Entertainment' },
  { id: 'Rent', icon: '🏠', labelKey: 'categories.Rent' },
  { id: 'Other', icon: '💰', labelKey: 'categories.Other' },
];

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 32 - 30) / 4;
const CALENDAR_DAY_SIZE = (width - 48) / 7;

export default function AddExpenseScreen({ navigation }: Props) {
  const { t } = useTranslation();
  
  // ========== ALL useState Hooks First ==========
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState(DEFAULT_CATEGORIES);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  
  // ========== Refs ==========
  const scrollViewRef = useRef<ScrollView>(null);
  const noteInputRef = useRef<TextInput>(null);
  
  // ========== ALL Store Hooks Next ==========
  const { addExpenseToStore } = useExpenseStore();
  const { categoryBudgets, customCategories, fetchBudget } = useUserStore();
  const { showAlert } = useAlertStore();
  
  // ========== ALL useCallback Hooks Next ==========
  const loadCategories = useCallback(async () => {
    try {
      await fetchBudget();
      const customCats = (customCategories || []).map((cat: any) => ({
        id: cat.name,
        icon: cat.icon || '📌',
        labelKey: cat.name, // custom categories use name as key (no translation fallback)
        isCustom: true
      }));
      setAllCategories([...DEFAULT_CATEGORIES, ...customCats]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, [customCategories, fetchBudget]);

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday first
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    setCalendarDays(days);
  }, [currentMonth]);

  // ========== ALL useEffect Hooks Next ==========
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    if (calendarVisible) {
      generateCalendarDays();
    }
  }, [calendarVisible, currentMonth, generateCalendarDays]);

  // ========== Helper Functions ==========
  const formatDateDisplay = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCalendarVisible(false);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleTodayPress = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
    setCalendarVisible(false);
  };

  const handleNoteFocus = () => {
    setTimeout(() => {
      noteInputRef.current?.measureLayout(
        scrollViewRef.current?.getInnerViewNode?.() as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
        },
        () => {
          // fallback
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      );
    }, 300);
  };

  const handleImagePick = (type: 'camera' | 'gallery') => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    };

    const onResponse = async (response: any) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        showAlert({
          title: t('common.error'),
          message: t('addExpense.imagePickError', { error: response.error }),
          type: 'error',
        });
      } else if (response.assets && response.assets[0]) {
        const uri = response.assets[0].uri;
        if (uri) {
          setReceiptUri(uri);
          showAlert({
            title: t('addExpense.imagePickSuccessTitle'),
            message: t('addExpense.imagePickSuccessMessage'),
            type: 'success',
          });
        }
      }
    };

    if (type === 'camera') {
      launchCamera(options, onResponse);
    } else {
      launchImageLibrary(options, onResponse);
    }
  };

  const checkBudgetAndSendNotifications = async (userId: string, selectedCat: string) => {
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const snapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('expenses')
        .where('date', '>=', firestore.Timestamp.fromDate(monthStart))
        .where('date', '<=', firestore.Timestamp.fromDate(monthEnd))
        .get();
      
      const monthExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      const { monthlyBudget, categoryBudgets: budgets } = await getMonthlyBudget();
      const percentageSpent = (totalSpent / monthlyBudget) * 100;
      
      if (percentageSpent >= 80) {
        await showBudgetAlert(percentageSpent, totalSpent, monthlyBudget);
      }
      
      const categoryBudget = budgets[selectedCat] || 0;
      if (categoryBudget > 0) {
        const categoryTotal = monthExpenses
          .filter(e => e.category === selectedCat)
          .reduce((sum, e) => sum + e.amount, 0);
        const categoryPercentage = (categoryTotal / categoryBudget) * 100;
        if (categoryPercentage >= 80) {
          await showCategoryBudgetAlert(selectedCat, categoryTotal, categoryBudget, categoryPercentage);
        }
      }
    } catch (error) {
      console.error('Error checking budget notifications:', error);
    }
  };

  const removeReceipt = () => {
    showAlert({
      title: t('addExpense.removeReceiptTitle'),
      message: t('addExpense.removeReceiptMessage'),
      type: 'warning',
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.remove'), style: 'destructive', onPress: () => setReceiptUri(null) }
      ]
    });
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showAlert({
        title: t('addExpense.invalidAmountTitle'),
        message: t('addExpense.invalidAmountMessage'),
        type: 'error',
      });
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      showAlert({
        title: t('addExpense.loginRequiredTitle'),
        message: t('addExpense.loginRequiredMessage'),
        type: 'error',
        buttons: [
          { text: t('common.ok'), onPress: () => navigation.navigate('Login') }
        ]
      });
      return;
    }

    const amountNum = parseFloat(amount);
    setSaving(true);
    let receiptUrl = null;

    try {
      if (receiptUri) {
        setUploading(true);
        receiptUrl = await uploadReceipt(receiptUri);
        setUploading(false);
        
        if (!receiptUrl) {
          showAlert({
            title: t('addExpense.uploadFailedTitle'),
            message: t('addExpense.uploadFailedMessage'),
            type: 'warning',
          });
        }
      }

      const expenseData = {
        amount: amountNum,
        category: selectedCategory,
        note: note.trim() || t('addExpense.defaultNote', { category: t(`categories.${selectedCategory}`, selectedCategory) }),
        date: selectedDate,
        receiptUrl: receiptUrl || undefined,
      };

      const result = await addExpense(expenseData);

      if (result && result.id) {
        await checkBudgetAndSendNotifications(user.uid, selectedCategory);
        
        setAmount('');
        setNote('');
        setReceiptUri(null);
        setSelectedCategory('Food');
        setSelectedDate(new Date());
        
        showAlert({
          title: t('addExpense.successTitle'),
          message: t('addExpense.successMessage', { amount: amountNum.toLocaleString('en-IN') }),
          type: 'success',
          buttons: [
            {
              text: t('common.ok'),
              style: 'default',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        });
        
        setSaving(false);
        setUploading(false);
        return;
      } else {
        showAlert({
          title: t('addExpense.errorTitle'),
          message: result?.error || t('addExpense.errorSaveFailed'),
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Error saving expense:', error);
      showAlert({
        title: t('addExpense.errorTitle'),
        message: error.message || t('addExpense.errorUnexpected'),
        type: 'error',
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // Calendar Component
  const renderCalendar = () => {
    const weekDays = [
      t('addExpense.calendar.weekDays.sun'),
      t('addExpense.calendar.weekDays.mon'),
      t('addExpense.calendar.weekDays.tue'),
      t('addExpense.calendar.weekDays.wed'),
      t('addExpense.calendar.weekDays.thu'),
      t('addExpense.calendar.weekDays.fri'),
      t('addExpense.calendar.weekDays.sat'),
    ];
    
    return (
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCalendarVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarTitle}>{t('addExpense.calendar.selectDate')}</Text>
                  <TouchableOpacity 
                    onPress={() => setCalendarVisible(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.monthNavigation}>
                  <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
                    <Text style={styles.navButtonText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.monthTitle}>
                    {format(currentMonth, 'MMMM yyyy')}
                  </Text>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                    <Text style={styles.navButtonText}>→</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.weekDaysRow}>
                  {weekDays.map((day, index) => (
                    <View key={index} style={styles.weekDayCell}>
                      <Text style={styles.weekDayText}>{day}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.calendarDaysGrid}>
                  {calendarDays.map((day, index) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelected = isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarDayCell,
                          !isCurrentMonth && styles.otherMonthDay,
                          isSelected && styles.selectedDay,
                          isTodayDate && styles.todayDay,
                        ]}
                        onPress={() => handleDateSelect(day)}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            !isCurrentMonth && styles.otherMonthText,
                            isSelected && styles.selectedDayText,
                            isTodayDate && styles.todayDayText,
                          ]}
                        >
                          {format(day, 'd')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity style={styles.todayButton} onPress={handleTodayPress}>
                  <Text style={styles.todayButtonText}>{t('addExpense.calendar.today')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Helper to get translated category label
  const getCategoryLabel = (cat: any) => {
    if (cat.labelKey && cat.labelKey.startsWith('categories.')) {
      return t(cat.labelKey);
    }
    // Custom category – use the name as is (they are user-defined, but we still translate if possible)
    return t(`categories.${cat.id}`, cat.id);
  };

  // ========== Render Component ==========
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('addExpense.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            keyboardDismissMode="interactive"
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          >
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>{t('addExpense.amountLabel')}</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#C0D9CC"
                autoFocus
                cursorColor={COLORS.primary}
                selectionColor={COLORS.primary}
              />
            </View>

            <Text style={styles.sectionLabel}>{t('addExpense.category')}</Text>
            <View style={styles.categoryGrid}>
              {allCategories.map(cat => {
                const selected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryItem, selected && styles.categoryItemSelected]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                      {getCategoryLabel(cat).length > 10 ? getCategoryLabel(cat).substring(0, 8) + '...' : getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.dateRow} onPress={() => setCalendarVisible(true)} activeOpacity={0.8}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>{formatDateDisplay(selectedDate)}</Text>
              <Text style={styles.dateChevron}>›</Text>
            </TouchableOpacity>

            {/* Uncomment receipt section if needed */}
            {/* 
            <View style={styles.receiptSection}>
              <Text style={styles.sectionLabel}>{t('addExpense.receiptOptional')}</Text>
              <View style={styles.receiptButtons}>
                <TouchableOpacity 
                  style={styles.receiptBtn} 
                  onPress={() => handleImagePick('camera')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.receiptBtnIcon}>📷</Text>
                  <Text style={styles.receiptBtnText}>{t('addExpense.camera')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.receiptBtn} 
                  onPress={() => handleImagePick('gallery')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.receiptBtnIcon}>🖼️</Text>
                  <Text style={styles.receiptBtnText}>{t('addExpense.gallery')}</Text>
                </TouchableOpacity>
              </View>
              
              {receiptUri && (
                <View style={styles.receiptPreview}>
                  <Text style={styles.receiptPreviewText}>{t('addExpense.receiptAttached')}</Text>
                  <TouchableOpacity onPress={removeReceipt} style={styles.removeReceiptBtn}>
                    <Text style={styles.removeReceiptText}>{t('addExpense.remove')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            */}

            <View style={styles.noteWrapper}>
              <TextInput
                ref={noteInputRef}
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder={t('addExpense.notePlaceholder')}
                placeholderTextColor={COLORS.textMuted}
                multiline
                maxLength={200}
                onFocus={handleNoteFocus}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, (saving || uploading) && styles.saveBtnDisabled]} 
              onPress={handleSave} 
              activeOpacity={0.85}
              disabled={saving || uploading}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>{t('addExpense.saveExpense')}</Text>
              )}
            </TouchableOpacity>
            
            {/* Add extra padding at bottom for better keyboard experience */}
            <View style={{ height: Platform.OS === 'ios' ? 20 : 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {renderCalendar()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: COLORS.primary,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { color: COLORS.white, fontSize: 20, fontWeight: '600' },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  content: { backgroundColor: COLORS.bg, padding: 16, paddingBottom: 40 },
  amountCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  amountLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
  amountInput: { fontSize: 56, fontWeight: '800', color: COLORS.primaryDark, padding: 0, textAlign: 'center', minWidth: 80 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  categoryItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryItemSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  categoryIcon: { fontSize: 24 },
  categoryLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500', textAlign: 'center' },
  categoryLabelSelected: { color: COLORS.primary, fontWeight: '700' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    elevation: 1,
  },
  dateIcon: { fontSize: 20 },
  dateText: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  dateChevron: { fontSize: 22, color: COLORS.textMuted, fontWeight: '400' },
  receiptSection: {
    marginBottom: 12,
  },
  receiptButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  receiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  receiptBtnIcon: { fontSize: 20 },
  receiptBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  receiptPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  receiptPreviewText: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '500' },
  removeReceiptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
  },
  removeReceiptText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  noteWrapper: { marginBottom: 12 },
  noteInput: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  // Calendar Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayCell: {
    width: CALENDAR_DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: CALENDAR_DAY_SIZE,
    height: CALENDAR_DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CALENDAR_DAY_SIZE / 2,
  },
  otherMonthDay: {
    opacity: 0.4,
  },
  selectedDay: {
    backgroundColor: COLORS.primary,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  otherMonthText: {
    color: COLORS.textMuted,
  },
  selectedDayText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  todayDayText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  todayButton: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  todayButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});