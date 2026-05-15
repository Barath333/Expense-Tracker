import { create } from 'zustand';
import auth from '@react-native-firebase/auth';
import { getMonthlyBudget, updateMonthlyBudget, updateCategoryBudget } from '../firebase/budgetService';

interface UserState {
  user: any | null;
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
  loading: boolean;
  setUser: (user: any) => void;
  fetchBudget: () => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<{ success: boolean; error?: string }>;
  setCategoryBudget: (category: string, amount: number) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  monthlyBudget: 15000,
  categoryBudgets: {},
  loading: false,
  
  setUser: (user) => set({ user }),
  
  fetchBudget: async () => {
    set({ loading: true });
    try {
      const { monthlyBudget, categoryBudgets, error } = await getMonthlyBudget();
      if (!error) {
        set({ monthlyBudget, categoryBudgets, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Fetch budget error:', error);
      set({ loading: false });
    }
  },
  
  setMonthlyBudget: async (budget) => {
    set({ loading: true });
    try {
      const { error } = await updateMonthlyBudget(budget);
      if (!error) {
        set({ monthlyBudget: budget, loading: false });
        return { success: true };
      } else {
        set({ loading: false });
        return { success: false, error };
      }
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },
  
  setCategoryBudget: async (category, amount) => {
    set({ loading: true });
    try {
      const { error } = await updateCategoryBudget(category, amount);
      if (!error) {
        const currentBudgets = get().categoryBudgets;
        set({ 
          categoryBudgets: { ...currentBudgets, [category]: amount },
          loading: false 
        });
        return { success: true };
      } else {
        set({ loading: false });
        return { success: false, error };
      }
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },
  
  logout: async () => {
    try {
      await auth().signOut();
      set({ user: null, monthlyBudget: 15000, categoryBudgets: {} });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
}));