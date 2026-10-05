// Reschedule Session (Hi-Fi) — also used for "Propose Alternative Time" on a request.
// Step 1: pick date + free slot + reason. Step 2: review and send to the student for approval.
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BackHeader, Banner, C, Card, Divider, ErrorState, FooterNote, GhostButton, KeyValue, Label, LegendItem,
  LinkText, Loading, MonthCalendar, Pill, PrimaryButton, SectionHeader, goBack, s,
} from '@/components/tutor/ui';
import { errorMessage, tutorApi } from '@/lib/tutorApi';
import {
  formatLabel, fromKey, monthKey, monthTitle, shortDate, shortDuration, timeRange, todayKey, weekdayDate,
} from '@/lib/tutorFormat';

// What is being moved: a booked session, or a pending request
type Target = {
  subject: string;
  studentName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  formatText: string;
  status: string;
  bookingId?: string; // for slot exclusion
};

const addMinutes = (time: string, minutes: number) => {
  const m = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return '';
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  const total = h * 60 + Number(m[2]) + minutes;
  const hh = Math.floor(total / 60) % 24;
  return `${hh % 12 === 0 ? 12 : hh % 12}:${String(total % 60).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
};

export default function RescheduleScreen() {
  const params = useLocalSearchParams<{ mode?: string; bookingId?: string; kind?: string; id?: string }>();
  const propose = params.mode === 'propose';

  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [hasAvailability, setHasAvailability] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const back = () => goBack(propose ? '/(tabs)/tutor/requests' : '/(tabs)/tutor/calendar');

  const load = useCallback(async () => {
    setError('');
    try {
      if (propose) {
        const r = await tutorApi.request(params.kind!, params.id!);
        setTarget({
          subject: r.subject, studentName: r.student.name, date: r.date, startTime: r.startTime, endTime: r.endTime,
          durationMinutes: r.durationMinutes, formatText: r.format, status: 'PENDING',
          bookingId: r.kind === 'booking' ? r.id : undefined,
        });
      } else {
        const sv = await tutorApi.session(params.bookingId!);
        setTarget({
          subject: sv.subject, studentName: sv.student.name, date: sv.date, startTime: sv.startTime, endTime: sv.endTime,
          durationMinutes: sv.durationMinutes, formatText: formatLabel(sv.format, sv.meetingType).replace(/ \(.*\)/, ''),
          status: sv.status.toUpperCase(), bookingId: sv.bookingId,
        });
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not load this session.'));
    } finally {
      setLoading(false);
    }
  }, [propose, params.kind, params.id, params.bookingId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Booked-day dots for the visible month
  useEffect(() => {
    tutorApi.calendar(monthKey(month)).then((d) => setBooked(new Set(d.bookedDates))).catch(() => {});
  }, [month]);

  // Free slots for the chosen day
  useEffect(() => {
    if (!date || !target) return;
    setSlotsLoading(true);
    setTime('');
    tutorApi.availableSlots(date, target.durationMinutes, target.bookingId)
      .then((d) => {
        // The session's own current time is not a "new" option
        setSlots(d.slots.filter((sl) => !(date === target.date && sl === target.startTime)));
        setHasAvailability(d.hasAvailability);
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [date, target]);

  const today = todayKey();
  const isPast = useCallback((key: string) => key < today, [today]);

  const send = async () => {
    if (!target) return;
    setSending(true);
    setSendError('');
    try {
      if (propose) await tutorApi.proposeAlternative(params.kind!, params.id!, date, time, reason.trim());
      else await tutorApi.requestReschedule(params.bookingId!, date, time, reason.trim());
      setStep(3);
    } catch (err) {
      setSendError(errorMessage(err, 'Could not send the request.'));
    } finally {
      setSending(false);
    }
  };

  const newEnd = useMemo(() => (time && target ? addMinutes(time, target.durationMinutes) : ''), [time, target]);
  const title = propose ? 'Propose New Time' : 'Reschedule Session';

  if (loading) return <SafeAreaView style={s.safe}><Loading /></SafeAreaView>;
  if (error || !target) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <BackHeader title={title} onBack={back} />
        <View style={s.scroll}><ErrorState message={error || 'Not found.'} onRetry={load} /></View>
      </SafeAreaView>
    );
  }

  const currentCard = (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.subject}>{target.subject}</Text>
          <Text style={styles.muted}>Student: {target.studentName}</Text>
        </View>
      </View>
      <Divider dashed />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <KeyValue label={propose ? 'REQUESTED TIME' : 'DATE & TIME'} value={`${shortDate(target.date)}, ${timeRange(target.startTime, target.endTime)}`} />
        <KeyValue label="FORMAT & TYPE" value={`${target.formatText} (${shortDuration(target.durationMinutes)})`} />
      </View>
    </Card>
  );

  // ── Step 3: sent ──
  if (step === 3) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <BackHeader title={title} onBack={back} />
        <ScrollView contentContainerStyle={s.scroll}>
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
            <View style={styles.doneIcon}><Ionicons name="paper-plane-outline" size={28} color={C.teal} /></View>
            <Text style={styles.doneTitle}>Request sent to {target.studentName}</Text>
            <Text style={[styles.muted, { textAlign: 'center' }]}>
              Proposed: {weekdayDate(date)}, {timeRange(time, newEnd)}.{'\n'}
              {propose ? 'The request stays pending until the student responds.' : 'Your original time stays booked until the student approves.'}
            </Text>
          </Card>
          <PrimaryButton
            label={propose ? 'Back to Request' : 'Back to Session Details'}
            onPress={back}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 2: review ──
  if (step === 2) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <BackHeader title={title} onBack={() => setStep(1)} right={<Text style={styles.step}>STEP 2 OF 2</Text>} />
        <ScrollView contentContainerStyle={s.scroll}>
          <SectionHeader title="REVIEW CHANGE" />
          <Card style={{ gap: 14 }}>
            <Text style={styles.subject}>{target.subject}</Text>
            <Text style={styles.muted}>Student: {target.studentName}</Text>
            <Divider dashed />
            <View style={styles.changeRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Label>Current</Label>
                <Text style={[styles.changeText, styles.strike]}>{weekdayDate(target.date)}</Text>
                <Text style={[styles.changeText, styles.strike]}>{timeRange(target.startTime, target.endTime)}</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={C.teal} />
              <View style={{ flex: 1, gap: 4, alignItems: 'flex-end' }}>
                <Label style={{ color: C.teal }}>Proposed</Label>
                <Text style={styles.changeText}>{weekdayDate(date)}</Text>
                <Text style={styles.changeText}>{timeRange(time, newEnd)}</Text>
              </View>
            </View>
            {!!reason.trim() && (
              <>
                <Divider dashed />
                <Label>{propose ? 'Note to student' : 'Reason'}</Label>
                <Text style={styles.reason}>{reason.trim()}</Text>
              </>
            )}
          </Card>
          <Banner text={propose
            ? 'The student will be asked to accept this new time before the session is booked.'
            : 'Your original time stays booked until the student approves the new time.'} />
          {!!sendError && <Banner text={sendError} tone="error" />}
          <PrimaryButton label={propose ? 'Send Proposal' : 'Send Reschedule Request'} onPress={send} loading={sending} />
          <GhostButton label="Back" onPress={() => setStep(1)} disabled={sending} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 1: choose ──
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader title={title} onBack={back} right={<Text style={styles.step}>STEP 1 OF 2</Text>} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <SectionHeader title={propose ? 'CURRENT REQUEST' : 'CURRENT SESSION'} right={<Pill label={target.status} tone="outline" />} />
        {currentCard}

        <SectionHeader title="SELECT NEW DATE" right={<Text style={styles.muted}>{monthTitle(month)}</Text>} />
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          selected={date}
          onSelect={setDate}
          marked={booked}
          isDisabled={isPast}
          crossed={target.date}
          legend={(
            <>
              <LegendItem ring label={date ? `Selected date (${shortDate(date)})` : 'Selected date'} />
              <LegendItem label="Has booked session" />
            </>
          )}
        />

        {!!date && (
          <>
            <SectionHeader
              title={`AVAILABLE TIME SLOTS (${fromKey(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()})`}
              right={<Text style={styles.muted}>{slotsLoading ? '' : `${slots.length} available`}</Text>}
            />
            {slotsLoading ? <ActivityIndicator color={C.teal} /> : slots.length === 0 ? (
              <Card style={{ alignItems: 'center', gap: 8 }}>
                <Text style={[styles.muted, { textAlign: 'center' }]}>
                  {hasAvailability ? 'No free slots on this day. Try another date.' : "You haven't set your weekly availability yet."}
                </Text>
                {!hasAvailability && (
                  <LinkText label="SET AVAILABILITY" onPress={() => router.push('/(tabs)/tutor/availability' as any)} />
                )}
              </Card>
            ) : (
              <View style={styles.slotGrid}>
                {slots.map((sl) => {
                  const active = sl === time;
                  return (
                    <Pressable key={sl} onPress={() => setTime(sl)} style={[styles.slot, active && styles.slotActive]}>
                      <Text style={[styles.slotText, active && { color: '#fff' }]}>
                        {sl.replace(/^(\d):/, '0$1:')}{active ? ' ✓' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        <SectionHeader
          title={propose ? 'NOTE TO STUDENT' : 'REASON FOR RESCHEDULING'}
          right={<Text style={styles.muted}>OPTIONAL</Text>}
        />
        <TextInput
          style={[s.input, { minHeight: 90, textAlignVertical: 'top' }]}
          placeholder={propose ? 'Add a note for the student...' : 'Enter reason for rescheduling session with student...'}
          placeholderTextColor={C.muted}
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={500}
        />
        <Text style={styles.small}>
          A notification and {propose ? 'proposal' : 'reschedule request'} will be sent to the student for confirmation.
        </Text>

        <PrimaryButton
          label={propose ? 'Confirm New Time' : 'Confirm Reschedule'}
          disabled={!date || !time}
          onPress={() => setStep(2)}
        />
        <GhostButton label={propose ? 'Cancel' : 'Cancel & Keep Original Time'} onPress={back} />
        {!date && <FooterNote text="Select a date to see your available time slots." />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  step: { fontSize: 11, fontWeight: '800', color: C.muted, letterSpacing: 0.6 },
  subject: { fontSize: 17, fontWeight: '800', color: C.ink },
  muted: { fontSize: 12, color: C.muted },
  small: { fontSize: 11, color: C.muted, lineHeight: 16 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { width: '31%', flexGrow: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  slotActive: { backgroundColor: C.teal, borderColor: C.teal },
  slotText: { fontSize: 14, fontWeight: '800', color: C.ink },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  changeText: { fontSize: 14, fontWeight: '700', color: C.ink },
  strike: { color: C.muted, textDecorationLine: 'line-through' },
  reason: { fontSize: 13, color: C.ink, lineHeight: 19 },
  doneIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.tealSoft, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 17, fontWeight: '800', color: C.ink, textAlign: 'center' },
});
