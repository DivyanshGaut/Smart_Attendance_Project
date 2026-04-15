const mongoose = require('mongoose');

const qrSessionSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    section: { type: String, trim: true, index: true },
    qrToken: { type: String, required: true, unique: true, index: true },
    expiryTime: { type: Date, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QrSession', qrSessionSchema);

