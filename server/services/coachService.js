import mongoose from "mongoose";
import { TypingResult } from "../models/TypingResult.js";

// How many of the caller's most recent results are used to compute
// "recent form" (the second half of the trend comparison below).
const RECENT_WINDOW = 10;
// Minimum number of tests before we're willing to say anything about
// a trend at all — fewer than this and "improving/declining" would
// just be noise dressed up as insight.
const MIN_TESTS_FOR_TREND = 6;
const MIN_TESTS_FOR_REPORT = 3;

// Per-user cooldown between AI-provider calls. Cheap to run generous
// deterministic-only requests more often; the AI call itself is what
// costs money/rate limit, so this only gates that path.
const AI_COOLDOWN_MS = 60 * 1000;
// How long a generated report (AI or deterministic) is reused before
// we're willing to regenerate it, even if no new test happened.
const REPORT_CACHE_TTL_MS = 10 * 60 * 1000;

// In-memory only — resets on server restart and is per-instance, which
// is a deliberate, documented trade-off for a free-tier single-instance
// deployment (see README). Not a substitute for a shared store like
// Redis if TYPEFORGE is ever scaled across multiple instances.
const lastAiCallAt = new Map(); // userId -> timestamp
const reportCache = new Map(); // userId -> { report, generatedAt, totalTests, latestResultId }

/**
 * True if `userId` is still inside its AI-provider cooldown window.
 * Never gates the deterministic fallback — only whether we're willing
 * to spend an external AI call on this request.
 */
export function isRateLimited(userId) {
  const last = lastAiCallAt.get(String(userId));
  if (!last) return false;
  return Date.now() - last < AI_COOLDOWN_MS;
}

function markAiCalled(userId) {
  lastAiCallAt.set(String(userId), Date.now());
}

/**
 * Standard deviation helper for the "consistency" signal — a tight
 * spread of WPM across recent tests reads as consistent, a wide one
 * reads as erratic, independent of raw speed.
 */
function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Pulls every field the coach needs in one query and reduces it to a
 * single anonymized statistics object. This function is the privacy
 * boundary for the whole feature: nothing downstream of its return
 * value ever has access to a name, email, userId, sessionId, or any
 * Mongo document — only plain numbers and mode labels.
 */
export async function buildPerformanceSummary(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);

  const results = await TypingResult.find({ userId: objectId })
    .sort({ createdAt: -1 })
    .limit(200)
    .select("mode durationSeconds wpm accuracy errors totalChars createdAt -_id")
    .lean();

  if (results.length === 0) {
    return { totalTests: 0 };
  }

  const wpmValues = results.map((r) => r.wpm);
  const accuracyValues = results.map((r) => r.accuracy);

  const bestWpm = Math.max(...wpmValues);
  const averageWpm = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
  const averageAccuracy = accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length;
  const bestAccuracy = Math.max(...accuracyValues);

  const recent = results.slice(0, Math.min(RECENT_WINDOW, results.length));
  const older = results.slice(Math.min(RECENT_WINDOW, results.length));
  const recentAvgWpm = recent.reduce((a, b) => a + b.wpm, 0) / recent.length;
  const recentAvgAccuracy = recent.reduce((a, b) => a + b.accuracy, 0) / recent.length;
  const olderAvgWpm = older.length ? older.reduce((a, b) => a + b.wpm, 0) / older.length : null;

  let trend = "steady";
  if (results.length >= MIN_TESTS_FOR_TREND && olderAvgWpm !== null) {
    const delta = recentAvgWpm - olderAvgWpm;
    // A margin wider than typical run-to-run noise (~3 WPM) before
    // calling it a real trend rather than natural variance.
    if (delta > 3) trend = "improving";
    else if (delta < -3) trend = "declining";
  }

  const consistency = stdDev(recent.map((r) => r.wpm));

  const modeTotals = new Map();
  for (const r of results) {
    const entry = modeTotals.get(r.mode) || { tests: 0, wpmSum: 0 };
    entry.tests += 1;
    entry.wpmSum += r.wpm;
    modeTotals.set(r.mode, entry);
  }
  const modeBreakdown = [...modeTotals.entries()]
    .map(([mode, v]) => ({ mode, tests: v.tests, averageWpm: round1(v.wpmSum / v.tests) }))
    .sort((a, b) => b.tests - a.tests);

  const totalErrors = results.reduce((a, b) => a + b.errors, 0);
  const totalChars = results.reduce((a, b) => a + b.totalChars, 0);
  const errorRate = totalChars > 0 ? (totalErrors / totalChars) * 100 : 0;

  const latestResultCreatedAt = results[0].createdAt;

  return {
    totalTests: results.length,
    bestWpm: Math.round(bestWpm),
    averageWpm: round1(averageWpm),
    recentAverageWpm: round1(recentAvgWpm),
    bestAccuracy: round1(bestAccuracy),
    averageAccuracy: round1(averageAccuracy),
    recentAverageAccuracy: round1(recentAvgAccuracy),
    consistency: round1(consistency), // lower = more consistent WPM
    errorRatePercent: round1(errorRate),
    trend,
    mostPracticedMode: modeBreakdown[0]?.mode || null,
    modeBreakdown,
    latestResultCreatedAt,
  };
}

