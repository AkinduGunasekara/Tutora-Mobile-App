const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, required: true, maxlength: 2000 },
  read:    { type: Boolean, default: false },
  sentAt:  { type: Date, default: Date.now },
}, { _id: true });

const conversationSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages:      [messageSchema],
  lastMessage:   { type: String, default: '' },
  lastMessageAt: { type: Date, default: null },
}, { timestamps: true });

// One conversation per student-tutor pair
conversationSchema.index({ student: 1, tutor: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
