// "Software Engineering Tutoring / Student: … / DATE & TIME / FORMAT / [VIEW SESSION DETAILS]"
// Used by My Calendar (and anywhere a scheduled session is listed).
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { C, Card, Divider, KeyValue, Pill, PrimaryButton } from '@/components/tutor/ui';
import type { SessionView } from '@/lib/tutorApi';
import { formatLabel, shortDate, timeRange } from '@/lib/tutorFormat';

export const sessionPill = (sv: SessionView) => {
  if (sv.status === 'cancelled') return { label: 'CANCELLED', tone: 'muted' as const };
  if (sv.status === 'completed') return { label: 'COMPLETED', tone: 'soft' as const };
  if (sv.rescheduleRequest?.status === 'pending') return { label: 'RESCHEDULE PENDING', tone: 'warn' as const };
  if (sv.status === 'pending') return { label: 'PENDING', tone: 'soft' as const };
  return { label: 'CONFIRMED', tone: 'outline' as const };
};

export const openSession = (bookingId: string) =>
  router.push({ pathname: '/(tabs)/tutor/session-details' as any, params: { bookingId } });

export function SessionCard({ session: sv }: { session: SessionView }) {
  const pill = sessionPill(sv);
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink }}>{sv.subject}</Text>
          <Text style={{ fontSize: 13, color: C.muted }}>Student: {sv.student.name}</Text>
        </View>
        <Pill label={pill.label} tone={pill.tone} />
      </View>
      <Divider />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <KeyValue label="DATE & TIME" value={`${shortDate(sv.date)}, ${timeRange(sv.startTime, sv.endTime)}`} />
        <KeyValue label="FORMAT" value={formatLabel(sv.format, sv.meetingType)} />
      </View>
      <PrimaryButton label="View Session Details" compact onPress={() => openSession(sv.bookingId)} />
    </Card>
  );
}
