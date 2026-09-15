import mongoose from "mongoose";

// Tracks whether a connection string was even supplied, separately
// from whether mongoose is *currently* connected — the two are
// different questions ("is this configured at all?" vs "is it up
// right now?") and callers need both.
let configured = false;

/**
 * Connects to MongoDB using MONGODB_URI if present. Never throws and
 * never crashes the process: if the URI is missing or the connection
 * fails, the API still starts, and `getDbStatus()` honestly reflects
 * that persistence isn't available rather than silently pretending it
 * is.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    configured = false;
    console.warn(
      "[db] MONGODB_URI is not set — starting without database persistence. " +
        "Results will not be saved until a connection string is configured."
    );
    return null;
  }

  configured = true;

  mongoose.connection.on("error", (err) => {
    console.error(`[db] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected.");
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[db] MongoDB connected (${mongoose.connection.name}).`);
  } catch (err) {
    // Deliberately not re-thrown: a bad/unreachable connection string
    // should degrade the API to "database unavailable", not crash the
    // whole server with an unreadable stack trace.
    console.error(`[db] MongoDB connection failed: ${err.message}`);
  }

  return mongoose.connection;
}

/** Whether a MONGODB_URI was supplied at all (regardless of live state). */
export function isDbConfigured() {
  return configured;
}

/**
 * Current database status as a plain string, safe to expose in API
 * responses: "not_configured" | "connected" | "connecting" |
 * "disconnecting" | "disconnected".
 */
export function getDbStatus() {
  if (!configured) return "not_configured";

  switch (mongoose.connection.readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "disconnected";
  }
}

/** True only when the database is configured AND currently connected. */
export function isDbReady() {
  return configured && mongoose.connection.readyState === 1;
}

/** Closes the connection cleanly (used on process shutdown). */
export async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log("[db] MongoDB connection closed.");
  }
}
