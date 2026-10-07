import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function formatDate(date: string) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByDate(messages: any[]) {
  const groups: { date: string; messages: any[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const d = formatDate(msg.sentAt);
    if (d !== currentDate) {
      currentDate = d;
      groups.push({ date: d, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export default function ChatConversationScreen() {
  const { convId } = useLocalSearchParams<{ convId: string }>();
  const { user } = useAuth();

  const [conv,     setConv]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);

  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConv = useCallback(async (quiet = false) => {
    if (!convId) return;
    if (!quiet) setLoading(true);
    try {
      const { data } = await api.get(`/chat/${convId}`);
      setConv(data);
    } catch {
      // silently ignore poll errors
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [convId]);

  // Initial fetch
  useEffect(() => {
    fetchConv();
  }, [fetchConv]);

  // Poll every 3 s
  useEffect(() => {
    pollRef.current = setInterval(() => fetchConv(true), 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchConv]);

  // Scroll to bottom when messages change
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
    } catch {
      setText(trimmed); // restore text on failure
    } finally {
      setSending(false);
    }
  };

  const otherName = conv
    ? (user?.role === 'tutor'
        ? conv.student?.name ?? 'Student'
        : conv.tutor?.name   ?? 'Tutor')
    : '';

  const messages: any[] = conv?.messages ?? [];
  const grouped = groupByDate(messages);

  // Flatten for FlatList: date separators + messages
  const flatData: ({ type: 'separator'; date: string } | { type: 'msg'; msg: any })[] = [];
  for (const g of grouped) {
    flatData.push({ type: 'separator', date: g.date });
    for (const m of g.messages) {
      flatData.push({ type: 'msg', msg: m });
    }
  }

  const renderItem = ({ item }: { item: typeof flatData[number] }) => {
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
    const isMine =
      String(msg.sender?._id ?? msg.sender) === String(user?.id);

    return (
      <View style={[styles.bubbleWrap, isMine && styles.bubbleWrapMine]}>
        {!isMine && (
          <Text style={styles.senderName}>{msg.sender?.name ?? otherName}</Text>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
            {msg.text}
          </Text>
        </View>
        <Text style={[styles.timeText, isMine && styles.timeTextMine]}>
          {formatTime(msg.sentAt)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
          {conv && (
            <Text style={styles.headerSub}>
              {user?.role === 'tutor'
                ? 'Student'
                : (conv.tutor?.subjects?.[0] ?? 'Tutor')}
            </Text>
          )}
        </View>
      </View>

      {/* Messages */}
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
              item.type === 'separator' ? `sep-${i}` : item.msg._id ?? String(i)
            }
            renderItem={renderItem}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={MUTED}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!text.trim() || sending}>
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendIcon}>{'>'}</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
    backgroundColor: PAGE, gap: 12,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 20, color: INK, fontWeight: '700' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: INK },
  headerSub:  { fontSize: 11, color: MUTED, marginTop: 1 },

  msgList: { paddingHorizontal: 16, paddingVertical: 12, gap: 4, flexGrow: 1 },

  dateSep: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 12, gap: 8,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: '#E4E1D2' },
  dateText: { fontSize: 10, color: MUTED, fontWeight: '600' },

  bubbleWrap: { marginVertical: 3, maxWidth: '78%', alignSelf: 'flex-start' },
  bubbleWrapMine: { alignSelf: 'flex-end' },

  senderName: { fontSize: 10, color: MUTED, marginBottom: 2, marginLeft: 4 },

  bubble: {
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9,
  },
  bubbleTheirs: {
    backgroundColor: CARD,
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  bubbleMine: {
    backgroundColor: TEAL,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: INK, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },

  timeText: { fontSize: 9, color: MUTED, marginTop: 3, marginLeft: 4 },
  timeTextMine: { textAlign: 'right', marginLeft: 0, marginRight: 4 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 13, color: MUTED },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#E4E1D2',
    backgroundColor: PAGE, gap: 8,
  },
  input: {
    flex: 1, backgroundColor: CARD,
    borderRadius: 20, borderWidth: 1, borderColor: '#E4E1D2',
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: INK, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#B0D4D6' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
