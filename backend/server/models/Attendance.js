const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    qrSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QrSession', index: true },
    section: { type: String, trim: true, index: true },
    subject: { type: String, required: true, trim: true, index: true },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      ipAddress: { type: String },
    },
    scanMetadata: {
      clientScanId: { type: String, trim: true },
      userAgent: { type: String, trim: true },
      accuracy: { type: Number },
    },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, subject: 1, date: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1, qrSessionId: 1 }, { unique: true, sparse: true });
attendanceSchema.index({ qrSessionId: 1, 'scanMetadata.clientScanId': 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

