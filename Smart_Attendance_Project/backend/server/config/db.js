const mongoose = require("mongoose");

const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/attendance_system";

  await mongoose.connect(uri);

  console.log("✅ MongoDB connected");
  console.log("Connected DB:", mongoose.connection.name);
};

module.exports = { connectDB };
