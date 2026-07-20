# Exception Handling & Security Document
## Document-Grounded RAG Chat Application

| | |
|---|---|
| **Companion to** | PRD.md, ARCHITECTURE.md, FRONTEND.md |
| **Status** | Draft v1.0 |
| **Last updated** | July 18, 2026 |

This document covers **practical, production-solid security** (auth, transport, input handling, rate limiting) plus a set of **enterprise-style practices** (refresh-token rotation, CSRF defenses, structured audit logging) applied where they're genuinely justified rather than added for their own sake — since going overboard on things like full threat modeling for a small app is itself a signal of poor judgment, not rigor.

---

## 1. Authentication & Session Security

### 1.1 Password Handling
- Passwords hashed with **bcrypt** (cost factor ≥ 10; 12 recommended if latency budget allows).
- Never log, echo, or store plaintext passwords anywhere (not even in error messages or debug logs).
- Minimum password policy enforced client- and server-side (e.g., ≥ 8 chars); server-side validation is the source of truth — client-side is UX only.

### 1.2 JWT Strategy
- **Access token**: short-lived (15 min), signed with `JWT_ACCESS_SECRET`, contains only `userId` and `iat/exp` — no sensitive data in the payload (JWTs are base64, not encrypted).
- **Refresh token**: longer-lived (7 days), signed with a **separate secret** (`JWT_REFRESH_SECRET`), stored server-side association (a `refreshTokens` collection or a `tokenVersion` field on `users`) so tokens can be **revoked** (e.g., on logout or password change) — a plain stateless refresh token can't be invalidated early, which is the usual gap in "basic" JWT implementations.
- Both tokens are set as **httpOnly, Secure, SameSite=Lax** cookies — never returned in the JSON response body, never stored in `localStorage`/`sessionStorage` (eliminates the most common JWT-in-XSS theft vector).
- **Refresh rotation**: each successful refresh issues a new refresh token and invalidates the old one (rotation), and if an already-used/revoked refresh token is presented, all sessions for that user are invalidated — this specifically defends against replay of a stolen refresh token.
- Logout clears both cookies and revokes the server-side refresh record.

### 1.3 Authorization
- All `/api/documents/*` and `/api/chat/*` routes go through `authMiddleware`, which verifies the access token and attaches `req.userId`.
- Every database query for documents/chunks/messages is **scoped by `userId`** at the query level (not just checked after fetching) — e.g. `Document.findOne({ _id, userId: req.userId })`, so one user can never retrieve, modify, or delete another user's data even via a guessed/enumerated ID (IDOR prevention).

---

## 2. Transport & Cross-Origin Security

