/**
 * Base class for all "operational" errors - expected failure modes
 * (bad input, not found, unauthorized, etc.) whose message is safe
 * to send back to the client verbatim.
 *
 * Anything that is NOT one of these (a bug, an unexpected exception)
 * falls through to the global error handler's generic 500 response.
 * See EXCEPTION_HANDLING_AND_SECURITY.md §5.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = "Invalid request data") {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "You do not have access to this resource") {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

class FileTooLargeError extends AppError {
  constructor(message = "File exceeds the maximum allowed size") {
    super(message, 413);
  }
}

class UnsupportedFileTypeError extends AppError {
  constructor(message = "Unsupported file type") {
    super(message, 415);
  }
}

class RateLimitError extends AppError {
  constructor(message = "Too many requests - please slow down") {
    super(message, 429);
  }
}

class ProviderError extends AppError {
  constructor(message = "The AI service is temporarily unavailable") {
    super(message, 502);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  FileTooLargeError,
  UnsupportedFileTypeError,
  RateLimitError,
  ProviderError,
};
