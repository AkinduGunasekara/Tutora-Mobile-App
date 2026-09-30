import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Primary, Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* ── Logo block ─────────────────────────────────── */}
        <View style={styles.logoBlock}>
          <View style={styles.logoIconWrap}>
            <Text style={styles.logoEmoji}>🎓</Text>
          </View>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>TUTORA</Text>
            <View style={styles.learnBadge}>
              <Text style={styles.learnText}>LEARN</Text>
            </View>
          </View>
          <Text style={styles.logoSub}>Learn with the world's best tutors</Text>
        </View>

        {/* ── Hero text ──────────────────────────────────── */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Welcome to TUTORA!</Text>
          <Text style={styles.heroSubtitle}>
            Choose your role to get started with personalized 1-on-1 tutoring.
          </Text>
        </View>

        {/* ── Role cards ─────────────────────────────────── */}
        <View style={styles.cards}>

          {/* Student card */}
          <Pressable
            style={({ pressed }) => [styles.card, styles.cardStudent, pressed && { opacity: 0.92 }]}
            onPress={() => router.push({ pathname: '/signup', params: { role: 'student' } })}>
            <View style={[styles.cardIconBox, styles.cardIconBoxActive]}>
              <Text style={styles.cardEmoji}>📖</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, styles.cardTitleActive]}>I'm a Student</Text>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>
                Find expert mentors, book sessions, and boost your skills
              </Text>
            </View>
            <View style={styles.arrowFilled}>
              <Text style={styles.arrowFilledText}>→</Text>
            </View>
          </Pressable>

          {/* Tutor card */}
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
            onPress={() => router.push({ pathname: '/signup', params: { role: 'tutor' } })}>
            <View style={styles.cardIconBox}>
              <Text style={styles.cardEmoji}>👤</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>I'm a Tutor</Text>
              <Text style={styles.cardDesc}>
                Share your knowledge, manage sessions, and earn on your schedule
              </Text>
            </View>
            <View style={styles.arrowOutline}>
              <Text style={styles.arrowOutlineText}>→</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Footer ─────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Log In</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },

  // Logo
  logoBlock: {
    alignItems: 'center',
    gap: 6,
  },
  logoIconWrap: {
    width: 72,
    height: 72,
    backgroundColor: Primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: Primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 36,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: 3,
  },
  learnBadge: {
    borderWidth: 1.5,
    borderColor: Primary,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  learnText: {
    color: Primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: Spacing.two,
  },

  // Cards
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardStudent: {
    borderColor: Primary,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBoxActive: {
    backgroundColor: '#E0F7F5',
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  cardTitleActive: {
    color: Primary,
  },
  popularBadge: {
    backgroundColor: '#E0F7F5',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  popularText: {
    color: Primary,
    fontSize: 10,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  arrowFilled: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowFilledText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  arrowOutline: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOutlineText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    color: Primary,
    fontWeight: '700',
  },
});
