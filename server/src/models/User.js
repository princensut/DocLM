const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    themePreference: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    // Incremented on password change / "log out everywhere" to invalidate
    // all previously-issued refresh tokens at once. See security doc §1.2.
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Never let passwordHash leak into API responses by accident.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
