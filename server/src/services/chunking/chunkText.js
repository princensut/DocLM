// Approx. characters per chunk / overlap. ~4 chars/token is a common
// rough estimate for English text, so ~600 tokens ≈ 2400 chars.
// See PRD §4.3 / ARCHITECTURE.md.
const CHUNK_SIZE_CHARS = 2400;
const CHUNK_OVERLAP_CHARS = 300;

/**
 * Splits text into overlapping chunks, preferring to break on
 * paragraph/sentence boundaries near the target size rather than
 * cutting mid-word, so retrieved context reads naturally.
 *
 * @param {string} text
 * @returns {{ text: string, charStart: number, charEnd: number }[]}
 */
function chunkText(text) {
  const chunks = [];
  let start = 0;
  const len = text.length;

  while (start < len) {
    let end = Math.min(start + CHUNK_SIZE_CHARS, len);

    if (end < len) {
      // Try to break at the last paragraph, then sentence, boundary
      // within a small lookback window, to avoid awkward mid-sentence cuts.
      const lookback = text.slice(Math.max(start, end - 200), end);
      const paragraphBreak = lookback.lastIndexOf("\n\n");
      const sentenceBreak = Math.max(lookback.lastIndexOf(". "), lookback.lastIndexOf(".\n"));

      if (paragraphBreak !== -1) {
        end = Math.max(start, end - 200) + paragraphBreak + 2;
      } else if (sentenceBreak !== -1) {
        end = Math.max(start, end - 200) + sentenceBreak + 2;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({ text: chunk, charStart: start, charEnd: end });
    }

    if (end >= len) break;
    start = Math.max(end - CHUNK_OVERLAP_CHARS, start + 1); // guarantee forward progress
  }

  return chunks;
}

module.exports = { chunkText };
