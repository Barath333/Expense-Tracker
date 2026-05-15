import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Share,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#1A9B5E',
  primaryLight: '#E8F7F0',
  dark: '#0D0D0D',
  darkCard: '#1A1A1A',
  white: '#FFFFFF',
  textMuted: '#9CA3AF',
  border: '#2A2A2A',
  danger: '#E53E3E',
  dangerDark: '#C53030',
  success: '#22C55E',
  successLight: '#DCFCE7',
};

// Mock receipt data — replace with route.params in real usage
const RECEIPT = {
  shopName: 'Murugan Idli Shop',
  shopIcon: '🍽️',
  items: [
    { name: 'Idli (4 pcs)', amount: 80 },
    { name: 'Dosa', amount: 70 },
    { name: 'Filter Coffee (2)', amount: 60 },
    { name: 'Sambar Vada', amount: 120 },
  ],
  subtotal: 330,
  gstPercent: 5,
  gstAmount: 17,
  total: 347,
  paidDate: '30 May 2025',
};

export default function ReceiptScreen() {
  const navigation = useNavigation();

  const handleShare = async () => {
    const itemLines = RECEIPT.items
      .map(i => `${i.name.padEnd(20)} ₹${i.amount}`)
      .join('\n');
    const text = `🧾 Receipt — ${RECEIPT.shopName}\n\n${itemLines}\n\nSubtotal: ₹${RECEIPT.subtotal}\nGST ${RECEIPT.gstPercent}%: ₹${RECEIPT.gstAmount}\nTotal: ₹${RECEIPT.total}\n\nPaid · ${RECEIPT.paidDate}`;
    await Share.share({ message: text });
  };

  const handleDelete = () => {
    // TODO: dispatch delete action + navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtnIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
            <Text style={styles.headerBtnIcon}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, { marginLeft: 8 }]} onPress={handleDelete}>
            <Text style={styles.headerBtnIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Receipt Card */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receiptCard}>
          {/* Zigzag top edge */}
          <View style={styles.zigzagTop} />

          <View style={styles.receiptInner}>
            {/* Shop */}
            <Text style={styles.shopIcon}>{RECEIPT.shopIcon}</Text>
            <Text style={styles.shopName}>{RECEIPT.shopName}</Text>

            <View style={styles.divider} />

            {/* Items */}
            {RECEIPT.items.map((item, idx) => (
              <View key={idx} style={styles.lineRow}>
                <Text style={styles.lineLabel}>{item.name}</Text>
                <Text style={styles.lineAmount}>₹{item.amount}</Text>
              </View>
            ))}

            <View style={styles.dividerDashed} />

            {/* Subtotal + GST */}
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Subtotal</Text>
              <Text style={styles.lineAmount}>₹{RECEIPT.subtotal}</Text>
            </View>
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>GST {RECEIPT.gstPercent}%</Text>
              <Text style={styles.lineAmount}>₹{RECEIPT.gstAmount}</Text>
            </View>

            <View style={styles.divider} />

            {/* Total */}
            <View style={styles.lineRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{RECEIPT.total}</Text>
            </View>

            {/* Paid badge */}
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>✓ Paid · {RECEIPT.paidDate}</Text>
            </View>
          </View>

          {/* Zigzag bottom edge */}
          <View style={styles.zigzagBottom} />
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareBtnText}>📤  Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
          <Text style={styles.deleteBtnText}>🗑️  Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnIcon: { fontSize: 18 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row' },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },

  receiptCard: {
    backgroundColor: COLORS.white,
    borderRadius: 4,
    overflow: 'hidden',
  },

  zigzagTop: {
    height: 12,
    backgroundColor: COLORS.dark,
    // Simulated with border cuts — use a custom SVG for true zigzag in production
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  zigzagBottom: {
    height: 12,
    backgroundColor: COLORS.dark,
  },

  receiptInner: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  shopIcon: { fontSize: 32, textAlign: 'center', marginBottom: 6 },
  shopName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 16,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  dividerDashed: {
    height: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    marginVertical: 12,
  },

  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lineLabel: { fontSize: 14, color: '#4B5563' },
  lineAmount: { fontSize: 14, color: COLORS.dark, fontWeight: '500' },

  totalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  totalAmount: { fontSize: 16, fontWeight: '800', color: COLORS.dark },

  paidBadge: {
    marginTop: 16,
    backgroundColor: COLORS.successLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  paidText: { color: COLORS.success, fontWeight: '700', fontSize: 14 },

  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.dark,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  shareBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    flex: 1,
    backgroundColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  deleteBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});