const Attendance = require('../models/Attendance');
const QrSession = require('../models/QrSession');
const Student = require('../models/Student');
const { scanQrSchema } = require('../utils/validators');
const { isWithinRadius } = require('../utils/geo');
const { sendWarningEmail } = require('../utils/mailer');

// Helper: compute percentage and trigger warnings if < 50%.
const maybeTriggerLowAttendanceWarning = async (studentId) => {
  const total = await Attendance.countDocuments({ studentId });
  if (total === 0) return;

  const presentCount = await Attendance.countDocuments({ studentId, status: 'present' });
  const percentage = (presentCount / total) * 100;

  if (percentage < 50) {
    const student = await Student.findById(studentId);
    // For demonstration, assume parent email is constructed from rollNo.
    const parentEmail = `${student.rollNo.toLowerCase()}@parents.example.com`;
    await sendWarningEmail({
      to: parentEmail,
      studentName: student.studentName,
      attendancePercentage: percentage.toFixed(2),
    });
  }
};

// POST /student/scan-qr
// Body: { qrToken, latitude, longitude }
// Uses JWT student identity from req.user.
const scanQr = async (req, res, next) => {
  try {
    const { error, value } = scanQrSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { qrToken, latitude, longitude } = value;
    const allowInsecureDevAttendance = process.env.ALLOW_INSECURE_DEV_ATTENDANCE === 'true';

    const session = await QrSession.findOne({ qrToken });
    if (!session || !session.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive QR session' });
    }

    const now = new Date();
    if (now > session.expiryTime) {
      return res.status(400).json({ message: 'QR code has expired' });
    }

    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (session.section && student.section && session.section !== student.section) {
      return res.status(400).json({ message: 'QR code is for a different section' });
    }

    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

    if (hasCoordinates) {
      const withinRadius = isWithinRadius(
        session.latitude,
        session.longitude,
        latitude,
        longitude,
        Number(process.env.ATTENDANCE_RADIUS_METERS) || 100
      );

      if (!withinRadius) {
        return res.status(400).json({ message: 'Location outside allowed range' });
      }
    } else if (!allowInsecureDevAttendance) {
      return res.status(400).json({ message: 'Location is required to mark attendance' });
    }

    // Prevent duplicate attendance (same date+subject)
    const dateOnly = new Date(now.toDateString());
    const existing = await Attendance.findOne({
      studentId: req.user.id,
      subject: session.subject,
      date: dateOnly,
    });

    if (existing) {
      return res.status(400).json({ message: 'Attendance already marked for this session' });
    }

    const ipAddress = req.ip;

    const attendance = await Attendance.create({
      studentId: req.user.id,
      section: student.section,
      subject: session.subject,
      date: dateOnly,
      time: now.toTimeString().substring(0, 8),
      location: {
        latitude,
        longitude,
        ipAddress,
      },
      status: 'present',
    });

    // Trigger low attendance warning asynchronously (fire-and-forget).
    maybeTriggerLowAttendanceWarning(req.user.id).catch((err) =>
      console.error('Warning email flow failed', err.message)
    );

    return res.status(201).json({
      message: hasCoordinates
        ? 'Attendance marked successfully'
        : 'Attendance marked successfully (development fallback without location)',
      attendanceId: attendance._id,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /student/my-attendance
// Query: optional subject, month, year
const getMyAttendance = async (req, res, next) => {
  try {
    const { subject, month, year } = req.query;
    const filter = { studentId: req.user.id };

    if (subject) {
      filter.subject = subject;
    }

    if (month && year) {
      const start = new Date(year, Number(month) - 1, 1);
      const end = new Date(year, Number(month), 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter).sort({ date: 1, time: 1 });

    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'present').length;
    const percentage = total === 0 ? 0 : (presentCount / total) * 100;

    return res.status(200).json({
      total,
      present: presentCount,
      percentage: Number(percentage.toFixed(2)),
      records,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  scanQr,
  getMyAttendance,
};

