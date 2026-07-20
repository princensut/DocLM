const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiters");
const { validateBody, signupSchema, loginSchema, themeSchema } = require("../utils/validation");

const router = express.Router();

router.post("/signup", authLimiter, validateBody(signupSchema), authController.signup);
router.post("/login", authLimiter, validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);
router.patch("/me/theme", requireAuth, validateBody(themeSchema), authController.updateTheme);

module.exports = router;
