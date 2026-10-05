// Shared building blocks for the tutor screens, matching the Tutor Hi-Fi designs
// (cream page, navy text, teal actions, white rounded cards, teal status pills).
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { MONDAY_FIRST, dateKey, monthTitle } from '@/lib/tutorFormat';

export const C = {
  page: '#EFEDDC',
  ink: '#171943',
  teal: '#008C91',
  tealSoft: '#E1F4EF',
  muted: '#78809A',
  card: '#FFFFFF',
  line: '#E4E1D2',
  lineSoft: '#EEEBDD',
  danger: '#EF4444',
  warn: '#B7791F',
  warnSoft: '#FDF3DC',
  star: '#F5A623',
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const goBack = (fallback: string) => {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as any);
};

// ── Headers ───────────────────────────────────────────────────────────────────

export function IconButton({ icon, onPress, label }: { icon: IconName; onPress?: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={18} color={C.teal} />
    </Pressable>
  );
}

// Large title header used on tab screens ("Tutor Dashboard", "My Calendar", "Session Requests")
export function TabHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={s.tabHeader}>
      <View style={{ flex: 1 }}>
        <Text style={s.tabTitle}>{title}</Text>
        {!!subtitle && <Text style={s.tabSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

// Back-arrow header used on pushed screens ("← Request Details")
export function BackHeader({
  title, onBack, right,
}: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <View style={s.backHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} hitSlop={12}>
        <Ionicons name="arrow-back" size={24} color={C.ink} />
      </Pressable>
      <Text style={s.backTitle} numberOfLines={1}>{title}</Text>
      {right}
    </View>
  );
}

// ── Sections & cards ──────────────────────────────────────────────────────────

export function SectionHeader({
  title, badge, right, linkLabel, onLink,
}: { title: string; badge?: string; right?: React.ReactNode; linkLabel?: string; onLink?: () => void }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionLeft}>
        <Text style={s.sectionTitle}>{title}</Text>
        {!!badge && <Pill label={badge} tone="soft" small />}
      </View>
      {right}
      {!!linkLabel && <LinkText label={linkLabel} onPress={onLink} />}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Divider({ dashed = false, style }: { dashed?: boolean; style?: StyleProp<ViewStyle> }) {
  return <View style={[dashed ? s.dashed : s.divider, style]} />;
}

export function Label({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.label, style]}>{children}</Text>;
}

// "Student: ........ Shahan W."
export function InfoRow({ label, value, valueStyle, right }: {
  label: string; value?: string; valueStyle?: StyleProp<TextStyle>; right?: React.ReactNode;
}) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      {right ?? <Text style={[s.infoValue, valueStyle]} numberOfLines={2}>{value}</Text>}
    </View>
  );
}

// "DATE & TIME / Today, 10:00 - 11:00 AM" two-column block
export function KeyValue({ label, value, style }: { label: string; value: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flex: 1, gap: 4 }, style]}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value}</Text>
    </View>
  );
}

// ── Pills & buttons ───────────────────────────────────────────────────────────

export type PillTone = 'soft' | 'outline' | 'solid' | 'muted' | 'warn' | 'danger';

const PILL_TONES: Record<PillTone, { box: ViewStyle; color: string }> = {
  soft: { box: { backgroundColor: C.tealSoft }, color: C.teal },
  outline: { box: { backgroundColor: C.card, borderWidth: 1.2, borderColor: C.teal }, color: C.teal },
  solid: { box: { backgroundColor: C.teal }, color: '#fff' },
  muted: { box: { backgroundColor: '#EEEDE6' }, color: C.muted },
  warn: { box: { backgroundColor: C.warnSoft }, color: C.warn },
  danger: { box: { backgroundColor: '#FDECEC' }, color: C.danger },
};

