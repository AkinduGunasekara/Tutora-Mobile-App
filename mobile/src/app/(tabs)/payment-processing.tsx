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

const PAGE  = '#EFEDDC';
const INK   = '#171943';
const TEAL  = '#008C91';
const MUTED = '#78809A';

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

  const [step, setStep]   = useState(0);
  const [error, setError] = useState('');
  const sessionIdRef       = useRef<string>('');

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
    scale.value   = withRepeat(withTiming(1.2, { duration: 900 }), -1, true);
    opacity.value = withRepeat(withTiming(0.4, { duration: 900 }), -1, true);

    step0Op.value = withDelay(400,  withTiming(1, { duration: 400 }));
    step1Op.value = withDelay(1200, withTiming(1, { duration: 400 }));
    step2Op.value = withDelay(2000, withTiming(1, { duration: 400 }));

    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2000);

    const run = async () => {
      // Simulated payment: no gateway, but the session's payment state is persisted
      try {
        const { data: session } = await api.post('/session', {
          bookingId:     params.bookingId,
          tutorId:       params.tutorId,
          subject:       params.subject,
          durationHours: params.durationHours,
          hourlyRate:    params.hourlyRate,
          scheduledDate: params.scheduledDate || new Date().toISOString(),
          paymentMethod: params.paymentMethod || 'card',
        });
        sessionIdRef.current = session._id;
        await api.patch(`/session/${session._id}/confirm-payment`);
      } catch (err: any) {
        clearTimeout(t1);
        clearTimeout(t2);
        setError(err?.response?.data?.message ?? 'We could not process this payment. Please try again.');
        return;
      }

      setTimeout(() => {
        router.replace({
          pathname: '/(tabs)/payment-success' as any,
          params:   {
            sessionId:    sessionIdRef.current,
            tutorName:    params.tutorName,
            subject:      params.subject,
            durationHours:params.durationHours,
            hourlyRate:   params.hourlyRate,
            scheduledDate:params.scheduledDate,
            paymentMethod:params.paymentMethod || 'card',
          },
        });
      }, 2800);
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
          <Text style={styles.errorTitle}>Payment Failed</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Text style={styles.goBack} onPress={() => router.back()}>Go back</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>

        {/* Animated ring */}
        <View style={styles.circleWrap}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <View style={styles.circle}>
            <Text style={styles.circleLabel}>PAY</Text>
          </View>
        </View>

        <Text style={styles.title}>Processing Payment</Text>
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
  safe:   { flex: 1, backgroundColor: PAGE },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },

  // Circle
  circleWrap:  { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  pulseRing: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: TEAL,
  },
  circle: {
    width: 90, height: 90, borderRadius: 10,
    backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: TEAL, shadowOpacity: 0.35, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  circleLabel: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 2 },

  title: { fontSize: 20, fontWeight: '800', color: INK, textAlign: 'center' },
  sub:   { fontSize: 13, color: MUTED, textAlign: 'center' },

  // Steps
  stepsWrap: { marginTop: 24, gap: 14, alignSelf: 'stretch' },
  stepRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#D8D5C5', alignItems: 'center', justifyContent: 'center',
  },
  checkCircleActive: { backgroundColor: TEAL },
  checkText:         { fontSize: 11, color: '#fff', fontWeight: '800' },
  stepText:          { fontSize: 13, color: MUTED },
  stepTextActive:    { color: INK, fontWeight: '600' },

  // Error
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#B42318' },
  errorMsg:   { fontSize: 13, color: MUTED, textAlign: 'center' },
  goBack:     { fontSize: 13, color: TEAL, fontWeight: '700', marginTop: 8 },
});
