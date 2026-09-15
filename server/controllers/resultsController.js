import mongoose from "mongoose";
import { TypingResult } from "../models/TypingResult.js";
import { isDbReady } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateResultPayload, validateSessionId } from "../utils/validateResult.js";

const MAX_HISTORY_LIMIT = 100;
const DEFAULT_HISTORY_LIMIT = 50;
const RECENT_TESTS_LIMIT = 10;

const EMPTY_STATS = {
  totalTests: 0,
  bestWpm: 0,
  averageWpm: 0,
  bestAccuracy: 0,
  averageAccuracy: 0,
  totalErrors: 0,
};

// Period filter for the analytics endpoint. "all" is deliberately not
// mapped to a lookback window below — it means "no createdAt filter".
const ANALYTICS_PERIODS = {
  all: null,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const EMPTY_ANALYTICS_SUMMARY = {
  totalTests: 0,
  bestWpm: 0,
  averageWpm: 0,
  bestAccuracy: 0,
  averageAccuracy: 0,
  totalErrors: 0,
  totalTypedCharacters: 0,
  averageErrors: 0,
};

/**
 * POST /api/results
 *
 * Validates the payload regardless of database state (bad input is
 * bad input whether or not we can persist it), then only attempts to
 * save — and only ever reports success — if MongoDB is actually
 * connected. Never claims a save happened when it didn't.
 *
 * Ownership: this route sits behind `optionalAuth`, which sets
 * `req.userId` from a verified JWT when one is present, or `null`
 * otherwise. That — never anything in `req.body` — is the only source
 * of truth for whose result this is. Any `userId` the client tries to
 * supply in the body is ignored entirely, so one user can never save a
 * result under another user's identity.
 */
export const saveResult = asyncHandler(async (req, res) => {
  const errors = validateResultPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Invalid result payload.", errors });
  }

  if (!isDbReady()) {
    return res.status(503).json({
      success: false,
      message: "Database is not available — result was not persisted.",
    });
  }

  const {
    sessionId,
    mode,
    durationSeconds,
    elapsedSeconds,
    wpm,
    accuracy,
    correctChars,
    incorrectChars,
    totalChars,
    errors: errorCount,
    punctuation = false,
    numbers = false,
  } = req.body;

  const saved = await TypingResult.create({
    sessionId,
    // req.userId is populated exclusively by the optionalAuth
    // middleware from a verified token — never from req.body.
    userId: req.userId || null,
    mode,
    durationSeconds,
    elapsedSeconds,
    wpm,
    accuracy,
    correctChars,
    incorrectChars,
    totalChars,
    errors: errorCount,
    punctuation,
    numbers,
  });

  res.status(201).json({
    success: true,
    id: saved._id,
    result: {
      id: saved._id,
      mode: saved.mode,
      durationSeconds: saved.durationSeconds,
      wpm: saved.wpm,
      accuracy: saved.accuracy,
      createdAt: saved.createdAt,
    },
  });
});

/**
 * GET /api/results/:sessionId
 * Only ever returns documents matching the requested session — never
 * another session's data — sorted newest first, capped at a sensible
 * maximum regardless of what `limit` the caller requests.
 */
export const getHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!validateSessionId(sessionId)) {
    return res.status(400).json({ success: false, message: "Invalid sessionId." });
  }

  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available.", results: [] });
  }

  const requestedLimit = parseInt(req.query.limit, 10);
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_HISTORY_LIMIT)
      : DEFAULT_HISTORY_LIMIT;

  const results = await TypingResult.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-__v")
    .lean();

  res.json({ success: true, results });
});

/**
 * GET /api/results/:sessionId/stats
 * Every number here is aggregated from that session's actual stored
 * documents — nothing is hardcoded, and an empty/no-data session gets
 * honest zeros rather than an error.
 */
