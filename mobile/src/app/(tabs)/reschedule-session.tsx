import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INK = '#171943';
const TEAL = '#008C91';
const PAGE = '#EFEDDC';
const MUTED = '#78809A';
const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const asText = (value: string | string[] | undefined, fallback = '') =>
  Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;

const parseDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(2026, 9, 14);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateParam = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
  const time = new Date(2000, 0, 1, hours, Number(match[2]));
  time.setMinutes(time.getMinutes() + durationMinutes);
  return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function RescheduleSessionScreen() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    date?: string;
    time?: string;
    durationMinutes?: string;
    meetingType?: string;
    message?: string;
    tutorName?: string;
    tutorSubtitle?: string;
    tutorInitials?: string;
    hourlyRate?: string;
    proposedDate?: string;
    proposedTime?: string;
    reason?: string;
  }>();

  const bookingId = asText(params.bookingId);
  const currentSessionDate = parseDate(asText(params.date));
  const currentTime = asText(params.time, '10:00 AM');
  const durationMinutes = Number(asText(params.durationMinutes, '60')) || 60;
  const meetingType = asText(params.meetingType, 'Microsoft Teams');
  const tutorName = asText(params.tutorName, 'Tutor');
  const tutorSubtitle = asText(params.tutorSubtitle, 'Tutoring Session');
  const tutorInitials = asText(params.tutorInitials, 'T');
  const message = asText(params.message);
  const suggestedDate = asText(params.proposedDate)
    ? parseDate(asText(params.proposedDate))
    : new Date(currentSessionDate);
  if (!asText(params.proposedDate)) suggestedDate.setDate(suggestedDate.getDate() + 2);
  const [month, setMonth] = useState(() => new Date(suggestedDate.getFullYear(), suggestedDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(suggestedDate);
  const [selectedTime, setSelectedTime] = useState(() => asText(params.proposedTime, '2:00 PM'));
  const [reason, setReason] = useState(() => asText(params.reason));
  const [errorMessage, setErrorMessage] = useState('');

  const days = useMemo(() => {
    const offset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: offset }, (_, index) => `blank-${index}`),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ];
  }, [month]);

  const changeMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedDate(next);
  };

  const continueReschedule = () => {
    if (!bookingId) {
      setErrorMessage('Booking ID is missing. Return to My Calendar and try again.');
      return;
    }
    setErrorMessage('');
    router.push({
      pathname: '/(tabs)/reschedule-confirmation' as any,
      params: {
        bookingId,
        originalDate: formatDateParam(currentSessionDate),
        originalTime: currentTime,
        proposedDate: formatDateParam(selectedDate),
        proposedTime: selectedTime,
        durationMinutes: String(durationMinutes),
        meetingType,
        message,
        reason,
        tutorName,
        tutorSubtitle,
        tutorInitials,
        hourlyRate: asText(params.hourlyRate),
      },
    });
  };

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to My Calendar"
            onPress={() => router.replace({ pathname: '/(tabs)/bookings' as any, params: { date: formatDateParam(currentSessionDate) } })}
            hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={INK} />
          </Pressable>
          <Text style={styles.headerTitle}>Reschedule Session</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>CURRENT SESSION</Text>
            <Text style={styles.currentTitle}>{tutorSubtitle.includes('Tutoring') ? tutorSubtitle : 'Tutoring Session'}</Text>
            <View style={styles.currentMeta}>
              <Text style={styles.currentDate}>{currentSessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {currentTime}</Text>
              <Text style={styles.currentDuration}>{durationName(durationMinutes)}</Text>
            </View>
            <Text style={styles.currentTutor}>{tutorInitials} · {tutorName}</Text>
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.monthHeader}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} hitSlop={10}>
                <Text style={styles.monthArrow}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} hitSlop={10}>
                <Text style={styles.monthArrow}>›</Text>
              </Pressable>
            </View>
            <View style={styles.calendarGrid}>
              {WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
              {days.map((day) => {
                if (typeof day !== 'number') return <View key={day} style={styles.dayCell} />;
                const isSelected = dateParamEqual(selectedDate, month, day);
                const isCurrent = dateParamEqual(currentSessionDate, month, day);
                return (
                  <Pressable key={day} accessibilityRole="button" accessibilityState={{ selected: isSelected }} onPress={() => setSelectedDate(new Date(month.getFullYear(), month.getMonth(), day))} style={styles.dayCell}>
                    <View style={[styles.dayCircle, isCurrent && styles.currentDay, isSelected && styles.selectedDay]}>
                      <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
            <View style={styles.timeGrid}>
              {TIMES.map((time) => {
                const selected = selectedTime === time;
                return (
                  <Pressable key={time} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setSelectedTime(time)} style={[styles.timeButton, selected && styles.selectedTimeButton]}>
                    <Text style={[styles.timeText, selected && styles.selectedTimeText]}>{time}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reason for rescheduling</Text>
            <TextInput
              accessibilityLabel="Reason for rescheduling"
              multiline
              maxLength={500}
              textAlignVertical="top"
              placeholder="Tell the tutor why you need to reschedule..."
              placeholderTextColor={MUTED}
              value={reason}
              onChangeText={setReason}
              style={styles.reasonInput}
            />
          </View>

          {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}

          <Pressable accessibilityRole="button" onPress={continueReschedule} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const dateParamEqual = (date: Date, month: Date, day: number) =>
  date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth() && date.getDate() === day;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },
  page: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: PAGE },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E4E1D2', gap: 10 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: INK, flex: 1, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 22, gap: 14 },
  currentCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEEBDD', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 5 },
  currentLabel: { color: TEAL, fontSize: 9, fontWeight: '800' },
  currentTitle: { color: INK, fontSize: 12, fontWeight: '800' },
  currentMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currentDate: { color: MUTED, fontSize: 10 },
  currentDuration: { color: INK, fontSize: 10, fontWeight: '700' },
  currentTutor: { color: MUTED, fontSize: 9 },
  calendarCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: '#EEEBDD', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  monthHeader: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  monthTitle: { color: INK, fontSize: 12, fontWeight: '700' },
  monthArrow: { color: INK, fontSize: 24, lineHeight: 28, width: 22, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.2857%', height: 25, textAlign: 'center', textAlignVertical: 'center', color: MUTED, fontSize: 9 },
  dayCell: { width: '14.2857%', height: 32, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayText: { color: INK, fontSize: 10 },
  currentDay: { backgroundColor: '#F0EFDF' },
  selectedDay: { backgroundColor: TEAL },
  selectedDayText: { color: '#FFFFFF', fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEEBDD', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { color: INK, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timeButton: { width: '31.5%', minHeight: 32, borderRadius: 6, borderWidth: 1, borderColor: '#DFE1E7', alignItems: 'center', justifyContent: 'center' },
  selectedTimeButton: { backgroundColor: TEAL, borderColor: TEAL },
  timeText: { color: INK, fontSize: 10, fontWeight: '600' },
  selectedTimeText: { color: '#FFFFFF', fontWeight: '700' },
  reasonInput: { minHeight: 70, borderRadius: 6, borderWidth: 1, borderColor: '#E3E3E3', backgroundColor: '#F5F5F5', color: INK, fontSize: 10, padding: 9 },
  error: { color: '#B42318', fontSize: 11, textAlign: 'center' },
  continueButton: { backgroundColor: TEAL, borderRadius: 23, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  continueText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  pressed: { opacity: 0.82 },
});
