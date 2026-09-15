/**
 * A horizontal strip of large typographic metrics separated by rule
 * lines — the "instrument panel" pattern used across TYPEFORGE
 * (Stats, Profile) instead of boxed KPI cards. Purely presentational;
 * every value passed in must already be real data from the caller.
 */
export default function MetricRail({ metrics, className = "" }) {
  return (
    <div
      className={`flex flex-wrap divide-x divide-border overflow-hidden rounded-lg border border-border bg-surface/30 ${className}`}
    >
      {metrics.map((m) => (
        <div key={m.label} className="flex min-w-[7rem] flex-1 flex-col gap-1 px-5 py-4 sm:px-6 sm:py-5">
          <span className="font-mono text-2xl font-semibold tabular-nums text-text-primary sm:text-3xl">
            {m.value}
            {m.suffix && <span className="ml-0.5 text-base text-text-secondary sm:text-lg">{m.suffix}</span>}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-tertiary sm:text-[11px]">
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}
