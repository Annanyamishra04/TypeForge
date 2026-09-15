/**
 * Streak calculation utilities.
 * ------------------------------------------------------------------
 * A streak is measured in CALENDAR DAYS, not number of tests — one or
 * a hundred tests on the same day both count as a single "active
 * day". This module is pure (no DB, no Express) so it can be unit
 * tested directly with fabricated dates; see streaks.test.js.
 *
 * TIMEZONE STRATEGY (documented, single source of truth):
 * TYPEFORGE does not currently store a per-user timezone anywhere in
 * the User model, so there is no reliable "local day" to anchor on.
 * Per Phase 8 spec section 5, we normalize every `createdAt` to its
 * UTC calendar date. This means a test completed at 11:30pm PT
 * (which is already the next UTC day) counts toward the UTC day, not
 * the user's local day. This is a deliberate, documented trade-off —
 * consistent and unambiguous — rather than a bug. If per-user
 * timezones are added in a future phase, this is the only module that
 * needs to change.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Converts a Date (or date-like value) into an integer "day index" —
 * the number of whole UTC calendar days since the Unix epoch. Two
 * timestamps on the same UTC calendar date always produce the same
 * index, regardless of time-of-day, which is exactly the normalization
 * we want for "was there activity on this day?".
 */
export function toUTCDayIndex(dateLike) {
  const d = new Date(dateLike);
  const utcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor(utcMidnight / DAY_MS);
}

/**
 * Computes streak statistics from a list of raw `createdAt` values
 * (Date objects, ISO strings, or anything `new Date()` accepts).
 * Duplicate/same-day timestamps are automatically collapsed into a
 * single active day.
 *
 * @param {Array} createdAtDates - every completed test's createdAt.
 * @param {Date} [now] - injectable "current time" for deterministic tests.
 * @returns {{
 *   currentStreak: number,
 *   longestStreak: number,
 *   totalActiveDays: number,
 *   lastActiveDate: string|null,
 * }}
 */
export function computeStreakStats(createdAtDates, now = new Date()) {
  if (!Array.isArray(createdAtDates) || createdAtDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      lastActiveDate: null,
    };
  }

  // Collapse same-day timestamps into a single active day, and keep
  // the actual latest timestamp for lastActiveDate (more informative
  // to a caller than a bare date-at-midnight).
  const dayIndexSet = new Set();
  let latestRawDate = null;

  for (const raw of createdAtDates) {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue; // ignore malformed values defensively
    dayIndexSet.add(toUTCDayIndex(d));
    if (!latestRawDate || d.getTime() > latestRawDate.getTime()) {
      latestRawDate = d;
    }
  }

  if (dayIndexSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, lastActiveDate: null };
  }

  const sortedDays = Array.from(dayIndexSet).sort((a, b) => a - b);
  const totalActiveDays = sortedDays.length;
  const lastActiveDayIndex = sortedDays[sortedDays.length - 1];

  // --- Longest (historical maximum) consecutive run ---------------------
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i += 1) {
    if (sortedDays[i] === sortedDays[i - 1] + 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
  }

  // --- Current streak -----------------------------------------------------
  // Active "today" if the gap between today and the last active day is
  // 0 (tested today) or 1 (tested yesterday, today not over yet in the
  // sense of "still within grace"). Anything further back means the
  // streak is broken.
  const todayIndex = toUTCDayIndex(now);
  const gapFromToday = todayIndex - lastActiveDayIndex;

  let currentStreak = 0;
  if (gapFromToday <= 1) {
    let cursor = lastActiveDayIndex;
    while (dayIndexSet.has(cursor)) {
      currentStreak += 1;
      cursor -= 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    lastActiveDate: latestRawDate.toISOString(),
  };
}
