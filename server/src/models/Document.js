const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    status: {
      type: String,
      enum: ["uploading", "processing", "ready", "failed"],
      default: "uploading",
      index: true,
    },
    pageCount: { type: Number, default: null },
    chunkCount: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
    // Watchdog field: lets us detect documents stuck in "processing"
    // beyond a reasonable threshold. See security doc §5.3.
    processingStartedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
