const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const { extractText } = require("./extraction/extractText");
const { chunkText } = require("./chunking/chunkText");
const embeddingProvider = require("./providers/embeddingProvider");
const logger = require("../utils/logger");

/**
 * Best-effort page number estimate for a chunk, based on its
 * proportional position in the full text. pdf-parse doesn't give
 * per-character page boundaries, so this is an approximation - good
 * enough for citation purposes, not pixel-exact.
 */
function estimatePageNumber(charStart, totalLength, pageCount) {
  if (!pageCount || totalLength === 0) return null;
  const fraction = charStart / totalLength;
  return Math.min(pageCount, Math.max(1, Math.ceil(fraction * pageCount)));
}

/**
 * Runs the full upload → ready pipeline for a single document.
 * Any failure at any stage flips the document to "failed" with a
 * specific error message and cleans up partial chunks - no orphaned
 * data, per EXCEPTION_HANDLING_AND_SECURITY.md §5.3.
 *
 * Runs async/non-blocking relative to the HTTP request that triggered
 * the upload - the controller responds immediately with "processing"
 * and the client polls /api/documents/:id/status.
 */
async function processDocument(documentId, fileBuffer, mimeType) {
  const document = await Document.findById(documentId);
  if (!document) return;

  try {
    document.status = "processing";
    document.processingStartedAt = new Date();
    await document.save();

    const { text, pageCount } = await extractText(fileBuffer, mimeType);
    const rawChunks = chunkText(text);

    if (rawChunks.length === 0) {
      throw new Error("No content could be chunked from this document");
    }

    const embeddings = await embeddingProvider.embed(rawChunks.map((c) => c.text));

    const chunkDocs = rawChunks.map((c, idx) => ({
      documentId: document._id,
      userId: document.userId,
      chunkIndex: idx,
      text: c.text,
      pageNumber: estimatePageNumber(c.charStart, text.length, pageCount),
      charStart: c.charStart,
      charEnd: c.charEnd,
      embedding: embeddings[idx],
    }));

    await Chunk.insertMany(chunkDocs);

    document.status = "ready";
    document.pageCount = pageCount;
    document.chunkCount = chunkDocs.length;
    document.errorMessage = null;
    await document.save();

    logger.info(
      { documentId: document._id.toString(), chunkCount: chunkDocs.length },
      "document_pipeline_succeeded"
    );
  } catch (err) {
    logger.error(
      { documentId: document._id.toString(), err: err.message },
      "document_pipeline_failed"
    );

    // Clean up any partial chunks so a failed document never has
    // dangling data that could pollute retrieval for other queries.
    await Chunk.deleteMany({ documentId: document._id });

    document.status = "failed";
    document.errorMessage = err.message || "Processing failed";
    await document.save();
  }
}

module.exports = { processDocument };
