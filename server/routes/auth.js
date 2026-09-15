import { Router } from "express";
import { register, login, getMe, claimSession } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Rate-limited: these are the two endpoints most exposed to
// credential-guessing / registration-abuse bots.
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", requireAuth, getMe);
router.post("/claim-session", requireAuth, claimSession);

export default router;
