const mongoose = require("mongoose");

/**
 * Server-side record of issued refresh tokens so they can be revoked
 * (logout, password change, detected reuse of a rotated-out token).
 * We store a hash-free reference (jti) rather than the token itself.
 * See EXCEPTION_HANDLING_AND_SECURITY.md §1.2.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jti: {
      type: String,
      required: true,
      unique: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB automatically deletes expired token records.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
