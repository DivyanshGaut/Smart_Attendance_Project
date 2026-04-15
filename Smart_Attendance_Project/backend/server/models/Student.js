const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const studentSchema = new mongoose.Schema(
  {
    SrNo: { type: Number, required: true, unique: true },
    studentName: { type: String, required: true, trim: true },
    rollNo: { type: String, required: true, unique: true, trim: true },
    section: { type: String, trim: true, default: 'CSE-A', index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student'], default: 'student' },
  },
  { timestamps: true }
);

// Hash password only when modified.
studentSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

studentSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Student', studentSchema, 'students');
