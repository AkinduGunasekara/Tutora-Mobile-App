const mongoose = require('mongoose');

const customSessionRequestSchema = new mongoose.Schema(
  {
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    preferredTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    estimatedBudget: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'alternative_proposed'],
      default: 'pending',
    },

    // Optional details shown on the tutor's Request Details screen
    academicLevel: { type: String, default: '' },
    learningObjective: { type: String, default: '' },
    preferredFormat: { type: String, enum: ['', 'Online', 'In-Person'], default: '' },

    // Tutor responses
    declineReason: { type: String, default: '' },
    alternative: {
      type: new mongoose.Schema({
        sessionDate: { type: Date, required: true },
        startTime: { type: String, required: true },
        note: { type: String, default: '' },
        proposedAt: { type: Date, default: Date.now },
      }, { _id: false }),
      default: null,
    },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomSessionRequest', customSessionRequestSchema);
