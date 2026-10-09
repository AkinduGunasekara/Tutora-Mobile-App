import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
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
  avatar?: string;
}

export default function WriteReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tutorId = params.tutorId as string;
  const sessionId = params.sessionId as string;

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const reviewTags = [
    'Clear Explanation',
    'Patient',
    'Punctual',
    'Great Material',
    'Exam-Prep',
    'Problem Solving',
  ];

  useEffect(() => {
    fetchTutor();
  }, [tutorId]);

  const fetchTutor = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/discovery/tutor/${tutorId}`);
      setTutor(response.data.data);
    } catch (error) {
      console.error('Fetch tutor error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/discovery/tutor/${tutorId}/reviews`, {
        rating,
        comment,
        tags: selectedTags,
        sessionId,
      });

      Alert.alert('Success', 'Review submitted successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Submit review error:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const RatingStar = ({ star }: { star: number }) => (
    <Pressable onPress={() => setRating(star)} hitSlop={4}>
      <Ionicons
        name={star <= rating ? 'star' : 'star-outline'}
        size={32}
        color={star <= rating ? '#FFB800' : '#D1D5DB'}
      />
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={INK} />
        </Pressable>
        <Text style={styles.headerTitle}>Rate Your Session</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tutor Info */}
        <View style={styles.tutorInfo}>
          <View style={styles.tutorAvatar}>
            {tutor?.avatar ? (
              <Image source={{ uri: tutor.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {tutor?.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.tutorDetails}>
            <Text style={styles.tutorName}>{tutor?.name}</Text>
            <Text style={styles.sessionInfo}>Session on Oct 1st</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HOW WAS YOUR SESSION?</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <RatingStar key={star} star={star} />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 5 && 'Excellent (5.0)'}
            {rating === 4 && 'Very Good (4.0)'}
            {rating === 3 && 'Good (3.0)'}
            {rating === 2 && 'Fair (2.0)'}
            {rating === 1 && 'Poor (1.0)'}
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What went well?</Text>
          <View style={styles.tagsContainer}>
            {reviewTags.map((tag) => (
              <Pressable
                key={tag}
                style={[
                  styles.tag,
                  selectedTags.includes(tag) && styles.tagActive,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Write a Review</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Share your experience with this tutor..."
            placeholderTextColor={MUTED}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={CARD} />
          ) : (
            <Text style={styles.submitButtonText}>SUBMIT REVIEW</Text>
          )}
        </Pressable>
      </View>
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
  content: {
    flex: 1,
  },
  tutorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD,
    padding: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E1D2',
  },
  tutorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: CARD,
    fontSize: 18,
    fontWeight: '700',
  },
  tutorDetails: {
    flex: 1,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '700',
    color: INK,
    marginBottom: 4,
  },
  sessionInfo: {
    fontSize: 13,
    color: MUTED,
  },
  section: {
    backgroundColor: CARD,
    padding: 20,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEBDD',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: INK,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 13,
    color: MUTED,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: PAGE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E1D2',
  },
  tagActive: {
    backgroundColor: '#E1F4EF',
    borderColor: TEAL,
  },
  tagText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
  },
  tagTextActive: {
    color: TEAL,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: PAGE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: INK,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E4E1D2',
  },
  footer: {
    padding: 20,
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: '#E4E1D2',
  },
  submitButton: {
    backgroundColor: TEAL,
    borderRadius: 23,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitButtonText: {
    color: CARD,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
