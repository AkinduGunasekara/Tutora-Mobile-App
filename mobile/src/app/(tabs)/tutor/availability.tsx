// Weekly recurring availability editor ("+ EDIT SLOTS" / "Manage Availability"). Saved to the backend.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BackHeader, Banner, C, Card, ErrorState, FooterNote, Loading, OptionSheet, Pill, PrimaryButton, goBack, s,
} from '@/components/tutor/ui';
import { errorMessage, tutorApi } from '@/lib/tutorApi';
import { MONDAY_FIRST, WEEKDAY_NAMES, hhmmTo12 } from '@/lib/tutorFormat';

type Slot = { start: string; end: string };

// 06:00 → 22:00 in 30 minute steps
const TIMES = Array.from({ length: 33 }, (_, i) => {
  const m = 6 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
});

export default function AvailabilityScreen() {
  const [week, setWeek] = useState<Record<number, Slot[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [picker, setPicker] = useState<{ day: number; index: number; field: 'start' | 'end' } | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await tutorApi.availability();
      const next: Record<number, Slot[]> = {};
      data.weekly.forEach((d) => { if (d.slots.length) next[d.day] = d.slots.map((sl) => ({ ...sl })); });
      setWeek(next);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your availability.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleDay = (day: number, on: boolean) =>
    setWeek((w) => {
      const next = { ...w };
      if (on) next[day] = [{ start: '09:00', end: '12:00' }];
      else delete next[day];
      return next;
    });

  const addSlot = (day: number) =>
    setWeek((w) => {
      const slots = w[day] ?? [];
      const last = slots[slots.length - 1];
      const startIdx = last ? Math.min(TIMES.indexOf(last.end) + 2, TIMES.length - 3) : 6;
      return { ...w, [day]: [...slots, { start: TIMES[startIdx], end: TIMES[Math.min(startIdx + 4, TIMES.length - 1)] }] };
    });

  const removeSlot = (day: number, index: number) =>
    setWeek((w) => {
      const slots = (w[day] ?? []).filter((_, i) => i !== index);
      const next = { ...w };
      if (slots.length) next[day] = slots; else delete next[day];
      return next;
    });

  const setTime = (value: string) => {
    if (!picker) return;
    setWeek((w) => ({
      ...w,
      [picker.day]: w[picker.day].map((sl, i) => (i === picker.index ? { ...sl, [picker.field]: value } : sl)),
    }));
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await tutorApi.saveAvailability(Object.entries(week).map(([day, slots]) => ({ day: Number(day), slots })));
      setNotice({ text: 'Availability saved. Students and reschedules now use these slots.', tone: 'success' });
    } catch (err) {
      setNotice({ text: errorMessage(err, 'Could not save availability.'), tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const pickerValue = picker ? week[picker.day]?.[picker.index]?.[picker.field] ?? '09:00' : '09:00';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader title="My Availability" onBack={() => goBack('/(tabs)/tutor/calendar')} />
      {loading ? <Loading /> : error ? <View style={s.scroll}><ErrorState message={error} onRetry={load} /></View> : (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={styles.intro}>Set the weekly hours you are open for sessions. These repeat every week.</Text>
          {notice && <Banner text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}

          {MONDAY_FIRST.map((day) => {
            const slots = week[day] ?? [];
            const open = slots.length > 0;
            return (
              <Card key={day} style={{ gap: 10, paddingVertical: 12 }}>
                <View style={styles.dayRow}>
                  <Text style={[styles.dayName, !open && { color: C.muted }]}>{WEEKDAY_NAMES[day]}</Text>
                  <Pill label={open ? 'OPEN' : 'CLOSED'} tone={open ? 'soft' : 'muted'} small />
                  <View style={{ flex: 1 }} />
                  <Switch
                    value={open}
                    onValueChange={(v) => toggleDay(day, v)}
                    trackColor={{ false: C.line, true: C.teal }}
                    thumbColor={C.card}
                  />
                </View>
                {slots.map((sl, i) => (
                  <View key={i} style={styles.slotRow}>
                    <TimeButton label={hhmmTo12(sl.start)} onPress={() => setPicker({ day, index: i, field: 'start' })} />
                    <Text style={{ color: C.muted }}>–</Text>
                    <TimeButton label={hhmmTo12(sl.end)} onPress={() => setPicker({ day, index: i, field: 'end' })} />
                    <Pressable accessibilityLabel="Remove slot" onPress={() => removeSlot(day, i)} hitSlop={8} style={{ marginLeft: 'auto' }}>
                      <Ionicons name="close-circle-outline" size={22} color={C.muted} />
                    </Pressable>
                  </View>
                ))}
                {open && (
                  <Pressable onPress={() => addSlot(day)} style={styles.addSlot}>
                    <Text style={styles.addSlotText}>+ ADD TIME SLOT</Text>
                  </Pressable>
                )}
              </Card>
            );
          })}

          <PrimaryButton label="Save Availability" onPress={save} loading={saving} />
          <FooterNote text="Booked sessions are never removed when you change your slots." />
        </ScrollView>
      )}

      <OptionSheet<string>
        visible={!!picker}
        title={picker?.field === 'end' ? 'End time' : 'Start time'}
        value={pickerValue}
        onSelect={setTime}
        onClose={() => setPicker(null)}
        options={TIMES.map((t) => ({ value: t, label: hhmmTo12(t) }))}
      />
    </SafeAreaView>
  );
}

function TimeButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.timeBtn}>
      <Text style={styles.timeBtnText}>{label}</Text>
      <Ionicons name="chevron-down" size={14} color={C.teal} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 13, color: C.muted, lineHeight: 19 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayName: { fontSize: 15, fontWeight: '800', color: C.ink, width: 98 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: C.card },
  timeBtnText: { fontSize: 13, fontWeight: '700', color: C.ink },
  addSlot: { alignSelf: 'flex-start', backgroundColor: C.tealSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  addSlotText: { fontSize: 10, fontWeight: '800', color: C.teal, letterSpacing: 0.5 },
});
