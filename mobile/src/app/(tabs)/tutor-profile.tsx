import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

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
          <ActivityIndicator size="large" color="#008C91" />
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
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tutor Profile</Text>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color="#1A1A2E" />
          </TouchableOpacity>
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
                <Ionicons name="checkmark-circle" size={20} color="#008C91" />
              </View>
            )}
          </View>
          <Text style={styles.tutorName}>{tutor.name}</Text>
          <Text style={styles.tutorTitle}>Verified Tutor</Text>

          {/* Rating Bar */}
          <TouchableOpacity style={styles.ratingBar} onPress={navigateToReviews}>
            <View style={styles.ratingStars}>
              <Ionicons name="star" size={16} color="#FFB800" />
              <Ionicons name="star" size={16} color="#FFB800" />
              <Ionicons name="star" size={16} color="#FFB800" />
              <Ionicons name="star" size={16} color="#FFB800" />
              <Ionicons name="star-half" size={16} color="#FFB800" />
            </View>
            <Text style={styles.ratingText}>4.8</Text>
            <Text style={styles.reviewCount}>(124 reviews)</Text>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>500+</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
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
              <Ionicons name="school-outline" size={20} color="#008C91" />
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
                <Ionicons name="globe-outline" size={20} color="#008C91" />
                <Text style={styles.modeText}>Online Sessions</Text>
              </View>
            )}
            {tutor.faceToFaceSessions && (
              <View style={styles.modeItem}>
                <Ionicons name="person-outline" size={20} color="#008C91" />
                <Text style={styles.modeText}>In-person Sessions</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={navigateToAvailability}
          >
            <Text style={styles.primaryButtonText}>View Availability & Book</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={navigateToCustomSession}
          >
            <Text style={styles.secondaryButtonText}>Request Custom Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
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
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    backgroundColor: '#008C91',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  tutorName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  tutorTitle: {
    fontSize: 14,
    color: '#008C91',
    fontWeight: '600',
    marginBottom: 16,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F6FA',
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
    color: '#1A1A2E',
  },
  reviewCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectTag: {
    backgroundColor: '#E8F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  subjectTagText: {
    fontSize: 13,
    color: '#008C91',
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
    color: '#4B5563',
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
    color: '#008C91',
  },
  feePeriod: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#4B5563',
  },
  actionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 12,
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#008C91',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#F5F6FA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#008C91',
    fontSize: 16,
    fontWeight: '700',
  },
});
