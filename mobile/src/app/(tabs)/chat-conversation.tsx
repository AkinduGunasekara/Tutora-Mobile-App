import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';
const CARD  = '#FFFFFF';

function formatTime(date: string) {
  const d = new Date(date);
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(date: string) {
  const d = new Date(date), today = new Date(), yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString())  return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type === 'image')    return 'image-outline';
  if (type === 'code')     return 'code-slash-outline';
  if (type === 'video')    return 'videocam-outline';
  return 'document-outline';
}

function groupMessages(messages: any[]) {
  const groups: { date: string; messages: any[] }[] = [];
  let cur = '';
  for (const msg of messages) {
    const d = formatDate(msg.sentAt);
    if (d !== cur) { cur = d; groups.push({ date: d, messages: [msg] }); }
    else groups[groups.length - 1].messages.push(msg);
  }
  return groups;
}

// ── Attachment bubble ──────────────────────────────────────────────────────
function AttachmentBubble({ att, isMine }: { att: any; isMine: boolean }) {
  return (
    <View style={[styles.attBubble, isMine && styles.attBubbleMine]}>
      <View style={[styles.attIcon, isMine && styles.attIconMine]}>
        <Ionicons name={fileIcon(att.fileType) as any} size={18} color={isMine ? TEAL : MUTED} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.attName, isMine && styles.attNameMine]} numberOfLines={1}>{att.name}</Text>
        {att.fileType === 'code' && att.content ? (
          <Text style={styles.codePreview} numberOfLines={2}>{att.content}</Text>
        ) : (
          <Text style={styles.attMeta}>
            {att.fileType.toUpperCase()}{att.size ? ` • ${formatSize(att.size)}` : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Code input modal ───────────────────────────────────────────────────────
function CodeModal({
  visible, onClose, onSubmit,
}: {
  visible: boolean; onClose: () => void; onSubmit: (name: string, code: string) => void;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Code Snippet</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={INK} />
            </Pressable>
          </View>
          <TextInput
            style={styles.modalNameInput}
            placeholder="Snippet name (e.g. main.py)"
            placeholderTextColor={MUTED}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.codeInput}
            placeholder="Paste your code here..."
            placeholderTextColor={MUTED}
            value={code}
            onChangeText={setCode}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            style={[styles.modalBtn, (!name.trim() || !code.trim()) && { opacity: 0.4 }]}
            disabled={!name.trim() || !code.trim()}
            onPress={() => { onSubmit(name.trim(), code.trim()); setName(''); setCode(''); }}>
            <Text style={styles.modalBtnText}>Share Snippet</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function ChatConversationScreen() {
  const { convId } = useLocalSearchParams<{ convId: string }>();
  const { user }   = useAuth();

  const [conv,         setConv]         = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [text,         setText]         = useState('');
  const [sending,      setSending]      = useState(false);
  const [showAttach,   setShowAttach]   = useState(false);
  const [showCodeModal,setShowCodeModal]= useState(false);

  const listRef  = useRef<FlatList>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConv = useCallback(async (quiet = false) => {
    if (!convId) return;
    if (!quiet) setLoading(true);
    try {
      const { data } = await api.get(`/chat/${convId}`);
      setConv(data);
    } catch {}
    finally { if (!quiet) setLoading(false); }
  }, [convId]);

  useEffect(() => { fetchConv(); }, [fetchConv]);

  useEffect(() => {
    pollRef.current = setInterval(() => fetchConv(true), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchConv]);

  useEffect(() => {
    if (conv?.messages?.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [conv?.messages?.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      await api.post(`/chat/${convId}/message`, { text: trimmed });
      await fetchConv(true);
    } catch { setText(trimmed); }
    finally { setSending(false); }
  };

  const shareFile = async (payload: object) => {
    try {
      await api.post(`/chat/${convId}/file`, payload);
      await fetchConv(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not share file.');
    }
  };

  const handlePickDocument = async () => {
    setShowAttach(false);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (res.canceled) return;
      const asset = res.assets[0];
      await shareFile({ name: asset.name, fileType: 'document', mimeType: asset.mimeType ?? '', size: asset.size ?? 0 });
    } catch { Alert.alert('Error', 'Could not pick document.'); }
  };

  const handlePickImage = async () => {
    setShowAttach(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to share images.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled) return;
    const asset = res.assets[0];
    const name  = asset.fileName ?? `photo_${Date.now()}.jpg`;
    await shareFile({ name, fileType: 'image', size: asset.fileSize ?? 0 });
  };

  const handlePickVideo = async () => {
    setShowAttach(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to share videos.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.8 });
    if (res.canceled) return;
    const asset = res.assets[0];
    const name  = asset.fileName ?? `video_${Date.now()}.mp4`;
    await shareFile({ name, fileType: 'video', size: asset.fileSize ?? 0 });
  };

  const handleCodeSnippet = () => { setShowAttach(false); setShowCodeModal(true); };

  const submitCode = async (name: string, code: string) => {
    setShowCodeModal(false);
    await shareFile({ name, fileType: 'code', content: code, size: code.length });
  };

  const otherName = conv
    ? (user?.role === 'tutor' ? conv.student?.name ?? 'Student' : conv.tutor?.name ?? 'Tutor')
    : '';
  const otherSubject = conv?.tutor?.subjects?.[0] ?? '';

  const messages: any[] = conv?.messages ?? [];
  const grouped = groupMessages(messages);

  type FlatItem =
    | { type: 'separator'; date: string }
    | { type: 'msg'; msg: any };

  const flatData: FlatItem[] = [];
  for (const g of grouped) {
    flatData.push({ type: 'separator', date: g.date });
    for (const m of g.messages) flatData.push({ type: 'msg', msg: m });
  }

  const renderItem = ({ item }: { item: FlatItem }) => {
    if (item.type === 'separator') {
      return (
        <View style={styles.dateSep}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>{item.date}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }
    const { msg } = item;
    const isMine = String(msg.sender?._id ?? msg.sender) === String(user?.id);

    return (
      <View style={[styles.bubbleWrap, isMine && styles.bubbleWrapMine]}>
        {!isMine && (
          <Text style={styles.senderName}>{msg.sender?.name ?? otherName}</Text>
        )}
        {msg.attachment?.name ? (
          <AttachmentBubble att={msg.attachment} isMine={isMine} />
        ) : (
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{msg.text}</Text>
          </View>
        )}
        <Text style={[styles.timeText, isMine && styles.timeTextMine]}>{formatTime(msg.sentAt)}</Text>
      </View>
    );
  };

  const ATTACH_OPTIONS = [
    { icon: 'document-outline',  label: 'Upload Document / PDF', sub: 'Share files, PDFs, and documents', onPress: handlePickDocument },
    { icon: 'camera-outline',    label: 'Camera or Photos',       sub: 'Take a photo or upload from gallery', onPress: handlePickImage },
    { icon: 'code-slash-outline',label: 'Snippet / Code Block',   sub: 'Share code with syntax highlighting', onPress: handleCodeSnippet },
    { icon: 'videocam-outline',  label: 'Video File',             sub: 'Share video recordings or clips',    onPress: handlePickVideo },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={INK} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatarWrap}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {otherName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerOnlineDot} />
          </View>
          <View>
            <Text style={styles.headerName} numberOfLines={1}>
              {otherName}{user?.role === 'student' ? ' (Tutor)' : ''}
            </Text>
            {otherSubject ? (
              <Text style={styles.headerSubject} numberOfLines={1}>{otherSubject}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            hitSlop={8}
            onPress={() => router.push({ pathname: '/(tabs)/chat-files' as any, params: { convId } })}>
            <Ionicons name="folder-outline" size={22} color={INK} />
          </Pressable>
          <Pressable hitSlop={8}>
            <Ionicons name="videocam-outline" size={22} color={INK} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>

        {loading ? (
          <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={listRef}
            data={flatData}
            keyExtractor={(item, i) =>
              item.type === 'separator' ? `sep-${i}` : (item as any).msg._id ?? String(i)
            }
            renderItem={renderItem}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={48} color={MUTED} />
                <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputRow}>
          <Pressable style={styles.attachBtn} onPress={() => setShowAttach(true)}>
            <Ionicons name="add" size={22} color={TEAL} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={MUTED}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!text.trim() || sending}>
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send" size={16} color="#fff" />
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment sheet */}
      <Modal visible={showAttach} transparent animationType="slide">
        <Pressable style={styles.sheetOverlay} onPress={() => setShowAttach(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Share Attachment</Text>
            <Pressable onPress={() => setShowAttach(false)} hitSlop={8}>
              <Ionicons name="close" size={22} color={INK} />
            </Pressable>
          </View>
          {ATTACH_OPTIONS.map((opt) => (
            <Pressable
              key={opt.label}
              style={({ pressed }) => [styles.attachOption, pressed && { opacity: 0.7 }]}
              onPress={opt.onPress}>
              <View style={styles.attachOptionIcon}>
                <Ionicons name={opt.icon as any} size={22} color={TEAL} />
              </View>
              <View style={styles.attachOptionText}>
                <Text style={styles.attachOptionLabel}>{opt.label}</Text>
                <Text style={styles.attachOptionSub}>{opt.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </Pressable>
          ))}
          <View style={{ height: 24 }} />
        </View>
      </Modal>

      {/* Code snippet modal */}
      <CodeModal
        visible={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSubmit={submitCode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  headerOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: PAGE,
  },
  headerName:    { fontSize: 14, fontWeight: '800', color: INK },
  headerSubject: { fontSize: 11, color: TEAL, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 14 },

  msgList: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },

  dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 8 },
  dateLine: { flex: 1, height: 1, backgroundColor: '#E4E1D2' },
  dateText: { fontSize: 10, color: MUTED, fontWeight: '600' },

  bubbleWrap: { marginVertical: 3, maxWidth: '78%', alignSelf: 'flex-start' },
  bubbleWrapMine: { alignSelf: 'flex-end' },
  senderName: { fontSize: 10, color: MUTED, marginBottom: 2, marginLeft: 4 },

  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTheirs: {
    backgroundColor: CARD, borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  bubbleMine: { backgroundColor: TEAL, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: INK, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },

  // Attachment bubble
  attBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: '#E4E1D2', maxWidth: 240,
  },
  attBubbleMine: { backgroundColor: '#E1F4EF', borderColor: TEAL },
  attIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#F0EFE8', alignItems: 'center', justifyContent: 'center',
  },
  attIconMine: { backgroundColor: '#fff' },
  attName:     { fontSize: 12, fontWeight: '700', color: INK },
  attNameMine: { color: INK },
  attMeta:     { fontSize: 10, color: MUTED, marginTop: 2 },
  codePreview: {
    fontSize: 10, color: MUTED, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },

  timeText:     { fontSize: 9, color: MUTED, marginTop: 3, marginLeft: 4 },
  timeTextMine: { textAlign: 'right', marginLeft: 0, marginRight: 4 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, color: MUTED },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#E4E1D2',
    backgroundColor: PAGE, gap: 8,
  },
  attachBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#E1F4EF', alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: CARD,
    borderRadius: 20, borderWidth: 1, borderColor: '#E4E1D2',
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: INK, maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#B0D4D6' },

  // Attachment sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 8,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#E4E1D2',
    alignSelf: 'center', marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: INK },

  attachOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F0EFE8',
  },
  attachOptionIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#E1F4EF', alignItems: 'center', justifyContent: 'center',
  },
  attachOptionText: { flex: 1 },
  attachOptionLabel: { fontSize: 14, fontWeight: '700', color: INK },
  attachOptionSub:   { fontSize: 11, color: MUTED, marginTop: 2 },

  // Code modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle:  { fontSize: 16, fontWeight: '800', color: INK },
  modalNameInput: {
    backgroundColor: PAGE, borderRadius: 10,
    borderWidth: 1, borderColor: '#E4E1D2',
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: INK,
  },
  codeInput: {
    backgroundColor: '#1E1E2E', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 12, color: '#E0E0E0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 140, textAlignVertical: 'top',
  },
  modalBtn: {
    backgroundColor: TEAL, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
