const express = require('express');
const { scanQr, getMyAttendance } = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { apiLimiter, qrScanLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/scan-qr', qrScanLimiter, authenticate, authorize('student'), scanQr);
router.get('/my-attendance', apiLimiter, authenticate, authorize('student'), getMyAttendance);

module.exports = router;




