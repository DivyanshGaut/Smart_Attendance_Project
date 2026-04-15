const Document = require("../models/Document");
const path = require("path");

const buildPublicFileUrl = (filePath) => {
  if (!filePath) return "";

  const normalizedPath = filePath.replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.lastIndexOf("uploads/");

  if (uploadsIndex === -1) {
    return normalizedPath;
  }

  return `/${normalizedPath.substring(uploadsIndex)}`;
};

const formatDocumentResponse = (doc) => {
  const document = typeof doc.toObject === "function" ? doc.toObject() : doc;

  return {
    ...document,
    fileUrl: buildPublicFileUrl(document.fileUrl),
  };
};

/*
UPLOAD ASSIGNMENT
POST /documents/upload
*/
exports.uploadDocument = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const fileName = req.file.originalname || path.basename(req.file.filename || req.file.path);
    const title = req.body.title?.trim() || fileName;
    const subject = req.body.subject?.trim() || "General";

    const doc = await Document.create({
      title,
      subject,
      fileName,
      fileUrl: req.file.path,
      studentId: req.user.role === "student" ? req.user.id : null,
      uploadedBy: req.user.role === "teacher" ? req.user.id : null
    });

    res.json(formatDocumentResponse(doc));

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Upload failed" });

  }

};



/*
GET STUDENT DOCUMENTS
*/

exports.getStudentDocuments = async (req, res) => {

  const docs = await Document.find({
    studentId: req.user.id
  }).sort({ createdAt: -1 });

  res.json(docs.map(formatDocumentResponse));

};


/*
GET STUDY MATERIALS
*/

exports.getMaterials = async (req, res) => {

  const materials = await Document.find({
    uploadedBy: { $ne: null }
  })
    .populate("uploadedBy","teacherName")
    .sort({ createdAt: -1 });

  res.json(materials.map(formatDocumentResponse));

};

exports.getTeacherDocuments = async (req, res) => {
  const docs = await Document.find({
    uploadedBy: req.user.id
  })
    .populate("uploadedBy", "teacherName")
    .sort({ createdAt: -1 });

  res.json(docs.map(formatDocumentResponse));
};
