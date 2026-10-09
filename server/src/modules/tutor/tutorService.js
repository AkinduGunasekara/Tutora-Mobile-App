// Business logic for the tutor side. Reuses Booking, Session, CustomSessionRequest and User.

const Booking = require('../booking/Booking');
const User = require('../auth/User');
const TutorSettings = require('./TutorSettings');
const { ensureSessionForBooking } = require('../../shared/bookingSessionSync');
const {
  parseTime,
  formatTime,
  normalizeTime,
  parseDateKey,
  dateKeyFromSessionDate,
  localDateKey,
} = require('../../shared/time');

const DURATIONS = [30, 60, 90, 120];
const ACTIVE_BOOKING = ['pending', 'confirmed'];

const initials = (name = '') =>
  name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// Custom requests store duration in hours; bookings only allow 30/60/90/120 minutes
const snapDuration = (value) => {
  const n = Number(value) || 1;
  const minutes = n <= 8 ? n * 60 : n;
  return DURATIONS.reduce((best, d) => (Math.abs(d - minutes) < Math.abs(best - minutes) ? d : best), 60);
};

const meetingTypeFor = (format) => (format === 'In-Person' ? 'In-Person Study' : 'Microsoft Teams');

const getSettings = async (tutorId) => {
  let settings = await TutorSettings.findOne({ tutor: tutorId });
  if (!settings) settings = await TutorSettings.create({ tutor: tutorId, weekly: [] });
  return settings;
};

// ── Slots ─────────────────────────────────────────────────────────────────────

const overlaps = (aStart, aLen, bStart, bLen) => aStart < bStart + bLen && bStart < aStart + aLen;

// Bookings (and pending reschedule proposals) that occupy time on any of the given days
const loadTakenTimes = async (tutorId, dateKeys, excludeBookingId = null) => {
  const dates = dateKeys.map(parseDateKey).filter(Boolean);
  const others = await Booking.find({
    'tutor.userId': tutorId,
    status: { $in: ACTIVE_BOOKING },
    ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
    $or: [
      { sessionDate: { $in: dates } },
      { 'rescheduleRequest.status': 'pending', 'rescheduleRequest.sessionDate': { $in: dates } },
    ],
  }).lean();
  const taken = new Map(dateKeys.map((k) => [k, []]));
  others.forEach((b) => {
    const own = dateKeyFromSessionDate(b.sessionDate);
    if (taken.has(own)) taken.get(own).push([parseTime(b.startTime), b.durationMinutes]);
    const p = b.rescheduleRequest;
    if (p?.status === 'pending') {
      const proposed = dateKeyFromSessionDate(p.sessionDate);
      if (taken.has(proposed)) taken.get(proposed).push([parseTime(p.startTime), b.durationMinutes]);
    }
  });
  return taken;
};

// Hourly start times inside the day's availability windows that do not clash with taken times
const freeStartTimes = (windows, taken, dateKey, durationMinutes) => {
  const now = new Date();
  const isToday = dateKey === localDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const slots = [];
  windows.forEach(({ start, end }) => {
    const from = parseTime(start);
    const to = parseTime(end);
    for (let t = from; t + durationMinutes <= to; t += 60) {
      if (isToday && t <= nowMinutes) continue;
      if (taken.some(([st, len]) => overlaps(t, durationMinutes, st, len))) continue;
      slots.push(t);
    }
  });
  return [...new Set(slots)].sort((a, b) => a - b).map(formatTime);
};

const windowsFor = (settings, dateKey) => {
  const date = parseDateKey(dateKey);
  return date ? settings.weekly.find((d) => d.day === date.getUTCDay())?.slots ?? [] : [];
};

// Free start times ("10:00 AM") for a day, inside the tutor's weekly availability,
// excluding times taken by other bookings or by pending reschedule proposals.
const availableSlots = async (tutorId, dateKey, durationMinutes = 60, excludeBookingId = null) => {
  const settings = await getSettings(tutorId);
  const windows = windowsFor(settings, dateKey);
  if (!windows.length) return [];
  const taken = await loadTakenTimes(tutorId, [dateKey], excludeBookingId);
  return freeStartTimes(windows, taken.get(dateKey), dateKey, durationMinutes);
};

// Weekly availability with an open/closed/booked state for each day's next occurrence
const availabilityWithStatus = async (tutorId) => {
  const settings = await getSettings(tutorId);
  const today = new Date();
  // Next occurrence after today, so slots that already passed today don't read as "booked"
  const nextKey = (day) => {
    const next = new Date(today);
    next.setDate(today.getDate() + (((day - today.getDay() + 7) % 7) || 7));
    return localDateKey(next);
  };
  const keys = Array.from({ length: 7 }, (_, day) => nextKey(day));
  const taken = await loadTakenTimes(tutorId, keys);
  const days = keys.map((key, day) => {
    const slots = settings.weekly.find((d) => d.day === day)?.slots ?? [];
    let status = slots.length ? 'open' : 'closed';
    if (slots.length && !freeStartTimes(slots, taken.get(key), key, 60).length) status = 'booked';
    return { day, slots: slots.map((sl) => ({ start: sl.start, end: sl.end })), status };
  });
  return { weekly: days, payout: settings.payout };
};

