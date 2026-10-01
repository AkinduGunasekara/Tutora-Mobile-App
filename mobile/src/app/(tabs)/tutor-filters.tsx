import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

export default function TutorFiltersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [subject, setSubject] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('0');
  const [mode, setMode] = useState<'online' | 'in-person' | ''>('');
  const [availability, setAvailability] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/discovery/subjects');
      setSubjects(response.data.data);
    } catch (error) {
      console.error('Fetch subjects error:', error);
    }
  };

  const applyFilters = () => {
    router.setParams({
      ...params,
      subject: subject || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      minRating: minRating !== '0' ? minRating : undefined,
      mode: mode || undefined,
    });
    router.back();
  };

  const clearFilters = () => {
    setSubject('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('0');
    setMode('');
    setAvailability('');
  };

  const RatingStar = ({ rating, current }: { rating: number; current: string }) => (
    <TouchableOpacity onPress={() => setMinRating(rating.toString())}>
      <Ionicons
        name={rating <= parseInt(current) ? 'star' : 'star-outline'}
        size={28}
        color={rating <= parseInt(current) ? '#FFB800' : '#D1D5DB'}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filter Tutors</Text>
        <TouchableOpacity onPress={clearFilters}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Subject Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject</Text>
          <View style={styles.subjectContainer}>
            <TextInput
              style={styles.subjectInput}
              placeholder="Enter subject"
              value={subject}
              onChangeText={setSubject}
            />
          </View>
          <View style={styles.popularSubjects}>
            {subjects.slice(0, 6).map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[
                  styles.subjectChip,
                  subject === sub && styles.subjectChipActive,
                ]}
                onPress={() => setSubject(sub)}
              >
                <Text
                  style={[
                    styles.subjectChipText,
                    subject === sub && styles.subjectChipTextActive,
                  ]}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Range (Rs/hr)</Text>
          <View style={styles.priceContainer}>
            <View style={styles.priceInput}>
              <Text style={styles.priceLabel}>Min</Text>
              <TextInput
                style={styles.priceValue}
                placeholder="0"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.priceSeparator}>-</Text>
            <View style={styles.priceInput}>
              <Text style={styles.priceLabel}>Max</Text>
              <TextInput
                style={styles.priceValue}
                placeholder="5000"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Minimum Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimum Rating</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <RatingStar key={rating} rating={rating} current={minRating} />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {parseInt(minRating) > 0 ? `${minRating}+ stars` : 'Any rating'}
          </Text>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.daysContainer}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayChip,
                  availability === day && styles.dayChipActive,
                ]}
                onPress={() => setAvailability(availability === day ? '' : day)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    availability === day && styles.dayChipTextActive,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tutoring Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tutoring Mode</Text>
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[
                styles.modeChip,
                mode === 'online' && styles.modeChipActive,
              ]}
              onPress={() => setMode(mode === 'online' ? '' : 'online')}
            >
              <Ionicons
                name="globe-outline"
                size={20}
                color={mode === 'online' ? '#008C91' : '#6B7280'}
              />
              <Text
                style={[
                  styles.modeChipText,
                  mode === 'online' && styles.modeChipTextActive,
                ]}
              >
                Online
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeChip,
                mode === 'in-person' && styles.modeChipActive,
              ]}
              onPress={() => setMode(mode === 'in-person' ? '' : 'in-person')}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={mode === 'in-person' ? '#008C91' : '#6B7280'}
              />
              <Text
                style={[
                  styles.modeChipText,
                  mode === 'in-person' && styles.modeChipTextActive,
                ]}
              >
                In-person
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008C91',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  subjectContainer: {
    marginBottom: 12,
  },
  subjectInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A2E',
  },
  popularSubjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subjectChipActive: {
    backgroundColor: '#E8F5F5',
    borderColor: '#008C91',
  },
  subjectChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  subjectChipTextActive: {
    color: '#008C91',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '600',
  },
  priceSeparator: {
    fontSize: 18,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayChipActive: {
    backgroundColor: '#008C91',
    borderColor: '#008C91',
  },
  dayChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F6FA',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modeChipActive: {
    backgroundColor: '#E8F5F5',
    borderColor: '#008C91',
  },
  modeChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: '#008C91',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#008C91',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
