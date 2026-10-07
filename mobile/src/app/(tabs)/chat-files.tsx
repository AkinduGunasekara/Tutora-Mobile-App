import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

function formatSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileLabel(type: string, mimeType?: string) {
  if (type === 'image')    return 'Image';
  if (type === 'code')     return 'Code Snippet';
  if (type === 'video')    return 'Video File';
  if (mimeType?.includes('pdf')) return 'PDF Document';
  if (mimeType?.includes('word') || mimeType?.includes('doc')) return 'Word Document';
  return 'Document';
}

function FileTypeIcon({ type }: { type: string }) {
  const icon =
    type === 'image' ? 'image-outline' :
    type === 'code'  ? 'code-slash-outline' :
    type === 'video' ? 'videocam-outline' :
    'document-outline';
  const bg =
    type === 'image' ? '#FEF3C7' :
    type === 'code'  ? '#EDE9FE' :
    type === 'video' ? '#FEE2E2' :
    '#DBEAFE';
  const color =
    type === 'image' ? '#D97706' :
    type === 'code'  ? '#7C3AED' :
    type === 'video' ? '#DC2626' :
    '#2563EB';

  return (
    <View style={[styles.fileIcon, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
  );
}

export default function ChatFilesScreen() {
  const { convId } = useLocalSearchParams<{ convId: string }>();
  const { user }   = useAuth();

  const [files,    setFiles]    = useState<any[]>([]);
  const [conv,     setConv]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [uploading,setUploading]= useState(false);

  const load = async () => {
    if (!convId) return;
    setLoading(true);
    try {
      const [filesRes, convRes] = await Promise.all([
        api.get(`/chat/${convId}/files`),
        api.get(`/chat/${convId}`),
      ]);
      setFiles(filesRes.data);
      setConv(convRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [convId]);

  const shareFile = async (payload: object) => {
    setUploading(true);
    try {
      await api.post(`/chat/${convId}/file`, payload);
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (res.canceled) return;
      const asset = res.assets[0];
      await shareFile({ name: asset.name, fileType: 'document', mimeType: asset.mimeType ?? '', size: asset.size ?? 0 });
    } catch { Alert.alert('Error', 'Could not pick document.'); }
  };

  const handleUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled) return;
    const asset = res.assets[0];
    await shareFile({ name: asset.fileName ?? `photo_${Date.now()}.jpg`, fileType: 'image', size: asset.fileSize ?? 0 });
  };

  const otherName = conv
    ? (user?.role === 'tutor' ? conv.student?.name ?? 'Student' : conv.tutor?.name ?? 'Tutor')
    : '';
  const subject = conv?.tutor?.subjects?.[0] ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={INK} />
        </Pressable>
        <Text style={styles.headerTitle}>File Repository</Text>
        <View style={{ flex: 1 }} />
        <Pressable hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={22} color={INK} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Context card */}
        {subject ? (
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>{subject}</Text>
            <Text style={styles.contextSub}>Shared workspace for {otherName} &amp; You</Text>
          </View>
        ) : null}

        {/* Upload zone */}
        <View style={styles.uploadSection}>
          <Pressable
            style={({ pressed }) => [styles.uploadZone, pressed && { opacity: 0.8 }]}
            onPress={handleUploadDocument}
            disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={TEAL} />
            ) : (
              <>
                <View style={styles.uploadPlusBox}>
                  <Ionicons name="add" size={28} color={TEAL} />
                </View>
                <Text style={styles.uploadTitle}>Upload Document / PDF</Text>
                <Text style={styles.uploadSub}>Drag and drop or click to browse</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.uploadImageBtn} onPress={handleUploadImage} disabled={uploading}>
            <Ionicons name="image-outline" size={16} color={TEAL} />
            <Text style={styles.uploadImageBtnText}>Upload Image</Text>
          </Pressable>
        </View>

        {/* Files list */}
        {loading ? (
          <ActivityIndicator color={TEAL} style={{ marginTop: 24 }} />
        ) : files.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={48} color={MUTED} />
            <Text style={styles.emptyText}>No files shared yet.</Text>
            <Text style={styles.emptySub}>Files shared in this conversation appear here.</Text>
          </View>
        ) : (
          <View style={styles.filesSection}>
            <Text style={styles.filesLabel}>
              SHARED REPOSITORY FILES ({files.length})
            </Text>
            <View style={styles.filesList}>
              {files.map((f) => (
                <View key={f._id} style={styles.fileRow}>
                  <FileTypeIcon type={f.fileType} />
                  <View style={styles.fileMeta}>
                    <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                    <Text style={styles.fileInfo}>
                      {fileLabel(f.fileType, f.mimeType)}
                      {f.size ? ` • ${formatSize(f.size)}` : ''}
                    </Text>
                    {f.uploadedBy?.name ? (
                      <Text style={styles.fileUploader}>by {f.uploadedBy.name}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={styles.fileSendBtn}
                    onPress={() => router.back()}>
                    <Ionicons name="arrow-redo-outline" size={18} color={TEAL} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: PAGE },
  scroll: { padding: 16, gap: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E4E1D2', gap: 10,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: INK },

  contextCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  contextTitle: { fontSize: 16, fontWeight: '800', color: INK },
  contextSub:   { fontSize: 12, color: MUTED, marginTop: 3 },

  uploadSection: { gap: 8 },
  uploadZone: {
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 2, borderColor: '#E4E1D2', borderStyle: 'dashed',
    paddingVertical: 28, alignItems: 'center', gap: 8,
  },
  uploadPlusBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#E1F4EF', alignItems: 'center', justifyContent: 'center',
  },
  uploadTitle: { fontSize: 14, fontWeight: '700', color: INK },
  uploadSub:   { fontSize: 11, color: MUTED },
  uploadImageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
    backgroundColor: CARD, borderRadius: 10,
    borderWidth: 1, borderColor: '#E4E1D2',
  },
  uploadImageBtnText: { fontSize: 13, color: TEAL, fontWeight: '600' },

  filesSection: { gap: 10 },
  filesLabel: {
    fontSize: 10, fontWeight: '700', color: TEAL,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  filesList: {
    backgroundColor: CARD, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0EFE8',
  },
  fileIcon: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  fileMeta:     { flex: 1 },
  fileName:     { fontSize: 13, fontWeight: '700', color: INK },
  fileInfo:     { fontSize: 11, color: MUTED, marginTop: 2 },
  fileUploader: { fontSize: 10, color: MUTED, marginTop: 1 },
  fileSendBtn:  { padding: 6 },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '700', color: INK },
  emptySub:  { fontSize: 12, color: MUTED, textAlign: 'center' },
});
