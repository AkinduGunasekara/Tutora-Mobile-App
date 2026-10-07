import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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

const AVATAR_COLORS = ['#667EEA', '#F093FB', '#4FACFE', '#43E97B', '#FA709A', '#FDB863'];

function avatarColor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(date: string | null) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Student row ────────────────────────────────────────────────────────────
function TutorRow({
  tutor, conversation, onPress,
}: {
  tutor: any;
  conversation: any | null;
  onPress: () => void;
}) {
  const hasMsg   = !!conversation?.lastMessage;
  const unread   = conversation?.messages?.some(
    (m: any) => !m.read && m.sender !== conversation?.student,
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: avatarColor(tutor._id) }]}>
        <Text style={styles.avatarText}>{getInitials(tutor.name)}</Text>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.rowName} numberOfLines={1}>{tutor.name}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {hasMsg ? conversation.lastMessage : (tutor.subjects?.[0] ?? 'Tutor')}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {hasMsg && (
          <Text style={styles.rowTime}>{timeAgo(conversation.lastMessageAt)}</Text>
        )}
        {unread && <View style={styles.unreadDot} />}
        {!hasMsg && (
          <View style={styles.newChip}>
            <Text style={styles.newChipText}>Message</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ── Tutor row (for tutor's view) ───────────────────────────────────────────
function ConvRow({ conv, onPress }: { conv: any; onPress: () => void }) {
  const student = conv.student;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: avatarColor(student._id) }]}>
        <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.rowName} numberOfLines={1}>{student.name}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>{conv.lastMessage || 'Started a conversation'}</Text>
      </View>
      <View style={styles.rowRight}>
        {conv.lastMessageAt && (
          <Text style={styles.rowTime}>{timeAgo(conv.lastMessageAt)}</Text>
        )}
      </View>
    </Pressable>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { user } = useAuth();
  const isTutor  = user?.role === 'tutor';

  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/chat');
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openConversation = async (tutorId: string, convId?: string) => {
    if (convId) {
      router.push({ pathname: '/(tabs)/chat-conversation' as any, params: { convId } });
      return;
    }
    try {
      const { data } = await api.post('/chat', { tutorId });
      router.push({ pathname: '/(tabs)/chat-conversation' as any, params: { convId: data._id } });
    } catch {
      router.push({ pathname: '/(tabs)/chat-conversation' as any, params: { tutorId } });
    }
  };

  const openTutorConv = (convId: string) => {
    router.push({ pathname: '/(tabs)/chat-conversation' as any, params: { convId } });
  };

  // Filter
  const filtered = items.filter((item) => {
    const name = isTutor
      ? item.student?.name ?? ''
      : item.tutor?.name ?? '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {isTutor && (
          <Text style={styles.headerSub}>{items.length} conversation{items.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder={isTutor ? 'Search students...' : 'Search tutors...'}
          placeholderTextColor={MUTED}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>

          {!isTutor && (
            <Text style={styles.sectionLabel}>ALL TUTORS</Text>
          )}

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {isTutor ? 'No students have messaged you yet.' : 'No tutors found.'}
              </Text>
            </View>
          ) : isTutor ? (
            filtered.map((conv) => (
              <ConvRow
                key={conv._id}
                conv={conv}
                onPress={() => openTutorConv(conv._id)}
              />
            ))
          ) : (
            filtered.map((item) => (
              <TutorRow
                key={item.tutor._id}
                tutor={item.tutor}
                conversation={item.conversation}
                onPress={() => openConversation(item.tutor._id, item.conversation?._id)}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },

  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: INK },
  headerSub:   { fontSize: 11, color: MUTED, fontWeight: '600' },

  searchWrap: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
  },
  searchInput: {
    backgroundColor: CARD, borderRadius: 10,
    borderWidth: 1, borderColor: '#E4E1D2',
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 13, color: INK,
  },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 1, textTransform: 'uppercase',
    marginTop: 16, marginBottom: 4, marginHorizontal: 16,
  },

  list: { paddingBottom: 40 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, marginHorizontal: 16, marginTop: 10,
    borderRadius: 12, padding: 12, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  rowMid: { flex: 1, gap: 3 },
  rowName: { fontSize: 13, fontWeight: '700', color: INK },
  rowSub:  { fontSize: 11, color: MUTED },

  rowRight: { alignItems: 'flex-end', gap: 6 },
  rowTime:  { fontSize: 10, color: MUTED },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL,
  },
  newChip: {
    backgroundColor: TEAL, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  newChipText: { fontSize: 9, color: '#fff', fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center' },
});
