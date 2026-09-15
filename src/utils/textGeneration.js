/**
 * Pure text-generation utilities for the typing test.
 *
 * Kept free of React/UI concerns so each piece (word generation,
 * punctuation, numbers, quote selection, custom-text validation) can
 * be reasoned about and tested in isolation, and so the data files in
 * `src/data/` can stay pure data.
 */
import { WORD_BANK } from "../data/words";
import { QUOTES } from "../data/quotes";

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(word) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// ---------------------------------------------------------------------------
// Words mode
// ---------------------------------------------------------------------------

/**
 * Rough word count needed so the text won't run out for the fastest
 * realistic typists within a given duration. Assumes up to ~150 WPM
 * and pads generously.
 */
export function wordCountForDuration(durationSeconds) {
  const minutes = durationSeconds / 60;
  const generousWpm = 150;
  const buffer = 40;
  return Math.ceil(minutes * generousWpm) + buffer;
}

/** Plain, unpunctuated, number-free words sampled from the word bank. */
export function generateWordList(wordCount = 200) {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(pickRandom(WORD_BANK));
  }
  return words;
}

/**
 * Replaces some words with numbers so numbers are genuinely part of
 * the text the user has to type, not just appended decoration.
 */
export function applyNumbers(words) {
  return words.map((word, i) => {
    // Every ~8th word becomes a number; never the very first word so
    // a test never opens on a number.
    if (i > 0 && i % 8 === 0) {
      const useDecimal = Math.random() < 0.2;
      if (useDecimal) {
        return (Math.random() * 100).toFixed(1);
      }
      return String(Math.floor(Math.random() * 1000));
    }
    return word;
  });
}

const SENTENCE_END_MARKS = [".", ".", ".", ".", "!", "?"]; // mostly periods

/**
 * Adds sentence-like structure to a list of words: capitalized
 * sentence starts, occasional commas, and terminal punctuation every
 * handful of words. Operates on (and returns) an array of words so it
 * composes cleanly with `applyNumbers`.
 */
export function applyPunctuation(words) {
  if (words.length === 0) return words;
  const out = [...words];
  let sinceSentenceStart = 0;

  for (let i = 0; i < out.length; i++) {
    if (sinceSentenceStart === 0) {
      out[i] = capitalize(out[i]);
    }
    sinceSentenceStart += 1;

    const isLast = i === out.length - 1;
    const sentenceLength = 9 + Math.floor(Math.random() * 6); // 9–14 words

    if (!isLast && sinceSentenceStart >= sentenceLength) {
      out[i] += pickRandom(SENTENCE_END_MARKS);
      sinceSentenceStart = 0;
    } else if (!isLast && sinceSentenceStart > 2 && Math.random() < 0.12) {
      out[i] += ",";
    }
  }

  if (!/[.!?]$/.test(out[out.length - 1])) {
    out[out.length - 1] += ".";
  }

  return out;
}

/**
 * Builds the full Words-mode target text for the given word count and
 * options. Punctuation and numbers are independent and compose: both
 * can be on, either can be on alone, or both off.
 */
export function generateWordsText(wordCount, { punctuation = false, numbers = false } = {}) {
  let words = generateWordList(wordCount);
  if (numbers) words = applyNumbers(words);
  if (punctuation) words = applyPunctuation(words);
  return words.join(" ");
}

// ---------------------------------------------------------------------------
// Quotes mode
// ---------------------------------------------------------------------------

function quoteWordCount(quote) {
  return quote.trim().split(/\s+/).length;
}

/**
 * Rough minimum word count a quote should have to reasonably fill a
 * given test duration. Quotes are fixed-length, so this is best
 * effort — if no quote is long enough, the longest available quote is
 * used instead of leaving the target too short outright.
 */
export function quoteMinWordsForDuration(durationSeconds) {
  const minutes = durationSeconds / 60;
  const generousWpm = 90;
  return Math.round(minutes * generousWpm);
}

/**
 * Picks a random quote that's long enough for the given minimum word
 * count where possible; falls back to the longest available quote
 * (not a hard failure) if none reach that length.
 */
export function pickQuote(minWords = 0) {
  const candidates = QUOTES.filter((q) => quoteWordCount(q) >= minWords);
  if (candidates.length > 0) return pickRandom(candidates);

  return QUOTES.reduce((longest, q) => (quoteWordCount(q) > quoteWordCount(longest) ? q : longest), QUOTES[0]);
}

// ---------------------------------------------------------------------------
// Custom mode
// ---------------------------------------------------------------------------

/**
 * Validates user-supplied custom text. Trims leading/trailing
 * whitespace only — never rewrites the interior of the user's text.
 */
export function validateCustomText(rawText) {
  const trimmed = (rawText ?? "").trim();
  if (trimmed.length === 0) {
    return { trimmed: "", isValid: false, error: "Enter some text before starting the test." };
  }
  return { trimmed, isValid: true, error: null };
}
