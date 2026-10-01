import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { Primary, Spacing } from '@/constants/theme';

const TYPE_EMOJI: Record<string, string> = {
  document: '📄', image: '🖼', code: '💻', video: '🎬', pdf: '📑',
};

const MOCK_FILES = [
  { name: 'lecture_notes.pdf', type: 'pdf',      uploadedAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { name: 'exercise_set.docx', type: 'document', uploadedAt: new Date(Date.now() - 12 * 60000).toISOString() },
  { name: 'solution.js',       type: 'code',     uploadedAt: new Date(Date.now() - 20 * 60000).toISOString() },
];

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} d ago`;
}

export default function SessionFilesScreen() {
  const { sessionId }     = useLocalSearchParams<{ sessionId: string }>();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    try {
      const { data } = await api.get(`/session/${sessionId}`);
      const serverFiles = data.files ?? [];
      // Merge mock files for demo richness if empty
      setFiles(serverFiles.length > 0 ? serverFiles : MOCK_FILES);
    } catch {
      setFiles(MOCK_FILES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (sessionId) loadFiles(); }, [sessionId]);

  const handleUpload = async () => {
    const mockName = `file_${Date.now()}.pdf`;
    try {
      await api.post(`/session/${sessionId}/file`, { name: mockName, type: 'pdf' });
      await loadFiles();
    } catch {
      Alert.alert('Upload failed', 'Could not upload file. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.topbar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Session Files</Text>
          <Text style={styles.topbarSub}>Shared Materials</Text>
        </View>
        <Pressable style={styles.uploadBtn} onPress={handleUpload}>
          <Text style={styles.uploadBtnText}>Upload +</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Primary} />
        </View>
      ) : files.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📁</Text>
          <Text style={styles.emptyTitle}>No files shared yet</Text>
          <Text style={styles.emptySub}>Share your first file to get started</Text>
          <Pressable style={styles.emptyBtn} onPress={handleUpload}>
            <Text style={styles.emptyBtnText}>Share your first file →</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>SHARED MATERIALS</Text>
          {files.map((f, i) => (
            <View key={i} style={styles.fileCard}>
              <View style={styles.fileIconWrap}>
                <Text style={styles.fileIcon}>{TYPE_EMOJI[f.type] ?? '📄'}</Text>
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                <Text style={styles.fileMeta}>{relativeTime(f.uploadedAt)}</Text>
              </View>
              <Pressable
                style={styles.downloadBtn}
                onPress={() => Alert.alert('Download', `Downloading ${f.name}...`)}>
                <Text style={styles.downloadBtnText}>Download</Text>
              </Pressable>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', elevation: 2,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon:     { fontSize: 18, color: '#1A1A2E' },
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarTitle:  { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  topbarSub:    { fontSize: 11, color: '#6B7280' },
  uploadBtn: {
    borderWidth: 1.5, borderColor: Primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  uploadBtnText: { fontSize: 13, color: Primary, fontWeight: '700' },

  scroll:       { padding: Spacing.three, gap: Spacing.two },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4,
  },

  fileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  fileIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center',
  },
  fileIcon:    { fontSize: 22 },
  fileInfo:    { flex: 1, gap: 2 },
  fileName:    { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  fileMeta:    { fontSize: 11, color: '#9CA3AF' },
  downloadBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  downloadBtnText: { fontSize: 12, color: Primary, fontWeight: '700' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyEmoji:{ fontSize: 56 },
  emptyTitle:{ fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  emptySub:  { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  emptyBtn:  {
    marginTop: 8, backgroundColor: Primary, borderRadius: 100,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
