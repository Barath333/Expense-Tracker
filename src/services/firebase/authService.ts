import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export interface UserData {
  displayName: string;
  email: string;
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
  createdAt: any;
}

export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName });
    
    const userData: UserData = {
      displayName,
      email,
      monthlyBudget: 15000,
      categoryBudgets: {
        Food: 5000,
        Travel: 3000,
        Shopping: 2000,
        Health: 2000,
        Bills: 4000,
        Entertainment: 2000,
        Rent: 10000,
        Other: 2000,
      },
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