import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PAGE = '#EFEDDC';
const INK = '#171943';
const TEAL = '#008C91';
const MUTED = '#78809A';
const CARD = '#FFFFFF';

export default function RequestSentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    tutorName = 'Tutor',
    subject = '',
    preferredDate = '',
    preferredTime = '',
    duration = '1',
    estimatedBudget = '0',
  } = params;

  const navigateToCalendar = () => {
    router.push('/(tabs)/bookings');
  };

  const navigateToHome = () => {
    router.push('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={TEAL} />
        </View>

        <Text style={styles.title}>Request Sent!</Text>
        <Text style={styles.subtitle}>
          Your custom session request has been sent to {tutorName}.
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subject</Text>
            <Text style={styles.detailValue}>{subject}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Preferred Date</Text>
            <Text style={styles.detailValue}>{preferredDate}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Preferred Time</Text>
            <Text style={styles.detailValue}>{preferredTime}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{duration} Hours</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Budget</Text>
            <Text style={styles.detailValue}>Rs {estimatedBudget}</Text>
          </View>
        </View>

        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={20} color={MUTED} />
          <Text style={styles.noteText}>
            The tutor will review your request and respond within 24 hours.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={navigateToCalendar}
          >
            <Text style={styles.primaryButtonText}>VIEW MY CALENDAR</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={navigateToHome}
          >
            <Text style={styles.secondaryButtonText}>BACK TO HOME</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: INK,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EEEBDD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: MUTED,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: INK,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E4E1D2',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E1F4EF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: MUTED,
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: TEAL,
    borderRadius: 23,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: CARD,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: 23,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: TEAL,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
