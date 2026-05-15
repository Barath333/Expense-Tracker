import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

const getUserId = () => {
  const user = auth().currentUser;
  if (!user) throw new Error('No user logged in');
  return user.uid;
};

export const uploadReceipt = async (imageUri: string): Promise<string | null> => {
  try {
    const userId = getUserId();
    const filename = `${userId}/${Date.now()}.jpg`;
    const reference = storage().ref(filename);
    
    // For iOS, we need to add 'file://' prefix if not present
    const uploadUri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
    
    await reference.putFile(uploadUri);
    const downloadUrl = await reference.getDownloadURL();
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading receipt:', error);
    return null;
  }
};

export const deleteReceipt = async (receiptUrl: string) => {
  try {
    const reference = storage().refFromURL(receiptUrl);
    await reference.delete();
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};