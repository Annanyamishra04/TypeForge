import { TYPING_MODES } from "../models/TypingResult.js";

export const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{8,100}$/;

const NUMERIC_FIELDS = [
  "durationSeconds",
  "elapsedSeconds",
  "wpm",
  "accuracy",
  "correctChars",
  "incorrectChars",
  "totalChars",
  "errors",
];

/**
 * Validates a POST /api/results body. Returns an array of human
 * readable error strings — empty means the payload is acceptable.
 * Never trusts the frontend: every field is re-checked here
 * regardless of what the client claims to have already validated.
 */
export function validateResultPayload(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return ["Request body must be a JSON object."];
  }

  const { sessionId, mode, punctuation, numbers } = body;

  if (typeof sessionId !== "string" || !SESSION_ID_PATTERN.test(sessionId)) {
    errors.push("sessionId is missing or malformed.");
  }

  if (typeof mode !== "string" || !TYPING_MODES.includes(mode)) {
    errors.push(`mode must be one of: ${TYPING_MODES.join(", ")}.`);
  }

  for (const field of NUMERIC_FIELDS) {
    const value = body[field];
    if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
      errors.push(`${field} must be a finite number.`);
    } else if (value < 0) {
      errors.push(`${field} cannot be negative.`);
    }
  }

  if (typeof body.durationSeconds === "number" && body.durationSeconds > 3600) {
    errors.push("durationSeconds is unrealistically large.");
  }
  if (typeof body.wpm === "number" && body.wpm > 1000) {
    errors.push("wpm is unrealistically large.");
  }
  if (typeof body.accuracy === "number" && body.accuracy > 100) {
    errors.push("accuracy cannot exceed 100.");
  }
  if (
    typeof body.elapsedSeconds === "number" &&
    typeof body.durationSeconds === "number" &&
    body.elapsedSeconds > body.durationSeconds + 1
  ) {
    errors.push("elapsedSeconds cannot exceed durationSeconds.");
  }
  if (
    typeof body.correctChars === "number" &&
    typeof body.incorrectChars === "number" &&
    typeof body.totalChars === "number" &&
    body.correctChars + body.incorrectChars !== body.totalChars
  ) {
    errors.push("correctChars + incorrectChars must equal totalChars.");
  }

  if (punctuation !== undefined && typeof punctuation !== "boolean") {
    errors.push("punctuation must be a boolean.");
  }
  if (numbers !== undefined && typeof numbers !== "boolean") {
    errors.push("numbers must be a boolean.");
  }

  return errors;
}

export function validateSessionId(sessionId) {
  return typeof sessionId === "string" && SESSION_ID_PATTERN.test(sessionId);
}
