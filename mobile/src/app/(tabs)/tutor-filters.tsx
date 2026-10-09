import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
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
    router.replace({
      pathname: '/(tabs)/search',
      params: {
        subject: subject || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating !== '0' ? minRating : undefined,
        mode: mode || undefined,
      },
    });
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
    <Pressable onPress={() => setMinRating(rating.toString())} hitSlop={4}>
      <Ionicons
        name={rating <= parseInt(current) ? 'star' : 'star-outline'}
        size={28}
        color={rating <= parseInt(current) ? '#FFB800' : '#D1D5DB'}
      />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={INK} />
        </Pressable>
        <Text style={styles.headerTitle}>Filter Tutors</Text>
        <Pressable onPress={clearFilters} hitSlop={8}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Subject Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject</Text>
          <View style={styles.subjectContainer}>
            <TextInput
              style={styles.subjectInput}
              placeholder="Enter subject"
              placeholderTextColor={MUTED}
              value={subject}
              onChangeText={setSubject}
            />
          </View>
          <View style={styles.popularSubjects}>
            {subjects.slice(0, 6).map((sub) => (
              <Pressable
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
              </Pressable>
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
                placeholderTextColor={MUTED}
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
                placeholderTextColor={MUTED}
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
              <Pressable
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
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tutoring Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tutoring Mode</Text>
          <View style={styles.modeContainer}>
            <Pressable
              style={[
                styles.modeChip,
                mode === 'online' && styles.modeChipActive,
              ]}
              onPress={() => setMode(mode === 'online' ? '' : 'online')}
            >
              <Ionicons
                name="globe-outline"
                size={20}
                color={mode === 'online' ? TEAL : MUTED}
              />
              <Text
                style={[
                  styles.modeChipText,
                  mode === 'online' && styles.modeChipTextActive,
                ]}
              >
                Online
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeChip,
                mode === 'in-person' && styles.modeChipActive,
              ]}
              onPress={() => setMode(mode === 'in-person' ? '' : 'in-person')}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={mode === 'in-person' ? TEAL : MUTED}
              />
              <Text
                style={[
                  styles.modeChipText,
                  mode === 'in-person' && styles.modeChipTextActive,
                ]}
              >
                In-person
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.applyButton} onPress={applyFilters}>
          <Text style={styles.applyButtonText}>APPLY FILTERS</Text>
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
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEAL,
    width: 22,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEBDD',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: INK,
    marginBottom: 12,
  },
  subjectContainer: {
    marginBottom: 12,
  },
  subjectInput: {
    backgroundColor: PAGE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: INK,
    borderWidth: 1,
    borderColor: '#E4E1D2',
  },
  popularSubjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    backgroundColor: PAGE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E1D2',
  },
  subjectChipActive: {
    backgroundColor: '#E1F4EF',
    borderColor: TEAL,
  },
  subjectChipText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
  },
  subjectChipTextActive: {
    color: TEAL,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: PAGE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E4E1D2',
  },
  priceLabel: {
    fontSize: 11,
    color: MUTED,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    color: INK,
    fontWeight: '600',
  },
  priceSeparator: {
    fontSize: 18,
    color: MUTED,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingText: {
    fontSize: 13,
    color: MUTED,
    marginTop: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PAGE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E1D2',
  },
  dayChipActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  dayChipText: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '600',
  },
  dayChipTextActive: {
    color: CARD,
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
    backgroundColor: PAGE,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E1D2',
  },
  modeChipActive: {
    backgroundColor: '#E1F4EF',
    borderColor: TEAL,
  },
  modeChipText: {
    fontSize: 14,
    color: MUTED,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: TEAL,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E4E1D2',
    backgroundColor: CARD,
  },
  applyButton: {
    backgroundColor: TEAL,
    borderRadius: 23,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  applyButtonText: {
    color: CARD,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
