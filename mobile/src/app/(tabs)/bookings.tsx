import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Booking = {
  _id: string;
  sessionDate: string;
  startTime: string;
  durationMinutes: number;
  meetingType: string;
  message: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  tutor: {
    userId?: string | null;
    name: string;
    initials: string;
    subtitle: string;
    hourlyRate: number;
  };
};

const asText = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const fromDateParam = (value?: string) => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
};

const fromStoredDate = (value: string) => {
  const date = new Date(value);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const dateParam = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getEndTime = (startTime: string, durationMinutes: number) => {
  const match = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return startTime;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  const time = new Date(2000, 0, 1, hours, Number(match[2]));
  time.setMinutes(time.getMinutes() + durationMinutes);
  return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function BookingsScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const [selectedDate, setSelectedDate] = useState(() => fromDateParam(asText(params.date)));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get('/bookings');
      setBookings(data.bookings ?? []);
    } catch (error: any) {
      setLoadError(error?.response?.data?.message ?? 'Could not load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (params.date) setSelectedDate(fromDateParam(asText(params.date)));
    loadBookings();
  }, [loadBookings, params.date]));

  const weekDates = useMemo(() => {
    const sunday = new Date(selectedDate);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + index);
      return date;
    });
  }, [selectedDate]);

  const markedDates = useMemo(() => new Set(
    bookings
      .filter((booking) => booking.status === 'confirmed')
      .map((booking) => dateParam(fromStoredDate(booking.sessionDate))),
  ), [bookings]);

  const upcomingBookings = useMemo(() => bookings
    .filter((booking) => {
      const date = fromStoredDate(booking.sessionDate);
      const today = fromStoredDate(new Date().toISOString());
      return booking.status === 'confirmed' && date >= today;
    })
    .sort((a, b) => fromStoredDate(a.sessionDate).getTime() - fromStoredDate(b.sessionDate).getTime()),
  [bookings]);

  const moveMonth = (offset: number) => {
    setSelectedDate((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
      const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(current.getDate(), maxDay));
      return next;
    });
  };

  const cancelBooking = async (id: string) => {
    setWorkingId(id);
    setActionError('');
    try {
      await api.patch(`/bookings/${id}/cancel`);
      setBookings((current) => current.map((booking) =>
        booking._id === id ? { ...booking, status: 'cancelled' } : booking,
      ));
      setPendingCancelId(null);
    } catch (error: any) {
      setActionError(error?.response?.data?.message ?? 'Could not cancel this booking. Please try again.');
    } finally {
      setWorkingId(null);
    }
  };

  const startReschedule = (booking: Booking) => {
    router.push({
      pathname: '/(tabs)/reschedule-session' as any,
      params: {
        bookingId: booking._id,
        date: dateParam(fromStoredDate(booking.sessionDate)),
        time: booking.startTime,
        durationMinutes: String(booking.durationMinutes),
        meetingType: booking.meetingType,
        message: booking.message,
        tutorName: booking.tutor.name,
        tutorSubtitle: booking.tutor.subtitle,
        tutorInitials: booking.tutor.initials,
        hourlyRate: String(booking.tutor.hourlyRate),
      },
    });
  };

  const monthTitle = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}><Text style={styles.headerTitle}>My Calendar</Text></View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.calendarCard}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>{monthTitle}</Text>
              <View style={styles.monthControls}>
                <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => moveMonth(-1)} hitSlop={10}>
                  <Text style={styles.monthArrow}>‹</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => moveMonth(1)} hitSlop={10}>
                  <Text style={styles.monthArrow}>›</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.weekRow}>
              {weekDates.map((date, index) => {
                const key = dateParam(date);
                const selected = key === dateParam(selectedDate);
                const marked = markedDates.has(key);
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedDate(date)}
                    style={styles.dayColumn}>
                    <Text style={styles.weekday}>{WEEKDAYS[index]}</Text>
                    <View style={[styles.dayCircle, selected && styles.selectedDay]}>
                      <Text style={[styles.dayNumber, selected && styles.selectedDayNumber]}>{date.getDate()}</Text>
                    </View>
                    <View style={[styles.dayDot, marked && styles.dayDotMarked]} />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <Text style={styles.count}>{upcomingBookings.length} Scheduled</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={TEAL} style={styles.loading} />
          ) : loadError ? (
            <View style={styles.emptyCard}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable accessibilityRole="button" onPress={loadBookings} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : upcomingBookings.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No upcoming sessions.</Text></View>
          ) : (
            upcomingBookings.map((booking) => (
              <View key={booking._id} style={styles.bookingCard}>
                <View style={styles.bookingTitleRow}>
                  <Text style={styles.bookingTitle}>Tutoring Session</Text>
                  <Text style={styles.bookingDate}>{fromStoredDate(booking.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                </View>
                <View style={styles.bookingMiddle}>
                  <View style={styles.tutorAvatar}><Text style={styles.avatarText}>{booking.tutor.initials || 'T'}</Text></View>
                  <Text style={styles.tutorName}>{booking.tutor.name}</Text>
                  <View style={styles.bookingActions}>
                    <Pressable accessibilityRole="button" onPress={() => startReschedule(booking)} style={styles.rescheduleButton}>
                      <Text style={styles.rescheduleText}>Reschedule</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => { setActionError(''); setPendingCancelId(booking._id); }}
                      style={styles.cancelButton}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.sessionMeta}>
                  <Text style={styles.timeMeta}>◷ {booking.startTime} - {getEndTime(booking.startTime, booking.durationMinutes)}</Text>
                  <Text style={styles.meetingMeta}>{booking.meetingType === 'Microsoft Teams' ? '▣ Teams Meeting' : '⌂ In-Person'}</Text>
                </View>
                {pendingCancelId === booking._id && (
                  <View style={styles.cancelConfirm}>
                    <Text style={styles.cancelPrompt}>Cancel this booking?</Text>
                    <Pressable disabled={workingId === booking._id} onPress={() => cancelBooking(booking._id)} style={styles.confirmCancelButton}>
                      <Text style={styles.confirmCancelText}>{workingId === booking._id ? 'Cancelling…' : 'Yes, cancel'}</Text>
                    </Pressable>
                    <Pressable onPress={() => setPendingCancelId(null)} style={styles.keepButton}>
                      <Text style={styles.keepText}>Keep</Text>
                    </Pressable>
                  </View>
                )}
                {actionError ? <Text accessibilityLiveRegion="polite" style={styles.errorText}>{actionError}</Text> : null}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },
  page: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: PAGE },
  header: { height: 52, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#E4E1D2' },
  headerTitle: { color: INK, fontSize: 16, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 24, gap: 16 },
  calendarCard: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 11, paddingTop: 9, paddingBottom: 7 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  monthTitle: { color: INK, fontSize: 12, fontWeight: '700' },
  monthControls: { flexDirection: 'row', gap: 9 },
  monthArrow: { color: INK, fontSize: 23, lineHeight: 25, width: 18, textAlign: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { flex: 1, alignItems: 'center', gap: 3 },
  weekday: { color: MUTED, fontSize: 9 },
  dayCircle: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  selectedDay: { backgroundColor: TEAL },
  dayNumber: { color: INK, fontSize: 10 },
  selectedDayNumber: { color: '#FFFFFF', fontWeight: '700' },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  dayDotMarked: { backgroundColor: TEAL },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 },
  sectionTitle: { color: INK, fontSize: 12, fontWeight: '800' },
  count: { color: TEAL, fontSize: 10, fontWeight: '700' },
  loading: { marginTop: 24 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 15, alignItems: 'center', gap: 10 },
  emptyText: { color: MUTED, fontSize: 11 },
  errorText: { color: '#B42318', fontSize: 11, textAlign: 'center' },
  retryButton: { backgroundColor: TEAL, borderRadius: 7, paddingHorizontal: 16, paddingVertical: 7 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  bookingCard: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 12, borderLeftWidth: 3, borderLeftColor: TEAL, gap: 8 },
  bookingTitle: { color: INK, fontSize: 11, fontWeight: '800' },
  bookingTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  bookingDate: { color: MUTED, fontSize: 9, fontWeight: '600' },
  bookingMiddle: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tutorAvatar: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: INK, fontSize: 7, fontWeight: '700' },
  tutorName: { color: INK, fontSize: 10, flex: 1 },
  bookingActions: { alignItems: 'flex-end', gap: 4 },
  rescheduleButton: { backgroundColor: '#F0EFDF', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3 },
  rescheduleText: { color: TEAL, fontSize: 8, fontWeight: '700' },
  cancelButton: { backgroundColor: '#F0EFDF', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  cancelText: { color: TEAL, fontSize: 8, fontWeight: '700' },
  cardDivider: { height: 1, backgroundColor: '#E5E5E5' },
  sessionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  timeMeta: { color: MUTED, fontSize: 9, flex: 1 },
  meetingMeta: { color: TEAL, fontSize: 9, fontWeight: '700' },
  cancelConfirm: { backgroundColor: '#FFF8E8', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelPrompt: { color: INK, fontSize: 9, flex: 1 },
  confirmCancelButton: { backgroundColor: '#B42318', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 5 },
  confirmCancelText: { color: '#FFFFFF', fontSize: 8, fontWeight: '700' },
  keepButton: { padding: 4 },
  keepText: { color: TEAL, fontSize: 8, fontWeight: '700' },
});
