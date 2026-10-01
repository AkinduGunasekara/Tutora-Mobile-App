const Session = require('./Session');

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
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'in_escrow' },
      { returnDocument: 'after' }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/session/:id/start
exports.startSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { sessionStatus: 'active', startedAt: new Date() },
      { returnDocument: 'after' }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/session/:id/message
exports.addMessage = async (req, res) => {
  try {
    const { text, attachment } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

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
    const { name, type, uri } = req.body;
    if (!name) return res.status(400).json({ message: 'File name is required' });

    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.files.push({ name, type: type || 'document', uri: uri || '', uploadedBy: req.user.id });
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
    const updates = {
      sessionStatus: 'completed',
      paymentStatus: 'released',
      completedAt:   new Date(),
    };
    if (rating !== undefined) updates.rating = rating;
    if (review !== undefined) updates.review = review;

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      updates,
      { returnDocument: 'after' }
    ).populate('student', 'name avatar').populate('tutor', 'name avatar');

    if (!session) return res.status(404).json({ message: 'Session not found' });
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
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.codeSnapshots.push({ language: language || 'javascript', code: code || '' });
    await session.save();

    res.status(201).json(session.codeSnapshots[session.codeSnapshots.length - 1]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
