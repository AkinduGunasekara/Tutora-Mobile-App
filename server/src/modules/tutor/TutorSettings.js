const mongoose = require('mongoose');

// Tutor-only settings that do not belong on the shared User profile.
const slotSchema = new mongoose.Schema(
  {
    start: { type: String, required: true, match: /^\d{2}:\d{2}$/ }, // "09:00"
    end: { type: String, required: true, match: /^\d{2}:\d{2}$/ },   // "12:00"
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
    slots: [slotSchema],
  },
  { _id: false }
);

const tutorSettingsSchema = new mongoose.Schema(
  {
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    weekly: [daySchema],
    // Prototype payout details shown on Payments & Earnings (no real bank integration)
    payout: {
      bankName: { type: String, default: 'Commercial Bank' },
      accountLast4: { type: String, default: '4821' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TutorSettings', tutorSettingsSchema);
