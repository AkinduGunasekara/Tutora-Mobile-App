import { router } from 'expo-router';

import {

  Pressable,

  ScrollView,

  StyleSheet,

  Text,

  View,

} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';



import { useAuth } from '@/context/AuthContext';

import { Primary, Spacing } from '@/constants/theme';



// ─── Mock data ────────────────────────────────────────────────────────────────

const SUBJECTS = [

  { emoji: '💻', name: 'Programming' },

  { emoji: '📐', name: 'Mathematics' },

  { emoji: '⚗️', name: 'Chemistry' },

  { emoji: '📊', name: 'Data Science' },

  { emoji: '🔬', name: 'Physics' },

  { emoji: '📝', name: 'English' },

];



const TUTORS = [

  { name: 'Anjana G.', subject: 'Programming', rating: 4.8, sessions: 42, color: '#667EEA' },

  { name: 'Nethmi P.', subject: 'Mathematics', rating: 4.9, sessions: 38, color: '#F093FB' },

  { name: 'Kasun R.', subject: 'Physics', rating: 4.7, sessions: 31, color: '#4FACFE' },

];



// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {

  return name

    .split(' ')

    .map((w) => w[0])

    .join('')

    .slice(0, 2)

    .toUpperCase();

}



function getGreeting() {

  const h = new Date().getHours();

  if (h < 12) return 'Good morning,';

  if (h < 17) return 'Good afternoon,';

  return 'Good evening,';

}



// ─── Header ───────────────────────────────────────────────────────────────────

function HomeHeader({ name }: { name: string }) {

  return (

    <View style={styles.header}>

      <View style={styles.headerLogoRow}>

        <View style={styles.headerLogoIcon}>

          <Text style={styles.headerLogoEmoji}>🎓</Text>

        </View>

        <Text style={styles.headerLogoText}>TUTORA</Text>

      </View>

      <View style={styles.headerRight}>

        <Pressable style={styles.headerIconBtn}>

          <Text style={styles.headerIconText}>🔔</Text>

        </Pressable>

        <View style={styles.headerAvatar}>

          <Text style={styles.headerAvatarText}>{getInitials(name)}</Text>

        </View>

      </View>

    </View>

  );

}



// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {

  const { user } = useAuth();

  if (!user) {

    router.replace('/welcome');

    return null;

  }



  const firstName = user.name.split(' ')[0];

  const isStudent = user.role !== 'tutor';



  const statsStudent = [

    { label: 'Sessions', value: '0' },

    { label: 'Subjects', value: '0' },

    { label: 'Reviews', value: '0' },

  ];

  const statsTutor = [

    { label: 'Sessions', value: '0' },

    { label: 'Earnings', value: '0' },

    { label: 'Rating', value: '0' },

  ];

  const stats = isStudent ? statsStudent : statsTutor;



  return (

    <SafeAreaView style={styles.safe} edges={['top']}>

      <HomeHeader name={user.name} />

      <ScrollView

        style={styles.scroll}

        showsVerticalScrollIndicator={false}

        contentContainerStyle={styles.scrollContent}>



        {/* ── Greeting card ─────────────────────────────── */}

        <View style={styles.greetingCard}>

          <View style={styles.greetingTop}>

            <View style={styles.greetingTextWrap}>

              <Text style={styles.greetingLabel}>{getGreeting()}</Text>

              <Text style={styles.greetingName}>{firstName}! 👋</Text>

              <Text style={styles.greetingMeta}>

                {isStudent

                  ? 'Ready to learn something new today?'

                  : 'You have 0 session requests today.'}

              </Text>

            </View>

            <View style={styles.onlinePill}>

              <View style={styles.onlineDot} />

              <Text style={styles.onlineText}>Online</Text>

            </View>

          </View>

        </View>



        {/* ── Search bar ───────────────────────────────── */}

        <Pressable

          style={styles.searchBar}

          onPress={() => router.push('/(tabs)/search' as any)}>

          <Text style={styles.searchIcon}>🔍</Text>

          <Text style={styles.searchPlaceholder}>Search for tutors, subjects...</Text>

          <View style={styles.filterBtn}>

            <Text style={styles.filterIcon}>⚡</Text>

          </View>

        </Pressable>



        {/* ── Popular Subjects ─────────────────────────── */}

        <View style={styles.sectionWrap}>

          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>Popular Subjects</Text>

            <Pressable>

              <Text style={styles.seeAll}>See All</Text>

            </Pressable>

          </View>

          <ScrollView

            horizontal

            showsHorizontalScrollIndicator={false}

            contentContainerStyle={styles.subjectsRow}>

            {SUBJECTS.map((s) => (

              <Pressable key={s.name} style={styles.subjectChip}>

                <Text style={styles.subjectEmoji}>{s.emoji}</Text>

                <Text style={styles.subjectName}>{s.name}</Text>

              </Pressable>

            ))}

          </ScrollView>

        </View>



        {/* ── Quick Stats ──────────────────────────────── */}

        <View style={styles.statsCard}>

          {stats.map((s, i) => (

            <View key={s.label} style={styles.statCell}>

              {i > 0 && <View style={styles.statDivider} />}

              <View style={styles.statInner}>

                <Text style={styles.statValue}>{s.value}</Text>

                <Text style={styles.statLabel}>{s.label}</Text>

              </View>

            </View>

          ))}

        </View>



        {/* ── Top Tutors ───────────────────────────────── */}

        <View style={styles.sectionWrap}>

          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>Top Tutors</Text>

            <Pressable>

              <Text style={styles.seeAll}>View All</Text>

            </Pressable>

          </View>

          <ScrollView

            horizontal

            showsHorizontalScrollIndicator={false}

            contentContainerStyle={styles.tutorsRow}>

            {TUTORS.map((t) => (

              <View key={t.name} style={styles.tutorCard}>

                {/* Avatar */}

                <View style={[styles.tutorAvatar, { backgroundColor: t.color }]}>

                  <Text style={styles.tutorAvatarText}>{getInitials(t.name)}</Text>

                </View>

                <Text style={styles.tutorName}>{t.name}</Text>

                <Text style={styles.tutorSubject}>{t.subject}</Text>

                <Text style={styles.tutorRating}>⭐ {t.rating}</Text>

                <Text style={styles.tutorSessions}>{t.sessions} sessions</Text>

                <Pressable style={styles.bookBtn}>

                  <Text style={styles.bookBtnText}>Book →</Text>

                </Pressable>

              </View>

            ))}

          </ScrollView>

        </View>



        {/* Bottom padding for tab bar */}

        <View style={{ height: 100 }} />

      </ScrollView>

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  safe: { flex: 1, backgroundColor: '#F5F6FA' },

  scroll: { flex: 1 },

  scrollContent: { gap: Spacing.three },



  // Header

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



  // Greeting card

  greetingCard: {

    backgroundColor: '#fff',

    marginHorizontal: Spacing.three,

    marginTop: Spacing.three,

    borderRadius: 20,

    padding: Spacing.four,

    shadowColor: '#000',

    shadowOpacity: 0.05,

    shadowRadius: 10,

    shadowOffset: { width: 0, height: 3 },

    elevation: 3,

  },

  greetingTop: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',

  },

  greetingTextWrap: { flex: 1, gap: 2 },

  greetingLabel: { fontSize: 14, color: '#6B7280' },

  greetingName: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },

  greetingMeta: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  onlinePill: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

    backgroundColor: '#E0F7F5',

    borderRadius: 20,

    paddingHorizontal: 10,

    paddingVertical: 5,

    alignSelf: 'flex-start',

  },

  onlineDot: {

    width: 7,

    height: 7,

    borderRadius: 4,

    backgroundColor: '#22C55E',

  },

  onlineText: { fontSize: 11, color: Primary, fontWeight: '700' },



  // Search bar

  searchBar: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#fff',

    marginHorizontal: Spacing.three,

    borderRadius: 14,

    padding: Spacing.three,

    borderWidth: 1,

    borderColor: '#E5E7EB',

    gap: 10,

    shadowColor: '#000',

    shadowOpacity: 0.03,

    shadowRadius: 6,

    shadowOffset: { width: 0, height: 2 },

    elevation: 2,

  },

  searchIcon: { fontSize: 17 },

  searchPlaceholder: { flex: 1, fontSize: 14, color: '#9CA3AF' },

  filterBtn: {

    width: 32,

    height: 32,

    borderRadius: 10,

    backgroundColor: '#E0F7F5',

    alignItems: 'center',

    justifyContent: 'center',

  },

  filterIcon: { fontSize: 15 },



  // Sections

  sectionWrap: { marginHorizontal: Spacing.three, gap: Spacing.two },

  sectionHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },

  seeAll: { fontSize: 13, color: Primary, fontWeight: '600' },



  // Subject chips

  subjectsRow: { gap: 10, paddingRight: Spacing.three },

  subjectChip: {

    backgroundColor: '#fff',

    borderRadius: 12,

    paddingHorizontal: 14,

    paddingVertical: 12,

    alignItems: 'center',

    gap: 5,

    shadowColor: '#000',

    shadowOpacity: 0.04,

    shadowRadius: 6,

    shadowOffset: { width: 0, height: 2 },

    elevation: 2,

    minWidth: 76,

  },

  subjectEmoji: { fontSize: 28 },

  subjectName: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },



  // Stats

  statsCard: {

    flexDirection: 'row',

    backgroundColor: '#fff',

    marginHorizontal: Spacing.three,

    borderRadius: 16,

    paddingVertical: Spacing.three,

    shadowColor: '#000',

    shadowOpacity: 0.04,

    shadowRadius: 8,

    shadowOffset: { width: 0, height: 2 },

    elevation: 2,

  },

  statCell: {

    flex: 1,

    flexDirection: 'row',

    alignItems: 'stretch',

  },

  statDivider: {

    width: 1,

    backgroundColor: '#E5E7EB',

    marginVertical: 4,

  },

  statInner: { flex: 1, alignItems: 'center', gap: 2 },

  statValue: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },

  statLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center' },



  // Tutor cards

  tutorsRow: { gap: 12, paddingRight: Spacing.three },

  tutorCard: {

    backgroundColor: '#fff',

    borderRadius: 16,

    padding: Spacing.three,

    width: 140,

    gap: 4,

    alignItems: 'center',

    shadowColor: '#000',

    shadowOpacity: 0.05,

    shadowRadius: 8,

    shadowOffset: { width: 0, height: 3 },

    elevation: 3,

  },

  tutorAvatar: {

    width: 56,

    height: 56,

    borderRadius: 28,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 4,

  },

  tutorAvatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },

  tutorName: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', textAlign: 'center' },

  tutorSubject: { fontSize: 11, color: '#6B7280', textAlign: 'center' },

  tutorRating: { fontSize: 11, color: Primary, fontWeight: '700' },

  tutorSessions: { fontSize: 10, color: '#9CA3AF' },

  bookBtn: {

    marginTop: 6,

    backgroundColor: '#E0F7F5',

    borderRadius: 20,

    paddingHorizontal: 14,

    paddingVertical: 6,

  },

  bookBtnText: { color: Primary, fontSize: 12, fontWeight: '700' },

});

