import { verifyToken } from "../utils/jwt.js";

/**
 * Pulls a bearer token out of the Authorization header, or returns
 * null if the header is missing/malformed. Shared by both middlewares
 * below so the parsing rule lives in exactly one place.
 */
function extractToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") return null;

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

/**
 * Protects a route: requires a valid, non-expired JWT. On success,
 * attaches `req.userId` (a string) for downstream controllers. On
 * failure, responds with a clean 401 JSON body and never reaches the
 * controller — there is no way to "continue anyway" without a valid
 * token.
 */
export function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  try {
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return res.status(401).json({ success: false, message: "Invalid authentication token." });
    }
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired authentication token." });
  }
}

/**
 * Does NOT require a token. If a valid one is present, attaches
 * `req.userId` so the route can behave as "authenticated"; if it's
 * absent, malformed, or expired, the request simply continues as
 * anonymous — used by POST /api/results, which must keep working for
 * logged-out users while still recognizing logged-in ones.
 */
export function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    req.userId = null;
    return next();
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload && payload.userId ? payload.userId : null;
  } catch {
    // An invalid/expired token on an optional route is not an error —
    // it just means this request is treated as anonymous.
    req.userId = null;
  }
  next();
}
