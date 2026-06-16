


import { Expense } from './firebase/expenseService';
import { GEMINI_API_KEY } from '@env';

// IMPORTANT: Replace with your actual Gemini API key
// geminiService.ts
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiResponse {
  score: number;
  insights: {
    title: string;
    body: string;
    action?: string;
  }[];
}

export const getGeminiInsights = async (expenses: Expense[], monthlyBudget: number): Promise<GeminiResponse> => {
  try {
    if (expenses.length === 0) {
      return {
        score: 100,
        insights: [
          {
            title: 'Welcome to SpendWise! 👋',
            body: 'Start adding expenses to get personalized AI insights about your spending habits.',
            action: 'Add Expense'
          }
        ]
      };
    }

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Prepare expense summary for Gemini
    const categorySummary: Record<string, number> = {};
    expenses.forEach(exp => {
      categorySummary[exp.category] = (categorySummary[exp.category] || 0) + exp.amount;
    });
    
    const prompt = `You are a friendly financial advisor analyzing spending data for an Indian user. 
    
    User's Monthly Budget: ₹${monthlyBudget.toLocaleString('en-IN')}
    Total Spent This Month: ₹${totalSpent.toLocaleString('en-IN')}
    Remaining Budget: ₹{(monthlyBudget - totalSpent).toLocaleString('en-IN')}
    
    Category-wise Spending:
    ${Object.entries(categorySummary).map(([cat, amt]) => `- ${cat}: ₹${amt.toLocaleString('en-IN')}`).join('\n')}
    
    Recent Expenses (last 5):
    ${expenses.slice(0, 5).map(e => `- ${e.note || e.category}: ₹${e.amount.toLocaleString('en-IN')}`).join('\n')}
    
    Provide 3 personalized, actionable insights for this user.
    
    Return ONLY valid JSON in this exact format (no markdown, no extra text):
    {
      "score": (calculate a financial health score 0-100 based on budget adherence and spending patterns),
      "insights": [
        {"title": "short catchy title", "body": "detailed personalized advice", "action": "suggested next action"}
      ]
    }
    
    Make insights:
    1. Specific to their spending patterns
    2. Culturally relevant for Indian users
    3. Actionable with clear next steps
    4. Encouraging and positive tone
    
    Keep responses concise (under 120 characters for body text).`;
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Gemini API Error:', data.error);
      return getFallbackInsights(expenses, monthlyBudget);
    }
    
    const text = data.candidates[0].content.parts[0].text;
    // Clean the response - remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const result = JSON.parse(cleanText);
    
    return {
      score: result.score || calculateFallbackScore(expenses, monthlyBudget),
      insights: result.insights || []
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return getFallbackInsights(expenses, monthlyBudget);
  }
};

// Fallback insights when Gemini API fails
const getFallbackInsights = (expenses: Expense[], monthlyBudget: number): GeminiResponse => {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const percentage = totalSpent > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
  
  const categorySpending: Record<string, number> = {};
  expenses.forEach(exp => {
    categorySpending[exp.category] = (categorySpending[exp.category] || 0) + exp.amount;
  });
  
  // Get top category safely
  const sortedCategories = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
  const secondCategory = sortedCategories.length > 1 ? sortedCategories[1] : null;
  
  const insights = [];
  
  // Insight 1: Top spending category
  if (topCategory) {
    const topCategoryName = topCategory[0];
    const topCategoryAmount = topCategory[1];
    const percentageOfTotal = totalSpent > 0 ? (topCategoryAmount / totalSpent) * 100 : 0;
    insights.push({
      title: `High ${topCategoryName} Spending`,
      body: `${topCategoryName} is ${Math.round(percentageOfTotal)}% of your spending (₹${topCategoryAmount.toLocaleString('en-IN')}). Consider setting a budget cap.`,
      action: `View ${topCategoryName} expenses`
    });
  } else {
    insights.push({
      title: 'Start Tracking',
      body: 'Add your first expense to get personalized insights about your spending habits.',
      action: 'Add Expense'
    });
  }
  
  // Insight 2: Budget status
  if (percentage >= 100) {
    insights.push({
      title: 'Budget Exceeded! 🚨',
      body: `You've exceeded your ₹${monthlyBudget.toLocaleString('en-IN')} budget by ₹${(totalSpent - monthlyBudget).toLocaleString('en-IN')}.`,
      action: 'Review spending'
    });
  } else if (percentage >= 80) {
    insights.push({
      title: 'Budget Alert ⚠️',
      body: `You've spent ${Math.round(percentage)}% of your ₹${monthlyBudget.toLocaleString('en-IN')} budget. ${(monthlyBudget - totalSpent).toLocaleString('en-IN')} remaining.`,
      action: 'View budget'
    });
  } else if (percentage >= 50) {
    insights.push({
      title: 'On Track! 🎯',
      body: `You've spent ${Math.round(percentage)}% of your budget. Keep up the good work!`,
      action: 'View insights'
    });
  } else {
    insights.push({
      title: 'Great Start! 💪',
      body: `You've only spent ${Math.round(percentage)}% of your budget. You're on track for a great saving month!`,
      action: 'Add expense'
    });
  }
  
  // Insight 3: Savings opportunity
  if (topCategory && topCategory[0] === 'Food' && topCategory[1] > 5000) {
    insights.push({
      title: 'Save on Food',
      body: `You spent ₹${topCategory[1].toLocaleString('en-IN')} on food. Cooking at home 3x/week could save ₹800-1200/month.`,
      action: 'View Food expenses'
    });
  } else if (secondCategory && secondCategory[1] > 3000) {
    insights.push({
      title: `Reduce ${secondCategory[0]} Spending`,
      body: `Your ${secondCategory[0]} expenses are ₹${secondCategory[1].toLocaleString('en-IN')}. Setting a budget could help save ₹${Math.round(secondCategory[1] * 0.2).toLocaleString('en-IN')}/month.`,
      action: `View ${secondCategory[0]} expenses`
    });
  } else {
    insights.push({
      title: 'Pro Tip 💡',
      body: 'Regular expense tracking helps you save 20-30% more. Keep adding your expenses!',
      action: 'View tips'
    });
  }
  
  return {
    score: calculateFallbackScore(expenses, monthlyBudget),
    insights
  };
};

const calculateFallbackScore = (expenses: Expense[], monthlyBudget: number): number => {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const percentage = (totalSpent / monthlyBudget) * 100;
  let score = 100 - percentage;
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return Math.round(score);
};