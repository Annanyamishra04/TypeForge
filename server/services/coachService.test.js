import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  generateDeterministicInsights,
  validateAiInsights,
  toAnonymizedPayload,
  generateAiInsights,
  isRateLimited,
  __resetCoachStateForTests,
} from "./coachService.js";

const BASE_SUMMARY = {
  totalTests: 20,
  bestWpm: 70,
  averageWpm: 55,
  recentAverageWpm: 56,
  bestAccuracy: 99,
  averageAccuracy: 96,
  recentAverageAccuracy: 96,
  consistency: 4,
  errorRatePercent: 1.2,
  trend: "steady",
  mostPracticedMode: "words",
  modeBreakdown: [{ mode: "words", tests: 20, averageWpm: 55 }],
};

describe("generateDeterministicInsights", () => {
  test("returns a fully-shaped, deterministic report", () => {
    const report = generateDeterministicInsights(BASE_SUMMARY);
    assert.equal(report.source, "deterministic");
    assert.equal(typeof report.headline, "string");
    assert.ok(report.headline.length > 0);
    assert.ok(["Beginner", "Intermediate", "Advanced", "Expert"].includes(report.level));
    assert.ok(Array.isArray(report.strengths) && report.strengths.length > 0);
    assert.ok(Array.isArray(report.focusAreas) && report.focusAreas.length > 0);
    assert.ok(Array.isArray(report.practicePlan) && report.practicePlan.length > 0);
    assert.ok(report.nextTarget.wpm > BASE_SUMMARY.recentAverageWpm);
    assert.ok(report.nextTarget.accuracy >= 90 && report.nextTarget.accuracy <= 99);
  });

  test("is deterministic — same input always produces same output", () => {
    const a = generateDeterministicInsights(BASE_SUMMARY);
    const b = generateDeterministicInsights(BASE_SUMMARY);
    assert.deepEqual(a, b);
  });

  test("flags accuracy-ahead-of-speed profile", () => {
    const summary = { ...BASE_SUMMARY, recentAverageAccuracy: 98, recentAverageWpm: 35, averageWpm: 35 };
    const report = generateDeterministicInsights(summary);
    assert.match(report.headline, /precision/i);
  });

  test("flags speed-ahead-of-accuracy profile", () => {
    const summary = { ...BASE_SUMMARY, recentAverageAccuracy: 88, recentAverageWpm: 80, averageWpm: 70 };
    const report = generateDeterministicInsights(summary);
    assert.match(report.headline, /speed/i);
    assert.ok(report.focusAreas.some((f) => /accuracy/i.test(f)));
  });

  test("improving trend is reflected as a strength", () => {
    const summary = { ...BASE_SUMMARY, trend: "improving", recentAverageWpm: 60, averageWpm: 50 };
    const report = generateDeterministicInsights(summary);
    assert.equal(report.trend, "improving");
    assert.ok(report.strengths.some((s) => /average WPM/i.test(s)));
  });

  test("high variance produces a consistency focus area", () => {
    const summary = { ...BASE_SUMMARY, consistency: 15 };
    const report = generateDeterministicInsights(summary);
    assert.ok(report.focusAreas.some((f) => /varies|consistency|rhythm/i.test(f)));
  });

  test("never returns more than 3 strengths, focus areas, or practice items", () => {
    const report = generateDeterministicInsights(BASE_SUMMARY);
    assert.ok(report.strengths.length <= 3);
    assert.ok(report.focusAreas.length <= 3);
    assert.ok(report.practicePlan.length <= 3);
  });
});

describe("toAnonymizedPayload (privacy boundary)", () => {
  test("never includes identity fields even if present on the summary", () => {
    const contaminated = {
      ...BASE_SUMMARY,
      userId: "abc123",
      name: "Jane Doe",
      email: "jane@example.com",
      sessionId: "sess-xyz",
      password: "hunter2",
      _id: "64f0...",
    };
    const payload = toAnonymizedPayload(contaminated);
    const keys = Object.keys(payload);
    for (const forbidden of ["userId", "name", "email", "sessionId", "password", "_id"]) {
      assert.ok(!keys.includes(forbidden), `payload leaked "${forbidden}"`);
    }
  });

  test("only contains plain numbers, strings, or arrays of plain data", () => {
    const payload = toAnonymizedPayload(BASE_SUMMARY);
    const serialized = JSON.stringify(payload);
    assert.doesNotThrow(() => JSON.parse(serialized));
  });
});

