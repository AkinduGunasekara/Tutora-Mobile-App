import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import StudentProposals from '@/components/tutor/StudentProposals';

const INK = '#171943';
const TEAL = '#008C91';
const PAGE = '#EFEDDC';
const MUTED = '#78809A';
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type BookingStudent = { _id: string; name: string; email: string };

type Booking = {
  _id: string;
  sessionDate: string;
  startTime: string;
  durationMinutes: number;
  meetingType: string;
  message: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  fees?: { session?: number; total?: number };
  student?: BookingStudent | string;
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

const studentName = (s: BookingStudent | string | undefined) =>
  typeof s === 'object' && s !== null ? s.name : 'Student';

export default function BookingsScreen() {
  const { user } = useAuth();
  const isTutor = user?.role === 'tutor';

  const params = useLocalSearchParams<{ date?: string }>();
  const [selectedDate, setSelectedDate] = useState(() => fromDateParam(asText(params.date)));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actioning, setActioning] = useState<string | null>(null); // bookingId being actioned

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
      .filter((b) => b.status === 'confirmed')
      .map((b) => dateParam(fromStoredDate(b.sessionDate))),
  ), [bookings]);

  const today = useMemo(() => fromStoredDate(new Date().toISOString()), []);

  const pendingBookings = useMemo(() =>
    bookings.filter((b) => b.status === 'pending'),
  [bookings]);

  const upcomingBookings = useMemo(() =>
    bookings
      .filter((b) => b.status === 'confirmed' && fromStoredDate(b.sessionDate) >= today)
      .sort((a, b) => fromStoredDate(a.sessionDate).getTime() - fromStoredDate(b.sessionDate).getTime()),
  [bookings, today]);

  const moveMonth = (offset: number) => {
    setSelectedDate((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
      const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(current.getDate(), maxDay));
      return next;
    });
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

  const handleAccept = async (bookingId: string) => {
    setActioning(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/accept`);
      await loadBookings();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not accept booking.');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    Alert.alert('Reject Request', 'Are you sure you want to reject this booking request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          setActioning(bookingId);
          try {
            await api.patch(`/bookings/${bookingId}/reject`);
            await loadBookings();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Could not reject booking.');
          } finally {
            setActioning(null);
          }
        },
      },
    ]);
  };

  const handleJoinSession = async (booking: Booking) => {
    try {
      const { data } = await api.get(`/session/by-booking/${booking._id}`);
      router.push({
        pathname: '/(tabs)/session-booking-confirm' as any,
        params: {
          sessionId: data._id,
          tutorName: booking.tutor.name,
          subject: booking.tutor.subtitle || 'General',
          durationHours: String(booking.durationMinutes / 60),
          hourlyRate: String(booking.tutor.hourlyRate),
          scheduledDate: booking.sessionDate,
          paymentMethod: 'card',
        },
      });
    } catch {
      Alert.alert('Not ready yet', 'Waiting for student to complete payment before you can join.');
    }
  };

  const handlePayAndJoin = async (booking: Booking) => {
    // Already paid (simulated payment held in escrow) → go straight to the session
    try {
      const { data } = await api.get(`/session/by-booking/${booking._id}`);
      if (data?.paymentStatus === 'in_escrow' || data?.paymentStatus === 'released') {
        router.push({
          pathname: '/(tabs)/session-booking-confirm' as any,
          params: {
            sessionId: data._id,
            tutorName: booking.tutor.name,
            subject: data.subject,
            durationHours: String(data.durationHours),
            hourlyRate: String(data.hourlyRate),
            scheduledDate: data.scheduledDate,
            paymentMethod: data.paymentMethod,
          },
        });
        return;
      }
    } catch {
      // no session yet → pay first
    }
    router.push({
      pathname: '/(tabs)/payment-summary' as any,
      params: {
        bookingId:    booking._id,
        tutorId:      booking.tutor.userId ?? '',
        tutorName:    booking.tutor.name,
        subject:      booking.tutor.subtitle || 'General',
        durationHours:String(booking.durationMinutes / 60),
        hourlyRate:   String(booking.tutor.hourlyRate),
        scheduledDate:booking.sessionDate,
      },
    });
  };

  const monthTitle = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}><Text style={styles.headerTitle}>My Calendar</Text></View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Calendar ─────────────────────────────────── */}
          <View style={styles.calendarCard}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>{monthTitle}</Text>
              <View style={styles.monthControls}>
                <Pressable accessibilityRole="button" onPress={() => moveMonth(-1)} hitSlop={10}>
                  <Text style={styles.monthArrow}>‹</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => moveMonth(1)} hitSlop={10}>
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
                  <Pressable key={key} accessibilityRole="button" onPress={() => setSelectedDate(date)} style={styles.dayColumn}>
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

          {/* Tutor-proposed new times awaiting the student's approval */}
          {!isTutor && <StudentProposals onChanged={loadBookings} />}

          {loading ? (
            <ActivityIndicator color={TEAL} style={styles.loading} />
          ) : loadError ? (
            <View style={styles.emptyCard}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable onPress={loadBookings} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* ── Pending section ──────────────────────── */}
              {pendingBookings.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {isTutor ? 'New Requests' : 'Awaiting Confirmation'}
                    </Text>
                    <Text style={styles.count}>{pendingBookings.length} Pending</Text>
                  </View>

                  {pendingBookings.map((booking) => (
                    <View key={booking._id} style={[styles.bookingCard, styles.pendingCard]}>
                      <View style={styles.bookingTitleRow}>
                        <Text style={styles.bookingTitle}>
                          {isTutor ? `From: ${studentName(booking.student)}` : `With: ${booking.tutor.name}`}
                        </Text>
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>Pending</Text>
                        </View>
                      </View>

                      <View style={styles.sessionMeta}>
                        <Text style={styles.timeMeta}>
                          📅 {fromStoredDate(booking.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                        <Text style={styles.timeMeta}>
                          ◷ {booking.startTime} · {booking.durationMinutes} min
                        </Text>
                      </View>

                      {isTutor ? (
                        /* Tutor: Accept / Reject */
                        <View style={styles.tutorActions}>
                          <Pressable
                            style={[styles.acceptBtn, actioning === booking._id && { opacity: 0.6 }]}
                            disabled={actioning === booking._id}
                            onPress={() => handleAccept(booking._id)}>
                            {actioning === booking._id
                              ? <ActivityIndicator color="#fff" size="small" />
                              : <Text style={styles.acceptBtnText}>✓ Accept</Text>}
                          </Pressable>
                          <Pressable
                            style={[styles.rejectBtn, actioning === booking._id && { opacity: 0.6 }]}
                            disabled={actioning === booking._id}
                            onPress={() => handleReject(booking._id)}>
                            <Text style={styles.rejectBtnText}>✕ Reject</Text>
                          </Pressable>
                        </View>
                      ) : (
                        /* Student: Cancel pending */
                        <View style={styles.tutorActions}>
                          <Pressable
                            style={styles.rejectBtn}
                            onPress={() => router.push({
                              pathname: '/(tabs)/cancel-session' as any,
                              params: {
                                bookingId: booking._id,
                                date: dateParam(fromStoredDate(booking.sessionDate)),
                                time: booking.startTime,
                                durationMinutes: String(booking.durationMinutes),
                                meetingType: booking.meetingType,
                                tutorName: booking.tutor.name,
                                tutorSubtitle: booking.tutor.subtitle,
                                sessionTitle: 'Tutoring Session',
                                refund: '0',
                              },
                            })}>
                            <Text style={styles.rejectBtnText}>Cancel Request</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  ))}
                </>
              )}

              {/* ── Upcoming confirmed section ────────────── */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
                <Text style={styles.count}>{upcomingBookings.length} Scheduled</Text>
              </View>

              {upcomingBookings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No upcoming sessions.</Text>
                </View>
              ) : (
                upcomingBookings.map((booking) => (
                  <View key={booking._id} style={styles.bookingCard}>
                    <View style={styles.bookingTitleRow}>
                      <Text style={styles.bookingTitle}>
                        {isTutor ? `Student: ${studentName(booking.student)}` : `With: ${booking.tutor.name}`}
                      </Text>
                      <Text style={styles.bookingDate}>
                        {fromStoredDate(booking.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>

                    <View style={styles.bookingMiddle}>
                      <View style={styles.tutorAvatar}>
                        <Text style={styles.avatarText}>{booking.tutor.initials || 'T'}</Text>
                      </View>
                      <Text style={styles.tutorName}>{booking.tutor.name}</Text>
                      {!isTutor && (
                        <View style={styles.bookingActions}>
                          <Pressable onPress={() => startReschedule(booking)} style={styles.rescheduleButton}>
                            <Text style={styles.rescheduleText}>Reschedule</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => router.push({
                              pathname: '/(tabs)/cancel-session' as any,
                              params: {
                                bookingId: booking._id,
                                date: dateParam(fromStoredDate(booking.sessionDate)),
                                time: booking.startTime,
                                durationMinutes: String(booking.durationMinutes),
                                meetingType: booking.meetingType,
                                tutorName: booking.tutor.name,
                                tutorSubtitle: booking.tutor.subtitle,
                                sessionTitle: 'Tutoring Session',
                                refund: String(booking.fees?.session ?? booking.fees?.total ?? 0),
                              },
                            })}
                            style={styles.cancelButton}>
                            <Text style={styles.cancelText}>Cancel</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.sessionMeta}>
                      <Text style={styles.timeMeta}>◷ {booking.startTime} - {getEndTime(booking.startTime, booking.durationMinutes)}</Text>
                      <Text style={styles.meetingMeta}>{booking.meetingType === 'Microsoft Teams' ? '▣ Teams Meeting' : '⌂ In-Person'}</Text>
                    </View>

                    {/* Join button */}
                    {isTutor ? (
                      <Pressable
                        style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.8 }]}
                        onPress={() => handleJoinSession(booking)}>
                        <Text style={styles.joinBtnText}>🎥 Join Session</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [styles.payJoinBtn, pressed && { opacity: 0.8 }]}
                        onPress={() => handlePayAndJoin(booking)}>
                        <Text style={styles.payJoinBtnText}>💳 Pay &amp; Join</Text>
                      </Pressable>
                    )}
                  </View>
                ))
              )}
            </>
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

  // Calendar
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

  // Sections
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 },
  sectionTitle: { color: INK, fontSize: 12, fontWeight: '800' },
  count: { color: TEAL, fontSize: 10, fontWeight: '700' },
  loading: { marginTop: 24 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 15, alignItems: 'center', gap: 10 },
  emptyText: { color: MUTED, fontSize: 11 },
  errorText: { color: '#B42318', fontSize: 11, textAlign: 'center' },
  retryButton: { backgroundColor: TEAL, borderRadius: 7, paddingHorizontal: 16, paddingVertical: 7 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Booking cards
  bookingCard: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 12, borderLeftWidth: 3, borderLeftColor: TEAL, gap: 8 },
  pendingCard: { borderLeftColor: '#F59E0B' },
  bookingTitle: { color: INK, fontSize: 11, fontWeight: '800', flex: 1 },
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

  // Pending badge
  pendingBadge: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  pendingBadgeText: { color: '#92400E', fontSize: 8, fontWeight: '700' },

  // Tutor accept/reject
  tutorActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flex: 1, backgroundColor: TEAL, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  rejectBtn: { flex: 1, borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  rejectBtnText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },

  // Join / Pay buttons
  joinBtn: { backgroundColor: TEAL, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  payJoinBtn: { backgroundColor: INK, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  payJoinBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
