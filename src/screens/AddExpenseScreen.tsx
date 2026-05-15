import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/TabNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { uploadReceipt } from '../services/firebase/storageService';
import { addExpense } from '../services/firebase/expenseService';
import { useExpenseStore } from '../services/stores/expenseStore';
import { initializeNotifications, showBudgetAlert, showCategoryBudgetAlert } from '../services/notificationService';
import { getMonthlyBudget } from '../services/firebase/budgetService';

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

const CATEGORIES = [
  { id: 'Food', icon: '🍔', label: 'Food' },
  { id: 'Travel', icon: '🚕', label: 'Travel' },
  { id: 'Shopping', icon: '🛒', label: 'Shopping' },
  { id: 'Health', icon: '💊', label: 'Health' },
  { id: 'Bills', icon: '📱', label: 'Bills' },
  { id: 'Entertainment', icon: '🎬', label: 'Entertainment' },
  { id: 'Rent', icon: '🏠', label: 'Rent' },
  { id: 'Other', icon: '···', label: 'Other' },
];

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 32 - 30) / 4;

export default function AddExpenseScreen({ navigation }: Props) {
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { addExpenseToStore } = useExpenseStore();

  useEffect(() => {
    initializeNotifications();
  }, []);

  const dateStr = selectedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });

  const handleDateChange = () => {
    Alert.alert(
      'Select Date',
      'Choose a date for this expense',
      [
        { text: 'Today', onPress: () => setSelectedDate(new Date()) },
        { text: 'Yesterday', onPress: () => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          setSelectedDate(yesterday);
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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
        Alert.alert('Error', 'Failed to pick image: ' + response.error);
      } else if (response.assets && response.assets[0]) {
        const uri = response.assets[0].uri;
        if (uri) {
          setReceiptUri(uri);
          Alert.alert('Success', 'Receipt attached successfully!');
        }
      }
    };

    if (type === 'camera') {
      launchCamera(options, onResponse);
    } else {
      launchImageLibrary(options, onResponse);
    }
  };

  // Function to check and send notifications after expense is saved
  const checkBudgetAndSendNotifications = async (userId: string, selectedCat: string) => {
    try {
      // Get current month start and end
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);
      
      // Get all expenses for current month
      const snapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('expenses')
        .where('date', '>=', firestore.Timestamp.fromDate(monthStart))
        .where('date', '<=', firestore.Timestamp.fromDate(monthEnd))
        .get();
      
      const monthExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Get monthly budget
      const { monthlyBudget, categoryBudgets } = await getMonthlyBudget();
      const percentageSpent = (totalSpent / monthlyBudget) * 100;
      
      // Check and send monthly budget alert
      if (percentageSpent >= 80) {
        await showBudgetAlert(percentageSpent, totalSpent, monthlyBudget);
      }
      
      // Check category budget
      const categoryBudget = categoryBudgets[selectedCat] || 0;
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

  const handleSave = async () => {
    console.log('========== HANDLE SAVE STARTED ==========');
    console.log('1. Amount value:', amount);
    console.log('2. Selected category:', selectedCategory);
    console.log('3. Note:', note);
    console.log('4. Date:', selectedDate);
    console.log('5. Receipt URI:', receiptUri);
    
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      console.log('Validation failed: Invalid amount');
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }

    // Check if user is logged in
    const user = auth().currentUser;
    console.log('6. Current user:', user?.email || 'No user');
    
    if (!user) {
      console.log('Validation failed: No user logged in');
      Alert.alert('Error', 'You must be logged in to add expenses.');
      navigation.navigate('Login');
      return;
    }

    const amountNum = parseFloat(amount);
    console.log('7. Parsed amount:', amountNum);
    
    setSaving(true);
    console.log('8. Saving state set to true');
    
    let receiptUrl = null;

    try {
      // Upload receipt if exists
      if (receiptUri) {
        console.log('9. Starting receipt upload...');
        setUploading(true);
        receiptUrl = await uploadReceipt(receiptUri);
        setUploading(false);
        console.log('10. Receipt upload result:', receiptUrl);
        
        if (!receiptUrl) {
          console.log('11. Upload failed, continuing without receipt');
          Alert.alert('Upload Failed', 'Failed to upload receipt. Expense will be saved without receipt.');
        }
      } else {
        console.log('9. No receipt to upload');
      }

      // Prepare expense data
      const expenseData = {
        amount: amountNum,
        category: selectedCategory,
        note: note.trim() || `${selectedCategory} expense`,
        date: selectedDate,
        receiptUrl: receiptUrl || undefined,
      };

      console.log('11. Expense data prepared:', JSON.stringify(expenseData, null, 2));

      // Save expense to Firebase
      console.log('12. Calling addExpense function...');
      const result = await addExpense(expenseData);
      console.log('13. addExpense result:', JSON.stringify(result, null, 2));

      if (result && result.id) {
        console.log('14. SUCCESS! Expense saved with ID:', result.id);
        
        // Check budgets and send notifications
        await checkBudgetAndSendNotifications(user.uid, selectedCategory);
        
        // Reset form first
        console.log('15. Resetting form...');
        setAmount('');
        setNote('');
        setReceiptUri(null);
        setSelectedCategory('Food');
        setSelectedDate(new Date());
        
        // Show success alert
        console.log('16. Showing success alert');
        Alert.alert(
          'Success! 🎉',
          `₹${amountNum.toLocaleString('en-IN')} expense added successfully.`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                console.log('17. OK pressed, navigating to Home');
                navigation.navigate('Home');
                console.log('18. Navigation complete');
              }
            }
          ]
        );
        console.log('19. Alert displayed');
      } else {
        console.error('20. ERROR: Save failed, result.id is null or undefined');
        console.error('21. Error details:', result?.error);
        Alert.alert('Error', result?.error || 'Failed to save expense. Please try again.');
      }
    } catch (error: any) {
      console.error('22. CATCH BLOCK - Unexpected error:', error);
      console.error('23. Error message:', error.message);
      console.error('24. Error stack:', error.stack);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      console.log('25. Finally block - Setting saving to false');
      setSaving(false);
      setUploading(false);
      console.log('26. Saving state set to false');
      console.log('========== HANDLE SAVE FINISHED ==========');
    }
  };

  const removeReceipt = () => {
    Alert.alert(
      'Remove Receipt',
      'Are you sure you want to remove the attached receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setReceiptUri(null) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>AMOUNT (₹)</Text>
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

        <Text style={styles.sectionLabel}>CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => {
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
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.dateRow} onPress={handleDateChange} activeOpacity={0.8}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.dateChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.noteWrapper}>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="✏️  Add a note (optional)..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={200}
          />
        </View>

        {/* <Text style={styles.sectionLabel}>RECEIPT (OPTIONAL)</Text>
        
        {receiptUri ? (
          <View style={styles.receiptPreview}>
            <Text style={styles.receiptPreviewIcon}>📋</Text>
            <View style={styles.receiptPreviewInfo}>
              <Text style={styles.receiptPreviewTitle}>Receipt attached</Text>
              <Text style={styles.receiptPreviewPath}>
                {receiptUri.substring(receiptUri.lastIndexOf('/') + 1)}
              </Text>
            </View>
            <TouchableOpacity onPress={removeReceipt} style={styles.removeReceiptBtn}>
              <Text style={styles.removeReceiptText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.attachRow}>
            <TouchableOpacity 
              style={styles.attachBtn} 
              onPress={() => handleImagePick('camera')}
              activeOpacity={0.8}
            >
              <Text style={styles.attachIcon}>📷</Text>
              <Text style={styles.attachLabel}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.attachBtn} 
              onPress={() => handleImagePick('gallery')}
              activeOpacity={0.8}
            >
              <Text style={styles.attachIcon}>🖼️</Text>
              <Text style={styles.attachLabel}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {uploading && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.uploadingText}>Uploading receipt...</Text>
          </View>
        )} */}

        <TouchableOpacity 
          style={[styles.saveBtn, (saving || uploading) && styles.saveBtnDisabled]} 
          onPress={handleSave} 
          activeOpacity={0.85}
          disabled={saving || uploading}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Expense</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
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
  attachRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  attachBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  attachIcon: { fontSize: 26 },
  attachLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  receiptPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
    gap: 12,
  },
  receiptPreviewIcon: { fontSize: 28 },
  receiptPreviewInfo: { flex: 1 },
  receiptPreviewTitle: { fontSize: 14, fontWeight: '600', color: COLORS.primaryDark },
  receiptPreviewPath: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  removeReceiptBtn: { padding: 8 },
  removeReceiptText: { fontSize: 20 },
  uploadingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, padding: 10 },
  uploadingText: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '500' },
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
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});