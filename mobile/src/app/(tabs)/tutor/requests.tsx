import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  C, Card, Chips, Divider, EmptyState, ErrorState, FooterNote, IconButton, InfoRow, Label,
  Loading, OptionSheet, Pill, PrimaryButton, SectionHeader, TabHeader, s,
} from '@/components/tutor/ui';
import { RequestView, errorMessage, tutorApi } from '@/lib/tutorApi';
import { relativeDay, requestBadge, subjectLabel } from '@/lib/tutorFormat';

type Filter = 'all' | 'pending' | 'accepted';
type Sort = 'newest' | 'soonest';

export default function SessionRequestsScreen() {
  const [filter, setFilter] = useState<Filter>('pending');
  const [sort, setSort] = useState<Sort>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [items, setItems] = useState<RequestView[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, accepted: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await tutorApi.requests(filter);
      setItems(data.items);
      setCounts(data.counts);
    } catch (err) {
      setError(errorMessage(err, 'Could not load requests.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sorted = useMemo(() => {
    const list = [...items];
    if (sort === 'soonest') list.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
    return list;
  }, [items, sort]);

  const filterName = filter === 'all' ? 'requests' : `${filter} requests`;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <TabHeader
        title="Session Requests"
        subtitle="Tutor student requests & approvals"
        right={<IconButton icon="options-outline" label="Sort requests" onPress={() => setSortOpen(true)} />}
      />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.teal} />}>
        <SectionHeader
          title="INCOMING REQUESTS"
          badge={`${counts.pending} PENDING`}
          right={<Text style={{ fontSize: 12, color: C.muted }}>Total: {counts.all}</Text>}
        />
        <Chips<Filter>
          value={filter}
          onChange={(v) => { setLoading(true); setFilter(v); }}
          options={[
            { value: 'all', label: `All (${counts.all})` },
            { value: 'pending', label: `Pending (${counts.pending})` },
            { value: 'accepted', label: `Accepted${filter === 'accepted' ? ` (${counts.accepted})` : ''}` },
          ]}
        />

        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={load} /> : sorted.length === 0 ? (
          <EmptyState
            icon="file-tray-outline"
            title={`No ${filterName}`}
            text="When a student sends you a session request it will appear here."
          />
        ) : (
          <>
            {sorted.map((r) => <RequestCard key={`${r.kind}-${r.id}`} request={r} />)}
            <FooterNote text={`End of ${filterName} (${sorted.length})`} />
          </>
        )}
      </ScrollView>

      <OptionSheet<Sort>
        visible={sortOpen}
        title="Sort requests"
        value={sort}
        onSelect={setSort}
        onClose={() => setSortOpen(false)}
        options={[
          { value: 'newest', label: 'Newest first' },
          { value: 'soonest', label: 'Soonest session date' },
        ]}
      />
    </SafeAreaView>
  );
}

function RequestCard({ request: r }: { request: RequestView }) {
  const badge = requestBadge(r.status);
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Label>{subjectLabel(r.subject)}</Label>
          <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink }}>{r.subject}</Text>
        </View>
        <Pill label={badge.label} tone={badge.tone} />
      </View>
      <Divider dashed />
      <View style={{ gap: 4 }}>
        <InfoRow label="Student:" value={r.student.name} />
        <InfoRow label="Academic Level:" value={r.academicLevel || '—'} />
        <InfoRow label="Requested Time:" value={`${relativeDay(r.date)} • ${r.startTime}`} />
        <InfoRow label="Format:" value={r.format} />
      </View>
      <PrimaryButton
        label="View Request"
        style={{ marginTop: 4 }}
        onPress={() => router.push({ pathname: '/(tabs)/tutor/request-details' as any, params: { kind: r.kind, id: r.id } })}
      />
    </Card>
  );
}
