const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  type:       { type: String, enum: ['document', 'image', 'code', 'video', 'pdf'] },
  uri:        { type: String, default: '' },
  size:       { type: Number, default: 0 }, // bytes
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:       { type: String, default: '' },
  attachment: { type: attachmentSchema, default: null },
  sentAt:     { type: Date, default: Date.now },
}, { _id: true });

const sessionSchema = new mongoose.Schema({
  bookingId:      { type: String, required: true },
  student:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutor:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:        { type: String, required: true },
  durationHours:  { type: Number, required: true },
  hourlyRate:     { type: Number, required: true },
  serviceFee:     { type: Number, required: true },
  totalAmount:    { type: Number, required: true },
  scheduledDate:  { type: Date, required: true },
  paymentMethod:  {
    type: String,
    enum: ['card', 'bank_transfer', 'wallet'],
    default: 'card',
  },
  paymentStatus:  {
    type: String,
    enum: ['pending', 'in_escrow', 'released', 'refunded'],
    default: 'pending',
  },
  sessionStatus:  {
    type: String,
    enum: ['confirmed', 'active', 'completed', 'cancelled'],
    default: 'confirmed',
  },
  startedAt:      { type: Date, default: null },
  completedAt:    { type: Date, default: null },
  messages:       [messageSchema],
  files:          [attachmentSchema],
  codeSnapshots:  [{
    language: { type: String, default: 'javascript' },
    code:     { type: String, default: '' },
    savedAt:  { type: Date, default: Date.now },
  }],
  rating:  { type: Number, min: 1, max: 5, default: null },
  review:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
