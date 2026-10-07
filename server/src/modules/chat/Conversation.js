const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  name:     { type: String, default: '' },
  fileType: { type: String, enum: ['document', 'image', 'code', 'video'], default: 'document' },
  size:     { type: Number, default: 0 },
  content:  { type: String, default: '' }, // for code snippets
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:       { type: String, default: '' },
  read:       { type: Boolean, default: false },
  sentAt:     { type: Date, default: Date.now },
  attachment: { type: attachmentSchema, default: null },
}, { _id: true });

const fileSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  fileType:   { type: String, enum: ['document', 'image', 'code', 'video'], required: true },
  mimeType:   { type: String, default: '' },
  size:       { type: Number, default: 0 },
  content:    { type: String, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const conversationSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages:      [messageSchema],
  files:         [fileSchema],
  lastMessage:   { type: String, default: '' },
  lastMessageAt: { type: Date, default: null },
}, { timestamps: true });

// One conversation per student-tutor pair
conversationSchema.index({ student: 1, tutor: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
