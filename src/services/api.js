import { getAuthToken } from "../utils/authToken";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/** Thrown for both network-level and non-2xx HTTP failures so callers can branch on `.status`. */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 for network-level failures (no response at all)
    this.data = data;
  }
}

async function request(path, options = {}) {
  // Only ever attaches a token that actually exists — never sends an
  // empty/undefined "Bearer " header, which some backends mishandle.
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    // fetch() itself threw: DNS failure, connection refused, offline, etc.
    throw new ApiError("Could not reach the server.", 0, null);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Empty or non-JSON body — leave data as null rather than throwing here;
    // the status-code check below still produces a sensible error.
  }

  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed with status ${response.status}.`, response.status, data);
  }

  return data;
}

export function getApiHealth() {
  return request("/health");
}

export function saveTypingResult(payload) {
  return request("/results", { method: "POST", body: JSON.stringify(payload) });
}

export function getTypingHistory(sessionId) {
  return request(`/results/${encodeURIComponent(sessionId)}`);
}

export function getSessionStats(sessionId) {
  return request(`/results/${encodeURIComponent(sessionId)}/stats`);
}

// --- Auth ------------------------------------------------------------

export function registerUser({ name, email, password }) {
  return request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
}

export function loginUser({ email, password }) {
  return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function getCurrentUser() {
  return request("/auth/me");
}

/** Moves a browser's anonymous results (if any) onto the now-authenticated account. */
export function claimAnonymousSession(sessionId) {
  return request("/auth/claim-session", { method: "POST", body: JSON.stringify({ sessionId }) });
}

// --- Authenticated results --------------------------------------------

export function getMyHistory() {
  return request("/results/me");
}

export function getMyStats() {
  return request("/results/me/stats");
}

/**
 * period: "all" | "7d" | "30d" | "90d". Defaults to "all" when omitted.
 * Attaches the JWT, and — like every call through `request()` — throws
 * an ApiError with `.status` set for 401s, network failures, and any
 * other non-2xx response, so StatsPage can branch on it.
 */
export function getMyAnalytics(period = "all") {
  return request(`/results/me/analytics?period=${encodeURIComponent(period)}`);
}

// --- Achievements & streaks ---------------------------------------------

/** Protected: returns the caller's own real, backend-verified achievements + streak summary. */
export function getMyAchievements() {
  return request("/achievements/me");
}

// --- AI Coach -------------------------------------------------------------

/**
 * Protected: returns the caller's own coaching report, derived entirely
 * from their own results. Never sends any personal data anywhere — see
 * server/services/coachService.js for the privacy boundary.
 */
export function getCoachReport() {
  return request("/coach/me");
}

// --- Leaderboard --------------------------------------------------------

/**
 * filters: { mode, duration, period, metric, page, limit }. Every key
 * is optional — omitted ones fall back to the backend's own defaults.
 * Public endpoint: works with or without a stored token, and `request()`
 * attaches the JWT automatically when one exists so the response also
 * includes the caller's own rank.
 */
export function getLeaderboard(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return request(`/leaderboard${query ? `?${query}` : ""}`);
}

// --- Certificates ---------------------------------------------------------

/**
 * Protected: requests a performance certificate for a completed,
 * already-saved test result. `resultId` is the only value sent — the
 * backend derives ownership from the JWT and pulls every performance
 * number back off the stored result itself, never trusting anything
 * else the client might supply.
 */
export function generateCertificate(resultId) {
  return request("/certificates", { method: "POST", body: JSON.stringify({ resultId }) });
}

/** Public: no authentication required. Used by the certificate verification page. */
export function getCertificate(certificateId) {
  return request(`/certificates/${encodeURIComponent(certificateId)}`);
}

/** Protected: returns only certificates owned by the authenticated user. */
export function getMyCertificates() {
  return request("/certificates/me");
}
