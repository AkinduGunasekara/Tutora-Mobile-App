import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';
const CARD  = '#FFFFFF';

function getInitials(name: string = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function SessionCompletedScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user }      = useAuth();

  const [session,   setSession]    = useState<any>(null);
  const [loading,   setLoading]    = useState(true);
  const [rating,    setRating]     = useState(0);
  const [review,    setReview]     = useState('');
  const [submitted, setSubmitted]  = useState(false);
  const [submitting,setSubmitting] = useState(false);

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
        <ActivityIndicator size="large" color={TEAL} />
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
        <View style={styles.bannerCheck}><Text style={styles.bannerCheckText}>✓</Text></View>
        <Text style={styles.bannerTitle}>Session Completed</Text>
        <Text style={styles.bannerSub}>Great work — your session has ended</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Session summary */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SESSION SUMMARY</Text>
          <View style={styles.personRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(isStudent ? tutor.name : student.name)}</Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{isStudent ? tutor.name : student.name}</Text>
              <Text style={styles.personRole}>{isStudent ? 'Your Tutor' : 'Your Student'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <SummaryRow label="Subject"  value={session?.subject ?? '—'} />
          <View style={styles.divider} />
          <SummaryRow label="Duration" value={`${session?.durationHours ?? '—'} hours`} />
          <View style={styles.divider} />
          <SummaryRow label="Date"     value={session?.scheduledDate
            ? new Date(session.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'} />
          <View style={styles.divider} />
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>{isStudent ? 'Total Paid' : 'Earnings'}</Text>
            <Text style={styles.amountValue}>Rs. {session?.totalAmount?.toLocaleString() ?? '—'}</Text>
          </View>
          <View style={styles.releasedPill}>
            <Text style={styles.releasedText}>PAYMENT RELEASED</Text>
          </View>
        </View>

        {/* Rating — students only */}
        {isStudent && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>RATE YOUR SESSION</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => !submitted && setRating(s)} disabled={submitted}>
                  <Text style={[styles.star, rating >= s && styles.starFilled]}>
                    {rating >= s ? '★' : '☆'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience with this tutor..."
              placeholderTextColor={MUTED}
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
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.reviewedBadge}>
                <Text style={styles.reviewedText}>Review Submitted</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.push({ pathname: '/(tabs)/session-workspace' as any, params: { sessionId } })}>
          <Text style={styles.outlineBtnText}>View Session Materials</Text>
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
  safe:        { flex: 1, backgroundColor: PAGE },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  banner: {
    backgroundColor: TEAL, paddingVertical: 28, paddingHorizontal: 24,
    alignItems: 'center', gap: 8,
  },
  bannerCheck: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  bannerCheckText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  bannerTitle:     { fontSize: 20, fontWeight: '800', color: '#fff' },
  bannerSub:       { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  scroll: { padding: 16, gap: 14 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  personRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:      {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { color: '#fff', fontSize: 15, fontWeight: '800' },
  personInfo:  { gap: 2 },
  personName:  { fontSize: 14, fontWeight: '700', color: INK },
  personRole:  { fontSize: 11, color: MUTED },
  divider:     { height: 1, backgroundColor: '#F0EFE5' },

  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, color: MUTED },
  summaryValue: { fontSize: 12, fontWeight: '600', color: INK },

  amountRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel:  { fontSize: 13, fontWeight: '700', color: INK },
  amountValue:  { fontSize: 20, fontWeight: '800', color: TEAL },
  releasedPill: {
    alignSelf: 'flex-start', backgroundColor: '#E1F4EF',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  releasedText: { fontSize: 10, color: TEAL, fontWeight: '700' },

  starsRow:   { flexDirection: 'row', gap: 8 },
  star:       { fontSize: 30, color: '#D8D5C5' },
  starFilled: { color: '#F59E0B' },

  reviewInput: {
    backgroundColor: PAGE, borderRadius: 10, borderWidth: 1, borderColor: '#E4E1D2',
    padding: 12, fontSize: 13, color: INK, minHeight: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: TEAL, borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  submitBtnText:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  reviewedBadge:  {
    backgroundColor: '#E1F4EF', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  reviewedText: { fontSize: 12, color: TEAL, fontWeight: '700' },

  outlineBtn: {
    borderWidth: 1.5, borderColor: TEAL, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', backgroundColor: '#FFFFFF',
  },
  outlineBtnText: { fontSize: 13, color: TEAL, fontWeight: '700' },
  homeBtn:        { alignItems: 'center', paddingVertical: 10 },
  homeBtnText:    { fontSize: 13, color: MUTED, fontWeight: '600' },
});
