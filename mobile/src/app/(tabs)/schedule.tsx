import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
const CARD = '#FFFFFF';
const MUTED = '#737B91';
const DURATIONS = ['30 min', '1 HR', '1.5 Hr', '2 Hr'];
const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const monthTitle = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const parseDateParam = (value?: string | string[]) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [year, month, day] = raw.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const durationFromMinutes = (value?: string | string[]) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const labels: Record<string, string> = { '30': '30 min', '60': '1 HR', '90': '1.5 Hr', '120': '2 Hr' };
  return raw ? labels[raw] : undefined;
};

export default function ScheduleScreen() {
  const tutorParams = useLocalSearchParams<{
    tutorId?: string;
    tutorName?: string;
    tutorSubtitle?: string;
    rating?: string;
    reviewCount?: string;
    hourlyRate?: string;
    tutorInitials?: string;
    bookingId?: string;
    date?: string;
    durationMinutes?: string;
    time?: string;
    meetingType?: string;
    message?: string;
  }>();
  const [month, setMonth] = useState(() => {
    const initial = parseDateParam(tutorParams.date) ?? new Date(2026, 9, 1);
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => parseDateParam(tutorParams.date) ?? new Date(2026, 9, 14));
  const [duration, setDuration] = useState(() => durationFromMinutes(tutorParams.durationMinutes) ?? '1 HR');
  const [time, setTime] = useState(tutorParams.time ?? '10:00 AM');
  const [showSummary, setShowSummary] = useState(false);

  const days = useMemo(() => {
    const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, (_, index) => `blank-${index}`),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [month]);

  const changeMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedDate(new Date(next.getFullYear(), next.getMonth(), 1));
    setShowSummary(false);
  };

  const chooseDate = (day: number) => {
    setSelectedDate(new Date(month.getFullYear(), month.getMonth(), day));
    setShowSummary(false);
  };

  const selectedLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const continueToDetails = () => {
    const dateParam = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    router.push({
      pathname: '/(tabs)/session-details' as any,
      params: {
        date: dateParam,
        dateLabel: selectedLabel,
        tutorId: tutorParams.tutorId,
        time,
        duration,
        tutorName: tutorParams.tutorName,
        tutorSubtitle: tutorParams.tutorSubtitle,
        rating: tutorParams.rating,
        reviewCount: tutorParams.reviewCount,
        hourlyRate: tutorParams.hourlyRate,
        tutorInitials: tutorParams.tutorInitials,
        bookingId: tutorParams.bookingId,
        meetingType: tutorParams.meetingType,
        message: tutorParams.message,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Select Date &amp; Time</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={[styles.card, styles.calendarCard]}>
            <View style={styles.monthRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} hitSlop={12}>
                <Text style={styles.monthArrow}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>{monthTitle(month)}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} hitSlop={12}>
                <Text style={styles.monthArrow}>›</Text>
              </Pressable>
            </View>

            <View style={styles.calendarGrid}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekday}>{day}</Text>
              ))}
              {days.map((day) => {
                if (typeof day !== 'number') return <View key={day} style={styles.dayCell} />;
                const isSelected = selectedDate.getFullYear() === month.getFullYear()
                  && selectedDate.getMonth() === month.getMonth()
                  && selectedDate.getDate() === day;
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityLabel={`${monthTitle(month)} ${day}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => chooseDate(day)}
                    style={styles.dayCell}>
                    <View style={[styles.dayCircle, isSelected && styles.selectedDay]}>
                      <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Session Duration</Text>
            <View style={styles.optionRow}>
              {DURATIONS.map((item) => {
                const selected = duration === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => { setDuration(item); setShowSummary(false); }}
                    style={[styles.durationButton, selected && styles.optionSelected]}>
                    <Text style={[styles.durationText, selected && styles.optionSelectedText]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
            <View style={styles.timeGrid}>
              {TIMES.map((item) => {
                const selected = time === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => { setTime(item); setShowSummary(false); }}
                    style={[styles.timeButton, selected && styles.optionSelected]}>
                    <Text style={[styles.timeText, selected && styles.optionSelectedText]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {showSummary && (
            <View accessibilityLiveRegion="polite" style={styles.summary}>
              <Text style={styles.summaryTitle}>Schedule selected</Text>
              <Text style={styles.summaryText}>{selectedLabel} at {time} · {duration}</Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={continueToDetails}
            style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
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
  scrollContent: { padding: 16, paddingBottom: 20, gap: 16 },
  card: { backgroundColor: CARD, borderRadius: 14, padding: 12 },
  calendarCard: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 },
  monthRow: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthTitle: { color: INK, fontSize: 14, fontWeight: '700' },
  monthArrow: { color: INK, fontSize: 26, lineHeight: 30, width: 24, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.2857%', height: 30, textAlign: 'center', textAlignVertical: 'center', color: MUTED, fontSize: 11 },
  dayCell: { width: '14.2857%', height: 38, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  selectedDay: { backgroundColor: TEAL },
  dayText: { color: INK, fontSize: 12 },
  selectedDayText: { color: '#FFFFFF', fontWeight: '700' },
  sectionTitle: { color: INK, fontSize: 13, fontWeight: '700', marginBottom: 9 },
  optionRow: { flexDirection: 'row', gap: 6 },
  durationButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PAGE,
    paddingHorizontal: 4,
  },
  durationText: { color: INK, fontSize: 11, fontWeight: '600' },
  optionSelected: { backgroundColor: TEAL, borderColor: TEAL },
  optionSelectedText: { color: '#FFFFFF', fontWeight: '700' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timeButton: {
    width: '31.5%',
    minHeight: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DFE1E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: { color: INK, fontSize: 11, fontWeight: '600' },
  continueButton: {
    minHeight: 44,
    borderRadius: 9,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  continueText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.82 },
  summary: { backgroundColor: '#E1F4EF', borderRadius: 10, padding: 12 },
  summaryTitle: { color: INK, fontWeight: '700', fontSize: 13, marginBottom: 3 },
  summaryText: { color: INK, fontSize: 12 },
});
