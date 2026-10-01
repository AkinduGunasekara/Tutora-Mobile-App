import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Primary, Spacing } from '@/constants/theme';

const BANK_DETAILS = [
  { label: 'Bank',           value: 'Commercial Bank of Ceylon' },
  { label: 'Account Name',   value: 'Tutora (Pvt) Ltd' },
  { label: 'Account No.',    value: '8001 2345 6789' },
  { label: 'Branch',         value: 'Colombo 03' },
  { label: 'Reference',      value: 'TUTORA-ESCROW' },
];

export default function PaymentBankSlipScreen() {
  const params = useLocalSearchParams<{
    bookingId: string; tutorId: string; tutorName: string;
    subject: string; durationHours: string; hourlyRate: string;
    scheduledDate: string; paymentMethod: string;
  }>();

  const hours    = parseFloat(params.durationHours ?? '1');
  const rate     = parseFloat(params.hourlyRate    ?? '0');
  const subtotal = hours * rate;
  const fee      = Math.round(subtotal * 0.05 * 100) / 100;
  const total    = subtotal + fee;

  const [slipUploaded, setSlipUploaded] = useState(false);
  const [slipName,     setSlipName]     = useState('');
  const [reference,    setReference]    = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  const handlePickSlip = () => {
    // Mock file picker — in production use expo-document-picker
    const mockFileName = `bank_slip_${Date.now()}.jpg`;
    setSlipName(mockFileName);
    setSlipUploaded(true);
  };

  const handleSubmit = () => {
    if (!slipUploaded) {
      Alert.alert('Slip required', 'Please upload your bank transfer slip before proceeding.');
      return;
    }
    setSubmitting(true);
    // Navigate to processing — the slip is "verified" during processing
    router.replace({
      pathname: '/(tabs)/payment-processing' as any,
      params: { ...params },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Bank Transfer</Text>
          <Text style={styles.topbarSub}>Upload payment slip</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Amount banner */}
        <View style={styles.amountBanner}>
          <Text style={styles.amountLabel}>Transfer Amount</Text>
          <Text style={styles.amountValue}>Rs. {total.toLocaleString()}</Text>
          <Text style={styles.amountSub}>Include service fee of Rs. {fee.toFixed(2)}</Text>
        </View>

        {/* Bank details */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>BANK ACCOUNT DETAILS</Text>
            <Pressable onPress={() => Alert.alert('Copied', 'Account details copied.')}>
              <Text style={styles.copyLink}>Copy All</Text>
            </Pressable>
          </View>
          {BANK_DETAILS.map((row) => (
            <View key={row.label} style={styles.bankRow}>
              <Text style={styles.bankLabel}>{row.label}</Text>
              <Text style={styles.bankValue}>{row.value}</Text>
            </View>
          ))}
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️  Use your booking reference as the transfer description so we can identify your payment.
            </Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>HOW IT WORKS</Text>
          {[
            { n: '1', t: 'Transfer the amount to the account above' },
            { n: '2', t: 'Upload your bank slip or screenshot below' },
            { n: '3', t: 'We verify and hold your payment in escrow' },
            { n: '4', t: 'Payment released to tutor after session ends' },
          ].map((s) => (
            <View key={s.n} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{s.n}</Text>
              </View>
              <Text style={styles.stepText}>{s.t}</Text>
            </View>
          ))}
        </View>

        {/* Slip upload */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>UPLOAD PAYMENT SLIP</Text>

          <Pressable
            style={[styles.uploadZone, slipUploaded && styles.uploadZoneDone]}
            onPress={handlePickSlip}>
            {slipUploaded ? (
              <>
                <Text style={styles.uploadDoneIcon}>✅</Text>
                <Text style={styles.uploadDoneText}>{slipName}</Text>
                <Text style={styles.uploadChangeText}>Tap to change</Text>
              </>
            ) : (
              <>
                <Text style={styles.uploadIcon}>📤</Text>
                <Text style={styles.uploadTitle}>Tap to upload slip</Text>
                <Text style={styles.uploadSub}>JPG, PNG or PDF — max 5MB</Text>
              </>
            )}
          </Pressable>

          {/* Optional reference */}
          <Text style={styles.fieldLabel}>Transfer Reference / Transaction ID (optional)</Text>
          <TextInput
            style={styles.referenceInput}
            placeholder="e.g. TXN-20261001-00123"
            placeholderTextColor="#9CA3AF"
            value={reference}
            onChangeText={setReference}
            autoCapitalize="characters"
          />
        </View>

        {/* Escrow note */}
        <View style={styles.escrowNote}>
          <Text style={styles.escrowText}>
            🔒  Your payment will be held in escrow and only released to the tutor after your session is complete.
          </Text>
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            (!slipUploaded || pressed || submitting) && { opacity: slipUploaded ? 0.85 : 0.45 },
          ]}
          onPress={handleSubmit}
          disabled={submitting}>
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting...' : 'Submit & Proceed →'}
          </Text>
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F5F6FA' },
  scroll: { padding: Spacing.four, gap: Spacing.three },

  // Top bar
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
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

  // Amount banner
  amountBanner: {
    backgroundColor: Primary, borderRadius: 16,
    padding: Spacing.four, alignItems: 'center', gap: 4,
    shadowColor: Primary, shadowOpacity: 0.3,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  amountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  amountValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
  amountSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: Spacing.three, gap: Spacing.two,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  copyLink: { fontSize: 12, color: Primary, fontWeight: '700' },

  // Bank details
  bankRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  bankLabel: { fontSize: 13, color: '#6B7280' },
  bankValue: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  warningBox: {
    backgroundColor: '#FEF3C7', borderRadius: 10,
    padding: 12, marginTop: 4,
  },
  warningText: { fontSize: 12, color: '#92400E', lineHeight: 18 },

  // Steps
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Primary, alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontSize: 12, color: '#fff', fontWeight: '800' },
  stepText:    { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },

  // Upload zone
  uploadZone: {
    borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed',
    borderRadius: 14, paddingVertical: 32, alignItems: 'center', gap: 8,
    backgroundColor: '#F9FAFB',
  },
  uploadZoneDone: {
    borderColor: Primary, borderStyle: 'solid', backgroundColor: '#E0F7F5',
  },
  uploadIcon:     { fontSize: 32 },
  uploadTitle:    { fontSize: 15, fontWeight: '700', color: '#374151' },
  uploadSub:      { fontSize: 12, color: '#9CA3AF' },
  uploadDoneIcon: { fontSize: 32 },
  uploadDoneText: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', textAlign: 'center', maxWidth: 240 },
  uploadChangeText: { fontSize: 12, color: Primary, fontWeight: '600' },

  // Reference
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  referenceInput: {
    backgroundColor: '#F5F6FA', borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1A1A2E',
  },

  // Escrow
  escrowNote: {
    backgroundColor: '#E0F7F5', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: Spacing.three,
  },
  escrowText: { fontSize: 13, color: Primary, fontWeight: '600', lineHeight: 20, textAlign: 'center' },

  // Buttons
  submitBtn: {
    backgroundColor: Primary, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: Primary, shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  cancelBtn:     { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
