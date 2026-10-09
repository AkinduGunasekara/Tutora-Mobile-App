import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttachmentGrid, AttachmentKind, iconForType, mockFile } from '@/components/tutor/attachments';
import { sessionPill } from '@/components/tutor/SessionCard';
import {
  BackHeader, Banner, C, Card, ConfirmSheet, Divider, ErrorState, FooterNote, GhostButton, InfoRow, Label,
  LinkText, Loading, OutlineButton, PersonAvatar, Pill, PrimaryButton, SectionHeader, Sheet, goBack, s,
} from '@/components/tutor/ui';
import { SessionView, SharedFile, errorMessage, tutorApi } from '@/lib/tutorApi';
import {
  countdown, durationLabel, fileSize, longDate, money, paymentBadge, timeRange, weekdayDate,
} from '@/lib/tutorFormat';

const STATUS_TEXT: Record<string, string> = {
  confirmed: 'Confirmed & Synced',
  pending: 'Awaiting Your Response',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const ESCROW_TEXT: Record<string, { label: string; note: string }> = {
  pending: { label: 'Awaiting student payment', note: 'The student pays to confirm the session. You can join once payment is secured.' },
  in_escrow: { label: 'Secured • 100% Guaranteed', note: 'Funds are securely held in Tutora Escrow and will be released to your payout account upon session completion.' },
  released: { label: 'Released to you', note: 'The session is complete and the payment has been settled to your payout account.' },
  refunded: { label: 'Refunded to student', note: 'This session was cancelled after payment, so the student was refunded.' },
};

export default function SessionDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [sv, setSv] = useState<SessionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState<SharedFile | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setSv(await tutorApi.session(bookingId));
    } catch (err) {
      setError(errorMessage(err, 'Could not load this session.'));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const back = () => goBack('/(tabs)/tutor/calendar');

  if (loading) return <SafeAreaView style={s.safe}><Loading /></SafeAreaView>;
  if (error || !sv) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <BackHeader title="Session Details" onBack={back} />
        <View style={s.scroll}><ErrorState message={error || 'Session not found.'} onRetry={load} /></View>
      </SafeAreaView>
    );
  }

  const pay = sv.payment;
  const paid = pay?.paymentStatus === 'in_escrow' || pay?.paymentStatus === 'released';
  const upcoming = sv.status === 'confirmed';
  const canJoin = upcoming && paid && !!pay?.sessionId;
  const proposal = sv.rescheduleRequest?.status === 'pending' ? sv.rescheduleRequest : null;
  const headerPill = sessionPill(sv);
  const badge = paymentBadge(pay?.paymentStatus);
  const escrow = ESCROW_TEXT[pay?.paymentStatus ?? 'pending'];
  const when = countdown(sv.startsAt, sv.durationMinutes);

  const join = () => {
    if (!pay) return;
    router.push({ pathname: '/(tabs)/session-video' as any, params: { sessionId: pay.sessionId } });
  };

  const message = () => {
    if (!pay) return;
    router.push({ pathname: '/(tabs)/tutor/chat' as any, params: { sessionId: pay.sessionId, bookingId: sv.bookingId } });
  };

  const cancel = async () => {
    setBusy(true);
    try {
      const { session } = await tutorApi.cancelSession(sv.bookingId, cancelReason.trim());
      setSv(session);
      setCancelOpen(false);
      setNotice({
        text: session.payment?.paymentStatus === 'refunded'
          ? 'Session cancelled. The student’s payment has been refunded.'
          : 'Session cancelled.',
        tone: 'success',
      });
    } catch (err) {
      setCancelOpen(false);
      setNotice({ text: errorMessage(err, 'Could not cancel this session.'), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    try {
      const { session } = await tutorApi.withdrawReschedule(sv.bookingId);
      setSv(session);
      setNotice({ text: 'Reschedule request withdrawn. The original time is kept.', tone: 'success' });
    } catch (err) {
      setNotice({ text: errorMessage(err, 'Could not withdraw the request.'), tone: 'error' });
    }
  };

  const addFile = async (kind: AttachmentKind) => {
    if (!pay) return;
    setAddOpen(false);
    try {
      await tutorApi.addFile(pay.sessionId, mockFile(kind));
      await load();
      setNotice({ text: 'File shared with the student.', tone: 'success' });
    } catch (err) {
      setNotice({ text: errorMessage(err, 'Could not add the file.'), tone: 'error' });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader title="Session Details" onBack={back} right={<Pill label={headerPill.label} tone={headerPill.tone} />} />
      <ScrollView contentContainerStyle={s.scroll}>
        {notice && <Banner text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}

        {proposal && (
          <Card style={styles.proposal}>
            <Label style={{ color: C.warn }}>Reschedule requested</Label>
            <Text style={styles.bold}>{weekdayDate(proposal.date)} · {timeRange(proposal.startTime, proposal.endTime)}</Text>
            <Text style={styles.muted}>Waiting for {sv.student.name} to approve. The current time below stays booked until then.</Text>
            <LinkText label="WITHDRAW REQUEST" onPress={withdraw} />
          </Card>
        )}

        {/* Summary */}
        <Card style={{ gap: 12 }}>
          <View style={styles.rowBetween}>
            <Label>{upcoming ? 'Scheduled Tutoring' : 'Tutoring Session'}</Label>
            {upcoming && when !== 'ENDED' && <Pill label={`UPCOMING • ${when}`} tone="soft" small />}
          </View>
          <Text style={styles.subject}>{sv.subject}</Text>
          <Divider dashed />
          <View style={{ gap: 6 }}>
            <InfoRow label="Student:" right={<LinkText label={sv.student.name} onPress={pay ? message : undefined} style={{ fontSize: 13 }} />} />
            <InfoRow label="Date:" value={longDate(sv.date)} />
            <InfoRow label="Time:" value={timeRange(sv.startTime, sv.endTime)} />
            <InfoRow label="Duration:" value={durationLabel(sv.durationMinutes)} />
            <InfoRow
              label="Format:"
              right={(
                <View style={styles.formatValue}>
                  <View style={styles.dot} />
                  <Text style={styles.bold}>
                    {sv.format === 'In-Person' ? 'In-Person' : canJoin ? 'Online (Meeting link ready)' : 'Online (Meeting Room)'}
                  </Text>
                </View>
              )}
            />
            <InfoRow label="Status:" value={upcoming && !paid ? 'Confirmed • Awaiting Payment' : STATUS_TEXT[sv.status]} />
          </View>
        </Card>

        {upcoming && (
          <>
            <PrimaryButton label="Join Session Room" onPress={join} disabled={!canJoin} />
            {!canJoin && <FooterNote text="The session room opens once the student completes payment." />}
            <OutlineButton label="Message Student" onPress={message} disabled={!pay} />
          </>
        )}

        {/* Student */}
        <SectionHeader title="STUDENT INFORMATION" />
        <Card style={{ gap: 12 }}>
          <View style={styles.studentRow}>
            <PersonAvatar size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.studentName}>{sv.student.name}</Text>
              {!!(sv.academicLevel || sv.student.year) && <Text style={styles.muted}>{sv.academicLevel || sv.student.year}</Text>}
              {!!(sv.student.degree || sv.student.university) && <Text style={styles.muted}>{sv.student.degree || sv.student.university}</Text>}
            </View>
            <Pill label={sv.student.isVerified ? 'VERIFIED' : 'STUDENT'} tone="soft" small />
          </View>
          <Divider dashed />
          <Label>Learning Objective:</Label>
          <View style={styles.quoteBox}>
            <Text style={styles.quote}>
              {sv.learningObjective || sv.message ? `“${sv.learningObjective || sv.message}”` : 'No learning objective shared yet.'}
            </Text>
          </View>
        </Card>

        {/* Payment */}
        <SectionHeader title="PAYMENT DETAILS" />
        <Card style={{ gap: 12 }}>
          <View style={styles.rowBetween}>
            <View style={{ gap: 4 }}>
              <Text style={styles.muted}>Session Fee:</Text>
              <Text style={styles.fee}>{money(pay?.amount ?? 0)}</Text>
            </View>
            <View style={{ gap: 6, alignItems: 'flex-end' }}>
              <Text style={styles.muted}>Payment Status:</Text>
              <Pill label={badge.label} tone={badge.tone} />
            </View>
          </View>
          <Divider dashed />
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>Platform Escrow Protection:</Text>
            <Text style={styles.bold}>{escrow.label}</Text>
          </View>
          <Text style={styles.small}>{escrow.note}</Text>
        </Card>

        {/* Files */}
        <SectionHeader title="SHARED FILES & RESOURCES" />
        <Card style={{ gap: 4 }}>
          {sv.files.length === 0 && <Text style={[styles.muted, { paddingVertical: 6 }]}>No files shared yet.</Text>}
          {sv.files.map((f, i) => (
            <View key={`${f.name}-${i}`}>
              {i > 0 && <Divider dashed />}
              <View style={styles.fileRow}>
                <View style={styles.fileIcon}><Ionicons name={iconForType(f.type)} size={16} color={C.teal} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.small}>Uploaded by {f.uploadedBy === 'tutor' ? 'you' : f.uploaderName.split(' ')[0]}{f.size ? ` • ${fileSize(f.size)}` : ''}</Text>
                </View>
                <Pressable onPress={() => setFileOpen(f)} style={styles.download}>
                  <Text style={styles.downloadText}>[DOWNLOAD]</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {pay && sv.status !== 'cancelled' && (
            <Pressable onPress={() => setAddOpen(true)} style={styles.addFile}>
              <Text style={styles.addFileText}>+  ADD FILE / MATERIAL</Text>
            </Pressable>
          )}
        </Card>

        {(upcoming || sv.status === 'pending') && (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <OutlineButton
                label="Reschedule"
                compact
                style={{ flex: 1, borderColor: C.line }}
                disabled={!!proposal}
                onPress={() => router.push({ pathname: '/(tabs)/tutor/reschedule' as any, params: { bookingId: sv.bookingId } })}
              />
              <OutlineButton label="Cancel Session" compact style={{ flex: 1, borderColor: C.line }} onPress={() => setCancelOpen(true)} />
            </View>
            <FooterNote text="Need changes? Sessions can be rescheduled without penalty up to 2 hours prior to start time." />
          </>
        )}
      </ScrollView>

      <ConfirmSheet
        visible={cancelOpen}
        title="Cancel this session?"
        message={paid
          ? 'The student has already paid. Cancelling refunds the payment held in escrow.'
          : 'The student will see that this session was cancelled.'}
        confirmLabel="Cancel Session"
        danger
        loading={busy}
        onConfirm={cancel}
        onClose={() => setCancelOpen(false)}>
        <TextInput
          style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
          placeholder="Reason for cancelling (optional)..."
          placeholderTextColor={C.muted}
          value={cancelReason}
          onChangeText={setCancelReason}
          multiline
          maxLength={500}
        />
      </ConfirmSheet>

      <Sheet visible={addOpen} title="Add file / material" onClose={() => setAddOpen(false)}>
        <AttachmentGrid onPick={addFile} />
        <Text style={styles.small}>Prototype: a sample file is attached to the session for demonstration.</Text>
      </Sheet>

      <Sheet visible={!!fileOpen} title={fileOpen?.name ?? ''} onClose={() => setFileOpen(null)}>
        <Text style={s.sheetMessage}>
          {fileOpen ? `${fileSize(fileOpen.size) || 'Unknown size'} · shared by ${fileOpen.uploadedBy === 'tutor' ? 'you' : fileOpen.uploaderName}` : ''}
        </Text>
        <Banner text="Prototype: file downloads are simulated. In the full app this would save the file to your device." />
        <GhostButton label="Close" onPress={() => setFileOpen(null)} />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  subject: { fontSize: 22, fontWeight: '800', color: C.ink },
  bold: { fontSize: 13, fontWeight: '700', color: C.ink },
  muted: { fontSize: 13, color: C.muted },
  small: { fontSize: 11, color: C.muted, lineHeight: 16 },
  formatValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.teal },
  proposal: { backgroundColor: C.warnSoft, borderColor: '#F1DFB4', gap: 6 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studentName: { fontSize: 16, fontWeight: '800', color: C.ink },
  quoteBox: { backgroundColor: '#F6F6F2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.lineSoft },
  quote: { fontSize: 13, fontStyle: 'italic', color: C.ink, lineHeight: 20 },
  fee: { fontSize: 26, fontWeight: '800', color: C.ink },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  fileIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.tealSoft, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 14, fontWeight: '700', color: C.ink },
  download: { borderWidth: 1, borderColor: C.lineSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  downloadText: { fontSize: 10, fontWeight: '800', color: C.teal, letterSpacing: 0.4 },
  addFile: { marginTop: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  addFileText: { fontSize: 12, fontWeight: '800', color: C.teal, letterSpacing: 0.5 },
});
