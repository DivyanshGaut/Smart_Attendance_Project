const express = require('express');
const { getMonthlyReport, getDefaulters } = require('../controllers/adminController');
const { teacherLogin, generateQr } = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
router.get('/monthly-report', getMonthlyReport);
// router.get('/monthly-report', apiLimiter, authenticate, authorize('teacher'), getMonthlyReport);
router.get('/defaulters', apiLimiter, authenticate, authorize('teacher'), getDefaulters);
router.post('/generate-qr', apiLimiter, authenticate, authorize('teacher'), generateQr);
router.post("/login", teacherLogin);
module.exports = router;

