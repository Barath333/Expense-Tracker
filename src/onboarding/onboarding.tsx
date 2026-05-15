import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { saveItem } from '../utils/storage';

export default function Onboarding({ navigation }: any) {
  const goToLogin = async () => {
    try {
      await saveItem('hasLaunched', 'true');
      navigation.replace('Login');
    } catch (error) {
      navigation.replace('Login');
    }
  };

  return (
    <LinearGradient
      colors={['#0a4835', '#0e5c42', '#14a060', '#1db876']}
      locations={[0, 0.3, 0.65, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.inner}>
        <View style={{ height: 48 }} />
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>💰</Text>
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>SpendWise</Text>
        </View>
        <View style={styles.subtitleWrapper}>
          <Text style={styles.subtitle}>AI-Powered Expense Tracker</Text>
        </View>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardEmoji}>🤖</Text>
          <Text style={styles.cardTitle}>AI-Powered Insights</Text>
          <Text style={styles.cardText}>
            Gemini AI analyses your spending and gives you 3 actionable insights every month
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={goToLogin}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToLogin} style={styles.skipWrapper}>
          <Text style={styles.skip}>Skip →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, alignItems: 'center', paddingHorizontal: 22, paddingBottom: 32 },
  iconBox: {
    width: 110,
    height: 110,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  iconEmoji: { fontSize: 50 },
  titleWrapper: {
    backgroundColor: 'rgba(14,110,75,0.85)',
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  title: { fontSize: 34, fontWeight: '800', color: '#ffffff', letterSpacing: 0.2 },
  subtitleWrapper: {
    backgroundColor: 'rgba(14,110,75,0.7)',
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    marginBottom: 4,
  },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  dots: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 28, gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.38)' },
  activeDot: { width: 26, borderRadius: 4, backgroundColor: '#ffffff' },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 22,
    borderRadius: 20,
  },
  cardEmoji: { fontSize: 34, marginBottom: 12 },
  cardTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700', marginBottom: 10 },
  cardText: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 22 },
  button: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#0a4835' },
  skipWrapper: { marginTop: 16, alignItems: 'center' },
  skip: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});