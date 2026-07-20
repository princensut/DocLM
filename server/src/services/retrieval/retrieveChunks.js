const mongoose = require("mongoose");
const Chunk = require("../../models/Chunk");
const env = require("../../config/env");

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Fallback path: loads all chunks for the given document(s), scores
 * them in-process. Fine at small scale; documented scaling limitation
 * in ARCHITECTURE.md §5.
 */
async function retrieveViaCosineSimilarity({ userId, documentIds, queryEmbedding, topK }) {
  const chunks = await Chunk.find({
    userId,
    documentId: { $in: documentIds },
  }).lean();

  const scored = chunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(chunk.embedding, queryEmbedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Preferred path: MongoDB Atlas $vectorSearch aggregation stage.
 * Requires a Vector Search index named "chunk_vector_index" on the
 * chunks collection (see models/Chunk.js for the index definition).
 */
async function retrieveViaAtlasVectorSearch({ userId, documentIds, queryEmbedding, topK }) {
  const results = await Chunk.aggregate([
    {
      $vectorSearch: {
        index: "chunk_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: Math.max(topK * 10, 100),
        limit: topK,
        filter: {
          userId: new mongoose.Types.ObjectId(userId),
          documentId: { $in: documentIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
    },
    {
      $project: {
        text: 1,
        documentId: 1,
        chunkIndex: 1,
        pageNumber: 1,
        charStart: 1,
        charEnd: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results.map((r) => ({ chunk: r, score: r.score }));
}

/**
 * @param {{ userId: string, documentIds: string[], queryEmbedding: number[] }} args
 * @returns {Promise<{ chunk: object, score: number }[]>}
 */
async function retrieveRelevantChunks({ userId, documentIds, queryEmbedding }) {
  const topK = env.retrieval.topK;

  if (env.retrieval.useAtlasVectorSearch) {
    return retrieveViaAtlasVectorSearch({ userId, documentIds, queryEmbedding, topK });
  }
  return retrieveViaCosineSimilarity({ userId, documentIds, queryEmbedding, topK });
}

module.exports = { retrieveRelevantChunks, cosineSimilarity };
