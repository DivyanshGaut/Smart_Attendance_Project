const crypto = require('crypto');
const QRCode = require('qrcode');

// Generate a unique token for a QR session.
const generateQrToken = () => crypto.randomBytes(32).toString('hex');

const getQrSigningSecret = () => process.env.QR_SIGNING_SECRET || process.env.JWT_SECRET || 'dev_secret';

const createQrSignature = (payload) => {
  const data = [
    payload.sessionId,
    payload.teacherId,
    payload.subject,
    payload.section,
    payload.qrToken,
    payload.issuedAt,
    payload.expiresAt,
  ].join('|');

  return crypto
    .createHmac('sha256', getQrSigningSecret())
    .update(data)
    .digest('hex');
};

const verifyQrSignature = (payload) => {
  if (!payload?.signature) return false;

  const expected = createQrSignature(payload);
  const actualBuffer = Buffer.from(payload.signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

// Generate a QR image data URL containing signed metadata.
const generateQrCodeDataUrl = async ({ sessionId, teacherId, subject, section, qrToken, issuedAt, expiresAt }) => {
  const payload = {
    type: 'attendance_qr',
    version: 2,
    sessionId,
    teacherId,
    subject,
    section,
    qrToken,
    issuedAt,
    expiresAt,
  };

  const signedPayload = JSON.stringify({
    ...payload,
    signature: createQrSignature(payload),
  });

  const dataUrl = await QRCode.toDataURL(signedPayload, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
  });

  return dataUrl;
};

module.exports = {
  generateQrToken,
  generateQrCodeDataUrl,
  verifyQrSignature,
};

