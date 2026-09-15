import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboardController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// Public: the board itself never requires login. optionalAuth attaches
// req.userId when a valid token is present so the controller can also
// return that caller's own rank, without ever gating the endpoint
// behind requireAuth.
router.get("/", optionalAuth, getLeaderboard);

export default router;
