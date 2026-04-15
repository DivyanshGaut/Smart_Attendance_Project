const express = require('express');
const {
  getMonthlyReport,
  getDefaulters,
  getAttendanceAnalytics,
  getDashboardSummary,
  getQrValidations,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/monthly-report', apiLimiter, authenticate, authorize('teacher', 'admin'), getMonthlyReport);
router.get('/defaulters', apiLimiter, authenticate, authorize('teacher', 'admin'), getDefaulters);
router.get('/attendance-analytics', apiLimiter, authenticate, authorize('admin'), getAttendanceAnalytics);
router.get('/dashboard-summary', apiLimiter, authenticate, authorize('admin'), getDashboardSummary);
router.get('/qr-validations', apiLimiter, authenticate, authorize('admin'), getQrValidations);

module.exports = router;

