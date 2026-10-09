// Tutor In-Session Chat (Hi-Fi "Messages"). Reuses the Session messages API:
// GET /session/:id (polled), POST /session/:id/message, POST /session/:id/file.
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ATTACHMENTS, AttachmentGrid, AttachmentKind, iconForType, mockFile } from '@/components/tutor/attachments';
import {
  Banner, C, GhostButton, InitialsBadge, Label, Loading, PersonAvatar, Pill, PrimaryButton, Sheet, goBack, s,
} from '@/components/tutor/ui';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { SessionView, errorMessage, tutorApi } from '@/lib/tutorApi';
import { fileSize, initialsOf, relativeDay, timeRange } from '@/lib/tutorFormat';

type Message = {
  _id: string;
  sender: { _id: string; name: string } | string;
  text: string;
  attachment?: { name: string; type: string; size?: number } | null;
  sentAt: string;
};

const senderId = (m: Message) => (typeof m.sender === 'string' ? m.sender : m.sender?._id);
const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const dayOf = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function TutorChatScreen() {
  const { sessionId, bookingId } = useLocalSearchParams<{ sessionId: string; bookingId?: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [student, setStudent] = useState<{ name: string } | null>(null);
  const [subject, setSubject] = useState('');
  const [sv, setSv] = useState<SessionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [videoInfo, setVideoInfo] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchSession = useCallback(async () => {
    const { data } = await api.get(`/session/${sessionId}`);
    setMessages(data.messages ?? []);
    setStudent(data.student);
    setSubject(data.subject);
    return data;
  }, [sessionId]);

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchSession();
        const bid = bookingId || data.bookingId;
        if (bid) tutorApi.session(bid).then((v) => alive && setSv(v)).catch(() => {});
      } catch (err) {
        if (alive) setError(errorMessage(err, 'Could not load this conversation.'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    // Poll for new messages like the existing session chat
    const timer = setInterval(() => { fetchSession().catch(() => {}); }, 4000);
    return () => { alive = false; clearInterval(timer); };
  }, [fetchSession, bookingId]));

  const myId = user?.id;
  const lastStudentAt = useMemo(() => {
    const theirs = messages.filter((m) => senderId(m) !== myId);
    return theirs.length ? new Date(theirs[theirs.length - 1].sentAt).getTime() : 0;
  }, [messages, myId]);
  // Online when the student was active in the last 10 minutes
  const online = Date.now() - lastStudentAt < 10 * 60000;

  const post = async (body: { text: string; attachment?: { name: string; type: string; size?: number } }) => {
    setSending(true);
    setError('');
    try {
      await api.post(`/session/${sessionId}/message`, body);
      if (body.attachment) {
        // Also list it under the session's shared files
        await api.post(`/session/${sessionId}/file`, body.attachment).catch(() => {});
      }
      await fetchSession();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      setError(errorMessage(err, 'Message not sent. Please try again.'));
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    await post({ text: body });
  };

  const pick = async (kind: AttachmentKind) => {
    if (kind === 'code') { setCodeOpen(true); return; }
    setTrayOpen(false);
    await post({ text: '', attachment: mockFile(kind) });
  };

  const sendCode = async () => {
    if (!code.trim()) return;
    setCodeOpen(false);
    setTrayOpen(false);
    await post({ text: code.trim(), attachment: { name: 'snippet.py', type: 'code', size: code.length } });
    setCode('');
  };

  const openVideo = () => {
    const paid = sv?.payment?.paymentStatus === 'in_escrow' || sv?.payment?.paymentStatus === 'released';
    if (paid && sv?.status === 'confirmed') router.push({ pathname: '/(tabs)/session-video' as any, params: { sessionId } });
    else setVideoInfo(true);
  };

  if (loading) return <SafeAreaView style={s.safe}><Loading /></SafeAreaView>;

  const studentName = student?.name ?? 'Student';
  let lastDay = '';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" onPress={() => goBack('/(tabs)/tutor/messages')} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={C.ink} />
        </Pressable>
        <PersonAvatar size={42} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.name} numberOfLines={1}>{studentName}</Text>
            {online && <View style={styles.onlineDot} />}
          </View>
          <Text style={styles.subject} numberOfLines={1}>{subject}</Text>
        </View>
        <Pressable accessibilityLabel="Start video session" onPress={openVideo} style={styles.videoBtn}>
          <Ionicons name="videocam-outline" size={20} color={C.teal} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[s.scroll, { paddingBottom: 12 }]}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {sv && sv.status === 'confirmed' && (
            <View style={styles.upcoming}>
              <View style={{ flex: 1 }}>
                <Label>Upcoming Session</Label>
                <Text style={styles.upcomingTime}>{relativeDay(sv.date)}, {timeRange(sv.startTime, sv.endTime)}</Text>
              </View>
              <Pill label={sv.format === 'Online' ? 'ONLINE (MEET)' : 'IN-PERSON'} tone="outline" />
            </View>
          )}

          {messages.length === 0 && (
            <Text style={styles.empty}>No messages yet. Say hello to {studentName.split(' ')[0]}!</Text>
          )}

          {messages.map((m, i) => {
            const mine = senderId(m) === myId;
            const day = dayOf(m.sentAt);
            const showDay = day !== lastDay;
            lastDay = day;
            const read = mine && messages.slice(i + 1).some((n) => senderId(n) !== myId);
            return (
              <View key={m._id ?? i} style={{ gap: 4 }}>
                {showDay && (
                  <View style={styles.dayRow}>
                    <View style={styles.dayLine} />
                    <Text style={styles.dayText}>{relativeDay(day).toUpperCase()} • {clock(m.sentAt)}</Text>
                    <View style={styles.dayLine} />
                  </View>
                )}
                <View style={[styles.msgRow, mine && { justifyContent: 'flex-end' }]}>
                  {!mine && <InitialsBadge initials={initialsOf(studentName)} size={28} />}
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    {m.attachment && (
                      <View style={styles.attachment}>
                        <View style={styles.attachIcon}>
                          <Ionicons name={iconForType(m.attachment.type)} size={16} color={C.teal} />
                        </View>
                        <View style={{ flexShrink: 1 }}>
                          <Text style={styles.attachName} numberOfLines={1}>{m.attachment.name}</Text>
                          {!!m.attachment.size && m.attachment.type !== 'code' && (
                            <Text style={styles.meta}>{fileSize(m.attachment.size)}</Text>
                          )}
                        </View>
                      </View>
                    )}
                    {!!m.text && (
                      <Text style={[styles.msgText, m.attachment?.type === 'code' && styles.code]}>{m.text}</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.meta, mine ? { textAlign: 'right' } : { marginLeft: 36 }]}>
                  {clock(m.sentAt)}{mine ? ` • ${read ? 'Read' : 'Delivered'}` : ''}
                </Text>
              </View>
            );
          })}

          {trayOpen && (
            <View style={styles.tray}>
              <View style={styles.trayHeader}>
                <Ionicons name="attach" size={16} color={C.muted} />
                <Label style={{ flex: 1 }}>Attachment Tray (Active Menu)</Label>
                <Pressable onPress={() => setTrayOpen(false)} hitSlop={8}>
                  <Text style={styles.trayClose}>[CLOSE ×]</Text>
                </Pressable>
              </View>
              <AttachmentGrid onPick={pick} disabled={sending} />
            </View>
          )}
          {!!error && <Banner text={error} tone="error" onClose={() => setError('')} />}
        </ScrollView>

        {/* Composer */}
        <View style={styles.composer}>
          <Pressable
            accessibilityLabel="Attachments"
            onPress={() => setTrayOpen((v) => !v)}
            style={[styles.plus, trayOpen && { backgroundColor: C.tealSoft }]}>
            <Ionicons name={trayOpen ? 'close' : 'add'} size={22} color={C.teal} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={C.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable onPress={send} disabled={sending || !text.trim()} style={[styles.send, (sending || !text.trim()) && { opacity: 0.6 }]}>
            <Text style={styles.sendText}>SEND</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Sheet visible={codeOpen} title={ATTACHMENTS.code.label} onClose={() => setCodeOpen(false)}>
        <TextInput
          style={[s.input, styles.codeInput]}
          placeholder={'def solve():\n    ...'}
          placeholderTextColor={C.muted}
          value={code}
          onChangeText={setCode}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton label="Share Snippet" onPress={sendCode} disabled={!code.trim()} />
      </Sheet>

      <Sheet visible={videoInfo} title="Session room" onClose={() => setVideoInfo(false)}>
        <Text style={s.sheetMessage}>The video room opens once the student has paid for this session.</Text>
        <GhostButton label="OK" onPress={() => setVideoInfo(false)} />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, width: '100%', maxWidth: 560, alignSelf: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: C.ink, flexShrink: 1 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.teal },
  subject: { fontSize: 13, color: C.muted },
  videoBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: C.teal, backgroundColor: C.tealSoft, alignItems: 'center', justifyContent: 'center' },
  upcoming: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14 },
  upcomingTime: { fontSize: 15, fontWeight: '800', color: C.ink, marginTop: 4 },
  empty: { textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 20 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  dayLine: { flex: 1, height: 1, backgroundColor: C.line },
  dayText: { fontSize: 11, fontWeight: '800', color: C.muted, letterSpacing: 0.6 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { maxWidth: '78%', backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  bubbleMine: { borderRadius: 18, borderBottomRightRadius: 6 },
  bubbleTheirs: { borderRadius: 18, borderBottomLeftRadius: 6 },
  msgText: { fontSize: 15, color: C.ink, lineHeight: 21 },
  code: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, backgroundColor: '#F6F6F2', padding: 8, borderRadius: 8 },
  meta: { fontSize: 11, color: C.muted },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  attachIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.tealSoft, alignItems: 'center', justifyContent: 'center' },
  attachName: { fontSize: 13, fontWeight: '700', color: C.ink },
  tray: { backgroundColor: C.card, borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: C.lineSoft },
  trayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  trayClose: { fontSize: 11, fontWeight: '800', color: C.teal },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.page, width: '100%', maxWidth: 560, alignSelf: 'center' },
  plus: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: C.teal, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  input: { flex: 1, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, color: C.ink },
  send: { backgroundColor: C.teal, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 13 },
  sendText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.6 },
  codeInput: { minHeight: 140, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13 },
});
