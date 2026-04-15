const nodemailer = require('nodemailer');

// Very simple mailer; configure SMTP via env.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

const sendWarningEmail = async ({ to, studentName, attendancePercentage }) => {
  if (!to) return;

  const mailOptions = {
    from: process.env.MAIL_FROM || 'no-reply@attendance-system.com',
    to,
    subject: 'Low Attendance Warning',
    text: `Dear Parent,\n\nThis is an automated alert that ${studentName} currently has attendance of ${attendancePercentage}%, which is below the required threshold.\n\nPlease ensure regular attendance.\n\nBest regards,\nSmart Attendance System`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    // In production you might push this to a job queue instead of failing request.
    console.error('Failed to send warning email', err.message);
  }
};

module.exports = {
  sendWarningEmail,
};

