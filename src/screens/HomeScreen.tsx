import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import auth from '@react-native-firebase/auth';

import { useUserStore } from '../services/stores/userStore';
import { calculateBudgetStatus } from '../services/firebase/budgetService';
import { useExpenseStore } from '../services/stores/expenseStore';
import { initializeNotifications, setupNotificationListener } from '../services/notificationService';
import { NotificationPreferencePopup } from '../components/NotificationPreferencePopup';
import { storage } from '../utils/storage';
import { shouldShowPermissionRequest } from '../services/permissionService';

export type TabParamList = {
  Home: undefined;
  Add: undefined;
  Analytics: undefined;
  History: undefined;
  Profile: undefined;
  AIInsights: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'Home'>;

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
};

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
  };
  return icons[category] || '💰';
};

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const {
    expenses,
    subscribeToExpenses,
    loading: expensesLoading,
    error: expensesError,
    refreshExpenses,
  } = useExpenseStore();

  const {
    monthlyBudget,
    categoryBudgets,
    fetchBudget,
    loading: budgetLoading,
    error: budgetError,
  } = useUserStore();

  const [budgetStatus, setBudgetStatus] = useState({
    totalSpent: 0,
    remaining: 0,
    percentageSpent: 0,
  });
  const [userName, setUserName] = useState('User');
  const [refreshing, setRefreshing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  useEffect(() => {
    const checkAndShowPopup = async () => {
      const shouldShow = await shouldShowPermissionRequest();
      if (shouldShow) {
        setTimeout(() => {
          setShowNotificationPopup(true);
        }, 1000);
      }
    };
    checkAndShowPopup();
  }, []);

  const handleNotificationComplete = () => {
    setShowNotificationPopup(false);
    storage.set('hasSeenNotificationPopup', true);
  };

  const loadUserData = useCallback(async () => {
    try {
      const user = auth().currentUser;
      if (user?.displayName) {
        setUserName(user.displayName.split(' ')[0]);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      } else {
        setUserName('Guest');
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  useEffect(() => {
    let unsubscribeExpenses: (() => void) | undefined;
    let unsubscribeNotification: (() => void) | undefined;
    let isMounted = true;

    const initializeData = async () => {
      try {
        await loadUserData();
        await initializeNotifications();
        unsubscribeNotification = setupNotificationListener(navigation);

        const user = auth().currentUser;
        if (!user) {
          if (isMounted) navigation.navigate('Login');
          return;
        }

        unsubscribeExpenses = subscribeToExpenses();
        fetchBudget().catch(err => console.error('Budget fetch error:', err));

        if (isMounted) setInitialized(true);
      } catch (err) {
        console.error('Error initializing data:', err);
        if (isMounted) setInitialized(true);
      }
    };

    initializeData();

    return () => {
      isMounted = false;
      unsubscribeExpenses?.();
      unsubscribeNotification?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const budget = monthlyBudget || 50000;
    const budgets = categoryBudgets || {};

    if (expenses && expenses.length > 0) {
      const status = calculateBudgetStatus(expenses, budget, budgets);
      setBudgetStatus({
        totalSpent: status.totalSpent,
        remaining: status.remaining,
        percentageSpent: status.percentageSpent,
      });
    } else {
      setBudgetStatus({
        totalSpent: 0,
        remaining: budget,
        percentageSpent: 0,
      });
    }
  }, [expenses, monthlyBudget, categoryBudgets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadUserData();
      await fetchBudget();
      await refreshExpenses();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadUserData, fetchBudget, refreshExpenses]);

  const recentExpenses =
    expenses && expenses.length > 0
      ? expenses.slice(0, 5).map(exp => ({
          id: exp.id,
          icon: getCategoryIcon(exp.category),
          title: exp.note || exp.category,
          category: t(`categories.${exp.category}`, exp.category), // translate category name
          time: exp.date
            ? new Date(
                (exp.date as any).toDate?.() || exp.date,
              ).toLocaleDateString()
            : t('common.today'),
          amount: exp.amount,
        }))
      : [];

  const getGreetingKey = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'home.goodMorning';
    if (hour < 17) return 'home.goodAfternoon';
    return 'home.goodEvening';
  };

  const showLoading = !initialized || (expensesLoading && expenses.length === 0);

  if (showLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('home.loadingExpenses')}</Text>
        <Text style={styles.loadingSubText}>
          {expensesLoading ? t('home.loadingExpensesShort') : t('home.initializing')}
        </Text>
      </SafeAreaView>
    );
  }

  if (expensesError) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <Text style={styles.errorText}>{t('home.errorLoadFailed', { error: expensesError })}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t(getGreetingKey())} 🌿</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.scrollWrapper}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Budget Card */}
          <View style={styles.budgetCard}>
            {budgetLoading ? (
              <>
                <Text style={styles.budgetLabel}>{t('home.loadingBudget')}</Text>
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                  style={{ marginVertical: 20 }}
                />
                <Text style={styles.budgetSub}>{t('home.fetchingBudget')}</Text>
              </>
            ) : budgetError ? (
              <>
                <Text style={styles.budgetLabel}>{t('home.budgetUnavailable')}</Text>
                <Text style={styles.budgetAmount}>
                  ₹{budgetStatus.totalSpent.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.budgetSub}>{t('home.spentThisMonth')}</Text>
                <Text style={[styles.budgetSub, { color: COLORS.textMuted, marginTop: 8 }]}>
                  {t('home.defaultBudget')}
                </Text>
                <TouchableOpacity
                  onPress={() => fetchBudget()}
                  style={styles.budgetRetry}
                >
                  <Text style={styles.budgetRetryText}>{t('home.retryLoadingBudget')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.budgetLabel}>{t('home.totalSpentThisMonth')}</Text>
                <Text style={styles.budgetAmount}>
                  ₹{budgetStatus.totalSpent.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.budgetSub}>
                  {t('home.budgetRemaining', {
                    budget: (monthlyBudget || 50000).toLocaleString('en-IN'),
                    remaining: budgetStatus.remaining.toLocaleString('en-IN'),
                  })}
                </Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>
                    {t('home.spentPercent', { percent: Math.round(budgetStatus.percentageSpent) })}
                  </Text>
                  <Text style={styles.progressLabel}>
                    ₹{(monthlyBudget || 50000).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(budgetStatus.percentageSpent, 100)}%` },
                    ]}
                  />
                </View>
              </>
            )}
          </View>

          {/* AI Insight Card */}
          <TouchableOpacity
            style={styles.insightCard}
            onPress={() => navigation.navigate('AIInsights')}
            activeOpacity={0.8}
          >
            <View style={styles.insightBadge}>
              <Text style={styles.insightBadgeText}>{t('home.geminiInsight')}</Text>
              <Text style={styles.insightArrow}>→</Text>
            </View>
            <Text style={styles.insightText}>
              {budgetStatus.percentageSpent > 80
                ? t('home.insightOverBudget', { percent: Math.round(budgetStatus.percentageSpent) })
                : t('home.insightOnTrack', { percent: Math.round(100 - budgetStatus.percentageSpent) })}
            </Text>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Add')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrap}>
                <Text style={styles.actionIconPlus}>+</Text>
              </View>
              <Text style={styles.actionLabel}>{t('home.add')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Analytics')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrap}>
                <Text style={styles.actionIcon}>📊</Text>
              </View>
              <Text style={styles.actionLabel}>{t('home.charts')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('History')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrap}>
                <Text style={styles.actionIcon}>📋</Text>
              </View>
              <Text style={styles.actionLabel}>{t('home.history')}</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Expenses */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.recentExpenses')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {recentExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('home.noExpenses')}</Text>
            </View>
          ) : (
            recentExpenses.map(exp => (
              <View key={exp.id} style={styles.expenseItem}>
                <View style={styles.expenseIconWrap}>
                  <Text style={styles.expenseIcon}>{exp.icon}</Text>
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{exp.title}</Text>
                  <Text style={styles.expenseMeta}>
                    {exp.category} · {exp.time}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>
                  -₹{exp.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <NotificationPreferencePopup
        visible={showNotificationPopup}
        onClose={handleNotificationComplete}
        onComplete={handleNotificationComplete}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Add')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Styles remain exactly the same as in original code
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loadingText: { marginTop: 12, color: COLORS.white, fontSize: 14 },
  loadingSubText: { marginTop: 8, color: COLORS.white, fontSize: 12, opacity: 0.8 },
  errorText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: COLORS.primary,
  },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '400', marginBottom: 2 },
  userName: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  scrollWrapper: { flex: 1, backgroundColor: COLORS.primary },
  content: { backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingBottom: 100 },
  budgetCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  budgetAmount: { fontSize: 38, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  budgetSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 14 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  progressBar: { height: 10, backgroundColor: '#D1E9DC', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 6 },
  budgetRetry: { marginTop: 10, paddingVertical: 8, alignItems: 'center' },
  budgetRetryText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  insightCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  insightBadgeText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  insightArrow: { color: COLORS.white, fontSize: 12, fontWeight: '500' },
  insightText: { color: 'rgba(255,255,255,0.95)', fontSize: 15, lineHeight: 22, fontWeight: '400' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22, gap: 10 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconWrap: { alignItems: 'center', justifyContent: 'center' },
  actionIconPlus: { fontSize: 26, color: COLORS.text, lineHeight: 30, fontWeight: '300' },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  expenseIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  expenseIcon: { fontSize: 22 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  expenseMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: '#E53E3E' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300', lineHeight: 32 },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
});