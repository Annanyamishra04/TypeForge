import crypto from "crypto";
import mongoose from "mongoose";
import { Certificate, CERTIFICATE_ID_PATTERN } from "../models/Certificate.js";
import { TypingResult } from "../models/TypingResult.js";
import { User } from "../models/User.js";

const MAX_ID_ATTEMPTS = 5;
const FALLBACK_NAME = "TYPEFORGE User";

/** A certificate-flow failure with an HTTP status the controller can pass straight through. */
export class CertificateError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "CertificateError";
    this.statusCode = statusCode;
  }
}

/**
 * TF-<current UTC year>-<8 uppercase hex chars>. 8 hex characters is a
 * 32-bit space (~4.3 billion) per year, which — combined with the
 * retry loop in createCertificateForResult — makes a collision
 * negligible without needing anything fancier than crypto.randomBytes.
 */
export function generateCertificateId(now = new Date()) {
  const year = now.getUTCFullYear();
  const random = crypto.randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
  return `TF-${year}-${random}`;
}

export function isValidObjectId(value) {
  return typeof value === "string" && mongoose.Types.ObjectId.isValid(value);
}

/**
 * The only shape a certificate is ever sent to a client in — used by
 * the public verification endpoint, the generation response, and the
 * owner's own certificate history alike. Deliberately excludes
 * userId, resultId, and every Mongo _id: none of that is
 * certificate-safe information, even for the certificate's own owner.
 */
export function toPublicCertificate(cert) {
  return {
    certificateId: cert.certificateId,
    name: cert.userNameSnapshot,
    wpm: cert.wpm,
    accuracy: cert.accuracy,
    errors: cert.errors,
    durationSeconds: cert.durationSeconds,
    mode: cert.mode,
    issuedAt: cert.issuedAt,
  };
}

/**
 * Creates (or, if one already exists for this result, returns) a
 * certificate for a completed typing test.
 *
 * Security: `userId` must already have been derived from a verified
 * JWT before this is called (see certificateController) — it is never
 * accepted from request input here. `resultId` is the only caller-
 * supplied value, and it is re-verified against the *stored*
 * TypingResult document before anything is created: every performance
 * number on the certificate comes from that document, never from the
 * request body. A resultId that doesn't exist, or that exists but
 * belongs to a different user, is rejected with the same generic
 * "not found" — a caller can't use this to enumerate other users'
 * result ids.
 */
export async function createCertificateForResult({ userId, resultId }) {
  if (!isValidObjectId(resultId)) {
    throw new CertificateError("Invalid result reference.", 400);
  }

  // Already issued for this result — return the existing certificate
  // instead of minting a second one. This is the primary duplicate
  // guard; the schema's unique index on resultId backs it up below
  // in case of a concurrent request racing this check.
  const existing = await Certificate.findOne({ resultId }).lean();
  if (existing) {
    return { certificate: existing, created: false };
  }

  const result = await TypingResult.findById(resultId).lean();

  if (!result || !result.userId || String(result.userId) !== String(userId)) {
    throw new CertificateError("Typing result not found.", 404);
  }

  const user = await User.findById(userId).lean();
  const userNameSnapshot = (user?.name || "").trim() || FALLBACK_NAME;

  let lastError = null;
  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
    const certificateId = generateCertificateId();
    try {
      const created = await Certificate.create({
        certificateId,
        userId,
        resultId,
        userNameSnapshot,
        wpm: result.wpm,
        accuracy: result.accuracy,
        errors: result.errors,
        durationSeconds: result.durationSeconds,
        mode: result.mode,
        issuedAt: new Date(),
      });
      return { certificate: created.toObject(), created: true };
    } catch (err) {
      lastError = err;
      const isDuplicateKey = err && err.code === 11000;
      const collidedOnResult = isDuplicateKey && (err.keyPattern?.resultId || "resultId" in (err.keyValue || {}));

      if (collidedOnResult) {
        // A concurrent request beat us to a certificate for this same
        // result — that's a legitimate outcome, not a failure: return
        // whatever it created.
        const concurrent = await Certificate.findOne({ resultId }).lean();
        if (concurrent) return { certificate: concurrent, created: false };
      }
      // Otherwise this was a certificateId collision (astronomically
      // unlikely) — loop and try again with a freshly generated id.
    }
  }

  throw lastError || new CertificateError("Could not generate a certificate. Please try again.", 500);
}

/** Public lookup by the certificate's public id. Returns null (never throws) for anything malformed or missing. */
export async function getCertificateByPublicId(certificateId) {
  if (typeof certificateId !== "string" || !CERTIFICATE_ID_PATTERN.test(certificateId)) {
    return null;
  }
  return Certificate.findOne({ certificateId }).lean();
}

/** Every certificate owned by `userId`, newest first. Scoping is the caller's responsibility (always req.userId from a verified JWT). */
export async function getCertificatesForUser(userId) {
  return Certificate.find({ userId }).sort({ createdAt: -1 }).lean();
}