export const getStats = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!validateSessionId(sessionId)) {
    return res.status(400).json({ success: false, message: "Invalid sessionId." });
  }

  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available.", stats: EMPTY_STATS });
  }

  const [agg] = await TypingResult.aggregate([
    { $match: { sessionId } },
    {
      $group: {
        _id: null,
        totalTests: { $sum: 1 },
        bestWpm: { $max: "$wpm" },
        averageWpm: { $avg: "$wpm" },
        bestAccuracy: { $max: "$accuracy" },
        averageAccuracy: { $avg: "$accuracy" },
        totalErrors: { $sum: "$errors" },
      },
    },
  ]);

  if (!agg) {
    return res.json({ success: true, stats: EMPTY_STATS });
  }

  res.json({
    success: true,
    stats: {
      totalTests: agg.totalTests,
      bestWpm: Math.round(agg.bestWpm),
      averageWpm: Math.round(agg.averageWpm * 10) / 10,
      bestAccuracy: Math.round(agg.bestAccuracy * 10) / 10,
      averageAccuracy: Math.round(agg.averageAccuracy * 10) / 10,
      totalErrors: agg.totalErrors,
    },
  });
});

/**
 * GET /api/results/me
 * Protected by requireAuth. The user identity comes solely from
 * `req.userId` (set from a verified JWT) — there is no way to pass a
 * different user's id via query string or body and have it honored,
 * so this can never return another account's results.
 */
export const getMyHistory = asyncHandler(async (req, res) => {
  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available.", results: [] });
  }

  const requestedLimit = parseInt(req.query.limit, 10);
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_HISTORY_LIMIT)
      : DEFAULT_HISTORY_LIMIT;

  const results = await TypingResult.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-__v")
    .lean();

  res.json({ success: true, results });
});

/**
 * GET /api/results/me/stats
 * Protected by requireAuth. Aggregates only documents owned by
 * `req.userId` — the authenticated user's identity, never a
 * client-supplied one.
 */
export const getMyStats = asyncHandler(async (req, res) => {
  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available.", stats: EMPTY_STATS });
  }

  const [agg] = await TypingResult.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
    {
      $group: {
        _id: null,
        totalTests: { $sum: 1 },
        bestWpm: { $max: "$wpm" },
        averageWpm: { $avg: "$wpm" },
        bestAccuracy: { $max: "$accuracy" },
        averageAccuracy: { $avg: "$accuracy" },
        totalErrors: { $sum: "$errors" },
      },
    },
  ]);

  if (!agg) {
    return res.json({ success: true, stats: EMPTY_STATS });
  }

  res.json({
    success: true,
    stats: {
      totalTests: agg.totalTests,
      bestWpm: Math.round(agg.bestWpm),
      averageWpm: Math.round(agg.averageWpm * 10) / 10,
      bestAccuracy: Math.round(agg.bestAccuracy * 10) / 10,
      averageAccuracy: Math.round(agg.averageAccuracy * 10) / 10,
      totalErrors: agg.totalErrors,
    },
  });
});

/**
 * GET /api/results/me/analytics?period=all|7d|30d|90d
 *
 * Protected by requireAuth. Every query below is scoped to
 * `req.userId` — derived exclusively from the verified JWT by the
 * `requireAuth` middleware — so there is no request parameter a
 * caller can use to read another account's data. `period` only ever
 * narrows the *time range* of that same user's own documents.
 */
