import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useExpenseStore } from '../services/stores/expenseStore';
import { useUserStore } from '../services/stores/userStore';
import { useAlertStore } from '../services/stores/alertStore';
import { getGeminiInsights } from '../services/geminiService';

const COLORS = {
  primary: '#1A9B5E',
  primaryDark: '#157A4A',
  primaryLight: '#E8F7F0',
  bg: '#F0FAF5',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#D1E9DC',
  accent: '#2EC87A',
  danger: '#E53E3E',
  success: '#22C55E',
  warning: '#F59E0B',
};

interface Insight {
  id: number;
  title: string;
  body: string;
  link: string | null;
  color: string;
  bgColor: string;
  action?: string;
}

function ScoreRing({ score }: { score: number }) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const size = 88;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const animatedStrokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={scoreRingStyles.wrap}>
      <View style={[scoreRingStyles.ringBg, { width: size, height: size, borderRadius: size / 2 }]} />
      <View style={scoreRingStyles.scoreTextWrap}>
        <Text style={scoreRingStyles.scoreNum}>{Math.round(score)}</Text>
        <Text style={scoreRingStyles.scoreLabel}>score</Text>
      </View>
      <Animated.View
        style={[
          scoreRingStyles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 7,
            borderColor: score > 70 ? COLORS.success : score > 40 ? COLORS.warning : COLORS.danger,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: '-90deg' }],
            strokeDashoffset: animatedStrokeDashoffset,
          },
        ]}
      />
    </View>
  );
}

const scoreRingStyles = StyleSheet.create({
  wrap: {
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringBg: {
    position: 'absolute',
    borderWidth: 7,
    borderColor: '#D1E9DC',
  },
  progressRing: {
    position: 'absolute',
  },
  scoreTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
  },
  scoreNum: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  scoreLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
});

