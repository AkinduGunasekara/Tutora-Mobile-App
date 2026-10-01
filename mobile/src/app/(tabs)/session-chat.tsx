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
import { Primary, Spacing } from '@/constants/theme';

const ATTACHMENT_ITEMS = [
  { emoji: '📄', label: 'Document',     type: 'document' },
  { emoji: '🖼',  label: 'Image',        type: 'image' },
  { emoji: '💻', label: 'Code Snippet', type: 'code' },
  { emoji: '🎬', label: 'Video',        type: 'video' },
  { emoji: '📑', label: 'PDF',          type: 'pdf' },
  { emoji: '📂', label: 'Files Repo',   type: 'repo' },
];

const MOCK_TUTOR_REPLIES = [
  'Thanks, I\'ll review that shortly.',
  'Great question! Let me explain...',
  'Sure, let\'s go through this step by step.',
  'I\'ve received your file. Give me a moment.',
];

function getInitials(name: string = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function SessionChatScreen() {
  const { sessionId }       = useLocalSearchParams<{ sessionId: string }>();
  const { user }            = useAuth();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText]     = useState('');
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  const listRef = useRef<FlatList>(null);

  // Bottom sheet animation
  const sheetY = useSharedValue(320);
  const backdropOp = useSharedValue(0);

  const sheetStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const backdropStyle= useAnimatedStyle(() => ({ opacity: backdropOp.value }));

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
    const load = async () => {
      try {
        const { data } = await api.get(`/session/${sessionId}`);
        setSession(data);
        setMessages(data.messages ?? []);
      } catch {}
    };
    if (sessionId) load();
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

    // Mock tutor reply after 2s
    setTimeout(() => {
      const reply = MOCK_TUTOR_REPLIES[Math.floor(Math.random() * MOCK_TUTOR_REPLIES.length)];
      setMessages((prev) => [
        ...prev,
        {
          _id:    Date.now().toString() + '_tutor',
          sender: session?.tutor ?? { name: 'Tutor' },
          text:   reply,
          sentAt: new Date().toISOString(),
        },
      ]);
      scrollToBottom();
    }, 2000);
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
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
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
          <Text style={styles.videoBtnText}>🎥</Text>
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
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>Start the conversation</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <Pressable style={styles.attachBtn} onPress={openSheet}>
            <Text style={styles.attachIcon}>📎</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
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
            <Text style={styles.sheetTitle}>Share</Text>
            <View style={styles.attachGrid}>
              {ATTACHMENT_ITEMS.map((item) => (
                <Pressable
                  key={item.type}
                  style={styles.attachItem}
                  onPress={() => handleAttachment(item)}>
                  <View style={styles.attachItemIcon}>
                    <Text style={styles.attachItemEmoji}>{item.emoji}</Text>
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
  safe: { flex: 1, backgroundColor: '#F5F6FA' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.three, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    elevation: 2,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon:        { fontSize: 16, color: '#1A1A2E' },
  tutorAvatar:     {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Primary, alignItems: 'center', justifyContent: 'center',
  },
  tutorAvatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  headerInfo:      { flex: 1, gap: 2 },
  headerName:      { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  livePill:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  liveText:        { fontSize: 11, color: '#22C55E', fontWeight: '600' },
  videoBtn:        {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E0F7F5', alignItems: 'center', justifyContent: 'center',
  },
  videoBtnText: { fontSize: 18 },

  // Messages
  msgList: { padding: Spacing.three, gap: 8, flexGrow: 1 },
  bubbleWrap:     { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  bubbleWrapMe:   { justifyContent: 'flex-end' },
  bubbleWrapThem: { justifyContent: 'flex-start' },
  smallAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
  },
  smallAvatarText: { fontSize: 9, fontWeight: '800', color: '#374151' },
  bubble:          { maxWidth: '72%', borderRadius: 18, padding: 12, gap: 4 },
  bubbleMe:        { backgroundColor: Primary, borderBottomRightRadius: 4 },
  bubbleThem:      { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleAttach:    { borderStyle: 'dashed' },
  bubbleText:      { fontSize: 14, lineHeight: 20 },
  bubbleTextMe:    { color: '#fff' },
  bubbleTextThem:  { color: '#1A1A2E' },
  bubbleTime:      { fontSize: 10, color: '#9CA3AF', alignSelf: 'flex-end' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText:  { fontSize: 14, color: '#9CA3AF' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: Spacing.three, paddingVertical: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  attachBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  attachIcon: { fontSize: 18 },
  input: {
    flex: 1, backgroundColor: '#F5F6FA', borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#1A1A2E', maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Primary, alignItems: 'center', justifyContent: 'center',
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
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, paddingHorizontal: Spacing.four, paddingTop: 12,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle:  { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  attachGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  attachItem:  { width: '30%', alignItems: 'center', gap: 6, paddingVertical: 8 },
  attachItemIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  attachItemEmoji: { fontSize: 26 },
  attachItemLabel: { fontSize: 11, color: '#374151', fontWeight: '600', textAlign: 'center' },
});
