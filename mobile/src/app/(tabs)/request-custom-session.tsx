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
  hourlyRate: number;
  avatar?: string;
}

export default function RequestCustomSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tutorId = params.tutorId as string;

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [subject, setSubject] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [description, setDescription] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [learningObjective, setLearningObjective] = useState('');
  const [preferredFormat, setPreferredFormat] = useState<'Online' | 'In-Person'>('Online');

  useEffect(() => {
    fetchTutor();
  }, [tutorId]);

  const fetchTutor = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/discovery/tutor/${tutorId}`);
      setTutor(response.data.data);
      setEstimatedBudget(response.data.data.hourlyRate.toString());
    } catch (error) {
      console.error('Fetch tutor error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject || !preferredDate || !preferredTime || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/discovery/custom-session', {
        tutorId,
        subject,
        preferredDate,
        preferredTime,
        duration: parseFloat(duration),
        description,
        estimatedBudget: parseFloat(estimatedBudget),
        academicLevel,
        learningObjective,
        preferredFormat,
      });

      router.push({
        pathname: '/(tabs)/request-sent',
        params: {
          tutorName: tutor?.name,
          subject,
          preferredDate,
          preferredTime,
          duration,
          estimatedBudget,
        },
      });
    } catch (error) {
      console.error('Submit request error:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={INK} />
        </Pressable>
        <Text style={styles.headerTitle}>Request Custom Session</Text>
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
            <View style={styles.tutorRating}>
              <Ionicons name="star" size={16} color="#FFB800" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.formSection}>
            <Text style={styles.label}>Subject/Topic</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Data Structures in Python"
              placeholderTextColor={MUTED}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Preferred Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={MUTED}
              value={preferredDate}
              onChangeText={setPreferredDate}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Preferred Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 10:00 AM"
              placeholderTextColor={MUTED}
              value={preferredTime}
              onChangeText={setPreferredTime}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Duration (Hours)</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor={MUTED}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Academic Level</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2nd Year Undergraduate"
              placeholderTextColor={MUTED}
              value={academicLevel}
              onChangeText={setAcademicLevel}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Preferred Format</Text>
            <View style={styles.formatRow}>
              {(['Online', 'In-Person'] as const).map((f) => (
                <Pressable
                  key={f}
                  style={[styles.formatOption, preferredFormat === f && styles.formatOptionActive]}
                  onPress={() => setPreferredFormat(f)}
                >
                  <Text style={[styles.formatOptionText, preferredFormat === f && styles.formatOptionTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Learning Objective</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Prepare for mid-term assessment"
              placeholderTextColor={MUTED}
              value={learningObjective}
              onChangeText={setLearningObjective}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Describe what you need help with</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Explain your learning goals..."
              placeholderTextColor={MUTED}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Estimated Budget (Rs/hr)</Text>
            <TextInput
              style={styles.input}
              placeholder="1000"
              placeholderTextColor={MUTED}
              value={estimatedBudget}
              onChangeText={setEstimatedBudget}
              keyboardType="numeric"
            />
          </View>
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
            <Text style={styles.submitButtonText}>SEND REQUEST</Text>
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
  tutorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: INK,
  },
  form: {
    backgroundColor: CARD,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEBDD',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: INK,
    marginBottom: 8,
  },
  input: {
    backgroundColor: PAGE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: INK,
    borderWidth: 1,
    borderColor: '#E4E1D2',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E4E1D2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: PAGE,
  },
  formatOptionActive: {
    borderColor: TEAL,
    backgroundColor: '#E1F4EF',
  },
  formatOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
  },
  formatOptionTextActive: {
    color: TEAL,
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
