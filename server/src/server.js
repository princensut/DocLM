const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} (${env.nodeEnv})`);
  });

  process.on("unhandledRejection", (err) => {
    logger.error({ err }, "Unhandled promise rejection - shutting down");
    server.close(() => process.exit(1));
  });
}

start();
