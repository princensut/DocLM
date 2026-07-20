const express = require("express");
const chatController = require("../controllers/chatController");
const { requireAuth } = require("../middleware/auth");
const { chatLimiter } = require("../middleware/rateLimiters");
const { validateBody, askQuestionSchema } = require("../utils/validation");

const router = express.Router();

router.use(requireAuth);

router.post("/ask", chatLimiter, validateBody(askQuestionSchema), chatController.askQuestion);
router.post("/ask/stream", chatLimiter, validateBody(askQuestionSchema), chatController.askQuestionStream);

module.exports = router;
