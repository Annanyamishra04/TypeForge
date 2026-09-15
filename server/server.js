import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB, closeDB } from "./config/db.js";
import healthRoutes from "./routes/health.js";
import resultsRoutes from "./routes/results.js";
import authRoutes from "./routes/auth.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import achievementsRoutes from "./routes/achievements.js";
import coachRoutes from "./routes/coach.js";
import certificateRoutes from "./routes/certificates.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const PORT = process.env.PORT || 5000;
// Falls back to the Vite dev server's default origin so local
// development works without any .env file at all.
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();

// Sets a standard set of protective HTTP response headers. This is a
// pure JSON API (no HTML/browser-rendered content served by Express
// itself), so the default policy is safe as-is and needs no per-route
// tuning.
app.use(helmet());
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: "10kb" })); // small, deliberate cap — see security basics

app.use("/api/health", healthRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/achievements", achievementsRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/certificates", certificateRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  if (!process.env.JWT_SECRET) {
    console.warn(
      "[auth] JWT_SECRET is not set — registration, login, and any authenticated " +
        "route will fail until it is configured in .env."
    );
  }
  await connectDB(); // never throws — logs and degrades gracefully instead
  // Bind explicitly to 0.0.0.0 (not just "localhost") — required by
  // Render and most container/PaaS hosts to route external traffic to
  // the process at all.
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] TYPEFORGE API listening on port ${PORT} (CORS origin: ${CLIENT_URL})`);
  });
}

start();

async function shutdown(signal) {
  console.log(`[server] Received ${signal}, shutting down...`);
  await closeDB();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
