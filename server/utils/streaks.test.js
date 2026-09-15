import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeStreakStats, toUTCDayIndex } from "./streaks.js";

// Fixed "now" for deterministic assertions: Sept 12, 2026, midday UTC.
const NOW = new Date("2026-09-12T12:00:00.000Z");

function d(days) {
  // Anchor at Sept 1 2026 00:00 UTC + N days, at a non-midnight time to
  // prove time-of-day doesn't affect day bucketing.
  return new Date(Date.UTC(2026, 8, 1, 15, 30, 0) + days * 24 * 60 * 60 * 1000);
}

describe("computeStreakStats", () => {
  test("no results at all", () => {
    const stats = computeStreakStats([], NOW);
    assert.deepEqual(stats, {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      lastActiveDate: null,
    });
  });

  test("single day, one test", () => {
    const stats = computeStreakStats([d(0)], new Date(d(0).getTime() + 60_000));
    assert.equal(stats.currentStreak, 1);
    assert.equal(stats.longestStreak, 1);
    assert.equal(stats.totalActiveDays, 1);
  });

  test("multiple tests same day only count once", () => {
    const sameDay = [d(5), d(5), d(5)];
    const stats = computeStreakStats(sameDay, new Date(d(5).getTime() + 3600_000));
    assert.equal(stats.totalActiveDays, 1);
    assert.equal(stats.currentStreak, 1);
    assert.equal(stats.longestStreak, 1);
  });

  test("three consecutive days -> current streak 3", () => {
    const dates = [d(0), d(1), d(2)];
    const now = new Date(d(2).getTime() + 60_000);
    const stats = computeStreakStats(dates, now);
    assert.equal(stats.currentStreak, 3);
    assert.equal(stats.longestStreak, 3);
    assert.equal(stats.totalActiveDays, 3);
  });

  test("gap of one day (Sept 10, Sept 12) -> current streak 1", () => {
    // Spec example: Sept 10 and Sept 12 tested, today is Sept 12 -> current streak = 1
    const dates = [d(9), d(11)]; // two days apart
    const now = d(11); // "today" is the day of the last test
    const stats = computeStreakStats(dates, now);
    assert.equal(stats.currentStreak, 1);
    assert.equal(stats.longestStreak, 1);
  });

  test("today has no test but yesterday does -> current streak still counts through yesterday", () => {
    const dates = [d(0), d(1), d(2)]; // last active day = day 2
    const now = d(3); // "today" = day 3, one day after last activity
    const stats = computeStreakStats(dates, now);
    assert.equal(stats.currentStreak, 3);
  });

  test("gap of more than one day -> current streak is 0", () => {
    const dates = [d(0), d(1), d(2)];
    const now = d(4); // two days after last activity
    const stats = computeStreakStats(dates, now);
    assert.equal(stats.currentStreak, 0);
    assert.equal(stats.longestStreak, 3); // historical max unaffected
  });

  test("broken streak: historical longest streak greater than current streak", () => {
    // Active days: 1,2,3,4 (streak of 4), gap, 8,9 (streak of 2)
    const dates = [d(1), d(2), d(3), d(4), d(8), d(9)];
    const now = d(9);
    const stats = computeStreakStats(dates, now);
    assert.equal(stats.longestStreak, 4);
    assert.equal(stats.currentStreak, 2);
    assert.equal(stats.totalActiveDays, 6);
  });

  test("seven consecutive days", () => {
    const dates = [0, 1, 2, 3, 4, 5, 6].map(d);
    const now = d(6);
    const stats = computeStreakStats(dates, now);
    assert.equal(stats.currentStreak, 7);
    assert.equal(stats.longestStreak, 7);
  });

  test("lastActiveDate reflects the actual latest timestamp, not a truncated day", () => {
    const latest = d(6);
    const stats = computeStreakStats([d(0), latest], new Date(latest.getTime() + 60_000));
    assert.equal(stats.lastActiveDate, latest.toISOString());
  });

  test("toUTCDayIndex buckets same UTC calendar date regardless of time", () => {
    const early = new Date("2026-09-12T00:05:00.000Z");
    const late = new Date("2026-09-12T23:55:00.000Z");
    assert.equal(toUTCDayIndex(early), toUTCDayIndex(late));
  });

  test("malformed date values are ignored rather than crashing", () => {
    const stats = computeStreakStats([d(0), "not-a-date", d(1)], d(1));
    assert.equal(stats.totalActiveDays, 2);
    assert.equal(stats.currentStreak, 2);
  });
});
