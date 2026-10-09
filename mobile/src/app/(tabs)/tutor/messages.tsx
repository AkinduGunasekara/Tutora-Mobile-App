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
        <Text style={styles.rowSub} numberOfLines={1}>
          {conv.lastMessage || 'Started a conversation'}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {conv.lastMessageAt && (
          <Text style={styles.rowTime}>{timeAgo(conv.lastMessageAt)}</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const [convs,   setConvs]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/chat');
      setConvs(data);
    } catch {
      setConvs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = convs.filter((c) =>
    (c.student?.name ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSub}>
          {convs.length} conversation{convs.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor={MUTED}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No students have messaged you yet.</Text>
            </View>
          ) : (
            filtered.map((conv) => (
              <ConvRow
                key={conv._id}
                conv={conv}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/chat-conversation' as any,
                    params: { convId: conv._id },
                  })
                }
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

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center' },
});
