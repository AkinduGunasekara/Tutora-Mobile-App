import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { Primary, Spacing } from '@/constants/theme';

function getInitials(name: string = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function SessionBookingConfirmScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/session/${sessionId}`);
        setSession(data);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load session.');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetch();
  }, [sessionId]);

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Primary} />
      </View>
    </SafeAreaView>
  );

  if (error || !session) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.loadingWrap}>
        <Text style={styles.errorText}>{error || 'Session not found.'}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.linkText}>← Go back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  const tutor = session.tutor ?? {};

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Booking Confirmed</Text>
        </View>
        <View style={styles.confirmedPill}>
          <Text style={styles.confirmedText}>✓ Confirmed</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Tutor card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>YOUR TUTOR</Text>
          <View style={styles.tutorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(tutor.name)}</Text>
            </View>
            <View style={styles.tutorInfo}>
              <View style={styles.tutorNameRow}>
                <Text style={styles.tutorName}>{tutor.name ?? '—'}</Text>
                {tutor.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ Verified</Text>
                  </View>
                )}
              </View>
              <View style={styles.subjectPill}>
                <Text style={styles.subjectText}>{session.subject}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Session details */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SESSION DETAILS</Text>
          <DetailRow label="Date"        value={formatDate(session.scheduledDate)} />
          <View style={styles.rowDivider} />
          <DetailRow label="Time"        value={formatTime(session.scheduledDate)} />
          <View style={styles.rowDivider} />
          <DetailRow label="Duration"    value={`${session.durationHours} ${session.durationHours === 1 ? 'hour' : 'hours'}`} />
          <View style={styles.rowDivider} />
          <DetailRow label="Session Type" value="Online" />
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PAYMENT</Text>
          <DetailRow label="Amount"         value={`Rs. ${session.totalAmount?.toLocaleString()}`} />
          <View style={styles.rowDivider} />
          <DetailRow label="Method"         value={session.paymentMethod?.replace('_', ' ').toUpperCase()} />
          <View style={styles.rowDivider} />
          <View style={styles.escrowStatusRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.escrowPill}>
              <Text style={styles.escrowPillText}>🔒 IN ESCROW</Text>
            </View>
          </View>
        </View>

        {/* Primary actions */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push({ pathname: '/(tabs)/session-video' as any, params: { sessionId } })}>
          <Text style={styles.primaryBtnText}>🎥  Join Live Room</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.push({ pathname: '/(tabs)/session-chat' as any, params: { sessionId } })}>
          <Text style={styles.outlineBtnText}>💬  Open Chat</Text>
        </Pressable>

        {/* Secondary actions */}
        <View style={styles.secondaryRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
            onPress={() => router.push({ pathname: '/(tabs)/session-files' as any, params: { sessionId } })}>
            <Text style={styles.secondaryBtnText}>📁  Files</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
            onPress={() => router.push({ pathname: '/(tabs)/session-code' as any, params: { sessionId } })}>
            <Text style={styles.secondaryBtnText}>💻  Code</Text>
          </Pressable>
        </View>

        <Pressable style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home' as any)}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#F5F6FA' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText:   { fontSize: 15, color: '#EF4444', textAlign: 'center' },
  linkText:    { fontSize: 14, color: Primary, fontWeight: '600' },

  // Top bar
  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    elevation: 2,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon:     { fontSize: 18, color: '#1A1A2E' },
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarTitle:  { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  confirmedPill: {
    backgroundColor: '#D1FAE5', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  confirmedText: { fontSize: 11, color: '#059669', fontWeight: '700' },

  scroll: { padding: Spacing.four, gap: Spacing.three },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: Spacing.three, gap: Spacing.two,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  // Tutor
  tutorRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar:      {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { color: '#fff', fontSize: 18, fontWeight: '800' },
  tutorInfo:   { flex: 1, gap: 6 },
  tutorNameRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  tutorName:   { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  verifiedBadge: {
    backgroundColor: '#E0F7F5', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  verifiedText: { fontSize: 10, color: Primary, fontWeight: '700' },
  subjectPill:  {
    alignSelf: 'flex-start', backgroundColor: '#F3F4F6',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2,
  },
  subjectText:  { fontSize: 11, color: '#374151', fontWeight: '600' },

  // Detail rows
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel:    { fontSize: 13, color: '#6B7280' },
  detailValue:    { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  rowDivider:     { height: 1, backgroundColor: '#F3F4F6' },
  escrowStatusRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  escrowPill:     { backgroundColor: '#E0F7F5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  escrowPillText: { fontSize: 11, color: Primary, fontWeight: '700' },

  // Buttons
  primaryBtn: {
    backgroundColor: Primary, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: Primary, shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 2, borderColor: Primary, borderRadius: 100,
    paddingVertical: 14, alignItems: 'center',
  },
  outlineBtnText: { color: Primary, fontSize: 16, fontWeight: '700' },
  secondaryRow:   { flexDirection: 'row', gap: Spacing.two },
  secondaryBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', backgroundColor: '#fff',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  homeBtn:      { alignItems: 'center', paddingVertical: 10 },
  homeBtnText:  { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
