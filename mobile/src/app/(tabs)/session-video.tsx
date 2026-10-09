import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, Pressable, StyleSheet, Text, View,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const TEAL = '#008C91';

function pad(n: number) { return n.toString().padStart(2, '0'); }
function formatTimer(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

function getInitials(name: string = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function SessionVideoScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user }      = useAuth();

  const [session, setSession] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [micOn,   setMicOn]   = useState(true);
  const [camOn,   setCamOn]   = useState(true);
  const [facing,  setFacing]  = useState<'front' | 'back'>('front');
  const [ending,  setEnding]  = useState(false);

  const [camPermission,  requestCamPermission]  = useCameraPermissions();
  const [micPermission,  requestMicPermission]  = useMicrophonePermissions();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const liveDotOp    = useSharedValue(1);
  const liveDotStyle = useAnimatedStyle(() => ({ opacity: liveDotOp.value }));

  // Request permissions and start session on mount
  useEffect(() => {
    liveDotOp.value = withRepeat(withTiming(0, { duration: 700 }), -1, true);

    const init = async () => {
      // Request camera + mic permissions
      if (!camPermission?.granted) await requestCamPermission();
      if (!micPermission?.granted) await requestMicPermission();

      // Start / fetch session
      if (sessionId) {
        try {
          const { data } = await api.patch(`/session/${sessionId}/start`);
          setSession(data);
        } catch {
          try {
            const { data } = await api.get(`/session/${sessionId}`);
            setSession(data);
          } catch {}
        }
      }
    };

    init();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionId]);

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this session? Payment will be released.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session', style: 'destructive',
          onPress: async () => {
            setEnding(true);
            if (timerRef.current) clearInterval(timerRef.current);
            try { await api.patch(`/session/${sessionId}/complete`); } catch {}
            router.replace({ pathname: '/(tabs)/session-completed' as any, params: { sessionId } });
          },
        },
      ]
    );
  };

  const toggleCam = () => {
    if (!camPermission?.granted) {
      requestCamPermission();
      return;
    }
    setCamOn((v) => !v);
  };

  const toggleMic = () => {
    if (!micPermission?.granted) {
      requestMicPermission();
      return;
    }
    setMicOn((v) => !v);
  };

  // Other participant name shown in main view
  const otherName = user?.role === 'tutor'
    ? session?.student?.name ?? 'Student'
    : session?.tutor?.name ?? 'Tutor';

  const camReady = camPermission?.granted ?? false;

  return (
    <View style={styles.fullscreen}>

      {/* ── Main view: other participant (avatar — WebRTC not implemented) ── */}
      <View style={styles.mainView}>
        <View style={styles.remoteAvatarWrap}>
          <Text style={styles.remoteAvatarText}>{getInitials(otherName)}</Text>
        </View>
        <Text style={styles.remoteLabel}>{otherName}</Text>
        <Text style={styles.remoteSubLabel}>Waiting for video…</Text>
      </View>

      {/* ── PiP: local camera feed ── */}
      <View style={styles.pipWrap}>
        {camOn && camReady ? (
          <CameraView
            style={styles.pipCamera}
            facing={facing}
            mute={!micOn}
          />
        ) : (
          <View style={styles.pipOff}>
            {!camReady
              ? <Text style={styles.pipOffText}>No Access</Text>
              : <Text style={styles.pipOffText}>OFF</Text>
            }
          </View>
        )}
        {/* Flip button inside PiP */}
        {camOn && camReady && (
          <Pressable
            style={styles.flipBtn}
            onPress={() => setFacing((f) => f === 'front' ? 'back' : 'front')}>
            <Text style={styles.flipBtnText}>⟳</Text>
          </Pressable>
        )}
      </View>

      {/* ── Top bar ── */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.topBar}>
          <View style={styles.livePill}>
            <Animated.View style={[styles.liveDot, liveDotStyle]} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <View style={styles.timerWrap}>
            <Text style={styles.timerText}>{formatTimer(elapsed)}</Text>
          </View>
          <View style={styles.subjectPill}>
            <Text style={styles.subjectText}>{session?.subject ?? '—'}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Bottom controls ── */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
        <View style={styles.controls}>
          <ControlBtn
            icon={micOn ? '🎙️' : '🔇'}
            label={micOn ? 'Mute' : 'Unmuted'}
            active={micOn}
            onPress={toggleMic}
          />
          <ControlBtn
            icon={camOn ? '📷' : '🚫'}
            label={camOn ? 'Camera' : 'Cam Off'}
            active={camOn}
            onPress={toggleCam}
          />
          <ControlBtn
            icon="💬"
            label="Chat"
            onPress={() => router.push({ pathname: '/(tabs)/session-chat' as any, params: { sessionId } })}
          />
          <ControlBtn
            icon="🔄"
            label="Flip"
            onPress={() => setFacing((f) => f === 'front' ? 'back' : 'front')}
          />
          <Pressable
            style={({ pressed }) => [styles.endBtn, (pressed || ending) && { opacity: 0.8 }]}
            onPress={handleEndSession}
            disabled={ending}>
            <Text style={styles.endIcon}>📵</Text>
            <Text style={styles.endBtnLabel}>End</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ControlBtn({
  icon, label, active, onPress,
}: { icon: string; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.ctrlBtn,
        active === false && styles.ctrlBtnOff,
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}>
      <Text style={styles.ctrlIcon}>{icon}</Text>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, backgroundColor: '#0A0A14' },

  // Remote participant (main view)
  mainView: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A1A2E',
  },
  remoteAvatarWrap: {
    width: 90, height: 90, borderRadius: 10,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
    shadowColor: TEAL, shadowOpacity: 0.5, shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  remoteAvatarText:  { color: '#fff', fontSize: 32, fontWeight: '900' },
  remoteLabel:       { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '700', marginTop: 12 },
  remoteSubLabel:    { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 },

  // PiP self-view
  pipWrap: {
    position: 'absolute', bottom: 120, right: 16,
    width: 90, height: 130, borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  pipCamera: { flex: 1 },
  pipOff: {
    flex: 1, backgroundColor: '#12121E',
    alignItems: 'center', justifyContent: 'center',
  },
  pipOffText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  flipBtn: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14, width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  flipBtnText: { fontSize: 16, color: '#fff' },

  // Top bar
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText:   { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  timerWrap: {
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  timerText:   { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  subjectPill: {
    backgroundColor: 'rgba(0,140,145,0.85)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  subjectText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Controls
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: 'rgba(10,10,20,0.88)',
    paddingVertical: 14, paddingHorizontal: 8,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  ctrlBtn: {
    alignItems: 'center', justifyContent: 'center',
    width: 58, height: 52, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 3,
  },
  ctrlBtnOff: { backgroundColor: 'rgba(239,68,68,0.2)' },
  ctrlIcon:   { fontSize: 18 },
  ctrlLabel:  { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  endBtn: {
    alignItems: 'center', justifyContent: 'center',
    width: 58, height: 52, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderWidth: 1.5, borderColor: '#EF4444',
    gap: 3,
  },
  endIcon:     { fontSize: 18 },
  endBtnLabel: { fontSize: 9, color: '#EF4444', fontWeight: '700' },
});
