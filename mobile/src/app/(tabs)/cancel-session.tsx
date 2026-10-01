import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';

const INK = '#171943';
const TEAL = '#008C91';
const PAGE = '#EFEDDC';
const MUTED = '#78809A';
const RED = '#D92D2D';

const asText = (value: string | string[] | undefined, fallback = '') =>
  Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;

const dateFromParam = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const endTime = (startTime: string, minutes: number) => {
  const match = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return startTime;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  const date = new Date(2000, 0, 1, hours, Number(match[2]));
  date.setMinutes(date.getMinutes() + minutes);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function CancelSessionScreen() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    date?: string;
    time?: string;
    durationMinutes?: string;
    meetingType?: string;
    tutorName?: string;
    tutorSubtitle?: string;
    sessionTitle?: string;
    refund?: string;
  }>();
  const bookingId = asText(params.bookingId);
  const date = asText(params.date);
  const sessionDate = dateFromParam(date);
  const time = asText(params.time, '10:00 AM');
  const durationMinutes = Number(asText(params.durationMinutes, '60')) || 60;
  const meetingType = asText(params.meetingType, 'Microsoft Teams');
  const tutorName = asText(params.tutorName, 'Tutor');
  const tutorSubtitle = asText(params.tutorSubtitle, 'Tutoring Session');
  const sessionTitle = asText(params.sessionTitle, tutorSubtitle);
  const refund = Number(asText(params.refund, '0')) || 0;
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const cancelSession = async () => {
    if (!bookingId) {
      setErrorMessage('Booking ID is missing. Return to My Calendar and try again.');
      return;
    }
    setSaving(true);
    setErrorMessage('');
    try {
      await api.patch(`/bookings/${bookingId}/cancel`, { reason });
      router.replace({
        pathname: '/(tabs)/session-cancelled' as any,
        params: {
          bookingId,
          date,
          time,
          durationMinutes: String(durationMinutes),
          meetingType,
          tutorName,
          tutorSubtitle,
          sessionTitle,
          refund: String(refund),
          cancelledOn: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? 'Could not cancel this session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeLabel = `${time} - ${endTime(time, durationMinutes)}`;
  const durationLabel = durationMinutes === 30 ? '30 Minutes' : durationMinutes === 60 ? '1 Hour' : `${durationMinutes / 60} Hours`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to My Calendar"
            onPress={() => router.replace({ pathname: '/(tabs)/bookings' as any, params: { date } })}
            hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Cancel Session</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sessionCard}>
            <View style={styles.titleRow}>
              <Text style={styles.sessionTitle}>{sessionTitle}</Text>
              <View style={styles.confirmedBadge}><Text style={styles.confirmedText}>Confirmed</Text></View>
            </View>
            <Text style={styles.tutor}>Tutor: {tutorName}</Text>
            <Text style={styles.sessionDate}>{dateLabel} · {timeLabel}</Text>
          </View>

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Are you sure you want to cancel?</Text>
            <Text style={styles.warningText}>Cancellations made more than 24 hours before the session are fully refundable.</Text>
          </View>

          <View style={styles.reasonCard}>
            <Text style={styles.sectionTitle}>Reason for cancellation (Optional)</Text>
            <TextInput
              accessibilityLabel="Reason for cancellation"
              multiline
              maxLength={500}
              textAlignVertical="top"
              placeholder="Explain why you are cancelling..."
              placeholderTextColor={MUTED}
              value={reason}
              onChangeText={setReason}
              style={styles.reasonInput}
            />
          </View>

          <View style={styles.refundCard}>
            <Text style={styles.refundLabel}>Estimated Refund</Text>
            <Text style={styles.refundAmount}>Rs {refund.toLocaleString('en-LK')}</Text>
          </View>

          {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={saving} onPress={cancelSession} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed, saving && styles.disabled]}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.cancelText}>Cancel Session</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => router.back()} style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}>
              <Text style={styles.keepText}>Keep Session</Text>
            </Pressable>
          </View>
          <Text style={styles.sessionMeta}>{durationLabel} · {meetingType === 'Microsoft Teams' ? 'Microsoft Teams Meeting' : meetingType}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },
  page: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: PAGE },
  header: { height: 52, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: '#E4E1D2' },
  back: { color: INK, fontSize: 30, lineHeight: 36, width: 20 },
  headerTitle: { color: INK, fontSize: 16, fontWeight: '700' },
  content: { flexGrow: 1, padding: 16, paddingBottom: 22, gap: 14 },
  sessionCard: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 12, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sessionTitle: { color: INK, fontSize: 11, fontWeight: '800', flex: 1 },
  confirmedBadge: { backgroundColor: PAGE, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  confirmedText: { color: TEAL, fontSize: 8, fontWeight: '800' },
  tutor: { color: MUTED, fontSize: 9 },
  sessionDate: { color: INK, fontSize: 10, fontWeight: '700' },
  warningCard: { backgroundColor: '#FFF4F3', borderColor: '#F7B9B5', borderWidth: 1, borderRadius: 10, padding: 12, gap: 7 },
  warningTitle: { color: RED, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  warningText: { color: '#514C67', fontSize: 9, lineHeight: 14 },
  reasonCard: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 11, gap: 7 },
  sectionTitle: { color: INK, fontSize: 11, fontWeight: '700' },
  reasonInput: { minHeight: 70, borderRadius: 6, borderWidth: 1, borderColor: '#E3E3E3', backgroundColor: '#F5F5F5', color: INK, fontSize: 10, padding: 9 },
  refundCard: { minHeight: 40, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refundLabel: { color: INK, fontSize: 11, fontWeight: '700' },
  refundAmount: { color: TEAL, fontSize: 11, fontWeight: '800' },
  error: { color: '#B42318', fontSize: 11, textAlign: 'center' },
  actions: { gap: 8 },
  cancelButton: { minHeight: 42, borderRadius: 9, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  keepButton: { minHeight: 40, borderRadius: 9, borderWidth: 1.5, borderColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  keepText: { color: TEAL, fontSize: 12, fontWeight: '700' },
  sessionMeta: { color: MUTED, fontSize: 9, textAlign: 'center' },
  disabled: { opacity: 0.75 },
  pressed: { opacity: 0.82 },
});
