import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const getUserId = () => {
  const user = auth().currentUser;
  if (!user) throw new Error('No user logged in');
  return user.uid;
};

// Default category budgets that sum to 15000 (NOT exceeding)
const DEFAULT_CATEGORY_BUDGETS = {
  Food: 4000,
  Travel: 2000,
  Shopping: 2000,
  Health: 1500,
  Bills: 3000,
  Entertainment: 1500,
  Rent: 0,
  Other: 1000,
};

export const getMonthlyBudget = async () => {
  try {
    const userId = getUserId();
    const doc = await firestore().collection('users').doc(userId).get();
    const data = doc.data();
    return {
      monthlyBudget: data?.monthlyBudget || 15000,
      categoryBudgets: data?.categoryBudgets || DEFAULT_CATEGORY_BUDGETS,
      customCategories: data?.customCategories || [],
      error: null,
    };
  } catch (error: any) {
    console.error('Error getting budget:', error);
    return {
      monthlyBudget: 15000,
      categoryBudgets: DEFAULT_CATEGORY_BUDGETS,
      customCategories: [],
      error: error.message,
    };
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
    const currentBudgets = doc.data()?.categoryBudgets || DEFAULT_CATEGORY_BUDGETS;
    await userRef.update({
      categoryBudgets: { ...currentBudgets, [category]: amount },
    });
    return { error: null };
  } catch (error: any) {
    console.error('Error updating category budget:', error);
    return { error: error.message };
  }
};

export const addCustomCategory = async (name: string, icon: string, budget: number) => {
  try {
    const userId = getUserId();
    const userRef = firestore().collection('users').doc(userId);
    const doc = await userRef.get();
    const data = doc.data();

    const currentCustomCategories = data?.customCategories || [];
    const currentCategoryBudgets = data?.categoryBudgets || DEFAULT_CATEGORY_BUDGETS;

    if (
      currentCategoryBudgets[name] ||
      currentCustomCategories.some((cat: any) => cat.name === name)
    ) {
      return { error: 'Category already exists' };
    }

    await userRef.update({
      customCategories: [...currentCustomCategories, { name, icon }],
      categoryBudgets: { ...currentCategoryBudgets, [name]: budget },
    });

    return { error: null };
  } catch (error: any) {
    console.error('Error adding custom category:', error);
    return { error: error.message };
  }
};

export const removeCustomCategory = async (name: string) => {
  try {
    const userId = getUserId();
    const userRef = firestore().collection('users').doc(userId);
    const doc = await userRef.get();
    const data = doc.data();

    const currentCustomCategories = data?.customCategories || [];
    const currentCategoryBudgets = data?.categoryBudgets || DEFAULT_CATEGORY_BUDGETS;

    const updatedCustomCategories = currentCustomCategories.filter(
      (cat: any) => cat.name !== name,
    );

    const { [name]: _removed, ...remainingBudgets } = currentCategoryBudgets;

    await userRef.update({
      customCategories: updatedCustomCategories,
      categoryBudgets: remainingBudgets,
    });

    return { error: null };
  } catch (error: any) {
    console.error('Error removing custom category:', error);
    return { error: error.message };
  }
};

/**
 * Pure synchronous calculation — no Firestore call.
 * Pass in the values already loaded in userStore.
 */
export const calculateBudgetStatus = (
  expenses: any[],
  monthlyBudget: number,
  categoryBudgets: Record<string, number>,
) => {
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categorySpending: Record<string, number> = {};
  expenses.forEach(exp => {
    categorySpending[exp.category] =
      (categorySpending[exp.category] || 0) + exp.amount;
  });

  const categoryStatus = Object.keys(categoryBudgets).map(category => ({
    category,
    budget: categoryBudgets[category] || 0,
    spent: categorySpending[category] || 0,
    percentage:
      ((categorySpending[category] || 0) / (categoryBudgets[category] || 1)) *
      100,
  }));

  return {
    totalBudget: monthlyBudget,
    totalSpent,
    remaining: monthlyBudget - totalSpent,
    percentageSpent: (totalSpent / monthlyBudget) * 100,
    categoryStatus,
  };
};