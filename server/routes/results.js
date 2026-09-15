import { Router } from "express";
import {
  saveResult,
  getHistory,
  getStats,
  getMyHistory,
  getMyStats,
  getMyAnalytics,
} from "../controllers/resultsController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

// optionalAuth: works for both logged-out (anonymous sessionId) and
// logged-in (JWT-derived userId) callers, without duplicating the
// endpoint.
router.post("/", optionalAuth, saveResult);

// Authenticated routes are registered before the generic
// "/:sessionId" routes below so "me" is never mistaken for a
// sessionId param.
router.get("/me/analytics", requireAuth, getMyAnalytics);
router.get("/me/stats", requireAuth, getMyStats);
router.get("/me", requireAuth, getMyHistory);

router.get("/:sessionId/stats", getStats);
router.get("/:sessionId", getHistory);

export default router;
