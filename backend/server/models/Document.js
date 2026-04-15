const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher"
  },

  fileUrl: {
    type: String,
    required: true
  },

  fileName: {
    type: String,
    required: true
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
