const multer = require("multer");
const env = require("../config/env");
const { UnsupportedFileTypeError, FileTooLargeError, ValidationError } = require("../utils/AppError");

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "text/plain"]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt"]);

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

// Memory storage: files are parsed for text and discarded, never written
// to a web-accessible path. See security doc §3.
const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const ext = getExtension(file.originalname);

  // Cross-check MIME type against extension - don't trust either alone.
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new UnsupportedFileTypeError(
        `"${file.originalname}" isn't supported. Only PDF and plain text (.txt) files are allowed.`
      )
    );
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.upload.maxSizeBytes, // 7MB by default; rejected before full buffering
    files: 10, // sane ceiling on a single multi-file upload request
  },
});

const uploadLimitMb = env.upload.maxSizeBytes / (1024 * 1024);

/**
 * Wraps upload.array(...) so Multer's own errors (thrown synchronously
 * inside its internal middleware, before our asyncHandler/global error
 * handler would normally see them) are translated into our AppError
 * taxonomy with a clear, user-facing message.
 */
function uploadMultiple(fieldName, maxCount = 10) {
  const middleware = upload.array(fieldName, maxCount);

  return function handleUpload(req, res, next) {
    middleware(req, res, (err) => {
      if (!err) return next();

      if (err instanceof UnsupportedFileTypeError) {
        return next(err);
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new FileTooLargeError(`Each file must be ${uploadLimitMb}MB or smaller.`));
      }
      if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(new ValidationError("Too many files in one upload request."));
      }
      return next(err);
    });
  };
}

module.exports = { upload, uploadMultiple };
