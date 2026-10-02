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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

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
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFilters, setHasFilters] = useState(false);

  useEffect(() => {
    searchTutors();
  }, []);

  const searchTutors = async (filters?: any) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice);
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters?.minRating) params.append('minRating', filters.minRating);
      if (filters?.mode) params.append('mode', filters.mode);

      const response = await api.get(`/discovery/search?${params.toString()}`);
      setTutors(response.data.data);
      setHasFilters(!!filters);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchTutors();
  };

  const navigateToFilters = () => {
    router.push('/tutor-filters');
  };

  const navigateToProfile = (tutorId: string) => {
    router.push(`/tutor-profile?id=${tutorId}`);
  };

  const renderTutorCard = ({ item }: { item: Tutor }) => (
    <TouchableOpacity
      style={styles.tutorCard}
      onPress={() => navigateToProfile(item._id)}
    >
      <View style={styles.tutorHeader}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
              </Text>
            </View>
          )}
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#008C91" />
            </View>
          )}
        </View>
        <View style={styles.tutorInfo}>
          <Text style={styles.tutorName}>{item.name}</Text>
          <Text style={styles.tutorSubjects}>{item.subjects.join(', ')}</Text>
          <View style={styles.tutorMeta}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.ratingText}>4.8</Text>
            <Text style={styles.reviewCount}>(124 reviews)</Text>
          </View>
        </View>
        <Text style={styles.price}>Rs {item.hourlyRate}/hr</Text>
      </View>
      <View style={styles.tutorFooter}>
        <View style={styles.availabilityTags}>
          {item.onlineSessions && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Online</Text>
            </View>
          )}
          {item.faceToFaceSessions && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>In-person</Text>
            </View>
          )}
        </View>
        <Text style={styles.availableText}>Available today</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008C91" />
        </View>
      </SafeAreaView>
    );
  }

  if (tutors.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#78809A" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tutors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={navigateToFilters}>
            <Ionicons name="options-outline" size={24} color="#008C91" />
          </TouchableOpacity>
        </View>
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={64} color="#D1D5DB" />
          <Text style={styles.noResultsTitle}>No tutors found</Text>
          <Text style={styles.noResultsSubtitle}>
            Try adjusting your search or filters
          </Text>
          {hasFilters && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setHasFilters(false);
                searchTutors();
              }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
          <View style={styles.popularSearches}>
            <Text style={styles.popularTitle}>POPULAR SEARCHES</Text>
            <View style={styles.popularTags}>
              {['Calculus', 'Python', 'Physics', 'Linear Algebra'].map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={styles.popularTag}
                  onPress={() => {
                    setSearchQuery(subject);
                    searchTutors();
                  }}
                >
                  <Text style={styles.popularTagText}>{subject}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#78809A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tutors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={navigateToFilters}>
          <Ionicons name="options-outline" size={24} color="#008C91" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={tutors}
        renderItem={renderTutorCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
    shadowOffset: { width: 0, height: 2 },
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
    backgroundColor: '#008C91',
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
    color: '#008C91',
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
    color: '#008C91',
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
    backgroundColor: '#008C91',
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
});
