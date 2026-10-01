import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';

const INK = '#171943';
const TEAL = '#008C91';
const PAGE = '#EFEDDC';
const MUTED = '#78809A';

const asText = (value: string | string[] | undefined, fallback: string) =>
  Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;

const getDurationHours = (duration: string) => {
  if (duration.toLowerCase().includes('30')) return 0.5;
  const hours = Number.parseFloat(duration);
  return Number.isFinite(hours) ? hours : 1;
};

const getEndTime = (startTime: string, durationHours: number) => {
  const match = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return startTime;

  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  const date = new Date(2000, 0, 1, hours, Number(match[2]));
  date.setMinutes(date.getMinutes() + durationHours * 60);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function BookingSummaryScreen() {
  const params = useLocalSearchParams<{
    date?: string;
    dateLabel?: string;
    time?: string;
    duration?: string;
    meetingType?: string;
    message?: string;
    tutorName?: string;
    tutorSubtitle?: string;
    rating?: string;
    reviewCount?: string;
    hourlyRate?: string;
    tutorInitials?: string;
  }>();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingId, setBookingId] = useState('');

  const dateLabel = asText(params.dateLabel, 'Wed, Oct 14, 2026');
  const time = asText(params.time, '10:00 AM');
  const duration = asText(params.duration, '1 HR');
  const meetingType = asText(params.meetingType, 'Microsoft Teams');
  const message = asText(params.message, '');
  const tutorName = asText(params.tutorName, 'Anjana Gayantha');
  const tutorSubtitle = asText(params.tutorSubtitle, 'Software Engineer at SLIIT');
  const rating = asText(params.rating, '4.9');
  const reviewCount = asText(params.reviewCount, '124');
  const hourlyRate = asText(params.hourlyRate, 'Rs 1,000/Hr');
  const tutorInitials = asText(params.tutorInitials, 'AG');

  const hourlyAmount = Number(hourlyRate.replace(/[^\d.]/g, '')) || 1000;
  const sessionFee = Math.round(hourlyAmount * getDurationHours(duration));
  const formattedFee = `Rs ${sessionFee.toLocaleString('en-US')}`;
  const durationHours = getDurationHours(duration);
  const durationLabel = durationHours === 1
    ? '1 Hour'
    : durationHours === 0.5
      ? '30 Minutes'
      : `${durationHours} Hours`;
  const meetingLabel = meetingType === 'Microsoft Teams' ? 'Microsoft Teams Meeting' : meetingType;

  const confirmBooking = async () => {
    if (submitting || bookingId) return;
    setSubmitting(true);
    setErrorMessage('');

    try {
      const { data } = await api.post('/bookings', {
        date: asText(params.date, ''),
        time,
        durationMinutes: Math.round(durationHours * 60),
        meetingType,
        message,
        tutor: {
          name: tutorName,
          subtitle: tutorSubtitle,
          initials: tutorInitials,
          rating: Number(rating),
          reviewCount: Number(reviewCount),
          hourlyRate: hourlyAmount,
        },
      });
      const savedId = String(data.booking.id);
      setBookingId(savedId);
      router.replace({
        pathname: '/(tabs)/booking-confirmed' as any,
        params: {
          bookingId: savedId,
          dateLabel,
          time,
          duration,
          meetingType,
          tutorName,
        },
      });
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? 'Could not save your booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Booking Summary</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.tutorCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{tutorInitials}</Text></View>
            <View style={styles.tutorInfo}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.tutorName}>{tutorName}</Text>
                <Text style={styles.verified}>✓</Text>
              </View>
              <Text numberOfLines={1} style={styles.tutorSubtitle}>{tutorSubtitle}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>⭐ {rating}</Text>
                <Text style={styles.reviews}>({reviewCount} reviews)</Text>
              </View>
            </View>
            <Text style={styles.rate}>{hourlyRate}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Booking Details</Text>
            <SummaryRow label="Date" value={dateLabel} />
            <SummaryRow label="Time" value={`${time} - ${getEndTime(time, getDurationHours(duration))}`} />
            <SummaryRow label="Duration" value={durationLabel} />
            <SummaryRow label="Type" value={meetingLabel} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Message</Text>
            <Text style={styles.messageText}>
              {message.trim() ? `“${message.trim()}”` : 'No message added.'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Breakdown</Text>
            <SummaryRow label="Session Fee" value={formattedFee} />
            <SummaryRow label="Platform Fee" value="Free (Rs 0)" valueStyle={styles.freeText} />
            <View style={styles.divider} />
            <SummaryRow label="Total" value={formattedFee} strong />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting || Boolean(bookingId) }}
            disabled={submitting || Boolean(bookingId)}
            onPress={confirmBooking}
            style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed, (submitting || bookingId) && styles.confirmButtonDisabled]}>
            {submitting
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.confirmText}>{bookingId ? 'Booking Request Sent' : 'Confirm Booking'}</Text>}
          </Pressable>
          {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.errorText}>{errorMessage}</Text> : null}
          {bookingId ? (
            <View accessibilityLiveRegion="polite" style={styles.successCard}>
              <Text style={styles.successTitle}>Booking saved</Text>
              <Text style={styles.successText}>Request ID: {bookingId}</Text>
              <Text style={styles.successText}>Status: Pending tutor confirmation</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  valueStyle,
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueStyle?: TextStyle;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.rowLabel, strong && styles.totalLabel]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.totalValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },
  page: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: PAGE },
  header: {
    height: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E1D2',
  },
  back: { color: INK, fontSize: 32, lineHeight: 36, width: 20 },
  headerTitle: { color: INK, fontSize: 16, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 20, gap: 14 },
  tutorCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F1DE',
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: INK,
    borderWidth: 2,
    borderColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  tutorInfo: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tutorName: { color: INK, fontWeight: '700', fontSize: 12, flexShrink: 1 },
  verified: { color: TEAL, fontSize: 13, fontWeight: '800' },
  tutorSubtitle: { color: MUTED, fontSize: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: INK, fontSize: 10, fontWeight: '700' },
  reviews: { color: INK, fontSize: 10 },
  rate: { color: TEAL, fontSize: 11, fontWeight: '800' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 11 },
  sectionTitle: { color: INK, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  summaryRow: { minHeight: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: MUTED, fontSize: 10 },
  rowValue: { color: INK, fontSize: 10, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  totalLabel: { color: INK, fontSize: 12, fontWeight: '800' },
  totalValue: { color: TEAL, fontSize: 14, fontWeight: '800' },
  messageText: { color: INK, fontSize: 10, lineHeight: 16 },
  freeText: { color: TEAL },
  divider: { height: 1, backgroundColor: '#E6E6E6', marginVertical: 4 },
  confirmButton: {
    minHeight: 44,
    borderRadius: 9,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: { opacity: 0.75 },
  confirmText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  errorText: { color: '#B42318', fontSize: 12, textAlign: 'center' },
  successCard: { backgroundColor: '#E1F4EF', borderRadius: 10, padding: 12, gap: 4 },
  successTitle: { color: INK, fontWeight: '700', fontSize: 13 },
  successText: { color: INK, fontSize: 11 },
  pressed: { opacity: 0.82 },
});
