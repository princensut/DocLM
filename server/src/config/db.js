const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

async function connectDB() {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongodbUri);
    logger.info("MongoDB Atlas connected");
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed");
    // Fail fast: the app is useless without a DB connection.
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
}

module.exports = connectDB;
