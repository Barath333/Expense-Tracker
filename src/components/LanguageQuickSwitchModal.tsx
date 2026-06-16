import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, SupportedLanguage } from '../i18n';

const COLORS = {
  primary: '#1A9B5E',
  primaryLight: '#E8F7F0',
  white: '#FFFFFF',
  text: '#1A1A1A',
  border: '#D1E9DC',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGES: SupportedLanguage[] = ['en', 'ta', 'hi', 'mr', 'te'];

export default function LanguageQuickSwitchModal({ visible, onClose }: Props) {
  const { t, i18n } = useTranslation();

  const handleSelect = (lang: SupportedLanguage) => {
    changeLanguage(lang);
    onClose();
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <Text style={styles.title}>{t('language.selectLanguage')}</Text>

          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.option, i18n.language === lang && styles.optionSelected]}
              onPress={() => handleSelect(lang)}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionText, i18n.language === lang && styles.optionTextSelected]}>
                {getLanguageName(lang)}
              </Text>
              {i18n.language === lang && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', backgroundColor: COLORS.white, borderRadius: 20, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  option: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10,
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  optionText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  optionTextSelected: { color: COLORS.primary },
  check: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
});