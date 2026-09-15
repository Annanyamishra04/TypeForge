import { isDbReady } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAchievementsForUser } from "../services/achievementsService.js";

const EMPTY_ACHIEVEMENTS_RESPONSE = {
  summary: {
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    lastActiveDate: null,
  },
  achievements: [],
};

/**
 * GET /api/achievements/me
 *
 * Protected by requireAuth. The user identity comes solely from
 * `req.userId` (set from a verified JWT by the auth middleware) —
 * there is no request parameter a caller can use to read another
 * account's achievement or streak data, so this can never return a
 * different user's results. Every value returned is derived from that
 * user's own TypingResult documents; nothing here is accepted from
 * the client as authoritative.
 */
export const getMyAchievements = asyncHandler(async (req, res) => {
  if (!isDbReady()) {
    return res.status(503).json({
      success: false,
      message: "Database is not available.",
      ...EMPTY_ACHIEVEMENTS_RESPONSE,
    });
  }

  const data = await getAchievementsForUser(req.userId);

  res.json({
    success: true,
    ...data,
  });
});
