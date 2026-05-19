import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export interface UserData {
  displayName: string;
  email: string;
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
  createdAt: any;
}

// Default category budgets that sum to 15000
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

export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName });
    
    const userData: UserData = {
      displayName,
      email,
      monthlyBudget: 15000,
      categoryBudgets: DEFAULT_CATEGORY_BUDGETS,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    
    await firestore().collection('users').doc(userCredential.user.uid).set(userData);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await auth().signOut();
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth().currentUser;
};