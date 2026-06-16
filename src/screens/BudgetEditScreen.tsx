import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../services/stores/userStore';
import { useAlertStore } from '../services/stores/alertStore';

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

export default function BudgetEditScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { monthlyBudget, categoryBudgets, setMonthlyBudget, setCategoryBudget, loading } = useUserStore();
  const [editMonthly, setEditMonthly] = useState(monthlyBudget.toString());
  const [editCategories, setEditCategories] = useState<Record<string, string>>(
    Object.keys(categoryBudgets).reduce((acc, cat) => ({
      ...acc,
      [cat]: categoryBudgets[cat].toString()
    }), {})
  );
  const [saving, setSaving] = useState(false);

  const { showAlert } = useAlertStore();

  const updateCategory = (category: string, value: string) => {
    setEditCategories(prev => ({ ...prev, [category]: value }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    
    // Validate monthly budget
    const monthlyNum = parseFloat(editMonthly);
    if (isNaN(monthlyNum) || monthlyNum <= 0) {
      showAlert({
        title: t('budget.invalidBudgetTitle'),
        message: t('budget.invalidBudgetMessage'),
        type: 'error',
      });
      setSaving(false);
      return;
    }
    
    try {
      // Save monthly budget
      await setMonthlyBudget(monthlyNum);
      
      // Save all category budgets
      for (const [category, amount] of Object.entries(editCategories)) {
        const amountNum = parseFloat(amount);
        if (!isNaN(amountNum) && amountNum >= 0) {
          await setCategoryBudget(category, amountNum);
        }
      }
      
      showAlert({
        title: t('common.success'),
        message: t('budget.saveSuccessMessage'),
        type: 'success',
        onDismiss: () => navigation.goBack(),
      });
    } catch (error: any) {
      console.error('Error saving budgets:', error);
      showAlert({
        title: t('common.error'),
        message: t('budget.saveErrorMessage'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const totalCategoryBudget = Object.values(editCategories).reduce(
    (sum, val) => sum + (parseFloat(val) || 0), 0
  );
  const monthlyNum = parseFloat(editMonthly) || 0;
  const remaining = monthlyNum - totalCategoryBudget;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('budget.editTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Monthly Budget */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('budget.monthlyBudgetCard')}</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencySymbol}>{t('common.rupeeSymbol')}</Text>
            <TextInput
              style={styles.input}
              value={editMonthly}
              onChangeText={setEditMonthly}
              keyboardType="numeric"
              placeholder={t('budget.monthlyBudgetPlaceholder')}
            />
          </View>
        </View>

        {/* Category Budgets */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('budget.categoryBudgetsCard')}</Text>
          {Object.entries(editCategories).map(([category, amount]) => (
            <View key={category} style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>{t(`categories.${category}`, category)}</Text>
              <View style={styles.categoryInputWrapper}>
                <Text style={styles.currencySymbol}>{t('common.rupeeSymbol')}</Text>
                <TextInput
                  style={styles.categoryInput}
                  value={amount}
                  onChangeText={(val) => updateCategory(category, val)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.summaryTitle}>{t('budget.summaryTitle')}</Text>
          <View style={styles.summaryRow}>
            <Text>{t('budget.monthlyBudgetLabel')}</Text>
            <Text style={styles.summaryValue}>{t('common.rupeeSymbol')}{monthlyNum.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>{t('budget.categoryTotalLabel')}</Text>
            <Text style={styles.summaryValue}>{t('common.rupeeSymbol')}{totalCategoryBudget.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.summaryRow, remaining < 0 && styles.warningRow]}>
            <Text>{t('budget.remainingLabel')}</Text>
            <Text style={[styles.summaryValue, remaining < 0 && styles.warningText]}>
              {t('common.rupeeSymbol')}{remaining.toLocaleString('en-IN')}
            </Text>
          </View>
          {remaining < 0 && (
            <Text style={styles.warningMessage}>
              {t('budget.exceedWarning')}
            </Text>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAll} disabled={saving || loading}>
          {saving || loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('budget.saveAllChanges')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain exactly the same as original
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.white, fontSize: 20, fontWeight: '600' },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12 },
  currencySymbol: { fontSize: 16, color: COLORS.textMuted, marginRight: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  categoryLabel: { fontSize: 14, color: COLORS.text, flex: 1 },
  categoryInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 10 },
  categoryInput: { width: 80, paddingVertical: 8, fontSize: 14, textAlign: 'right' },
  summaryCard: { backgroundColor: COLORS.primaryLight },
  summaryTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryValue: { fontWeight: '600', color: COLORS.text },
  warningRow: { borderTopWidth: 1, borderTopColor: COLORS.danger, paddingTop: 8, marginTop: 8 },
  warningText: { color: COLORS.danger },
  warningMessage: { fontSize: 12, color: COLORS.danger, marginTop: 8, textAlign: 'center' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});