- **HTTPS only** in production (enforced by the hosting platforms — Vercel/Render/Railway provide TLS by default); an HSTS header is set from the API.
- **CORS**: explicit origin allow-list (the deployed Vercel URL + localhost in dev), `credentials: true` — no wildcard origin, since wildcard + credentialed cookies is invalid per spec and a red flag if attempted.
- **CSRF defense**: because auth relies on cookies rather than an `Authorization` header, the API additionally validates a custom header (e.g. `X-Requested-With` or a double-submit CSRF token) on state-changing requests (`POST`/`PATCH`/`DELETE`), since `SameSite=Lax` cookies alone reduce but don't fully eliminate CSRF risk for all request types.
- **Helmet** middleware sets standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy` baseline, etc.).

---

## 3. Input Validation & File Upload Safety

- **Schema validation** (e.g., `zod` or `Joi`) on every request body — auth payloads, chat questions, document metadata — rejecting unexpected fields and enforcing types/lengths before controllers ever run.
- **File upload constraints** (Multer):
  - Hard cap: **7 MB per file**, enforced via `limits: { fileSize: 7 * 1024 * 1024 }` — requests exceeding this are rejected by Multer before the file is fully buffered, not after.
  - MIME/type allow-list: only `application/pdf` and `text/plain` accepted; extension is cross-checked against detected MIME type (not trusted from the filename alone) to reduce risk of disguised file types.
  - Files are processed in memory/temp storage and never executed or served back as static assets — they're parsed for text content only, never stored in a web-accessible path.
- **NoSQL injection prevention**: Mongoose schema typing plus explicit casting of query parameters (never passing raw `req.body`/`req.query` objects directly into `find()`), which closes the classic `{"$gt": ""}` MongoDB operator-injection pattern.
- **Prompt-injection awareness (RAG-specific)**: document content is untrusted input to the LLM. The system prompt explicitly instructs the model to treat retrieved chunks as reference data, not as instructions to follow — mitigating (not fully eliminating) the risk of a malicious document trying to hijack the assistant's behavior via embedded text like "ignore previous instructions."

---

## 4. Rate Limiting & Abuse Prevention

| Endpoint group | Limit (indicative) | Rationale |
|---|---|---|
| `/api/auth/login`, `/api/auth/signup` | e.g., 10 requests / 15 min / IP | Slows credential-stuffing / brute-force attempts. |
| `/api/documents/upload` | e.g., 20 uploads / hour / user | Protects storage and the embedding pipeline from abuse. |
| `/api/chat/ask` | e.g., 30 requests / hour / user (tunable to provider's free-tier quota) | Protects the LLM/embedding provider's free-tier rate limits from being exhausted by a single user, and controls cost if a paid tier is later used. |

- Implemented via `express-rate-limit` (in-memory for a single instance; Redis-backed store if the app scales to multiple instances).
- On exceeding a provider's own rate limit (HTTP 429 from Gemini/OpenAI/etc.), the backend retries with exponential backoff a bounded number of times, then surfaces a clear, honest "the AI service is busy, please try again shortly" error to the client — never a silent failure or a fabricated answer.

---

## 5. Centralized Exception Handling (Backend)

### 5.1 Error Taxonomy
A small set of custom error classes extending a base `AppError` (message, HTTP status, `isOperational` flag) so the difference between **expected/operational errors** (bad input, not found, unauthorized) and **unexpected/programmer errors** (bugs, unhandled exceptions) is explicit:

```
AppError                  (base: statusCode, message, isOperational)
├── ValidationError        (400)
├── AuthenticationError    (401)
├── AuthorizationError     (403)
├── NotFoundError          (404)
├── FileTooLargeError      (413)
├── UnsupportedFileType    (415)
├── RateLimitError         (429)
└── ProviderError          (502 — LLM/embedding provider failure)
```

### 5.2 Global Error Middleware
- Every route handler is wrapped in an `asyncHandler` utility so thrown/rejected errors are automatically forwarded to Express's error-handling middleware (`next(err)`) rather than crashing the process or leaving a hung request.
- A single global error-handling middleware (registered last, with the 4-arg Express signature) is responsible for:
  - Logging the full error (stack trace) server-side.
  - Returning a **sanitized** response to the client: for operational errors, the specific `message` and `statusCode`; for non-operational/unexpected errors, a generic `"Something went wrong"` (500) — **stack traces and internal details are never sent to the client**, even in staging, to avoid leaking implementation details.
  - Distinguishing between `isOperational` errors (safe to expose the message) and everything else (must be generic).

```js
// simplified shape
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational ?? false;

  logger.error({ message: err.message, stack: err.stack, path: req.path });

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : "Something went wrong. Please try again.",
  });
});
```

### 5.3 Pipeline-Specific Error Handling
- **Upload/extraction/chunking/embedding pipeline**: each stage is wrapped so a failure at any step (corrupt PDF, extraction returning empty text, embedding API failure) updates the document's `status` to `"failed"` with a specific `errorMessage`, and **cleans up any partial chunks already written** for that document — no orphaned data, no document stuck silently in `"processing"` forever (a timeout/watchdog also flips long-stuck `"processing"` documents to `"failed"` after a threshold).
- **Retrieval/LLM call failures**: caught and translated into a `ProviderError` (502) with a user-facing message distinct from a genuine "not found in document" response — the UI must never conflate "the AI service is down" with "the document doesn't contain this answer," since those need different user reactions.

### 5.4 Frontend Error Handling
- Axios response interceptor centralizes handling of network failures, 401s (triggering the refresh flow described in §1.2), and 5xx errors (surfaced via a toast/banner, not a blank screen).
- React Query's built-in `error` state per query/mutation drives inline UI error states (e.g., "couldn't load your documents — retry") rather than uncaught promise rejections.
- A top-level **React Error Boundary** wraps the app shell to catch rendering errors and show a friendly fallback UI instead of a blank white screen, with an option to reload.

---

## 6. Logging & Auditing

- Structured logging (e.g., `pino` or `winston`) with log levels (`info`, `warn`, `error`); request logs include method, path, status code, latency, and `userId` (never request bodies containing passwords or full document text).
- **Audit-worthy events** logged distinctly for traceability: signup, login (success/failure), logout, document upload/delete, and any 401/403 occurrences — useful both for debugging and for demonstrating security awareness (this is the kind of detail that reads well in a system-design interview follow-up).
- No sensitive data (passwords, raw JWTs, full document contents, API keys) is ever written to logs.

---

## 7. Secrets Management

- All provider API keys, JWT secrets, and the MongoDB connection string live only in backend environment variables, injected via the hosting platform's secret manager (Vercel env vars are frontend-only and contain no secrets; Render/Railway env vars hold all backend secrets).
- `.env` is git-ignored; `.env.example` lists required variable names with placeholder values only.
- Frontend bundle is verified (via network tab / bundle inspection) to contain **zero** references to provider API keys — all LLM/embedding calls happen server-side, matching the PRD's hard requirement.

---

## 8. Summary Checklist

- [ ] Passwords hashed with bcrypt, never logged.
- [ ] Access + refresh JWTs, httpOnly/Secure/SameSite cookies, refresh rotation + revocation.
- [ ] All data queries scoped by `userId` (IDOR-safe).
- [ ] CORS locked to known origins; CSRF defense on cookie-authenticated state changes.
- [ ] Helmet security headers; HTTPS enforced by hosting platform.
- [ ] Schema validation on all inputs; strict file type/size checks (≤7MB) at Multer level.
- [ ] NoSQL injection prevented via typed Mongoose queries.
- [ ] Prompt-injection-aware system prompt for RAG context.
- [ ] Rate limiting on auth, upload, and chat endpoints; backoff on provider 429s.
- [ ] Centralized error middleware distinguishing operational vs. unexpected errors; no stack traces leaked to clients.
- [ ] Pipeline failures clean up partial data and surface specific, honest error states.
- [ ] Structured, PII/secret-free logging with audit-relevant events captured.
- [ ] All secrets server-side only, verified absent from the frontend bundle.
