import { Router } from "express";
import { generateCertificate, getPublicCertificate, getMyCertificates } from "../controllers/certificateController.js";
import { requireAuth } from "../middleware/auth.js";
import { certificateLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/", requireAuth, certificateLimiter, generateCertificate);

// Registered before "/:certificateId" so "me" is never mistaken for a
// certificate id — same ordering convention used in routes/results.js.
router.get("/me", requireAuth, getMyCertificates);

router.get("/:certificateId", getPublicCertificate);

export default router;
