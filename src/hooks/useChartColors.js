import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

/**
 * Recharts (and most chart libs) need concrete color strings, not
 * Tailwind classes, and can't read `rgb(var(--tf-accent) / 1)` the way
 * our CSS can. This hook re-derives plain `rgb(r g b)` strings from
 * the *same* token source (`THEMES`) that drives the rest of the UI,
 * so charts automatically stay correct across Midnight/Emerald/Paper
 * without hardcoding any theme-specific values here.
 */
export function useChartColors() {
  const { theme, themes } = useTheme();

  return useMemo(() => {
    const tokens = themes[theme]?.tokens ?? {};
    const rgb = (key) => `rgb(${tokens[key]})`;

    return {
      accent: rgb("--tf-accent"),
      accentStrong: rgb("--tf-accent-strong"),
      success: rgb("--tf-success"),
      danger: rgb("--tf-danger"),
      textPrimary: rgb("--tf-text-primary"),
      textSecondary: rgb("--tf-text-secondary"),
      textTertiary: rgb("--tf-text-tertiary"),
      border: rgb("--tf-border"),
      surface: rgb("--tf-surface"),
      bgElevated: rgb("--tf-bg-elevated"),
    };
  }, [theme, themes]);
}
