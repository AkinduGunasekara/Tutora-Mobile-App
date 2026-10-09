// Reviews & Ratings — from the existing Review collection (written by students via write-review).
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BackHeader, C, Card, Divider, EmptyState, ErrorState, FooterNote, GhostButton, IconButton, Label, Loading,
  OptionSheet, OutlineButton, Pill, PrimaryButton, Sheet, Stars, goBack, s,
} from '@/components/tutor/ui';
import { ReviewItem, ReviewSummary, errorMessage, tutorApi } from '@/lib/tutorApi';
import { isoShort, longDate } from '@/lib/tutorFormat';

type Sort = 'recent' | 'highest' | 'lowest';

export default function ReviewsScreen() {
  const [sort, setSort] = useState<Sort>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<ReviewItem | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await tutorApi.reviews(1, sort);
      setSummary(data);
      setItems(data.items);
      setPage(1);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your reviews.'));
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await tutorApi.reviews(page + 1, sort);
      setItems((prev) => [...prev, ...data.items]);
      setPage(page + 1);
      setHasMore(data.hasMore);
    } catch {
      // keep what is shown
    } finally {
      setLoadingMore(false);
    }
  };

  const max = summary ? Math.max(1, ...Object.values(summary.distribution)) : 1;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader
        title="Reviews & Ratings"
        onBack={() => goBack('/(tabs)/tutor/dashboard')}
        right={<IconButton icon="options-outline" label="Sort reviews" onPress={() => setSortOpen(true)} />}
      />
      {loading ? <Loading /> : error || !summary ? <View style={s.scroll}><ErrorState message={error} onRetry={load} /></View> : (
        <ScrollView contentContainerStyle={s.scroll}>
          <Label style={{ fontSize: 11 }}>Your Rating</Label>
          <Card style={{ gap: 12 }}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.big}>
                  {summary.count ? summary.average.toFixed(1) : '—'}
                  <Text style={styles.outOf}> / 5.0</Text>
                </Text>
                <Text style={styles.muted}>{summary.count} Student Review{summary.count === 1 ? '' : 's'}</Text>
              </View>
              <Pill label={summary.label.toUpperCase()} tone={summary.count ? 'solid' : 'muted'} />
            </View>
            <Divider />
            {(['5', '4', '3', '2', '1'] as const).map((star) => (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barLabel}>{star} Stars</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(summary.distribution[star] / max) * 100}%` }]} />
                </View>
                <Text style={styles.barCount}>{summary.distribution[star]}</Text>
              </View>
            ))}
          </Card>

          <View style={styles.rowBetween}>
            <Label style={{ fontSize: 11 }}>Recent Reviews</Label>
            <Text style={styles.small}>Total: {summary.count} records</Text>
          </View>

          {items.length === 0 ? (
            <EmptyState icon="star-outline" title="No reviews yet" text="Students can review you after a completed session." />
          ) : items.map((r) => (
            <Card key={r.id} style={{ gap: 10 }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Label>Subject & Session</Label>
                  <Text style={styles.subject}>{r.subject}</Text>
                </View>
                <Pill label={`★ ${r.rating.toFixed(1)}`} tone="soft" />
              </View>
              <Divider dashed />
              <View style={styles.rowBetween}>
                <View style={{ gap: 2 }}>
                  <Text style={styles.small}>Student:</Text>
                  <Text style={styles.strong}>{r.student.name}</Text>
                </View>
                <View style={{ gap: 2, alignItems: 'flex-end' }}>
                  <Text style={styles.small}>Date:</Text>
                  <Text style={styles.strong}>{isoShort(r.createdAt)}</Text>
                </View>
              </View>
              <Stars rating={r.rating} size={16} />
              <View style={styles.quote}>
                <Text style={styles.quoteText} numberOfLines={3}>“{r.comment}”</Text>
              </View>
              <PrimaryButton label="View Details" compact onPress={() => setDetail(r)} />
            </Card>
          ))}

          {hasMore && <OutlineButton label="Load More Reviews" onPress={loadMore} loading={loadingMore} />}
          {items.length > 0 && <FooterNote text={`End of recent reviews (${items.length} of ${summary.count})`} />}
        </ScrollView>
      )}

      <OptionSheet<Sort>
        visible={sortOpen}
        title="Sort reviews"
        value={sort}
        onSelect={(v) => { setLoading(true); setSort(v); }}
        onClose={() => setSortOpen(false)}
        options={[
          { value: 'recent', label: 'Most recent' },
          { value: 'highest', label: 'Highest rating' },
          { value: 'lowest', label: 'Lowest rating' },
        ]}
      />

      <Sheet visible={!!detail} title="Review Details" onClose={() => setDetail(null)}>
        {detail && (
          <Card style={{ gap: 10 }}>
            <Text style={styles.subject}>{detail.subject}</Text>
            <View style={styles.rowBetween}>
              <Stars rating={detail.rating} size={18} />
              <Text style={styles.strong}>{detail.rating.toFixed(1)} / 5.0</Text>
            </View>
            <Text style={styles.small}>{detail.student.name} · {longDate(new Date(detail.createdAt).toISOString().slice(0, 10))}</Text>
            <Divider dashed />
            <Text style={styles.body}>{detail.comment}</Text>
            {detail.tags.length > 0 && (
              <View style={styles.tags}>
                {detail.tags.map((t) => <Pill key={t} label={t.toUpperCase()} tone="soft" small />)}
              </View>
            )}
          </Card>
        )}
        <GhostButton label="Close" onPress={() => setDetail(null)} />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  big: { fontSize: 40, fontWeight: '800', color: C.ink },
  outOf: { fontSize: 18, fontWeight: '600', color: C.muted },
  muted: { fontSize: 13, color: C.muted },
  small: { fontSize: 12, color: C.muted },
  strong: { fontSize: 14, fontWeight: '800', color: C.ink },
  subject: { fontSize: 17, fontWeight: '800', color: C.ink },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 52, fontSize: 12, fontWeight: '700', color: C.ink },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#EEEBDD', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.teal },
  barCount: { width: 28, textAlign: 'right', fontSize: 12, fontWeight: '700', color: C.ink },
  quote: { borderLeftWidth: 3, borderLeftColor: C.line, backgroundColor: '#F6F6F2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  quoteText: { fontSize: 13, fontStyle: 'italic', color: C.ink, lineHeight: 19 },
  body: { fontSize: 14, color: C.ink, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
