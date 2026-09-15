import { isDbReady } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createCertificateForResult,
  getCertificateByPublicId,
  getCertificatesForUser,
  toPublicCertificate,
  CertificateError,
} from "../services/certificateService.js";

/**
 * POST /api/certificates
 * Body: { resultId }
 *
 * Protected by requireAuth. Ownership comes solely from req.userId
 * (set by requireAuth from a verified JWT) — resultId is the only
 * value read from the request body, and the service re-verifies it
 * against the stored TypingResult before creating anything. Any other
 * field the client might send (name, wpm, accuracy, userId, ...) is
 * simply never read.
 */
export const generateCertificate = asyncHandler(async (req, res) => {
  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available." });
  }

  const { resultId } = req.body || {};

  try {
    const { certificate, created } = await createCertificateForResult({ userId: req.userId, resultId });
    res.status(created ? 201 : 200).json({
      success: true,
      created,
      certificate: toPublicCertificate(certificate),
    });
  } catch (err) {
    if (err instanceof CertificateError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    throw err;
  }
});

/**
 * GET /api/certificates/:certificateId
 * Public — no authentication required, works for a logged-out
 * visitor verifying someone else's certificate. Returns only
 * certificate-safe fields (see toPublicCertificate): never an email,
 * password hash, JWT, or any internal/Mongo id, regardless of whose
 * certificate this is.
 */
export const getPublicCertificate = asyncHandler(async (req, res) => {
  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available." });
  }

  const certificate = await getCertificateByPublicId(req.params.certificateId);
  if (!certificate) {
    return res.status(404).json({ success: false, message: "Certificate not found." });
  }

  res.json({ success: true, certificate: toPublicCertificate(certificate) });
});

/**
 * GET /api/certificates/me
 * Protected by requireAuth. Scoped exclusively to req.userId — there
 * is no request parameter that can widen this to another account's
 * certificates.
 */
export const getMyCertificates = asyncHandler(async (req, res) => {
  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: "Database is not available.", certificates: [] });
  }

  const certificates = await getCertificatesForUser(req.userId);
  res.json({ success: true, certificates: certificates.map(toPublicCertificate) });
});
