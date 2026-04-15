const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

/*
=========================================
GET ATTENDANCE REPORT
=========================================
GET /api/attendance/report
Query:
  section=CSE-A
  subject=Data Structures
  month=4 (optional)
*/

const getAttendanceReport = async (req, res) => {
  const { section, subject, month } = req.query;

  try {
    if (!section || !subject) {
      return res.status(400).json({
        message: "Section and Subject are required",
      });
    }

    // 1️⃣ Get all students of that section
    const students = await Student.find({ section });

    // 2️⃣ Build date filter (if month provided)
    let dateFilter = {};
    if (month) {
      const start = new Date(2026, month - 1, 1);
      const end = new Date(2026, month, 0, 23, 59, 59);

      dateFilter = {
        date: { $gte: start, $lte: end },
      };
    }

    // 3️⃣ Get attendance records
    const attendanceRecords = await Attendance.find({
      section,
      subject,
      ...dateFilter,
    });

    // 4️⃣ Process per student
    const report = students.map((student) => {
      const studentRecords = attendanceRecords.filter(
        (rec) =>
          rec.student.toString() === student._id.toString()
      );

      const totalClasses = studentRecords.length;

      const totalPresent = studentRecords.filter(
        (rec) => rec.present === true
      ).length;

      const percentage =
        totalClasses === 0
          ? 0
          : (totalPresent / totalClasses) * 100;

      return {
        studentId: student._id,
        rollNo: student.rollNo,
        name: student.name,
        totalClasses,
        present: totalPresent,
        attendance: Number(percentage.toFixed(1)),
        status: percentage < 75 ? "Debarred" : "Safe",
      };
    });

    res.status(200).json(report);
  } catch (error) {
    console.error("Attendance Report Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};