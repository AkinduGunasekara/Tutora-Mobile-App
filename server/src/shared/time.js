// Date/time helpers shared by the booking, session and tutor modules.
// Bookings store the day as UTC midnight (sessionDate) plus a "h:mm AM" string (startTime).

const pad = (n) => String(n).padStart(2, '0');

// "10:00 AM" | "10:00am" | "16:30" | "4pm" -> minutes after midnight, or null
const parseTime = (value) => {
  const raw = String(value || '').trim().toUpperCase().replace(/\./g, '');
  let match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match) {
    let hours = Number(match[1]) % 12;
    if (match[3] === 'PM') hours += 12;
    const minutes = Number(match[2] || 0);
    return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
  }
  match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
  }
  return null;
};

// minutes after midnight -> "10:00 AM"
const formatTime = (minutes) => {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m)} ${suffix}`;
};

// minutes after midnight -> "09:00" (availability storage format)
const toHHmm = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

const normalizeTime = (value) => {
  const minutes = parseTime(value);
  return minutes === null ? null : formatTime(minutes);
};

// "YYYY-MM-DD" -> Date at UTC midnight (the format Booking.sessionDate uses), or null
const parseDateKey = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed : null;
};

// Booking.sessionDate (UTC midnight) -> "YYYY-MM-DD"
const dateKeyFromSessionDate = (date) => new Date(date).toISOString().slice(0, 10);

// Local Date -> "YYYY-MM-DD"
const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Booking day + start time -> the actual start moment in server local time
const combineDateTime = (sessionDate, startTime) => {
  const [y, m, d] = dateKeyFromSessionDate(sessionDate).split('-').map(Number);
  const minutes = parseTime(startTime) ?? 0;
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
};

module.exports = {
  parseTime,
  formatTime,
  toHHmm,
  normalizeTime,
  parseDateKey,
  dateKeyFromSessionDate,
  localDateKey,
  combineDateTime,
};