export const getMyAnalytics = asyncHandler(async (req, res) => {
  const periodParam = typeof req.query.period === "string" ? req.query.period : "all";

  if (!Object.prototype.hasOwnProperty.call(ANALYTICS_PERIODS, periodParam)) {
    return res.status(400).json({
      success: false,
      message: `Invalid period. Must be one of: ${Object.keys(ANALYTICS_PERIODS).join(", ")}.`,
    });
  }

  if (!isDbReady()) {
    return res.status(503).json({
      success: false,
      message: "Database is not available.",
      analytics: {
        period: periodParam,
        summary: EMPTY_ANALYTICS_SUMMARY,
        trend: [],
        recentTests: [],
        modeBreakdown: [],
        durationBreakdown: [],
      },
    });
  }

  const userId = new mongoose.Types.ObjectId(req.userId);

  const lookbackDays = ANALYTICS_PERIODS[periodParam];
  const match = { userId };
  if (lookbackDays) {
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    match.createdAt = { $gte: since };
  }

  // Everything below is derived from the same `match` filter, so the
  // period selection actually changes every section of the response —
  // not just a label.
  const [summaryAgg, trendDocs, recentDocs, modeAgg, durationAgg] = await Promise.all([
    TypingResult.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          bestWpm: { $max: "$wpm" },
          averageWpm: { $avg: "$wpm" },
          bestAccuracy: { $max: "$accuracy" },
          averageAccuracy: { $avg: "$accuracy" },
          totalErrors: { $sum: "$errors" },
          totalTypedCharacters: { $sum: "$totalChars" },
          averageErrors: { $avg: "$errors" },
        },
      },
    ]),
    // Chronological (oldest first) so charts read left-to-right.
    // Capped generously — chart legibility degrades long before this
    // limit matters, and it keeps payload size bounded for accounts
    // with a long history.
    TypingResult.find(match)
      .sort({ createdAt: 1 })
      .limit(2000)
      .select("createdAt wpm accuracy errors -_id")
      .lean(),
    TypingResult.find(match)
      .sort({ createdAt: -1 })
      .limit(RECENT_TESTS_LIMIT)
      .select("-__v -userId -sessionId")
      .lean(),
    TypingResult.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$mode",
          tests: { $sum: 1 },
          averageWpm: { $avg: "$wpm" },
          averageAccuracy: { $avg: "$accuracy" },
          bestWpm: { $max: "$wpm" },
        },
      },
    ]),
    TypingResult.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$durationSeconds",
          tests: { $sum: 1 },
          averageWpm: { $avg: "$wpm" },
          bestWpm: { $max: "$wpm" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const summary = summaryAgg[0]
    ? {
        totalTests: summaryAgg[0].totalTests,
        bestWpm: Math.round(summaryAgg[0].bestWpm),
        averageWpm: Math.round(summaryAgg[0].averageWpm * 10) / 10,
        bestAccuracy: Math.round(summaryAgg[0].bestAccuracy * 10) / 10,
        averageAccuracy: Math.round(summaryAgg[0].averageAccuracy * 10) / 10,
        totalErrors: summaryAgg[0].totalErrors,
        totalTypedCharacters: summaryAgg[0].totalTypedCharacters,
        averageErrors: Math.round(summaryAgg[0].averageErrors * 10) / 10,
      }
    : EMPTY_ANALYTICS_SUMMARY;

  const trend = trendDocs.map((doc, index) => ({
    date: doc.createdAt,
    wpm: doc.wpm,
    accuracy: doc.accuracy,
    errors: doc.errors,
    testNumber: index + 1,
  }));

  const recentTests = recentDocs.map((doc) => ({
    id: doc._id,
    mode: doc.mode,
    durationSeconds: doc.durationSeconds,
    elapsedSeconds: doc.elapsedSeconds,
    wpm: doc.wpm,
    accuracy: doc.accuracy,
    errors: doc.errors,
    punctuation: doc.punctuation,
    numbers: doc.numbers,
    createdAt: doc.createdAt,
  }));

  const modeBreakdown = modeAgg.map((m) => ({
    mode: m._id,
    tests: m.tests,
    averageWpm: Math.round(m.averageWpm * 10) / 10,
    averageAccuracy: Math.round(m.averageAccuracy * 10) / 10,
    bestWpm: Math.round(m.bestWpm),
  }));

  const durationBreakdown = durationAgg.map((d) => ({
    durationSeconds: d._id,
    tests: d.tests,
    averageWpm: Math.round(d.averageWpm * 10) / 10,
    bestWpm: Math.round(d.bestWpm),
  }));

  res.json({
    success: true,
    analytics: {
      period: periodParam,
      summary,
      trend,
      recentTests,
      modeBreakdown,
      durationBreakdown,
    },
  });
});
