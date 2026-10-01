import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';

const INK = '#171943';
const TEAL = '#008C91';
const PAGE = '#EFEDDC';
const MUTED = '#78809A';

const asText = (value: string | string[] | undefined, fallback = '') =>
  Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;

const parseDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(2026, 9, 14);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateParam = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const dateLabel = (value: string) =>
  parseDate(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const durationName = (minutes: number) => {
  if (minutes === 30) return '30 min';
  if (minutes === 60) return '1 Hour';
  return `${minutes / 60} Hours`;
};

const getEndTime = (startTime: string, durationMinutes: number) => {
  const match = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return startTime;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  const date = new Date(2000, 0, 1, hours, Number(match[2]));
  date.setMinutes(date.getMinutes() + durationMinutes);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function RescheduleConfirmationScreen() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    originalDate?: string;
    originalTime?: string;
    proposedDate?: string;
    proposedTime?: string;
    durationMinutes?: string;
    meetingType?: string;
    message?: string;
    reason?: string;
    tutorName?: string;
    tutorSubtitle?: string;
    tutorInitials?: string;
    hourlyRate?: string;
  }>();

  const bookingId = asText(params.bookingId);
  const originalDate = asText(params.originalDate, '2026-10-14');
  const originalTime = asText(params.originalTime, '10:00 AM');
  const proposedDate = asText(params.proposedDate, '2026-10-16');
  const proposedTime = asText(params.proposedTime, '2:00 PM');
  const durationMinutes = Number(asText(params.durationMinutes, '60')) || 60;
  const meetingType = asText(params.meetingType, 'Microsoft Teams');
  const message = asText(params.message);
  const reason = asText(params.reason);
  const tutorName = asText(params.tutorName, 'Tutor');
  const tutorSubtitle = asText(params.tutorSubtitle, 'Tutoring Session');
  const tutorInitials = asText(params.tutorInitials, 'T');
  const hourlyRate = asText(params.hourlyRate);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const returnToEditor = () => router.replace({
    pathname: '/(tabs)/reschedule-session' as any,
    params: {
      bookingId,
      date: originalDate,
      time: originalTime,
      durationMinutes: String(durationMinutes),
      meetingType,
      message,
      tutorName,
      tutorSubtitle,
      tutorInitials,
      hourlyRate,
      proposedDate,
      proposedTime,
      reason,
    },
  });

  const confirmReschedule = async () => {
    if (!bookingId) {
      setErrorMessage('Booking ID is missing. Return to My Calendar and try again.');
      return;
    }
    setSaving(true);
    setErrorMessage('');
    try {
      await api.patch(`/bookings/${bookingId}/reschedule`, {
        date: proposedDate,
        time: proposedTime,
        durationMinutes,
        meetingType,
        message,
        reason,
      });
      router.replace({
        pathname: '/(tabs)/booking-confirmed' as any,
        params: {
          bookingId,
          date: proposedDate,
          dateLabel: dateLabel(proposedDate),
          time: proposedTime,
          duration: durationName(durationMinutes),
          meetingType,
          tutorName,
          wasRescheduled: 'true',
        },
      });
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? 'Could not reschedule this session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const originalRange = `${originalTime} - ${getEndTime(originalTime, durationMinutes)}`;
  const proposedRange = `${proposedTime} - ${getEndTime(proposedTime, durationMinutes)}`;
  const meetingLabel = meetingType === 'Microsoft Teams' ? 'Microsoft Teams Meeting' : meetingType;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to reschedule form" onPress={returnToEditor} hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Confirm Reschedule</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.tutorCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{tutorInitials}</Text></View>
            <View style={styles.tutorCopy}>
              <Text style={styles.tutorName}>{tutorName} <Text style={styles.verified}>✓</Text></Text>
              <Text numberOfLines={1} style={styles.tutorSubtitle}>{tutorSubtitle}</Text>
              <Text style={styles.rating}>☆ 4.9 (124 reviews)</Text>
            </View>
            {hourlyRate ? <Text style={styles.rate}>Rs {hourlyRate}/Hr</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Schedule Comparison</Text>
            <View style={styles.scheduleBlock}>
              <Text style={styles.blockLabel}>ORIGINAL SESSION</Text>
              <Text style={styles.sessionDate}>{dateLabel(originalDate)}</Text>
              <Text style={styles.sessionTime}>{originalRange}</Text>
            </View>
            <View style={styles.proposedBlock}>
              <Text style={styles.proposedLabel}>NEW PROPOSED SESSION</Text>
              <Text style={styles.sessionDate}>{dateLabel(proposedDate)}</Text>
              <Text style={styles.sessionTime}>{proposedRange}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Reason</Text>
            <Text style={styles.reasonText}>{reason.trim() || 'No reason provided.'}</Text>
          </View>

          <Text style={styles.notice}>Confirm to save this schedule change to your booking.</Text>
          <Text style={styles.sessionMeta}>{durationName(durationMinutes)} · {meetingLabel}</Text>
          {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={saving} onPress={confirmReschedule} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed, saving && styles.disabled]}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmText}>Confirm Reschedule</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} onPress={returnToEditor} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
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
  content: { padding: 16, paddingBottom: 24, gap: 14 },
  tutorCard: { minHeight: 66, backgroundColor: '#FFFFFF', borderRadius: 11, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: TEAL, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  tutorCopy: { flex: 1, gap: 2 },
  tutorName: { color: INK, fontSize: 11, fontWeight: '800' },
  verified: { color: TEAL },
  tutorSubtitle: { color: MUTED, fontSize: 9 },
  rating: { color: INK, fontSize: 9, fontWeight: '600' },
  rate: { color: TEAL, fontSize: 10, fontWeight: '800' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 11, gap: 8 },
  sectionTitle: { color: INK, fontSize: 12, fontWeight: '700', marginBottom: 1 },
  scheduleBlock: { backgroundColor: '#F4F4F4', borderRadius: 7, padding: 9, gap: 3 },
  blockLabel: { color: MUTED, fontSize: 8, fontWeight: '800' },
  sessionDate: { color: INK, fontSize: 11, fontWeight: '700' },
  sessionTime: { color: MUTED, fontSize: 9 },
  proposedBlock: { backgroundColor: PAGE, borderRadius: 7, borderWidth: 1, borderColor: TEAL, padding: 9, gap: 3 },
  proposedLabel: { color: TEAL, fontSize: 8, fontWeight: '800' },
  reasonText: { color: INK, fontSize: 10, lineHeight: 15 },
  notice: { color: '#505977', fontSize: 10, lineHeight: 15, marginHorizontal: 7, marginTop: 2 },
  sessionMeta: { color: MUTED, fontSize: 9, marginHorizontal: 7, marginTop: -8 },
  error: { color: '#B42318', fontSize: 11, textAlign: 'center' },
  actions: { gap: 5, marginTop: 2 },
  confirmButton: { minHeight: 44, borderRadius: 9, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cancelButton: { minHeight: 30, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: TEAL, fontSize: 11, fontWeight: '700' },
  disabled: { opacity: 0.75 },
  pressed: { opacity: 0.82 },
});
