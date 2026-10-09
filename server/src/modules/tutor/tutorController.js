const mongoose = require('mongoose');
const Booking = require('../booking/Booking');
const Session = require('../session/Session');
const Review = require('../discovery/Review');
const CustomSessionRequest = require('../discovery/CustomSessionRequest');
const { cancelSessionForBooking } = require('../../shared/bookingSessionSync');
const { parseDateKey, localDateKey, normalizeTime } = require('../../shared/time');
const {
  ServiceError,
  getSettings,
  availableSlots,
  availabilityWithStatus,
  validateWeekly,
  createBookingFromRequest,
  proposeBookingTime,
  tutorAmount,
} = require('./tutorService');
const {
  sessionView,
  customRequestView,
  bookingRequestView,
  studentView,
} = require('./tutorViews');

const STUDENT_FIELDS = 'name email avatar year degree university isVerified';

const fail = (res, err, fallback) => {
  if (err instanceof ServiceError) return res.status(err.status).json({ message: err.message });
  return res.status(500).json({ message: fallback, error: err.message });
};

const monthRange = (monthKey) => {
  const [y, m] = (/^\d{4}-\d{2}$/.test(monthKey || '') ? monthKey : localDateKey().slice(0, 7))
    .split('-').map(Number);
  return { key: `${y}-${String(m).padStart(2, '0')}`, start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
};

// Attach each booking's Session and source request, then shape for the UI
const withSessions = async (bookings) => {
  const ids = bookings.map((b) => String(b._id));
  const [sessions, requests] = await Promise.all([
    Session.find({ bookingId: { $in: ids } }).lean(),
    CustomSessionRequest.find({ _id: { $in: bookings.map((b) => b.customRequest).filter(Boolean) } }).lean(),
  ]);
  const sessionBy = new Map(sessions.map((s) => [s.bookingId, s]));
  const requestBy = new Map(requests.map((r) => [String(r._id), r]));
  return bookings.map((b) => sessionView(b, sessionBy.get(String(b._id)) || null, requestBy.get(String(b.customRequest)) || null));
};

const loadOwnBooking = async (req) => {
  if (!mongoose.isValidObjectId(req.params.bookingId)) throw new ServiceError(404, 'Session not found');
  const booking = await Booking.findOne({ _id: req.params.bookingId, 'tutor.userId': req.user._id })
    .populate('student', STUDENT_FIELDS);
  if (!booking) throw new ServiceError(404, 'Session not found');
  return booking;
};

// ── Earnings & reviews (shared by several screens) ────────────────────────────

const PAYMENT_LABEL = {
  in_escrow: 'Held in Escrow',
  released: 'Settled to Account',
  refunded: 'Refunded to Student',
};

const nextFriday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (((5 - d.getDay()) + 7) % 7 || 7));
  return d;
};

const computeEarnings = async (tutorId, monthKey) => {
  const { key, start, end } = monthRange(monthKey);
  const sessions = await Session.find({
    tutor: tutorId,
    paymentStatus: { $in: ['in_escrow', 'released', 'refunded'] },
    scheduledDate: { $gte: start, $lt: end },
  }).populate('student', 'name').sort({ scheduledDate: -1 }).lean();

  let pending = 0;
  let settled = 0;
  const items = sessions.map((s) => {
    const amount = tutorAmount(s);
    if (s.paymentStatus === 'in_escrow') pending += amount;
    if (s.paymentStatus === 'released') settled += amount;
    return {
      sessionId: String(s._id),
      bookingId: s.bookingId,
      subject: s.subject,
      student: { id: String(s.student?._id || ''), name: s.student?.name || 'Student' },
      date: s.scheduledDate,
      amount,
      serviceFee: s.serviceFee,
      totalAmount: s.totalAmount,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      statusLabel: PAYMENT_LABEL[s.paymentStatus],
      sessionStatus: s.sessionStatus,
      completedAt: s.completedAt,
    };
  });
  return {
    month: key,
    total: pending + settled,
    pending,
    settled,
    counts: {
      all: items.length,
      paid: items.filter((i) => i.paymentStatus === 'released').length,
      pending: items.filter((i) => i.paymentStatus === 'in_escrow').length,
    },
    items,
  };
};

const ratingLabel = (avg) => {
  if (avg >= 4.5) return 'Excellent';
  if (avg >= 4) return 'Very Good';
  if (avg >= 3) return 'Good';
  if (avg > 0) return 'Fair';
  return 'No Ratings';
};

