// Formatting helpers shared by the tutor screens.
import type { PaymentStatus } from '@/lib/tutorApi';

const pad = (n: number) => String(n).padStart(2, '0');

export const money = (n: number | null | undefined) =>
  `Rs. ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const fromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d || 1);
};

export const todayKey = () => dateKey(new Date());

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// "Today" / "Tomorrow" / "Friday" (within a week) / "Oct 20"
export const relativeDay = (key: string) => {
  const today = new Date();
  if (key === dateKey(today)) return 'Today';
  if (key === dateKey(addDays(today, 1))) return 'Tomorrow';
  const d = fromKey(key);
  const diff = (d.getTime() - fromKey(dateKey(today)).getTime()) / 86400000;
  if (diff > 1 && diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return shortDate(key);
};

export const shortDate = (key: string) => fromKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const weekdayDate = (key: string) =>
  fromKey(key).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
export const longDate = (key: string) =>
  fromKey(key).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
export const monthTitle = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

// ISO date (e.g. payment/review dates) → "Oct 12"
export const isoShort = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const isoWeekday = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

// "10:00 AM" + "11:00 AM" → "10:00 - 11:00 AM"; mixed → "11:30 AM - 12:30 PM"
export const timeRange = (start: string, end: string) => {
  if (!end) return start;
  const [s, sSuffix] = start.split(' ');
  const [, eSuffix] = end.split(' ');
  return sSuffix === eSuffix ? `${s} - ${end}` : `${start} - ${end}`;
};

export const durationLabel = (minutes: number) => {
  if (minutes < 60) return `${minutes} Mins`;
  const hours = minutes / 60;
  return `${hours} Hour${hours === 1 ? '' : 's'} (${minutes} Mins)`;
};

export const shortDuration = (minutes: number) =>
  minutes < 60 ? `${minutes} Min` : `${minutes / 60} Hour${minutes === 60 ? '' : 's'}`;

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return isoShort(iso);
};

// "Dilshan Kumara" → "Dilshan K."
export const shortName = (name: string) => {
  const [first, last] = name.split(' ');
  return last ? `${first} ${last[0]}.` : first;
};

export const initialsOf = (name = '') =>
  name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// Minutes until a session starts → "IN 45 MIN" / "IN 3 HRS" / "IN 2 DAYS" / "LIVE NOW"
export const countdown = (startsAt: string, durationMinutes: number) => {
  const start = new Date(startsAt).getTime();
  const now = Date.now();
  if (now >= start && now < start + durationMinutes * 60000) return 'LIVE NOW';
  if (now >= start) return 'ENDED';
  const mins = Math.round((start - now) / 60000);
  if (mins < 60) return `IN ${mins} MIN`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `IN ${hours} HR${hours === 1 ? '' : 'S'}`;
  const days = Math.round(hours / 24);
  return `IN ${days} DAY${days === 1 ? '' : 'S'}`;
};

export const paymentBadge = (status?: PaymentStatus | null) => {
  switch (status) {
    case 'in_escrow': return { label: 'PAID', tone: 'soft' as const };
    case 'released': return { label: 'SETTLED', tone: 'soft' as const };
    case 'refunded': return { label: 'REFUNDED', tone: 'muted' as const };
    default: return { label: 'AWAITING PAYMENT', tone: 'warn' as const };
  }
};

export const requestBadge = (status: string) => {
  switch (status) {
    case 'pending': return { label: 'PENDING', tone: 'soft' as const };
    case 'proposed': return { label: 'TIME PROPOSED', tone: 'warn' as const };
    case 'accepted': return { label: 'ACCEPTED', tone: 'outline' as const };
    case 'declined': return { label: 'DECLINED', tone: 'muted' as const };
    default: return { label: 'CANCELLED', tone: 'muted' as const };
  }
};

// "Algorithms (SWE-302)" has a course code → "SUBJECT & CODE", otherwise "SUBJECT"
export const subjectLabel = (subject: string) => (/\(.+\)/.test(subject) ? 'Subject & Code' : 'Subject');

export const formatLabel = (format: string, meetingType: string) =>
  format === 'In-Person' ? 'In-Person' : `Online (${meetingType === 'Microsoft Teams' ? 'Meeting Room' : meetingType})`;

export const fileSize = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// "09:00" → "09:00 AM" (availability rows) and back
export const hhmmTo12 = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(h12)}:${pad(m)} ${suffix}`;
};

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];
