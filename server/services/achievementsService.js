import { TypingResult } from "../models/TypingResult.js";
import { ACHIEVEMENTS, REQUIRED_MODES, REQUIRED_DURATIONS } from "../config/achievements.js";
import { computeStreakStats } from "../utils/streaks.js";

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Builds the per-user "context" this module's achievements are
 * evaluated against, from a flat list of already-fetched result
 * documents. Kept separate from the Mongo query itself so it can be
 * unit tested with fabricated data (see achievementsService.test.js).
 *
 * @param {Array<{wpm:number, accuracy:number, mode:string, durationSeconds:number, createdAt:Date|string}>} results
 * @param {Date} [now]
 */
export function computeAchievementsFromResults(results, now = new Date()) {
  const totalTests = results.length;

  let bestWpm = 0;
  let bestAccuracy = 0;
  let hasPerfectAccuracyRun = false;
  const modesSeen = new Set();
  const durationsSeen = new Set();
  const createdAtDates = [];

  for (const r of results) {
    if (typeof r.wpm === "number" && r.wpm > bestWpm) bestWpm = r.wpm;
    if (typeof r.accuracy === "number" && r.accuracy > bestAccuracy) bestAccuracy = r.accuracy;
    if (typeof r.accuracy === "number" && r.accuracy >= 100) hasPerfectAccuracyRun = true;
    if (r.mode) modesSeen.add(r.mode);
    if (typeof r.durationSeconds === "number") durationsSeen.add(r.durationSeconds);
    createdAtDates.push(r.createdAt);
  }

  const streakStats = computeStreakStats(createdAtDates, now);

  // Only count modes/durations that are actually part of the current
  // supported set — guards against stale/legacy data ever inflating
  // "Mode Explorer" / "Time Traveler" progress past 100%.
  const modesCompleted = REQUIRED_MODES.filter((m) => modesSeen.has(m)).length;
  const durationsCompleted = REQUIRED_DURATIONS.filter((d) => durationsSeen.has(d)).length;

  const context = {
    totalTests,
    bestWpm,
    bestAccuracy,
    hasPerfectAccuracyRun,
    modesCompleted,
    durationsCompleted,
    historicalMaxStreak: streakStats.longestStreak,
  };

  const achievements = ACHIEVEMENTS.map((def) => buildAchievementStatus(def, context));

  return {
    summary: {
      currentStreak: streakStats.currentStreak,
      longestStreak: streakStats.longestStreak,
      totalActiveDays: streakStats.totalActiveDays,
      lastActiveDate: streakStats.lastActiveDate,
    },
    achievements,
  };
}

function buildAchievementStatus(def, ctx) {
  let progress = 0;
  let unlocked = false;
  let progressLabel = "";

  switch (def.type) {
    case "count": {
      progress = clamp01(ctx.totalTests / def.target);
      unlocked = ctx.totalTests >= def.target;
      progressLabel = `${Math.min(ctx.totalTests, def.target)} / ${def.target} tests`;
      break;
    }
    case "wpm": {
      progress = clamp01(ctx.bestWpm / def.target);
      unlocked = ctx.bestWpm >= def.target;
      progressLabel = `${Math.min(Math.round(ctx.bestWpm), def.target)} / ${def.target} WPM`;
      break;
    }
    case "accuracy": {
      progress = clamp01(ctx.bestAccuracy / def.target);
      unlocked = ctx.bestAccuracy >= def.target;
      progressLabel = `${Math.min(Math.round(ctx.bestAccuracy * 10) / 10, def.target)}% / ${def.target}%`;
      break;
    }
    case "perfect": {
      unlocked = ctx.hasPerfectAccuracyRun;
      progress = unlocked ? 1 : 0;
      progressLabel = unlocked ? "Achieved" : "Not yet achieved";
      break;
    }
    case "modes": {
      progress = clamp01(ctx.modesCompleted / def.target);
      unlocked = ctx.modesCompleted >= def.target;
      progressLabel = `${ctx.modesCompleted} / ${def.target} modes`;
      break;
    }
    case "durations": {
      progress = clamp01(ctx.durationsCompleted / def.target);
      unlocked = ctx.durationsCompleted >= def.target;
      progressLabel = `${ctx.durationsCompleted} / ${def.target} durations`;
      break;
    }
    case "streak": {
      // Historical maximum, deliberately NOT current streak — a
      // previously-earned streak achievement must stay unlocked even
      // after the streak breaks (Phase 8 spec, section 3).
      progress = clamp01(ctx.historicalMaxStreak / def.target);
      unlocked = ctx.historicalMaxStreak >= def.target;
      progressLabel = `${Math.min(ctx.historicalMaxStreak, def.target)} / ${def.target} days`;
      break;
    }
    default: {
      progress = 0;
      unlocked = false;
      progressLabel = "";
    }
  }

  return {
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    category: def.category,
    rarity: def.rarity,
    target: def.target,
    progress,
    progressLabel,
    unlocked,
    // Achievement status is recomputed fresh on every request rather
    // than persisted (see README "Achievements" section for why), so
    // there is no stored unlock timestamp to report. Kept in the
    // response shape for forward-compatibility.
    unlockedAt: null,
  };
}

/**
 * Fetches a single user's achievement + streak summary from real,
 * user-owned TypingResult documents. One query, minimal projected
 * fields — every derived value below comes from this same result set
 * rather than issuing a separate query per achievement.
 *
 * @param {string} userId - trusted, verified value from req.userId (JWT). Never client-supplied.
 */
export async function getAchievementsForUser(userId) {
  const results = await TypingResult.find({ userId })
    .select("wpm accuracy mode durationSeconds createdAt -_id")
    .sort({ createdAt: 1 })
    .lean();

  return computeAchievementsFromResults(results);
}
