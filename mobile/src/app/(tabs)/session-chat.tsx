import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';
const CARD  = '#FFFFFF';

const ATTACHMENT_ITEMS = [
  { label: 'Document',     type: 'document' },
  { label: 'Image',        type: 'image' },
  { label: 'Code Snippet', type: 'code' },
  { label: 'Video',        type: 'video' },
  { label: 'PDF',          type: 'pdf' },
  { label: 'Files Repo',   type: 'repo' },
];

function getInitials(name: string = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function SessionChatScreen() {
  const { sessionId }         = useLocalSearchParams<{ sessionId: string }>();
  const { user }              = useAuth();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  const listRef = useRef<FlatList>(null);

  const sheetY     = useSharedValue(320);
  const backdropOp = useSharedValue(0);

  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));

  const openSheet = () => {
    setShowAttach(true);
    sheetY.value     = withSpring(0, { damping: 16, stiffness: 130 });
    backdropOp.value = withTiming(1, { duration: 200 });
  };

  const closeSheet = () => {
    sheetY.value     = withTiming(320, { duration: 200 });
    backdropOp.value = withTiming(0, { duration: 200 });
    setTimeout(() => setShowAttach(false), 220);
  };

  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      try {
        const { data } = await api.get(`/session/${sessionId}`);
        setSession(data);
        setMessages(data.messages ?? []);
      } catch {}
    };

    load();

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/session/${sessionId}`);
        setMessages((prev) =>
          data.messages.length > prev.length ? data.messages : prev
        );
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const scrollToBottom = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    const body = text.trim();
    setText('');
    setSending(true);

    const optimistic = {
      _id:    Date.now().toString(),
      sender: { _id: user?.id, name: user?.name },
      text:   body,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    try {
      await api.post(`/session/${sessionId}/message`, { text: body });
    } catch {}

    setSending(false);
  };

  const handleAttachment = async (item: typeof ATTACHMENT_ITEMS[0]) => {
    closeSheet();
    if (item.type === 'repo') {
      router.push({ pathname: '/(tabs)/session-files' as any, params: { sessionId } });
      return;
    }
    const mockName = `${item.label}_${Date.now()}.${item.type === 'image' ? 'png' : item.type === 'code' ? 'js' : item.type}`;
    try {
      await api.post(`/session/${sessionId}/file`, { name: mockName, type: item.type });
    } catch {}
    setMessages((prev) => [
      ...prev,
      {
        _id:    Date.now().toString() + '_att',
        sender: { _id: user?.id, name: user?.name },
        text:   `[Attachment: ${mockName}]`,
        sentAt: new Date().toISOString(),
        isAttachment: true,
      },
    ]);
    scrollToBottom();
  };

  const tutorName = session?.tutor?.name ?? 'Tutor';
  const isMe = (msg: any) =>
    msg.sender?._id?.toString() === user?.id || msg.sender?.toString() === user?.id;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={INK} />
        </Pressable>
        <View style={styles.tutorAvatar}>
          <Text style={styles.tutorAvatarText}>{getInitials(tutorName)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{tutorName}</Text>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live Session</Text>
          </View>
        </View>
        <Pressable
          style={styles.videoBtn}
          onPress={() => router.push({ pathname: '/(tabs)/session-video' as any, params: { sessionId } })}>
          <Text style={styles.videoBtnText}>Video</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m._id?.toString() ?? Math.random().toString()}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          onLayout={scrollToBottom}
          renderItem={({ item }) => {
            const mine = isMe(item);
            return (
              <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
                {!mine && (
                  <View style={styles.smallAvatar}>
                    <Text style={styles.smallAvatarText}>{getInitials(item.sender?.name)}</Text>
                  </View>
                )}
                <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem, item.isAttachment && styles.bubbleAttach]}>
                  <Text style={[styles.bubbleText, mine ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.bubbleTime, mine && { color: 'rgba(255,255,255,0.6)' }]}>
                    {new Date(item.sentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Start the conversation</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <Pressable style={styles.attachBtn} onPress={openSheet}>
            <Text style={styles.attachIcon}>+</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={MUTED}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}>
            <Text style={styles.sendBtnText}>›</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment sheet */}
      {showAttach && (
        <>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={{ flex: 1 }} onPress={closeSheet} />
          </Animated.View>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>SHARE</Text>
            <View style={styles.attachGrid}>
              {ATTACHMENT_ITEMS.map((item) => (
                <Pressable
                  key={item.type}
                  style={styles.attachItem}
                  onPress={() => handleAttachment(item)}>
                  <View style={styles.attachItemIcon}>
                    <Text style={styles.attachItemInitial}>{item.label[0]}</Text>
                  </View>
                  <Text style={styles.attachItemLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
    elevation: 2,
  },
  backBtn:         { width: 28, alignItems: 'center' },
  backIcon:        { fontSize: 20, color: INK, fontWeight: '600' },
  tutorAvatar:     {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  tutorAvatarText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  headerInfo:      { flex: 1, gap: 2 },
  headerName:      { fontSize: 14, fontWeight: '700', color: INK },
  livePill:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  liveText:        { fontSize: 10, color: '#22C55E', fontWeight: '600' },
  videoBtn:        {
    borderWidth: 1.5, borderColor: TEAL, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  videoBtnText:    { fontSize: 11, color: TEAL, fontWeight: '700' },

  // Messages
  msgList:        { padding: 16, gap: 8, flexGrow: 1 },
  bubbleWrap:     { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  bubbleWrapMe:   { justifyContent: 'flex-end' },
  bubbleWrapThem: { justifyContent: 'flex-start' },
  smallAvatar: {
    width: 26, height: 26, borderRadius: 6,
    backgroundColor: '#E4E1D2', alignItems: 'center', justifyContent: 'center',
  },
  smallAvatarText: { fontSize: 8, fontWeight: '800', color: INK },
  bubble:          { maxWidth: '72%', borderRadius: 12, padding: 12, gap: 4 },
  bubbleMe:        { backgroundColor: TEAL, borderBottomRightRadius: 2 },
  bubbleThem:      { backgroundColor: CARD, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#E4E1D2' },
  bubbleAttach:    { borderStyle: 'dashed' },
  bubbleText:      { fontSize: 14, lineHeight: 20 },
  bubbleTextMe:    { color: '#fff' },
  bubbleTextThem:  { color: INK },
  bubbleTime:      { fontSize: 10, color: MUTED, alignSelf: 'flex-end' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText:  { fontSize: 13, color: MUTED },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: CARD, borderTopWidth: 1, borderTopColor: '#E4E1D2',
  },
  attachBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: PAGE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E4E1D2',
  },
  attachIcon: { fontSize: 22, color: INK, fontWeight: '400', marginTop: -2 },
  input: {
    flex: 1, backgroundColor: PAGE, borderRadius: 10,
    borderWidth: 1, borderColor: '#E4E1D2',
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: INK, maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: -2 },

  // Attachment sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 11,
    backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32, paddingHorizontal: 20, paddingTop: 12,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#E4E1D2',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle:  { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 1, marginBottom: 16 },
  attachGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  attachItem:  { width: '30%', alignItems: 'center', gap: 6, paddingVertical: 8 },
  attachItemIcon: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: PAGE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E4E1D2',
  },
  attachItemInitial: { fontSize: 20, fontWeight: '700', color: TEAL },
  attachItemLabel:   { fontSize: 10, color: INK, fontWeight: '600', textAlign: 'center' },
});
