const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongodbUri);
    logger.info("MongoDB Atlas connected");
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed");
    if (require.main === module || process.env.VERCEL !== "1") {
      process.exit(1);
    }
    throw err;
  }

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
}

module.exports = connectDB;
