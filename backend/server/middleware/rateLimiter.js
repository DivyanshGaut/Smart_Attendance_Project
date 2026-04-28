const rateLimit = require('express-rate-limit');

// Generic rate limiter; can be tuned per route group.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const qrScanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: { message: 'Too many QR scan attempts, please wait and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  qrScanLimiter,
};