/**
 * Reduces the summary to exactly the fields an external AI provider
 * is allowed to see: anonymized aggregate numbers only. Deliberately
 * built as an allow-list (rather than deleting disallowed keys from
 * the full summary) so a future field added to buildPerformanceSummary
 * doesn't leak to the AI provider by default.
 */
export function toAnonymizedPayload(summary) {
  return {
    totalTests: summary.totalTests,
    bestWpm: summary.bestWpm,
    averageWpm: summary.averageWpm,
    recentAverageWpm: summary.recentAverageWpm,
    bestAccuracy: summary.bestAccuracy,
    averageAccuracy: summary.averageAccuracy,
    recentAverageAccuracy: summary.recentAverageAccuracy,
    consistency: summary.consistency,
    errorRatePercent: summary.errorRatePercent,
    trend: summary.trend,
    mostPracticedMode: summary.mostPracticedMode,
    modeBreakdown: summary.modeBreakdown,
  };
}

function levelFromWpm(wpm) {
  if (wpm < 30) return "Beginner";
  if (wpm < 55) return "Intermediate";
  if (wpm < 80) return "Advanced";
  return "Expert";
}

/**
 * Deterministic, rule-based coaching report. This is the product's
 * baseline: it never calls an external service, never fails for lack
 * of network access, and is what's shown whenever AI generation is
 * unavailable, disabled, or fails validation — always clearly labeled
 * "Performance Coach" rather than presented as AI-generated.
 */
