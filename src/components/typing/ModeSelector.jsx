import { MODE_OPTIONS } from "../../config/typingModes";

/**
 * Content-mode picker (Words / Quotes / Custom). Disabled while a
 * test is actively running, matching DurationSelector's behavior.
 */
export default function ModeSelector({ mode, onChange, disabled }) {
  return (
    <div
      role="group"
      aria-label="Typing content mode"
      className="flex items-center gap-1 rounded-md border border-border bg-surface p-1"
    >
      {MODE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          aria-pressed={mode === opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded px-3 py-1.5 font-mono text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            mode === opt.value
              ? "bg-surface-hover text-text-primary"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
