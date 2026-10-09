import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';
const CARD  = '#FFFFFF';

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
  const params = useLocalSearchParams<{
    sessionId: string; tutorName?: string; subject?: string;
    durationHours?: string; hourlyRate?: string; scheduledDate?: string; paymentMethod?: string;
  }>();
  const { sessionId } = params;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await api.get(`/session/${sessionId}`);
        setSession(data);
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchSession();
    else setLoading(false);
  }, [sessionId]);

  const tutorName   = session?.tutor?.name   ?? params.tutorName    ?? 'Your Tutor';
  const subject     = session?.subject        ?? params.subject       ?? 'General';
  const durationHrs = session?.durationHours  ?? parseFloat(params.durationHours ?? '1');
  const totalAmount = session?.totalAmount    ?? (() => {
    const rate = parseFloat(params.hourlyRate ?? '0');
    const hrs  = parseFloat(params.durationHours ?? '1');
    return rate * hrs * 1.05;
  })();
  const method      = session?.paymentMethod  ?? params.paymentMethod ?? 'card';
  const scheduled   = session?.scheduledDate  ?? params.scheduledDate ?? new Date().toISOString();
  const isVerified  = session?.tutor?.isVerified ?? false;

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={INK} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Confirmed</Text>
        <View style={styles.confirmedPill}>
          <Text style={styles.confirmedText}>Confirmed</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Tutor card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>YOUR TUTOR</Text>
          <View style={styles.tutorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(tutorName)}</Text>
            </View>
            <View style={styles.tutorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.tutorName}>{tutorName}</Text>
                {isVerified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>Verified</Text></View>}
              </View>
              <Text style={styles.tutorSubject}>{subject}</Text>
            </View>
          </View>
        </View>

        {/* Session details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SESSION DETAILS</Text>
          <DetailRow label="Date"         value={formatDate(scheduled)} />
          <View style={styles.divider} />
          <DetailRow label="Time"         value={formatTime(scheduled)} />
          <View style={styles.divider} />
          <DetailRow label="Duration"     value={`${durationHrs} ${durationHrs === 1 ? 'hour' : 'hours'}`} />
          <View style={styles.divider} />
          <DetailRow label="Session Type" value="Online" />
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PAYMENT</Text>
          <DetailRow label="Amount" value={`Rs. ${Math.round(totalAmount).toLocaleString()}`} teal />
          <View style={styles.divider} />
          <DetailRow label="Method" value={method.replace('_', ' ').toUpperCase()} />
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.escrowPill}>
              <Text style={styles.escrowPillText}>IN ESCROW</Text>
            </View>
          </View>
        </View>

        {/* Primary actions */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push({ pathname: '/(tabs)/session-video' as any, params: { sessionId } })}>
          <Text style={styles.primaryBtnText}>Join Live Room</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.push({ pathname: '/(tabs)/session-chat' as any, params: { sessionId } })}>
          <Text style={styles.outlineBtnText}>Open Chat</Text>
        </Pressable>

        {/* Secondary actions */}
        <View style={styles.secondaryRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
            onPress={() => router.push({ pathname: '/(tabs)/session-files' as any, params: { sessionId } })}>
            <Text style={styles.secondaryBtnText}>Files</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
            onPress={() => router.push({ pathname: '/(tabs)/session-code' as any, params: { sessionId } })}>
            <Text style={styles.secondaryBtnText}>Code</Text>
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

function DetailRow({ label, value, teal }: { label: string; value: string; teal?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, teal && { color: TEAL, fontSize: 18, fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: PAGE },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: PAGE, borderBottomWidth: 1, borderBottomColor: '#E4E1D2',
  },
  backIcon:     { fontSize: 20, color: INK, fontWeight: '600' },
  headerTitle:  { fontSize: 15, fontWeight: '700', color: INK },
  confirmedPill: {
    backgroundColor: '#E1F4EF', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  confirmedText: { fontSize: 10, color: TEAL, fontWeight: '700' },

  scroll: { padding: 16, gap: 14 },

  // Card
  card: {
    backgroundColor: CARD, borderRadius: 12, padding: 14, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  // Tutor
  tutorRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:    {
    width: 48, height: 48, borderRadius: 8,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  tutorInfo:  { flex: 1, gap: 4 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tutorName:  { fontSize: 15, fontWeight: '700', color: INK },
  verifiedBadge: {
    backgroundColor: '#E1F4EF', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  verifiedText:  { fontSize: 9, color: TEAL, fontWeight: '700' },
  tutorSubject:  { fontSize: 12, color: MUTED },

  divider:     { height: 1, backgroundColor: '#F0EFE5' },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: MUTED },
  detailValue: { fontSize: 12, fontWeight: '600', color: INK },
  escrowPill:  { backgroundColor: '#E1F4EF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  escrowPillText: { fontSize: 10, color: TEAL, fontWeight: '700' },

  // Buttons
  primaryBtn: {
    backgroundColor: TEAL, borderRadius: 10,
    paddingVertical: 15, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 1.5, borderColor: TEAL, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
    backgroundColor: CARD,
  },
  outlineBtnText: { color: TEAL, fontSize: 14, fontWeight: '700' },
  secondaryRow:   { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    flex: 1, borderWidth: 1, borderColor: '#E4E1D2',
    borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', backgroundColor: CARD,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '600', color: INK },
  homeBtn:      { alignItems: 'center', paddingVertical: 10 },
  homeBtnText:  { fontSize: 13, color: MUTED, fontWeight: '600' },
});
