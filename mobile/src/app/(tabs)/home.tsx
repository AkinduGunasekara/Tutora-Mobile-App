import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

// ─── Design tokens ────────────────────────────────────────────────────────────

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';
const CARD  = '#FFFFFF';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tutor {
  _id: string;
  name: string;
  bio?: string;
  subjects?: string[];
  hourlyRate?: number;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  avatar?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { name: 'Programming' },
  { name: 'Mathematics' },
  { name: 'Chemistry' },
  { name: 'Data Science' },
  { name: 'Physics' },
  { name: 'English' },
];

const AVATAR_COLORS = ['#667EEA', '#F093FB', '#4FACFE', '#43E97B', '#FA709A', '#FDB863'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function avatarColor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuth();

  const [tutors,        setTutors]        = useState<Tutor[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [pendingCount,  setPendingCount]  = useState(0);

  const fetchData = useCallback(async () => {
    api.get<Tutor[]>('/auth/tutors')
      .then((res) => setTutors(res.data))
      .catch((err) => console.warn('fetchTutors error:', err?.response?.status, err?.message))
      .finally(() => { setLoading(false); setRefreshing(false); });

    api.get('/bookings')
      .then((res) => {
        const all = res.data.bookings ?? [];
        setPendingCount(all.filter((b: any) => b.status === 'pending').length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (!user) {
    router.replace('/welcome');
    return null;
  }

  const firstName = user.name.split(' ')[0];
  const isStudent = user.role !== 'tutor';

  function handleBook(tutor: Tutor) {
    router.push({
      pathname: '/(tabs)/schedule' as any,
      params: {
        tutorId:       tutor._id,
        tutorName:     tutor.name,
        tutorSubtitle: tutor.subjects?.[0] ?? 'General',
        rating:        String(tutor.rating ?? 0),
        reviewCount:   String(tutor.reviewCount ?? 0),
        hourlyRate:    String(tutor.hourlyRate ?? 0),
        tutorInitials: getInitials(tutor.name),
        subject:       tutor.subjects?.[0] ?? 'General',
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>TUTORA</Text>
        </View>
        <Pressable
          style={styles.headerRight}
          onPress={() => router.push('/(tabs)/profile' as any)}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{getInitials(user.name)}</Text>
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} />}>

        {/* ── Greeting ──────────────────────────────────────── */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingLabel}>{getGreeting()}</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
            <Text style={styles.greetingMeta}>
              {isStudent ? 'Ready to learn something new?' : 'Manage your sessions below.'}
            </Text>
          </View>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        {/* ── Search ────────────────────────────────────────── */}
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search' as any)}>
          <Text style={styles.searchPlaceholder}>Search for tutors or subjects...</Text>
        </Pressable>

        {/* ── Tutor pending banner ──────────────────────────── */}
        {!isStudent && pendingCount > 0 && (
          <Pressable
            style={styles.pendingBanner}
            onPress={() => router.push('/(tabs)/bookings' as any)}>
            <Text style={styles.pendingBannerText}>
              {pendingCount} new session request{pendingCount > 1 ? 's' : ''} awaiting your response
            </Text>
            <Text style={styles.pendingBannerArrow}>View →</Text>
          </Pressable>
        )}

        {/* ── Browse by Subject ──────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>BROWSE BY SUBJECT</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subjectsRow}>
            {SUBJECTS.map((s) => (
              <Pressable
                key={s.name}
                style={styles.subjectChip}
                onPress={() => router.push({
                  pathname: '/(tabs)/search' as any,
                  params: { subject: s.name },
                })}>
                <Text style={styles.subjectName}>{s.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Top Tutors ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>TOP TUTORS</Text>
            <Pressable onPress={() => router.push('/(tabs)/search' as any)}>
              <Text style={styles.seeAll}>View All</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={TEAL} style={{ marginTop: 24 }} />
          ) : tutors.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No tutors yet</Text>
              <Text style={styles.emptyMeta}>Check back soon — tutors are joining!</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tutorsRow}>
              {tutors.map((t) => (
                <View key={t._id} style={styles.tutorCard}>
                  <View style={[styles.tutorAvatar, { backgroundColor: avatarColor(t._id) }]}>
                    <Text style={styles.tutorAvatarText}>{getInitials(t.name)}</Text>
                  </View>
                  {t.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                  <Text style={styles.tutorName} numberOfLines={1}>{t.name}</Text>
                  <Text style={styles.tutorSubject} numberOfLines={1}>
                    {t.subjects?.[0] ?? 'General'}
                  </Text>
                  {(t.rating ?? 0) > 0 && (
                    <Text style={styles.tutorRating}>★ {t.rating!.toFixed(1)}</Text>
                  )}
                  {t.hourlyRate !== undefined && (
                    <Text style={styles.tutorRate}>LKR {t.hourlyRate}/hr</Text>
                  )}
                  <Pressable
                    style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => handleBook(t)}>
                    <Text style={styles.bookBtnText}>Book</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: PAGE },
  scroll:        { flex: 1 },
  scrollContent: { gap: 16, paddingBottom: 16 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: PAGE, borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
  },
  logoText: { fontSize: 16, fontWeight: '900', color: INK, letterSpacing: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Greeting card
  greetingCard: {
    backgroundColor: CARD, marginHorizontal: 16, marginTop: 16,
    borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  greetingLeft:  { flex: 1, gap: 3 },
  greetingLabel: { fontSize: 12, color: MUTED },
  greetingName:  { fontSize: 22, fontWeight: '800', color: INK },
  greetingMeta:  { fontSize: 12, color: MUTED, marginTop: 2 },
  onlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E1F4EF', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start',
  },
  onlineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  onlineText: { fontSize: 10, color: TEAL, fontWeight: '700' },

  // Search bar
  searchBar: {
    backgroundColor: CARD, marginHorizontal: 16,
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#E4E1D2',
  },
  searchPlaceholder: { fontSize: 13, color: MUTED },

  // Sections
  section:       { marginHorizontal: 16, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel:  { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 1 },
  seeAll:        { fontSize: 12, color: TEAL, fontWeight: '700' },

  // Subject chips
  subjectsRow: { gap: 8, paddingRight: 4 },
  subjectChip: {
    backgroundColor: CARD, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E4E1D2',
  },
  subjectName: { fontSize: 12, fontWeight: '600', color: INK },

  // Tutor cards
  tutorsRow: { gap: 12, paddingRight: 4 },
  tutorCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 14,
    width: 144, gap: 4, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  tutorAvatar: {
    width: 52, height: 52, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  tutorAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  verifiedBadge: {
    backgroundColor: '#E1F4EF', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  verifiedText:  { fontSize: 9, color: TEAL, fontWeight: '700' },
  tutorName:     { fontSize: 13, fontWeight: '700', color: INK, textAlign: 'center' },
  tutorSubject:  { fontSize: 11, color: MUTED, textAlign: 'center' },
  tutorRating:   { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  tutorRate:     { fontSize: 10, color: MUTED },
  bookBtn: {
    marginTop: 6, backgroundColor: TEAL, borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 8, alignSelf: 'stretch', alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: INK },
  emptyMeta:  { fontSize: 12, color: MUTED, textAlign: 'center' },

  // Pending banner
  pendingBanner: {
    marginHorizontal: 16,
    backgroundColor: '#FEF3C7', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#F59E0B',
  },
  pendingBannerText:  { fontSize: 12, color: '#92400E', fontWeight: '600', flex: 1 },
  pendingBannerArrow: { fontSize: 12, color: '#92400E', fontWeight: '800' },
});
