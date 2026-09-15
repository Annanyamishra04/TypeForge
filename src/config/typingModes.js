/**
 * Configuration for the typing-test setup UI and engine.
 *
 * Kept separate from both the data (words/quotes) and the UI
 * components so the mode list and duration list have one source of
 * truth that both the config panel and the `useTypingTest` hook read
 * from.
 */

export const MODES = {
  WORDS: "words",
  QUOTES: "quotes",
  CUSTOM: "custom",
};

export const MODE_OPTIONS = [
  { value: MODES.WORDS, label: "Words" },
  { value: MODES.QUOTES, label: "Quotes" },
  { value: MODES.CUSTOM, label: "Custom" },
];

export const DURATIONS = [15, 30, 60, 120];

export const DEFAULT_DURATION = 30;