export function generateDeterministicInsights(summary) {
  const {
    averageWpm,
    recentAverageWpm,
    bestWpm,
    recentAverageAccuracy,
    consistency,
    errorRatePercent,
    trend,
    totalTests,
  } = summary;

  const level = levelFromWpm(recentAverageWpm ?? averageWpm);
  const speedAheadOfAccuracy = recentAverageAccuracy < 94 && recentAverageWpm >= averageWpm;
  const accuracyAheadOfSpeed = recentAverageAccuracy >= 96 && recentAverageWpm < 50;

  let headline;
  if (accuracyAheadOfSpeed) {
    headline = "Your precision is ahead of your speed.";
  } else if (speedAheadOfAccuracy) {
    headline = "Your speed is outrunning your precision.";
  } else if (trend === "improving") {
    headline = "You're on a genuine upward trend.";
  } else if (trend === "declining") {
    headline = "Your recent runs have cooled off a little.";
  } else if (consistency > 10) {
    headline = "Your speed swings more than it needs to.";
  } else {
    headline = "You're typing at a steady, dependable pace.";
  }

  const strengths = [];
  if (recentAverageAccuracy >= 96) {
    strengths.push(`Accuracy holds around ${recentAverageAccuracy}% — clean, controlled input.`);
  }
  if (consistency > 0 && consistency <= 6) {
    strengths.push("Your WPM barely varies between tests — that's real consistency.");
  }
  if (trend === "improving") {
    strengths.push(`Recent average WPM (${recentAverageWpm}) is ahead of your longer-term average (${averageWpm}).`);
  }
  if (bestWpm - recentAverageWpm <= 8 && bestWpm > 0) {
    strengths.push(`Your best test (${bestWpm} WPM) is close to your normal pace — your peak is repeatable.`);
  }
  if (strengths.length === 0) {
    strengths.push(`You've logged ${totalTests} tests — the sample size itself is a strength to build on.`);
  }

  const focusAreas = [];
  if (recentAverageAccuracy < 94) {
    focusAreas.push("Accuracy dips below 94% recently — slow down slightly to protect it.");
  }
  if (consistency > 10) {
    focusAreas.push("WPM varies a lot run-to-run — work on a steadier rhythm rather than bursts.");
  }
  if (errorRatePercent > 3) {
    focusAreas.push(`Error rate is around ${errorRatePercent}% of characters typed — worth tightening up.`);
  }
  if (trend === "declining") {
    focusAreas.push("Recent tests are a bit behind your average — a short warm-up before sessions may help.");
  }
  if (focusAreas.length === 0) {
    focusAreas.push("No major weak point right now — the next gains will come from raw practice volume.");
  }

  const nextTargetWpm = Math.max(Math.round((recentAverageWpm || averageWpm || 20) * 1.12), (recentAverageWpm || 20) + 5);
  const nextTargetAccuracy = Math.min(99, Math.max(96, Math.round(recentAverageAccuracy || 95)));

  const practicePlan = [];
  if (recentAverageAccuracy < 94) {
    practicePlan.push("Run 3 tests focused purely on accuracy — accept a lower WPM in exchange for near-zero errors.");
  } else {
    practicePlan.push(`Push for ${nextTargetWpm} WPM on a 30s test while keeping accuracy above ${nextTargetAccuracy}%.`);
  }
  if (consistency > 10) {
    practicePlan.push("Do 5 short tests back-to-back and compare their WPM — aim to shrink the gap between your best and worst.");
  } else {
    practicePlan.push("Try a longer 120s test to see whether your pace holds up over time, not just in short bursts.");
  }
  practicePlan.push(
    summary.mostPracticedMode === "quotes"
      ? "Mix in a words-mode session — different rhythm, useful cross-training."
      : "Try quotes mode for a session — punctuation and varied sentence flow train different reflexes."
  );

  return {
    source: "deterministic",
    headline,
    level,
    trend,
    strengths: strengths.slice(0, 3),
    focusAreas: focusAreas.slice(0, 3),
    nextTarget: { wpm: nextTargetWpm, accuracy: nextTargetAccuracy },
    practicePlan: practicePlan.slice(0, 3),
  };
}

const REQUIRED_AI_FIELDS = ["headline", "level", "trend", "strengths", "focusAreas", "nextTarget", "practicePlan"];

/**
 * Strict shape/type validation for whatever the AI provider returns.
 * Anything that doesn't match exactly is rejected — the caller is
 * expected to fall back to generateDeterministicInsights() rather
 * than ever forward a malformed or off-schema AI response to the
 * client. This is also what stands between a prompt-injected or
 * hallucinated response and the user: it can only contain the fields
 * listed here, of the types checked here.
 */
export function validateAiInsights(candidate) {
  if (!candidate || typeof candidate !== "object") return false;

  for (const field of REQUIRED_AI_FIELDS) {
    if (!(field in candidate)) return false;
  }

  if (typeof candidate.headline !== "string" || candidate.headline.length === 0 || candidate.headline.length > 140) {
    return false;
  }
  if (typeof candidate.level !== "string" || candidate.level.length > 40) return false;
  if (!["improving", "declining", "steady"].includes(candidate.trend)) return false;

  if (!Array.isArray(candidate.strengths) || candidate.strengths.length === 0 || candidate.strengths.length > 3) {
    return false;
  }
  if (!candidate.strengths.every((s) => typeof s === "string" && s.length > 0 && s.length <= 200)) return false;

  if (!Array.isArray(candidate.focusAreas) || candidate.focusAreas.length === 0 || candidate.focusAreas.length > 3) {
    return false;
  }
  if (!candidate.focusAreas.every((s) => typeof s === "string" && s.length > 0 && s.length <= 200)) return false;

  if (
    !candidate.nextTarget ||
    typeof candidate.nextTarget.wpm !== "number" ||
    typeof candidate.nextTarget.accuracy !== "number" ||
    candidate.nextTarget.wpm <= 0 ||
    candidate.nextTarget.wpm > 400 ||
    candidate.nextTarget.accuracy <= 0 ||
    candidate.nextTarget.accuracy > 100
  ) {
    return false;
  }

  if (!Array.isArray(candidate.practicePlan) || candidate.practicePlan.length === 0 || candidate.practicePlan.length > 5) {
    return false;
  }
  if (!candidate.practicePlan.every((s) => typeof s === "string" && s.length > 0 && s.length <= 240)) return false;

  return true;
}

