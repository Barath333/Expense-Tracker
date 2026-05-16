import { create } from 'zustand';
import { Expense, addExpense, deleteExpense, updateExpense, getExpensesQuery } from '../firebase/expenseService';
import auth from '@react-native-firebase/auth';

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  addExpenseToStore: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<{ id: string | null; error: string | null }>;
  updateExpenseInStore: (id: string, expense: Partial<Expense>) => void;
  deleteExpenseFromStore: (id: string) => Promise<void>;
  subscribeToExpenses: () => () => void;
  clearExpenses: () => void;
  refreshExpenses: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  loading: false,
  error: null,
  
  setLoading: (loading) => {
    console.log('🔄 setLoading called:', loading);
    set({ loading });
  },
  
  addExpenseToStore: async (expense) => {
    console.log('📝 addExpenseToStore called with:', expense);
    try {
      const result = await addExpense(expense);
      console.log('📝 addExpense result:', result);
      if (result.id) {
        console.log('✅ Expense added with ID:', result.id);
        await get().refreshExpenses();
      }
      return result;
    } catch (error: any) {
      console.error('❌ Error adding expense:', error);
      return { id: null, error: error.message };
    }
  },
  
  updateExpenseInStore: (id, expense) => {
    console.log('✏️ updateExpenseInStore called:', id, expense);
    set((state) => ({
      expenses: state.expenses.map(exp => 
        exp.id === id ? { ...exp, ...expense } : exp
      )
    }));
  },
  
  deleteExpenseFromStore: async (id) => {
    console.log('🗑️ deleteExpenseFromStore called:', id);
    try {
      await deleteExpense(id);
      set((state) => ({
        expenses: state.expenses.filter(exp => exp.id !== id)
      }));
      console.log('✅ Expense deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting expense:', error);
    }
  },
  
  clearExpenses: () => {
    console.log('🧹 clearExpenses called');
    set({ expenses: [], loading: false, error: null });
  },
  
  refreshExpenses: async () => {
    console.log('🔄 refreshExpenses started');
    set({ loading: true, error: null });
    try {
      const user = auth().currentUser;
      console.log('📱 Current user in refresh:', user?.uid, user?.email);
      
      if (!user) {
        console.log('⚠️ No user logged in for refresh');
        set({ loading: false, error: 'User not logged in', expenses: [] });
        return;
      }
      
      console.log('🔍 Getting expenses query...');
      const query = getExpensesQuery();
      console.log('✅ Query created, executing...');
      
      const snapshot = await query.get();
      console.log(`📊 Snapshot received: ${snapshot.docs.length} documents`);
      
      const expenses = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`📄 Document ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data,
        };
      }) as Expense[];
      
      console.log(`✅ Refreshed ${expenses.length} expenses`);
      set({ expenses, loading: false, error: null });
    } catch (error: any) {
      console.error('❌ Error refreshing expenses:', error);
      console.error('Error stack:', error.stack);
      set({ loading: false, error: error.message });
    }
  },
  
  subscribeToExpenses: () => {
    console.log('🔌 ========== SUBSCRIBE TO EXPENSES STARTED ==========');
    console.log('1. Setting up expenses subscription...');
    set({ loading: true, error: null });
    
    try {
      console.log('2. Getting current user...');
      const user = auth().currentUser;
      console.log('3. Current user:', user?.uid, user?.email);
      
      if (!user) {
        console.log('4. ❌ No user logged in, cannot subscribe to expenses');
        set({ loading: false, error: 'User not logged in', expenses: [] });
        return () => {
          console.log('📢 Returning empty unsubscribe function');
        };
      }
      
      console.log('5. ✅ User found, creating query...');
      const query = getExpensesQuery();
      console.log('6. Query created successfully');
      

      console.log('7. Setting up onSnapshot listener...');

    // In subscribeToExpenses function, update the onSnapshot callback:
const unsubscribe = query.onSnapshot(
  (snapshot) => {
    console.log(`8. 📡 Snapshot received! Size: ${snapshot.docs.length}`);
    
    const expenses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    }) as Expense[];
    
    console.log(`10. ✅ Processed ${expenses.length} expenses`);
    console.log('11. Updating store state...');
    // IMPORTANT: Set loading to false HERE
    set({ expenses, loading: false, error: null }); // Make sure loading is false
    console.log('12. Store state updated with loading=false');
  },
  (error) => {
    console.error('13. ❌ Error in expense subscription:', error);
    set({ 
      loading: false,  // Also set loading false on error
      error: error.message || 'Failed to load expenses',
      expenses: []
    });
  }
);
      
      console.log('17. ✅ Subscription active, listener attached');
      console.log('🔌 ========== SUBSCRIBE TO EXPENSES COMPLETED ==========');
      
      // Return unsubscribe function
      return () => {
        console.log('🧹 Cleaning up expenses subscription');
        unsubscribe();
      };
    } catch (error: any) {
      console.error('❌ Error setting up subscription:', error);
      console.error('Error stack:', error.stack);
      set({ 
        loading: false, 
        error: error.message || 'Failed to setup expenses listener',
        expenses: []
      });
      return () => {
        console.log('📢 Returning empty unsubscribe function due to error');
      };
    }
  },
}));