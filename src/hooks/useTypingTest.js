import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  generateWordsText,
  wordCountForDuration,
  pickQuote,
  quoteMinWordsForDuration,
  validateCustomText,
} from "../utils/textGeneration";
import { computeMetrics, calculateConsistency } from "../utils/typingMetrics";
import { MODES, DURATIONS, DEFAULT_DURATION } from "../config/typingModes";
import { saveTypingResult } from "../services/api";
import { getSessionId } from "../utils/session";

export { DURATIONS };

const TICK_MS = 100;

/**
 * Builds the target text for a given configuration. Pure function so
 * it's easy to reason about independently of the hook's state
 * machine — Words/Quotes generate fresh content, Custom just trims
 * whatever the user supplied.
 */
function buildTarget({ mode, duration, punctuation, numbers, customText }) {
  if (mode === MODES.CUSTOM) {
    return validateCustomText(customText).trimmed;
  }
  if (mode === MODES.QUOTES) {
    return pickQuote(quoteMinWordsForDuration(duration));
  }
  return generateWordsText(wordCountForDuration(duration), { punctuation, numbers });
}

/**
 * Drives the entire client-side typing test: configuration (mode,
 * duration, punctuation, numbers, custom text), target text, timer,
 * typed-input tracking, and derived metrics.
 *
 * Status lifecycle: "idle" -> "running" -> "finished".
 * The timer only starts on the first typed character, never on mount.
 * Configuration can only change while status is "idle" or "finished" —
 * never mid-run, so a running test is never silently corrupted.
 */
