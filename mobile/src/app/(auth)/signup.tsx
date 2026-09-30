import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth, type Role } from '@/context/AuthContext';
import { Primary, Spacing } from '@/constants/theme';

export default function SignupScreen() {
  const { register } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();

  const [role, setRole] = useState<Role>((params.role as Role) ?? 'student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 0–4 strength score
  const passwordStrength = Math.min(Math.floor(password.length / 3), 4);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength] ?? '';
  const strengthColor = passwordStrength <= 2 ? '#F59E0B' : Primary;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password, role);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Registration failed. Please try again.';
      Alert.alert('Sign up failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Top back bar ──────────────────────────────── */}
          <View style={styles.topBar}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <View style={styles.topBarLogoRow}>
              <View style={styles.miniLogo}>
                <Text style={styles.miniLogoEmoji}>🎓</Text>
              </View>
              <Text style={styles.miniLogoText}>TUTORA</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* ── Header ───────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join TUTORA to connect with top tutors and boost your skills.
            </Text>
          </View>

          {/* ── Role toggle ───────────────────────────────── */}
          <View style={styles.roleSection}>
            <Text style={styles.sectionLabel}>SELECT YOUR ROLE</Text>
            <View style={styles.roleToggle}>
              <Pressable
                style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]}
                onPress={() => setRole('student')}>
                <Text style={styles.roleEmoji}>📖</Text>
                <Text style={[styles.roleBtnText, role === 'student' && styles.roleBtnTextActive]}>
                  Student
                </Text>
              </Pressable>
              <Pressable
                style={[styles.roleBtn, role === 'tutor' && styles.roleBtnActive]}
                onPress={() => setRole('tutor')}>
                <Text style={styles.roleEmoji}>👤</Text>
                <Text style={[styles.roleBtnText, role === 'tutor' && styles.roleBtnTextActive]}>
                  Tutor
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── Form fields ───────────────────────────────── */}
          <View style={styles.form}>

            {/* Full Name */}
            <View style={styles.field}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@university.edu"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Must be at least 8 characters"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </Pressable>
              </View>

              {/* Strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBarRow}>
                    {[1, 2, 3, 4].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              passwordStrength >= i ? strengthColor : '#E5E7EB',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  {strengthLabel ? (
                    <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                      {strengthLabel}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          </View>

          {/* ── Terms ─────────────────────────────────────── */}
          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}&{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>

          {/* ── Create Account button ─────────────────────── */}
          <Pressable
            style={({ pressed }) => [styles.createBtn, (pressed || loading) && { opacity: 0.85 }]}
            onPress={handleRegister}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.createBtnText}>Create Account →</Text>
            }
          </Pressable>

          {/* ── Footer ───────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>Log in</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: '#1A1A2E' },
  topBarLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLogoEmoji: { fontSize: 14 },
  miniLogoText: { fontSize: 14, fontWeight: '900', color: '#1A1A2E', letterSpacing: 1.5 },

  // Header
  header: { gap: 6 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 22 },

  // Role toggle
  roleSection: { gap: Spacing.two },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  roleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  roleEmoji: { fontSize: 15 },
  roleBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  roleBtnTextActive: { color: Primary },

  // Form
  form: { gap: Spacing.three },
  field: { gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: Spacing.three,
  },
  inputIcon: { fontSize: 15, marginRight: 10, color: '#9CA3AF' },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
  },
  passwordInput: { paddingRight: 40 },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 4,
  },
  eyeIcon: { fontSize: 16 },

  // Strength bar
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 6,
  },
  strengthBarRow: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 40 },

  // Terms
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
  termsLink: { color: Primary, fontWeight: '600' },

  // Button
  createBtn: {
    backgroundColor: Primary,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  footerText: { fontSize: 14, color: '#6B7280' },
  footerLink: { fontSize: 14, color: Primary, fontWeight: '700' },
});
