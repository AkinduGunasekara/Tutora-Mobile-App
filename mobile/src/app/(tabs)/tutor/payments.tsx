// Payments & Earnings — calculated by the backend from Session payment states
// (in_escrow = pending, released = settled, refunded = shown but not counted).
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BackHeader, Banner, C, Card, Chips, Divider, EmptyState, ErrorState, FooterNote, GhostButton, IconButton, InfoRow,
  Label, LinkText, Loading, OptionSheet, Pill, PrimaryButton, Sheet, goBack, s,
} from '@/components/tutor/ui';
import { EarningItem, Earnings, errorMessage, tutorApi } from '@/lib/tutorApi';
import { isoWeekday, money, monthKey } from '@/lib/tutorFormat';

type Filter = 'all' | 'paid' | 'pending';

const monthName = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const lastMonths = (n: number) => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
};

const PAY_PILL: Record<string, { label: string; tone: 'soft' | 'outline' | 'muted'; dot?: boolean; icon?: 'checkmark' }> = {
  released: { label: 'PAID', tone: 'soft', icon: 'checkmark' },
  in_escrow: { label: 'PENDING', tone: 'outline', dot: true },
  refunded: { label: 'REFUNDED', tone: 'muted' },
};

const METHOD: Record<string, string> = { card: 'Card', bank_transfer: 'Bank Transfer', wallet: 'Wallet' };

export default function PaymentsScreen() {
  const [month, setMonth] = useState(monthKey(new Date()));
  const [monthOpen, setMonthOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [data, setData] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<EarningItem | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await tutorApi.earnings(month));
    } catch (err) {
      setError(errorMessage(err, 'Could not load your earnings.'));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const items = useMemo(() => (data?.items ?? []).filter((i) =>
    filter === 'paid' ? i.paymentStatus === 'released' : filter === 'pending' ? i.paymentStatus === 'in_escrow' : true),
  [data, filter]);

  const exportCsv = async () => {
    if (!data) return;
    const rows = [
      ['Date', 'Subject', 'Student', 'Amount (Rs)', 'Status'],
      ...data.items.map((i) => [new Date(i.date).toISOString().slice(0, 10), i.subject, i.student.name, String(i.amount), i.statusLabel]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `tutora-earnings-${data.month}.csv`;
        a.click();
      } else {
        await Share.share({ title: `Tutora earnings ${monthName(data.month)}`, message: csv });
      }
      setNotice(`Exported ${data.items.length} record${data.items.length === 1 ? '' : 's'} for ${monthName(data.month)}.`);
    } catch {
      setNotice('Export was cancelled.');
    }
  };

  const payoutDate = data
    ? new Date(data.payout.nextPayoutDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : '';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader
        title="Payments & Earnings"
        onBack={() => goBack('/(tabs)/tutor/dashboard')}
        right={<IconButton icon="options-outline" label="Choose month" onPress={() => setMonthOpen(true)} />}
      />
      {loading ? <Loading /> : error || !data ? <View style={s.scroll}><ErrorState message={error} onRetry={load} /></View> : (
        <ScrollView contentContainerStyle={s.scroll}>
          {!!notice && <Banner text={notice} tone="success" onClose={() => setNotice('')} />}
          <Label style={{ fontSize: 11 }}>Earnings Overview</Label>

          <Card style={{ gap: 6 }}>
            <View style={styles.rowBetween}>
              <Label>This Month</Label>
              <Pill label={monthName(data.month).toUpperCase()} tone="soft" small />
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.total}>{money(data.total)}</Text>
              <LinkText label="Export CSV" onPress={exportCsv} style={{ fontSize: 12 }} />
            </View>
            <Text style={styles.muted}>Total Gross Earned</Text>
          </Card>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card style={styles.half}>
              <Label>Pending</Label>
              <Text style={styles.amount}>{money(data.pending)}</Text>
              <Text style={styles.small}>In Escrow / Pending Release</Text>
            </Card>
            <Card style={styles.half}>
              <Label>Settled</Label>
              <Text style={styles.amount}>{money(data.settled)}</Text>
              <Text style={styles.small}>Paid to Bank Account</Text>
            </Card>
          </View>

          <View style={styles.payout}>
            <Ionicons name="information-circle-outline" size={20} color={C.teal} />
            <Text style={styles.payoutText}>
              Weekly payout scheduled for <Text style={styles.strong}>{payoutDate}</Text> to {data.payout.bankName} ending in{' '}
              <Text style={styles.strong}>*{data.payout.accountLast4}</Text>.
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Label style={{ fontSize: 11 }}>Payment History</Label>
            <Text style={styles.small}>Total: {data.counts.all} records</Text>
          </View>
          <Chips<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: `All (${data.counts.all})` },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
            ]}
          />

          {items.length === 0 ? (
            <EmptyState
              icon="wallet-outline"
              title="No payments yet"
              text={`Payments appear here once students pay for sessions in ${monthName(data.month)}.`}
            />
          ) : items.map((i) => <PaymentCard key={i.sessionId} item={i} onDetails={() => setDetail(i)} />)}
          {items.length > 0 && <FooterNote text={`End of transactions (${items.length})`} />}
        </ScrollView>
      )}

      <OptionSheet<string>
        visible={monthOpen}
        title="Choose month"
        value={month}
        onSelect={(m) => { setLoading(true); setMonth(m); }}
        onClose={() => setMonthOpen(false)}
        options={lastMonths(6).map((m) => ({ value: m, label: monthName(m) }))}
      />

      <Sheet visible={!!detail} title="Payment Details" onClose={() => setDetail(null)}>
        {detail && (
          <Card style={{ gap: 6 }}>
            <Text style={styles.title}>{detail.subject}</Text>
            <Divider dashed style={{ marginVertical: 4 }} />
            <InfoRow label="Student" value={detail.student.name} />
            <InfoRow label="Session Date" value={isoWeekday(detail.date)} />
            <InfoRow label="Your Earnings" value={money(detail.amount)} valueStyle={{ color: C.teal }} />
            <InfoRow label="Service Fee (paid by student)" value={money(detail.serviceFee)} />
            <InfoRow label="Student Paid" value={money(detail.totalAmount)} />
            <InfoRow label="Payment Method" value={METHOD[detail.paymentMethod] ?? detail.paymentMethod} />
            <InfoRow label="Status" value={detail.statusLabel} />
            <InfoRow label="Session" value={detail.sessionStatus[0].toUpperCase() + detail.sessionStatus.slice(1)} />
          </Card>
        )}
        <Text style={styles.small}>Prototype: payments are simulated, no real money is moved.</Text>
        <GhostButton label="Close" onPress={() => setDetail(null)} />
      </Sheet>
    </SafeAreaView>
  );
}

