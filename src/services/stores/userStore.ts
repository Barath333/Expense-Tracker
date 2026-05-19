import { create } from 'zustand';
import auth from '@react-native-firebase/auth';
import {
  getMonthlyBudget,
  updateMonthlyBudget,
  updateCategoryBudget,
  addCustomCategory,
  removeCustomCategory,
} from '../firebase/budgetService';

interface CustomCategory {
  name: string;
  icon: string;
}

// Default category budgets that sum to 15000 (NOT exceeding monthly budget)
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

interface UserState {
  user: any | null;
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
  customCategories: CustomCategory[];
  loading: boolean;
  error: string | null;
  budgetLoaded: boolean;
  setUser: (user: any) => void;
  fetchBudget: () => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<{ success: boolean; error?: string }>;
  setCategoryBudget: (
    category: string,
    amount: number,
  ) => Promise<{ success: boolean; error?: string }>;
  addCustomCategory: (
    name: string,
    icon: string,
    budget: number,
  ) => Promise<{ success: boolean; error?: string }>;
  removeCustomCategory: (name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetBudget: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  monthlyBudget: 15000,
  categoryBudgets: DEFAULT_CATEGORY_BUDGETS,
  customCategories: [],
  loading: false,
  error: null,
  budgetLoaded: false,

  setUser: user => set({ user }),

  fetchBudget: async () => {
    // If we already have budget data, just make sure loading is false and bail.
    if (get().budgetLoaded) {
      set({ loading: false });
      return;
    }

    console.log('💰 Fetching budget started...');
    set({ loading: true, error: null });

    try {
      const result = await Promise.race([
        getMonthlyBudget(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Budget fetch timeout')), 5000),
        ),
      ]) as any;

      console.log('💰 Budget fetch result:', result);

      if (result && !result.error) {
        set({
          monthlyBudget: result.monthlyBudget || 15000,
          categoryBudgets: result.categoryBudgets || DEFAULT_CATEGORY_BUDGETS,
          customCategories: result.customCategories || [],
          loading: false,
          error: null,
          budgetLoaded: true,
        });
        console.log('✅ Budget loaded successfully');
      } else {
        console.error('❌ Budget fetch error:', result?.error);
        set({
          loading: false,
          error: result?.error || 'Failed to load budget',
          monthlyBudget: 15000,
          categoryBudgets: DEFAULT_CATEGORY_BUDGETS,
          customCategories: [],
          budgetLoaded: true,
        });
      }
    } catch (error: any) {
      console.error('❌ Budget fetch exception:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch budget',
        monthlyBudget: 15000,
        categoryBudgets: DEFAULT_CATEGORY_BUDGETS,
        customCategories: [],
        budgetLoaded: true,
      });
    }
  },

  resetBudget: () => {
    set({
      loading: false,
      error: null,
      budgetLoaded: false,
      monthlyBudget: 15000,
      categoryBudgets: DEFAULT_CATEGORY_BUDGETS,
      customCategories: [],
    });
  },

  setMonthlyBudget: async budget => {
    set({ loading: true, error: null });
    try {
      const { error } = await updateMonthlyBudget(budget);
      if (!error) {
        set({ monthlyBudget: budget, loading: false, budgetLoaded: true });
        return { success: true };
      } else {
        set({ loading: false, error });
        return { success: false, error };
      }
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  setCategoryBudget: async (category, amount) => {
    set({ loading: true, error: null });
    try {
      const { error } = await updateCategoryBudget(category, amount);
      if (!error) {
        const currentBudgets = get().categoryBudgets;
        set({
          categoryBudgets: { ...currentBudgets, [category]: amount },
          loading: false,
        });
        return { success: true };
      } else {
        set({ loading: false, error });
        return { success: false, error };
      }
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  addCustomCategory: async (name, icon, budget) => {
    set({ loading: true, error: null });
    try {
      const { error } = await addCustomCategory(name, icon, budget);
      if (!error) {
        set({ budgetLoaded: false });
        await get().fetchBudget();
        set({ loading: false });
        return { success: true };
      } else {
        set({ loading: false, error });
        return { success: false, error };
      }
    } catch (error: any) {
      console.error('Add custom category error:', error);
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  removeCustomCategory: async name => {
    set({ loading: true, error: null });
    try {
      const { error } = await removeCustomCategory(name);
      if (!error) {
        set({ budgetLoaded: false });
        await get().fetchBudget();
        set({ loading: false });
        return { success: true };
      } else {
        set({ loading: false, error });
        return { success: false, error };
      }
    } catch (error: any) {
      console.error('Remove custom category error:', error);
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    try {
      await auth().signOut();
      set({
        user: null,
        monthlyBudget: 15000,
        categoryBudgets: DEFAULT_CATEGORY_BUDGETS,
        customCategories: [],
        loading: false,
        error: null,
        budgetLoaded: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
}));