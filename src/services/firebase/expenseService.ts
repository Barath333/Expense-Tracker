import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface Expense {
  id?: string;
  amount: number;
  category: string;
  note: string;
  date: Date | FirebaseFirestoreTypes.Timestamp;
  receiptUrl?: string | null;
  createdAt?: any;
}

const getUserId = () => {
  const user = auth().currentUser;
  if (!user) throw new Error('No user logged in');
  return user.uid;
};

export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
  try {
    const userId = getUserId();
    console.log('📝 Adding expense for user:', userId);
    
    // Convert date properly
    let dateValue;
    if (expense.date instanceof Date) {
      dateValue = firestore.Timestamp.fromDate(expense.date);
    } else {
      dateValue = expense.date;
    }
    
    // Create expense data object
    const expenseData = {
      amount: expense.amount,
      category: expense.category,
      note: expense.note || '',
      date: dateValue,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    
    // Only add receiptUrl if it exists
    if (expense.receiptUrl) {
      expenseData.receiptUrl = expense.receiptUrl;
    }
    
    console.log('💾 Saving expense data to Firestore:', JSON.stringify(expenseData, null, 2));
    
   
    const userExpensesRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('expenses');
    
    console.log('📍 Got Firestore reference');
    
    // Add the document
    const docRef = await userExpensesRef.add(expenseData);
    
    console.log('✅ Expense saved with ID:', docRef.id);
    
    // Return the result
    return { id: docRef.id, error: null };
  } catch (error: any) {
    console.error('❌ Error in addExpense:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return { id: null, error: error.message };
  }
};

export const updateExpense = async (expenseId: string, expense: Partial<Expense>) => {
  try {
    const userId = getUserId();
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('expenses')
      .doc(expenseId)
      .update(expense);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const deleteExpense = async (expenseId: string) => {
  try {
    const userId = getUserId();
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('expenses')
      .doc(expenseId)
      .delete();
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getExpensesQuery = () => {
  const userId = getUserId();
  return firestore()
    .collection('users')
    .doc(userId)
    .collection('expenses')
    .orderBy('date', 'desc');
};

export const getExpensesByDateRange = async (startDate: Date, endDate: Date) => {
  const userId = getUserId();
  const snapshot = await firestore()
    .collection('users')
    .doc(userId)
    .collection('expenses')
    .where('date', '>=', firestore.Timestamp.fromDate(startDate))
    .where('date', '<=', firestore.Timestamp.fromDate(endDate))
    .orderBy('date', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
};