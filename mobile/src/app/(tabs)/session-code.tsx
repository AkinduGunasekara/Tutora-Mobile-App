import { Ionicons } from '@expo/vector-icons';
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

const LANGUAGES = ['JS', 'Python', 'Java', 'C++', 'SQL', 'HTML'];

const MOCK_OUTPUTS: Record<string, string> = {
  JS:     '> Hello, World!\n> Process exited with code 0',
  Python: '>>> Hello, World!\n>>> [Done] exited with code=0',
  Java:   'Hello, World!\nBuild Successful',
  'C++':  'Hello, World!\n[Build OK]',
  SQL:    'Query OK, 1 row affected (0.01 sec)',
  HTML:   '<!DOCTYPE html> rendered successfully',
};

const DEFAULT_CODE: Record<string, string> = {
  JS:     'console.log("Hello, World!");',
  Python: 'print("Hello, World!")',
  Java:   'System.out.println("Hello, World!");',
  'C++':  'cout << "Hello, World!" << endl;',
  SQL:    'SELECT "Hello, World!" AS message;',
  HTML:   '<h1>Hello, World!</h1>',
};

export default function SessionCodeScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [lang,    setLang]    = useState('JS');
  const [code,    setCode]    = useState(DEFAULT_CODE['JS']);
  const [output,  setOutput]  = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const handleLangChange = (l: string) => {
    setLang(l);
    setCode(DEFAULT_CODE[l] ?? '');
    setOutput(null);
  };

  const handleRun = () => {
    setRunning(true);
    setOutput(null);
    setTimeout(() => {
      setOutput(MOCK_OUTPUTS[lang] ?? '> Done');
      setRunning(false);
    }, 800);
  };

  const handleSendToTutor = async () => {
    try {
      await api.post(`/session/${sessionId}/message`, {
        text: `[Code Snippet — ${lang}]\n${code}`,
      });
      Alert.alert('Sent!', 'Your code was sent to the tutor.');
      router.push({ pathname: '/(tabs)/session-chat' as any, params: { sessionId } });
    } catch {
      Alert.alert('Error', 'Could not send code. Please try again.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/session/${sessionId}/code`, { language: lang, code });
      Alert.alert('Saved', 'Code snapshot saved successfully.');
    } catch {
      Alert.alert('Error', 'Could not save snapshot.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>
        <Text style={styles.headerTitle}>Code Sandbox</Text>
        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Language selector */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.langRow}>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l}
              style={[styles.langChip, lang === l && styles.langChipActive]}
              onPress={() => handleLangChange(l)}>
              <Text style={[styles.langChipText, lang === l && styles.langChipTextActive]}>{l}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Editor */}
        <View style={styles.editorWrap}>
          <View style={styles.lineNumbers}>
            {code.split('\n').map((_, i) => (
              <Text key={i} style={styles.lineNumber}>{i + 1}</Text>
            ))}
          </View>
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

        {/* Run button */}
        <View style={styles.runRow}>
          <Pressable
            style={({ pressed }) => [styles.runBtn, pressed && { opacity: 0.85 }]}
            onPress={handleRun}
            disabled={running}>
            <Text style={styles.runBtnText}>{running ? 'Running...' : 'Run Code'}</Text>
          </Pressable>
        </View>

        {/* Output */}
        {output !== null && (
          <View style={styles.outputWrap}>
            <Text style={styles.outputLabel}>OUTPUT</Text>
            <View style={styles.outputBox}>
              <Text style={styles.outputText}>{output}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSendToTutor}>
            <Text style={styles.sendBtnText}>Send to Tutor</Text>
          </Pressable>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1E1E2E' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#16213E', borderBottomWidth: 1, borderBottomColor: '#2D2D44',
  },
  backIcon:    { fontSize: 20, color: '#E0E0FF', fontWeight: '600', width: 24 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#E0E0FF' },
  saveBtn:     { backgroundColor: TEAL, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  saveBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  langRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  langChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: '#3D3D5C',
    backgroundColor: '#2D2D44',
  },
  langChipActive:    { backgroundColor: TEAL, borderColor: TEAL },
  langChipText:      { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  langChipTextActive:{ color: '#fff' },

  editorWrap: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#12121E', borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2D2D44', minHeight: 200,
  },
  lineNumbers: {
    paddingTop: 14, paddingHorizontal: 8,
    backgroundColor: '#0D0D1A', minWidth: 36, alignItems: 'flex-end',
  },
  lineNumber: { fontSize: 12, color: '#4D4D6E', lineHeight: 22, fontFamily: 'monospace' },
  editor: {
    flex: 1, padding: 14, fontSize: 13,
    color: '#E0E0FF', lineHeight: 22,
    fontFamily: 'monospace', textAlignVertical: 'top',
  },

  runRow:   { paddingHorizontal: 16, paddingTop: 14 },
  runBtn:   { backgroundColor: '#22C55E', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  runBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  outputWrap:  { padding: 16, gap: 8 },
  outputLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase' },
  outputBox:   { backgroundColor: '#0D0D1A', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#2D2D44' },
  outputText:  { fontSize: 12, color: '#22C55E', fontFamily: 'monospace', lineHeight: 20 },

  actions:     { paddingHorizontal: 16, paddingTop: 8 },
  sendBtn: {
    borderWidth: 1.5, borderColor: TEAL, borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  sendBtnText: { color: TEAL, fontSize: 13, fontWeight: '700' },
});
