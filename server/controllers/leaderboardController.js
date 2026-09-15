import mongoose from "mongoose";
import { TypingResult, TYPING_MODES } from "../models/TypingResult.js";
import { isDbReady } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ALLOWED_DURATIONS = [15, 30, 60, 120];
const ALLOWED_METRICS = ["wpm", "accuracy"];

// Same shape as the analytics period filter (Phase 6) — kept as its
// own small copy here rather than a shared import, since leaderboard
// and analytics are otherwise independent features and this map is
// four lines.
const LEADERBOARD_PERIODS = {
  all: null,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const EMPTY_LEADERBOARD_RESPONSE = (filters) => ({
  entries: [],
  pagination: { page: 1, limit: DEFAULT_LIMIT, totalUsers: 0, totalPages: 0 },
  filters,
  currentUser: null,
});

/**
 * Parses and validates every leaderboard query parameter up front.
 * Returns either `{ value }` or `{ error }` so the controller can
 * short-circuit with a single, clear 400 rather than letting a bad
 * value silently fall through into the aggregation.
 */
function parseLeaderboardQuery(query) {
  const mode = typeof query.mode === "string" ? query.mode : "all";
  if (mode !== "all" && !TYPING_MODES.includes(mode)) {
    return { error: `Invalid mode. Must be one of: all, ${TYPING_MODES.join(", ")}.` };
  }

  const durationRaw = typeof query.duration === "string" ? query.duration : "all";
  let duration = "all";
  if (durationRaw !== "all") {
    const parsed = parseInt(durationRaw, 10);
    if (!ALLOWED_DURATIONS.includes(parsed)) {
      return { error: `Invalid duration. Must be one of: all, ${ALLOWED_DURATIONS.join(", ")}.` };
    }
    duration = parsed;
  }

  const period = typeof query.period === "string" ? query.period : "all";
  if (!Object.prototype.hasOwnProperty.call(LEADERBOARD_PERIODS, period)) {
    return { error: `Invalid period. Must be one of: ${Object.keys(LEADERBOARD_PERIODS).join(", ")}.` };
  }

  const metric = typeof query.metric === "string" ? query.metric : "wpm";
  if (!ALLOWED_METRICS.includes(metric)) {
    return { error: `Invalid metric. Must be one of: ${ALLOWED_METRICS.join(", ")}.` };
  }

  const pageRaw = parseInt(query.page, 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const limitRaw = parseInt(query.limit, 10);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, MAX_LIMIT) : DEFAULT_LIMIT;

  return { value: { mode, duration, period, metric, page, limit } };
}

/**
 * Builds the $match stage that defines a "qualifying" result:
 * belongs to a registered user, sane numeric ranges, and within the
 * requested mode/duration/period filters. Everything downstream
 * (ranking, pagination, current-user lookup) only ever sees documents
 * that already passed this filter.
 */
function buildMatchStage({ mode, duration, period }) {
  const match = {
    // Anonymous results (userId: null) never qualify — the leaderboard
    // is for registered users only.
    userId: { $ne: null },
    wpm: { $gt: 0 },
    accuracy: { $gte: 0, $lte: 100 },
    durationSeconds: { $gt: 0 },
  };

  if (mode !== "all") {
    match.mode = mode;
  }
  if (duration !== "all") {
    match.durationSeconds = duration;
  }

  const lookbackDays = LEADERBOARD_PERIODS[period];
  if (lookbackDays) {
    match.createdAt = { $gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) };
  }

  return match;
}

/**
 * The sort order that both (a) picks which single result represents
 * a user's "best" for the chosen metric, and (b) ranks users against
 * each other — same tie-break rules apply at both levels, per the
 * spec: higher score first, then the other metric as a tie-breaker,
 * then faster elapsed time, then the earlier result.
 */
function buildSortStage(metric) {
  return metric === "accuracy"
    ? { accuracy: -1, wpm: -1, elapsedSeconds: 1, createdAt: 1 }
    : { wpm: -1, accuracy: -1, elapsedSeconds: 1, createdAt: 1 };
}
function buildRankSortStage(metric) {
  return metric === "accuracy" ? { accuracy: -1 } : { wpm: -1 };
}

/**
 * GET /api/leaderboard
 *
 * Public endpoint (mounted behind `optionalAuth`, never `requireAuth`)
 * — the board itself is visible to everyone. `req.userId` (set only
 * from a verified JWT, never a client-supplied value) is used purely
 * to look up *that same caller's* position in the results that
 * already exist; there is no parameter that lets a caller ask about
 * a different user's rank.
 */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const parsed = parseLeaderboardQuery(req.query);
  if (parsed.error) {
    return res.status(400).json({ success: false, message: parsed.error });
  }
  const { mode, duration, period, metric, page, limit } = parsed.value;
  const filters = { mode, duration: duration === "all" ? "all" : duration, period, metric };

  if (!isDbReady()) {
    return res.status(503).json({
      success: false,
      message: "Database is not available.",
      leaderboard: EMPTY_LEADERBOARD_RESPONSE(filters),
    });
  }

  const match = buildMatchStage({ mode, duration, period });
  const sortStage = buildSortStage(metric);
  const skip = (page - 1) * limit;

  const currentUserId =
    req.userId && mongoose.Types.ObjectId.isValid(req.userId) ? new mongoose.Types.ObjectId(req.userId) : null;

  const pipeline = [
    { $match: match },
    // Sorting before grouping means the $first doc $group keeps for
    // each user is already that user's best-qualifying result under
    // the full tie-break rule, not just their highest raw metric.
    { $sort: sortStage },
    { $group: { _id: "$userId", doc: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$doc" } },
    // Re-sort the now-one-per-user set — $group does not guarantee it
    // preserves the prior stage's ordering — before ranking.
    { $sort: sortStage },
        {
      $setWindowFields: {
        sortBy: buildRankSortStage(metric),
        output: { rank: { $rank: {} } },
      },
    },
    // Drops any result whose account no longer exists — a leaderboard
    // entry always needs a live, joinable user behind it.
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        rank: 1,
        userId: "$userId",
        name: "$user.name",
        wpm: 1,
        accuracy: 1,
        durationSeconds: 1,
        mode: 1,
        createdAt: 1,
      },
    },
    {
      $facet: {
        entries: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
        currentUserEntry: currentUserId ? [{ $match: { userId: currentUserId } }] : [],
      },
    },
  ];

  const [result] = await TypingResult.aggregate(pipeline);

  const totalUsers = result?.totalCount?.[0]?.count || 0;
  const totalPages = totalUsers > 0 ? Math.ceil(totalUsers / limit) : 0;
  const entries = (result?.entries || []).map((e) => ({
    rank: e.rank,
    userId: e.userId,
    name: e.name,
    wpm: e.wpm,
    accuracy: e.accuracy,
    duration: e.durationSeconds,
    mode: e.mode,
    createdAt: e.createdAt,
  }));

  const currentUserDoc = result?.currentUserEntry?.[0] || null;
  const currentUser = currentUserDoc
    ? {
        rank: currentUserDoc.rank,
        name: currentUserDoc.name,
        wpm: currentUserDoc.wpm,
        accuracy: currentUserDoc.accuracy,
        duration: currentUserDoc.durationSeconds,
        mode: currentUserDoc.mode,
        createdAt: currentUserDoc.createdAt,
      }
    : null;

  res.json({
    success: true,
    leaderboard: {
      entries,
      pagination: { page, limit, totalUsers, totalPages },
      filters,
      currentUser,
    },
  });
});
