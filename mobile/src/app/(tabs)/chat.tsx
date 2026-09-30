import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.emoji}>💬</Text>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.sub}>In-app chat coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  sub: { fontSize: 14, color: '#6B7280' },
});
