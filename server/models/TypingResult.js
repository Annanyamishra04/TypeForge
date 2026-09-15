import mongoose from "mongoose";

export const TYPING_MODES = ["words", "quotes", "custom"];

const typingResultSchema = new mongoose.Schema(
  {
    // Anonymous, client-generated identifier — not an account. See
    // src/utils/session.js on the frontend. Deliberately not treated
    // as an authentication credential.
    sessionId: {
      type: String,
      required: [true, "sessionId is required."],
      trim: true,
      minlength: 8,
      maxlength: 100,
      match: [/^[a-zA-Z0-9_-]+$/, "sessionId contains invalid characters."],
      index: true,
    },
    // Set only when the result was saved by an authenticated user
    // (determined server-side from a verified JWT — never from a
    // client-supplied value). Anonymous results keep this as null and
    // remain identified purely by sessionId, preserving Phase 4
    // compatibility.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    mode: {
      type: String,
      required: [true, "mode is required."],
      enum: { values: TYPING_MODES, message: "mode must be one of: words, quotes, custom." },
    },
    durationSeconds: {
      type: Number,
      required: [true, "durationSeconds is required."],
      min: [1, "durationSeconds must be positive."],
      max: [3600, "durationSeconds is unrealistically large."],
    },
    elapsedSeconds: {
      type: Number,
      required: [true, "elapsedSeconds is required."],
      min: [0, "elapsedSeconds cannot be negative."],
    },
    wpm: {
      type: Number,
      required: [true, "wpm is required."],
      min: [0, "wpm cannot be negative."],
      max: [1000, "wpm is unrealistically large."],
    },
    accuracy: {
      type: Number,
      required: [true, "accuracy is required."],
      min: [0, "accuracy cannot be negative."],
      max: [100, "accuracy cannot exceed 100."],
    },
    correctChars: { type: Number, required: true, min: 0 },
    incorrectChars: { type: Number, required: true, min: 0 },
    totalChars: { type: Number, required: true, min: 0 },
    errors: { type: Number, required: true, min: 0 },
    punctuation: { type: Boolean, default: false },
    numbers: { type: Boolean, default: false },
    // Custom mode's actual text is intentionally never stored — it's
    // unnecessary for statistics and avoids retaining user content.
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    // `errors` is the field name the Phase 4 spec calls for, but it
    // also happens to be a reserved Mongoose document property (used
    // internally to hold validation errors after a failed .validate()
    // call). It's a known, harmless collision here — this schema
    // doesn't read `doc.errors` for that internal purpose anywhere —
    // so the warning is deliberately suppressed rather than the field
    // renamed away from the requested name.
    suppressReservedKeysWarning: true,
  }
);

// Cross-field sanity checks that a single field's `min`/`max` can't
// express on their own.
typingResultSchema.pre("validate", function guardImpossibleValues(next) {
  if (
    typeof this.elapsedSeconds === "number" &&
    typeof this.durationSeconds === "number" &&
    this.elapsedSeconds > this.durationSeconds + 1
  ) {
    return next(new Error("elapsedSeconds cannot exceed durationSeconds."));
  }

  if (
    typeof this.correctChars === "number" &&
    typeof this.incorrectChars === "number" &&
    typeof this.totalChars === "number" &&
    this.correctChars + this.incorrectChars !== this.totalChars
  ) {
    return next(new Error("correctChars + incorrectChars must equal totalChars."));
  }

  next();
});

// Speeds up "this user's history, newest first" — the exact shape of
// the /api/results/me and /api/results/me/stats queries.
typingResultSchema.index({ userId: 1, createdAt: -1 });

// The leaderboard (Phase 7) filters by mode + duration together, then
// sorts the survivors by wpm/accuracy — this compound index covers the
// filter portion of that query. Sort fields themselves aren't part of
// it: with a small per-mode/duration result set (M0-scale), an
// in-memory sort after this index narrows things down is cheap enough
// that dedicated { wpm: -1 } / { accuracy: -1 } indexes aren't worth
// the extra write overhead yet.
typingResultSchema.index({ mode: 1, durationSeconds: 1 });

export const TypingResult = mongoose.model("TypingResult", typingResultSchema);
