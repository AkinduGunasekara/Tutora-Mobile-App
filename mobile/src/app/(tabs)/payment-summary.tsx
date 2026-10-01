import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Primary, Spacing } from '@/constants/theme';

type PaymentMethod = 'card' | 'bank_transfer' | 'wallet';

const METHODS: { id: PaymentMethod; emoji: string; label: string; sub: string }[] = [
  { id: 'card',          emoji: '💳', label: 'Card Payment',    sub: 'Visa / Mastercard / Amex' },
  { id: 'bank_transfer', emoji: '🏦', label: 'Bank Transfer',   sub: 'Direct bank deposit' },
  { id: 'wallet',        emoji: '👜', label: 'Wallet Balance',  sub: 'Instant deduction' },
];

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function PaymentSummaryScreen() {
  const params = useLocalSearchParams<{
    bookingId: string;
    tutorId: string;
    tutorName: string;
    subject: string;
    durationHours: string;
    hourlyRate: string;
    scheduledDate: string;
  }>();

  const hours    = parseFloat(params.durationHours ?? '1');
  const rate     = parseFloat(params.hourlyRate    ?? '0');
  const subtotal = hours * rate;
  const fee      = Math.round(subtotal * 0.05 * 100) / 100;
  const total    = subtotal + fee;

  const [method, setMethod] = useState<PaymentMethod>('card');

  const date = params.scheduledDate
    ? new Date(params.scheduledDate).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—';

  const handleProceed = () => {
    const sharedParams = {
      bookingId:     params.bookingId,
      tutorId:       params.tutorId,
      tutorName:     params.tutorName,
      subject:       params.subject,
      durationHours: params.durationHours,
      hourlyRate:    params.hourlyRate,
      scheduledDate: params.scheduledDate,
      paymentMethod: method,
    };

    if (method === 'bank_transfer') {
      // Bank transfer requires slip upload before processing
      router.push({ pathname: '/(tabs)/payment-bank-slip' as any, params: sharedParams });
    } else {
      router.push({ pathname: '/(tabs)/payment-processing' as any, params: sharedParams });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Payment Summary</Text>
          <Text style={styles.topbarSub}>Review before paying</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Order details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ORDER DETAILS</Text>
          <View style={styles.tutorRow}>
            <View style={styles.tutorAvatar}>
              <Text style={styles.tutorAvatarText}>
                {getInitials(params.tutorName ?? 'T')}
              </Text>
            </View>
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>{params.tutorName ?? 'Tutor'}</Text>
              <View style={styles.subjectPill}>
                <Text style={styles.subjectPillText}>{params.subject ?? 'Subject'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <DetailRow emoji="📅" label="Date"     value={date} />
          <DetailRow emoji="⏱"  label="Duration" value={`${hours} ${hours === 1 ? 'hour' : 'hours'}`} />
          <DetailRow emoji="💰" label="Rate"     value={`Rs. ${rate.toLocaleString()} / hr`} />
        </View>

        {/* Price breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PRICE BREAKDOWN</Text>
          <BreakdownRow label="Session Cost" value={`Rs. ${subtotal.toLocaleString()}`} />
          <BreakdownRow label="Service Fee (5%)" value={`Rs. ${fee.toFixed(2)}`} muted />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs. {total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PAYMENT METHOD</Text>
          {METHODS.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.methodRow, method === m.id && styles.methodRowActive]}
              onPress={() => setMethod(m.id)}>
              <Text style={styles.methodEmoji}>{m.emoji}</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodLabel}>{m.label}</Text>
                <Text style={styles.methodSub}>{m.sub}</Text>
              </View>
              <View style={[styles.radio, method === m.id && styles.radioActive]}>
                {method === m.id && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Escrow note */}
        <View style={styles.escrowNote}>
          <Text style={styles.escrowText}>
            🔒  Payment held in escrow until session completes
          </Text>
        </View>

        {/* Proceed button */}
        <Pressable
          style={({ pressed }) => [styles.proceedBtn, pressed && { opacity: 0.85 }]}
          onPress={handleProceed}>
          <Text style={styles.proceedBtnText}>Proceed to Pay →</Text>
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailEmoji}>{emoji}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function BreakdownRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, muted && { color: '#9CA3AF' }]}>{label}</Text>
      <Text style={[styles.breakdownValue, muted && { color: '#9CA3AF' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F5F6FA' },
  scroll: { padding: Spacing.four, gap: Spacing.three },

  // Top bar
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon:     { fontSize: 18, color: '#1A1A2E' },
  topbarCenter: { alignItems: 'center', flex: 1 },
  topbarTitle:  { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  topbarSub:    { fontSize: 12, color: '#6B7280' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  // Tutor row
  tutorRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tutorAvatar:    {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Primary, alignItems: 'center', justifyContent: 'center',
  },
  tutorAvatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  tutorInfo:       { flex: 1, gap: 4 },
  tutorName:       { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  subjectPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F7F5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  subjectPillText: { fontSize: 11, color: Primary, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#F3F4F6' },

  // Detail rows
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailEmoji: { fontSize: 14, width: 20 },
  detailLabel: { flex: 1, fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },

  // Breakdown
  breakdownRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: 14, color: '#374151' },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:    { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  totalValue:    { fontSize: 20, fontWeight: '800', color: Primary },

  // Payment method
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  methodRowActive: { borderColor: Primary, backgroundColor: '#E0F7F5' },
  methodEmoji:     { fontSize: 22 },
  methodInfo:      { flex: 1 },
  methodLabel:     { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  methodSub:       { fontSize: 11, color: '#6B7280', marginTop: 1 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Primary },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: Primary },

  // Escrow
  escrowNote: {
    backgroundColor: '#E0F7F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  escrowText: { fontSize: 13, color: Primary, fontWeight: '600', textAlign: 'center' },

  // Buttons
  proceedBtn: {
    backgroundColor: Primary,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  proceedBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  cancelBtn:      { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText:  { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
