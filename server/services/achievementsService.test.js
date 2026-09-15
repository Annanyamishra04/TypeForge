import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeAchievementsFromResults } from "./achievementsService.js";

const BASE = { wpm: 30, accuracy: 90, mode: "words", durationSeconds: 30 };

function result(overrides = {}, createdAt = new Date("2026-09-01T12:00:00.000Z")) {
  return { ...BASE, createdAt, ...overrides };
}

function findAch(achievements, id) {
  const found = achievements.find((a) => a.id === id);
  assert.ok(found, `expected achievement "${id}" to exist`);
  return found;
}

describe("computeAchievementsFromResults", () => {
  test("zero tests: nothing unlocked, all progress 0", () => {
    const { summary, achievements } = computeAchievementsFromResults([]);
    assert.equal(summary.currentStreak, 0);
    assert.equal(summary.totalActiveDays, 0);
    assert.ok(achievements.every((a) => !a.unlocked));
    assert.ok(achievements.every((a) => a.progress === 0));
  });

  test("test count achievements: 1, 10, 50, 100 tests", () => {
    const one = computeAchievementsFromResults([result()]);
    assert.equal(findAch(one.achievements, "first-strike").unlocked, true);
    assert.equal(findAch(one.achievements, "getting-started").unlocked, false);

    const ten = computeAchievementsFromResults(Array.from({ length: 10 }, () => result()));
    assert.equal(findAch(ten.achievements, "getting-started").unlocked, true);
    assert.equal(findAch(ten.achievements, "dedicated").unlocked, false);
    assert.equal(findAch(ten.achievements, "dedicated").progressLabel, "10 / 50 tests");

    const fifty = computeAchievementsFromResults(Array.from({ length: 50 }, () => result()));
    assert.equal(findAch(fifty.achievements, "dedicated").unlocked, true);
    assert.equal(findAch(fifty.achievements, "typing-machine").unlocked, false);

    const hundred = computeAchievementsFromResults(Array.from({ length: 100 }, () => result()));
    assert.equal(findAch(hundred.achievements, "typing-machine").unlocked, true);
    assert.equal(findAch(hundred.achievements, "typing-machine").progress, 1);
  });

  test("WPM thresholds: 39 does not unlock, 40/60/80/100/120 do", () => {
    const r39 = computeAchievementsFromResults([result({ wpm: 39 })]);
    assert.equal(findAch(r39.achievements, "speed-rookie").unlocked, false);
    assert.ok(findAch(r39.achievements, "speed-rookie").progress < 1);

    const r40 = computeAchievementsFromResults([result({ wpm: 40 })]);
    assert.equal(findAch(r40.achievements, "speed-rookie").unlocked, true);

    const r120 = computeAchievementsFromResults([result({ wpm: 120 })]);
    assert.equal(findAch(r120.achievements, "speed-runner").unlocked, true);
    assert.equal(findAch(r120.achievements, "speed-demon").unlocked, true);
    assert.equal(findAch(r120.achievements, "speed-master").unlocked, true);
    assert.equal(findAch(r120.achievements, "lightning").unlocked, true);
  });

  test("accuracy thresholds: 94 fails, 95/98/99 unlock, 100 unlocks Perfect Run", () => {
    const r94 = computeAchievementsFromResults([result({ accuracy: 94 })]);
    assert.equal(findAch(r94.achievements, "sharp-fingers").unlocked, false);

    const r99 = computeAchievementsFromResults([result({ accuracy: 99 })]);
    assert.equal(findAch(r99.achievements, "sharp-fingers").unlocked, true);
    assert.equal(findAch(r99.achievements, "precision").unlocked, true);
    assert.equal(findAch(r99.achievements, "near-perfect").unlocked, true);
    assert.equal(findAch(r99.achievements, "perfect-run").unlocked, false);

    const r100 = computeAchievementsFromResults([result({ accuracy: 100 })]);
    assert.equal(findAch(r100.achievements, "perfect-run").unlocked, true);
  });

  test("mode explorer: unlocked only once all 3 modes represented", () => {
    const wordsOnly = computeAchievementsFromResults([result({ mode: "words" })]);
    assert.equal(findAch(wordsOnly.achievements, "mode-explorer").unlocked, false);
    assert.equal(findAch(wordsOnly.achievements, "mode-explorer").progressLabel, "1 / 3 modes");

    const wordsAndQuotes = computeAchievementsFromResults([
      result({ mode: "words" }),
      result({ mode: "quotes" }),
    ]);
    assert.equal(findAch(wordsAndQuotes.achievements, "mode-explorer").unlocked, false);

    const allThree = computeAchievementsFromResults([
      result({ mode: "words" }),
      result({ mode: "quotes" }),
      result({ mode: "custom" }),
    ]);
    assert.equal(findAch(allThree.achievements, "mode-explorer").unlocked, true);
  });

  test("time traveler: unlocked only once all 4 durations represented", () => {
    const partial = computeAchievementsFromResults([
      result({ durationSeconds: 15 }),
      result({ durationSeconds: 30 }),
      result({ durationSeconds: 60 }),
    ]);
    assert.equal(findAch(partial.achievements, "time-traveler").unlocked, false);
    assert.equal(findAch(partial.achievements, "time-traveler").progressLabel, "3 / 4 durations");

    const all = computeAchievementsFromResults([
      result({ durationSeconds: 15 }),
      result({ durationSeconds: 30 }),
      result({ durationSeconds: 60 }),
      result({ durationSeconds: 120 }),
    ]);
    assert.equal(findAch(all.achievements, "time-traveler").unlocked, true);
  });

  test("streak achievements use historical max, staying unlocked after a break", () => {
    const day = (n) => new Date(Date.UTC(2026, 8, 1) + n * 86400000);
    // 14 consecutive active days, then a long gap (streak now broken).
    const consecutive14 = Array.from({ length: 14 }, (_, i) => result({}, day(i)));
    const brokenLater = result({}, day(40)); // long gap after the streak

    const now = day(41);
    const { summary, achievements } = computeAchievementsFromResults(
      [...consecutive14, brokenLater],
      now
    );

    assert.equal(summary.longestStreak, 14);
    assert.ok(summary.currentStreak < 14); // streak is broken now
    assert.equal(findAch(achievements, "two-week-flow").unlocked, true); // still unlocked!
    assert.equal(findAch(achievements, "monthly-discipline").unlocked, false);
  });

  test("progress never exceeds 1 (100%) even with values beyond target", () => {
    const overshoot = computeAchievementsFromResults(
      Array.from({ length: 500 }, () => result({ wpm: 999, accuracy: 100 }))
    );
    assert.ok(overshoot.achievements.every((a) => a.progress <= 1));
  });

  test("multiple tests on the same day count as a single active day", () => {
    const sameDay = new Date("2026-09-05T09:00:00.000Z");
    const later = new Date("2026-09-05T18:00:00.000Z");
    const { summary } = computeAchievementsFromResults(
      [result({}, sameDay), result({}, later)],
      new Date("2026-09-05T20:00:00.000Z")
    );
    assert.equal(summary.totalActiveDays, 1);
    assert.equal(summary.currentStreak, 1);
  });
});
