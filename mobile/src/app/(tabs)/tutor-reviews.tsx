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

interface Review {
  _id: string;
  rating: number;
  comment: string;
  student: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  tags?: string[];
}

interface ReviewsData {
  reviews: Review[];
  averageRating: string;
  totalReviews: number;
  distribution: { [key: string]: number };
}

export default function TutorReviewsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tutorId = params.id as string;

  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [tutorId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/discovery/tutor/${tutorId}/reviews`);
      setReviewsData(response.data.data);
    } catch (error) {
      console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRatingBar = (star: number) => {
    const count = reviewsData?.distribution[star] || 0;
    const percentage = reviewsData?.totalReviews
      ? (count / reviewsData.totalReviews) * 100
      : 0;

    return (
      <View key={star} style={styles.ratingBarRow}>
        <Text style={styles.ratingBarLabel}>{star} star</Text>
        <View style={styles.ratingBarTrack}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006666" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push(`/tutor-profile?id=${tutorId}`)}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ratings & Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryLeft}>
            <Text style={styles.averageRating}>
              {reviewsData?.averageRating || '0.0'}
            </Text>
            <View style={styles.summaryStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={
                    star <= Math.round(parseFloat(reviewsData?.averageRating || '0'))
                      ? 'star'
                      : 'star-outline'
                  }
                  size={16}
                  color="#FFB800"
                />
              ))}
            </View>
            <Text style={styles.totalReviews}>
              {reviewsData?.totalReviews || 0} reviews
            </Text>
          </View>
          <View style={styles.summaryRight}>
            {[5, 4, 3, 2, 1].map((star) => renderRatingBar(star))}
          </View>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsTitle}>Student Reviews</Text>
          {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
            reviewsData.reviews.map((review) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    {review.student.avatar ? (
                      <Image
                        source={{ uri: review.student.avatar }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                          {review.student.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{review.student.name}</Text>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={14}
                          color="#FFB800"
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                {review.tags && review.tags.length > 0 && (
                  <View style={styles.reviewTags}>
                    {review.tags.map((tag, index) => (
                      <View key={index} style={styles.reviewTag}>
                        <Text style={styles.reviewTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noReviews}>
              <Text style={styles.noReviewsText}>No reviews yet</Text>
            </View>
          )}
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
  content: {
    flex: 1,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  summaryStars: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 4,
  },
  totalReviews: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryRight: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ratingBarLabel: {
    fontSize: 12,
    color: '#6B7280',
    width: 40,
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFB800',
    borderRadius: 3,
  },
  ratingBarCount: {
    fontSize: 12,
    color: '#6B7280',
    width: 24,
    textAlign: 'right',
  },
  reviewsSection: {
    padding: 20,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: '#006666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewTag: {
    backgroundColor: '#E8F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewTagText: {
    fontSize: 11,
    color: '#006666',
    fontWeight: '600',
  },
  noReviews: {
    padding: 40,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
