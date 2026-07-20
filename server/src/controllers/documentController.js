const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const asyncHandler = require("../utils/asyncHandler");
const { NotFoundError, ValidationError } = require("../utils/AppError");
const { processDocument } = require("../services/documentPipeline");
const logger = require("../utils/logger");

const listDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, documents });
});

const uploadDocuments = asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    throw new ValidationError("No files were uploaded");
  }

  const createdDocuments = [];

  for (const file of files) {
    const document = await Document.create({
      userId: req.userId,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      status: "processing",
    });
    createdDocuments.push(document);

    // Fire-and-forget: don't block the HTTP response on embedding.
    // Errors inside are caught and recorded on the document itself.
    processDocument(document._id, file.buffer, file.mimetype).catch((err) => {
      logger.error({ err: err.message, documentId: document._id.toString() }, "pipeline_kickoff_failed");
    });
  }

  logger.info({ userId: req.userId, count: createdDocuments.length }, "audit:documents_uploaded");
  res.status(202).json({ success: true, documents: createdDocuments });
});

const getDocumentStatus = asyncHandler(async (req, res) => {
  const document = await Document.findOne({ _id: req.params.id, userId: req.userId });
  if (!document) {
    throw new NotFoundError("Document not found");
  }
  res.json({ success: true, document });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({ _id: req.params.id, userId: req.userId });
  if (!document) {
    throw new NotFoundError("Document not found");
  }

  await Chunk.deleteMany({ documentId: document._id });
  await document.deleteOne();

  logger.info({ userId: req.userId, documentId: req.params.id }, "audit:document_deleted");
  res.json({ success: true });
});

module.exports = { listDocuments, uploadDocuments, getDocumentStatus, deleteDocument };