export function Pill({ label, tone = 'soft', dot, small, icon }: {
  label: string; tone?: PillTone; dot?: boolean; small?: boolean; icon?: IconName;
}) {
  const { box, color } = PILL_TONES[tone];
  return (
    <View style={[s.pill, small && s.pillSmall, box]}>
      {dot && <View style={[s.pillDot, { backgroundColor: color }]} />}
      {icon && <Ionicons name={icon} size={11} color={color} />}
      <Text style={[s.pillText, small && { fontSize: 9 }, { color }]}>{label}</Text>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
  compact?: boolean;
};

export function PrimaryButton({ label, onPress, loading, disabled, style, icon, compact }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, compact && s.btnCompact, s.btnPrimary, (disabled || loading) && s.btnDisabled, pressed && { opacity: 0.85 }, style]}>
      {loading ? <ActivityIndicator color="#fff" size="small" /> : (
        <>
          {icon && <Ionicons name={icon} size={16} color="#fff" />}
          <Text style={[s.btnText, s.btnTextPrimary]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, loading, disabled, style, icon, compact, danger, small }: ButtonProps & { danger?: boolean; small?: boolean }) {
  const color = danger ? C.danger : C.teal;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, compact && s.btnCompact, s.btnOutline, { borderColor: danger ? '#F3C4C4' : C.teal }, (disabled || loading) && s.btnDisabled, pressed && { opacity: 0.7 }, style]}>
      {loading ? <ActivityIndicator color={color} size="small" /> : (
        <>
          {icon && <Ionicons name={icon} size={16} color={color} />}
          <Text style={[s.btnText, { color }, small && { fontSize: 11, letterSpacing: 0.3 }]} numberOfLines={1}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// White button with a soft border (e.g. "DECLINE", "CANCEL & KEEP ORIGINAL TIME")
export function GhostButton({ label, onPress, loading, disabled, style, compact }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, compact && s.btnCompact, s.btnGhost, (disabled || loading) && s.btnDisabled, pressed && { opacity: 0.7 }, style]}>
      {loading ? <ActivityIndicator color={C.ink} size="small" /> : <Text style={[s.btnText, { color: C.ink }]}>{label}</Text>}
    </Pressable>
  );
}

export function LinkText({ label, onPress, style }: { label: string; onPress?: () => void; style?: StyleProp<TextStyle> }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
      <Text style={[s.link, style]}>{label}</Text>
    </Pressable>
  );
}

// Filter chips ("All (3)", "Pending (3)", "Accepted")
export function Chips<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={s.chipRow}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.chip, active && s.chipActive]}>
            <Text style={[s.chipText, active && s.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Avatars, stars, states ────────────────────────────────────────────────────

export function PersonAvatar({ size = 56, label }: { size?: number; label?: string }) {
  return (
    <View style={[s.personAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="person-outline" size={size * 0.42} color={C.teal} />
      {!!label && <Text style={s.personAvatarLabel}>{label}</Text>}
    </View>
  );
}

export function InitialsBadge({ initials, size = 26 }: { initials: string; size?: number }) {
  return (
    <View style={[s.initials, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.initialsText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name: IconName = rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline';
        return <Ionicons key={i} name={name} size={size} color={C.star} />;
      })}
    </View>
  );
}

export function Loading() {
  return (
    <View style={s.center}>
      <ActivityIndicator color={C.teal} size="large" />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={{ alignItems: 'center', gap: 10 }}>
      <Ionicons name="cloud-offline-outline" size={28} color={C.muted} />
      <Text style={s.emptyText}>{message}</Text>
      {onRetry && <OutlineButton label="TRY AGAIN" onPress={onRetry} compact style={{ alignSelf: 'stretch' }} />}
    </Card>
  );
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return (
    <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 24 }}>
      <Ionicons name={icon} size={28} color={C.teal} />
      <Text style={s.emptyTitle}>{title}</Text>
      {!!text && <Text style={s.emptyText}>{text}</Text>}
    </Card>
  );
}

export function FooterNote({ text }: { text: string }) {
  return <Text style={s.footerNote}>{text}</Text>;
}

// ── Dialogs (RN Alert is a no-op on web, so tutor screens use these) ──────────

export function Sheet({
  visible, title, onClose, children,
}: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.sheetBackdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{title}</Text>
            <Pressable accessibilityLabel="Close" onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={C.muted} />
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Pick one option (filters / sort)
export function OptionSheet<T extends string>({
  visible, title, options, value, onSelect, onClose,
}: {
  visible: boolean; title: string; options: { value: T; label: string }[];
  value: T; onSelect: (v: T) => void; onClose: () => void;
}) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      {options.map((o) => (
        <Pressable key={o.value} style={s.optionRow} onPress={() => { onSelect(o.value); onClose(); }}>
          <Text style={[s.optionText, o.value === value && { color: C.teal, fontWeight: '800' }]}>{o.label}</Text>
          {o.value === value && <Ionicons name="checkmark" size={18} color={C.teal} />}
        </Pressable>
      ))}
    </Sheet>
  );
}

