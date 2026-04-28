const mongoose = require("mongoose");
const Student = require("./models/Student");

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/attendance_system";

mongoose.connect(mongoUri);

async function migrateStudentSections() {
  try {
    const result = await Student.updateMany(
      {
        $or: [
          { section: { $exists: false } },
          { section: null },
          { section: "" },
        ],
      },
      { $set: { section: "CSE-A" } }
    );

    console.log(`Updated ${result.modifiedCount} students with default section CSE-A`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

migrateStudentSections();
