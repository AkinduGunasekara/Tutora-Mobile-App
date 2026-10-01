import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { Primary, Spacing } from '@/constants/theme';

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

  const [lang, setLang]       = useState('JS');
  const [code, setCode]       = useState(DEFAULT_CODE['JS']);
  const [output, setOutput]   = useState<string | null>(null);
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
      <View style={styles.topbar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.topbarTitle}>Code Sandbox</Text>
        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '💾 Save'}</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Language selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
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
          {/* Line numbers */}
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
            <Text style={styles.runBtnText}>{running ? '⏳ Running...' : '▶  Run Code'}</Text>
          </Pressable>
        </View>

        {/* Output panel */}
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
            <Text style={styles.sendBtnText}>📤  Send to Tutor</Text>
          </Pressable>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1E1E2E' },

  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: 12,
    backgroundColor: '#16213E', borderBottomWidth: 1, borderBottomColor: '#2D2D44',
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1.5, borderColor: '#3D3D5C',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon:    { fontSize: 16, color: '#E0E0FF' },
  topbarTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#E0E0FF' },
  saveBtn:     {
    backgroundColor: Primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  saveBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  // Language chips
  langRow: { paddingHorizontal: Spacing.three, paddingVertical: 12, gap: 8 },
  langChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#3D3D5C',
    backgroundColor: '#2D2D44',
  },
  langChipActive:    { backgroundColor: Primary, borderColor: Primary },
  langChipText:      { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  langChipTextActive:{ color: '#fff' },

  // Editor
  editorWrap: {
    flexDirection: 'row',
    marginHorizontal: Spacing.three,
    backgroundColor: '#12121E',
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2D2D44',
    minHeight: 200,
  },
  lineNumbers: {
    paddingTop: 14, paddingHorizontal: 8,
    backgroundColor: '#0D0D1A', minWidth: 36, alignItems: 'flex-end', gap: 0,
  },
  lineNumber: { fontSize: 12, color: '#4D4D6E', lineHeight: 22, fontFamily: 'monospace' },
  editor: {
    flex: 1, padding: 14, fontSize: 13,
    color: '#E0E0FF', lineHeight: 22,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },

  // Run
  runRow:   { paddingHorizontal: Spacing.three, paddingTop: 16 },
  runBtn:   {
    backgroundColor: '#22C55E', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  runBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Output
  outputWrap: { padding: Spacing.three, gap: 8 },
  outputLabel: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  outputBox: {
    backgroundColor: '#0D0D1A', borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#2D2D44',
  },
  outputText: { fontSize: 12, color: '#22C55E', fontFamily: 'monospace', lineHeight: 20 },

  // Actions
  actions: { paddingHorizontal: Spacing.three, paddingTop: 8, gap: Spacing.two },
  sendBtn: {
    borderWidth: 1.5, borderColor: Primary, borderRadius: 100,
    paddingVertical: 13, alignItems: 'center',
  },
  sendBtnText: { color: Primary, fontSize: 14, fontWeight: '700' },
});
