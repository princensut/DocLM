const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();

const required = ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `[config] Missing required environment variables: ${missing.join(", ")}. ` +
      `Set these in your hosting platform's environment variable settings (they are NOT read from a .env file in production).`
  );
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
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173").replace(/\/$/, ""),
  },
  retrieval: {
    topK: parseInt(process.env.RETRIEVAL_TOP_K || "5", 10),
    minScore: parseFloat(process.env.RETRIEVAL_MIN_SCORE || "0.4"),
    useAtlasVectorSearch: process.env.USE_ATLAS_VECTOR_SEARCH === "true",
  },
};
