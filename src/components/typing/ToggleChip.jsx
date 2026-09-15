/**
 * On/off toggle used for the Punctuation and Numbers options.
 * State is communicated by border, filled dot, and label together —
 * never by color alone — and exposed to assistive tech via
 * role="switch"/aria-checked.
 */
export default function ToggleChip({ label, active, onClick, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-accent/60 bg-accent/10 text-text-primary"
          : "border-border bg-surface text-text-tertiary hover:text-text-secondary"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${active ? "bg-accent" : "bg-border-strong"}`}
      />
      {label}
    </button>
  );
}
