const isProduction = process.env.NODE_ENV === "production";

/**
 * Centralized Express error handler. Every error — malformed JSON,
 * Mongoose validation, unexpected exceptions — comes out the other
 * side as the same predictable `{ success, message }` shape, and
 * never leaks a stack trace or raw database error to the client.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);
  if (!isProduction && err.stack) {
    console.error(err.stack);
  }

  // Malformed JSON body (express.json() throws a SyntaxError with this shape).
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ success: false, message: "Malformed JSON in request body." });
  }

  // Request body larger than the configured limit.
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large." });
  }

  // Mongoose schema validation errors (e.g. from TypingResult.create()).
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error." : err.message,
  });
}
