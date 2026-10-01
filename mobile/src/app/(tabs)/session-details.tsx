import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INK = '#171943';
const TEAL = '#008C91';
const PAGE = '#EFEDDC';
const MUTED = '#78809A';
const MEETING_TYPES = ['Microsoft Teams', 'In-Person Study'] as const;

type MeetingType = (typeof MEETING_TYPES)[number];

const asText = (value: string | string[] | undefined, fallback: string) =>
  Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;

const durationToMinutes = (duration: string) => {
  if (duration.toLowerCase().includes('30')) return 30;
  const hours = Number.parseFloat(duration);
  return Number.isFinite(hours) ? Math.round(hours * 60) : 60;
};

export default function SessionDetailsScreen() {
  const params = useLocalSearchParams<{
    date?: string;
    dateLabel?: string;
    time?: string;
    duration?: string;
    tutorName?: string;
    tutorSubtitle?: string;
    rating?: string;
    reviewCount?: string;
    hourlyRate?: string;
    tutorInitials?: string;
    bookingId?: string;
    meetingType?: string;
    message?: string;
  }>();
  const initialMeetingType = asText(params.meetingType, 'Microsoft Teams');
  const [meetingType, setMeetingType] = useState<MeetingType>(
    MEETING_TYPES.includes(initialMeetingType as MeetingType)
      ? initialMeetingType as MeetingType
      : 'Microsoft Teams',
  );
  const [message, setMessage] = useState(asText(params.message, ''));

  const dateLabel = asText(params.dateLabel, 'Wed, Oct 14, 2026');
  const time = asText(params.time, '10:00 AM');
  const duration = asText(params.duration, '1 HR');
  const tutorName = asText(params.tutorName, 'Anjana Gayantha');
  const tutorSubtitle = asText(params.tutorSubtitle, 'Software Engineer at SLIIT');
  const rating = asText(params.rating, '4.9');
  const reviewCount = asText(params.reviewCount, '124');
  const hourlyRate = asText(params.hourlyRate, 'Rs 1,000/Hr');
  const tutorInitials = asText(params.tutorInitials, 'AG');

  const continueToSummary = () => {
    router.push({
      pathname: '/(tabs)/booking-summary' as any,
      params: {
        date: params.date,
        dateLabel,
        time,
        duration,
        meetingType,
        message,
        tutorName,
        tutorSubtitle,
        rating,
        reviewCount,
        hourlyRate,
        tutorInitials,
        bookingId: params.bookingId,
      },
    });
  };

  const backToSchedule = () => {
    router.replace({
      pathname: '/(tabs)/schedule' as any,
      params: {
        bookingId: params.bookingId,
        date: params.date,
        time,
        duration,
        durationMinutes: String(durationToMinutes(duration)),
        meetingType,
        message,
        tutorName,
        tutorSubtitle,
        rating,
        reviewCount,
        hourlyRate,
        tutorInitials,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back to date and time" onPress={backToSchedule} hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Session Details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.tutorCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{tutorInitials}</Text></View>
            <View style={styles.tutorInfo}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.tutorName}>{tutorName}</Text>
                <Text style={styles.verified}>✓</Text>
              </View>
              <Text numberOfLines={1} style={styles.tutorSubtitle}>{tutorSubtitle}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>⭐ {rating}</Text>
                <Text style={styles.reviews}>({reviewCount} reviews)</Text>
              </View>
            </View>
            <Text style={styles.rate}>{hourlyRate}</Text>
          </View>

          <View style={styles.dateCard}>
            <View style={styles.calendarIconWrap}><Text style={styles.calendarIcon}>▦</Text></View>
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>{dateLabel} · {time}</Text>
              <Text style={styles.durationText}>Duration: {duration}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Meeting Type</Text>
            <View style={styles.meetingToggle}>
              {MEETING_TYPES.map((item) => {
                const selected = meetingType === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setMeetingType(item)}
                    style={[styles.meetingButton, selected && styles.meetingSelected]}>
                    <Text style={[styles.meetingText, selected && styles.meetingSelectedText]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add a message (Optional)</Text>
            <TextInput
              accessibilityLabel="Message to tutor"
              multiline
              maxLength={500}
              textAlignVertical="top"
              placeholder="Write a message to your tutor..."
              placeholderTextColor={MUTED}
              value={message}
              onChangeText={setMessage}
              style={styles.messageInput}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={continueToSummary}
            style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text style={styles.continueText}>Continue to Summary</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },
  page: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: PAGE },
  header: {
    height: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E1D2',
  },
  back: { color: INK, fontSize: 32, lineHeight: 36, width: 20 },
  headerTitle: { color: INK, fontSize: 16, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 20, gap: 14 },
  tutorCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F1DE',
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: INK,
    borderWidth: 2,
    borderColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  tutorInfo: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tutorName: { color: INK, fontWeight: '700', fontSize: 12, flexShrink: 1 },
  verified: { color: TEAL, fontSize: 13, fontWeight: '800' },
  tutorSubtitle: { color: MUTED, fontSize: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: INK, fontSize: 10, fontWeight: '700' },
  reviews: { color: INK, fontSize: 10 },
  rate: { color: TEAL, fontSize: 11, fontWeight: '800' },
  dateCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 11,
    gap: 9,
  },
  calendarIconWrap: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#F0EFDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: { color: TEAL, fontSize: 18, fontWeight: '700' },
  dateInfo: { flex: 1, gap: 2 },
  dateText: { color: INK, fontSize: 11, fontWeight: '700' },
  durationText: { color: MUTED, fontSize: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 11 },
  sectionTitle: { color: INK, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  meetingToggle: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#F3F3F4',
    borderRadius: 6,
    padding: 3,
    gap: 3,
  },
  meetingButton: { flex: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  meetingSelected: { backgroundColor: TEAL },
  meetingText: { color: INK, fontSize: 10, fontWeight: '600' },
  meetingSelectedText: { color: '#FFFFFF', fontWeight: '700' },
  messageInput: {
    minHeight: 86,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    backgroundColor: '#F5F5F5',
    color: INK,
    fontSize: 11,
    padding: 9,
  },
  continueButton: {
    minHeight: 44,
    borderRadius: 9,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});
