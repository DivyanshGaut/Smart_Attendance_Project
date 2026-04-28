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
    // Build query depending on role
    const query =
      role === "student"
        ? { rollNo: identifier.toString().trim() }
        : { email: identifier.toLowerCase() };

    const user = await Model.findOne(query);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Password check
   const isMatch = await user.comparePassword(password);
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