export default function AIInsightsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { showAlert } = useAlertStore();
  const { expenses, loading: expensesLoading } = useExpenseStore();
  const { monthlyBudget } = useUserStore();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [usingAI, setUsingAI] = useState(false);

  useEffect(() => {
    if (!expensesLoading) {
      generateInsights();
    }
  }, [expenses, expensesLoading, monthlyBudget]);

  const generateInsights = async () => {
    setLoading(true);
    setUsingAI(true);
    
    try {
      // Try to get real AI insights
      const result = await getGeminiInsights(expenses, monthlyBudget);
      
      if (result.insights && result.insights.length > 0) {
        setScore(result.score);
        
        const formattedInsights: Insight[] = result.insights.map((insight, index) => ({
          id: index + 1,
          title: insight.title,
          body: insight.body,
          link: insight.action ? `${t('aiInsights.viewExpenses')}` : null,
          action: insight.action,
          color: index === 0 ? COLORS.primary : index === 1 ? COLORS.warning : '#8B5CF6',
          bgColor: index === 0 ? COLORS.primaryLight : index === 1 ? '#FEF3C7' : '#EDE9FE',
        }));
        
        setInsights(formattedInsights);
      } else {
        // Fallback to rule-based
        setUsingAI(false);
        generateRuleBasedInsights();
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setUsingAI(false);
      generateRuleBasedInsights();
    }
    
    setLastRefreshed(new Date());
    setLoading(false);
  };

  const generateRuleBasedInsights = () => {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const percentage = totalSpent / monthlyBudget;
    
    let newScore = 100 - (percentage * 100);
    if (newScore < 0) newScore = 0;
    if (newScore > 100) newScore = 100;
    setScore(newScore);

    const categorySpending: Record<string, number> = {};
    expenses.forEach(exp => {
      categorySpending[exp.category] = (categorySpending[exp.category] || 0) + exp.amount;
    });

    const sortedCategories = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0];
    const totalCategories = Object.keys(categorySpending).length;
    
    const newInsights: Insight[] = [];

    if (topCategory) {
      const percentageOfTotal = (topCategory[1] / totalSpent) * 100;
      newInsights.push({
        id: 1,
        title: t('aiInsights.highSpendingTitle', { category: t(`categories.${topCategory[0]}`, topCategory[0]) }),
        body: t('aiInsights.highSpendingBody', {
          category: t(`categories.${topCategory[0]}`, topCategory[0]),
          percent: percentageOfTotal.toFixed(0),
          amount: `₹${topCategory[1].toLocaleString('en-IN')}`,
        }),
        link: t('aiInsights.viewExpenses'),
        color: COLORS.primary,
        bgColor: COLORS.primaryLight,
      });
    }

    if (percentage > 0.9) {
      newInsights.push({
        id: 2,
        title: t('aiInsights.budgetAlertTitle'),
        body: t('aiInsights.budgetAlertBody', {
          percent: Math.round(percentage * 100),
          budget: monthlyBudget.toLocaleString('en-IN'),
          remaining: (monthlyBudget - totalSpent).toLocaleString('en-IN'),
        }),
        link: null,
        color: COLORS.danger,
        bgColor: '#FFF0F0',
      });
    } else if (percentage > 0.7) {
      newInsights.push({
        id: 2,
        title: t('aiInsights.budgetWarningTitle'),
        body: t('aiInsights.budgetWarningBody', {
          percent: Math.round(percentage * 100),
          remaining: Math.round(100 - (percentage * 100)),
        }),
        link: null,
        color: COLORS.warning,
        bgColor: '#FEF3C7',
      });
    } else {
      newInsights.push({
        id: 2,
        title: t('aiInsights.onTrackTitle'),
        body: t('aiInsights.onTrackBody', {
          percent: Math.round(percentage * 100),
          budget: monthlyBudget.toLocaleString('en-IN'),
        }),
        link: null,
        color: COLORS.success,
        bgColor: '#DCFCE7',
      });
    }

    if (topCategory && topCategory[0] === 'Food' && topCategory[1] > 5000) {
      newInsights.push({
        id: 3,
        title: t('aiInsights.saveFoodTitle'),
        body: t('aiInsights.saveFoodBody', { amount: `₹${topCategory[1].toLocaleString('en-IN')}` }),
        link: t('aiInsights.viewFoodExpenses'),
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
      });
    } else {
      newInsights.push({
        id: 3,
        title: t('aiInsights.trackEverythingTitle'),
        body: t('aiInsights.trackEverythingBody', { count: totalCategories }),
        link: null,
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
      });
    }

    setInsights(newInsights);
  };

  const handleRefresh = () => {
    generateInsights();
  };

  const formatLastRefreshed = () => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastRefreshed.getTime()) / 60000);
    if (diffMinutes < 1) return t('aiInsights.justNow');
    if (diffMinutes < 60) return t('aiInsights.minAgo', { count: diffMinutes });
    return t('aiInsights.hoursAgo', { count: Math.floor(diffMinutes / 60) });
  };

  if (expensesLoading || loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('aiInsights.title')}</Text>
            <Text style={styles.headerSub}>{t('aiInsights.poweredByGemini')}</Text>
          </View>
        </View>
        <View style={[styles.scrollContent, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textMuted }}>{t('aiInsights.analyzing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getScoreMessage = () => {
    if (score >= 80) return t('aiInsights.scoreExcellent');
    if (score >= 60) return t('aiInsights.scoreGood');
    if (score >= 40) return t('aiInsights.scoreAverage');
    return t('aiInsights.scoreNeedsAttention');
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('aiInsights.title')}</Text>
          <Text style={styles.headerSub}>
            {usingAI ? t('aiInsights.geminiAI') : t('aiInsights.smartAnalytics')} · {formatLastRefreshed()}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <ScoreRing score={score} />
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>{getScoreMessage()}</Text>
            <Text style={styles.scoreBody}>
              {t('aiInsights.scoreSummary', {
                count: expenses.length,
                amount: `₹${totalSpent.toLocaleString('en-IN')}`,
              })}
            </Text>
            {usingAI && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>{t('aiInsights.aiGenerated')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Insight Cards */}
        {insights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={[styles.insightNum, { backgroundColor: insight.bgColor }]}>
              <Text style={[styles.insightNumText, { color: insight.color }]}>{insight.id}</Text>
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightBody}>{insight.body}</Text>
              {insight.link && (
                <TouchableOpacity onPress={() => navigation.navigate('History' as never)}>
                  <Text style={[styles.insightLink, { color: insight.color }]}>{insight.link}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footerNote}>
          {usingAI ? t('aiInsights.footerAI') : t('aiInsights.footerFallback')}
        </Text>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} activeOpacity={0.85}>
          <Text style={styles.refreshBtnText}>{t('aiInsights.refresh')}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain exactly the same as original
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  headerText: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 16, paddingTop: 20 },
  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreInfo: { flex: 1 },
  scoreTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  scoreBody: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  aiBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  insightNum: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  insightNumText: { fontSize: 15, fontWeight: '800' },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  insightBody: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  insightLink: { fontSize: 13, fontWeight: '700', marginTop: 8 },
  footerNote: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  refreshBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  refreshBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});