/**
 * Wraps an async route handler so any thrown/rejected error is
 * forwarded to Express's error-handling middleware via next(err),
 * instead of crashing the process or leaving the request hanging.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
