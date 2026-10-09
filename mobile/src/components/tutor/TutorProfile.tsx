// Tutor "My Profile" (Hi-Fi). Profile data comes from the logged-in User; rating from Reviews.
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { C, Card, Divider, LinkText, OutlineButton, PersonAvatar, Pill, PrimaryButton, TabHeader, s } from '@/components/tutor/ui';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { tutorApi } from '@/lib/tutorApi';
import { money } from '@/lib/tutorFormat';

const go = (path: string) => () => router.push(path as any);

export default function TutorProfile() {
  const { user, logout, updateUser } = useAuth();
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);

  useFocusEffect(useCallback(() => {
    tutorApi.reviews(1).then((r) => setRating({ average: r.average, count: r.count })).catch(() => {});
    // Pick up profile changes (e.g. verification) made elsewhere
    api.get('/auth/me').then(({ data }) => updateUser(data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  if (!user) return null;
  const verified = !!user.isVerified;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <TabHeader
        title="My Profile"
        right={(
          <Pressable onPress={go('/(tabs)/edit-profile')} style={styles.editPill} accessibilityRole="button">
            <Ionicons name="pencil-outline" size={13} color={C.teal} />
            <Text style={styles.editPillText}>EDIT</Text>
          </Pressable>
        )}
      />
      <View style={s.scroll}>
        {/* Hero */}
        <Card style={styles.hero}>
          <PersonAvatar size={80} label="AVATAR" />
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={styles.name}>{user.name}</Text>
            <Pill
              label={verified ? 'VERIFIED TUTOR' : 'VERIFICATION PENDING'}
              tone={verified ? 'outline' : 'warn'}
              icon={verified ? 'checkmark' : 'time-outline'}
            />
            <Divider />
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={15} color={C.star} />
              <Text style={styles.ratingValue}>{rating?.count ? rating.average.toFixed(1) : '—'}</Text>
              <Text style={styles.muted}>/ 5.0</Text>
              <Text style={styles.muted}>•</Text>
              <LinkText
                label={`${rating?.count ?? 0} Review${rating?.count === 1 ? '' : 's'}`}
                onPress={go('/(tabs)/tutor/reviews')}
                style={{ fontSize: 13, textTransform: 'none' }}
              />
            </View>
          </View>
        </Card>

        <Section title="ABOUT ME">
          <Text style={styles.body}>{user.bio || 'Add a bio to tell students about yourself.'}</Text>
        </Section>

        <Section title="QUALIFICATIONS & EXPERIENCE">
          {(user.qualifications?.length ?? 0) > 0
            ? user.qualifications!.map((q, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.body}>{q}</Text>
              </View>
            ))
            : <Text style={styles.empty}>No qualifications added yet.</Text>}
        </Section>

        <Section title="SUBJECTS I TEACH">
          {(user.subjects?.length ?? 0) > 0 ? (
            <View style={styles.chips}>
              {user.subjects!.map((sub) => (
                <View key={sub} style={styles.chip}><Text style={styles.chipText}>{sub}</Text></View>
              ))}
            </View>
          ) : <Text style={styles.empty}>No subjects added yet.</Text>}
        </Section>

        <Section title="TUTORING DETAILS">
          <DetailRow label="Hourly Rate">
            <Text style={styles.rate}>{user.hourlyRate ? `${money(user.hourlyRate)} / hr` : 'Not set'}</Text>
          </DetailRow>
          <Divider />
          <DetailRow label="Online Sessions"><Avail on={!!user.onlineSessions} /></DetailRow>
          <Divider />
          <DetailRow label="Face-to-Face Sessions"><Avail on={!!user.faceToFaceSessions} /></DetailRow>
        </Section>

        <Section title="VERIFICATION">
          <VerifyRow icon="person-outline" label="Identity" verified={verified} />
          <VerifyRow icon="school-outline" label="Academic Credentials" verified={verified} />
        </Section>

        <PrimaryButton label="Edit Profile" onPress={go('/(tabs)/edit-profile')} />
        <PrimaryButton label="Log Out" onPress={() => logout()} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <OutlineButton label="Manage Availability" compact small style={{ flex: 1 }} onPress={go('/(tabs)/tutor/availability')} />
          <OutlineButton label="View Reviews" compact small style={{ flex: 1 }} onPress={go('/(tabs)/tutor/reviews')} />
        </View>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ gap: 10 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Divider />
      {children}
    </Card>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Avail({ on }: { on: boolean }) {
  return <Pill label={on ? 'AVAILABLE' : 'UNAVAILABLE'} tone={on ? 'outline' : 'muted'} small />;
}

function VerifyRow({ icon, label, verified }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; verified: boolean }) {
  return (
    <View style={styles.detailRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon} size={16} color={C.teal} />
        <Text style={styles.verifyLabel}>{label}</Text>
      </View>
      <Text style={[styles.verifyValue, !verified && { color: C.warn }]}>{verified ? '[✓ Verified]' : '[Pending]'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  editPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: C.teal, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  editPillText: { fontSize: 12, fontWeight: '800', color: C.teal },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  name: { fontSize: 20, fontWeight: '800', color: C.ink },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingValue: { fontSize: 14, fontWeight: '800', color: C.ink },
  muted: { fontSize: 13, color: C.muted },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.ink, letterSpacing: 0.4 },
  body: { fontSize: 14, color: C.ink, lineHeight: 21, flexShrink: 1 },
  empty: { fontSize: 13, color: C.muted, fontStyle: 'italic' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.card },
  chipText: { fontSize: 13, color: C.ink },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  detailLabel: { fontSize: 14, color: C.muted },
  rate: { fontSize: 14, fontWeight: '800', color: C.teal },
  verifyLabel: { fontSize: 14, color: C.ink },
  verifyValue: { fontSize: 13, fontWeight: '700', color: C.teal },
});
