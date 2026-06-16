import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { useExpenseStore } from '../services/stores/expenseStore';
import { deleteExpense, updateExpense } from '../services/firebase/expenseService';
import { useUserStore } from '../services/stores/userStore';
import { useAlertStore } from '../services/stores/alertStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  warning: '#F59E0B',
};

// Base filter categories (keep English for logic, display will be translated)
const FILTERS = ['All', 'Food', 'Travel', 'Shopping', 'Health', 'Bills', 'Entertainment', 'Rent'];

// Category icons mapping
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    Food: '🍔',
    Travel: '🚕',
    Shopping: '🛒',
    Health: '💊',
    Bills: '📱',
    Entertainment: '🎬',
    Rent: '🏠',
    Other: '💰',
    Subscription: '📱',
  };
  return icons[category] || '💰';
};

// Format time (remains unchanged)
const formatTime = (date: any): string => {
  if (!date) return '';
  
  let dateObj: Date;
  if (date.toDate) {
    dateObj = date.toDate();
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    dateObj = new Date(date);
  }
  
  return dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: any;
  receiptUrl?: string;
}

interface Section {
  date: string;
  data: Expense[];
}

export default function HistoryScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { expenses, loading, deleteExpense: deleteFromStore, updateExpense: updateExpenseInStore } = useExpenseStore();
  const { fetchBudget } = useUserStore();
  const { showAlert } = useAlertStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to format date with translation
  const formatDate = (date: any): string => {
    if (!date) return 'Unknown';
    
    let dateObj: Date;
    if (date.toDate) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase();
    
    if (dateObj.toDateString() === today.toDateString()) {
      return t('history.dateToday', { date: formattedDate });
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return t('history.dateYesterday', { date: formattedDate });
    } else {
      return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    }
  };

  // Filter expenses based on search and category
  const filtered = expenses.filter(exp => {
    const searchText = (exp.note || exp.category).toLowerCase();
    const matchSearch = searchText.includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || exp.category === activeFilter;
    return matchSearch && matchFilter;
  });

  // Group expenses by date
  const groupedMap: { [dateKey: string]: Expense[] } = {};
  filtered.forEach(exp => {
    const dateKey = formatDate(exp.date);
    if (!groupedMap[dateKey]) groupedMap[dateKey] = [];
    groupedMap[dateKey].push(exp);
  });

  const sections: Section[] = Object.keys(groupedMap).map(date => ({
    date,
    data: groupedMap[date],
  }));

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);

  // Handle delete with confirmation
  const handleDelete = (expenseId: string, expenseNote: string) => {
    showAlert({
      title: t('history.deleteTitle'),
      message: t('history.deleteMessage', { note: expenseNote }),
      type: 'warning',
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteExpense(expenseId);
            if (error) {
              showAlert({
                title: t('common.error'),
                message: t('history.deleteErrorMessage'),
                type: 'error',
              });
            } else {
              deleteFromStore(expenseId);
              await fetchBudget();
              showAlert({
                title: t('common.success'),
                message: t('history.deleteSuccessMessage'),
                type: 'success',
              });
            }
          }
        }
      ]
    });
  };

  // Handle edit
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditNote(expense.note);
    setEditCategory(expense.category);
  };

  const handleSaveEdit = async () => {
    if (!editingExpense || isSaving) return;

    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showAlert({ 
        title: t('common.error'), 
        message: t('history.editErrorInvalidAmount'), 
        type: 'error' 
      });
      return;
    }

    setIsSaving(true);

    const updatedExpense = {
      amount: amountNum,
      category: editCategory,
      note: editNote.trim() || t('addExpense.defaultNote', { category: editCategory }),
    };

    const { error } = await updateExpense(editingExpense.id, updatedExpense);

    if (error) {
      setIsSaving(false);
      showAlert({ 
        title: t('common.error'), 
        message: t('history.editErrorFailed'), 
        type: 'error' 
      });
      return;
    }

    updateExpenseInStore(editingExpense.id, updatedExpense);

    setEditingExpense(null);
    setEditAmount('');
    setEditNote('');
    setEditCategory('');
    setIsSaving(false);

    fetchBudget();
    setTimeout(() => {
      showAlert({ 
        title: t('common.success'), 
        message: t('history.editSuccessMessage'), 
        type: 'success' 
      });
    }, 100);
  };

  // Render right swipe actions (delete)
  const renderRightActions = (progress: any, dragX: any, expense: Expense) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });
    
    return (
      <Animated.View style={[styles.swipeAction, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity
          style={[styles.swipeButton, styles.swipeDelete]}
          onPress={() => handleDelete(expense.id, expense.note)}
          activeOpacity={0.8}
        >
          <Text style={styles.swipeButtonText}>{t('history.swipeDelete')}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}>
      <View style={styles.expenseItem}>
        <View style={styles.expenseIconWrap}>
          <Text style={styles.expenseIcon}>{getCategoryIcon(item.category)}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <View style={styles.expenseTitleRow}>
            <Text style={styles.expenseTitle}>{item.note || t(`categories.${item.category}`, item.category)}</Text>
            {item.receiptUrl && (
              <View style={styles.receiptBadge}>
                <Text style={styles.receiptText}>{t('history.receiptBadge')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.expenseMeta}>
            {t(`categories.${item.category}`, item.category)} · {formatTime(item.date)}
          </Text>
        </View>
        <View style={styles.expenseActions}>
          <Text style={styles.expenseAmount}>-₹{item.amount.toLocaleString('en-IN')}</Text>
          <View style={styles.actionIcons}>
            <TouchableOpacity 
              onPress={() => handleEdit(item)} 
              style={styles.actionIcon}
              activeOpacity={0.7}
            >
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDelete(item.id, item.note)} 
              style={styles.actionIcon}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Swipeable>
  );

  const renderSection = ({ item }: { item: Section }) => (
    <View>
      <Text style={styles.dateHeader}>{item.date}</Text>
      {item.data.map(exp => (
        <View key={exp.id}>
          {renderExpenseItem({ item: exp })}
        </View>
      ))}
    </View>
  );

  // Edit Modal
  const renderEditModal = () => {
    if (!editingExpense || isSaving) return null;

    const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Health', 'Bills', 'Entertainment', 'Rent', 'Other'];

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('history.editExpense')}</Text>
          
          <Text style={styles.modalLabel}>{t('history.amountLabel')}</Text>
          <TextInput
            style={styles.modalInput}
            value={editAmount}
            onChangeText={setEditAmount}
            keyboardType="numeric"
            placeholder={t('history.amountPlaceholder')}
          />
          
          <Text style={styles.modalLabel}>{t('history.categoryLabel')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, editCategory === cat && styles.categoryChipActive]}
                onPress={() => setEditCategory(cat)}
              >
                <Text style={[styles.categoryChipText, editCategory === cat && styles.categoryChipTextActive]}>
                  {t(`categories.${cat}`, cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.modalLabel}>{t('history.noteLabel')}</Text>
          <TextInput
            style={[styles.modalInput, styles.modalTextArea]}
            value={editNote}
            onChangeText={setEditNote}
            placeholder={t('history.notePlaceholder')}
            multiline
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setEditingExpense(null)}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleSaveEdit}
            >
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && expenses.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('history.title')}</Text>
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('history.totalExpenses', { count: expenses.length })}
        </Text>
      </View>
      <View style={styles.container}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t('history.searchPlaceholder')}
            placeholderTextColor={COLORS.textMuted}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f === 'All' ? t('categories.allWithIcon') : t(`categories.${f}`, f)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlashList
          data={sections}
          keyExtractor={(item) => item.date}
          renderItem={renderSection}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>
                {search || activeFilter !== 'All' 
                  ? t('history.emptyFiltered')
                  : t('history.emptyAll')}
              </Text>
            </View>
          }
          estimatedItemSize={100}
        />

        {filtered.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>
              {activeFilter !== 'All' 
                ? t('history.filteredTotal', { filter: t(`categories.${activeFilter}`, activeFilter) })
                : t('history.totalLabel')}
            </Text>
            <Text style={styles.footerAmount}>₹{totalFiltered.toLocaleString('en-IN')}</Text>
          </View>
        )}
      </View>
      
      {/* Edit Modal */}
      {renderEditModal()}
    </SafeAreaView>
  );
}

