const pdfParse = require("pdf-parse");
const { ValidationError } = require("../../utils/AppError");

/**
 * Extracts raw text (plus best-effort page count) from an uploaded
 * file buffer. PDF and plain text only, per PRD §4.3.
 */
async function extractText(fileBuffer, mimeType) {
  if (mimeType === "text/plain") {
    const text = fileBuffer.toString("utf-8");
    if (!text.trim()) {
      throw new ValidationError("This file appears to be empty");
    }
    return { text, pageCount: null };
  }

  if (mimeType === "application/pdf") {
    const data = await pdfParse(fileBuffer);
    if (!data.text || !data.text.trim()) {
      throw new ValidationError(
        "No extractable text found in this PDF - it may be a scanned/image-only document, which isn't supported yet."
      );
    }
    return { text: data.text, pageCount: data.numpages };
  }

  throw new ValidationError(`Unsupported file type: ${mimeType}`);
}

module.exports = { extractText };
