const app = require("../src/app");
const connectDB = require("../src/config/db");

// Vercel serverless functions have no persistent process, so there's
// no single app.listen() call like in normal Node hosting. Instead,
// this file's default export IS the request handler Vercel invokes
// per request. We lazily connect to MongoDB once per cold start and
// reuse that connection across warm invocations.
let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
};
