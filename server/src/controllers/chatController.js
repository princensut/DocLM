const Document = require("../models/Document");
const asyncHandler = require("../utils/asyncHandler");
const { NotFoundError, ValidationError } = require("../utils/AppError");
const embeddingProvider = require("../services/providers/embeddingProvider");
const llmProvider = require("../services/providers/llmProvider");
const { retrieveRelevantChunks } = require("../services/retrieval/retrieveChunks");
const { SYSTEM_INSTRUCTION, buildGroundedPrompt } = require("../services/promptBuilder");
const { extractCitations } = require("../services/citationMapper");
const env = require("../config/env");
const logger = require("../utils/logger");

const NOT_FOUND_MARKER = "NOT_FOUND_IN_DOCUMENT";
const NOT_FOUND_MESSAGE =
  "I couldn't find information about this in the document. Try rephrasing, or ask something the document actually covers.";

/**
 * Shared setup: validates the document belongs to the user and is
 * ready, embeds the question, retrieves relevant chunks, and decides
 * whether we even have enough signal to bother calling the LLM.
 */
async function prepareRetrieval(userId, documentId, question) {
  const document = await Document.findOne({ _id: documentId, userId });
  if (!document) {
    throw new NotFoundError("Document not found");
  }
  if (document.status !== "ready") {
    throw new ValidationError(`This document is still ${document.status} - please wait until it's ready.`);
  }

  const [queryEmbedding] = await embeddingProvider.embed([question], { taskType: "RETRIEVAL_QUERY" });
  const retrieved = await retrieveRelevantChunks({
    userId,
    documentIds: [documentId],
    queryEmbedding,
  });

  const topScore = retrieved[0]?.score ?? 0;
  const hasSufficientContext = retrieved.length > 0 && topScore >= env.retrieval.minScore;

  // Diagnostic: without this, a miscalibrated threshold fails silently
  // as a generic "not found" with no visibility into why. Always log
  // the actual scores so RETRIEVAL_MIN_SCORE can be tuned against
  // reality instead of guesswork.
  logger.info(
    {
      documentId,
      chunkCountOnDocument: document.chunkCount,
      retrievedCount: retrieved.length,
      topScores: retrieved.slice(0, 3).map((r) => Number(r.score.toFixed(4))),
      minScoreThreshold: env.retrieval.minScore,
      passedThreshold: hasSufficientContext,
    },
    "retrieval_debug"
  );

  return { document, retrieved, hasSufficientContext };
}

const askQuestion = asyncHandler(async (req, res) => {
  const { documentId, question } = req.body;

  const { retrieved, hasSufficientContext } = await prepareRetrieval(req.userId, documentId, question);

  // Low-similarity short-circuit: skip the LLM call entirely rather
  // than pressuring it into a hallucinated answer. See PRD §4.4.
  if (!hasSufficientContext) {
    return res.json({
      success: true,
      answer: NOT_FOUND_MESSAGE,
      notFound: true,
      citations: [],
    });
  }

  const prompt = buildGroundedPrompt(question, retrieved);
  const rawAnswer = await llmProvider.generate(prompt, { systemInstruction: SYSTEM_INSTRUCTION });

  if (rawAnswer.trim() === NOT_FOUND_MARKER) {
    return res.json({ success: true, answer: NOT_FOUND_MESSAGE, notFound: true, citations: [] });
  }

  const citations = extractCitations(rawAnswer, retrieved);

  logger.info({ userId: req.userId, documentId }, "audit:question_asked");
  res.json({ success: true, answer: rawAnswer, notFound: false, citations });
});

/**
 * Streaming variant over Server-Sent Events. Bonus feature per PRD §4.10.
 * Citations can't be computed until the full answer is known (we need
 * the [n] markers), so they're sent as a final "citations" event after
 * the text stream completes.
 */
const askQuestionStream = asyncHandler(async (req, res) => {
  const { documentId, question } = req.body;

  const { retrieved, hasSufficientContext } = await prepareRetrieval(req.userId, documentId, question);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  if (!hasSufficientContext) {
    send("token", { text: NOT_FOUND_MESSAGE });
    send("done", { notFound: true, citations: [] });
    return res.end();
  }

  const prompt = buildGroundedPrompt(question, retrieved);
  let fullAnswer = "";

  try {
    for await (const textPiece of llmProvider.generateStream(prompt, { systemInstruction: SYSTEM_INSTRUCTION })) {
      fullAnswer += textPiece;
      send("token", { text: textPiece });
    }
  } catch (err) {
    send("error", { message: "The AI service is temporarily unavailable." });
    return res.end();
  }

  if (fullAnswer.trim() === NOT_FOUND_MARKER) {
    send("done", { notFound: true, citations: [] });
    return res.end();
  }

  const citations = extractCitations(fullAnswer, retrieved);
  logger.info({ userId: req.userId, documentId }, "audit:question_asked_streamed");
  send("done", { notFound: false, citations });
  res.end();
});

module.exports = { askQuestion, askQuestionStream };