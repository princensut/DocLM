const dns = require("dns");
// Prefer IPv4 when resolving hostnames. Without this, on networks where
// IPv6 is advertised via DNS but not actually routable (common on some
// home/ISP setups), Node's fetch (undici) tries the IPv6 address first
// and hangs for the full connect timeout before ever trying IPv4 - even
// though curl and browsers work fine because they resolve IPv4 by default
// in that scenario. Symptom this fixes: "fetch failed / ConnectTimeoutError"
// from the Gemini SDK while curl to the same host succeeds instantly.
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();

/**
 * Centralized, validated access to environment variables.
 * Fail fast at startup if something critical is missing, rather than
 * surfacing a confusing error deep inside a request handler later.
 */
const required = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    `[config] Missing required environment variables: ${missing.join(", ")}`
  );
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",

  mongodbUri: process.env.MONGODB_URI,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },

  providers: {
    llm: process.env.LLM_PROVIDER || "gemini",
    embedding: process.env.EMBEDDING_PROVIDER || "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },

  upload: {
    maxSizeBytes: parseInt(process.env.MAX_UPLOAD_MB || "7", 10) * 1024 * 1024,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  },

  retrieval: {
    topK: parseInt(process.env.RETRIEVAL_TOP_K || "5", 10),
    minScore: parseFloat(process.env.RETRIEVAL_MIN_SCORE || "0.55"),
    useAtlasVectorSearch: process.env.USE_ATLAS_VECTOR_SEARCH === "true",
  },
};