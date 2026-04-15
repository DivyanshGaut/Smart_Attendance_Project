const mongoose = require("mongoose");
const Admin = require("./models/Admin"); // adjust path if needed

mongoose.connect("mongodb://127.0.0.1:27017/attendance_system");

async function seedAdmin() {

  try {

    await Admin.deleteMany(); // optional: remove old admins

    await Admin.create({
      adminName: "Super Admin",
      email: "admin@attendance.com",
      password: "admin123"
    });

    console.log("✅ Admin seeded successfully");

    process.exit();

  } catch (error) {

    console.error(error);
    process.exit(1);

  }

}

seedAdmin();