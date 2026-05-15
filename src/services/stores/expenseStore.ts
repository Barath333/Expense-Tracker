import { create } from 'zustand';
import { Expense, addExpense, deleteExpense, updateExpense, getExpensesQuery } from '../firebase/expenseService';

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  addExpenseToStore: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<{ id: string | null; error: string | null }>;
updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => Promise<void>;
  subscribeToExpenses: () => () => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  loading: false,
  
  addExpenseToStore: async (expense) => {
    const result = await addExpense(expense);
    if (result.id) {
      // Optionally update local state
      console.log('Expense added with ID:', result.id);
    }
    return result;
  },
  
 updateExpense: (id, expense) => {
  set((state) => ({
    expenses: state.expenses.map(exp => 
      exp.id === id ? { ...exp, ...expense } : exp
    )
  }));
},
  
  deleteExpense: async (id) => {
    await deleteExpense(id);
  },
  
  subscribeToExpenses: () => {
    set({ loading: true });
    try {
      const query = getExpensesQuery();
      
      const unsubscribe = query.onSnapshot(
        (snapshot) => {
          const expenses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Expense[];
          
          set({ expenses, loading: false });
        },
        (error) => {
          console.error('Error fetching expenses:', error);
          set({ loading: false });
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up subscription:', error);
      set({ loading: false });
      return () => {};
    }
  },
}));