function PaymentCard({ item, onDetails }: { item: EarningItem; onDetails: () => void }) {
  const pill = PAY_PILL[item.paymentStatus] ?? PAY_PILL.in_escrow;
  return (
    <Card style={{ gap: 10 }}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, gap: 4 }}>
          <Label>Subject & Session</Label>
          <Text style={styles.title}>{item.subject}</Text>
        </View>
        <Pill label={pill.label} tone={pill.tone} dot={pill.dot} icon={pill.icon} />
      </View>
      <Divider />
      <View style={styles.grid}>
        <View style={{ gap: 2 }}>
          <Text style={styles.small}>Student:</Text>
          <Text style={styles.strongValue}>{item.student.name}</Text>
        </View>
        <View style={{ gap: 2, alignItems: 'flex-end' }}>
          <Text style={styles.small}>Amount:</Text>
          <Text style={[styles.strongValue, { color: C.teal, fontSize: 16 }]}>{money(item.amount)}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        <View style={{ gap: 2 }}>
          <Text style={styles.small}>Date:</Text>
          <Text style={styles.value}>{isoWeekday(item.date)}</Text>
        </View>
        <View style={{ gap: 2, alignItems: 'flex-end' }}>
          <Text style={styles.small}>Status:</Text>
          <Text style={styles.value}>{item.statusLabel}</Text>
        </View>
      </View>
      <PrimaryButton label="[View Details]" compact onPress={onDetails} />
    </Card>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  total: { fontSize: 30, fontWeight: '800', color: C.ink },
  amount: { fontSize: 20, fontWeight: '800', color: C.ink },
  muted: { fontSize: 13, color: C.muted },
  small: { fontSize: 12, color: C.muted },
  half: { flex: 1, gap: 6 },
  payout: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4 },
  payoutText: { flex: 1, fontSize: 13, color: C.ink, lineHeight: 19 },
  strong: { fontWeight: '800' },
  title: { fontSize: 17, fontWeight: '800', color: C.ink },
  grid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  strongValue: { fontSize: 14, fontWeight: '800', color: C.ink },
  value: { fontSize: 14, color: C.ink },
});
