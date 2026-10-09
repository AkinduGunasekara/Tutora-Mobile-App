const mongoose = require('mongoose');
const Session = require('./Session');
const Booking = require('../booking/Booking');
const {
  ensureSessionForBooking,
  completeBookingForSession,
} = require('../../shared/bookingSessionSync');

const isParticipant = (session, userId) =>
  [session.student, session.tutor].some((id) => String(id?._id ?? id) === String(userId));

// Loads a session the current user takes part in, or sends the error response and returns null
const loadOwnSession = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Session not found' });
    return null;
  }
  const session = await Session.findById(req.params.id);
  if (!session) {
    res.status(404).json({ message: 'Session not found' });
    return null;
  }
  if (!isParticipant(session, req.user.id)) {
    res.status(403).json({ message: 'Not authorised' });
    return null;
  }
  return session;
};

// GET /api/session/my
exports.getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ student: req.user.id }, { tutor: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .populate('student', 'name avatar')
      .populate('tutor', 'name avatar hourlyRate');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/session/
exports.createSession = async (req, res) => {
  try {
    const {
      bookingId, tutorId, subject,
      durationHours, hourlyRate, scheduledDate, paymentMethod,
    } = req.body;

    if (bookingId && mongoose.isValidObjectId(bookingId)) {
      const booking = await Booking.findOne({ _id: bookingId, student: req.user.id });
      if (booking) {
        // If tutor.userId is missing in the snapshot, patch it from the request body
        if (!booking.tutor.userId && tutorId && mongoose.isValidObjectId(tutorId)) {
          booking.tutor.userId = tutorId;
          await booking.save();
        }
        const existing = await ensureSessionForBooking(booking);
        if (existing) {
          if (paymentMethod && existing.paymentStatus === 'pending') {
            existing.paymentMethod = paymentMethod;
            await existing.save();
          }
          return res.status(200).json(existing);
        }
      }
    }

    if (!bookingId || !tutorId || !subject || !durationHours || !hourlyRate || !scheduledDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const hours    = parseFloat(durationHours);
    const rate     = parseFloat(hourlyRate);
    const subtotal = hours * rate;
    const fee      = Math.round(subtotal * 0.05 * 100) / 100;
    const total    = Math.round((subtotal + fee) * 100) / 100;

    const session = await Session.create({
      bookingId,
      student:       req.user.id,
      tutor:         tutorId,
      subject,
      durationHours: hours,
      hourlyRate:    rate,
      serviceFee:    fee,
      totalAmount:   total,
      scheduledDate: new Date(scheduledDate),
      paymentMethod: paymentMethod || 'card',
      paymentStatus: 'pending',
      sessionStatus: 'confirmed',
    });

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/session/:id
exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('student', 'name avatar email')
      .populate('tutor',   'name avatar hourlyRate bio subjects isVerified')
      .populate('messages.sender', 'name avatar');

    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Only participants can view
    const userId = req.user.id;
    if (session.student._id.toString() !== userId && session.tutor._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/session/:id/confirm-payment
exports.confirmPayment = async (req, res) => {
  try {
    const session = await loadOwnSession(req, res);
    if (!session) return;
    if (String(session.student) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the student can pay for this session' });
    }
    if (session.paymentStatus === 'pending') {
      session.paymentStatus = 'in_escrow';
      await session.save();
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/session/:id/start
exports.startSession = async (req, res) => {
  try {
    const session = await loadOwnSession(req, res);
    if (!session) return;
    if (session.sessionStatus === 'confirmed') {
      session.sessionStatus = 'active';
      session.startedAt = new Date();
      await session.save();
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/session/:id/message
exports.addMessage = async (req, res) => {
  try {
    const { text, attachment } = req.body;
    const session = await loadOwnSession(req, res);
    if (!session) return;

    session.messages.push({ sender: req.user.id, text: text || '', attachment: attachment || null });
    await session.save();

    const populated = await session.populate('messages.sender', 'name avatar');
    res.status(201).json(populated.messages[populated.messages.length - 1]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/session/:id/file
exports.addFile = async (req, res) => {
  try {
    const { name, type, uri, size } = req.body;
    if (!name) return res.status(400).json({ message: 'File name is required' });

    const session = await loadOwnSession(req, res);
    if (!session) return;

    session.files.push({
      name,
      type: type || 'document',
      uri: uri || '',
      size: Number(size) > 0 ? Number(size) : 0,
      uploadedBy: req.user.id,
    });
    await session.save();

    res.status(201).json(session.files[session.files.length - 1]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/session/:id/complete
exports.completeSession = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const own = await loadOwnSession(req, res);
    if (!own) return;

    if (own.sessionStatus !== 'completed' && own.sessionStatus !== 'cancelled') {
      own.sessionStatus = 'completed';
      own.completedAt = new Date();
      if (own.paymentStatus === 'in_escrow') own.paymentStatus = 'released';
    }
    if (rating !== undefined) own.rating = rating;
    if (review !== undefined) own.review = review;
    await own.save();
    if (own.sessionStatus === 'completed') await completeBookingForSession(own);

    const session = await Session.findById(own._id)
      .populate('student', 'name avatar').populate('tutor', 'name avatar');
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/session/by-booking/:bookingId
exports.getSessionByBooking = async (req, res) => {
  try {
    const session = await Session.findOne({ bookingId: req.params.bookingId })
      .populate('student', 'name avatar email')
      .populate('tutor',   'name avatar hourlyRate bio subjects isVerified')
      .populate('messages.sender', 'name avatar');
    if (!session) return res.status(404).json({ message: 'No session found for this booking' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/session/:id/code
exports.saveCodeSnapshot = async (req, res) => {
  try {
    const { language, code } = req.body;
    const session = await loadOwnSession(req, res);
    if (!session) return;

    session.codeSnapshots.push({ language: language || 'javascript', code: code || '' });
    await session.save();

    res.status(201).json(session.codeSnapshots[session.codeSnapshots.length - 1]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
