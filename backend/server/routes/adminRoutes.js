const express = require('express');
const {
  createStudent,
  createStudents,
  createTeacher,
  createTeachers,
  getMonthlyReport,
  getDefaulters,
  getAttendanceAnalytics,
  getDashboardSummary,
  getQrValidations,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/students', apiLimiter, authenticate, authorize('admin'), createStudent);
router.post('/students/bulk', apiLimiter, authenticate, authorize('admin'), createStudents);
router.post('/teachers', apiLimiter, authenticate, authorize('admin'), createTeacher);
router.post('/teachers/bulk', apiLimiter, authenticate, authorize('admin'), createTeachers);
router.get('/monthly-report', apiLimiter, authenticate, authorize('teacher', 'admin'), getMonthlyReport);
router.get('/defaulters', apiLimiter, authenticate, authorize('teacher', 'admin'), getDefaulters);
router.get('/attendance-analytics', apiLimiter, authenticate, authorize('admin'), getAttendanceAnalytics);
router.get('/dashboard-summary', apiLimiter, authenticate, authorize('admin'), getDashboardSummary);
router.get('/qr-validations', apiLimiter, authenticate, authorize('admin'), getQrValidations);

module.exports = router;

