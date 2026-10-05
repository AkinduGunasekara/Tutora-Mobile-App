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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Primary, Spacing } from '@/constants/theme';

// ─── Reusable field ───────────────────────────────────────────────────────────
function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
  suffix,
  multiline = false,
  inputHeight,
}: {
  label: string;
  icon?: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  editable?: boolean;
  suffix?: string;
  multiline?: boolean;
  inputHeight?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          !editable && styles.inputDisabled,
          multiline && { alignItems: 'flex-start', paddingVertical: 10 },
        ]}>
        {icon ? (
          <Text style={[styles.inputIcon, multiline && { marginTop: 2 }]}>{icon}</Text>
        ) : null}
        <TextInput
          style={[
            styles.input,
            multiline && { height: inputHeight ?? 80, textAlignVertical: 'top' },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize="none"
          multiline={multiline}
        />
        {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [university, setUniversity] = useState(user?.university ?? '');
  const [degree, setDegree] = useState(user?.degree ?? '');
  const [year, setYear] = useState(user?.year ?? '');
  const [studentId, setStudentId] = useState(user?.studentId ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [hourlyRate, setHourlyRate] = useState(String(user?.hourlyRate ?? ''));
  const [subjects, setSubjects] = useState((user?.subjects ?? []).join(', '));
  const [qualifications, setQualifications] = useState((user?.qualifications ?? []).join('\n'));
  const [onlineSessions, setOnlineSessions] = useState(user?.onlineSessions ?? true);
  const [faceToFaceSessions, setFaceToFaceSessions] = useState(user?.faceToFaceSessions ?? false);

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isStudent = user?.role === 'student';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Full name cannot be empty.');
      return;
    }
    try {
      setLoading(true);
      const payload: Record<string, unknown> = { name: name.trim(), phone };
      if (isStudent) {
        payload.university = university;
        payload.degree = degree;
        payload.year = year;
        payload.studentId = studentId;
      } else {
        payload.bio = bio;
        payload.hourlyRate = hourlyRate ? Number(hourlyRate) : 0;
        payload.subjects = subjects.split(',').map((x) => x.trim()).filter(Boolean);
        payload.qualifications = qualifications.split('\n').map((x) => x.trim()).filter(Boolean);
        payload.onlineSessions = onlineSessions;
        payload.faceToFaceSessions = faceToFaceSessions;
      }
      const { data } = await api.put('/auth/profile', payload);
      updateUser(data);
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to save changes.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* ── Top bar ───────────────────────────────────── */}
        <View style={styles.topbar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.topbarCenter}>
            <Text style={styles.topbarTitle}>Edit Profile</Text>
            <Text style={styles.topbarSub}>
              {isStudent ? 'Student Account' : 'Tutor Account'}
            </Text>
          </View>
          <Pressable
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Save ✓</Text>
            }
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* ── Avatar section ────────────────────────── */}
          <View style={styles.avatarSection}>
            <View style={{ position: 'relative' }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials || '??'}</Text>
              </View>
              <View style={styles.cameraBtn}>
                <Text style={styles.cameraBtnIcon}>📷</Text>
              </View>
            </View>
            <Pressable>
              <Text style={styles.changeAvatarLink}>Change Avatar ✏</Text>
            </Pressable>
            <Text style={styles.avatarHint}>PNG, JPG or WEBP up to 5MB</Text>
          </View>

          {/* ── Personal Details ──────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredBadgeText}>3 Required</Text>
              </View>
            </View>
            <View style={styles.sectionCard}>
              <Field
                label="Full Name"
                icon="👤"
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                keyboardType="default"
              />
              <View style={styles.fieldDivider} />
              <Field
                label="Email Address"
                icon="✉"
                value={user?.email ?? ''}
                editable={false}
                suffix="✓ Verified"
              />
              <View style={styles.fieldDivider} />
              <Field
                label="Phone Number"
                icon="📞"
                value={phone}
                onChangeText={setPhone}
                placeholder="+94 77 123 4567"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* ── Academic Background (student only) ───── */}
          {isStudent && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>ACADEMIC BACKGROUND</Text>
                <View style={styles.campusBadge}>
                  <Text style={styles.campusBadgeText}>• Campus Sync Active</Text>
                </View>
              </View>
              <View style={styles.sectionCard}>
                <Field
                  label="University / Institution"
                  icon="🏛️"
                  value={university}
                  onChangeText={setUniversity}
                  placeholder="e.g. SLIIT"
                />
                <View style={styles.fieldDivider} />
                <Field
                  label="Degree / Programme"
                  icon="🎓"
                  value={degree}
                  onChangeText={setDegree}
                  placeholder="e.g. BSc (Hons) in IT"
                />
                <View style={styles.fieldDivider} />
                <View style={styles.twoCol}>
                  <View style={styles.colLeft}>
                    <Field
                      label="Year / Level"
                      value={year}
                      onChangeText={setYear}
                      placeholder="e.g. 3rd Year"
                    />
                  </View>
                  <View style={styles.colDivider} />
                  <View style={styles.colRight}>
                    <Field
                      label="Student ID"
                      value={studentId}
                      onChangeText={setStudentId}
                      placeholder="IT21049280"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── Tutor Details (tutor only) ────────────── */}
          {!isStudent && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>TUTOR DETAILS</Text>
              </View>
              <View style={styles.sectionCard}>
                <Field
                  label="Bio"
                  icon="📝"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell students about yourself..."
                  multiline
                  inputHeight={88}
                  keyboardType="default"
                />
                <View style={styles.fieldDivider} />
                <Field
                  label="Hourly Rate (Rs.)"
                  icon="💰"
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  keyboardType="numeric"
                  placeholder="e.g. 2500"
                />
                <View style={styles.fieldDivider} />
                <Field
                  label="Subjects I Teach (comma separated)"
                  icon="📚"
                  value={subjects}
                  onChangeText={setSubjects}
                  placeholder="e.g. Programming, Algorithms"
                  keyboardType="default"
                />
                <View style={styles.fieldDivider} />
                <Field
                  label="Qualifications & Experience (one per line)"
                  icon="🎓"
                  value={qualifications}
                  onChangeText={setQualifications}
                  placeholder={'e.g. BSc Software Engineering\n2+ Years Tutoring Experience'}
                  multiline
                  inputHeight={88}
                  keyboardType="default"
                />
                <View style={styles.fieldDivider} />
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Online Sessions</Text>
                  <Switch value={onlineSessions} onValueChange={setOnlineSessions} trackColor={{ false: '#E4E1D2', true: '#008C91' }} thumbColor="#FFFFFF" />
                </View>
                <View style={styles.fieldDivider} />
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Face-to-Face Sessions</Text>
                  <Switch value={faceToFaceSessions} onValueChange={setFaceToFaceSessions} trackColor={{ false: '#E4E1D2', true: '#008C91' }} thumbColor="#FFFFFF" />
                </View>
              </View>
            </View>
          )}

          {/* ── Save button ───────────────────────────── */}
          <Pressable
            style={({ pressed }) => [
              styles.saveChangesBtn,
              (pressed || loading) && { opacity: 0.85 },
            ]}
            onPress={handleSave}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveChangesBtnText}>Save Changes →</Text>
            }
          </Pressable>

          {/* ── Cancel ───────────────────────────────── */}
          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#171943' },
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  scroll: {
    padding: Spacing.four,
    gap: Spacing.four,
  },

  // Top bar
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  topbarCenter: { alignItems: 'center', flex: 1 },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  topbarSub: { fontSize: 12, color: '#6B7280' },
  saveBtn: {
    backgroundColor: Primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.three,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  avatarInitials: { color: '#fff', fontSize: 32, fontWeight: '800' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraBtnIcon: { fontSize: 13 },
  changeAvatarLink: { color: Primary, fontSize: 14, fontWeight: '600' },
  avatarHint: { fontSize: 12, color: '#9CA3AF' },

  // Section
  section: { gap: Spacing.two },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  requiredBadge: {
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  requiredBadgeText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },
  campusBadge: {
    borderRadius: 20,
    backgroundColor: '#E0F7F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  campusBadgeText: { fontSize: 11, color: Primary, fontWeight: '600' },

  // Section card
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 0,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },

  // Two-column layout
  twoCol: { flexDirection: 'row' },
  colLeft: { flex: 1 },
  colDivider: { width: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  colRight: { flex: 1, paddingLeft: Spacing.two },

  // Field
  field: { gap: 4, paddingVertical: 8 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginTop: 2,
  },
  inputDisabled: { backgroundColor: '#F9FAFB' },
  inputIcon: { fontSize: 15, marginRight: 8, color: '#9CA3AF' },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A2E',
  },
  inputSuffix: { fontSize: 12, color: Primary, fontWeight: '600' },

  // Save / cancel
  saveChangesBtn: {
    backgroundColor: Primary,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.two,
    shadowColor: Primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveChangesBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
});
