const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const { loginSchema } = require('../utils/validators');
const { signToken } = require('../utils/jwt');

const login = async (req, res, next) => {
  try {

    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { role, identifier, password } = value;

    // Map roles to models
    const models = {
      student: Student,
      teacher: Teacher,
      admin: Admin
    };

    const Model = models[role];

    if (!Model) {
      return res.status(400).json({ message: "Invalid role" });
    }
    console.log("Collection name:", Model.collection.name);

    // Build query depending on role
    const query =
      role === "student"
        ? { rollNo: identifier.toString().trim() }
        : { email: identifier.toLowerCase() };
        const allStudents = await Student.find();
        console.log("Identifier:", identifier);
console.log("Length:", identifier.length);
console.log("Characters:", [...identifier]);
console.log("ALL STUDENTS FROM DB:", allStudents)
console.log("Identifier TYPE:", typeof identifier);
console.log("Identifier VALUE:", identifier);
    const user = await Model.findOne(query);
    console.log("QUERY SENT:", query);
console.log("USER FOUND:", user);
const testUser = await Student.findOne({ rollNo: 2401331520001 });
console.log("TEST USER:", testUser);
    if (!user) {
      return res.status(401).json({ message: " jjghv Invalid credentials" });
    }
    console.log("Entered password:", password);
console.log("DB password:", user.password);

    // Password check
   const isMatch = await user.comparePassword(password);
    console.log("Password match:", isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({
      id: user._id,
      role
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        role,
        name: user.studentName || user.teacherName || user.adminName,
        identifier
      }
    });

  } catch (err) {
    return next(err);
  }
};

module.exports = { login };
