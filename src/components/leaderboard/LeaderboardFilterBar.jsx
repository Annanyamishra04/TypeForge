const METRICS = [
  { value: "wpm", label: "Best WPM" },
  { value: "accuracy", label: "Best Accuracy" },
];

const MODES = [
  { value: "all", label: "All" },
  { value: "words", label: "Words" },
  { value: "quotes", label: "Quotes" },
  { value: "custom", label: "Custom" },
];

const DURATIONS = [
  { value: "all", label: "All" },
  { value: "15", label: "15s" },
  { value: "30", label: "30s" },
  { value: "60", label: "60s" },
  { value: "120", label: "120s" },
];

const PERIODS = [
  { value: "all", label: "All Time" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
];

function FilterGroup({ label, options, value, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-tertiary">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-md border border-border bg-surface/40 p-1">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ease-out disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                ${
                  active
                    ? "bg-accent text-accent-contrast"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LeaderboardFilterBar({ filters, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface/30 p-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-6">
      <FilterGroup
        label="Metric"
        options={METRICS}
        value={filters.metric}
        onChange={(v) => onChange({ metric: v })}
        disabled={disabled}
      />
      <FilterGroup
        label="Mode"
        options={MODES}
        value={filters.mode}
        onChange={(v) => onChange({ mode: v })}
        disabled={disabled}
      />
      <FilterGroup
        label="Duration"
        options={DURATIONS}
        value={String(filters.duration)}
        onChange={(v) => onChange({ duration: v })}
        disabled={disabled}
      />
      <FilterGroup
        label="Period"
        options={PERIODS}
        value={filters.period}
        onChange={(v) => onChange({ period: v })}
        disabled={disabled}
      />
    </div>
  );
}
