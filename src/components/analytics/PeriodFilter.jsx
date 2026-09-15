const PERIODS = [
  { value: "all", label: "All Time" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

export default function PeriodFilter({ value, onChange, disabled = false }) {
  return (
    <div
      role="radiogroup"
      aria-label="Analytics time period"
      className="flex flex-wrap gap-1 rounded-md border border-border bg-surface/40 p-1"
    >
      {PERIODS.map((p) => {
        const active = p.value === value;
        return (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(p.value)}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-out disabled:opacity-50
              ${
                active
                  ? "bg-accent text-accent-contrast"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