/**
 * Calls the configured AI provider with only the anonymized payload,
 * asking for strict JSON matching the coaching schema. Returns null
 * (never throws) on any failure — missing config, network error,
 * non-JSON response, or a response that fails validateAiInsights —
 * so the caller can transparently fall back to the deterministic path.
 */
export async function generateAiInsights(anonymizedPayload) {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || !apiUrl || !model) return null;

  const prompt = `You are a typing-performance coach. Given ONLY these anonymized statistics (no personal data was provided to you), return a JSON object and NOTHING else — no markdown, no prose outside the JSON — with exactly these keys:
{
  "headline": string (max 140 chars, one real insight),
  "level": one of "Beginner" | "Intermediate" | "Advanced" | "Expert",
  "trend": one of "improving" | "declining" | "steady",
  "strengths": array of 1-3 short strings,
  "focusAreas": array of 1-3 short strings,
  "nextTarget": { "wpm": number, "accuracy": number },
  "practicePlan": array of 1-3 short, concrete action strings
}

Statistics: ${JSON.stringify(anonymizedPayload)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) return null;

    const data = await response.json();
    const text = Array.isArray(data.content)
      ? data.content.find((block) => block.type === "text")?.text
      : null;
    if (!text) return null;

    const cleaned = text.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return null;
    }

    if (!validateAiInsights(parsed)) return null;

    return { ...parsed, source: "ai" };
  } catch {
    // Network failure, timeout/abort, or any other unexpected error —
    // always degrade to the deterministic path rather than propagate.
    return null;
  }
}

/**
 * Full report assembly for GET /api/coach/me. Orchestrates summary →
 * cache check → AI attempt (rate-limited) → deterministic fallback →
 * cache write. Never throws for "no data" or "AI unavailable" —
 * those are legitimate, well-formed responses, not errors.
 */
export async function getCoachReport(userId) {
  const summary = await buildPerformanceSummary(userId);

  if (summary.totalTests < MIN_TESTS_FOR_REPORT) {
    return {
      ready: false,
      testsRequired: MIN_TESTS_FOR_REPORT,
      totalTests: summary.totalTests,
      insights: null,
    };
  }

  const key = String(userId);
  const cached = reportCache.get(key);
  const cacheIsFresh =
    cached &&
    cached.totalTests === summary.totalTests &&
    Date.now() - cached.generatedAt < REPORT_CACHE_TTL_MS;

  if (cacheIsFresh) {
    return { ready: true, insights: cached.report, summary: publicSummary(summary), cached: true };
  }

  let insights = null;
  if (!isRateLimited(userId)) {
    const anonymized = toAnonymizedPayload(summary);
    markAiCalled(userId);
    insights = await generateAiInsights(anonymized);
  }

  if (!insights) {
    insights = generateDeterministicInsights(summary);
  }

  reportCache.set(key, { report: insights, generatedAt: Date.now(), totalTests: summary.totalTests });

  return { ready: true, insights, summary: publicSummary(summary), cached: false };
}

/** The subset of the summary that's safe and useful to show the user directly (this never left the server, so it's not the privacy boundary — just a display trim). */
function publicSummary(summary) {
  return {
    totalTests: summary.totalTests,
    bestWpm: summary.bestWpm,
    averageWpm: summary.averageWpm,
    recentAverageWpm: summary.recentAverageWpm,
    averageAccuracy: summary.averageAccuracy,
    recentAverageAccuracy: summary.recentAverageAccuracy,
    mostPracticedMode: summary.mostPracticedMode,
  };
}

/** Test-only hook to reset module-level caches between test cases. */
export function __resetCoachStateForTests() {
  lastAiCallAt.clear();
  reportCache.clear();
}
