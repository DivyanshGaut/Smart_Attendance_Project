const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    section: { type: String, trim: true, index: true },
    subject: { type: String, required: true, trim: true, index: true },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      ipAddress: { type: String },
    },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, subject: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

