import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';
const CARD  = '#FFFFFF';

const TABS = ['Code', 'Files', 'Notes'] as const;
type WorkspaceTab = typeof TABS[number];

const LANGUAGES = ['JS', 'Python', 'Java', 'C++', 'SQL', 'HTML'];
const DEFAULT_CODE: Record<string, string> = {
  JS: 'console.log("Hello, World!");', Python: 'print("Hello, World!")',
  Java: 'System.out.println("Hello, World!");', 'C++': 'cout << "Hello, World!";',
  SQL: 'SELECT "Hello, World!" AS msg;', HTML: '<h1>Hello, World!</h1>',
};
const MOCK_FILES = [
  { name: 'lecture_notes.pdf', type: 'pdf' },
  { name: 'exercise_set.docx', type: 'document' },
  { name: 'solution.js',       type: 'code' },
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
      if (code)  await api.post(`/session/${sessionId}/code`, { language: lang, code });
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Session Workspace</Text>
        <Pressable
          style={styles.endBtn}
          onPress={() => router.push({ pathname: '/(tabs)/session-completed' as any, params: { sessionId } })}>
          <Text style={styles.endBtnText}>End</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Code tab */}
        {activeTab === 'Code' && (
          <View style={styles.tabContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langRow}>
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
                <View style={styles.fileTag}>
                  <Text style={styles.fileTagText}>{f.type.slice(0, 3).toUpperCase()}</Text>
                </View>
                <Text style={styles.fileName}>{f.name}</Text>
                <Text style={styles.fileDownload}>↓</Text>
              </View>
            ))}
            <Pressable
              style={styles.filesRepoBtn}
              onPress={() => router.push({ pathname: '/(tabs)/session-files' as any, params: { sessionId } })}>
              <Text style={styles.filesRepoBtnText}>Open Files Repository</Text>
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
              placeholderTextColor={MUTED}
              textAlignVertical="top"
            />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.saveAllBtn, (pressed || saving) && { opacity: 0.85 }]}
          onPress={handleSaveAll}
          disabled={saving}>
          <Text style={styles.saveAllBtnText}>{saving ? 'Saving...' : 'Save All Changes'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: PAGE, borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
  },
  backIcon:    { fontSize: 20, color: INK, fontWeight: '600', width: 24 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: INK },
  endBtn: {
    borderWidth: 1.5, borderColor: '#E4E1D2', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  endBtnText: { fontSize: 12, fontWeight: '700', color: INK },

  tabRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: PAGE, alignItems: 'center',
    borderWidth: 1, borderColor: '#E4E1D2',
  },
  tabBtnActive:    { backgroundColor: TEAL, borderColor: TEAL },
  tabBtnText:      { fontSize: 12, fontWeight: '600', color: MUTED },
  tabBtnTextActive:{ color: '#fff' },

  tabContent: { padding: 16, gap: 10 },

  // Code
  langRow: { gap: 8, paddingBottom: 8 },
  langChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: '#E4E1D2', backgroundColor: CARD,
  },
  langChipActive:    { backgroundColor: TEAL, borderColor: TEAL },
  langChipText:      { fontSize: 12, color: MUTED, fontWeight: '600' },
  langChipTextActive:{ color: '#fff' },
  editorWrap: {
    backgroundColor: '#12121E', borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2D2D44', minHeight: 200,
  },
  editor: {
    padding: 14, fontSize: 13, color: '#E0E0FF', lineHeight: 22,
    fontFamily: 'monospace', textAlignVertical: 'top', minHeight: 200,
  },

  // Files
  fileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, borderRadius: 10, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.03,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  fileTag:        {
    width: 36, height: 36, borderRadius: 6,
    backgroundColor: '#E1F4EF', alignItems: 'center', justifyContent: 'center',
  },
  fileTagText:    { fontSize: 8, fontWeight: '800', color: TEAL },
  fileName:       { flex: 1, fontSize: 13, fontWeight: '600', color: INK },
  fileDownload:   { fontSize: 16, color: TEAL, fontWeight: '700' },
  filesRepoBtn: {
    borderWidth: 1.5, borderColor: TEAL, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginTop: 4,
  },
  filesRepoBtnText: { fontSize: 13, color: TEAL, fontWeight: '700' },

  // Notes
  notesInput: {
    backgroundColor: CARD, borderRadius: 10, padding: 14,
    fontSize: 13, color: INK, lineHeight: 22,
    minHeight: 300, borderWidth: 1, borderColor: '#E4E1D2',
    textAlignVertical: 'top',
  },

  // Bottom
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12,
    backgroundColor: CARD, borderTopWidth: 1, borderTopColor: '#E4E1D2',
  },
  saveAllBtn: {
    backgroundColor: TEAL, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  saveAllBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
