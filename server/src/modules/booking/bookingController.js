const mongoose = require('mongoose');
const Booking = require('./Booking');

const DURATIONS = [30, 60, 90, 120];
const MEETING_TYPES = ['Microsoft Teams', 'In-Person Study'];
const isValidTime = (time) => /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i.test(time || '');
const getSessionDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? parsed : null;
};

exports.listBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [
        { student: req.user._id },
        { 'tutor.userId': req.user._id },
      ],
    })
      .populate('student', 'name email')
      .sort({ sessionDate: 1, createdAt: -1 });

    return res.json({ bookings });
  } catch (err) {
    return res.status(500).json({ message: 'Could not load bookings', error: err.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can create bookings' });
    }

    const {
      date,
      time,
      durationMinutes,
      meetingType,
      message = '',
      tutor,
    } = req.body;

    const sessionDate = getSessionDate(date);
    if (!sessionDate) {
      return res.status(400).json({ message: 'A valid session date is required' });
    }
    if (!isValidTime(time)) {
      return res.status(400).json({ message: 'A valid session start time is required' });
    }
    if (!DURATIONS.includes(Number(durationMinutes))) {
      return res.status(400).json({ message: 'Choose a valid session duration' });
    }
    if (!MEETING_TYPES.includes(meetingType)) {
      return res.status(400).json({ message: 'Choose a valid meeting type' });
    }
    if (typeof message !== 'string' || message.length > 500) {
      return res.status(400).json({ message: 'The message must be 500 characters or fewer' });
    }
    if (!tutor || typeof tutor.name !== 'string' || !tutor.name.trim()) {
      return res.status(400).json({ message: 'Tutor details are required' });
    }

    const hourlyRate = Number(tutor.hourlyRate);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      return res.status(400).json({ message: 'A valid tutor hourly rate is required' });
    }

    let tutorUserId = null;
    if (tutor.userId) {
      if (!mongoose.isValidObjectId(tutor.userId)) {
        return res.status(400).json({ message: 'Tutor account ID is invalid' });
      }
      tutorUserId = tutor.userId;
    }

    const sessionFee = Math.round(hourlyRate * Number(durationMinutes) / 60);
    const booking = await Booking.create({
      student: req.user._id,
      tutor: {
        userId: tutorUserId,
        name: tutor.name.trim(),
        subtitle: typeof tutor.subtitle === 'string' ? tutor.subtitle.trim() : '',
        initials: typeof tutor.initials === 'string' ? tutor.initials.trim() : '',
        rating: Number.isFinite(Number(tutor.rating)) ? Number(tutor.rating) : 0,
        reviewCount: Number.isFinite(Number(tutor.reviewCount)) ? Number(tutor.reviewCount) : 0,
        hourlyRate,
      },
      sessionDate,
      startTime: time.trim().toUpperCase().replace(/\s+/g, ' '),
      durationMinutes: Number(durationMinutes),
      meetingType,
      message: message.trim(),
      fees: { session: sessionFee, platform: 0, total: sessionFee },
      status: 'pending',
    });

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        student: booking.student,
        tutor: booking.tutor,
        sessionDate: booking.sessionDate,
        startTime: booking.startTime,
        durationMinutes: booking.durationMinutes,
        meetingType: booking.meetingType,
        message: booking.message,
        fees: booking.fees,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Could not create booking', error: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Booking ID is invalid' });
    }
    const booking = await Booking.findOne({ _id: req.params.id, student: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Only pending or confirmed bookings can be cancelled' });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    await booking.save();
    return res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    return res.status(500).json({ message: 'Could not cancel booking', error: err.message });
  }
};

exports.rescheduleBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Booking ID is invalid' });
    }
    const { date, time, durationMinutes, meetingType, message = '', reason = '' } = req.body;
    const sessionDate = getSessionDate(date);
    if (!sessionDate) return res.status(400).json({ message: 'A valid session date is required' });
    if (!isValidTime(time)) return res.status(400).json({ message: 'A valid session start time is required' });
    if (!DURATIONS.includes(Number(durationMinutes))) {
      return res.status(400).json({ message: 'Choose a valid session duration' });
    }
    if (!MEETING_TYPES.includes(meetingType)) {
      return res.status(400).json({ message: 'Choose a valid meeting type' });
    }
    if (typeof message !== 'string' || message.length > 500) {
      return res.status(400).json({ message: 'The message must be 500 characters or fewer' });
    }
    if (typeof reason !== 'string' || reason.length > 500) {
      return res.status(400).json({ message: 'The reason must be 500 characters or fewer' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, student: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed bookings can be rescheduled' });
    }

    booking.sessionDate = sessionDate;
    booking.startTime = time.trim().toUpperCase().replace(/\s+/g, ' ');
    booking.durationMinutes = Number(durationMinutes);
    booking.meetingType = meetingType;
    booking.message = message.trim();
    booking.rescheduleReason = reason.trim();
    const fee = Math.round(booking.tutor.hourlyRate * booking.durationMinutes / 60);
    booking.fees = { session: fee, platform: 0, total: fee };
    await booking.save();
    return res.json({ message: 'Booking rescheduled', booking });
  } catch (err) {
    return res.status(500).json({ message: 'Could not reschedule booking', error: err.message });
  }
};

exports.acceptBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Booking ID is invalid' });
    }
    const booking = await Booking.findById(req.params.id).populate('student', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.tutor.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your booking to accept' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not pending' });
    }
    booking.status = 'confirmed';
    await booking.save();
    return res.json({ message: 'Booking accepted', booking });
  } catch (err) {
    return res.status(500).json({ message: 'Could not accept booking', error: err.message });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Booking ID is invalid' });
    }
    const booking = await Booking.findById(req.params.id).populate('student', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.tutor.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your booking to reject' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not pending' });
    }
    booking.status = 'cancelled';
    booking.cancellationReason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : 'Rejected by tutor';
    await booking.save();
    return res.json({ message: 'Booking rejected', booking });
  } catch (err) {
    return res.status(500).json({ message: 'Could not reject booking', error: err.message });
  }
};
