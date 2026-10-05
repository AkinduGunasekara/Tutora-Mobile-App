// Student-side "Action needed" section: lets the student approve or decline new times
// proposed by a tutor (rescheduled bookings and alternative times for custom requests),
// and see tutors' answers to their custom requests.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import api from '@/lib/api';

const INK = '#171943';
const TEAL = '#008C91';
const MUTED = '#78809A';

type Item = {
  key: string;
  kind: 'booking' | 'custom';
  id: string;
  title: string;
  tutorName: string;
  current: string;
  proposed: string;
  note: string;
};

type Answered = { id: string; title: string; tutorName: string; status: 'rejected'; reason: string };

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

export default function StudentProposals({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [declined, setDeclined] = useState<Answered[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [bookingsRes, requestsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/discovery/custom-session/mine'),
      ]);
      const fromBookings: Item[] = (bookingsRes.data.bookings ?? [])
        .filter((b: any) => b.rescheduleRequest?.status === 'pending' && ['pending', 'confirmed'].includes(b.status))
        .map((b: any) => ({
          key: `b-${b._id}`,
          kind: 'booking',
          id: b._id,
          title: b.subject || b.tutor?.subtitle || 'Tutoring Session',
          tutorName: b.tutor?.name ?? 'Your tutor',
          current: `${dayLabel(b.sessionDate)}, ${b.startTime}`,
          proposed: `${dayLabel(b.rescheduleRequest.sessionDate)}, ${b.rescheduleRequest.startTime}`,
          note: b.rescheduleRequest.reason ?? '',
        }));
      const requests = requestsRes.data.data ?? [];
      const fromRequests: Item[] = requests
        .filter((r: any) => r.status === 'alternative_proposed' && r.alternative)
        .map((r: any) => ({
          key: `c-${r._id}`,
          kind: 'custom',
          id: r._id,
          title: r.subject,
          tutorName: r.tutor?.name ?? 'Your tutor',
          current: `${dayLabel(r.preferredDate)}, ${r.preferredTime}`,
          proposed: `${dayLabel(r.alternative.sessionDate)}, ${r.alternative.startTime}`,
          note: r.alternative.note ?? '',
        }));
      setItems([...fromBookings, ...fromRequests]);
      setDeclined(requests
        // Recently declined requests only (last 7 days)
        .filter((r: any) => r.status === 'rejected' && Date.now() - new Date(r.updatedAt).getTime() < 7 * 86400000)
        .slice(0, 3)
        .map((r: any) => ({ id: r._id, title: r.subject, tutorName: r.tutor?.name ?? 'Tutor', status: 'rejected', reason: r.declineReason ?? '' })));
    } catch {
      // Section is optional; the rest of the screen still works
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const respond = async (item: Item, approve: boolean) => {
    setBusy(item.key);
    setError('');
    try {
      if (item.kind === 'booking') {
        await api.patch(`/bookings/${item.id}/reschedule-request/respond`, { approve });
      } else {
        await api.patch(`/discovery/custom-session/${item.id}/respond`, { accept: approve });
      }
      await load();
      onChanged?.();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not send your answer. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  if (!items.length && !declined.length) return null;

  return (
    <View style={styles.wrap}>
      {items.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.title}>Action Needed</Text>
          <Text style={styles.count}>{items.length} New Time{items.length > 1 ? 's' : ''}</Text>
        </View>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {items.map((item) => (
        <View key={item.key} style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.meta}>{item.tutorName} proposed a new time</Text>
          <View style={styles.row}>
            <Text style={[styles.time, styles.old]}>{item.current}</Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.time}>{item.proposed}</Text>
          </View>
          {!!item.note && <Text style={styles.note}>“{item.note}”</Text>}
          <View style={styles.actions}>
            <Pressable style={styles.approve} disabled={!!busy} onPress={() => respond(item, true)}>
              {busy === item.key ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.approveText}>Approve</Text>}
            </Pressable>
            <Pressable style={styles.decline} disabled={!!busy} onPress={() => respond(item, false)}>
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {declined.map((d) => (
        <View key={d.id} style={[styles.card, { gap: 2 }]}>
          <Text style={styles.cardTitle}>{d.title}</Text>
          <Text style={styles.meta}>Request declined by {d.tutorName}{d.reason ? `: ${d.reason}` : ''}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: INK, fontSize: 15, fontWeight: '800' },
  count: { color: TEAL, fontSize: 11, fontWeight: '700' },
  error: { color: '#EF4444', fontSize: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, gap: 6, borderLeftWidth: 3, borderLeftColor: TEAL },
  cardTitle: { color: INK, fontSize: 14, fontWeight: '800' },
  meta: { color: MUTED, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  time: { color: INK, fontSize: 13, fontWeight: '700' },
  old: { color: MUTED, textDecorationLine: 'line-through', fontWeight: '500' },
  arrow: { color: TEAL, fontWeight: '800' },
  note: { color: INK, fontSize: 12, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  approve: { flex: 1, backgroundColor: TEAL, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  approveText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  decline: { flex: 1, borderWidth: 1, borderColor: '#E4E1D2', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  declineText: { color: INK, fontWeight: '700', fontSize: 13 },
});
