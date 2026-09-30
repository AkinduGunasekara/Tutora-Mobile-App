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

import { useAuth } from '@/context/AuthContext';
import { Primary, Spacing } from '@/constants/theme';

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 88 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Row item ─────────────────────────────────────────────────────────────────
function RowItem({
  icon,
  label,
  labelStyle,
  badge,
  right,
  onPress,
}: {
  icon: string;
  label: string;
  labelStyle?: object;
  badge?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.7 }]}
      onPress={onPress}>
      <View style={styles.rowIconWrap}>
        <Text style={styles.rowIcon}>{icon}</Text>
      </View>
      <Text style={[styles.rowLabel, labelStyle]}>{label}</Text>
      {badge && (
        <View style={styles.rowBadge}>
          <Text style={styles.rowBadgeText}>{badge}</Text>
        </View>
      )}
      <View style={styles.rowRightWrap}>
        {right ?? <Text style={styles.rowChevron}>›</Text>}
      </View>
    </Pressable>
  );
}

// ─── Student Profile ──────────────────────────────────────────────────────────
function StudentProfile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const joinYear = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Sep 2023';

  const userInitials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogoRow}>
          <View style={styles.headerLogoIcon}>
            <Text style={styles.headerLogoEmoji}>🎓</Text>
          </View>
          <Text style={styles.headerLogoText}>TUTORA</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerIconBtn}>
            <Text style={styles.headerIconText}>🔍</Text>
          </Pressable>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{userInitials}</Text>
          </View>
        </View>
      </View>

      {/* Profile hero card */}
      <View style={styles.profileHeroCard}>
        <View style={{ position: 'relative', alignSelf: 'center' }}>
          <Avatar name={user.name} size={88} />
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileSub}>
          {user.university
            ? `${user.university} • ${user.degree || 'BSc (Hons) in IT'}`
            : 'SLIIT • BSc (Hons) in IT'}
        </Text>
        <View style={styles.badgeRow}>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>📖 STUDENT</Text>
          </View>
          <Text style={styles.memberSince}>Member since {joinYear}</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            Active • Next session tomorrow at 4:00 PM
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsCard}>
        {[
          { value: '12', label: 'Sessions\nCompleted' },
          { value: '5', label: 'Subjects\nLearned' },
          { value: '8', label: 'Reviews\nGiven' },
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

      {/* Target goal card */}
      <View style={styles.goalCard}>
        <View style={styles.goalRow}>
          <Text style={styles.goalIcon}>🎯</Text>
          <Text style={styles.goalLabel}>Target: Data Structures Exam</Text>
          <View style={styles.goalBadge}>
            <Text style={styles.goalBadgeText}>67%</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '67%' }]} />
        </View>
        <Text style={styles.goalMeta}>4 of 6 prep modules finished</Text>
      </View>

      {/* Account & Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT & PREFERENCES</Text>
        <View style={styles.sectionCard}>
          <RowItem
            icon="👤"
            label="Edit Profile"
            onPress={() => router.push('/(tabs)/edit-profile')}
          />
          <View style={styles.divider} />
          <RowItem
            icon="📅"
            label="My Bookings"
            badge="1 Active"
            onPress={() => router.push('/(tabs)/bookings' as any)}
          />
          <View style={styles.divider} />
          <RowItem
            icon="🔔"
            label="Notifications"
            right={
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: '#E5E7EB', true: Primary }}
                thumbColor="#fff"
              />
            }
          />
        </View>
      </View>

      {/* Support & Session */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUPPORT & SESSION</Text>
        <View style={styles.sectionCard}>
          <RowItem
            icon="🚪"
            label="Log Out"
            labelStyle={styles.logoutLabel}
            onPress={() => logout()}
          />
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Tutor Profile ────────────────────────────────────────────────────────────
function TutorProfile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <SafeAreaView edges={['top']}>

        {/* Tutor header */}
        <View style={styles.tutorHeader}>
          <Text style={styles.tutorHeaderTitle}>My Profile</Text>
          <Pressable
            style={styles.editOutlineBtn}
            onPress={() => router.push('/(tabs)/edit-profile')}>
            <Text style={styles.editOutlineBtnText}>✏ EDIT</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Hero card */}
      <View style={styles.tutorHeroCard}>
        <View style={{ position: 'relative', alignSelf: 'center' }}>
          <Avatar name={user.name} size={88} />
          <View style={styles.onlineDot} />
        </View>
        {user.isVerified && (
          <View style={styles.verifiedPill}>
            <Text style={styles.verifiedPillText}>✓ VERIFIED TUTOR</Text>
          </View>
        )}
        <Text style={styles.tutorName}>{user.name}</Text>
        <Text style={styles.tutorRating}>
          ⭐ {(user as any).rating?.toFixed(1) ?? '0.0'} / 5.0 • {(user as any).reviewCount ?? 0} Reviews
        </Text>
      </View>

      {/* About me */}
      <View style={styles.tutorSection}>
        <Text style={styles.tutorSectionTitle}>ABOUT ME</Text>
        <Text style={styles.tutorSectionBody}>
          {user.bio || 'Add a bio to tell students about yourself.'}
        </Text>
      </View>

      {/* Qualifications */}
      <View style={styles.tutorSection}>
        <Text style={styles.tutorSectionTitle}>QUALIFICATIONS & EXPERIENCE</Text>
        {(user.qualifications?.length ?? 0) > 0
          ? user.qualifications!.map((q, i) => (
              <Text key={i} style={styles.bulletItem}>• {q}</Text>
            ))
          : <Text style={styles.tutorSectionEmpty}>No qualifications added yet.</Text>}
      </View>

      {/* Subjects */}
      <View style={styles.tutorSection}>
        <Text style={styles.tutorSectionTitle}>SUBJECTS I TEACH</Text>
        {(user.subjects?.length ?? 0) > 0 ? (
          <View style={styles.chipRow}>
            {user.subjects!.map((s) => (
              <View key={s} style={styles.subjectChip}>
                <Text style={styles.subjectChipText}>{s}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.tutorSectionEmpty}>No subjects added yet.</Text>
        )}
      </View>

      {/* Tutoring details */}
      <View style={styles.tutorSection}>
        <Text style={styles.tutorSectionTitle}>TUTORING DETAILS</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Hourly Rate</Text>
          <Text style={styles.detailValue}>
            {user.hourlyRate ? `Rs. ${user.hourlyRate.toLocaleString()} / hr` : 'Not set'}
          </Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Online Sessions</Text>
          <View
            style={[
              styles.availChip,
              user.onlineSessions ? styles.availOn : styles.availOff,
            ]}>
            <Text
              style={[
                styles.availText,
                { color: user.onlineSessions ? Primary : '#EF4444' },
              ]}>
              {user.onlineSessions ? 'AVAILABLE' : 'UNAVAILABLE'}
            </Text>
          </View>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Face-to-Face</Text>
          <View
            style={[
              styles.availChip,
              user.faceToFaceSessions ? styles.availOn : styles.availOff,
            ]}>
            <Text
              style={[
                styles.availText,
                { color: user.faceToFaceSessions ? Primary : '#EF4444' },
              ]}>
              {user.faceToFaceSessions ? 'AVAILABLE' : 'UNAVAILABLE'}
            </Text>
          </View>
        </View>
      </View>

      {/* Verification */}
      <View style={styles.tutorSection}>
        <Text style={styles.tutorSectionTitle}>VERIFICATION</Text>
        <View style={styles.verifyRow}>
          <Text style={styles.verifyIcon}>👤</Text>
          <Text style={styles.verifyLabel}>Identity</Text>
          <View style={[styles.verifyBadge, user.isVerified ? styles.verifyBadgeOk : styles.verifyBadgePending]}>
            <Text style={[styles.verifyBadgeText, { color: user.isVerified ? Primary : '#F59E0B' }]}>
              {user.isVerified ? '✓ Verified' : 'Pending'}
            </Text>
          </View>
        </View>
        <View style={styles.verifyDivider} />
        <View style={styles.verifyRow}>
          <Text style={styles.verifyIcon}>🎓</Text>
          <Text style={styles.verifyLabel}>Academic Credentials</Text>
          <View style={[styles.verifyBadge, user.isVerified ? styles.verifyBadgeOk : styles.verifyBadgePending]}>
            <Text style={[styles.verifyBadgeText, { color: user.isVerified ? Primary : '#F59E0B' }]}>
              {user.isVerified ? '✓ Verified' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.tutorActions}>
        <Pressable
          style={styles.actionPrimary}
          onPress={() => router.push('/(tabs)/edit-profile')}>
          <Text style={styles.actionPrimaryText}>EDIT PROFILE</Text>
        </Pressable>
        <Pressable style={styles.actionOutline} onPress={() => logout()}>
          <Text style={styles.actionOutlineText}>LOG OUT</Text>
        </Pressable>
        <View style={styles.actionRow}>
          <Pressable style={styles.actionHalf}>
            <Text style={styles.actionHalfText}>MANAGE AVAILABILITY</Text>
          </Pressable>
          <Pressable style={styles.actionHalf}>
            <Text style={styles.actionHalfText}>VIEW REVIEWS</Text>
          </Pressable>
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {user.role === 'tutor' ? <TutorProfile /> : <StudentProfile />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  scroll: { flex: 1 },

  // Shared header (student)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogoIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoEmoji: { fontSize: 16 },
  headerLogoText: { fontSize: 15, fontWeight: '900', color: '#1A1A2E', letterSpacing: 1.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerIconText: { fontSize: 17 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Avatar
  avatar: {
    backgroundColor: Primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800' },

  // Online dot
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#fff',
  },

  // Student hero card
  profileHeroCard: {
    backgroundColor: '#fff',
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    borderRadius: 20,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  profileName: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginTop: 6 },
  profileSub: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rolePill: {
    backgroundColor: '#E0F7F5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rolePillText: { color: Primary, fontSize: 11, fontWeight: '700' },
  memberSince: { fontSize: 12, color: '#9CA3AF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  statusText: { fontSize: 12, color: '#6B7280' },

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statCell: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
  statDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  statInner: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center', lineHeight: 16 },

  // Goal card
  goalCard: {
    backgroundColor: '#fff',
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalIcon: { fontSize: 18 },
  goalLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  goalBadge: {
    backgroundColor: '#E0F7F5',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  goalBadgeText: { color: Primary, fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: Primary,
    borderRadius: 4,
  },
  goalMeta: { fontSize: 12, color: '#6B7280' },

  // Section list
  section: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    gap: 12,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIcon: { fontSize: 17 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A2E' },
  logoutLabel: { color: '#EF4444', fontWeight: '600' },
  rowBadge: {
    backgroundColor: '#E0F7F5',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rowBadgeText: { color: Primary, fontSize: 11, fontWeight: '600' },
  rowRightWrap: { alignItems: 'flex-end' },
  rowChevron: { fontSize: 22, color: '#C4C4C4' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 60 },

  // Tutor header
  tutorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: '#F5F6FA',
  },
  tutorHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  editOutlineBtn: {
    borderWidth: 1.5,
    borderColor: Primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editOutlineBtnText: { color: Primary, fontSize: 12, fontWeight: '700' },

  // Tutor hero card
  tutorHeroCard: {
    backgroundColor: '#fff',
    marginHorizontal: Spacing.three,
    borderRadius: 20,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  verifiedPill: {
    backgroundColor: '#E0F7F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  verifiedPillText: { color: Primary, fontSize: 11, fontWeight: '700' },
  tutorName: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  tutorRating: { fontSize: 13, color: '#6B7280' },

  // Tutor sections
  tutorSection: {
    backgroundColor: '#fff',
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tutorSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tutorSectionBody: { fontSize: 14, color: '#374151', lineHeight: 22 },
  tutorSectionEmpty: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
  bulletItem: { fontSize: 14, color: '#374151', lineHeight: 22 },

  // Subject chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip: {
    backgroundColor: '#E0F7F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subjectChipText: { color: Primary, fontSize: 13, fontWeight: '600' },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailDivider: { height: 1, backgroundColor: '#F3F4F6' },
  detailLabel: { fontSize: 14, color: '#374151' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  availChip: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  availOn: { backgroundColor: '#E0F7F5' },
  availOff: { backgroundColor: '#FEE2E2' },
  availText: { fontSize: 11, fontWeight: '700' },

  // Verification rows
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  verifyDivider: { height: 1, backgroundColor: '#F3F4F6' },
  verifyIcon: { fontSize: 18 },
  verifyLabel: { flex: 1, fontSize: 14, color: '#374151' },
  verifyBadge: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  verifyBadgeOk: { backgroundColor: '#E0F7F5' },
  verifyBadgePending: { backgroundColor: '#FEF9C3' },
  verifyBadgeText: { fontSize: 12, fontWeight: '700' },

  // Tutor action buttons
  tutorActions: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  actionPrimary: {
    backgroundColor: Primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  actionPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  actionOutline: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  actionOutlineText: { color: '#374151', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  actionRow: { flexDirection: 'row', gap: Spacing.two },
  actionHalf: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionHalfText: { color: '#374151', fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textAlign: 'center' },
});
