import { Ionicons } from '@expo/vector-icons';
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

type Filter = 'all' | 'unread' | 'tutors';

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
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function unreadCount(conv: any, userId: string) {
  if (!conv?.messages) return 0;
  return conv.messages.filter(
    (m: any) => !m.read && String(m.sender?._id ?? m.sender) !== String(userId),
  ).length;
}

// ── Student row ────────────────────────────────────────────────────────────
function TutorRow({
  tutor, conversation, userId, onPress,
}: {
  tutor: any; conversation: any | null; userId: string; onPress: () => void;
}) {
  const hasConv  = !!conversation?.lastMessage;
  const unreads  = unreadCount(conversation, userId);
  const subject  = tutor.subjects?.[0] ?? 'Tutor';

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      onPress={onPress}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(tutor._id) }]}>
          <Text style={styles.avatarText}>{getInitials(tutor.name)}</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      {/* Content */}
      <View style={styles.rowMid}>
        <View style={styles.nameRow}>
          <Text style={styles.rowName} numberOfLines={1}>{tutor.name}</Text>
          <Text style={styles.roleTag}>(Tutor)</Text>
        </View>
        <Text style={styles.subjectTag} numberOfLines={1}>{subject}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {hasConv ? conversation.lastMessage : 'Tap to start a conversation'}
        </Text>
      </View>

      {/* Right */}
      <View style={styles.rowRight}>
        {hasConv && <Text style={styles.rowTime}>{timeAgo(conversation.lastMessageAt)}</Text>}
        {unreads > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreads}</Text>
          </View>
        ) : !hasConv ? (
          <View style={styles.newChip}>
            <Text style={styles.newChipText}>New</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// ── Tutor view row ─────────────────────────────────────────────────────────
function ConvRow({ conv, userId, onPress }: { conv: any; userId: string; onPress: () => void }) {
  const student = conv.student;
  const unreads = unreadCount(conv, userId);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      onPress={onPress}>
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(student._id) }]}>
          <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.rowMid}>
        <View style={styles.nameRow}>
          <Text style={styles.rowName} numberOfLines={1}>{student.name}</Text>
          <Text style={styles.roleTag}>(Student)</Text>
        </View>
        <Text style={styles.rowSub} numberOfLines={1}>
          {conv.lastMessage || 'Started a conversation'}
        </Text>
      </View>

      <View style={styles.rowRight}>
        {conv.lastMessageAt && (
          <Text style={styles.rowTime}>{timeAgo(conv.lastMessageAt)}</Text>
        )}
        {unreads > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreads}</Text>
          </View>
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
  const [filter,  setFilter]  = useState<Filter>('all');

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

  // Filter + search
  const filtered = items.filter((item) => {
    const name = isTutor ? item.student?.name ?? '' : item.tutor?.name ?? '';
    if (!name.toLowerCase().includes(search.toLowerCase())) return false;

    if (filter === 'unread') {
      const conv = isTutor ? item : item.conversation;
      return unreadCount(conv, user?.id ?? '') > 0;
    }
    if (filter === 'tutors') {
      // students: only show items with an existing conversation
      // tutors: show all (they're all student convs)
      return isTutor ? true : !!item.conversation;
    }
    return true;
  });

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all',    label: 'All Chats' },
    { id: 'unread', label: 'Unread' },
    { id: 'tutors', label: isTutor ? 'Students' : 'Tutors' },
  ];

  const totalUnread = items.reduce((acc, item) => {
    const conv = isTutor ? item : item.conversation;
    return acc + unreadCount(conv, user?.id ?? '');
  }, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Pressable onPress={load} hitSlop={8}>
          <Ionicons name="create-outline" size={22} color={INK} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={MUTED} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={isTutor ? 'Search students...' : 'Search tutors, subjects...'}
          placeholderTextColor={MUTED}
          value={search}
          onChangeText={setSearch}
        />
        <Ionicons name="options-outline" size={16} color={MUTED} />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            onPress={() => setFilter(f.id)}>
            <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={MUTED} />
              <Text style={styles.emptyText}>
                {filter === 'unread'
                  ? 'No unread messages'
                  : isTutor ? 'No conversations yet.' : 'No tutors found.'}
              </Text>
            </View>
          ) : isTutor ? (
            filtered.map((conv) => (
              <ConvRow
                key={conv._id}
                conv={conv}
                userId={user?.id ?? ''}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/chat-conversation' as any, params: { convId: conv._id } })
                }
              />
            ))
          ) : (
            filtered.map((item) => (
              <TutorRow
                key={item.tutor._id}
                tutor={item.tutor}
                conversation={item.conversation}
                userId={user?.id ?? ''}
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
    gap: 6,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: INK },
  headerBadge: {
    backgroundColor: TEAL, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  headerBadgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: '#E4E1D2',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchIcon:  { },
  searchInput: { flex: 1, fontSize: 13, color: INK, padding: 0 },

  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: CARD,
    borderWidth: 1.5, borderColor: '#E4E1D2',
  },
  filterChipActive: { backgroundColor: TEAL, borderColor: TEAL },
  filterChipText:   { fontSize: 12, fontWeight: '600', color: MUTED },
  filterChipTextActive: { color: '#fff' },

  list: { paddingBottom: 40, paddingTop: 4 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, marginHorizontal: 16, marginTop: 8,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },

  avatarWrap: { position: 'relative' },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: CARD,
  },

  rowMid:    { flex: 1, gap: 2 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowName:   { fontSize: 14, fontWeight: '700', color: INK, flexShrink: 1 },
  roleTag:   { fontSize: 11, color: MUTED },
  subjectTag:{ fontSize: 11, color: TEAL, fontWeight: '600' },
  rowSub:    { fontSize: 12, color: MUTED },

  rowRight:  { alignItems: 'flex-end', gap: 5, minWidth: 44 },
  rowTime:   { fontSize: 10, color: MUTED },
  unreadBadge: {
    backgroundColor: TEAL, borderRadius: 10,
    minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  newChip: {
    backgroundColor: '#E1F4EF', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  newChipText: { fontSize: 9, color: TEAL, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center' },
});
