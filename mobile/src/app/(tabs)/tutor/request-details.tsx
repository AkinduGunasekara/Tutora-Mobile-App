import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BackHeader, Banner, C, Card, ConfirmSheet, Divider, ErrorState, FooterNote, GhostButton, InfoRow,
  Label, LinkText, Loading, PersonAvatar, Pill, PrimaryButton, SectionHeader, Sheet, goBack, s,
} from '@/components/tutor/ui';
import api from '@/lib/api';
import { RequestView, errorMessage, tutorApi } from '@/lib/tutorApi';
import { longDate, money, shortDuration, subjectLabel, timeRange, weekdayDate } from '@/lib/tutorFormat';

const HEADER_PILL: Record<string, { label: string; tone: 'soft' | 'warn' | 'outline' | 'muted' }> = {
  pending: { label: 'PENDING REVIEW', tone: 'soft' },
  proposed: { label: 'TIME PROPOSED', tone: 'warn' },
  accepted: { label: 'ACCEPTED', tone: 'outline' },
  declined: { label: 'DECLINED', tone: 'muted' },
  cancelled: { label: 'CANCELLED', tone: 'muted' },
};

export default function RequestDetailsScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const [request, setRequest] = useState<RequestView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [messageInfoOpen, setMessageInfoOpen] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setRequest(await tutorApi.request(kind, id));
    } catch (err) {
      setError(errorMessage(err, 'Could not load this request.'));
    } finally {
      setLoading(false);
    }
  }, [kind, id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const back = () => goBack('/(tabs)/tutor/requests');

  const accept = async () => {
    setBusy('accept');
    setNotice(null);
    try {
      await tutorApi.acceptRequest(kind, id);
      await load();
      setNotice({ text: 'Request accepted. The session is now on your calendar and the student can pay to confirm it.', tone: 'success' });
    } catch (err) {
      setNotice({ text: errorMessage(err, 'Could not accept this request.'), tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const decline = async () => {
    setBusy('decline');
    try {
      await tutorApi.declineRequest(kind, id, declineReason.trim());
      setDeclineOpen(false);
      await load();
      setNotice({ text: 'Request declined. The student will see this on their bookings.', tone: 'success' });
    } catch (err) {
      setDeclineOpen(false);
      setNotice({ text: errorMessage(err, 'Could not decline this request.'), tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const proposeAlternative = () => {
    if (!request) return;
    router.push({
      pathname: '/(tabs)/tutor/reschedule' as any,
      params: { mode: 'propose', kind, id },
    });
  };

  const message = async () => {
    if (!request?.bookingId || request.status !== 'accepted') {
      setMessageInfoOpen(true);
      return;
    }
    try {
      const { data } = await api.get(`/session/by-booking/${request.bookingId}`);
      router.push({ pathname: '/(tabs)/tutor/chat' as any, params: { sessionId: data._id, bookingId: request.bookingId } });
    } catch {
      setMessageInfoOpen(true);
    }
  };

  const pill = request ? HEADER_PILL[request.status] : null;
  const isOpen = request?.status === 'pending' || request?.status === 'proposed';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader title="Request Details" onBack={back} right={pill && <Pill label={pill.label} tone={pill.tone} />} />
      {loading ? <Loading /> : error || !request ? (
        <View style={s.scroll}><ErrorState message={error || 'Request not found.'} onRetry={load} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {notice && <Banner text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}

          {/* Student */}
          <Card style={styles.studentCard}>
            <PersonAvatar size={56} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.studentName}>{request.student.name}</Text>
              {!!request.academicLevel && <Text style={styles.studentMeta}>{request.academicLevel}</Text>}
              {!!(request.student.degree || request.student.university) && (
                <Text style={styles.studentMeta}>{request.student.degree || request.student.university}</Text>
              )}
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <Pill label={request.student.isVerified ? 'VERIFIED' : 'STUDENT'} tone="soft" small />
              </View>
            </View>
            <LinkText label="MESSAGE" onPress={message} style={{ fontSize: 13 }} />
          </Card>

          {/* Request details */}
          <SectionHeader title="REQUEST DETAILS" right={<Text style={styles.ref}>ID: {request.ref}</Text>} />
          <Card style={{ gap: 12 }}>
            <View style={{ gap: 4 }}>
              <Label>{subjectLabel(request.subject)}</Label>
              <Text style={styles.subject}>{request.subject}</Text>
            </View>
            <Divider dashed />
            <View style={{ gap: 6 }}>
              <InfoRow label="Academic Level:" value={request.academicLevel || '—'} />
              <InfoRow
                label="Preferred Format:"
                right={(
                  <View style={styles.formatValue}>
                    <View style={styles.dot} />
                    <Text style={styles.infoBold}>{request.format === 'Online' ? 'Online (Meeting Room)' : 'In-Person'}</Text>
                  </View>
                )}
              />
              <InfoRow label="Requested Date:" value={longDate(request.date)} />
              <InfoRow
                label="Requested Time:"
                value={`${timeRange(request.startTime, request.endTime)} (${shortDuration(request.durationMinutes)})`}
              />
            </View>

            {request.alternative && request.status === 'proposed' && (
              <View style={styles.proposalBox}>
                <Label style={{ color: C.warn }}>Alternative time sent</Label>
                <Text style={styles.infoBold}>
                  {weekdayDate(request.alternative.date)} · {timeRange(request.alternative.startTime, request.alternative.endTime)}
                </Text>
                <Text style={styles.studentMeta}>Waiting for the student to accept or decline.</Text>
              </View>
            )}

            {!!request.learningObjective && (
              <>
                <Divider dashed />
                <Label>Learning Objective</Label>
                <View style={styles.quoteBox}>
                  <Text style={styles.quote}>“{request.learningObjective}”</Text>
                </View>
              </>
            )}

            <Divider dashed />
            <Label>Student Note</Label>
            <View style={styles.noteBox}>
              <Text style={styles.note}>{request.note || 'No note added.'}</Text>
            </View>
          </Card>

          {/* Fee */}
          <SectionHeader title="SESSION FEE & EARNINGS" />
          <Card style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ gap: 4 }}>
                <Text style={styles.feeLabel}>Total Student Payment:</Text>
                <Text style={styles.feeValue}>{money(request.fees.total)}</Text>
              </View>
              <View style={{ gap: 4, alignItems: 'flex-end' }}>
                <Text style={styles.feeLabel}>Your Net Payout:</Text>
                <Text style={[styles.feeValue, { color: C.teal }]}>{money(request.fees.session)}</Text>
              </View>
            </View>
            <Divider dashed />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={styles.feeSmall}>Platform Service Fee (5%): {money(request.fees.serviceFee)}</Text>
              <Text style={[styles.feeSmall, { color: C.teal, fontWeight: '700' }]}>
                {request.status === 'accepted' ? 'Escrow on Payment' : 'Paid after Acceptance'}
              </Text>
            </View>
          </Card>

          {request.status === 'declined' && !!request.declineReason && (
            <Banner text={`Declined: ${request.declineReason}`} />
          )}

          {isOpen ? (
            <>
              <FooterNote text="Please review student's request carefully before accepting. Confirmed sessions are instantly synced with your Tutora calendar." />
              <PrimaryButton label="Accept Request" onPress={accept} loading={busy === 'accept'} disabled={!!busy} />
              <GhostButton label="Decline" onPress={() => setDeclineOpen(true)} disabled={!!busy} />
              <View style={{ alignItems: 'center', marginTop: 4 }}>
                <LinkText label="PROPOSE ALTERNATIVE TIME" onPress={proposeAlternative} style={{ fontSize: 13 }} />
              </View>
            </>
          ) : request.status === 'accepted' && request.bookingId ? (
            <PrimaryButton
              label="View Session Details"
              onPress={() => router.push({ pathname: '/(tabs)/tutor/session-details' as any, params: { bookingId: request.bookingId! } })}
            />
          ) : null}
        </ScrollView>
      )}

      <ConfirmSheet
        visible={declineOpen}
        title="Decline request?"
        message="Let the student know why you can't take this session (optional)."
        confirmLabel="Decline Request"
        danger
        loading={busy === 'decline'}
        onConfirm={decline}
        onClose={() => setDeclineOpen(false)}>
        <TextInput
          style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
          placeholder="Reason for declining..."
          placeholderTextColor={C.muted}
          value={declineReason}
          onChangeText={setDeclineReason}
          multiline
          maxLength={500}
        />
      </ConfirmSheet>

      <Sheet visible={messageInfoOpen} title="Message student" onClose={() => setMessageInfoOpen(false)}>
        <Text style={s.sheetMessage}>
          Chat with {request?.student.name ?? 'the student'} opens once you accept this request. Accepting creates the session and its chat room.
        </Text>
        <GhostButton label="OK" onPress={() => setMessageInfoOpen(false)} />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  studentName: { fontSize: 18, fontWeight: '800', color: C.ink },
  studentMeta: { fontSize: 13, color: C.muted },
  ref: { fontSize: 12, color: C.muted },
  subject: { fontSize: 18, fontWeight: '800', color: C.ink },
  formatValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.teal },
  infoBold: { fontSize: 13, fontWeight: '700', color: C.ink },
  quoteBox: { backgroundColor: '#F6F6F2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.lineSoft },
  quote: { fontSize: 13, fontStyle: 'italic', color: C.ink, lineHeight: 20 },
  noteBox: { borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.line },
  note: { fontSize: 14, color: C.ink, lineHeight: 21 },
  proposalBox: { backgroundColor: C.warnSoft, borderRadius: 12, padding: 12, gap: 4 },
  feeLabel: { fontSize: 13, color: C.muted },
  feeValue: { fontSize: 24, fontWeight: '800', color: C.ink },
  feeSmall: { fontSize: 12, color: C.muted, flexShrink: 1 },
});
