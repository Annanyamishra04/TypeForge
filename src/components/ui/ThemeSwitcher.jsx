import { Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * `variant="compact"` renders a small row of theme dots for tight
 * spaces (the navbar). `variant="full"` (default) renders a grid of
 * labeled cards, used on the Settings page.
 */
export default function ThemeSwitcher({ variant = "full" }) {
  const { theme, setTheme, themes } = useTheme();

  if (variant === "compact") {
    return (
      <div role="group" aria-label="Theme" className="flex items-center gap-1.5">
        {Object.entries(themes).map(([key, def]) => {
          const isActive = theme === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              aria-pressed={isActive}
              aria-label={`${def.label} theme${isActive ? " (active)" : ""}`}
              title={def.label}
              className={`relative flex h-6 w-6 items-center justify-center rounded-full border-2 transition-transform ${
                isActive ? "border-text-primary scale-110" : "border-border-strong hover:border-border-strong/80"
              }`}
              style={{ backgroundColor: `rgb(${def.tokens["--tf-accent"]})` }}
            >
              {isActive && (
                <Check
                  aria-hidden="true"
                  size={11}
                  strokeWidth={3}
                  style={{ color: `rgb(${def.tokens["--tf-accent-contrast"]})` }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="group" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
      {Object.entries(themes).map(([key, def]) => {
        const isActive = theme === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            aria-pressed={isActive}
            className={`flex flex-col gap-3 rounded-md border p-4 text-left transition-colors ${
              isActive ? "border-accent/60 bg-surface" : "border-border bg-surface/50 hover:bg-surface"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: `rgb(${def.tokens["--tf-accent"]})` }}
                />
                {def.label}
              </span>
              {isActive && (
                <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                  <Check size={12} strokeWidth={2.5} /> Active
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-text-tertiary">{def.description}</p>
          </button>
        );
      })}
    </div>
  );
}
