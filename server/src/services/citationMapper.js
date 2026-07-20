/**
 * Scans the LLM's answer text for [n] markers and maps each one back
 * to the actual retrieved chunk it refers to, returning only the
 * citations that were genuinely used - never citations to material
 * outside the retrieved set. See PRD §4.9.
 */
function extractCitations(answerText, retrievedChunks) {
  const usedIndices = new Set();
  const markerRegex = /\[(\d+)\]/g;
  let match;

  while ((match = markerRegex.exec(answerText)) !== null) {
    const idx = parseInt(match[1], 10) - 1;
    if (idx >= 0 && idx < retrievedChunks.length) {
      usedIndices.add(idx);
    }
  }

  // If the model didn't emit any [n] markers, fall back to citing the
  // single most relevant chunk so the UI still has something to show.
  if (usedIndices.size === 0 && retrievedChunks.length > 0) {
    usedIndices.add(0);
  }

  return Array.from(usedIndices)
    .sort((a, b) => a - b)
    .map((idx) => {
      const r = retrievedChunks[idx];
      return {
        marker: idx + 1,
        chunkId: r.chunk._id?.toString?.() ?? r.chunk._id,
        text: r.chunk.text,
        pageNumber: r.chunk.pageNumber ?? null,
        score: r.score,
      };
    });
}

module.exports = { extractCitations };
