const Joi = require('joi');

// Auth login validation
const loginSchema = Joi.object({
  role: Joi.string().valid('student', 'teacher', 'admin').required(),
  identifier: Joi.string().required(), // rollNo or email depending on role
  password: Joi.string().min(6).required(),
});

// Teacher QR generation validation
const generateQrSchema = Joi.object({
  subject: Joi.string().min(2).max(100).required(),
  section: Joi.string().min(2).max(50).required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  expirySeconds: Joi.number().integer().min(30).max(60).default(45),
});

// Student QR scan validation
const scanQrSchema = Joi.object({
  sessionId: Joi.string().hex().length(24).required(),
  qrToken: Joi.string().hex().min(64).max(64).required(),
  signature: Joi.string().hex().length(64).required(),
  issuedAt: Joi.date().iso().required(),
  expiresAt: Joi.date().iso().required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  accuracy: Joi.number().min(0).optional(),
  clientScanId: Joi.string().min(16).max(128).required(),
});

// Generic query params for reports
const monthYearSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
});

module.exports = {
  loginSchema,
  generateQrSchema,
  scanQrSchema,
  monthYearSchema,
};

