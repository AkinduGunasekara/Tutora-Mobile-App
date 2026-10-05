import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/tutor/SessionCard';
import {
  C, Card, EmptyState, ErrorState, IconButton, LegendItem, LinkText, Loading, MonthCalendar,
  OptionSheet, Pill, SectionHeader, TabHeader, s,
} from '@/components/tutor/ui';
import { AvailabilityDay, SessionView, errorMessage, tutorApi } from '@/lib/tutorApi';
import { MONDAY_FIRST, WEEKDAY_NAMES, hhmmTo12, monthKey, todayKey } from '@/lib/tutorFormat';

type View_ = 'upcoming' | 'all';

const openAvailability = () => router.push('/(tabs)/tutor/availability' as any);

export default function MyCalendarScreen() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(todayKey());
  const [data, setData] = useState<{ bookedDates: string[]; sessions: SessionView[]; upcoming: SessionView[]; availability: AvailabilityDay[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<View_>('upcoming');
  const [filterOpen, setFilterOpen] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await tutorApi.calendar(monthKey(month)));
    } catch (err) {
      setError(errorMessage(err, 'Could not load your calendar.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const marked = useMemo(() => new Set(data?.bookedDates ?? []), [data]);

  // Sessions on the selected day; if none, the next upcoming ones from that day on
  const list = useMemo(() => {
    if (!data) return [];
    const onDay = data.sessions.filter((sv) => sv.date === selected && (view === 'all' || sv.status === 'confirmed'));
    if (onDay.length) return onDay;
    return data.upcoming.filter((sv) => sv.date >= selected).slice(0, 5);
  }, [data, selected, view]);

  const changeMonth = (next: Date) => {
    setMonth(next);
    const sameMonth = todayKey().startsWith(monthKey(next));
    setSelected(sameMonth ? todayKey() : `${monthKey(next)}-01`);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <TabHeader
        title="My Calendar"
        subtitle="Tutor schedule & availability"
        right={<IconButton icon="options-outline" label="Calendar filter" onPress={() => setFilterOpen(true)} />}
      />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.teal} />}>
        <MonthCalendar
          month={month}
          onMonthChange={changeMonth}
          selected={selected}
          onSelect={setSelected}
          marked={marked}
          legend={<><LegendItem label="Has booked session" /><LegendItem label="Active date" /></>}
        />

        {loading ? <Loading /> : error || !data ? <ErrorState message={error} onRetry={load} /> : (
          <>
            <SectionHeader
              title="UPCOMING SESSIONS"
              badge={`${list.length} SCHEDULED`}
              linkLabel="ADD SESSION +"
              onLink={openAvailability}
            />
            {list.length === 0 ? (
              <EmptyState icon="calendar-clear-outline" title="No sessions scheduled" text="Accepted requests appear here once confirmed." />
            ) : list.map((sv) => <SessionCard key={sv.bookingId} session={sv} />)}

            <SectionHeader
              title="MY AVAILABILITY"
              right={(
                <Pressable onPress={openAvailability} style={styles.editSlots} hitSlop={6}>
                  <Text style={styles.editSlotsText}>+ EDIT SLOTS</Text>
                </Pressable>
              )}
            />
            <AvailabilityList days={data.availability} />
          </>
        )}
      </ScrollView>

      <OptionSheet<View_>
        visible={filterOpen}
        title="Show sessions"
        value={view}
        onSelect={setView}
        onClose={() => setFilterOpen(false)}
        options={[
          { value: 'upcoming', label: 'Confirmed sessions' },
          { value: 'all', label: 'Confirmed & completed sessions' },
        ]}
      />
    </SafeAreaView>
  );
}

function AvailabilityList({ days }: { days: AvailabilityDay[] }) {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const hasAny = days.some((d) => d.slots.length);
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {MONDAY_FIRST.map((day, i) => {
        const d = byDay.get(day) ?? { day, slots: [], status: 'closed' as const };
        const closed = d.status !== 'open';
        return (
          <View key={day} style={[styles.availRow, i > 0 && styles.availDivider, closed && styles.availClosed]}>
            <Text style={[styles.availDay, closed && { color: C.muted }]}>{WEEKDAY_NAMES[day]}</Text>
            <Text style={[styles.availTime, closed && styles.availTimeClosed]} numberOfLines={2}>
              {d.slots.length
                ? d.slots.map((sl) => `${hhmmTo12(sl.start)} - ${hhmmTo12(sl.end)}`).join('\n')
                : 'Unavailable'}
              {d.status === 'booked' ? ' (Booked)' : ''}
            </Text>
            <Pill label={closed ? 'CLOSED' : 'OPEN'} tone={closed ? 'muted' : 'soft'} small />
          </View>
        );
      })}
      {!hasAny && (
        <View style={styles.availHint}>
          <Text style={{ fontSize: 12, color: C.muted, flex: 1 }}>Set your weekly slots so students and reschedules can use them.</Text>
          <LinkText label="SET SLOTS" onPress={openAvailability} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  editSlots: { backgroundColor: C.tealSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  editSlotsText: { fontSize: 10, fontWeight: '800', color: C.teal, letterSpacing: 0.5 },
  availRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  availDivider: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  availClosed: { backgroundColor: '#F7F7F3' },
  availDay: { width: 100, fontSize: 14, fontWeight: '800', color: C.ink },
  availTime: { flex: 1, fontSize: 13, color: C.ink },
  availTimeClosed: { fontStyle: 'italic', color: C.muted },
  availHint: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: C.lineSoft },
});
