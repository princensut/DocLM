const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { ConflictError, AuthenticationError } = require("../utils/AppError");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");
const {
  signAccessToken,
  issueRefreshToken,
  verifyAndRotateRefreshToken,
} = require("../services/tokenService");
const logger = require("../utils/logger");

const BCRYPT_ROUNDS = 12;

const signup = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ email, passwordHash });

  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = await issueRefreshToken(user._id.toString(), user.tokenVersion);
  setAuthCookies(res, { accessToken, refreshToken });

  logger.info({ userId: user._id.toString() }, "audit:signup");
  res.status(201).json({ success: true, user: user.toJSON() });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    logger.warn({ email }, "audit:login_failed");
    throw new AuthenticationError("Incorrect email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    logger.warn({ userId: user._id.toString() }, "audit:login_failed");
    throw new AuthenticationError("Incorrect email or password");
  }

  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = await issueRefreshToken(user._id.toString(), user.tokenVersion);
  setAuthCookies(res, { accessToken, refreshToken });

  logger.info({ userId: user._id.toString() }, "audit:login_success");
  res.json({ success: true, user: user.toJSON() });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new AuthenticationError("No refresh token provided");
  }

  const payload = await verifyAndRotateRefreshToken(token);

  const user = await User.findById(payload.userId);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    // tokenVersion mismatch => password changed / all-sessions revoked since issuance.
    throw new AuthenticationError("Session is no longer valid - please log in again");
  }

  const accessToken = signAccessToken(user._id.toString());
  const newRefreshToken = await issueRefreshToken(user._id.toString(), user.tokenVersion);
  setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });

  res.json({ success: true });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = await verifyAndRotateRefreshToken(token);
      logger.info({ userId: payload.userId }, "audit:logout");
    } catch {
      // Token already invalid/expired - nothing to revoke, just clear cookies.
    }
  }
  clearAuthCookies(res);
  res.json({ success: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new AuthenticationError("Session is no longer valid");
  }
  res.json({ success: true, user: user.toJSON() });
});

const updateTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body;
  const user = await User.findByIdAndUpdate(
    req.userId,
    { themePreference: theme },
    { new: true }
  );
  res.json({ success: true, user: user.toJSON() });
});

module.exports = { signup, login, refresh, logout, me, updateTheme };
