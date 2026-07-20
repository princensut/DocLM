const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    // Denormalized for fast, IDOR-safe scoping without a join/populate
    // on every retrieval query. See security doc §1.3.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    pageNumber: { type: Number, default: null },
    charStart: { type: Number, required: true },
    charEnd: { type: Number, required: true },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

// Supports the in-app cosine-similarity fallback path efficiently.
chunkSchema.index({ documentId: 1, chunkIndex: 1 });

module.exports = mongoose.model("Chunk", chunkSchema);

/**
 * NOTE ON ATLAS VECTOR SEARCH:
 * When USE_ATLAS_VECTOR_SEARCH=true, create a Vector Search index named
 * "chunk_vector_index" on this collection via the Atlas UI/CLI, e.g.:
 *
 * {
 *   "fields": [
 *     { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
 *     { "type": "filter", "path": "documentId" },
 *     { "type": "filter", "path": "userId" }
 *   ]
 * }
 *
 * numDimensions must match the embedding provider's output size
 * (e.g. Gemini's text-embedding-004 outputs 768-dim vectors).
 */
