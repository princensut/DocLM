const { z } = require("zod");
const { ValidationError } = require("./AppError");

const signupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const askQuestionSchema = z.object({
  documentId: z.string().min(1, "documentId is required"),
  question: z.string().trim().min(1, "Question cannot be empty").max(2000, "Question is too long"),
});

const themeSchema = z.object({
  theme: z.enum(["light", "dark"]),
});

/**
 * Small helper: validates req.body against a Zod schema, throws our
 * own ValidationError (400, operational) with a clean message on
 * failure instead of leaking a raw Zod error shape to the client.
 */
function validateBody(schema) {
  return function (req, _res, next) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return next(new ValidationError(firstIssue?.message || "Invalid request data"));
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  signupSchema,
  loginSchema,
  askQuestionSchema,
  themeSchema,
  validateBody,
};
