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

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';
const CARD  = '#FFFFFF';

type PaymentMethod = 'card' | 'bank_transfer' | 'wallet';

const METHODS: { id: PaymentMethod; label: string; sub: string }[] = [
  { id: 'card',          label: 'Card Payment',   sub: 'Visa / Mastercard / Amex' },
  { id: 'bank_transfer', label: 'Bank Transfer',  sub: 'Direct bank deposit' },
  { id: 'wallet',        label: 'Wallet Balance', sub: 'Instant deduction' },
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
      router.push({ pathname: '/(tabs)/payment-bank-slip' as any, params: sharedParams });
    } else {
      router.push({ pathname: '/(tabs)/payment-processing' as any, params: sharedParams });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Payment Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Tutor card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>YOUR TUTOR</Text>
          <View style={styles.tutorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(params.tutorName ?? 'T')}</Text>
            </View>
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>{params.tutorName ?? 'Tutor'}</Text>
              <Text style={styles.tutorSubject}>{params.subject ?? 'Subject'}</Text>
            </View>
          </View>
        </View>

        {/* Order details card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SESSION DETAILS</Text>
          <DetailRow label="Date"     value={date} />
          <View style={styles.divider} />
          <DetailRow label="Duration" value={`${hours} ${hours === 1 ? 'hour' : 'hours'}`} />
          <View style={styles.divider} />
          <DetailRow label="Rate"     value={`Rs. ${rate.toLocaleString()} / hr`} />
        </View>

        {/* Price breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PRICE BREAKDOWN</Text>
          <DetailRow label="Session Cost"    value={`Rs. ${subtotal.toLocaleString()}`} />
          <View style={styles.divider} />
          <DetailRow label="Service Fee (5%)" value={`Rs. ${fee.toFixed(2)}`} muted />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs. {total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          {METHODS.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.methodRow, method === m.id && styles.methodRowActive]}
              onPress={() => setMethod(m.id)}>
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
          <Text style={styles.escrowText}>Payment held in escrow until session completes</Text>
        </View>

        {/* Proceed button */}
        <Pressable
          style={({ pressed }) => [styles.proceedBtn, pressed && { opacity: 0.85 }]}
          onPress={handleProceed}>
          <Text style={styles.proceedBtnText}>Proceed to Pay</Text>
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, muted && { color: MUTED }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: PAGE },
  scroll: { padding: 16, gap: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: PAGE,
    borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
  },
  backIcon:    { fontSize: 20, color: INK, fontWeight: '600' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: INK },

  // Card
  card: {
    backgroundColor: CARD, borderRadius: 12, padding: 14, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  // Tutor row
  tutorRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:      {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { color: '#fff', fontSize: 15, fontWeight: '800' },
  tutorInfo:   { flex: 1, gap: 3 },
  tutorName:   { fontSize: 14, fontWeight: '700', color: INK },
  tutorSubject:{ fontSize: 12, color: MUTED },

  divider: { height: 1, backgroundColor: '#F0EFE5' },

  // Detail rows
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: MUTED },
  detailValue: { fontSize: 12, fontWeight: '600', color: INK },

  // Total
  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  totalLabel: { fontSize: 13, fontWeight: '700', color: INK },
  totalValue: { fontSize: 20, fontWeight: '800', color: TEAL },

  // Payment method
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E4E1D2',
    backgroundColor: PAGE,
  },
  methodRowActive: { borderColor: TEAL, backgroundColor: '#E1F4EF' },
  methodInfo:      { flex: 1 },
  methodLabel:     { fontSize: 13, fontWeight: '600', color: INK },
  methodSub:       { fontSize: 11, color: MUTED, marginTop: 2 },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#C8C5B8',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: TEAL },
  radioDot:    { width: 9, height: 9, borderRadius: 5, backgroundColor: TEAL },

  // Escrow
  escrowNote: {
    backgroundColor: '#E1F4EF', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center',
  },
  escrowText: { fontSize: 12, color: TEAL, fontWeight: '600', textAlign: 'center' },

  // Buttons
  proceedBtn: {
    backgroundColor: TEAL, borderRadius: 10,
    paddingVertical: 15, alignItems: 'center',
  },
  proceedBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn:      { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText:  { fontSize: 13, color: MUTED, fontWeight: '600' },
});
