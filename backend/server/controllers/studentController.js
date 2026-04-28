const Attendance = require('../models/Attendance');
const QrSession = require('../models/QrSession');
const Student = require('../models/Student');
const { scanQrSchema } = require('../utils/validators');
const { isWithinRadius } = require('../utils/geo');
const { sendWarningEmail } = require('../utils/mailer');
const { verifyQrSignature } = require('../utils/qr');

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
// Body: { sessionId, qrToken, signature, issuedAt, expiresAt, latitude, longitude, clientScanId }
// Uses JWT student identity from req.user.
const scanQr = async (req, res, next) => {
  try {
    const { error, value } = scanQrSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { sessionId, qrToken, signature, issuedAt, expiresAt, latitude, longitude, accuracy, clientScanId } = value;

    const session = await QrSession.findOne({ _id: sessionId, qrToken });
    if (!session || !session.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive QR session' });
    }

    const now = new Date();
    if (now > session.expiryTime) {
      return res.status(400).json({ message: 'QR code has expired' });
    }

    if (Math.abs(new Date(expiresAt).getTime() - session.expiryTime.getTime()) > 1000) {
      return res.status(400).json({ message: 'QR payload does not match this session' });
    }

    const signedPayload = {
      sessionId: session._id.toString(),
      teacherId: session.teacherId.toString(),
      subject: session.subject,
      section: session.section,
      qrToken: session.qrToken,
      issuedAt: new Date(issuedAt).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      signature,
    };

    if (!verifyQrSignature(signedPayload)) {
      return res.status(400).json({ message: 'QR signature verification failed' });
    }

    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (session.section && student.section && session.section !== student.section) {
      return res.status(400).json({ message: 'QR code is for a different section' });
    }

    const maxAccuracyMeters = Number(process.env.ATTENDANCE_MAX_ACCURACY_METERS) || 150;
    if (Number.isFinite(accuracy) && accuracy > maxAccuracyMeters) {
      return res.status(400).json({ message: 'Location accuracy is too low. Please move outside or enable high accuracy GPS.' });
    }

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

    const sameDeviceUsedByAnotherStudent = await Attendance.findOne({
      qrSessionId: session._id,
      studentId: { $ne: req.user.id },
      'scanMetadata.clientScanId': clientScanId,
    });

    if (sameDeviceUsedByAnotherStudent) {
      return res.status(409).json({
        message: 'This device has already been used for another student in this QR session',
      });
    }

    // Prevent duplicate attendance.
    const dateOnly = new Date(now.toDateString());
    const existingForSession = await Attendance.findOne({
      studentId: req.user.id,
      qrSessionId: session._id,
    });

    if (existingForSession) {
      return res.status(400).json({ message: 'Attendance already marked for this session' });
    }

    const existingForClassToday = await Attendance.findOne({
      studentId: req.user.id,
      subject: session.subject,
      date: dateOnly,
    });

    if (existingForClassToday) {
      return res.status(400).json({ message: 'Attendance already marked for this subject today' });
    }

    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

    const attendance = await Attendance.create({
      studentId: req.user.id,
      qrSessionId: session._id,
      section: student.section,
      subject: session.subject,
      date: dateOnly,
      time: now.toTimeString().substring(0, 8),
      location: {
        latitude,
        longitude,
        ipAddress,
      },
      scanMetadata: {
        clientScanId,
        userAgent: req.get('user-agent'),
        accuracy,
      },
      status: 'present',
    });

    // Trigger low attendance warning asynchronously (fire-and-forget).
    maybeTriggerLowAttendanceWarning(req.user.id).catch((err) =>
      console.error('Warning email flow failed', err.message)
    );

    return res.status(201).json({
      message: 'Attendance marked successfully',
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

