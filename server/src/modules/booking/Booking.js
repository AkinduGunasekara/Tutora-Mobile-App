const mongoose = require('mongoose');

const tutorSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    initials: { type: String, default: '', trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    hourlyRate: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tutor: { type: tutorSnapshotSchema, required: true },
    sessionDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true, enum: [30, 60, 90, 120] },
    meetingType: {
      type: String,
      required: true,
      enum: ['Microsoft Teams', 'In-Person Study'],
    },
    message: { type: String, default: '', maxlength: 500, trim: true },
    rescheduleReason: { type: String, default: '', maxlength: 500, trim: true },
    cancellationReason: { type: String, default: '', maxlength: 500, trim: true },
    fees: {
      session: { type: Number, required: true, min: 0 },
      platform: { type: Number, required: true, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
