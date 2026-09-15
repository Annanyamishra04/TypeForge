import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { TypingResult } from "../models/TypingResult.js";
import { isDbReady } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateRegisterPayload, validateLoginPayload, normalizeEmail } from "../utils/validateAuth.js";
import { signToken } from "../utils/jwt.js";
import { validateSessionId } from "../utils/validateResult.js";

const BCRYPT_COST_FACTOR = 12;

/** Shape returned to clients for a user — never the passwordHash. */
function toSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const errors = validateRegisterPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Invalid registration details.", errors });
  }

  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available — cannot register." });
  }

  const name = req.body.name.trim();
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return res.status(409).json({ success: false, message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

  const user = await User.create({ name, email, passwordHash });
  const token = signToken(user._id);

  res.status(201).json({ success: true, token, user: toSafeUser(user) });
});

/**
 * POST /api/auth/login
 *
 * Returns the same generic error for "no such email" and "wrong
 * password" so a caller can't use this endpoint to enumerate which
 * emails have accounts.
 */
export const login = asyncHandler(async (req, res) => {
  const errors = validateLoginPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Invalid login details.", errors });
  }

  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available — cannot log in." });
  }

  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  const GENERIC_ERROR = { success: false, message: "Incorrect email or password." };

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    return res.status(401).json(GENERIC_ERROR);
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json(GENERIC_ERROR);
  }

  const token = signToken(user._id);
  res.json({ success: true, token, user: toSafeUser(user) });
});

/**
 * GET /api/auth/me
 * Protected by requireAuth — req.userId comes from a verified JWT.
 */
export const getMe = asyncHandler(async (req, res) => {
  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available." });
  }

  const user = await User.findById(req.userId).lean();
  if (!user) {
    // Token was valid but the account no longer exists (e.g. deleted).
    return res.status(401).json({ success: false, message: "Account no longer exists." });
  }

  res.json({ success: true, user: toSafeUser(user) });
});

/**
 * POST /api/auth/claim-session
 * Protected by requireAuth.
 *
 * Moves anonymous results (userId === null) recorded under a given
 * sessionId onto the authenticated account. Deliberately scoped so it
 * can never touch results already owned by someone else — the
 * `userId: null` clause in the query is the entire security guarantee
 * here, not an incidental detail.
 */
export const claimSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body || {};

  if (!validateSessionId(sessionId)) {
    return res.status(400).json({ success: false, message: "Invalid sessionId." });
  }

  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available." });
  }

  const result = await TypingResult.updateMany(
    { sessionId, userId: null },
    { $set: { userId: req.userId } }
  );

  res.json({ success: true, claimed: result.modifiedCount });
});
