const mongoose = require('mongoose');
const Booking = require('./Booking');

const DURATIONS = [30, 60, 90, 120];
const MEETING_TYPES = ['Microsoft Teams', 'In-Person Study'];

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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      return res.status(400).json({ message: 'A valid session date is required' });
    }
    const sessionDate = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(sessionDate.getTime()) || sessionDate.toISOString().slice(0, 10) !== date) {
      return res.status(400).json({ message: 'A valid session date is required' });
    }
    if (!/^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i.test(time || '')) {
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
