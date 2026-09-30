const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'tutor'], required: true },
    avatar: { type: String, default: null },
    phone: { type: String, default: '' },

    // Student fields
    university: { type: String, default: '' },
    degree: { type: String, default: '' },
    year: { type: String, default: '' },
    studentId: { type: String, default: '' },

    // Tutor fields
    bio: { type: String, default: '' },
    subjects: [{ type: String }],
    qualifications: [{ type: String }],
    hourlyRate: { type: Number, default: 0 },
    onlineSessions: { type: Boolean, default: true },
    faceToFaceSessions: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
