import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function BookingConfirmedScreen() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    date?: string;
    dateLabel?: string;
    time?: string;
    duration?: string;
    meetingType?: string;
    tutorName?: string;
    wasRescheduled?: string;
    tutorId?: string;
    subject?: string;
    hourlyRate?: string;
  }>();
  const bookingId = asText(params.bookingId, '');
  const wasRescheduled = asText(params.wasRescheduled, 'false') === 'true';
  const dateLabel = asText(params.dateLabel, 'Wed, Oct 14, 2026');
  const time = asText(params.time, '10:00 AM');
  const duration = asText(params.duration, '1 HR');
  const meetingType = asText(params.meetingType, 'Microsoft Teams');
  const tutorName = asText(params.tutorName, 'Anjana Gayantha');
  const tutorId = asText(params.tutorId, '');
  const subject = asText(params.subject, 'General');
  const hourlyRate = asText(params.hourlyRate, '0');
  const durationHours = getDurationHours(duration);
  const durationLabel = durationHours === 1
    ? '1 Hour'
    : durationHours === 0.5
      ? '30 Minutes'
      : `${durationHours} Hours`;
  const meetingLabel = meetingType === 'Microsoft Teams' ? 'Microsoft Teams Meeting' : meetingType;
  const displayId = bookingId ? `#TUT-${bookingId.slice(-4).toUpperCase()}` : '#TUT-9048';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.checkCircle}><Text style={styles.check}>✓</Text></View>
            <Text style={styles.title}>{wasRescheduled ? 'Session Rescheduled!' : 'Booking Confirmed!'}</Text>
            {!wasRescheduled && <Text style={styles.bookingId}>Booking ID: {displayId}</Text>}
            <Text style={styles.subtitle}>{wasRescheduled ? 'Your calendar and session details have been updated.' : 'Your request has been sent. Pay once the tutor confirms.'}</Text>
          </View>

          <View style={styles.detailsCard}>
            <SummaryRow label="Tutor" value={tutorName} />
            <SummaryRow label={wasRescheduled ? 'New Date' : 'Date'} value={dateLabel} />
            <SummaryRow label={wasRescheduled ? 'New Time' : 'Time'} value={`${time} - ${getEndTime(time, durationHours)}`} />
            <SummaryRow label="Duration" value={durationLabel} />
            <SummaryRow label="Type" value={meetingLabel} />
            <View style={styles.statusDivider} />
            <View style={styles.statusRow}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusBadge}><Text style={styles.statusText}>{wasRescheduled ? 'Rescheduled' : 'Pending'}</Text></View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace({ pathname: '/(tabs)/bookings' as any, params: { date: asText(params.date, '') } })}
              style={({ pressed }) => [styles.calendarButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>View My Calendar</Text>
            </Pressable>
            {wasRescheduled && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/(tabs)/home' as any)}
                style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}>
                <Text style={styles.homeButtonText}>Back to Home</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text numberOfLines={1} style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },
  page: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: PAGE },
  content: { flexGrow: 1, padding: 16, paddingTop: 32, paddingBottom: 22, justifyContent: 'center', gap: 22 },
  hero: { alignItems: 'center', gap: 7 },
  checkCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  check: { color: '#FFFFFF', fontSize: 33, lineHeight: 38, fontWeight: '400' },
  title: { color: INK, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  bookingId: { color: TEAL, fontSize: 11, fontWeight: '700' },
  subtitle: { color: MUTED, fontSize: 10, textAlign: 'center', maxWidth: 270, lineHeight: 14 },
  detailsCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 13 },
  row: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: { color: MUTED, fontSize: 10 },
  value: { color: INK, fontSize: 10, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  statusDivider: { height: 1, backgroundColor: '#E6E6E6', marginTop: 5, marginBottom: 7 },
  statusRow: { minHeight: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { borderColor: TEAL, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#E1F4EF' },
  statusText: { color: TEAL, fontSize: 9, fontWeight: '700' },
  actions: { gap: 9 },
  calendarButton: { minHeight: 44, borderRadius: 9, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  paymentButton: { minHeight: 40, borderRadius: 9, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  paymentButtonText: { color: TEAL, fontSize: 12, fontWeight: '700' },
  homeButton: { minHeight: 40, borderRadius: 9, borderWidth: 1.5, borderColor: TEAL, backgroundColor: PAGE, alignItems: 'center', justifyContent: 'center' },
  homeButtonText: { color: TEAL, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});
