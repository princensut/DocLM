const pino = require("pino");

// Structured logging. Never log passwords, raw JWTs, full document text,
// or API keys anywhere in this app - see EXCEPTION_HANDLING_AND_SECURITY.md §6.
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

module.exports = logger;
