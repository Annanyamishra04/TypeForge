import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { registerUser, loginUser, getCurrentUser, claimAnonymousSession } from "../services/api";
import { getAuthToken, setAuthToken, clearAuthToken } from "../utils/authToken";
import { getSessionId } from "../utils/session";

const AuthContext = createContext(null);

/**
 * Single source of truth for "who is logged in", mirroring the shape
 * of ThemeContext elsewhere in this codebase. Handles:
 *  - restoring auth state from a stored JWT on load,
 *  - login/register (including the safe anonymous-session claim),
 *  - logout,
 *  - clearing state gracefully if the stored token turns out to be
 *    invalid or expired.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Best-effort, silent: a failed/duplicate claim should never block
  // login or surface as an error to the user — their account, name,
  // and password are the important part, not whether a handful of
  // anonymous test results got attached.
  const attemptClaim = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      await claimAnonymousSession(sessionId);
    } catch {
      // Ignore — nothing to claim, or the network hiccuped. Either
      // way this is not something the user needs to see or retry.
    }
  }, []);

  // On first load, if a token is already stored, verify it against
  // the backend rather than trusting it blindly — an expired or
  // tampered token should not leave the app thinking someone is
  // logged in.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();
        if (!cancelled) setCurrentUser(data.user);
      } catch {
        // Invalid/expired token — clear it rather than leaving stale
        // auth state around.
        clearAuthToken();
        if (!cancelled) setCurrentUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await loginUser({ email, password });
      setAuthToken(data.token);
      setCurrentUser(data.user);
      await attemptClaim();
      return data.user;
    },
    [attemptClaim]
  );

  const register = useCallback(
    async (name, email, password) => {
      const data = await registerUser({ name, email, password });
      setAuthToken(data.token);
      setCurrentUser(data.user);
      await attemptClaim();
      return data.user;
    },
    [attemptClaim]
  );

  const logout = useCallback(() => {
    clearAuthToken();
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({ currentUser, loading, isAuthenticated: Boolean(currentUser), login, register, logout }),
    [currentUser, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
