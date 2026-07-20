const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const pinoHttp = require("pino-http");

const env = require("./config/env");
const logger = require("./utils/logger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

// Trust the hosting platform's reverse proxy (Render/Railway) so
// secure cookies and req.ip behave correctly behind it.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.cors.origin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/health" } }));

// Lightweight CSRF defense for cookie-authenticated state-changing
// requests: require a custom header that a cross-site form post
// cannot set. See EXCEPTION_HANDLING_AND_SECURITY.md §2.
app.use((req, res, next) => {
  const isStateChanging = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method);
  const isAuthRoute = req.path.startsWith("/api/auth/login") || req.path.startsWith("/api/auth/signup");
  if (isStateChanging && !isAuthRoute && req.headers["x-requested-with"] !== "rag-chat-app") {
    return res.status(403).json({ success: false, message: "Missing required request header" });
  }
  next();
});

app.get("/api/health", (_req, res) => res.json({ success: true, status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
