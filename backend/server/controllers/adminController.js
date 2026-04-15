// const Attendance = require('../models/Attendance');
// const Student = require('../models/Student');
// const { monthYearSchema } = require('../utils/validators');

/*
GET /admin/monthly-report?month=&year=
*/
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const QrSession = require('../models/QrSession');
const Timetable = require('../models/Timetable');
const { monthYearSchema } = require('../utils/validators');

const buildStudentFilter = (section) => {
  if (!section) {
    return {};
  }

  if (section === 'CSE-A') {
    return {
      $or: [
        { section },
        { section: { $exists: false } },
        { section: null },
        { section: '' },
      ],
    };
  }

  return { section };
};

const getMonthRange = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

const getWeekdayLabel = (date) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(date));

/*
GET /admin/monthly-report?month=&year=&subject=
*/
const getMonthlyReport = async (req, res, next) => {
  try {
    const { error, value } = monthYearSchema.validate({
      month: Number(req.query.month),
      year: Number(req.query.year),
    });

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const { month, year } = value;
    const subject = req.query.subject;
    const section = req.query.section;

    if (!subject) {
      return res.status(400).json({
        message: "Subject is required",
      });
    }

    const { start, end } = getMonthRange(month, year);

    // 🔥 Get all students
    const students = await Student.find(buildStudentFilter(section));

    // 🔥 Build report
    const report = await Promise.all(
      students.map(async (student) => {
        const records = await Attendance.find({
          studentId: student._id,
          subject: subject,
          date: { $gte: start, $lte: end },
        });

        const total = records.length;

        const present = records.filter(
          (r) => r.status.toLowerCase() === "present"
        ).length;

        const percentage =
          total === 0 ? 0 : (present / total) * 100;

        return {
          rollNo: student.rollNo,
          name: student.studentName,
          attendance: Number(percentage.toFixed(1)),
          classes: `${present}/${total}`,
        };
      })
    );

    res.json(report);

  } catch (err) {
    next(err);
  }
};

/*
GET /admin/defaulters?month=&year=&threshold=75&earlyWarning=50
*/

