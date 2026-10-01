import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { Primary, Spacing } from '@/constants/theme';

export default function PaymentSuccessScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [total, setTotal]     = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Animated check circle
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
        // Non-critical — amount display is optional
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

        <Text style={styles.title}>Payment Successful!</Text>

        {loading ? (
          <ActivityIndicator color={Primary} />
        ) : total !== null ? (
          <Text style={styles.amount}>Rs. {total.toLocaleString()}</Text>
        ) : null}

        <Text style={styles.sub}>
          Your payment is safely held in escrow and will be released to your tutor upon session completion.
        </Text>

        {/* Escrow info box */}
        <View style={styles.escrowBox}>
          <Text style={styles.escrowIcon}>🔒</Text>
          <Text style={styles.escrowText}>
            Escrow Active — Funds released after session ends
          </Text>
        </View>

        {/* Actions */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() =>
            router.replace({
              pathname: '/(tabs)/session-booking-confirm' as any,
              params:   { sessionId },
            })
          }>
          <Text style={styles.primaryBtnText}>View Booking Details →</Text>
        </Pressable>

        <Pressable
          style={styles.ghostBtn}
          onPress={() => router.replace('/(tabs)/home' as any)}>
          <Text style={styles.ghostBtnText}>Back to Home</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.four, gap: Spacing.three,
  },

  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22C55E', shadowOpacity: 0.35,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 8, marginBottom: 8,
  },
  checkMark: { fontSize: 44, color: '#fff', fontWeight: '900' },

  title:  { fontSize: 26, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  amount: { fontSize: 32, fontWeight: '900', color: Primary },
  sub: {
    fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, maxWidth: 300,
  },

  escrowBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E0F7F5', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: Spacing.three,
    alignSelf: 'stretch',
  },
  escrowIcon: { fontSize: 18 },
  escrowText: { flex: 1, fontSize: 13, color: Primary, fontWeight: '600' },

  primaryBtn: {
    backgroundColor: Primary, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center', alignSelf: 'stretch',
    shadowColor: Primary, shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  ghostBtn:     { paddingVertical: 12, alignItems: 'center' },
  ghostBtnText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
