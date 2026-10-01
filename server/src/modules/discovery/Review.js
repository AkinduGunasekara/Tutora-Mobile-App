const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    tags: [{
      type: String,
      enum: ['Clear Explanation', 'Patient', 'Punctual', 'Great Material', 'Exam-Prep', 'Problem Solving'],
    }],
  },
  { timestamps: true }
);

reviewSchema.index({ tutor: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
