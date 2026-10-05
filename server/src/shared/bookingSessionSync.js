// Keeps a Booking and its Session (the payment + chat record) consistent.
// A Session is created as soon as a booking is confirmed (paymentStatus 'pending'),
// so chat works from acceptance; the student's simulated payment then moves it to 'in_escrow'.

const mongoose = require('mongoose');
const Booking = require('../modules/booking/Booking');
const Session = require('../modules/session/Session');
const { combineDateTime } = require('./time');

const SERVICE_FEE_RATE = 0.05; // same rate payment-summary.tsx shows the student

const feesFor = (durationHours, hourlyRate) => {
  const subtotal = durationHours * hourlyRate;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  const totalAmount = Math.round((subtotal + serviceFee) * 100) / 100;
  return { subtotal, serviceFee, totalAmount };
};

const subjectOf = (booking) => booking.subject || booking.tutor?.subtitle || 'Tutoring Session';

// Returns the booking's Session, creating it if needed. Returns null for bookings
// that are not linked to a tutor account (legacy data).
const ensureSessionForBooking = async (booking) => {
  const existing = await Session.findOne({ bookingId: String(booking._id) });
  if (existing) return existing;
  if (!booking.tutor?.userId) return null;

  const durationHours = booking.durationMinutes / 60;
  const { serviceFee, totalAmount } = feesFor(durationHours, booking.tutor.hourlyRate);
  return Session.create({
    bookingId: String(booking._id),
    student: booking.student?._id ?? booking.student,
    tutor: booking.tutor.userId,
    subject: subjectOf(booking),
    durationHours,
    hourlyRate: booking.tutor.hourlyRate,
    serviceFee,
    totalAmount,
    scheduledDate: combineDateTime(booking.sessionDate, booking.startTime),
    paymentStatus: 'pending',
    sessionStatus: 'confirmed',
  });
};

// After a booking's date/time/duration changes
const syncSessionSchedule = async (booking) => {
  const session = await Session.findOne({ bookingId: String(booking._id) });
  if (!session) return null;
  session.scheduledDate = combineDateTime(booking.sessionDate, booking.startTime);
  // Fees can only change while unpaid; a paid amount is never rewritten
  if (session.paymentStatus === 'pending') {
    session.durationHours = booking.durationMinutes / 60;
    const { serviceFee, totalAmount } = feesFor(session.durationHours, session.hourlyRate);
    session.serviceFee = serviceFee;
    session.totalAmount = totalAmount;
  }
  await session.save();
  return session;
};

// After a booking is cancelled: escrowed money is refunded, unpaid sessions are just cancelled
const cancelSessionForBooking = async (booking) => {
  const session = await Session.findOne({ bookingId: String(booking._id) });
  if (!session || session.sessionStatus === 'completed') return session;
  session.sessionStatus = 'cancelled';
  if (session.paymentStatus === 'in_escrow') session.paymentStatus = 'refunded';
  await session.save();
  return session;
};

// After a session is completed
const completeBookingForSession = async (session) => {
  if (!mongoose.isValidObjectId(session.bookingId)) return;
  await Booking.updateOne(
    { _id: session.bookingId, status: 'confirmed' },
    { status: 'completed' }
  );
};

module.exports = {
  SERVICE_FEE_RATE,
  feesFor,
  subjectOf,
  ensureSessionForBooking,
  syncSessionSchedule,
  cancelSessionForBooking,
  completeBookingForSession,
};
