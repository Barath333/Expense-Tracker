// react-native-mmkv v4.x (named export, no default class)
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'spendwise-storage',
});

export const saveItem = (key: string, value: string): void => {
  storage.set(key, value);
};

export const getItem = (key: string): string | null => {
  return storage.getString(key) ?? null;
};

export const removeItem = (key: string): void => {
  storage.delete(key);
};

export const clearAll = (): void => {
  storage.clearAll();
};