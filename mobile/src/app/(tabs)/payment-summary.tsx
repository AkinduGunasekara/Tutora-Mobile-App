import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';

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

const BANK_DETAILS = [
  { label: 'Bank',         value: 'Commercial Bank of Ceylon' },
  { label: 'Account Name', value: 'Tutora (Pvt) Ltd' },
  { label: 'Account No.',  value: '8001 2345 6789' },
  { label: 'Branch',       value: 'Colombo 03' },
  { label: 'Reference',    value: 'TUTORA-ESCROW' },
];

const HOW_IT_WORKS = [
  'Transfer the amount to the account above',
  'Upload your bank slip or screenshot below',
  'We verify and hold your payment in escrow',
  'Payment released to tutor after session ends',
];

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function DetailRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, muted && { color: MUTED }]}>{value}</Text>
    </View>
  );
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

  const [method,     setMethod]     = useState<PaymentMethod>('card');
  const [slipUri,    setSlipUri]    = useState('');
  const [slipName,   setSlipName]   = useState('');
  const [reference,  setReference]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isBankTransfer = method === 'bank_transfer';
  const slipUploaded   = slipUri !== '';

  const date = params.scheduledDate
    ? new Date(params.scheduledDate).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—';

  const handlePickSlip = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a slip.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSlipUri(result.assets[0].uri);
      setSlipName(result.assets[0].fileName ?? `slip_${Date.now()}.jpg`);
    }
  };

  const handleProceed = async () => {
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

    if (isBankTransfer) {
      if (!slipUploaded) {
        Alert.alert('Slip required', 'Please upload your bank transfer slip before proceeding.');
        return;
      }
      setSubmitting(true);
      try {
        const { data: payment } = await api.post('/payment', {
          bookingId:        params.bookingId,
          amount:           total,
          method:           'bank_transfer',
          bankSlipRef:      reference.trim(),
          bankSlipFileName: slipName,
        });
        router.replace({
          pathname: '/(tabs)/payment-processing' as any,
          params: { ...sharedParams, paymentId: payment._id },
        });
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.message ?? 'Could not submit slip. Please try again.');
        setSubmitting(false);
      }
    } else {
      router.push({ pathname: '/(tabs)/payment-processing' as any, params: sharedParams });
    }
  };

  const canProceed = !isBankTransfer || slipUploaded;

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

        {/* Session details */}
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
          <DetailRow label="Session Cost"     value={`Rs. ${subtotal.toLocaleString()}`} />
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

        {/* ── Bank Transfer fields — shown inline when selected ── */}
        {isBankTransfer && (
          <>
            {/* Bank account details */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>BANK ACCOUNT DETAILS</Text>
              {BANK_DETAILS.map((row) => (
                <View key={row.label} style={styles.bankRow}>
                  <Text style={styles.bankLabel}>{row.label}</Text>
                  <Text style={styles.bankValue}>{row.value}</Text>
                </View>
              ))}
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  Use your booking reference as the transfer description so we can identify your payment.
                </Text>
              </View>
            </View>

            {/* How it works */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
              {HOW_IT_WORKS.map((text, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* Upload slip */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>UPLOAD PAYMENT SLIP</Text>

              <Pressable
                style={[styles.uploadZone, slipUploaded && styles.uploadZoneDone]}
                onPress={handlePickSlip}>
                {slipUploaded ? (
                  <>
                    <Image source={{ uri: slipUri }} style={styles.slipPreview} resizeMode="cover" />
                    <Text style={styles.slipName} numberOfLines={1}>{slipName}</Text>
                    <Text style={styles.uploadChange}>Tap to change</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.uploadIconBox}>
                      <Text style={styles.uploadIconText}>+</Text>
                    </View>
                    <Text style={styles.uploadTitle}>Tap to upload slip</Text>
                    <Text style={styles.uploadSub}>JPG or PNG from your gallery</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.fieldLabel}>Transaction Reference / ID (optional)</Text>
              <TextInput
                style={styles.referenceInput}
                placeholder="e.g. TXN-20261001-00123"
                placeholderTextColor={MUTED}
                value={reference}
                onChangeText={setReference}
                autoCapitalize="characters"
              />
            </View>
          </>
        )}

        {/* Escrow note */}
        <View style={styles.escrowNote}>
          <Text style={styles.escrowText}>Payment held in escrow until session completes</Text>
        </View>

        {/* Proceed button */}
        <Pressable
          style={({ pressed }) => [
            styles.proceedBtn,
            (!canProceed || submitting) && { opacity: 0.45 },
            canProceed && !submitting && pressed && { opacity: 0.85 },
          ]}
          onPress={handleProceed}
          disabled={!canProceed || submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.proceedBtnText}>
                {isBankTransfer ? 'Submit & Proceed' : 'Proceed to Pay'}
              </Text>
          }
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
  safe:   { flex: 1, backgroundColor: PAGE },
  scroll: { padding: 16, gap: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: PAGE, borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
  },
  backIcon:    { fontSize: 20, color: INK, fontWeight: '600' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: INK },

  card: {
    backgroundColor: CARD, borderRadius: 12, padding: 14, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  tutorRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:      {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { color: '#fff', fontSize: 15, fontWeight: '800' },
  tutorInfo:    { flex: 1, gap: 3 },
  tutorName:    { fontSize: 14, fontWeight: '700', color: INK },
  tutorSubject: { fontSize: 12, color: MUTED },

  divider: { height: 1, backgroundColor: '#F0EFE5' },

  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: MUTED },
  detailValue: { fontSize: 12, fontWeight: '600', color: INK },

  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  totalLabel: { fontSize: 13, fontWeight: '700', color: INK },
  totalValue: { fontSize: 20, fontWeight: '800', color: TEAL },

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

  // Bank transfer
  bankRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F0EFE5',
  },
  bankLabel: { fontSize: 12, color: MUTED },
  bankValue: { fontSize: 12, fontWeight: '700', color: INK },
  warningBox: {
    backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, marginTop: 2,
  },
  warningText: { fontSize: 11, color: '#92400E', lineHeight: 16 },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  stepNumText: { fontSize: 11, color: '#fff', fontWeight: '800' },
  stepText:    { flex: 1, fontSize: 12, color: INK, lineHeight: 18 },

  uploadZone: {
    borderWidth: 2, borderColor: '#E4E1D2', borderStyle: 'dashed',
    borderRadius: 10, paddingVertical: 28, alignItems: 'center', gap: 8,
    backgroundColor: '#F9F8F3',
  },
  uploadZoneDone: { borderColor: TEAL, borderStyle: 'solid', backgroundColor: '#E1F4EF' },
  uploadIconBox: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: '#E4E1D2', alignItems: 'center', justifyContent: 'center',
  },
  uploadIconText: { fontSize: 28, color: MUTED, lineHeight: 34 },
  uploadTitle:    { fontSize: 13, fontWeight: '700', color: INK },
  uploadSub:      { fontSize: 11, color: MUTED },
  slipPreview:    { width: 120, height: 80, borderRadius: 8 },
  slipName:       { fontSize: 11, fontWeight: '700', color: INK, maxWidth: 240, textAlign: 'center' },
  uploadChange:   { fontSize: 11, color: TEAL, fontWeight: '600' },

  fieldLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  referenceInput: {
    backgroundColor: PAGE, borderRadius: 8,
    borderWidth: 1, borderColor: '#E4E1D2',
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: INK,
  },

  escrowNote: {
    backgroundColor: '#E1F4EF', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center',
  },
  escrowText: { fontSize: 12, color: TEAL, fontWeight: '600', textAlign: 'center' },

  proceedBtn: {
    backgroundColor: TEAL, borderRadius: 10,
    paddingVertical: 15, alignItems: 'center',
  },
  proceedBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn:      { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText:  { fontSize: 13, color: MUTED, fontWeight: '600' },
});
