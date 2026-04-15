const express = require('express');
const { scanQr, getMyAttendance } = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/scan-qr', apiLimiter, authenticate, authorize('student'), scanQr);
router.get('/my-attendance', apiLimiter, authenticate, authorize('student'), getMyAttendance);

module.exports = router;




