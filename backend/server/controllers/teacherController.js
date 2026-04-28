const QrSession = require('../models/QrSession');
const { generateQrSchema } = require('../utils/validators');
const { generateQrToken, generateQrCodeDataUrl } = require('../utils/qr');
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");


// ================= TEACHER LOGIN =================

const teacherLogin = async (req, res) => {

  const { email, password } = req.body;

  try {

    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    const isMatch = await teacher.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    res.json({
      message: "Login successful",
      teacher: {
        teacherName: teacher.teacherName,
        email: teacher.email,
        role: teacher.role
      }
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error"
    });

  }
};


// ================= GENERATE QR =================

const generateQr = async (req, res, next) => {

  try {

    const { error, value } = generateQrSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { subject, section, latitude, longitude, expirySeconds } = value;

    const qrToken = generateQrToken();

    const now = new Date();
    const expiryTime = new Date(now.getTime() + expirySeconds * 1000);

    // deactivate old sessions
    await QrSession.updateMany(
      { teacherId: req.user.id, subject, section, isActive: true },
      { $set: { isActive: false } }
    );

    const session = await QrSession.create({
      teacherId: req.user.id,
      subject,
      section,
      qrToken,
      expiryTime,
      latitude,
      longitude,
      isActive: true
    });

    const qrCodeDataUrl = await generateQrCodeDataUrl({
      sessionId: session._id.toString(),
      teacherId: req.user.id,
      subject,
      section,
      qrToken,
      issuedAt: now.toISOString(),
      expiresAt: expiryTime.toISOString()
    });

    res.status(201).json({
      message: "QR session created",
      qrCodeDataUrl,
      session: {
        id: session._id,
        subject: session.subject,
        section: session.section,
        expiryTime: session.expiryTime
      }
    });

  } catch (err) {

    next(err);

  }

};


// ================= REPORT =================
const getMonthlyReport = async (req, res) => {
  try {
    const students = await Student.find();

    const report = students.map(s => ({
      rollNo: s.rollNo,
      name: s.studentName,
      attendance: s.attendance || 0,
      classes: `${s.attended || 0}/${s.total || 0}`
    }));

    res.json(report);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= DEFAULTERS =================
const getDefaulters = async (req, res) => {
  try {
    const students = await Student.find();

    const defaulters = students
      .map(s => {
        const attended = s.attended || 0;
        const total = s.total || 0;
        const attendance = total === 0 ? 0 : Math.round((attended / total) * 100);

        return {
          rollNo: s.rollNo,
          name: s.studentName,
          attendance,
          classes: `${attended}/${total}`
        };
      })
      .filter(s => s.attendance < 75);

    res.json(defaulters);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = {
  getMonthlyReport,
  getDefaulters,
  teacherLogin,
  generateQr
};
