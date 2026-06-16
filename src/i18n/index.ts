import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createMMKV } from 'react-native-mmkv';
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';
import te from '../locales/te.json';

export const storage = createMMKV({ id: 'spendwise-storage' });
export const LANGUAGE_KEY = 'app_language';

const savedLanguage = storage.getString(LANGUAGE_KEY);

export type SupportedLanguage = 'en' | 'ta' | 'hi' | 'mr' | 'te';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      ta: { translation: ta },
      hi: { translation: hi },
      mr: { translation: mr },
      te: { translation: te },
    },
    lng: savedLanguage || undefined,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export const changeLanguage = (lang: SupportedLanguage) => {
  i18n.changeLanguage(lang);
  storage.set(LANGUAGE_KEY, lang);
};

export const getSavedLanguage = (): SupportedLanguage | undefined => {
  const saved = storage.getString(LANGUAGE_KEY);
  return saved as SupportedLanguage | undefined;
};

export default i18n;