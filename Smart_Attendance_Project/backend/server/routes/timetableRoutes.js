const express = require('express');
const { getTimetable, createTimetableEntry } = require('../controllers/timetableController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public or authenticated consumers can read timetable (adjust as needed).
router.get('/', apiLimiter, getTimetable);

// Admins manage timetable entries.
router.post('/', apiLimiter, authenticate, authorize('admin'), createTimetableEntry);

module.exports = router;

