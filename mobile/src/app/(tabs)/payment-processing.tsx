import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withDelay,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Primary } from '@/constants/theme';

const STEPS = [
  'Verifying payment details',
  'Setting up secure escrow',
  'Confirming with tutor',
];

export default function PaymentProcessingScreen() {
  const params = useLocalSearchParams<{
    bookingId: string; tutorId: string; tutorName: string;
    subject: string; durationHours: string; hourlyRate: string;
    scheduledDate: string; paymentMethod: string;
  }>();

  const { token } = useAuth();

  const [step, setStep]       = useState(0);
  const [error, setError]     = useState('');
  const sessionIdRef           = useRef<string>('');

  // Pulsing ring
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Step fade-ins
  const step0Op = useSharedValue(0);
  const step1Op = useSharedValue(0);
  const step2Op = useSharedValue(0);
  const stepOps = [step0Op, step1Op, step2Op];

  useEffect(() => {
    if (!token) {
      setError('You are not logged in. Please log in and try again.');
      return;
    }
    // Pulse animation
    scale.value   = withRepeat(withTiming(1.18, { duration: 900 }), -1, true);
    opacity.value = withRepeat(withTiming(0.6, { duration: 900 }), -1, true);

    // Sequential step reveals
    step0Op.value = withDelay(400,  withTiming(1, { duration: 400 }));
    step1Op.value = withDelay(1200, withTiming(1, { duration: 400 }));
    step2Op.value = withDelay(2000, withTiming(1, { duration: 400 }));

    // Step counter for UI
    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2000);

    // API flow
    const run = async () => {
      try {
        const { data: session } = await api.post('/session', {
          bookingId:     params.bookingId    || 'mock-booking',
          tutorId:       params.tutorId,
          subject:       params.subject,
          durationHours: params.durationHours,
          hourlyRate:    params.hourlyRate,
          scheduledDate: params.scheduledDate || new Date().toISOString(),
          paymentMethod: params.paymentMethod || 'card',
        });

        sessionIdRef.current = session._id;

        await api.patch(`/session/${session._id}/confirm-payment`);

        setTimeout(() => {
          router.replace({
            pathname: '/(tabs)/payment-success' as any,
            params:   { sessionId: session._id },
          });
        }, 2800);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Payment failed. Please try again.');
      }
    };

    run();
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Payment Failed</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Text style={styles.goBack} onPress={() => router.back()}>← Go back</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>

        {/* Animated circle */}
        <View style={styles.circleWrap}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <View style={styles.circle}>
            <Text style={styles.circleEmoji}>💳</Text>
          </View>
        </View>

        <Text style={styles.title}>Processing Payment...</Text>
        <Text style={styles.sub}>Please do not close the app</Text>

        {/* Steps */}
        <View style={styles.stepsWrap}>
          {STEPS.map((s, i) => (
            <Animated.View key={s} style={[styles.stepRow, { opacity: stepOps[i] }]}>
              <View style={[styles.checkCircle, i <= step && styles.checkCircleActive]}>
                <Text style={styles.checkText}>✓</Text>
              </View>
              <Text style={[styles.stepText, i <= step && styles.stepTextActive]}>{s}</Text>
            </Animated.View>
          ))}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },

  // Circle
  circleWrap:  { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  pulseRing: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Primary,
  },
  circle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Primary, shadowOpacity: 0.4, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  circleEmoji: { fontSize: 36 },

  title: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  sub:   { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  // Steps
  stepsWrap: { marginTop: 24, gap: 14, alignSelf: 'stretch' },
  stepRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  checkCircleActive: { backgroundColor: Primary },
  checkText:         { fontSize: 12, color: '#fff', fontWeight: '800' },
  stepText:          { fontSize: 14, color: '#9CA3AF' },
  stepTextActive:    { color: '#1A1A2E', fontWeight: '600' },

  // Error
  errorEmoji: { fontSize: 48, marginBottom: 8 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#EF4444' },
  errorMsg:   { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  goBack:     { fontSize: 14, color: Primary, fontWeight: '600', marginTop: 8 },
});
