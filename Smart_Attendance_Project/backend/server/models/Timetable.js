const mongoose = require('mongoose');

// Simple timetable model to define scheduled classes.
// This can be extended with room, batch, semester, etc. as needed.
const timetableSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    dayOfWeek: {
      type: String,
      enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      required: true,
    },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true }, // e.g. "10:00"
    room: { type: String },
    batch: { type: String }, // optional: class/batch identifier
  },
  { timestamps: true }
);

timetableSchema.index({ teacherId: 1, dayOfWeek: 1, startTime: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);

