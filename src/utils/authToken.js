const TOKEN_KEY = "typeforge_auth_token";

/**
 * Thin wrapper around localStorage for the JWT only. Never stores
 * anything else (no password, no user object) here — see README for
 * the tradeoffs of localStorage vs. an HttpOnly cookie for this
 * portfolio project.
 */
export function getAuthToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — auth
    // state simply won't survive a refresh in that case.
  }
}

export function clearAuthToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clean up if storage isn't available anyway.
  }
}
