const express = require('express');
const { login, resetPassword } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', authLimiter, login);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;

