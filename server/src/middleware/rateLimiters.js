const rateLimit = require("express-rate-limit");

// See EXCEPTION_HANDLING_AND_SECURITY.md §4 for rationale on each limit.
// In-memory store is fine for a single instance; swap to a Redis store
// (rate-limit-redis) if this ever runs across multiple instances.

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again in a few minutes." },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Upload limit reached for this hour. Please try again later." },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "You've reached the question limit for this hour." },
});

module.exports = { authLimiter, uploadLimiter, chatLimiter };
