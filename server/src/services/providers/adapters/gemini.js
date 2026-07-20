const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../../../config/env");
const { ProviderError } = require("../../../utils/AppError");
const logger = require("../../../utils/logger");

const genAI = new GoogleGenerativeAI(env.providers.geminiApiKey);

const GENERATION_MODEL = "gemini-2.5-flash";
// text-embedding-004 was retired by Google; gemini-embedding-001 is the
// current stable embedding model as of mid-2026. It supports a
// configurable output dimensionality (768/1536/3072) - we pin it to
// 768 explicitly so it matches EMBEDDING_DIMENSIONS below and the
// Atlas Vector Search index definition documented in models/Chunk.js.
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONALITY = 768;

const MAX_RETRIES = 3;

async function withBackoff(fn, label) {
  let attempt = 0;
  // Retries transient 429/5xx errors AND raw network failures (DNS,
  // connection refused, timeouts - these arrive with no `.status` at
  // all, e.g. the underlying "fetch failed" error from undici).
  // Previously only HTTP status errors were retried, so a network
  // hiccup failed immediately on attempt 1 instead of backing off.
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      const isHttpRetryable = err?.status === 429 || (err?.status >= 500 && err?.status < 600);
      const isNetworkError =
        err?.status === undefined &&
        /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|network/i.test(err?.message || err?.cause?.message || "");
      const isRetryable = isHttpRetryable || isNetworkError;

      if (!isRetryable || attempt > MAX_RETRIES) {
        logger.error(
          { err: err.message, cause: err.cause?.message, label, attempt },
          "provider_call_failed"
        );
        throw new ProviderError();
      }
      logger.warn({ err: err.message, label, attempt }, "provider_call_retrying");
      const delayMs = 2 ** attempt * 500;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Embeds an array of text strings, returning one vector per input.
 * Gemini's embedContent API embeds one string at a time, so we batch
 * with a bounded concurrency to stay within rate limits.
 *
 * @param {string[]} texts
 * @param {{ taskType?: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" }} opts
 *   taskType matters for asymmetric search (short query vs long
 *   document chunks): using RETRIEVAL_DOCUMENT for chunks and
 *   RETRIEVAL_QUERY for the question meaningfully improves similarity
 *   score quality/separation versus leaving it unset for both.
 */
async function embed(texts, { taskType = "RETRIEVAL_DOCUMENT" } = {}) {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const CONCURRENCY = 5;
  const results = new Array(texts.length);

  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const batch = texts.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((text) =>
        withBackoff(async () => {
          const result = await model.embedContent({
            content: { parts: [{ text }] },
            taskType,
            outputDimensionality: EMBEDDING_DIMENSIONALITY,
          });
          return result.embedding.values;
        }, "gemini.embed")
      )
    );
    batchResults.forEach((vec, idx) => {
      results[i + idx] = vec;
    });
  }

  return results;
}

/**
 * Generates a grounded answer given a system instruction and prompt.
 * Non-streaming version; see generateStream for the streaming variant.
 */
async function generate(prompt, { systemInstruction } = {}) {
  return withBackoff(async () => {
    const model = genAI.getGenerativeModel({
      model: GENERATION_MODEL,
      systemInstruction,
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }, "gemini.generate");
}

/**
 * Streaming variant - yields text chunks as they arrive so the API
 * layer can pipe them to the client over SSE.
 */
async function* generateStream(prompt, { systemInstruction } = {}) {
  const model = genAI.getGenerativeModel({
    model: GENERATION_MODEL,
    systemInstruction,
  });

  const result = await withBackoff(() => model.generateContentStream(prompt), "gemini.generateStream");

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

module.exports = { embed, generate, generateStream, EMBEDDING_DIMENSIONS: EMBEDDING_DIMENSIONALITY };