const env = require("../../config/env");

function loadAdapter() {
  switch (env.providers.embedding) {
    case "gemini":
      return require("./adapters/gemini");
    default:
      throw new Error(`Unsupported EMBEDDING_PROVIDER: ${env.providers.embedding}`);
  }
}

const adapter = loadAdapter();

async function embed(texts, opts) {
  return adapter.embed(texts, opts);
}

module.exports = { embed, dimensions: adapter.EMBEDDING_DIMENSIONS };
