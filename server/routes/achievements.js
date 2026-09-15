import { Router } from "express";
import { getMyAchievements } from "../controllers/achievementsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Protected: achievement/streak data is always scoped to the caller's
// own verified identity, never a client-supplied one.
router.get("/me", requireAuth, getMyAchievements);

export default router;
