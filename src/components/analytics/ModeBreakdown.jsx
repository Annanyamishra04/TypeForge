const MODE_LABELS = {
  words: "Words",
  quotes: "Quotes",
  custom: "Custom",
};

/**
 * `breakdown` is the analytics API's `modeBreakdown` array — it only
 * ever contains modes the user has actually completed tests in, so
 * there is nothing to filter here: a mode with zero tests simply
 * never appears.
 */
export default function ModeBreakdown({ breakdown }) {
  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface/30 px-5 py-8 text-center text-sm text-text-tertiary">
        No mode data for this period yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {breakdown.map((m) => (
        <div key={m.mode} className="flex flex-col gap-3 rounded-lg border border-border bg-surface/40 px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">{MODE_LABELS[m.mode] || m.mode}</span>
            <span className="font-mono text-xs text-text-tertiary">
              {m.tests} test{m.tests === 1 ? "" : "s"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-semibold tabular-nums text-text-primary">{m.bestWpm}</span>
              <span className="text-[10px] uppercase tracking-wide text-text-tertiary">Best WPM</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-semibold tabular-nums text-text-primary">{m.averageWpm}</span>
              <span className="text-[10px] uppercase tracking-wide text-text-tertiary">Avg WPM</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-semibold tabular-nums text-text-primary">{m.averageAccuracy}%</span>
              <span className="text-[10px] uppercase tracking-wide text-text-tertiary">Avg Acc.</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
