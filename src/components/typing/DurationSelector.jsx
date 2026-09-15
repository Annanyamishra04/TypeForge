import { DURATIONS } from "../../hooks/useTypingTest";

/**
 * Duration picker for the typing test. Disabled while a test is
 * actively running — the duration can only change before a test
 * starts or after one has finished.
 */
export default function DurationSelector({ duration, onChange, disabled }) {
  return (
    <div
      role="group"
      aria-label="Test duration"
      className="flex items-center gap-1 rounded-md border border-border bg-surface p-1"
    >
      {DURATIONS.map((d) => (
        <button
          key={d}
          type="button"
          disabled={disabled}
          aria-pressed={duration === d}
          onClick={() => onChange(d)}
          className={`rounded px-3 py-1.5 font-mono text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            duration === d
              ? "bg-surface-hover text-text-primary"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {d}s
        </button>
      ))}
    </div>
  );
}
