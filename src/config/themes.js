/**
 * TYPEFORGE theme/token architecture
 * ------------------------------------------------------------------
 * This file is the single source of truth for the design tokens that
 * back every theme. Each theme is a flat map of CSS custom-property
 * names to values. RootLayout (or any future ThemeProvider) writes
 * these onto `document.documentElement` as `--tf-*` variables, and
 * every Tailwind color in `tailwind.config.js` reads from them.
 *
 * All three themes are wired up and live: ThemeProvider persists the
 * active choice and writes its tokens onto <html> as CSS variables,
 * and ThemeSwitcher (Navbar + Settings) lets the user switch between
 * them at any time. No component needs to know which theme is active
 * — they all read the same `--tf-*` custom properties via Tailwind.
 */

export const THEMES = {
  midnight: {
    label: "Midnight",
    description: "Deep black and charcoal with a restrained ember accent.",
    tokens: {
      "--tf-bg": "8 8 9", // #0A0A0B
      "--tf-bg-elevated": "13 13 15", // #0D0D0F
      "--tf-surface": "19 19 22", // #131316
      "--tf-surface-hover": "24 24 28", // #18181C
      "--tf-border": "38 38 42", // #26262A
      "--tf-border-strong": "54 54 60", // #36363C

      "--tf-text-primary": "237 237 239", // #EDEDEF
      "--tf-text-secondary": "154 154 162", // #9A9AA2
      "--tf-text-tertiary": "104 104 112", // #686870

      "--tf-accent": "232 138 61", // #E88A3D ember
      "--tf-accent-strong": "245 158 82", // #F59E52
      "--tf-accent-soft": "232 138 61", // used at low opacity
      "--tf-accent-contrast": "10 8 6", // text on accent

      "--tf-success": "94 189 137",
      "--tf-danger": "223 100 100",
    },
  },

  emerald: {
    label: "Emerald",
    description: "Dark surface with a focused emerald accent.",
    tokens: {
      "--tf-bg": "7 10 9",
      "--tf-bg-elevated": "11 15 14",
      "--tf-surface": "16 21 20",
      "--tf-surface-hover": "21 27 26",
      "--tf-border": "32 40 38",
      "--tf-border-strong": "46 58 55",

      "--tf-text-primary": "232 240 236",
      "--tf-text-secondary": "148 166 159",
      "--tf-text-tertiary": "98 114 108",

      "--tf-accent": "62 184 130",
      "--tf-accent-strong": "84 204 150",
      "--tf-accent-soft": "62 184 130",
      "--tf-accent-contrast": "6 12 9",

      "--tf-success": "94 189 137",
      "--tf-danger": "223 100 100",
    },
  },

  paper: {
    label: "Paper",
    description: "Elegant off-white surface with subtle dark text.",
    tokens: {
      "--tf-bg": "247 245 241",
      "--tf-bg-elevated": "252 251 249",
      "--tf-surface": "255 255 255",
      "--tf-surface-hover": "240 238 233",
      "--tf-border": "225 221 213",
      "--tf-border-strong": "205 200 189",

      "--tf-text-primary": "30 28 25",
      "--tf-text-secondary": "94 88 80",
      "--tf-text-tertiary": "140 133 122",

      "--tf-accent": "196 108 46",
      "--tf-accent-strong": "168 89 36",
      "--tf-accent-soft": "196 108 46",
      "--tf-accent-contrast": "255 250 245",

      "--tf-success": "58 133 96",
      "--tf-danger": "178 62 62",
    },
  },
};

export const DEFAULT_THEME = "midnight";

export const THEME_STORAGE_KEY = "typeforge-theme";

/** Applies a theme's tokens to a target element (defaults to <html>). */
export function applyTheme(themeName = DEFAULT_THEME, target = document.documentElement) {
  const theme = THEMES[themeName];
  if (!theme) return;
  Object.entries(theme.tokens).forEach(([key, value]) => {
    target.style.setProperty(key, value);
  });
  target.setAttribute("data-theme", themeName);
}

/**
 * Reads the persisted theme choice. Falls back safely to the default
 * theme if localStorage is unavailable (privacy mode, disabled, etc.)
 * or holds a value that isn't one of the known themes.
 */
export function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEMES[stored]) return stored;
  } catch {
    // localStorage may be unavailable — fall back below.
  }
  return DEFAULT_THEME;
}

/** Persists the theme choice. Silently no-ops if storage isn't available. */
export function storeTheme(themeName) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeName);
  } catch {
    // Ignore write failures — the theme still applies for this session.
  }
}
