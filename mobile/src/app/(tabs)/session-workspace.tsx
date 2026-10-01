import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { Primary, Spacing } from '@/constants/theme';

const TABS = ['Code', 'Files', 'Notes'] as const;
type WorkspaceTab = typeof TABS[number];

const LANGUAGES = ['JS', 'Python', 'Java', 'C++', 'SQL', 'HTML'];
const DEFAULT_CODE: Record<string, string> = {
  JS: 'console.log("Hello, World!");', Python: 'print("Hello, World!")',
  Java: 'System.out.println("Hello, World!");', 'C++': 'cout << "Hello, World!";',
  SQL: 'SELECT "Hello, World!" AS msg;', HTML: '<h1>Hello, World!</h1>',
};
const MOCK_FILES = [
  { name: 'lecture_notes.pdf', type: 'pdf',      emoji: '📑' },
  { name: 'exercise_set.docx', type: 'document', emoji: '📄' },
  { name: 'solution.js',       type: 'code',     emoji: '💻' },
];

export default function SessionWorkspaceScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('Code');
  const [lang,  setLang]   = useState('JS');
  const [code,  setCode]   = useState(DEFAULT_CODE['JS']);
  const [notes, setNotes]  = useState('');
  const [saving, setSaving]= useState(false);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if (code) await api.post(`/session/${sessionId}/code`, { language: lang, code });
      if (notes) await api.post(`/session/${sessionId}/code`, { language: 'text', code: notes });
      Alert.alert('Saved', 'All changes saved successfully.');
    } catch {
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.topbar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.topbarTitle}>Session Workspace</Text>
        <Pressable
          style={styles.endPill}
          onPress={() => router.push({ pathname: '/(tabs)/session-completed' as any, params: { sessionId } })}>
          <Text style={styles.endPillText}>🚪 End</Text>
        </Pressable>
      </View>

      {/* Tab pills */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tabPill, activeTab === t && styles.tabPillActive]}
            onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabPillText, activeTab === t && styles.tabPillTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Code tab */}
        {activeTab === 'Code' && (
          <View style={styles.tabContent}>
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.langRow}>
              {LANGUAGES.map((l) => (
                <Pressable
                  key={l}
                  style={[styles.langChip, lang === l && styles.langChipActive]}
                  onPress={() => { setLang(l); setCode(DEFAULT_CODE[l] ?? ''); }}>
                  <Text style={[styles.langChipText, lang === l && styles.langChipTextActive]}>{l}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.editorWrap}>
              <TextInput
                style={styles.editor}
                value={code}
                onChangeText={setCode}
                multiline
                spellCheck={false}
                autoCorrect={false}
                autoCapitalize="none"
                placeholderTextColor="#6B7280"
                placeholder="// Write your code here..."
              />
            </View>
          </View>
        )}

        {/* Files tab */}
        {activeTab === 'Files' && (
          <View style={styles.tabContent}>
            {MOCK_FILES.map((f, i) => (
              <View key={i} style={styles.fileCard}>
                <Text style={styles.fileEmoji}>{f.emoji}</Text>
                <Text style={styles.fileName}>{f.name}</Text>
                <Text style={styles.fileDownload}>↓</Text>
              </View>
            ))}
            <Pressable
              style={styles.uploadBtn}
              onPress={() => router.push({ pathname: '/(tabs)/session-files' as any, params: { sessionId } })}>
              <Text style={styles.uploadBtnText}>📁  Open Files Repository</Text>
            </Pressable>
          </View>
        )}

        {/* Notes tab */}
        {activeTab === 'Notes' && (
          <View style={styles.tabContent}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Write your session notes here..."
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
            />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save all button */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.saveAllBtn, (pressed || saving) && { opacity: 0.85 }]}
          onPress={handleSaveAll}
          disabled={saving}>
          <Text style={styles.saveAllBtnText}>{saving ? 'Saving...' : '💾  Save All Changes'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },

  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', elevation: 2,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
  },
  backIcon:    { fontSize: 18, color: '#1A1A2E' },
  topbarTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  endPill: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  endPillText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  tabRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.three,
    paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tabPill: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#F3F4F6', alignItems: 'center',
  },
  tabPillActive:    { backgroundColor: Primary },
  tabPillText:      { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabPillTextActive:{ color: '#fff' },

  tabContent: { padding: Spacing.three, gap: Spacing.two },

  // Code
  langRow: { gap: 8, paddingBottom: 8 },
  langChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  langChipActive:    { backgroundColor: Primary, borderColor: Primary },
  langChipText:      { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  langChipTextActive:{ color: '#fff' },
  editorWrap: {
    backgroundColor: '#12121E', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2D2D44', minHeight: 200,
  },
  editor: {
    padding: 14, fontSize: 13, color: '#E0E0FF', lineHeight: 22,
    fontFamily: 'monospace', textAlignVertical: 'top', minHeight: 200,
  },

  // Files
  fileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.03,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  fileEmoji:    { fontSize: 22 },
  fileName:     { flex: 1, fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  fileDownload: { fontSize: 18, color: Primary, fontWeight: '700' },
  uploadBtn: {
    borderWidth: 1.5, borderColor: Primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  uploadBtnText: { fontSize: 14, color: Primary, fontWeight: '700' },

  // Notes
  notesInput: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    fontSize: 14, color: '#1A1A2E', lineHeight: 22,
    minHeight: 300, borderWidth: 1, borderColor: '#E5E7EB',
    textAlignVertical: 'top',
  },

  // Bottom
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.four, paddingBottom: 24, paddingTop: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  saveAllBtn: {
    backgroundColor: Primary, borderRadius: 100,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: Primary, shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  saveAllBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
