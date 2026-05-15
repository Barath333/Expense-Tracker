import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const getUserId = () => {
  const user = auth().currentUser;
  if (!user) throw new Error('No user logged in');
  return user.uid;
};

export const getMonthlyBudget = async () => {
  try {
    const userId = getUserId();
    const doc = await firestore().collection('users').doc(userId).get();
    const data = doc.data();
    return { 
      monthlyBudget: data?.monthlyBudget || 15000,
      categoryBudgets: data?.categoryBudgets || {},
      error: null 
    };
  } catch (error: any) {
    console.error('Error getting budget:', error);
    return { monthlyBudget: 15000, categoryBudgets: {}, error: error.message };
  }
};

export const updateMonthlyBudget = async (monthlyBudget: number) => {
  try {
    const userId = getUserId();
    await firestore().collection('users').doc(userId).update({ monthlyBudget });
    return { error: null };
  } catch (error: any) {
    console.error('Error updating monthly budget:', error);
    return { error: error.message };
  }
};

export const updateCategoryBudget = async (category: string, amount: number) => {
  try {
    const userId = getUserId();
    const userRef = firestore().collection('users').doc(userId);
    const doc = await userRef.get();
    const currentBudgets = doc.data()?.categoryBudgets || {};
    
    await userRef.update({
      categoryBudgets: { ...currentBudgets, [category]: amount }
    });
    return { error: null };
  } catch (error: any) {
    console.error('Error updating category budget:', error);
    return { error: error.message };
  }
};

export const calculateBudgetStatus = async (expenses: any[]) => {
  try {
    const { monthlyBudget, categoryBudgets } = await getMonthlyBudget();
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const categorySpending: Record<string, number> = {};
    expenses.forEach(exp => {
      categorySpending[exp.category] = (categorySpending[exp.category] || 0) + exp.amount;
    });
    
    const categoryStatus = Object.keys(categoryBudgets).map(category => ({
      category,
      budget: categoryBudgets[category] || 0,
      spent: categorySpending[category] || 0,
      percentage: ((categorySpending[category] || 0) / (categoryBudgets[category] || 1)) * 100,
    }));
    
    return {
      totalBudget: monthlyBudget,
      totalSpent,
      remaining: monthlyBudget - totalSpent,
      percentageSpent: (totalSpent / monthlyBudget) * 100,
      categoryStatus,
    };
  } catch (error: any) {
    console.error('Error calculating budget status:', error);
    return {
      totalBudget: 15000,
      totalSpent: 0,
      remaining: 15000,
      percentageSpent: 0,
      categoryStatus: [],
    };
  }
};