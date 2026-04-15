require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const attendanceRoutes = require("./routes/attendanceRoutes");
const Student = require('./models/Student');
const path = require("path");
const app = express();

/* ---------- MIDDLEWARE ---------- */

app.use(helmet());

const allowedOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowedOrigin =
      allowedOrigins.includes(origin) ||
      /^http:\/\/192\.168\.\d+\.\d+:5173$/.test(origin) ||
      /^http:\/\/10\.\d+\.\d+\.\d+:5173$/.test(origin) ||
      /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:5173$/.test(origin);

    return callback(isAllowedOrigin ? null : new Error("Not allowed by CORS"), isAllowedOrigin);
  },
  credentials: true
}));

app.use(morgan('dev'));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

/* ---------- DATABASE ---------- */

connectDB()
  .then(() => {
    console.log('✅ MongoDB connected');

    /* ---------- ROUTES ---------- */

    app.use('/api/auth', authRoutes);
    app.use('/api/teacher', teacherRoutes);
    app.use('/api/student', studentRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/timetable', timetableRoutes);
    app.use("/api/attendance", attendanceRoutes);
    app.use("/api/documents", require("./routes/documentRoutes"));
    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    /* ---------- ERROR HANDLER ---------- */

    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Frontend should connect to http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB', err);
    process.exit(1);
  });
