import { Router } from "express";
import { getMyCoachReport } from "../controllers/coachController.js";
import { requireAuth } from "../middleware/auth.js";
import { coachLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Protected: coaching insight is always derived from the caller's own
// verified identity, never a client-supplied one. Rate-limited since
// this is the only route that can trigger a paid AI provider call.
router.get("/me", requireAuth, coachLimiter, getMyCoachReport);

export default router;
