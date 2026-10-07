const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId:        { type: String, required: true },
    sessionId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    amount:           { type: Number, required: true },
    method:           { type: String, enum: ['card', 'bank_transfer', 'wallet'], required: true },
    status:           {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'cancelled'],
      default: 'pending',
    },
    bankSlipRef:      { type: String, default: '' },   // transaction ID the student types in
    bankSlipFileName: { type: String, default: '' },   // original filename
    paidBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Payment', paymentSchema);