const reviewSummary = async (tutorId) => {
  const rows = await Review.aggregate([
    { $match: { tutor: new mongoose.Types.ObjectId(String(tutorId)) } },
    { $group: { _id: '$rating', n: { $sum: 1 } } },
  ]);
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let count = 0;
  let sum = 0;
  rows.forEach(({ _id, n }) => {
    const bucket = Math.min(5, Math.max(1, Math.floor(_id))); // 4.5 counts as a 4-star review
    distribution[bucket] += n;
    count += n;
    sum += _id * n;
  });
  const average = count ? Math.round((sum / count) * 10) / 10 : 0;
  return { average, count, distribution, label: ratingLabel(average) };
};

const reviewView = (r) => ({
  id: String(r._id),
  rating: r.rating,
  comment: r.comment,
  tags: r.tags || [],
  subject: r.sessionId?.subject || 'Tutoring Session',
  student: { id: String(r.student?._id || ''), name: r.student?.name || 'Student' },
  createdAt: r.createdAt,
});

// ── Requests ──────────────────────────────────────────────────────────────────

const listRequestViews = async (tutor) => {
  const [custom, bookings] = await Promise.all([
    CustomSessionRequest.find({ tutor: tutor._id }).populate('student', STUDENT_FIELDS).sort({ createdAt: -1 }).lean(),
    // Bookings made from a custom request are already represented by that request
    Booking.find({ 'tutor.userId': tutor._id, customRequest: null }).populate('student', STUDENT_FIELDS).sort({ createdAt: -1 }).lean(),
  ]);
  return [
    ...custom.map((r) => customRequestView(r, tutor.hourlyRate || 0)),
    ...bookings.map(bookingRequestView),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const isOpen = (r) => r.status === 'pending' || r.status === 'proposed';

exports.getRequests = async (req, res) => {
  try {
    const all = (await listRequestViews(req.user)).filter((r) => r.status !== 'cancelled');
    const status = req.query.status || 'all';
    const items = all.filter((r) =>
      status === 'pending' ? isOpen(r) : status === 'accepted' ? r.status === 'accepted' : true);
    res.json({
      counts: {
        all: all.length,
        pending: all.filter(isOpen).length,
        accepted: all.filter((r) => r.status === 'accepted').length,
      },
      items,
    });
  } catch (err) {
    fail(res, err, 'Could not load requests');
  }
};

const loadRequest = async (req) => {
  const { kind, id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ServiceError(404, 'Request not found');
  if (kind === 'custom') {
    const doc = await CustomSessionRequest.findOne({ _id: id, tutor: req.user._id }).populate('student', STUDENT_FIELDS);
    if (!doc) throw new ServiceError(404, 'Request not found');
    return { kind, doc };
  }
  if (kind === 'booking') {
    const doc = await Booking.findOne({ _id: id, 'tutor.userId': req.user._id }).populate('student', STUDENT_FIELDS);
    if (!doc) throw new ServiceError(404, 'Request not found');
    return { kind, doc };
  }
  throw new ServiceError(404, 'Request not found');
};

const requestViewOf = ({ kind, doc }, tutor) =>
  kind === 'custom' ? customRequestView(doc, tutor.hourlyRate || 0) : bookingRequestView(doc);

exports.getRequest = async (req, res) => {
  try {
    res.json(requestViewOf(await loadRequest(req), req.user));
  } catch (err) {
    fail(res, err, 'Could not load request');
  }
};

// Standard bookings are accepted/declined through the existing /api/bookings endpoints.
exports.acceptCustomRequest = async (req, res) => {
  try {
    req.params.kind = 'custom';
    const loaded = await loadRequest(req);
    if (!['pending', 'alternative_proposed'].includes(loaded.doc.status)) {
      throw new ServiceError(400, 'This request has already been answered');
    }
    const booking = await createBookingFromRequest(loaded.doc);
    res.json({ message: 'Request accepted', bookingId: String(booking._id), request: requestViewOf(loaded, req.user) });
  } catch (err) {
    fail(res, err, 'Could not accept request');
  }
};

exports.declineCustomRequest = async (req, res) => {
  try {
    req.params.kind = 'custom';
    const loaded = await loadRequest(req);
    if (!['pending', 'alternative_proposed'].includes(loaded.doc.status)) {
      throw new ServiceError(400, 'This request has already been answered');
    }
    loaded.doc.status = 'rejected';
    loaded.doc.declineReason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    await loaded.doc.save();
    res.json({ message: 'Request declined', request: requestViewOf(loaded, req.user) });
  } catch (err) {
    fail(res, err, 'Could not decline request');
  }
};

// Propose an alternative time for a pending request (custom or standard booking)
exports.proposeAlternative = async (req, res) => {
  try {
    const loaded = await loadRequest(req);
    const { date, time, note = '' } = req.body || {};
    if (loaded.kind === 'custom') {
      if (!['pending', 'alternative_proposed'].includes(loaded.doc.status)) {
        throw new ServiceError(400, 'This request has already been answered');
      }
      const sessionDate = parseDateKey(date);
      const startTime = normalizeTime(time);
      if (!sessionDate || !startTime) throw new ServiceError(400, 'Choose a valid date and time');
      loaded.doc.status = 'alternative_proposed';
      loaded.doc.alternative = { sessionDate, startTime, note: String(note).slice(0, 500), proposedAt: new Date() };
      await loaded.doc.save();
    } else {
      if (loaded.doc.status !== 'pending') throw new ServiceError(400, 'This request has already been answered');
      await proposeBookingTime(loaded.doc, date, time, note);
    }
    res.json({ message: 'Alternative time sent to the student', request: requestViewOf(loaded, req.user) });
  } catch (err) {
    fail(res, err, 'Could not propose a new time');
  }
};

// ── Sessions ──────────────────────────────────────────────────────────────────

exports.getSessionDetails = async (req, res) => {
  try {
    const booking = await loadOwnBooking(req);
    const [view] = await withSessions([booking.toObject()]);
    res.json(view);
  } catch (err) {
    fail(res, err, 'Could not load session');
  }
};

exports.requestReschedule = async (req, res) => {
  try {
    const booking = await loadOwnBooking(req);
    const { date, time, reason = '' } = req.body || {};
    await proposeBookingTime(booking, date, time, reason);
    const [view] = await withSessions([booking.toObject()]);
    res.json({ message: 'Reschedule request sent to the student', session: view });
  } catch (err) {
    fail(res, err, 'Could not send reschedule request');
  }
};

exports.withdrawReschedule = async (req, res) => {
  try {
    const booking = await loadOwnBooking(req);
    if (booking.rescheduleRequest?.status === 'pending') {
      booking.rescheduleRequest.status = 'withdrawn';
      booking.rescheduleRequest.respondedAt = new Date();
      await booking.save();
    }
    const [view] = await withSessions([booking.toObject()]);
    res.json({ message: 'Reschedule request withdrawn', session: view });
  } catch (err) {
    fail(res, err, 'Could not withdraw reschedule request');
  }
};

exports.cancelSession = async (req, res) => {
  try {
    const booking = await loadOwnBooking(req);
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new ServiceError(400, 'Only upcoming sessions can be cancelled');
    }
    booking.status = 'cancelled';
    booking.cancelledBy = 'tutor';
    booking.cancellationReason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : 'Cancelled by tutor';
    if (booking.rescheduleRequest?.status === 'pending') booking.rescheduleRequest.status = 'withdrawn';
    await booking.save();
    await cancelSessionForBooking(booking);
    const [view] = await withSessions([booking.toObject()]);
    res.json({ message: 'Session cancelled', session: view });
  } catch (err) {
    fail(res, err, 'Could not cancel session');
  }
};

// ── Calendar & availability ───────────────────────────────────────────────────

const upcomingConfirmed = async (tutorId, limit = 20) => {
  const todayStart = parseDateKey(localDateKey());
  const bookings = await Booking.find({
    'tutor.userId': tutorId,
    status: 'confirmed',
    sessionDate: { $gte: todayStart },
  }).populate('student', STUDENT_FIELDS).sort({ sessionDate: 1 }).lean();
  const now = Date.now();
  return (await withSessions(bookings))
    .filter((v) => new Date(v.startsAt).getTime() + v.durationMinutes * 60000 > now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .slice(0, limit);
};

exports.getCalendar = async (req, res) => {
  try {
    const { key } = monthRange(req.query.month);
    const [y, m] = key.split('-').map(Number);
    const bookings = await Booking.find({
      'tutor.userId': req.user._id,
      status: { $in: ['confirmed', 'completed'] },
      sessionDate: { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) },
    }).populate('student', STUDENT_FIELDS).lean();
    const sessions = (await withSessions(bookings)).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    const [upcoming, availability] = await Promise.all([
      upcomingConfirmed(req.user._id),
      availabilityWithStatus(req.user._id),
    ]);
    res.json({
      month: key,
      bookedDates: [...new Set(sessions.filter((s) => s.status === 'confirmed').map((s) => s.date))],
      sessions,
      upcoming,
      availability: availability.weekly,
    });
  } catch (err) {
    fail(res, err, 'Could not load calendar');
  }
};

exports.getAvailability = async (req, res) => {
  try {
    res.json(await availabilityWithStatus(req.user._id));
  } catch (err) {
    fail(res, err, 'Could not load availability');
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const weekly = validateWeekly(req.body?.weekly);
    if (typeof weekly === 'string') throw new ServiceError(400, weekly);
    const settings = await getSettings(req.user._id);
    settings.weekly = weekly.filter((d) => d.slots.length);
    await settings.save();
    res.json(await availabilityWithStatus(req.user._id));
  } catch (err) {
    fail(res, err, 'Could not save availability');
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const durationMinutes = Number(req.query.durationMinutes) || 60;
    const exclude = mongoose.isValidObjectId(req.query.bookingId) ? req.query.bookingId : null;
    const slots = await availableSlots(req.user._id, req.query.date, durationMinutes, exclude);
    const settings = await getSettings(req.user._id);
    res.json({ date: req.query.date, slots, hasAvailability: settings.weekly.some((d) => d.slots.length) });
  } catch (err) {
    fail(res, err, 'Could not load available slots');
  }
};

// ── Dashboard, earnings, reviews, messages ────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const todayKey = localDateKey();
    const todayBookings = await Booking.find({
      'tutor.userId': req.user._id,
      status: { $in: ['confirmed', 'completed'] },
      sessionDate: parseDateKey(todayKey),
    }).populate('student', STUDENT_FIELDS).lean();

    const [upcoming, today, requests, earnings, reviews, latest] = await Promise.all([
      upcomingConfirmed(req.user._id, 1),
      withSessions(todayBookings),
      listRequestViews(req.user),
      computeEarnings(req.user._id),
      reviewSummary(req.user._id),
      Review.findOne({ tutor: req.user._id }).sort({ createdAt: -1 })
        .populate('student', 'name').populate('sessionId', 'subject').lean(),
    ]);
    const open = requests.filter(isOpen);
    res.json({
      nextSession: upcoming[0] || null,
      requests: { pendingCount: open.length, items: open.slice(0, 2) },
      today: today.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
      earnings: { month: earnings.month, total: earnings.total, pending: earnings.pending, settled: earnings.settled },
      reviews: { ...reviews, latest: latest ? reviewView(latest) : null },
    });
  } catch (err) {
    fail(res, err, 'Could not load dashboard');
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const earnings = await computeEarnings(req.user._id, req.query.month);
    const settings = await getSettings(req.user._id);
    res.json({
      ...earnings,
      payout: {
        nextPayoutDate: nextFriday(),
        bankName: settings.payout?.bankName || 'Commercial Bank',
        accountLast4: settings.payout?.accountLast4 || '4821',
      },
    });
  } catch (err) {
    fail(res, err, 'Could not load earnings');
  }
};

