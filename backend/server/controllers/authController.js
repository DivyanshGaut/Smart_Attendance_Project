const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const { loginSchema, resetPasswordSchema } = require('../utils/validators');
const { signToken } = require('../utils/jwt');

const getAuthModel = (role) => {
  const models = {
    student: Student,
    teacher: Teacher,
    admin: Admin
  };

  return models[role];
};

const buildIdentityQuery = (role, identifier) =>
  role === "student"
    ? { rollNo: identifier.toString().trim() }
    : { email: identifier.toLowerCase().trim() };

const login = async (req, res, next) => {
  try {

    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { role, identifier, password } = value;

    const Model = getAuthModel(role);

    if (!Model) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const query = buildIdentityQuery(role, identifier);

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

const resetPassword = async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { role, identifier, newPassword } = value;
    const Model = getAuthModel(role);

    if (!Model) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await Model.findOne(buildIdentityQuery(role, identifier));

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    return next(err);
  }
};

module.exports = { login, resetPassword };
