/**
 * Pure functions for scoring a typing test.
 *
 * Kept free of React/timer concerns so they're easy to reason about
 * and unit-test in isolation from the hook that drives the engine.
 */

const CHARS_PER_WORD = 5;

/**
 * Classifies each typed character against the target text.
 *
 * @param {string} target the text the user is trying to type
 * @param {string} typed the characters the user has typed so far
 * @returns {{ correct: number, incorrect: number, total: number }}
 */
export function scoreTyped(target, typed) {
  let correct = 0;
  let incorrect = 0;

  const total = typed.length;
  for (let i = 0; i < total; i++) {
    if (i < target.length && typed[i] === target[i]) {
      correct += 1;
    } else {
      incorrect += 1;
    }
  }

  return { correct, incorrect, total };
}

/**
 * Standard WPM convention: 5 characters = 1 word, using only
 * correctly typed characters, measured against elapsed time.
 *
 * @param {number} correctChars count of correctly typed characters
 * @param {number} elapsedSeconds time elapsed since the test started
 * @returns {number} whole-number words per minute, never negative/NaN
 */
export function calculateWpm(correctChars, elapsedSeconds) {
  if (!elapsedSeconds || elapsedSeconds <= 0 || !correctChars || correctChars <= 0) {
    return 0;
  }
  const minutes = elapsedSeconds / 60;
  const words = correctChars / CHARS_PER_WORD;
  const wpm = words / minutes;
  return Math.max(0, Math.round(wpm));
}

/**
 * Accuracy as a percentage of correctly typed characters over all
 * typed characters. Returns 100 for zero input so a fresh test
 * doesn't show a misleading 0%.
 *
 * @param {number} correctChars
 * @param {number} totalChars
 * @returns {number} 0-100, rounded to one decimal place
 */
export function calculateAccuracy(correctChars, totalChars) {
  if (!totalChars || totalChars <= 0) return 100;
  const pct = (correctChars / totalChars) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * A 0-100 "consistency" score derived from how much WPM varied across
 * samples taken during the test (lower relative variance -> higher
 * score). Ignores samples before typing has any measurable pace, so
 * a slow first keystroke doesn't get scored as an inconsistency.
 *
 * @param {number[]} wpmSamples periodic WPM readings taken while running
 * @returns {number} 0-100, rounded to a whole number; 100 when there's
 *   too little data to say anything meaningful (avoids a misleading 0).
 */
export function calculateConsistency(wpmSamples) {
  const usable = (wpmSamples || []).filter((v) => v > 0);
  if (usable.length < 4) return 100;

  const mean = usable.reduce((a, b) => a + b, 0) / usable.length;
  if (mean <= 0) return 100;

  const variance = usable.reduce((a, b) => a + (b - mean) ** 2, 0) / usable.length;
  const stdDev = Math.sqrt(variance);
  const relativeSpread = stdDev / mean; // coefficient of variation

  // A relative spread of 0 is perfectly consistent (100); a spread of
  // 0.5+ (WPM swinging by half its own average) reads as fully
  // inconsistent (0). Linear in between, clamped either side.
  const score = 100 - relativeSpread * 200;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Builds the full metrics snapshot shown during and at the end of a
 * test. All numbers are derived only from target/typed/elapsed —
 * nothing here is ever hardcoded or simulated.
 */
export function computeMetrics({ target, typed, elapsedSeconds }) {
  const { correct, incorrect, total } = scoreTyped(target, typed);
  return {
    correctChars: correct,
    incorrectChars: incorrect,
    totalChars: total,
    errors: incorrect,
    wpm: calculateWpm(correct, elapsedSeconds),
    accuracy: calculateAccuracy(correct, total),
  };
}