exports.getReviews = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const sort = req.query.sort === 'highest' ? { rating: -1, createdAt: -1 }
      : req.query.sort === 'lowest' ? { rating: 1, createdAt: -1 }
      : { createdAt: -1 };
    const [summary, items] = await Promise.all([
      reviewSummary(req.user._id),
      Review.find({ tutor: req.user._id }).sort(sort).skip((page - 1) * limit).limit(limit)
        .populate('student', 'name').populate('sessionId', 'subject').lean(),
    ]);
    res.json({ ...summary, page, items: items.map(reviewView), hasMore: page * limit < summary.count });
  } catch (err) {
    fail(res, err, 'Could not load reviews');
  }
};

exports.getConversations = async (req, res) => {
  try {
    const sessions = await Session.find({ tutor: req.user._id, sessionStatus: { $ne: 'cancelled' } })
      .populate('student', STUDENT_FIELDS).lean();
    const items = sessions.map((s) => {
      const last = s.messages?.[s.messages.length - 1];
      return {
        sessionId: String(s._id),
        bookingId: s.bookingId,
        subject: s.subject,
        student: studentView(s.student),
        scheduledDate: s.scheduledDate,
        sessionStatus: s.sessionStatus,
        paymentStatus: s.paymentStatus,
        messageCount: s.messages?.length || 0,
        lastMessage: last ? {
          text: last.text || (last.attachment ? `📎 ${last.attachment.name}` : ''),
          sentAt: last.sentAt,
          mine: String(last.sender) === String(req.user._id),
        } : null,
        lastActivity: last?.sentAt || s.scheduledDate,
      };
    })
      // Hide finished sessions that never had a chat
      .filter((c) => c.lastMessage || c.sessionStatus !== 'completed')
      // Chats with messages first (newest first), then upcoming sessions by date
      .sort((a, b) => {
        if (!!a.lastMessage !== !!b.lastMessage) return a.lastMessage ? -1 : 1;
        return a.lastMessage
          ? new Date(b.lastActivity) - new Date(a.lastActivity)
          : new Date(a.lastActivity) - new Date(b.lastActivity);
      });
    res.json({ items });
  } catch (err) {
    fail(res, err, 'Could not load conversations');
  }
};

