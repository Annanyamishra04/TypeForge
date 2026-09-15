const SESSION_KEY = "typeforge_session_id";

/**
 * Generates a random, URL-safe identifier. Not a secret, not tied to
 * any personal information, and never used for authentication — it
 * only lets the backend group a browser's own results together while
 * Phase 5's real accounts don't exist yet.
 */
function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  // Fallback for environments without crypto.randomUUID.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

/**
 * Returns the stable session id for this browser, creating and
 * persisting one on first use. If localStorage is unavailable, falls
 * back to a per-load id rather than throwing — the test still works,
 * it just won't sync history across refreshes.
 */
export function getSessionId() {
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}
