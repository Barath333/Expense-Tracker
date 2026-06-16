import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, SupportedLanguage } from '../i18n';

const COLORS = {
  primary: '#1A9B5E',
  primaryLight: '#E8F7F0',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#D1E9DC',
};

interface Props {
  visible: boolean;
  onComplete: () => void;
}

const LANGUAGES: SupportedLanguage[] = ['en', 'ta', 'hi', 'mr', 'te'];

export default function LanguageSelectModal({ visible, onComplete }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<SupportedLanguage>('en');

  const handleContinue = () => {
    changeLanguage(selected);
    onComplete();
  };

  const getLanguageName = (lang: SupportedLanguage): string => {
    switch (lang) {
      case 'en': return t('language.english');
      case 'ta': return t('language.tamil');
      case 'hi': return t('language.hindi');
      case 'mr': return t('language.marathi');
      case 'te': return t('language.telugu');
      default: return lang;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.icon}>🌐</Text>
          <Text style={styles.title}>{t('language.selectLanguage')}</Text>

          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.option, selected === lang && styles.optionSelected]}
              onPress={() => setSelected(lang)}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionText, selected === lang && styles.optionTextSelected]}>
                {getLanguageName(lang)}
              </Text>
              {selected === lang && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>{t('language.continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 24, textAlign: 'center' },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  optionTextSelected: { color: COLORS.primary },
  check: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  continueBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  continueBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});