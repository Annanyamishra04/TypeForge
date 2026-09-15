import mongoose from "mongoose";
import { TYPING_MODES } from "./TypingResult.js";

// TF-<UTC year>-<8 uppercase hex chars>, e.g. TF-2026-9F3C2A7B. Public-
// safe by design: generated server-side (see certificateService.js),
// never derived from or equal to a MongoDB ObjectId, and reveals
// nothing about the underlying document.
export const CERTIFICATE_ID_PATTERN = /^TF-\d{4}-[A-Z0-9]{8}$/;

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      match: CERTIFICATE_ID_PATTERN,
      index: true,
    },
    // Owner — always derived server-side from a verified JWT (see
    // certificateService.createCertificateForResult), never from
    // client input.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // The exact completed test this certificate was issued for.
    // `unique: true` is the database-level guarantee that a single
    // result can never back more than one certificate — this *is*
    // the duplicate-generation guard, not just an application check.
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TypingResult",
      required: true,
      unique: true,
      index: true,
    },
    // Snapshot fields below are copied from the User/TypingResult
    // documents at issuance time and never re-read live, so a later
    // profile name change never rewrites a certificate that has
    // already been issued.
    userNameSnapshot: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    wpm: { type: Number, required: true, min: 0, max: 1000 },
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    errors: { type: Number, required: true, min: 0 },
    durationSeconds: { type: Number, required: true, min: 1, max: 3600 },
    mode: {
      type: String,
      required: true,
      enum: { values: TYPING_MODES, message: "mode must be one of: words, quotes, custom." },
    },
    issuedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// "All certificates for this user, newest first" — Profile's
// certificate history and GET /api/certificates/me.
certificateSchema.index({ userId: 1, createdAt: -1 });

export const Certificate = mongoose.model("Certificate", certificateSchema);
