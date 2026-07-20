const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const env = require("../config/env");
const RefreshToken = require("../models/RefreshToken");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseExpiryToMs(expiry) {
  // Supports simple "15m" / "7d" style strings used in env config.
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 15 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: MS_PER_DAY };
  return value * unitMs[unit];
}

function signAccessToken(userId) {
  return jwt.sign({ userId }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiry });
}

/**
 * Issues a new refresh token, recording its jti server-side so it can
 * later be revoked/rotated. See EXCEPTION_HANDLING_AND_SECURITY.md §1.2.
 */
async function issueRefreshToken(userId, tokenVersion) {
  const jti = uuidv4();
  const token = jwt.sign({ userId, tokenVersion, jti }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiry,
  });

  const expiresAt = new Date(Date.now() + parseExpiryToMs(env.jwt.refreshExpiry));
  await RefreshToken.create({ userId, jti, expiresAt });

  return token;
}

/**
 * Verifies a refresh token and its server-side record. Implements
 * rotation-with-reuse-detection: if a token that's already been
 * revoked is presented again (a sign of theft/replay), every refresh
 * token for that user is revoked as a precaution.
 */
async function verifyAndRotateRefreshToken(token) {
  const payload = jwt.verify(token, env.jwt.refreshSecret); // throws if invalid/expired
  const record = await RefreshToken.findOne({ jti: payload.jti });

  if (!record || record.revoked) {
    // Reuse of a rotated-out (or unknown) token - revoke everything for safety.
    await RefreshToken.updateMany({ userId: payload.userId }, { revoked: true });
    const err = new Error("Refresh token reuse detected");
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  // Rotate: revoke the presented token, issue a new one.
  record.revoked = true;
  await record.save();

  return payload; // { userId, tokenVersion, jti }
}

async function revokeAllRefreshTokens(userId) {
  await RefreshToken.updateMany({ userId }, { revoked: true });
}

module.exports = {
  signAccessToken,
  issueRefreshToken,
  verifyAndRotateRefreshToken,
  revokeAllRefreshTokens,
};