export function ConfirmSheet({
  visible, title, message, confirmLabel, danger, loading, onConfirm, onClose, children,
}: {
  visible: boolean; title: string; message: string; confirmLabel: string; danger?: boolean;
  loading?: boolean; onConfirm: () => void; onClose: () => void; children?: React.ReactNode;
}) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <Text style={s.sheetMessage}>{message}</Text>
      {children}
      <View style={{ gap: 10, marginTop: 6 }}>
        {danger
          ? <OutlineButton label={confirmLabel} danger onPress={onConfirm} loading={loading} />
          : <PrimaryButton label={confirmLabel} onPress={onConfirm} loading={loading} />}
        <GhostButton label="Go Back" onPress={onClose} disabled={loading} />
      </View>
    </Sheet>
  );
}

// Inline notice for success / error feedback
export function Banner({ text, tone = 'info', onClose }: { text: string; tone?: 'info' | 'error' | 'success'; onClose?: () => void }) {
  if (!text) return null;
  const color = tone === 'error' ? C.danger : C.teal;
  const icon: IconName = tone === 'error' ? 'alert-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline';
  return (
    <View style={[s.banner, tone === 'error' && { backgroundColor: '#FDECEC', borderColor: '#F3C4C4' }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[s.bannerText, { color: tone === 'error' ? C.danger : C.ink }]}>{text}</Text>
      {onClose && (
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={16} color={C.muted} />
        </Pressable>
      )}
    </View>
  );
}

// ── Month calendar (Monday-first, as in "My Calendar" and "Reschedule Session") ──

const WEEK_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function MonthCalendar({
  month, onMonthChange, selected, onSelect, marked, isDisabled, crossed, legend,
}: {
  month: Date;
  onMonthChange: (next: Date) => void;
  selected?: string;
  onSelect?: (key: string) => void;
  marked?: Set<string>;
  isDisabled?: (key: string) => boolean;
  crossed?: string;
  legend?: React.ReactNode;
}) {
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = MONDAY_FIRST.indexOf(first.getDay());
    const start = new Date(first);
    start.setDate(first.getDate() - lead);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const total = Math.ceil((lead + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { key: dateKey(d), day: d.getDate(), inMonth: d.getMonth() === month.getMonth(), weekend: d.getDay() === 0 || d.getDay() === 6 };
    });
  }, [month]);

  const step = (n: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <Card style={{ paddingHorizontal: 12 }}>
      <View style={s.calHeader}>
        <Pressable accessibilityLabel="Previous month" onPress={() => step(-1)} style={s.calArrow} hitSlop={6}>
          <Ionicons name="chevron-back" size={14} color={C.ink} />
        </Pressable>
        <Text style={s.calTitle}>{monthTitle(month).toUpperCase()}</Text>
        <Pressable accessibilityLabel="Next month" onPress={() => step(1)} style={s.calArrow} hitSlop={6}>
          <Ionicons name="chevron-forward" size={14} color={C.ink} />
        </Pressable>
      </View>
      <View style={s.calRow}>
        {WEEK_LABELS.map((w) => <Text key={w} style={s.calWeekday}>{w}</Text>)}
      </View>
      <View style={s.calGrid}>
        {cells.map((c) => {
          const isSel = c.key === selected;
          const disabled = !c.inMonth || (isDisabled?.(c.key) ?? false);
          const isCrossed = c.key === crossed;
          return (
            <Pressable
              key={c.key}
              disabled={disabled || !onSelect}
              onPress={() => onSelect?.(c.key)}
              style={s.calCell}>
              <View style={[s.calDay, isSel && s.calDaySelected]}>
                <Text style={[
                  s.calDayText,
                  (c.weekend || !c.inMonth || disabled) && s.calDayMuted,
                  isCrossed && s.calDayCrossed,
                  isSel && s.calDayTextSelected,
                ]}>{c.day}</Text>
              </View>
              <View style={[s.calDot, c.inMonth && marked?.has(c.key) && !isCrossed && s.calDotOn]} />
            </Pressable>
          );
        })}
      </View>
      {legend && (<><Divider style={{ marginTop: 6 }} /><View style={s.calLegend}>{legend}</View></>)}
    </Card>
  );
}

