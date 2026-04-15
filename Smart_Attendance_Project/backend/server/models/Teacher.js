const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const teacherSchema = new mongoose.Schema(
  {
    teacherName: { type: String, required: true, trim: true },

    teacherId: { type: String, required: true, unique: true }, // important

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    subject: { type: String }, // subject taught

    password: { type: String, required: true },

    role: { type: String, enum: ['teacher'], default: 'teacher' }
  },
  { timestamps: true }
);

teacherSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);

  next();
});

teacherSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Teacher', teacherSchema);