const validateWeekly = (weekly) => {
  if (!Array.isArray(weekly)) return 'Availability must be a list of days';
  const clean = [];
  for (const entry of weekly) {
    const day = Number(entry?.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) return 'Invalid day';
    const slots = (entry.slots ?? []).map((s) => [parseTime(s.start), parseTime(s.end)]);
    if (slots.some(([a, b]) => a === null || b === null || a >= b)) {
      return 'Each slot needs a start time before its end time';
    }
    slots.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < slots.length; i++) {
      if (slots[i][0] < slots[i - 1][1]) return 'Slots on the same day cannot overlap';
    }
    const pad = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    clean.push({ day, slots: slots.map(([a, b]) => ({ start: pad(a), end: pad(b) })) });
  }
  return clean;
};

// ── Requests → bookings ───────────────────────────────────────────────────────

class ServiceError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const hasClash = async (tutorId, sessionDate, startTime, durationMinutes, excludeBookingId = null) => {
  const start = parseTime(startTime);
  const sameDay = await Booking.find({
    'tutor.userId': tutorId,
    status: 'confirmed',
    sessionDate,
    ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
  }).lean();
  return sameDay.some((b) => overlaps(start, durationMinutes, parseTime(b.startTime), b.durationMinutes));
};

// Accepting a custom request creates a real confirmed Booking (+ its unpaid Session)
const createBookingFromRequest = async (request) => {
  const tutor = await User.findById(request.tutor);
  if (!tutor) throw new ServiceError(404, 'Tutor not found');
  const startTime = normalizeTime(request.preferredTime);
  if (!startTime) {
    throw new ServiceError(400, 'The requested time could not be read. Propose an alternative time instead.');
  }
  const sessionDate = parseDateKey(dateKeyFromSessionDate(request.preferredDate));
  const durationMinutes = snapDuration(request.duration);
  if (await hasClash(tutor._id, sessionDate, startTime, durationMinutes)) {
    throw new ServiceError(409, 'You already have a confirmed session at that time');
  }
  const hourlyRate = tutor.hourlyRate || 0;
  const sessionFee = Math.round(hourlyRate * durationMinutes / 60);

  const booking = await Booking.create({
    student: request.student,
    tutor: {
      userId: tutor._id,
      name: tutor.name,
      subtitle: tutor.subjects?.[0] || request.subject,
      initials: initials(tutor.name),
      hourlyRate,
    },
    sessionDate,
    startTime,
    durationMinutes,
    meetingType: meetingTypeFor(request.preferredFormat),
    message: (request.description || '').slice(0, 500),
    fees: { session: sessionFee, platform: 0, total: sessionFee },
    status: 'confirmed',
    subject: request.subject,
    customRequest: request._id,
  });
  request.status = 'accepted';
  request.booking = booking._id;
  await request.save();
  await ensureSessionForBooking(booking);
  return booking;
};

// Tutor proposes a new time for a booking (reschedule or "propose alternative").
// The booking keeps its current time until the student approves.
const proposeBookingTime = async (booking, dateKey, time, reason = '') => {
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ServiceError(400, 'Only pending or confirmed sessions can be rescheduled');
  }
  const sessionDate = parseDateKey(dateKey);
  const startTime = normalizeTime(time);
  if (!sessionDate || !startTime) throw new ServiceError(400, 'Choose a valid date and time');
  if (typeof reason !== 'string' || reason.length > 500) {
    throw new ServiceError(400, 'The reason must be 500 characters or fewer');
  }
  if (sessionDate.getTime() === new Date(booking.sessionDate).getTime() && startTime === booking.startTime) {
    throw new ServiceError(400, 'Choose a time different from the current one');
  }
  if (await hasClash(booking.tutor.userId, sessionDate, startTime, booking.durationMinutes, booking._id)) {
    throw new ServiceError(409, 'You already have a confirmed session at that time');
  }
  booking.rescheduleRequest = {
    proposedBy: 'tutor',
    sessionDate,
    startTime,
    reason: reason.trim(),
    status: 'pending',
    createdAt: new Date(),
    respondedAt: null,
  };
  await booking.save();
  return booking;
};

// Tutor's amount for a session: the session subtotal (the 5% service fee is paid by the student)
const tutorAmount = (session) => Math.round(session.durationHours * session.hourlyRate);

module.exports = {
  DURATIONS,
  ServiceError,
  initials,
  snapDuration,
  meetingTypeFor,
  getSettings,
  availableSlots,
  availabilityWithStatus,
  validateWeekly,
  createBookingFromRequest,
  proposeBookingTime,
  tutorAmount,
};
