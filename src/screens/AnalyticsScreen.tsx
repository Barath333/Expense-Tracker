import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, G } from 'react-native-svg';
import { useExpenseStore } from '../services/stores/expenseStore';
import { useUserStore } from '../services/stores/userStore';
import { useAlertStore } from '../services/stores/alertStore';

const COLORS = {
  primary: '#1A9B5E',
  primaryDark: '#157A4A',
  primaryLight: '#E8F7F0',
  accent: '#2EC87A',
  accentLight: '#A8EDD0',
  bg: '#F0FAF5',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#D1E9DC',
};

const FILTERS = ['All', 'Food', 'Travel', 'Shopping', 'Health', 'Bills', 'Entertainment', 'Rent'];

const DONUT_SIZE = 140;
const STROKE = 20;
const RADIUS = (DONUT_SIZE - STROKE) / 2;
const CIRCUM = 2 * Math.PI * RADIUS;
const CX = DONUT_SIZE / 2;
const CY = DONUT_SIZE / 2;

// Color mapping for categories
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Food: COLORS.primaryDark,
    Travel: COLORS.accent,
    Shopping: COLORS.accentLight,
    Health: '#6EE7B7',
    Bills: '#F59E0B',
    Entertainment: '#8B5CF6',
    Rent: '#EC4899',
    Other: '#6B7280',
  };
  return colors[category] || COLORS.textMuted;
};

interface CategoryData {
  label: string;
  amount: number;
  percent: number;
  color: string;
}

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const { expenses, loading: expensesLoading } = useExpenseStore();
  const { monthlyBudget } = useUserStore();
  const { showAlert } = useAlertStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!expensesLoading) {
      processData();
    }
  }, [expenses, expensesLoading, currentMonth, activeFilter]);

  const processData = () => {
    setLoading(true);

    // Filter expenses by month
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    let filteredExpenses = expenses.filter(exp => {
      const expDate = exp.date?.toDate?.() || new Date(exp.date);
      return expDate >= monthStart && expDate <= monthEnd;
    });

    // Apply category filter
    if (activeFilter !== 'All') {
      filteredExpenses = filteredExpenses.filter(exp => exp.category === activeFilter);
    }

    // Calculate category spending
    const categoryMap: Record<string, number> = {};
    let total = 0;

    filteredExpenses.forEach(exp => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
      total += exp.amount;
    });

    setTotalSpent(total);

    const categories = Object.entries(categoryMap).map(([label, amount]) => ({
      label: t(`categories.${label}`, label),
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: getCategoryColor(label),
    }));

    setCategoryData(categories);

    // Calculate monthly trend (last 6 months)
    const trend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      const monthExpenses = expenses.filter(exp => {
        const expDate = exp.date?.toDate?.() || new Date(exp.date);
        return expDate.getMonth() === date.getMonth() && 
               expDate.getFullYear() === date.getFullYear();
      });
      const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      trend.push({
        month: monthKey,
        amount: monthTotal,
        max: monthlyBudget,
        highlight: i === 0,
      });
    }
    setMonthlyTrend(trend);
    setLoading(false);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  // Donut Chart Component with real data
  const DonutChart = () => {
    let offset = 0;
    
    if (categoryData.length === 0) {
      return (
        <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
          <Circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#E5E7EB" strokeWidth={STROKE} />
        </Svg>
      );
    }

    return (
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        <G rotation="-90" origin={`${CX},${CY}`}>
          {categoryData.map((cat) => {
            const dash = (cat.percent / 100) * CIRCUM;
            const gap = CIRCUM - dash;
            const seg = (
              <Circle
                key={cat.label}
                cx={CX}
                cy={CY}
                r={RADIUS}
                fill="none"
                stroke={cat.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return seg;
          })}
        </G>
      </Svg>
    );
  };

  if (expensesLoading || loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('analytics.title')}</Text>
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('analytics.title')}</Text>

        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthBtn} activeOpacity={0.7}>
            <Text style={styles.monthBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthBtn} activeOpacity={0.7}>
            <Text style={styles.monthBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f === 'All' ? t('categories.allWithIcon') : t(`categories.${f}`, f)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Spending by Category */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analytics.spendingByCategory')}</Text>

          <View style={styles.donutRow}>
            <View style={styles.donutWrap}>
              <DonutChart />
              <View style={styles.donutCenter}>
                <Text style={styles.donutAmount}>₹{(totalSpent / 1000).toFixed(1)}K</Text>
                <Text style={styles.donutSub}>{t('analytics.total')}</Text>
              </View>
            </View>

            <View style={styles.legendWrap}>
              {categoryData.length === 0 ? (
                <Text style={styles.emptyText}>{t('analytics.noExpensesThisMonth')}</Text>
              ) : (
                categoryData.map(cat => (
                  <View key={cat.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.legendLabel}>{cat.label}</Text>
                    <Text style={styles.legendPercent}>{cat.percent}%</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* 6-Month Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analytics.sixMonthTrend')}</Text>
          {monthlyTrend.map(item => {
            const fillPct = Math.min((item.amount / item.max) * 100, 100);
            const barColor = item.highlight ? COLORS.accent : COLORS.primaryDark;
            return (
              <View key={item.month} style={styles.barRow}>
                <Text style={styles.barLabel}>{item.month}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${fillPct}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.barAmount}>₹{(item.amount / 1000).toFixed(1)}K</Text>
              </View>
            );
          })}
        </View>

        {/* Export Button */}
        {/* <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => {
            showAlert({
              title: t('analytics.exportTitle'),
              message: t('analytics.exportMessage'),
              type: 'info',
              buttons: [{ text: t('common.ok'), style: 'default' }],
            });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.exportIcon}>📄</Text>
          <Text style={styles.exportText}>{t('analytics.exportPdf')}</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain exactly the same as original
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 14,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  monthBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  monthBtnText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '400',
  },
  monthText: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  content: {
    backgroundColor: COLORS.bg,
    padding: 16,
    paddingBottom: 36,
  },
  filterRow: {
    paddingBottom: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 18,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  donutWrap: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  donutSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  legendWrap: {
    flex: 1,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  legendPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  barLabel: {
    width: 36,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: COLORS.accentLight,
    borderRadius: 7,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 7,
  },
  barAmount: {
    width: 45,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'right',
  },
  exportBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    marginTop: 4,
  },
  exportIcon: { fontSize: 18 },
  exportText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
  },
});