export function LegendItem({ label, ring }: { label: string; ring?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={ring ? s.legendRing : s.legendDot} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const shadow = {
  shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 }, elevation: 2,
};

export const s = StyleSheet.create({
  // layout used by every tutor screen
  safe: { flex: 1, backgroundColor: C.page },
  scroll: { padding: 16, paddingBottom: 32, gap: 14, width: '100%', maxWidth: 560, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  tabHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6, gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' },
  tabTitle: { fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  tabSubtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
  backHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 12, width: '100%', maxWidth: 560, alignSelf: 'center' },
  backTitle: { flex: 1, fontSize: 21, fontWeight: '800', color: C.ink },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.ink, letterSpacing: 0.4 },

  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.lineSoft, ...shadow },
  divider: { height: 1, backgroundColor: C.lineSoft },
  dashed: { borderBottomWidth: 1, borderColor: C.line, borderStyle: 'dashed' },
  label: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase' },

  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 3 },
  infoLabel: { fontSize: 13, color: C.muted },
  infoValue: { fontSize: 13, fontWeight: '700', color: C.ink, textAlign: 'right', flexShrink: 1 },
  kvLabel: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 0.6 },
  kvValue: { fontSize: 13, fontWeight: '700', color: C.ink },

  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillSmall: { paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  pillDot: { width: 5, height: 5, borderRadius: 3 },

  btn: { minHeight: 46, borderRadius: 23, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnCompact: { minHeight: 40, borderRadius: 20 },
  btnPrimary: { backgroundColor: C.teal, ...shadow },
  btnOutline: { backgroundColor: C.card, borderWidth: 1.5 },
  btnGhost: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  btnTextPrimary: { color: '#fff' },
  link: { fontSize: 11, fontWeight: '800', color: C.teal, textDecorationLine: 'underline', letterSpacing: 0.4 },

  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  chipActive: { backgroundColor: C.teal, borderColor: C.teal },
  chipText: { fontSize: 13, fontWeight: '700', color: C.ink },
  chipTextActive: { color: '#fff' },

  personAvatar: { borderWidth: 1.5, borderColor: '#BFE3DF', backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  personAvatarLabel: { fontSize: 8, fontWeight: '800', color: C.teal, marginTop: 2 },
  initials: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontWeight: '800', color: C.teal },

  emptyTitle: { fontSize: 14, fontWeight: '800', color: C.ink, textAlign: 'center' },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },
  footerNote: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 4 },

  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  calArrow: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  calTitle: { fontSize: 15, fontWeight: '800', color: C.ink, letterSpacing: 0.8 },
  calRow: { flexDirection: 'row' },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '800', color: C.muted, marginBottom: 6 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  calDay: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calDaySelected: { backgroundColor: C.teal },
  calDayText: { fontSize: 13, fontWeight: '600', color: C.ink },
  calDayMuted: { color: '#B5B9C6' },
  calDayCrossed: { textDecorationLine: 'line-through', color: '#B5B9C6' },
  calDayTextSelected: { color: '#fff', fontWeight: '800' },
  calDot: { width: 5, height: 5, borderRadius: 3, marginTop: 1, backgroundColor: 'transparent' },
  calDotOn: { backgroundColor: C.teal },
  calLegend: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.teal },
  legendRing: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: C.teal, backgroundColor: C.card },
  legendText: { fontSize: 11, color: C.ink },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(23,25,67,0.35)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 560, backgroundColor: C.page, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 32, gap: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  sheetMessage: { fontSize: 14, color: C.muted, lineHeight: 20 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: C.lineSoft },
  optionText: { fontSize: 14, fontWeight: '600', color: C.ink },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink, minHeight: 48 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.tealSoft, borderWidth: 1, borderColor: '#BFE3DF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
