const env = require("../../config/env");

/**
 * Pluggable embedding provider. Business logic (chunking, retrieval)
 * only ever calls embed() from this module - never a vendor SDK
 * directly. Swapping providers is a config change, not a rewrite.
 * See ARCHITECTURE.md §4.
 */
function loadAdapter() {
  switch (env.providers.embedding) {
    case "gemini":
      return require("./adapters/gemini");
    // case "openai": return require("./adapters/openai");
    default:
      throw new Error(`Unsupported EMBEDDING_PROVIDER: ${env.providers.embedding}`);
  }
}

const adapter = loadAdapter();

/**
 * @param {string[]} texts
 * @returns {Promise<number[][]>} one embedding vector per input text
 */
async function embed(texts) {
  return adapter.embed(texts);
}

module.exports = { embed, dimensions: adapter.EMBEDDING_DIMENSIONS };
