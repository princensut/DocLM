const express = require("express");
const documentController = require("../controllers/documentController");
const { requireAuth } = require("../middleware/auth");
const { uploadMultiple } = require("../middleware/upload");
const { uploadLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.use(requireAuth); // every route below requires a logged-in user

router.get("/", documentController.listDocuments);
router.post("/upload", uploadLimiter, uploadMultiple("files", 10), documentController.uploadDocuments);
router.get("/:id/status", documentController.getDocumentStatus);
router.delete("/:id", documentController.deleteDocument);

module.exports = router;
