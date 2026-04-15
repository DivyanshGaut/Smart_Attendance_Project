const Timetable = require('../models/Timetable');

// GET /timetable
// Query (optional): teacherId, dayOfWeek, batch
const getTimetable = async (req, res, next) => {
  try {
    const { teacherId, dayOfWeek, batch } = req.query;
    const filter = {};

    if (teacherId) filter.teacherId = teacherId;
    if (dayOfWeek) filter.dayOfWeek = dayOfWeek.toUpperCase();
    if (batch) filter.batch = batch;

    const slots = await Timetable.find(filter)
      .populate('teacherId', 'teacherName email')
      .sort({ dayOfWeek: 1, startTime: 1 });

    return res.status(200).json({
      count: slots.length,
      timetable: slots,
    });
  } catch (err) {
    return next(err);
  }
};

// POST /timetable
// Admin-only: create a timetable entry.
// Body: { subject, teacherId, dayOfWeek, startTime, endTime, room?, batch? }
const createTimetableEntry = async (req, res, next) => {
  try {
    const { subject, teacherId, dayOfWeek, startTime, endTime, room, batch } = req.body;

    if (!subject || !teacherId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const entry = await Timetable.create({
      subject,
      teacherId,
      dayOfWeek: dayOfWeek.toUpperCase(),
      startTime,
      endTime,
      room,
      batch,
    });

    return res.status(201).json({
      message: 'Timetable entry created',
      entry,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getTimetable,
  createTimetableEntry,
};

