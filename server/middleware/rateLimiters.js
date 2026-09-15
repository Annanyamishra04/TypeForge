import rateLimit from "express-rate-limit";

/**
 * Rate limiters for endpoints where abuse would matter most on a
 * small, free-tier deployment: credential guessing on auth, and
 * anything that fans out to paid/limited external resources (the AI
 * Coach call, certificate generation). Limits are intentionally
 * generous for normal human usage and only bite automated abuse.
 *
 * All limiters share the same clean JSON error shape used elsewhere
 * in the API and never leak internal details.
 */
function jsonRateLimitHandler(req, res) {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
}

/** POST /api/auth/register, POST /api/auth/login — guards against credential stuffing / brute force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/** GET /api/coach/me — the only route that can trigger a paid AI provider call. */
export const coachLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/** POST /api/certificates — cheap to call repeatedly otherwise, still worth capping. */
export const certificateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});
