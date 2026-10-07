import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Tutor {
  _id: string;
  name: string;
  subjects: string[];
  hourlyRate: number;
  bio: string;
  avatar?: string;
  isVerified: boolean;
  onlineSessions: boolean;
  faceToFaceSessions: boolean;
  rating?: number;
  reviewCount?: number;
  availableToday?: boolean;
}

interface SearchFilters {
  subject?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  mode?: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFilters, setHasFilters] = useState(false);

  /*
   * Convert Expo Router parameters safely into strings.
   * useLocalSearchParams() can return string | string[].
   */
  const getParam = (value: string | string[] | undefined): string | undefined => {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  };

  const subjectParam = getParam(params.subject);
  const minPriceParam = getParam(params.minPrice);
  const maxPriceParam = getParam(params.maxPrice);
  const minRatingParam = getParam(params.minRating);
  const modeParam = getParam(params.mode);

  /**
   * Search tutors.
   *
   * queryOverride is important because setSearchQuery() is asynchronous.
   * This prevents searches from using the previous searchQuery value.
   */
  const searchTutors = async (
    filters?: SearchFilters,
    queryOverride?: string
  ) => {
    setLoading(true);

    try {
      const searchParams = new URLSearchParams();

      const query =
        queryOverride !== undefined ? queryOverride : searchQuery;

      const trimmedQuery = query.trim();

      if (trimmedQuery) {
        searchParams.append('searchQuery', trimmedQuery);
      }

      if (filters?.subject) {
        searchParams.append('subject', filters.subject);
      }

      if (filters?.minPrice) {
        searchParams.append('minPrice', filters.minPrice);
      }

      if (filters?.maxPrice) {
        searchParams.append('maxPrice', filters.maxPrice);
      }

      if (filters?.minRating) {
        searchParams.append('minRating', filters.minRating);
      }

      if (filters?.mode) {
        searchParams.append('mode', filters.mode);
      }

      const queryString = searchParams.toString();

      console.log('Searching with params:', queryString);

      const response = await api.get(
        `/discovery/search${queryString ? `?${queryString}` : ''}`
      );

      console.log('Search response:', response.data);

      const results = response.data?.data;

      if (Array.isArray(results)) {
        setTutors(results);
      } else {
        setTutors([]);
      }

      /*
       * Only consider actual filters as filters.
       * A normal subject search is not treated as a filter.
       */
      const filtersApplied = Boolean(
        filters?.minPrice ||
          filters?.maxPrice ||
          filters?.minRating ||
          filters?.mode
      );

      setHasFilters(filtersApplied);
    } catch (error: any) {
      console.error('Search error:', error);
      console.error('Error message:', error?.message);

      if (error?.response) {
        console.error('Error response:', error.response.data);

        // Unauthorized - logout and redirect
        if (error.response.status === 401) {
          console.warn('Token invalid, logging out');

          try {
            await logout();
          } catch (logoutError) {
            console.error('Logout error:', logoutError);
          }

          router.replace('/welcome');
          return;
        }
      } else if (error?.request) {
        console.error('No response received - network error');
      } else {
        console.error('Error setup:', error?.message);
      }

      if (
        error?.code === 'ECONNABORTED' ||
        error?.message?.toLowerCase()?.includes('timeout')
      ) {
        console.warn('Request timed out - server might be slow or unreachable');
      }

      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load search results when the screen receives URL parameters.
   *
   * Example:
   * /search?subject=Mathematics
   * /search?subject=Physics&minPrice=1000&maxPrice=5000
   */
  useEffect(() => {
    if (!user) {
      router.replace('/welcome');
      return;
    }

    const hasAnyFilterParams = Boolean(
      minPriceParam ||
        maxPriceParam ||
        minRatingParam ||
        modeParam
    );

    if (subjectParam) {
      setSearchQuery(subjectParam);

      searchTutors(
        {
          subject: subjectParam,
          minPrice: minPriceParam,
          maxPrice: maxPriceParam,
          minRating: minRatingParam,
          mode: modeParam,
        },
        subjectParam
      );

      return;
    }

    if (hasAnyFilterParams) {
      searchTutors({
        minPrice: minPriceParam,
        maxPrice: maxPriceParam,
        minRating: minRatingParam,
        mode: modeParam,
      });

      return;
    }

    searchTutors();
    // Intentionally run when route parameters/user change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    subjectParam,
    minPriceParam,
    maxPriceParam,
    minRatingParam,
    modeParam,
  ]);

  /**
   * Search button / keyboard search.
   */
  const handleSearch = () => {
    searchTutors(undefined, searchQuery);
  };

  /**
   * Navigate to filters screen.
   */
  const navigateToFilters = () => {
    router.push('/tutor-filters');
  };

  /**
   * Navigate to tutor profile.
   */
  const navigateToProfile = (tutorId: string) => {
    router.push(`/tutor-profile?id=${tutorId}`);
  };

  /**
   * Clear all filters and search results again.
   */
  const clearFilters = () => {
    setHasFilters(false);

    setSearchQuery('');

    searchTutors(
      {
        subject: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minRating: undefined,
        mode: undefined,
      },
      ''
    );
  };

  /**
   * Search a popular subject.
   *
   * queryOverride fixes the asynchronous setSearchQuery issue.
   */
  const handlePopularSearch = (subject: string) => {
    setSearchQuery(subject);
    setHasFilters(false);

    searchTutors(
      {
        subject,
      },
      subject
    );
  };

  /**
   * Generate tutor initials safely.
   */
  const getInitials = (name: string) => {
    if (!name) {
      return 'T';
    }

    return name
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  /**
   * Render individual tutor card.
   */
  const renderTutorCard = ({ item }: { item: Tutor }) => {
    const rating = item.rating ?? 0;
    const reviewCount = item.reviewCount ?? 0;

    return (
      <TouchableOpacity
        style={styles.tutorCard}
        onPress={() => navigateToProfile(item._id)}
        activeOpacity={0.8}
      >
        <View style={styles.tutorHeader}>
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image
                source={{ uri: item.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {getInitials(item.name)}
                </Text>
              </View>
            )}

            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#006666"
                />
              </View>
            )}
          </View>

          <View style={styles.tutorInfo}>
            <Text style={styles.tutorName} numberOfLines={1}>
              {item.name}
            </Text>

            <Text style={styles.tutorSubjects} numberOfLines={1}>
              {item.subjects?.length
                ? item.subjects.join(', ')
                : 'General'}
            </Text>

            <View style={styles.tutorMeta}>
              <Ionicons
                name="star"
                size={14}
                color="#FFB800"
              />

              <Text style={styles.ratingText}>
                {reviewCount > 0 ? rating.toFixed(1) : 'New'}
              </Text>

              <Text style={styles.reviewCount}>
                ({reviewCount} reviews)
              </Text>
            </View>
          </View>

          <Text style={styles.price}>
            Rs {item.hourlyRate}/hr
          </Text>
        </View>

        <View style={styles.tutorFooter}>
          <View style={styles.availabilityTags}>
            {item.onlineSessions && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  Online
                </Text>
              </View>
            )}

            {item.faceToFaceSessions && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  In-person
                </Text>
              </View>
            )}
          </View>

          {item.availableToday && (
            <Text style={styles.availableText}>
              Available today
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Loading state
   */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#006666"
          />
        </View>
      </SafeAreaView>
    );
  }

  /**
   * No results state
   */
  if (tutors.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.searchBarContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#1A1A2E"
            />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={20}
              color="#78809A"
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Search tutors..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={navigateToFilters}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={24}
              color="#006666"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.noResultsContainer}>
          <Ionicons
            name="search-outline"
            size={64}
            color="#D1D5DB"
          />

          <Text style={styles.noResultsTitle}>
            No tutors found
          </Text>

          <Text style={styles.noResultsSubtitle}>
            Try adjusting your search or filters
          </Text>

          {hasFilters && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.clearFiltersText}>
                Clear Filters
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.popularSearches}>
            <Text style={styles.popularTitle}>
              POPULAR SEARCHES
            </Text>

            <View style={styles.popularTags}>
              {[
                'Calculus',
                'Python',
                'Physics',
                'Linear Algebra',
              ].map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={styles.popularTag}
                  onPress={() => handlePopularSearch(subject)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.popularTagText}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.noResultsActions}>
            <TouchableOpacity
              style={styles.noResultsButton}
              onPress={() =>
                router.push('/(tabs)/bookings')
              }
              activeOpacity={0.8}
            >
              <Text style={styles.noResultsButtonText}>
                View Calendar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.noResultsButton,
                styles.noResultsButtonSecondary,
              ]}
              onPress={() =>
                router.push('/(tabs)/home')
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.noResultsButtonText,
                  styles.noResultsButtonTextSecondary,
                ]}
              >
                Back to Home
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Search results state
   */
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.searchBarContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#1A1A2E"
          />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#78809A"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search tutors..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={navigateToFilters}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={24}
            color="#006666"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tutors}
        renderItem={renderTutorCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          tutors.length > 0 ? (
            <View style={styles.topTutorsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>
                  TOP TUTORS
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topTutorsRow}
              >
                {tutors.slice(0, 5).map((tutor) => (
                  <TouchableOpacity
                    key={tutor._id}
                    style={styles.topTutorCard}
                    onPress={() =>
                      navigateToProfile(tutor._id)
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.topTutorAvatar}>
                      {tutor.avatar ? (
                        <Image
                          source={{ uri: tutor.avatar }}
                          style={styles.topTutorAvatarImage}
                        />
                      ) : (
                        <Text
                          style={styles.topTutorAvatarText}
                        >
                          {getInitials(tutor.name)}
                        </Text>
                      )}
                    </View>

                    {tutor.isVerified && (
                      <View
                        style={styles.topTutorVerifiedBadge}
                      >
                        <Text style={styles.verifiedText}>
                          Verified
                        </Text>
                      </View>
                    )}

                    <Text
                      style={styles.topTutorName}
                      numberOfLines={1}
                    >
                      {tutor.name}
                    </Text>

                    <Text
                      style={styles.topTutorSubject}
                      numberOfLines={1}
                    >
                      {tutor.subjects?.[0] ?? 'General'}
                    </Text>

                    <Text style={styles.topTutorRate}>
                      Rs {tutor.hourlyRate}/hr
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#F5F6FA',
  },

  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A2E',
  },

  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
  },

  list: {
    padding: 16,
    gap: 12,
  },

  tutorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  tutorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatarContainer: {
    position: 'relative',
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  avatarPlaceholder: {
    backgroundColor: '#006666',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },

  tutorInfo: {
    flex: 1,
    minWidth: 0,
  },

  tutorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  tutorSubjects: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  tutorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A2E',
  },

  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
  },

  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#006666',
  },

  tutorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  availabilityTags: {
    flexDirection: 'row',
    gap: 6,
  },

  tag: {
    backgroundColor: '#E8F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#006666',
  },

  availableText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  noResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 16,
  },

  noResultsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },

  clearFiltersButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#006666',
    borderRadius: 12,
  },

  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  popularSearches: {
    marginTop: 48,
    width: '100%',
  },

  popularTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },

  popularTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  popularTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  popularTagText: {
    fontSize: 13,
    color: '#1A1A2E',
    fontWeight: '500',
  },

  noResultsActions: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },

  noResultsButton: {
    backgroundColor: '#006666',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  noResultsButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  noResultsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  noResultsButtonTextSecondary: {
    color: '#006666',
  },

  topTutorsSection: {
    marginBottom: 16,
  },

  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
  },

  topTutorsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },

  topTutorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    width: 144,
    gap: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  topTutorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#006666',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },

  topTutorAvatarImage: {
    width: '100%',
    height: '100%',
  },

  topTutorAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  topTutorVerifiedBadge: {
    backgroundColor: '#E1F4EF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },

  verifiedText: {
    fontSize: 9,
    color: '#006666',
    fontWeight: '700',
  },

  topTutorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },

  topTutorSubject: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },

  topTutorRate: {
    fontSize: 10,
    color: '#6B7280',
  },
});