// Styles remain exactly the same as original
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 12, 
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { 
    color: COLORS.white, 
    fontSize: 24, 
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
  },
  container: { 
    flex: 1, 
    backgroundColor: COLORS.bg, 
    padding: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  clearIcon: { 
    fontSize: 16, 
    color: COLORS.textMuted,
    padding: 4,
  },
  filterScroll: { 
    marginBottom: 14,
    flexGrow: 0,
  },
  filterContent: {
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterChipActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary,
  },
  filterText: { 
    color: COLORS.textMuted, 
    fontWeight: '500', 
    fontSize: 13,
  },
  filterTextActive: { 
    color: COLORS.white, 
    fontWeight: '700',
  },
  dateHeader: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: COLORS.textMuted, 
    marginVertical: 8,
    letterSpacing: 0.5,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  expenseIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  expenseIcon: { fontSize: 22 },
  expenseInfo: { flex: 1 },
  expenseTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  expenseTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: COLORS.text,
  },
  receiptBadge: { 
    backgroundColor: COLORS.primaryLight, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6,
  },
  receiptText: { 
    fontSize: 10, 
    color: COLORS.primary, 
    fontWeight: '600',
  },
  expenseMeta: { 
    fontSize: 12, 
    color: COLORS.textMuted,
  },
  expenseActions: {
    alignItems: 'flex-end',
  },
  expenseAmount: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.danger,
    marginBottom: 4,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    padding: 4,
  },
  editIcon: {
    fontSize: 16,
    color: COLORS.primary,
  },
  deleteIcon: {
    fontSize: 16,
    color: COLORS.danger,
  },
  swipeAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  swipeButton: {
    flex: 1,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  swipeDelete: {
    backgroundColor: COLORS.danger,
  },
  swipeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  footerLabel: { 
    color: 'rgba(255,255,255,0.9)', 
    fontSize: 14, 
    fontWeight: '500',
  },
  footerAmount: { 
    color: COLORS.white, 
    fontSize: 18, 
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: { 
    textAlign: 'center', 
    fontSize: 14, 
    color: COLORS.textMuted,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  // Edit Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: SCREEN_WIDTH - 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 5,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  modalTextArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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