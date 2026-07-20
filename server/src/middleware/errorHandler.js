const logger = require("../utils/logger");

/**
 * Single global error handler (registered last in app.js).
 * - Operational errors (AppError subclasses): expose the specific message.
 * - Anything else (bugs, unexpected exceptions): generic message only.
 * Stack traces are NEVER sent to the client, in any environment.
 * See EXCEPTION_HANDLING_AND_SECURITY.md §5.2.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  logger.error(
    { err: { message: err.message, stack: err.stack }, path: req.path, method: req.method },
    "Request error"
  );

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : "Something went wrong. Please try again.",
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `No route for ${req.method} ${req.path}` });
}

module.exports = { errorHandler, notFoundHandler };
