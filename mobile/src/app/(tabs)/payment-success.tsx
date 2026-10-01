import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';

export default function PaymentSuccessScreen() {
  const { sessionId, tutorName, subject, durationHours, hourlyRate, scheduledDate, paymentMethod } =
    useLocalSearchParams<{
      sessionId: string; tutorName?: string; subject?: string;
      durationHours?: string; hourlyRate?: string; scheduledDate?: string; paymentMethod?: string;
    }>();
  const [total, setTotal]     = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const scale   = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value   = withDelay(200, withSpring(1, { damping: 12, stiffness: 120 }));
    opacity.value = withDelay(200, withSpring(1));

    const fetchSession = async () => {
      try {
        const { data } = await api.get(`/session/${sessionId}`);
        setTotal(data.totalAmount);
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchSession();
    else setLoading(false);
  }, [sessionId]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>

        {/* Success circle */}
        <Animated.View style={[styles.successCircle, circleStyle]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>

        <Text style={styles.title}>Payment Successful</Text>

        {loading ? (
          <ActivityIndicator color={TEAL} />
        ) : total !== null ? (
          <Text style={styles.amount}>Rs. {total.toLocaleString()}</Text>
        ) : null}

        <Text style={styles.sub}>
          Your payment is safely held in escrow and will be released to your tutor upon session completion.
        </Text>

        {/* Escrow note */}
        <View style={styles.escrowBox}>
          <Text style={styles.escrowText}>Escrow Active — Funds released after session ends</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() =>
            router.replace({
              pathname: '/(tabs)/session-booking-confirm' as any,
              params:   { sessionId, tutorName, subject, durationHours, hourlyRate, scheduledDate, paymentMethod },
            })
          }>
          <Text style={styles.primaryBtnText}>View Booking Details</Text>
        </Pressable>

        <Pressable style={styles.ghostBtn} onPress={() => router.replace('/(tabs)/home' as any)}>
          <Text style={styles.ghostBtnText}>Back to Home</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: PAGE },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 16,
  },

  successCircle: {
    width: 80, height: 80, borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22C55E', shadowOpacity: 0.3,
    shadowRadius: 14, shadowOffset: { width: 0, height: 5 },
    elevation: 6, marginBottom: 8,
  },
  checkMark: { fontSize: 38, color: '#fff', fontWeight: '900' },

  title:  { fontSize: 22, fontWeight: '800', color: INK, textAlign: 'center' },
  amount: { fontSize: 30, fontWeight: '900', color: TEAL },
  sub: {
    fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20, maxWidth: 300,
  },

  escrowBox: {
    backgroundColor: '#E1F4EF', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'stretch',
    alignItems: 'center',
  },
  escrowText: { fontSize: 12, color: TEAL, fontWeight: '600', textAlign: 'center' },

  primaryBtn: {
    backgroundColor: TEAL, borderRadius: 10,
    paddingVertical: 15, alignItems: 'center', alignSelf: 'stretch',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  ghostBtn:     { paddingVertical: 12, alignItems: 'center' },
  ghostBtnText: { fontSize: 13, color: MUTED, fontWeight: '600' },
});
