import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INK = '#171943';
const TEAL = '#008C91';
const PAGE = '#EFEDDC';
const MUTED = '#78809A';
const RED = '#E3262E';

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

export default function SessionCancelledScreen() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    date?: string;
    time?: string;
    durationMinutes?: string;
    meetingType?: string;
    tutorName?: string;
    sessionTitle?: string;
    refund?: string;
    cancelledOn?: string;
  }>();
  const bookingId = asText(params.bookingId);
  const date = asText(params.date);
  const time = asText(params.time, '10:00 AM');
  const durationMinutes = Number(asText(params.durationMinutes, '60')) || 60;
  const sessionDate = dateFromParam(date);
  const tutorName = asText(params.tutorName, 'Tutor');
  const refund = Number(asText(params.refund, '0')) || 0;
  const cancelledOn = asText(params.cancelledOn);
  const cancellationDate = cancelledOn ? new Date(cancelledOn) : new Date();
  const sessionDateLabel = sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const cancellationDateLabel = cancellationDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const sessionTimeLabel = `${time} - ${endTime(time, durationMinutes)}`;
  const durationLabel = durationMinutes === 30 ? '30 Minutes' : durationMinutes === 60 ? '1 Hour' : `${durationMinutes / 60} Hours`;
  const meetingType = asText(params.meetingType, 'Microsoft Teams');
  const meetingLabel = meetingType === 'Microsoft Teams' ? 'Microsoft Teams Meeting' : meetingType;
  const sessionTitle = asText(params.sessionTitle, 'Tutoring Session');
  const referenceId = bookingId ? `#TUT-${bookingId.slice(-4).toUpperCase()}` : '#TUT-9048';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.cancelIcon}><Text style={styles.cross}>×</Text></View>
            <Text style={styles.title}>Session Cancelled</Text>
            <Text style={styles.subtitle}>The booking has been successfully cancelled.</Text>
          </View>

          <View style={styles.detailsCard}>
            <SummaryRow label="Tutor" value={tutorName} />
            <View style={styles.sessionInfo}>
              <Text style={styles.label}>Session was</Text>
              <Text style={styles.sessionValue}>{sessionDateLabel} · {sessionTimeLabel}</Text>
              <Text style={styles.sessionValue}>{durationLabel} · {meetingLabel}</Text>
            </View>
            <SummaryRow label="Cancelled on" value={cancellationDateLabel} />
            <View style={styles.divider} />
            <View style={styles.refundRow}>
              <View>
                <Text style={styles.label}>Refund Estimate</Text>
                <Text style={styles.refundStatus}>Rs {refund.toLocaleString('en-LK')} · Initiation pending</Text>
              </View>
            </View>
            <SummaryRow label="Reference ID" value={referenceId} />
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace({ pathname: '/(tabs)/bookings' as any, params: { date } })}
              style={({ pressed }) => [styles.calendarButton, pressed && styles.pressed]}>
              <Text style={styles.primaryText}>View My Calendar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)/home' as any)}
              style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}>
              <Text style={styles.homeText}>Back to Home</Text>
            </Pressable>
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
  content: { flexGrow: 1, padding: 16, paddingTop: 30, paddingBottom: 22, justifyContent: 'center', gap: 20 },
  hero: { alignItems: 'center', gap: 6 },
  cancelIcon: { width: 48, height: 48, borderRadius: 24, borderColor: RED, borderWidth: 1.5, backgroundColor: '#FFF9F8', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cross: { color: RED, fontSize: 25, lineHeight: 29, fontWeight: '300' },
  title: { color: INK, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: MUTED, fontSize: 9, textAlign: 'center' },
  detailsCard: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 12, gap: 10 },
  row: { minHeight: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { color: MUTED, fontSize: 9 },
  value: { color: INK, fontSize: 9, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  sessionInfo: { gap: 3 },
  sessionValue: { color: INK, fontSize: 9, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E8E8E8' },
  refundRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refundStatus: { color: TEAL, fontSize: 9, fontWeight: '700', marginTop: 4 },
  actions: { gap: 7 },
  calendarButton: { minHeight: 38, borderRadius: 8, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  homeButton: { minHeight: 36, borderRadius: 8, borderWidth: 1.5, borderColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  homeText: { color: TEAL, fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});
