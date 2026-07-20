const env = require("../../config/env");

function loadAdapter() {
  switch (env.providers.llm) {
    case "gemini":
      return require("./adapters/gemini");
    // case "openai": return require("./adapters/openai");
    // case "anthropic": return require("./adapters/anthropic");
    default:
      throw new Error(`Unsupported LLM_PROVIDER: ${env.providers.llm}`);
  }
}

const adapter = loadAdapter();

/**
 * @param {string} prompt
 * @param {{ systemInstruction?: string }} opts
 * @returns {Promise<string>}
 */
async function generate(prompt, opts) {
  return adapter.generate(prompt, opts);
}

/**
 * @param {string} prompt
 * @param {{ systemInstruction?: string }} opts
 * @returns {AsyncGenerator<string>}
 */
function generateStream(prompt, opts) {
  return adapter.generateStream(prompt, opts);
}

module.exports = { generate, generateStream };
