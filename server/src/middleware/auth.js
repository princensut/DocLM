const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { AuthenticationError } = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Verifies the access token cookie and attaches req.userId.
 * Every /api/documents/* and /api/chat/* route uses this.
 * See EXCEPTION_HANDLING_AND_SECURITY.md §1.3.
 */
const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new AuthenticationError("You must be logged in to do that");
  }

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.userId = payload.userId;
    next();
  } catch (err) {
    throw new AuthenticationError("Your session has expired - please log in again");
  }
});

module.exports = { requireAuth };
