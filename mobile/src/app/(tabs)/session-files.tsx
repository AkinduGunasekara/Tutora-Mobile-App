import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';
const CARD  = '#FFFFFF';

const TYPE_LABEL: Record<string, string> = {
  document: 'DOC', image: 'IMG', code: 'CODE', video: 'VID', pdf: 'PDF',
};

const MOCK_FILES = [
  { name: 'lecture_notes.pdf', type: 'pdf',      uploadedAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { name: 'exercise_set.docx', type: 'document', uploadedAt: new Date(Date.now() - 12 * 60000).toISOString() },
  { name: 'solution.js',       type: 'code',     uploadedAt: new Date(Date.now() - 20 * 60000).toISOString() },
];

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Session Files</Text>
          <Text style={styles.headerSub}>Shared Materials</Text>
        </View>
        <Pressable style={styles.uploadBtn} onPress={handleUpload}>
          <Text style={styles.uploadBtnText}>Upload</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : files.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No files shared yet</Text>
          <Text style={styles.emptySub}>Share your first file to get started</Text>
          <Pressable style={styles.emptyBtn} onPress={handleUpload}>
            <Text style={styles.emptyBtnText}>Share a file</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>SHARED MATERIALS</Text>
          {files.map((f, i) => (
            <View key={i} style={styles.fileCard}>
              <View style={styles.fileTypeTag}>
                <Text style={styles.fileTypeText}>{TYPE_LABEL[f.type] ?? 'FILE'}</Text>
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
  safe:        { flex: 1, backgroundColor: PAGE },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: PAGE, borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
  },
  backIcon:     { fontSize: 20, color: INK, fontWeight: '600', width: 24 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 15, fontWeight: '700', color: INK },
  headerSub:    { fontSize: 10, color: MUTED },
  uploadBtn: {
    borderWidth: 1.5, borderColor: TEAL, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  uploadBtnText: { fontSize: 12, color: TEAL, fontWeight: '700' },

  scroll:       { padding: 16, gap: 10 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },

  fileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.03,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  fileTypeTag: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: '#E1F4EF', alignItems: 'center', justifyContent: 'center',
  },
  fileTypeText: { fontSize: 9, fontWeight: '800', color: TEAL },
  fileInfo:     { flex: 1, gap: 2 },
  fileName:     { fontSize: 13, fontWeight: '600', color: INK },
  fileMeta:     { fontSize: 11, color: MUTED },
  downloadBtn:  { paddingHorizontal: 10, paddingVertical: 6 },
  downloadBtnText: { fontSize: 12, color: TEAL, fontWeight: '700' },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: INK },
  emptySub:   { fontSize: 12, color: MUTED, textAlign: 'center' },
  emptyBtn:   {
    marginTop: 8, backgroundColor: TEAL, borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
