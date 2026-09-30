import { router } from 'expo-router';
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

import { useAuth } from '@/context/AuthContext';
import { Primary, Spacing } from '@/constants/theme';

// ─── Logo component ───────────────────────────────────────────────────────────
function TutoraLogo() {
  return (
    <View style={styles.logoBlock}>
      <View style={styles.logoIconWrap}>
        <Text style={styles.logoEmoji}>🎓</Text>
      </View>
      <View style={styles.logoRow}>
        <Text style={styles.logoText}>TUTORA</Text>
        <View style={styles.learnBadge}>
          <Text style={styles.learnText}>LEARN</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Login failed. Please try again.';
      Alert.alert('Login failed', msg);
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

          {/* Logo */}
          <View style={styles.logoWrapper}>
            <TutoraLogo />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>
              Enter your credentials to access your account.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

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
              <View style={styles.labelRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <Pressable onPress={() => {}}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Your password"
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
            </View>
          </View>

          {/* Log In button */}
          <Pressable
            style={({ pressed }) => [styles.loginBtn, (pressed || loading) && { opacity: 0.85 }]}
            onPress={handleLogin}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Log In →</Text>
            }
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social hint */}
          <View style={styles.socialHint}>
            <Text style={styles.socialHintText}>
              🔐  Secure login powered by Tutora
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
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
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },

  // Logo
  logoWrapper: { alignItems: 'center', paddingTop: Spacing.two },
  logoBlock: { alignItems: 'center', gap: 8 },
  logoIconWrap: {
    width: 56,
    height: 56,
    backgroundColor: Primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  logoEmoji: { fontSize: 26 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 20, fontWeight: '900', color: '#1A1A2E', letterSpacing: 2 },
  learnBadge: {
    borderWidth: 1.5,
    borderColor: Primary,
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  learnText: { color: Primary, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  // Header
  header: { alignItems: 'center', gap: Spacing.one },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: { fontSize: 12, color: Primary, fontWeight: '600' },

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

  // Button
  loginBtn: {
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
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },

  // Social hint
  socialHint: {
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialHintText: { fontSize: 13, color: '#6B7280' },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: Spacing.two,
  },
  footerText: { fontSize: 14, color: '#6B7280' },
  footerLink: { fontSize: 14, color: Primary, fontWeight: '700' },
});
