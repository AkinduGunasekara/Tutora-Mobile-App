import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
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

const BANK_DETAILS = [
  { label: 'Bank',         value: 'Commercial Bank of Ceylon' },
  { label: 'Account Name', value: 'Tutora (Pvt) Ltd' },
  { label: 'Account No.', value: '8001 2345 6789' },
  { label: 'Branch',       value: 'Colombo 03' },
  { label: 'Reference',    value: 'TUTORA-ESCROW' },
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

  const [slipUri,      setSlipUri]      = useState('');
  const [slipName,     setSlipName]     = useState('');
  const [reference,    setReference]    = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  const slipUploaded = slipUri !== '';

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

  const handleSubmit = async () => {
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
        params: { ...params, paymentId: payment._id },
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not submit slip. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Bank Transfer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Amount banner */}
        <View style={styles.amountBanner}>
          <Text style={styles.amountLabel}>Transfer Amount</Text>
          <Text style={styles.amountValue}>Rs. {total.toLocaleString()}</Text>
          <Text style={styles.amountSub}>Includes service fee of Rs. {fee.toFixed(2)}</Text>
        </View>

        {/* Bank details */}
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

        {/* Steps */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          {[
            'Transfer the amount to the account above',
            'Upload your bank slip or screenshot below',
            'We verify and hold your payment in escrow',
            'Payment released to tutor after session ends',
          ].map((text, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Slip upload */}
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

        {/* Escrow note */}
        <View style={styles.escrowNote}>
          <Text style={styles.escrowText}>
            Your payment will be held in escrow and only released to the tutor after your session is complete.
          </Text>
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            (!slipUploaded || submitting) && { opacity: 0.45 },
            slipUploaded && pressed && { opacity: 0.85 },
          ]}
          onPress={handleSubmit}
          disabled={submitting || !slipUploaded}>
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting...' : 'Submit & Proceed'}
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
  safe:   { flex: 1, backgroundColor: PAGE },
  scroll: { padding: 16, gap: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: PAGE, borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
  },
  backIcon:    { fontSize: 20, color: INK, fontWeight: '600' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: INK },

  amountBanner: {
    backgroundColor: TEAL, borderRadius: 12,
    padding: 18, alignItems: 'center', gap: 4,
  },
  amountLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  amountValue: { fontSize: 30, fontWeight: '900', color: '#fff' },
  amountSub:   { fontSize: 11, color: 'rgba(255,255,255,0.7)' },

  card: {
    backgroundColor: CARD, borderRadius: 12, padding: 14, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 1, textTransform: 'uppercase',
  },

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
  uploadZoneDone: {
    borderColor: TEAL, borderStyle: 'solid', backgroundColor: '#E1F4EF',
  },
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
  escrowText: { fontSize: 11, color: TEAL, fontWeight: '600', textAlign: 'center', lineHeight: 16 },

  submitBtn: {
    backgroundColor: TEAL, borderRadius: 10,
    paddingVertical: 15, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn:     { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { fontSize: 13, color: MUTED, fontWeight: '600' },
});
