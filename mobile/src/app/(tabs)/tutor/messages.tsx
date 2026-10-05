// Tutor Messages tab: one conversation per session (reuses Session messages).
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, Card, EmptyState, ErrorState, InitialsBadge, Loading, Pill, TabHeader, s } from '@/components/tutor/ui';
import { Conversation, errorMessage, tutorApi } from '@/lib/tutorApi';
import { isoShort } from '@/lib/tutorFormat';

const timeOf = (iso: string) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : isoShort(iso);
};

export default function MessagesScreen() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setItems((await tutorApi.conversations()).items);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your messages.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <TabHeader title="Messages" subtitle="Session chats with your students" />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.teal} />}>
        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations yet"
            text="A chat opens with each student as soon as you accept their session."
          />
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {items.map((c, i) => (
              <Pressable
                key={c.sessionId}
                onPress={() => router.push({ pathname: '/(tabs)/tutor/chat' as any, params: { sessionId: c.sessionId, bookingId: c.bookingId } })}
                style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && { backgroundColor: '#F7F7F3' }]}>
                <InitialsBadge initials={c.student.initials} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.top}>
                    <Text style={styles.name} numberOfLines={1}>{c.student.name}</Text>
                    <Text style={styles.time}>{timeOf(c.lastActivity)}</Text>
                  </View>
                  <Text style={styles.subject} numberOfLines={1}>{c.subject}</Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {c.lastMessage ? `${c.lastMessage.mine ? 'You: ' : ''}${c.lastMessage.text}` : 'Say hello to start the conversation'}
                  </Text>
                </View>
                {c.sessionStatus === 'active' && <Pill label="LIVE" tone="solid" small />}
              </Pressable>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '800', color: C.ink },
  time: { fontSize: 11, color: C.muted },
  subject: { fontSize: 12, fontWeight: '600', color: C.teal },
  preview: { fontSize: 13, color: C.muted },
});
