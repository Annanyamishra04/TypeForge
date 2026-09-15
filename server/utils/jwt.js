import jwt from "jsonwebtoken";

const TOKEN_EXPIRY = "7d";

/**
 * Signs a JWT containing only the minimum identity claim needed to
 * look up the user again later — never the password/hash, never
 * unnecessary personal data.
 *
 * Throws if JWT_SECRET is missing rather than silently signing with
 * an empty/undefined secret, which would make every token forgeable.
 */
export function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured on the server.");
  }
  return jwt.sign({ userId: String(userId) }, secret, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verifies a token and returns its decoded payload, or throws if the
 * token is missing, malformed, expired, or signed with a different
 * secret. Callers are expected to catch and translate this into a
 * 401 response — this function itself makes no HTTP assumptions.
 */
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured on the server.");
  }
  return jwt.verify(token, secret);
}
