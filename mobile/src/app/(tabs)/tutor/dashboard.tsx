// Tutor Dashboard (Hi-Fi). One call to GET /api/tutor/dashboard; everything links to the detail screens.
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { openSession } from '@/components/tutor/SessionCard';
import {
  C, Card, Divider, ErrorState, KeyValue, Label, Loading, OutlineButton, Pill, PrimaryButton, SectionHeader, TabHeader, s,
} from '@/components/tutor/ui';
import { Dashboard, errorMessage, tutorApi } from '@/lib/tutorApi';
import { formatLabel, money, relativeDay, relativeTime, shortName, timeRange } from '@/lib/tutorFormat';

const go = (path: string, params?: Record<string, string>) => () =>
  router.push(params ? { pathname: path as any, params } : (path as any));

export default function TutorDashboardScreen() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await tutorApi.dashboard());
    } catch (err) {
      setError(errorMessage(err, 'Could not load your dashboard.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const next = data?.nextSession;
  const nextPaid = next?.payment?.paymentStatus === 'in_escrow' || next?.payment?.paymentStatus === 'released';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <TabHeader
        title="Tutor Dashboard"
        subtitle="Peer-to-peer tutoring"
        right={(
          <Pressable accessibilityLabel="My profile" onPress={go('/(tabs)/profile')} style={styles.avatarBtn}>
            <Ionicons name="person-outline" size={20} color={C.ink} />
          </Pressable>
        )}
      />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.teal} />}>
        {loading ? <Loading /> : error || !data ? <ErrorState message={error} onRetry={load} /> : (
          <>
            {/* Next session */}
            <SectionHeader title="NEXT SESSION" right={next ? <Pill label="CONFIRMED" tone="outline" /> : undefined} />
            {next ? (
              <Card style={{ gap: 12 }}>
                <View style={{ gap: 2 }}>
                  <Text style={styles.title}>{next.subject}</Text>
                  <Text style={styles.body}>Student: <Text style={styles.bold}>{next.student.name}</Text></Text>
                </View>
                <Divider />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <KeyValue label="DATE & TIME" value={`${relativeDay(next.date)}, ${timeRange(next.startTime, next.endTime)}`} />
                  <KeyValue label="FORMAT" value={formatLabel(next.format, next.meetingType)} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <PrimaryButton
                    label="Join Session"
                    compact
                    style={{ flex: 1 }}
                    onPress={nextPaid && next.payment
                      ? go('/(tabs)/session-video', { sessionId: next.payment.sessionId })
                      : () => openSession(next.bookingId)}
                  />
                  <OutlineButton label="View Details" compact style={{ flex: 1 }} onPress={() => openSession(next.bookingId)} />
                </View>
                {!nextPaid && <Text style={styles.small}>Waiting for the student’s payment before the room opens.</Text>}
              </Card>
            ) : (
              <Card><Text style={styles.empty}>No upcoming sessions. Accepted requests appear here.</Text></Card>
            )}

            {/* Requests */}
            <SectionHeader
              title="SESSION REQUESTS"
              badge={`${data.requests.pendingCount} Pending`}
              linkLabel="SEE ALL →"
              onLink={go('/(tabs)/tutor/requests')}
            />
            {data.requests.items.length === 0 ? (
              <Card><Text style={styles.empty}>No new requests right now.</Text></Card>
            ) : data.requests.items.map((r) => (
              <Card key={`${r.kind}-${r.id}`} style={{ gap: 8 }}>
                <Text style={styles.cardTitle}>{r.subject}</Text>
                <Text style={styles.body}>Student: {r.student.name}</Text>
                <Text style={styles.body}>{relativeDay(r.date)}, {r.startTime}  •  {r.format}</Text>
                <OutlineButton
                  label="View Request"
                  compact
                  style={{ marginTop: 4 }}
                  onPress={go('/(tabs)/tutor/request-details', { kind: r.kind, id: r.id })}
                />
              </Card>
            ))}

            {/* Today */}
            <SectionHeader title="TODAY'S SCHEDULE" linkLabel="VIEW CALENDAR →" onLink={go('/(tabs)/tutor/calendar')} />
            <Card style={{ paddingVertical: 4 }}>
              {data.today.length === 0 ? (
                <Text style={[styles.empty, { paddingVertical: 12 }]}>Nothing scheduled for today.</Text>
              ) : data.today.map((t, i) => (
                <Pressable key={t.bookingId} onPress={() => openSession(t.bookingId)}>
                  {i > 0 && <Divider />}
                  <View style={styles.todayRow}>
                    <Text style={styles.todayTime}>{timeRange(t.startTime, t.endTime)}</Text>
                    <View style={styles.todayInfo}>
                      <Text style={styles.bold}>{t.subject}</Text>
                      <Text style={styles.small}>{t.student.name}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </Card>

            {/* Earnings */}
            <SectionHeader title="EARNINGS SUMMARY" linkLabel="VIEW PAYMENTS →" onLink={go('/(tabs)/tutor/payments')} />
            <Card style={{ gap: 10 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.body}>This Month</Text>
                <Label>Total Earned</Label>
              </View>
              <Text style={styles.big}>{money(data.earnings.total)}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={styles.subBox}>
                  <Label>Pending</Label>
                  <Text style={styles.bold}>{money(data.earnings.pending)}</Text>
                </View>
                <View style={styles.subBox}>
                  <Label>Paid / Settled</Label>
                  <Text style={styles.bold}>{money(data.earnings.settled)}</Text>
                </View>
              </View>
            </Card>

            {/* Reviews */}
            <SectionHeader title="REVIEWS & RATINGS" linkLabel="VIEW REVIEWS →" onLink={go('/(tabs)/tutor/reviews')} />
            <Card style={{ gap: 12 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.rating}>
                  ★ {data.reviews.count ? data.reviews.average.toFixed(1) : '—'}
                  <Text style={styles.outOf}> / 5.0</Text>
                </Text>
                <Text style={styles.body}>{data.reviews.count} Student Review{data.reviews.count === 1 ? '' : 's'}</Text>
              </View>
              {data.reviews.latest && (
                <>
                  <Divider dashed />
                  <View style={styles.reviewBox}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.bold}>{shortName(data.reviews.latest.student.name)}</Text>
                      <Text style={styles.small}>{relativeTime(data.reviews.latest.createdAt)}</Text>
                    </View>
                    <Text style={styles.quote} numberOfLines={3}>“{data.reviews.latest.comment}”</Text>
                  </View>
                </>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 18, fontWeight: '800', color: C.ink },
  cardTitle: { fontSize: 15, fontWeight: '800', color: C.ink },
  body: { fontSize: 13, color: C.muted },
  bold: { fontSize: 14, fontWeight: '800', color: C.ink },
  small: { fontSize: 12, color: C.muted },
  empty: { fontSize: 13, color: C.muted, textAlign: 'center' },
  todayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  todayTime: { width: 118, fontSize: 13, fontWeight: '700', color: C.ink },
  todayInfo: { flex: 1, borderLeftWidth: 1, borderLeftColor: C.line, paddingLeft: 12, gap: 2 },
  big: { fontSize: 28, fontWeight: '800', color: C.ink },
  subBox: { flex: 1, backgroundColor: '#F7F7F3', borderRadius: 12, borderWidth: 1, borderColor: C.lineSoft, padding: 12, gap: 4 },
  rating: { fontSize: 22, fontWeight: '800', color: C.ink },
  outOf: { fontSize: 14, fontWeight: '600', color: C.muted },
  reviewBox: { backgroundColor: '#F7F7F3', borderRadius: 12, borderWidth: 1, borderColor: C.lineSoft, padding: 12, gap: 6 },
  quote: { fontSize: 13, fontStyle: 'italic', color: C.ink, lineHeight: 19 },
});