const getDefaulters = async (req, res, next) => {
  try {
    const { error, value } = monthYearSchema.validate({
      month: Number(req.query.month),
      year: Number(req.query.year),
    });

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const { month, year } = value;
    const subject = req.query.subject;
    const section = req.query.section;
    const threshold = Number(req.query.threshold) || 75;

    const { start, end } = getMonthRange(month, year);

    const students = await Student.find(buildStudentFilter(section));

    const defaulters = await Promise.all(
      students.map(async (student) => {
        const records = await Attendance.find({
          studentId: student._id,
          subject: subject,
          date: { $gte: start, $lte: end },
        });

        const total = records.length;
        const present = records.filter(
          (r) => r.status.toLowerCase() === "present"
        ).length;

        const percentage =
          total === 0 ? 0 : (present / total) * 100;

        return {
          rollNo: student.rollNo,
          name: student.studentName,
          attendance: Number(percentage.toFixed(1)),
          present,
          total,
        };
      })
    );

    // 🔥 filter below threshold
    const filtered = defaulters.filter(
      (s) => s.attendance < threshold
    );

    res.json(filtered);

  } catch (err) {
    next(err);
  }
};
/*
GET /admin/attendance-analytics?month=&year=
*/
const getAttendanceAnalytics = async (req, res, next) => {
  try {
    const { error, value } = monthYearSchema.validate({
      month: Number(req.query.month),
      year: Number(req.query.year),
    });

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const { month, year } = value;
    const section = req.query.section;
    const { start, end } = getMonthRange(month, year);

    const attendanceFilter = { date: { $gte: start, $lte: end } };
    if (section) {
      attendanceFilter.section = section;
    }

    const records = await Attendance.find(attendanceFilter).lean();

    const pieMap = new Map();
    const subjectMap = new Map();
    const weekdayMap = new Map();

    records.forEach((record) => {
      pieMap.set(record.status, (pieMap.get(record.status) || 0) + 1);

      const subjectEntry = subjectMap.get(record.subject) || { present: 0, absent: 0 };
      if (record.status === 'present') {
        subjectEntry.present += 1;
      } else {
        subjectEntry.absent += 1;
      }
      subjectMap.set(record.subject, subjectEntry);

      const weekday = getWeekdayLabel(record.date);
      const dayEntry = weekdayMap.get(weekday) || { day: weekday, present: 0, absent: 0 };
      if (record.status === 'present') {
        dayEntry.present += 1;
      } else {
        dayEntry.absent += 1;
      }
      weekdayMap.set(weekday, dayEntry);
    });

    const pie = Array.from(pieMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    const subjectBreakdown = Array.from(subjectMap.entries())
      .map(([subject, counts]) => ({
        subject,
        present: counts.present,
        absent: counts.absent,
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));

    const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyOverview = weekdayOrder
      .map((day) => weekdayMap.get(day) || { day, present: 0, absent: 0 })
      .filter((day) => day.present > 0 || day.absent > 0);

    return res.status(200).json({
      month,
      year,
      pie,
      subjectBreakdown,
      weeklyOverview,
    });
  } catch (err) {
    next(err);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [students, teachers, todayAttendance, allAttendance, todayQrSessions, timetableSubjects] =
      await Promise.all([
        Student.find({}, 'section').lean(),
        Teacher.countDocuments(),
        Attendance.find({ createdAt: { $gte: startOfToday, $lte: endOfToday } }).lean(),
        Attendance.find({}).lean(),
        QrSession.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } }),
        Timetable.find({}, 'subject').lean(),
      ]);

    const totalStudents = students.length;
    const sectionSet = new Set(
      students
        .map((student) => student.section)
        .filter(Boolean)
    );
    const subjectSet = new Set(
      timetableSubjects
        .map((entry) => entry.subject)
        .filter(Boolean)
    );

    allAttendance.forEach((record) => {
      if (record.subject) {
        subjectSet.add(record.subject);
      }
    });

    const presentCount = allAttendance.filter((record) => record.status === 'present').length;
    const avgAttendance = allAttendance.length
      ? Number(((presentCount / allAttendance.length) * 100).toFixed(1))
      : 0;

    const studentAttendanceMap = new Map();
    allAttendance.forEach((record) => {
      const key = String(record.studentId);
      const current = studentAttendanceMap.get(key) || { present: 0, total: 0 };
      current.total += 1;
      if (record.status === 'present') {
        current.present += 1;
      }
      studentAttendanceMap.set(key, current);
    });

    const debarredCount = Array.from(studentAttendanceMap.values()).filter(({ present, total }) => {
      if (!total) return false;
      return (present / total) * 100 < 75;
    }).length;

    return res.status(200).json({
      totalStudents,
      activeToday: todayAttendance.filter((record) => record.status === 'present').length,
      totalSections: sectionSet.size,
      totalTeachers: teachers,
      avgAttendance,
      debarredCount,
      qrScansToday: todayQrSessions,
      sections: Array.from(sectionSet).sort(),
      subjects: Array.from(subjectSet).sort(),
    });
  } catch (err) {
    next(err);
  }
};

const getQrValidations = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const sessions = await QrSession.find({})
      .populate('teacherId', 'teacherName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const validations = await Promise.all(
      sessions.map(async (session) => {
        const studentsMarked = await Attendance.countDocuments({
          subject: session.subject,
          section: session.section,
          createdAt: { $gte: session.createdAt, $lte: session.expiryTime },
        });

        return {
          id: session._id,
          timestamp: session.createdAt,
          teacher: session.teacherId?.teacherName || 'Teacher',
          subject: session.subject,
          section: session.section || 'N/A',
          studentsMarked,
          status: session.expiryTime < new Date() ? 'Closed' : session.isActive ? 'Active' : 'Closed',
          location: `${Number(session.latitude).toFixed(4)}, ${Number(session.longitude).toFixed(4)}`,
        };
      })
    );

    return res.status(200).json(validations);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMonthlyReport,
  getDefaulters,   
  getAttendanceAnalytics,
  getDashboardSummary,
  getQrValidations,
};
