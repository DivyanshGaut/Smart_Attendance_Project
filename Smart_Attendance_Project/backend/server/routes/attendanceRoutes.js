const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

router.get("/report", async (req, res) => {
  try {
    const { section, subject } = req.query;

    // 1️⃣ Get students of section
    const students = await Student.find({ section });

    // 2️⃣ Get attendance records
    const attendanceRecords = await Attendance.find({
      section,
      subject,
    });

    // 3️⃣ Build report
    const report = students.map((s) => {
      const records = attendanceRecords.filter(
        (r) => r.student.toString() === s._id.toString()
      );

      const totalClasses = records.length;
      const present = records.filter((r) => r.present).length;

      const percentage =
        totalClasses === 0
          ? 0
          : (present / totalClasses) * 100;

      return {
        rollNo: s.rollNo,
        name: s.name,
        attendance: percentage.toFixed(1),
        classes: `${present}/${totalClasses}`,
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;