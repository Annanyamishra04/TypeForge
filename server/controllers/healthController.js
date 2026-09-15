import { getDbStatus } from "../config/db.js";

/**
 * GET /api/health — reports actual status, not an assumed "ok".
 * `database` reflects the real Mongoose connection state so a caller
 * can tell persistence apart from "API process is up."
 */
export function getHealth(req, res) {
  res.json({
    success: true,
    api: "ok",
    database: getDbStatus(),
  });
}