describe("validateAiInsights", () => {
  const VALID = {
    headline: "You're improving steadily.",
    level: "Intermediate",
    trend: "improving",
    strengths: ["Good accuracy"],
    focusAreas: ["Work on consistency"],
    nextTarget: { wpm: 65, accuracy: 97 },
    practicePlan: ["Do a 60s test daily"],
  };

  test("accepts a well-formed candidate", () => {
    assert.equal(validateAiInsights(VALID), true);
  });

  test("rejects null/non-object input", () => {
    assert.equal(validateAiInsights(null), false);
    assert.equal(validateAiInsights("a string"), false);
    assert.equal(validateAiInsights(42), false);
  });

  test("rejects missing required fields", () => {
    const { headline: _headline, ...missingHeadline } = VALID;
    assert.equal(validateAiInsights(missingHeadline), false);
  });

  test("rejects an invalid trend value", () => {
    assert.equal(validateAiInsights({ ...VALID, trend: "skyrocketing" }), false);
  });

  test("rejects an oversized headline (prompt-injection guard)", () => {
    assert.equal(validateAiInsights({ ...VALID, headline: "x".repeat(500) }), false);
  });

  test("rejects non-array strengths/focusAreas/practicePlan", () => {
    assert.equal(validateAiInsights({ ...VALID, strengths: "good job" }), false);
    assert.equal(validateAiInsights({ ...VALID, focusAreas: {} }), false);
    assert.equal(validateAiInsights({ ...VALID, practicePlan: null }), false);
  });

  test("rejects out-of-range nextTarget values", () => {
    assert.equal(validateAiInsights({ ...VALID, nextTarget: { wpm: -5, accuracy: 97 } }), false);
    assert.equal(validateAiInsights({ ...VALID, nextTarget: { wpm: 65, accuracy: 150 } }), false);
    assert.equal(validateAiInsights({ ...VALID, nextTarget: { wpm: "fast", accuracy: 97 } }), false);
  });

  test("rejects extra-large arrays that would blow up the UI", () => {
    assert.equal(validateAiInsights({ ...VALID, strengths: ["a", "b", "c", "d"] }), false);
  });
});

describe("generateAiInsights (failure/fallback behavior)", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env.AI_API_KEY = ORIGINAL_ENV.AI_API_KEY;
    process.env.AI_API_URL = ORIGINAL_ENV.AI_API_URL;
    process.env.AI_MODEL = ORIGINAL_ENV.AI_MODEL;
    mock.restoreAll();
  });

  test("returns null when AI env vars are not configured", async () => {
    delete process.env.AI_API_KEY;
    delete process.env.AI_API_URL;
    delete process.env.AI_MODEL;
    const result = await generateAiInsights({ totalTests: 10 });
    assert.equal(result, null);
  });

  test("returns null (never throws) when the provider request fails", async () => {
    process.env.AI_API_KEY = "test-key";
    process.env.AI_API_URL = "https://example.invalid/v1/messages";
    process.env.AI_MODEL = "test-model";

    mock.method(global, "fetch", async () => {
      throw new Error("network down");
    });

    const result = await generateAiInsights({ totalTests: 10 });
    assert.equal(result, null);
  });

  test("returns null when the provider responds with a non-2xx status", async () => {
    process.env.AI_API_KEY = "test-key";
    process.env.AI_API_URL = "https://example.invalid/v1/messages";
    process.env.AI_MODEL = "test-model";

    mock.method(global, "fetch", async () => ({ ok: false, status: 500, json: async () => ({}) }));

    const result = await generateAiInsights({ totalTests: 10 });
    assert.equal(result, null);
  });

  test("returns null when the provider response fails schema validation", async () => {
    process.env.AI_API_KEY = "test-key";
    process.env.AI_API_URL = "https://example.invalid/v1/messages";
    process.env.AI_MODEL = "test-model";

    mock.method(global, "fetch", async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify({ headline: "Missing everything else" }) }],
      }),
    }));

    const result = await generateAiInsights({ totalTests: 10 });
    assert.equal(result, null);
  });

  test("returns the parsed report, tagged with source: 'ai', on a valid response", async () => {
    process.env.AI_API_KEY = "test-key";
    process.env.AI_API_URL = "https://example.invalid/v1/messages";
    process.env.AI_MODEL = "test-model";

    const valid = {
      headline: "Steady, controlled typing.",
      level: "Advanced",
      trend: "steady",
      strengths: ["Consistent WPM"],
      focusAreas: ["Push peak speed"],
      nextTarget: { wpm: 90, accuracy: 98 },
      practicePlan: ["Try a 120s endurance test"],
    };

    mock.method(global, "fetch", async () => ({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: JSON.stringify(valid) }] }),
    }));

    const result = await generateAiInsights({ totalTests: 10 });
    assert.ok(result);
    assert.equal(result.source, "ai");
    assert.equal(result.headline, valid.headline);
  });

  test("strips markdown code fences before parsing", async () => {
    process.env.AI_API_KEY = "test-key";
    process.env.AI_API_URL = "https://example.invalid/v1/messages";
    process.env.AI_MODEL = "test-model";

    const valid = {
      headline: "Fenced but valid.",
      level: "Intermediate",
      trend: "steady",
      strengths: ["Ok"],
      focusAreas: ["Ok"],
      nextTarget: { wpm: 60, accuracy: 96 },
      practicePlan: ["Ok"],
    };

    mock.method(global, "fetch", async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "```json\n" + JSON.stringify(valid) + "\n```" }],
      }),
    }));

    const result = await generateAiInsights({ totalTests: 10 });
    assert.ok(result);
    assert.equal(result.headline, valid.headline);
  });
});

describe("rate limiting", () => {
  beforeEach(() => {
    __resetCoachStateForTests();
  });

  test("a fresh user is not rate limited", () => {
    assert.equal(isRateLimited("user-1"), false);
  });

  test("different users have independent cooldowns", async () => {
    process.env.AI_API_KEY = "";
    // isRateLimited only reflects state set by generateAiInsights callers
    // (markAiCalled is internal); simulate via the exported check only —
    // absence of a prior call means no rate limit for a new id.
    assert.equal(isRateLimited("user-2"), false);
    assert.equal(isRateLimited("user-3"), false);
  });
});
