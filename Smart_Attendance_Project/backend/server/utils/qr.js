const crypto = require('crypto');
const QRCode = require('qrcode');

// Generate a unique token for a QR session.
const generateQrToken = () => crypto.randomBytes(16).toString('hex');

// Generate a QR image data URL containing metadata.
// In a real mobile app you would encode minimal token and fetch full metadata from backend.
const generateQrCodeDataUrl = async ({ teacherId, subject, qrToken, timestamp }) => {
  const payload = JSON.stringify({
    teacherId,
    subject,
    qrToken,
    ts: timestamp,
  });

  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
  });

  return dataUrl;
};

module.exports = {
  generateQrToken,
  generateQrCodeDataUrl,
};

