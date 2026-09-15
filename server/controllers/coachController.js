import { isDbReady } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getCoachReport } from "../services/coachService.js";

/**
 * GET /api/coach/me
 *
 * Protected by requireAuth. The user identity comes solely from
 * `req.userId` (set from a verified JWT) — there is no request
 * parameter that can make this return another account's coaching
 * data. All statistics are derived from that user's own TypingResult
 * documents; nothing is accepted from the client as authoritative.
 *
 * Never fails just because there isn't enough data yet or an AI
 * provider isn't configured — both are represented as normal, honest
 * response shapes rather than errors.
 */
export const getMyCoachReport = asyncHandler(async (req, res) => {
  if (!isDbReady()) {
    return res.status(503).json({
      success: false,
      message: "Database is not available.",
      ready: false,
      insights: null,
    });
  }

  const report = await getCoachReport(req.userId);

  res.json({
    success: true,
    ...report,
  });
});
