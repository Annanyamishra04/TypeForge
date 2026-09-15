import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { THEMES, applyTheme, getStoredTheme, storeTheme } from "../config/themes";

const ThemeContext = createContext(null);

/**
 * Single source of truth for the active theme, shared across the
 * whole app (Navbar, Settings page, anywhere else) via context so
 * switching the theme in one place is reflected everywhere at once —
 * both the visual tokens (already global via CSS variables) and any
 * "currently selected" UI state.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!THEMES[next]) return;
    setThemeState(next);
    storeTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
