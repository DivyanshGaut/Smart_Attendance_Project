const mongoose = require("mongoose");
const Teacher = require("./models/Teacher");

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/attendance_system";

mongoose.connect(mongoUri);

async function seedTeachers() {
  try {

    await Teacher.deleteMany(); // optional: clears old teachers

    await Teacher.create([
      {
        teacherName: "Dr. Rajesh Sharma",
        teacherId: "T101",
        email: "rajesh@college.com",
        subject: "Data Structures",
        password: "123456"
      },
      {
        teacherName: "Prof. Neha Verma",
        teacherId: "T102",
        email: "neha@college.com",
        subject: "Database Systems",
        password: "123456"
      },
      {
        teacherName: "Dr. Amit Gupta",
        teacherId: "T103",
        email: "amit@college.com",
        subject: "Theory of Computation",
        password: "123456"
      }
    ]);

    console.log("✅ Teachers inserted successfully");

    process.exit();

  } catch (error) {

    console.error(error);
    process.exit(1);

  }
}

seedTeachers();
