const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { authenticate } = require("../middleware/authMiddleware");

const {
 uploadDocument,
 getStudentDocuments,
 getMaterials,
 getTeacherDocuments
} = require("../controllers/documentController");

router.post("/upload",authenticate,upload.single("file"),uploadDocument);

router.get("/my-documents",authenticate,getStudentDocuments);
router.get("/teacher-documents",authenticate,getTeacherDocuments);

router.get("/materials",authenticate,getMaterials);

module.exports = router;
