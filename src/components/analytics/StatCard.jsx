/**
 * A single KPI card in the analytics summary row. Purely
 * presentational — every value it renders comes from the analytics
 * API response, never computed or guessed here.
 */
export default function StatCard({ icon: Icon, label, value, suffix = "", hint }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface/40 px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-text-tertiary">{label}</span>
        {Icon && <Icon size={15} strokeWidth={1.75} className="text-text-tertiary" />}
      </div>
      <span className="text-2xl font-semibold tabular-nums text-text-primary sm:text-3xl">
        {value}
        {suffix && <span className="ml-0.5 text-lg text-text-secondary sm:text-xl">{suffix}</span>}
      </span>
      {hint && <span className="text-xs text-text-tertiary">{hint}</span>}
    </div>
  );
}
