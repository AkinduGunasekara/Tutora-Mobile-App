import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const PAGE = '#EFEDDC';
const INK = '#171943';
const TEAL = '#008C91';
const MUTED = '#78809A';
const CARD = '#FFFFFF';

interface Tutor {
  _id: string;
  name: string;
  bio: string;
  subjects: string[];
  qualifications: string[];
  hourlyRate: number;
  avatar?: string;
  isVerified: boolean;
  onlineSessions: boolean;
  faceToFaceSessions: boolean;
  rating?: number;
  reviewCount?: number;
  completedSessions?: number;
}

export default function TutorProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tutorId = params.id as string;

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutorProfile();
  }, [tutorId]);

  const fetchTutorProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/discovery/tutor/${tutorId}`);
      setTutor(response.data.data);
    } catch (error) {
      console.error('Fetch tutor profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToReviews = () => {
    router.push(`/tutor-reviews?id=${tutorId}`);
  };

  const navigateToAvailability = () => {
    router.push({
      pathname: '/schedule',
      params: {
        tutorId,
        tutorName: tutor?.name,
        tutorSubtitle: tutor?.subjects?.[0] ?? 'General',
        hourlyRate: String(tutor?.hourlyRate ?? 0),
        rating: String(tutor?.rating ?? 0),
        reviewCount: String(tutor?.reviewCount ?? 0),
        tutorInitials: tutor?.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      },
    });
  };

  const navigateToCustomSession = () => {
    router.push(`/request-custom-session?tutorId=${tutorId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      </SafeAreaView>
    );
  }

  if (!tutor) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Tutor not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={INK} />
          </Pressable>
          <Text style={styles.headerTitle}>Tutor Profile</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {tutor.avatar ? (
              <Image source={{ uri: tutor.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {tutor.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                </Text>
              </View>
            )}
            {tutor.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={TEAL} />
              </View>
            )}
          </View>
          <Text style={styles.tutorName}>{tutor.name}</Text>
          <Text style={styles.tutorTitle}>{tutor.isVerified ? 'Verified Tutor' : 'Tutor'}</Text>

          {/* Rating Bar */}
          <Pressable style={styles.ratingBar} onPress={navigateToReviews}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((i) => {
                const r = tutor.rating ?? 0;
                return (
                  <Ionicons key={i} name={r >= i ? 'star' : r >= i - 0.5 ? 'star-half' : 'star-outline'} size={16} color="#FFB800" />
                );
              })}
            </View>
            <Text style={styles.ratingText}>{tutor.reviewCount ? (tutor.rating ?? 0).toFixed(1) : 'New'}</Text>
            <Text style={styles.reviewCount}>({tutor.reviewCount ?? 0} reviews)</Text>
            <Ionicons name="chevron-forward" size={16} color={MUTED} />
          </Pressable>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tutor.completedSessions ?? 0}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tutor.reviewCount ? (tutor.rating ?? 0).toFixed(1) : '—'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Rs {tutor.hourlyRate}</Text>
              <Text style={styles.statLabel}>per hour</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{tutor.bio}</Text>
        </View>

        {/* Subjects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.subjectsContainer}>
            {tutor.subjects.map((subject, index) => (
              <View key={index} style={styles.subjectTag}>
                <Text style={styles.subjectTagText}>{subject}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Education & Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education & Credentials</Text>
          {tutor.qualifications.map((qual, index) => (
            <View key={index} style={styles.qualificationItem}>
              <Ionicons name="school-outline" size={20} color={TEAL} />
              <Text style={styles.qualificationText}>{qual}</Text>
            </View>
          ))}
        </View>

        {/* Session Fee */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Fee</Text>
          <View style={styles.feeContainer}>
            <Text style={styles.feeAmount}>Rs {tutor.hourlyRate}</Text>
            <Text style={styles.feePeriod}>per hour</Text>
          </View>
        </View>

        {/* Mode Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Modes</Text>
          <View style={styles.modesContainer}>
            {tutor.onlineSessions && (
              <View style={styles.modeItem}>
                <Ionicons name="globe-outline" size={20} color={TEAL} />
                <Text style={styles.modeText}>Online Sessions</Text>
              </View>
            )}
            {tutor.faceToFaceSessions && (
              <View style={styles.modeItem}>
                <Ionicons name="person-outline" size={20} color={TEAL} />
                <Text style={styles.modeText}>In-person Sessions</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={styles.primaryButton}
            onPress={navigateToAvailability}
          >
            <Text style={styles.primaryButtonText}>VIEW AVAILABILITY & BOOK</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={navigateToCustomSession}
          >
            <Text style={styles.secondaryButtonText}>REQUEST CUSTOM SESSION</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: MUTED,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E1D2',
    gap: 10,
    backgroundColor: CARD,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: INK,
    flex: 1,
    textAlign: 'center',
  },
  profileSection: {
    backgroundColor: CARD,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E1D2',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: CARD,
    fontSize: 28,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: CARD,
    borderRadius: 12,
  },
  tutorName: {
    fontSize: 24,
    fontWeight: '700',
    color: INK,
    marginBottom: 4,
  },
  tutorTitle: {
    fontSize: 14,
    color: TEAL,
    fontWeight: '600',
    marginBottom: 16,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PAGE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  reviewCount: {
    fontSize: 13,
    color: MUTED,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E4E1D2',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: INK,
  },
  statLabel: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E4E1D2',
  },
  section: {
    backgroundColor: CARD,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEBDD',
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: INK,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: MUTED,
    lineHeight: 22,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectTag: {
    backgroundColor: '#E1F4EF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  subjectTagText: {
    fontSize: 13,
    color: TEAL,
    fontWeight: '600',
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  qualificationText: {
    fontSize: 14,
    color: MUTED,
    flex: 1,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  feeAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: TEAL,
  },
  feePeriod: {
    fontSize: 14,
    color: MUTED,
  },
  modesContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeText: {
    fontSize: 14,
    color: MUTED,
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: TEAL,
    borderRadius: 23,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: CARD,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: 23,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: TEAL,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