export function useTypingTest(initialDuration = DEFAULT_DURATION) {
  const [duration, setDurationState] = useState(initialDuration);
  const [mode, setModeState] = useState(MODES.WORDS);
  const [punctuation, setPunctuationState] = useState(false);
  const [numbers, setNumbersState] = useState(false);
  const [customText, setCustomTextState] = useState("");
  const [customTextError, setCustomTextError] = useState(null);

  const [targetText, setTargetText] = useState(() =>
    buildTarget({ mode: MODES.WORDS, duration: initialDuration, punctuation: false, numbers: false, customText: "" })
  );
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | finished
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [finalMetrics, setFinalMetrics] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  // idle | saving | saved | error — persistence status for the most
  // recently finished test, entirely separate from the typing engine
  // itself (the test works the same whether this succeeds or not).
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState(null);
  // The saved TypingResult's real database id, once persistence
  // succeeds — the only thing certificate generation is ever allowed
  // to reference (see ResultScreen's "Generate certificate" action).
  // Only ever set from the backend's own response, never guessed.
  const [savedResultId, setSavedResultId] = useState(null);

  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  // Mirror state in refs so callbacks captured once (interval tick,
  // finish) always read the latest value instead of a stale closure.
  const typedRef = useRef("");
  const targetRef = useRef(targetText);
  const statusRef = useRef("idle");
  const configRef = useRef({ mode, duration, punctuation, numbers, customText });
  // Periodic WPM readings taken while a test is running, purely to
  // derive the "consistency" score shown on the result screen — reset
  // on every new test, never persisted or sent anywhere on its own.
  const wpmSamplesRef = useRef([]);

  useEffect(() => {
    typedRef.current = typed;
  }, [typed]);

  useEffect(() => {
    targetRef.current = targetText;
  }, [targetText]);

  useEffect(() => {
    configRef.current = { mode, duration, punctuation, numbers, customText };
  }, [mode, duration, punctuation, numbers, customText]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finish = useCallback(
    (elapsedOverrideSeconds) => {
      if (statusRef.current === "finished") return;
      statusRef.current = "finished";
      clearTimer();

      const elapsedSeconds =
        elapsedOverrideSeconds ??
        (startTimeRef.current
          ? Math.min(configRef.current.duration, (performance.now() - startTimeRef.current) / 1000)
          : 0);
      const metrics = computeMetrics({
        target: targetRef.current,
        typed: typedRef.current,
        elapsedSeconds,
      });
      const consistency = calculateConsistency(wpmSamplesRef.current);
      setFinalMetrics({ ...metrics, durationSeconds: configRef.current.duration, elapsedSeconds, consistency });
      setFinishedAt(new Date());
      setTimeLeft(0);
      setStatus("finished");

      // Exactly one save attempt per completed test: this branch is
      // only reachable once per test because of the reentrancy guard
      // at the top of this function (`if (statusRef.current ===
      // "finished") return;`), so neither a duplicate keystroke event
      // nor the timer tick that raced it can trigger a second POST.
      const cfg = configRef.current;
      setSaveStatus("saving");
      setSaveError(null);
      setSavedResultId(null);
      saveTypingResult({
        sessionId: getSessionId(),
        mode: cfg.mode,
        durationSeconds: cfg.duration,
        elapsedSeconds,
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        correctChars: metrics.correctChars,
        incorrectChars: metrics.incorrectChars,
        totalChars: metrics.totalChars,
        errors: metrics.errors,
        // Punctuation/numbers only ever apply to Words mode — never
        // misreport them as active for Quotes/Custom.
        punctuation: cfg.mode === MODES.WORDS ? cfg.punctuation : false,
        numbers: cfg.mode === MODES.WORDS ? cfg.numbers : false,
      })
        .then((data) => {
          setSaveStatus("saved");
          setSavedResultId(data?.id ?? null);
        })
        .catch((err) => {
          setSaveStatus("error");
          setSaveError(err?.message || "Could not sync — result remains available locally.");
        });
    },
    [clearTimer]
  );

  // Timer: only ticks while running.
  useEffect(() => {
    if (status !== "running") return undefined;

    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      // Sample the pace so far for the result screen's consistency
      // score. Cheap: just a WPM calculation against refs, no re-render.
      const tickMetrics = computeMetrics({ target: targetRef.current, typed: typedRef.current, elapsedSeconds: elapsed });
      wpmSamplesRef.current.push(tickMetrics.wpm);

      if (remaining <= 0) {
        finish(duration);
      }
    }, TICK_MS);

    return clearTimer;
  }, [status, duration, finish, clearTimer]);

  const liveMetrics = useMemo(() => {
    const elapsedSeconds =
      status === "idle" || !startTimeRef.current
        ? 0
        : status === "finished" && finalMetrics
        ? finalMetrics.elapsedSeconds
        : (performance.now() - startTimeRef.current) / 1000;
    return computeMetrics({ target: targetText, typed, elapsedSeconds });
  }, [targetText, typed, status, finalMetrics, timeLeft]);

  const handleChange = useCallback(
    (rawValue) => {
      if (statusRef.current === "finished") return;
      // Nothing to type yet (e.g. Custom mode with no text entered) —
      // don't let a keystroke silently "start" a test with no target.
      if (targetRef.current.length === 0) return;

      // Never let typed input run past the target length — extra
      // characters typed past the end of the text aren't meaningful.
      const value = rawValue.slice(0, targetRef.current.length);

      if (statusRef.current === "idle" && value.length > 0) {
        startTimeRef.current = performance.now();
        statusRef.current = "running";
        setStatus("running");
      }

      // Update the ref synchronously (not just via the effect below) so
      // that if this same keystroke also completes the text, `finish`
      // reads the exact final value rather than the previous render's.
      typedRef.current = value;
      setTyped(value);

      if (value.length >= targetRef.current.length && targetRef.current.length > 0) {
        // Completed the full target text before time ran out.
        const elapsedSeconds = startTimeRef.current
          ? Math.min(configRef.current.duration, (performance.now() - startTimeRef.current) / 1000)
          : 0;
        finish(elapsedSeconds);
      }
    },
    [finish]
  );

  /**
   * Resets typed input, timer, and metrics, then rebuilds the target
   * from the current configuration merged with any overrides. This is
   * the single place a fresh target gets generated/selected, whether
   * that's from a duration change, a mode change, a toggle flip, a
   * custom-text edit, a restart, or "change duration" after a finished
   * test.
   */
  const resetToNew = useCallback((overrides = {}) => {
    clearTimer();
    startTimeRef.current = null;
    statusRef.current = "idle";
    typedRef.current = "";
    wpmSamplesRef.current = [];
    setStatus("idle");
    setTyped("");
    setFinalMetrics(null);
    setFinishedAt(null);
    setSaveStatus("idle");
    setSaveError(null);
    setSavedResultId(null);

    const cfg = { ...configRef.current, ...overrides };
    setTimeLeft(cfg.duration);
    setTargetText(buildTarget(cfg));
  }, [clearTimer]);

  const isRunning = useCallback(() => statusRef.current === "running", []);

  const restart = useCallback(() => {
    resetToNew();
  }, [resetToNew]);

  // --- Configuration setters -------------------------------------------
  // Every one of these is a no-op while a test is running: configuration
  // changes are only allowed before a test starts or after it finishes.

  const setDuration = useCallback(
    (nextDuration) => {
      if (isRunning()) return;
      setDurationState(nextDuration);
      resetToNew({ duration: nextDuration });
    },
    [isRunning, resetToNew]
  );

  const setMode = useCallback(
    (nextMode) => {
      if (isRunning()) return;
      setModeState(nextMode);
      setCustomTextError(null);
      resetToNew({ mode: nextMode });
    },
    [isRunning, resetToNew]
  );

  const setPunctuation = useCallback(
    (value) => {
      if (isRunning()) return;
      setPunctuationState(value);
      resetToNew({ punctuation: value });
    },
    [isRunning, resetToNew]
  );

  const setNumbers = useCallback(
    (value) => {
      if (isRunning()) return;
      setNumbersState(value);
      resetToNew({ numbers: value });
    },
    [isRunning, resetToNew]
  );

  const setCustomText = useCallback(
    (value) => {
      if (isRunning()) return;
      setCustomTextState(value);
      setCustomTextError(null);
      resetToNew({ customText: value });
    },
    [isRunning, resetToNew]
  );

  /**
   * Validates the current custom text and surfaces an error if it's
   * empty. Called before focusing the typing area in Custom mode so
   * an empty target can never be typed into.
   */
  const validateBeforeStart = useCallback(() => {
    if (configRef.current.mode !== MODES.CUSTOM) return true;
    const { isValid, error } = validateCustomText(configRef.current.customText);
    setCustomTextError(isValid ? null : error);
    return isValid;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  return {
    // configuration
    duration,
    setDuration,
    mode,
    setMode,
    punctuation,
    setPunctuation,
    numbers,
    setNumbers,
    customText,
    setCustomText,
    customTextError,
    validateBeforeStart,
    isConfigLocked: status === "running",

    // engine
    targetText,
    typed,
    status,
    timeLeft,
    handleChange,
    restart,
    finalMetrics,
    finishedAt,
    liveMetrics,
    saveStatus,
    saveError,
    savedResultId,
  };
}
