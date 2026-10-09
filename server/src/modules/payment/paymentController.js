const Payment = require('./Payment');

// ── CREATE ─────────────────────────────────────────────────────────────────
// POST /api/payment
exports.createPayment = async (req, res) => {
  try {
    const { bookingId, amount, method, bankSlipRef, bankSlipFileName } = req.body;

    if (!bookingId || !amount || !method) {
      return res.status(400).json({ message: 'bookingId, amount and method are required' });
    }

    const payment = await Payment.create({
      bookingId,
      amount:           parseFloat(amount),
      method,
      bankSlipRef:      bankSlipRef      || '',
      bankSlipFileName: bankSlipFileName || '',
      paidBy:           req.user.id,
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── READ (by id) ────────────────────────────────────────────────────────────
// GET /api/payment/:id
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (String(payment.paidBy) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── READ (by session) ───────────────────────────────────────────────────────
// GET /api/payment/session/:sessionId
exports.getPaymentBySession = async (req, res) => {
  try {
    const payment = await Payment.findOne({ sessionId: req.params.sessionId });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (String(payment.paidBy) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── UPDATE ─────────────────────────────────────────────────────────────────
// PATCH /api/payment/:id/verify   — marks payment as verified and links to session
exports.verifyPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot verify a cancelled payment' });
    }

    payment.status = 'verified';
    if (req.body.sessionId) payment.sessionId = req.body.sessionId;
    await payment.save();

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── DELETE ─────────────────────────────────────────────────────────────────
// DELETE /api/payment/:id   — student cancels a pending payment
exports.cancelPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (String(payment.paidBy) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised' });
    }
    if (payment.status === 'verified') {
      return res.status(400).json({ message: 'Cannot cancel a verified payment' });
    }

    payment.status = 'cancelled';
    await payment.save();

    res.json({ message: 'Payment cancelled successfully', payment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
