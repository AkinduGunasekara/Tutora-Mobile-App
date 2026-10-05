import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import TutorProfile from '@/components/tutor/TutorProfile';

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';
const CARD  = '#FFFFFF';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 80 }: { name: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

// ─── Row item ─────────────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function RowItem({
  icon,
  label,
  labelColor,
  badge,
  right,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  labelColor?: string;
  badge?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.7 }]}
      onPress={onPress}>
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon} size={18} color={TEAL} />
      </View>
      <Text style={[styles.rowLabel, labelColor ? { color: labelColor } : null]}>{label}</Text>
      {badge && (
        <View style={styles.rowBadge}>
          <Text style={styles.rowBadgeText}>{badge}</Text>
        </View>
      )}
      <View style={styles.rowRightWrap}>
        {right ?? <Ionicons name="chevron-forward" size={16} color={MUTED} />}
      </View>
    </Pressable>
  );
}

// ─── Student Profile ──────────────────────────────────────────────────────────

function StudentProfile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const joinYear = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Sep 2023';

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>TUTORA</Text>
        <Pressable
          style={styles.editHeaderBtn}
          onPress={() => router.push('/(tabs)/edit-profile')}>
          <Text style={styles.editHeaderBtnText}>Edit</Text>
        </Pressable>
      </View>

      {/* Profile hero card */}
      <View style={styles.heroCard}>
        <View style={styles.avatarWrap}>
          <Avatar name={user.name} size={80} />
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.heroName}>{user.name}</Text>
        <Text style={styles.heroSub}>
          {user.university
            ? `${user.university} · ${user.degree || 'BSc (Hons) in IT'}`
            : 'SLIIT · BSc (Hons) in IT'}
        </Text>
        <View style={styles.badgeRow}>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>STUDENT</Text>
          </View>
          <Text style={styles.memberSince}>Since {joinYear}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        {[
          { value: '12', label: 'Sessions' },
          { value: '5',  label: 'Subjects' },
          { value: '8',  label: 'Reviews' },
        ].map((s, i) => (
          <View key={s.label} style={styles.statCell}>
            {i > 0 && <View style={styles.statDivider} />}
            <View style={styles.statInner}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Goal progress */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>CURRENT GOAL</Text>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>Data Structures Exam</Text>
          <Text style={styles.goalPercent}>67%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '67%' }]} />
        </View>
        <Text style={styles.goalMeta}>4 of 6 prep modules finished</Text>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.sectionCard}>
          <RowItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => router.push('/(tabs)/edit-profile')}
          />
          <View style={styles.divider} />
          <RowItem
            icon="calendar-outline"
            label="My Bookings"
            badge="Active"
            onPress={() => router.push('/(tabs)/bookings' as any)}
          />
          <View style={styles.divider} />
          <RowItem
            icon="notifications-outline"
            label="Notifications"
            right={
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: '#E4E1D2', true: TEAL }}
                thumbColor={CARD}
              />
            }
          />
        </View>
      </View>

      {/* Sign out */}
      <View style={styles.section}>
        <View style={styles.sectionCard}>
          <RowItem
            icon="log-out-outline"
            label="Log Out"
            labelColor="#EF4444"
            onPress={() => logout()}
          />
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {user.role === 'tutor' ? <TutorProfile /> : <StudentProfile />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: PAGE },
  scroll:        { flex: 1 },
  scrollContent: { gap: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: PAGE, borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
  },
  logoText:       { fontSize: 16, fontWeight: '900', color: INK, letterSpacing: 2 },
  editHeaderBtn:  { borderWidth: 1.5, borderColor: TEAL, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5 },
  editHeaderBtnText: { fontSize: 12, fontWeight: '700', color: TEAL },

  // Avatar
  avatar: {
    borderRadius: 10, backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800' },
  avatarWrap: { position: 'relative', alignSelf: 'center' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: CARD,
  },

  // Hero card
  heroCard: {
    backgroundColor: CARD, marginHorizontal: 16,
    borderRadius: 12, padding: 20, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  heroName:    { fontSize: 20, fontWeight: '800', color: INK, marginTop: 4 },
  heroSub:     { fontSize: 12, color: MUTED, textAlign: 'center' },
  badgeRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  rolePill:    { backgroundColor: '#E1F4EF', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  rolePillText:{ color: TEAL, fontSize: 10, fontWeight: '700' },
  memberSince: { fontSize: 11, color: MUTED },
  verifiedPill:{ backgroundColor: '#E1F4EF', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedPillText: { color: TEAL, fontSize: 10, fontWeight: '700' },

  // Stats
  statsCard: {
    flexDirection: 'row', backgroundColor: CARD,
    marginHorizontal: 16, borderRadius: 12, paddingVertical: 16,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statCell:    { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
  statDivider: { width: 1, backgroundColor: '#E4E1D2', marginVertical: 4 },
  statInner:   { flex: 1, alignItems: 'center', gap: 3 },
  statValue:   { fontSize: 24, fontWeight: '800', color: INK },
  statLabel:   { fontSize: 11, color: MUTED, textAlign: 'center' },

  // Card (generic)
  card: {
    backgroundColor: CARD, marginHorizontal: 16,
    borderRadius: 12, padding: 14, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  // Goal
  goalRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalLabel:    { fontSize: 13, fontWeight: '700', color: INK, flex: 1 },
  goalPercent:  { fontSize: 13, fontWeight: '800', color: TEAL },
  progressTrack:{ height: 6, backgroundColor: '#E4E1D2', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: TEAL, borderRadius: 3 },
  goalMeta:     { fontSize: 11, color: MUTED },

  // Section wrapper
  section: { marginHorizontal: 16, gap: 10 },

  // Section card
  sectionCard: {
    backgroundColor: CARD, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  // Row items
  rowItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  rowIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#E1F4EF', alignItems: 'center', justifyContent: 'center',
  },
  rowLabel:     { flex: 1, fontSize: 13, fontWeight: '500', color: INK },
  rowBadge:     { backgroundColor: '#E1F4EF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  rowBadgeText: { color: TEAL, fontSize: 10, fontWeight: '600' },
  rowRightWrap: { alignItems: 'flex-end' },
  divider:      { height: 1, backgroundColor: '#F0EFE5', marginLeft: 58 },

  // Body text
  bodyText:  { fontSize: 13, color: INK, lineHeight: 20 },
  emptyText: { fontSize: 13, color: MUTED, fontStyle: 'italic' },

  // Bullets
  bulletRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: TEAL, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 13, color: INK, lineHeight: 20 },

  // Subject chips
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip:    { backgroundColor: '#E1F4EF', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  subjectChipText:{ color: TEAL, fontSize: 12, fontWeight: '600' },

  // Detail rows
  cardDivider:  { height: 1, backgroundColor: '#F0EFE5' },
  detailRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailLabel:  { fontSize: 12, color: MUTED },
  detailValue:  { fontSize: 12, fontWeight: '600', color: INK },
  availChip:    { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  availOn:      { backgroundColor: '#E1F4EF' },
  availOff:     { backgroundColor: '#FEE2E2' },
  availText:    { fontSize: 10, fontWeight: '700' },

  // Verification
  verifyBadge:    { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  verifyOk:       { backgroundColor: '#E1F4EF' },
  verifyPending:  { backgroundColor: '#FEF9C3' },
  verifyBadgeText:{ fontSize: 11, fontWeight: '700' },

  // Buttons
  primaryBtn: {
    backgroundColor: TEAL, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  actionRow:      { flexDirection: 'row', gap: 10 },
  halfBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E4E1D2',
    borderRadius: 10, paddingVertical: 12, alignItems: 'center',
    backgroundColor: CARD,
  },
  halfBtnText: { fontSize: 12, fontWeight: '700', color: INK },
  logoutBtn: {
    borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  logoutBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
});
