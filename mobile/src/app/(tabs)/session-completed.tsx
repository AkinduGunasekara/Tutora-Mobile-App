import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Primary, Spacing } from '@/constants/theme';

function getInitials(name: string = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function SessionCompletedScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user }      = useAuth();

  const [session,   setSession]   = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [rating,    setRating]    = useState(0);
  const [review,    setReview]    = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting,setSubmitting]= useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/session/${sessionId}`);
        setSession(data);
        if (data.rating) { setRating(data.rating); setReview(data.review ?? ''); setSubmitted(true); }
      } catch {}
      finally { setLoading(false); }
    };
    if (sessionId) load();
  }, [sessionId]);

  const handleSubmitReview = async () => {
    if (rating === 0) { Alert.alert('Rating required', 'Please select a star rating.'); return; }
    setSubmitting(true);
    try {
      await api.patch(`/session/${sessionId}/complete`, { rating, review });
      setSubmitted(true);
      Alert.alert('Thank you!', 'Your review has been submitted.');
    } catch {
      Alert.alert('Error', 'Could not submit review. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Primary} />
      </View>
    </SafeAreaView>
  );

  const isStudent = user?.role !== 'tutor';
  const tutor     = session?.tutor ?? {};
  const student   = session?.student ?? {};

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerEmoji}>🎉</Text>
        <Text style={styles.bannerTitle}>Session Completed!</Text>
        <Text style={styles.bannerSub}>Great work — your session has ended</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Session summary */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SESSION SUMMARY</Text>
          <View style={styles.tutorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(isStudent ? tutor.name : student.name)}</Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{isStudent ? tutor.name : student.name}</Text>
              <Text style={styles.personRole}>{isStudent ? 'Your Tutor' : 'Your Student'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <SummaryRow label="Subject"   value={session?.subject ?? '—'} />
          <SummaryRow label="Duration"  value={`${session?.durationHours ?? '—'} hours`} />
          <SummaryRow label="Date"      value={session?.scheduledDate
            ? new Date(session.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'} />
          <View style={styles.divider} />
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>
              {isStudent ? 'Total Paid' : 'Earnings'}
            </Text>
            <Text style={styles.paymentAmount}>Rs. {session?.totalAmount?.toLocaleString() ?? '—'}</Text>
          </View>
          <View style={styles.releasedPill}>
            <Text style={styles.releasedText}>✓ PAYMENT RELEASED</Text>
          </View>
        </View>

        {/* Rating */}
        {isStudent && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>RATE YOUR SESSION</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable
                  key={s}
                  onPress={() => !submitted && setRating(s)}
                  disabled={submitted}>
                  <Text style={[styles.star, rating >= s && styles.starFilled]}>
                    {rating >= s ? '★' : '☆'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience with this tutor..."
              placeholderTextColor="#9CA3AF"
              value={review}
              onChangeText={setReview}
              multiline
              editable={!submitted}
            />
            {!submitted ? (
              <Pressable
                style={({ pressed }) => [styles.submitBtn, (pressed || submitting) && { opacity: 0.85 }]}
                onPress={handleSubmitReview}
                disabled={submitting}>
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Submitting...' : 'Submit Review →'}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.reviewedBadge}>
                <Text style={styles.reviewedText}>✓ Review Submitted</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.push({ pathname: '/(tabs)/session-workspace' as any, params: { sessionId } })}>
          <Text style={styles.outlineBtnText}>📂  View Session Materials</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.replace('/(tabs)/home' as any)}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#F5F6FA' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  banner: {
    backgroundColor: Primary, paddingVertical: 24, paddingHorizontal: Spacing.four,
    alignItems: 'center', gap: 6,
  },
  bannerEmoji: { fontSize: 36 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  bannerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  scroll: { padding: Spacing.four, gap: Spacing.three },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: Spacing.three, gap: Spacing.two,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  tutorRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar:     {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  personInfo: { gap: 2 },
  personName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  personRole: { fontSize: 12, color: '#6B7280' },
  divider:    { height: 1, backgroundColor: '#F3F4F6' },

  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#6B7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },

  paymentRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentLabel:  { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  paymentAmount: { fontSize: 22, fontWeight: '900', color: Primary },
  releasedPill:  {
    alignSelf: 'flex-start', backgroundColor: '#D1FAE5',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  releasedText: { fontSize: 11, color: '#059669', fontWeight: '700' },

  // Stars
  starsRow:   { flexDirection: 'row', gap: 8 },
  star:       { fontSize: 32, color: '#E5E7EB' },
  starFilled: { color: '#FBBF24' },

  reviewInput: {
    backgroundColor: '#F5F6FA', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    padding: 14, fontSize: 14, color: '#1A1A2E', minHeight: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: Primary, borderRadius: 100, paddingVertical: 14, alignItems: 'center',
    shadowColor: Primary, shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  submitBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  reviewedBadge:  {
    backgroundColor: '#D1FAE5', borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  reviewedText: { fontSize: 13, color: '#059669', fontWeight: '700' },

  outlineBtn: {
    borderWidth: 1.5, borderColor: Primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff',
  },
  outlineBtnText: { fontSize: 14, color: Primary, fontWeight: '700' },
  homeBtn:        { alignItems: 'center', paddingVertical: 10 },
  homeBtnText:    { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
