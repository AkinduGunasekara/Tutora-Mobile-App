// Attachment tray shared by Session Details and the tutor chat.
// Prototype: files are represented by their metadata (name, type, size) stored on the Session;
// no binary upload/storage is performed.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C } from '@/components/tutor/ui';

export type AttachmentKind = 'document' | 'photo' | 'code' | 'video';

export const ATTACHMENTS: Record<AttachmentKind, {
  label: string; sub: string; icon: React.ComponentProps<typeof Ionicons>['name']; type: string;
}> = {
  document: { label: 'Document / PDF', sub: 'Slides, Sheets', icon: 'document-text-outline', type: 'pdf' },
  photo: { label: 'Camera / Photo', sub: 'Whiteboard, Notes', icon: 'image-outline', type: 'image' },
  code: { label: 'Code Snippet', sub: 'Python, Java, C++', icon: 'code-slash-outline', type: 'code' },
  video: { label: 'Video File', sub: 'Screen Recording', icon: 'videocam-outline', type: 'video' },
};

const SAMPLE_NAMES: Record<AttachmentKind, string[]> = {
  document: ['Lecture_Notes.pdf', 'Past_Paper_2025.pdf', 'Practice_Set.pdf', 'Revision_Slides.pdf'],
  photo: ['Whiteboard.jpg', 'Notes_Photo.jpg', 'Diagram.png'],
  code: ['solution.py', 'Main.java', 'example.cpp'],
  video: ['Screen_Recording.mp4', 'Walkthrough.mp4'],
};

const SIZE_RANGE: Record<AttachmentKind, [number, number]> = {
  document: [300_000, 3_000_000],
  photo: [800_000, 4_000_000],
  code: [2_000, 40_000],
  video: [8_000_000, 30_000_000],
};

// Simulated file chosen from the device
export const mockFile = (kind: AttachmentKind) => {
  const names = SAMPLE_NAMES[kind];
  const [min, max] = SIZE_RANGE[kind];
  return {
    name: names[Math.floor(Math.random() * names.length)],
    type: ATTACHMENTS[kind].type,
    size: Math.round(min + Math.random() * (max - min)),
  };
};

export const iconForType = (type: string): React.ComponentProps<typeof Ionicons>['name'] => {
  if (type === 'image') return 'image-outline';
  if (type === 'code') return 'code-slash-outline';
  if (type === 'video') return 'videocam-outline';
  return 'document-text-outline';
};

// 2×2 grid of attachment options ("ATTACHMENT TRAY")
export function AttachmentGrid({ onPick, disabled }: { onPick: (kind: AttachmentKind) => void; disabled?: boolean }) {
  return (
    <View style={styles.grid}>
      {(Object.keys(ATTACHMENTS) as AttachmentKind[]).map((kind) => {
        const a = ATTACHMENTS[kind];
        return (
          <Pressable
            key={kind}
            disabled={disabled}
            onPress={() => onPick(kind)}
            style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }, disabled && { opacity: 0.5 }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={a.icon} size={18} color={C.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label} numberOfLines={1}>{a.label}</Text>
              <Text style={styles.sub} numberOfLines={1}>{a.sub}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.lineSoft, borderRadius: 14, padding: 12, backgroundColor: C.card },
  iconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.tealSoft, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '800', color: C.ink },
  sub: { fontSize: 11, color: C.muted },
});
