const MODE_LABELS = { words: "Words", quotes: "Quotes", custom: "Custom" };

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/**
 * `tests` is the analytics API's `recentTests` array — the user's own
 * most recent saved results, newest first, already capped server-side.
 */
export default function RecentTests({ tests }) {
  if (!tests || tests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface/30 px-5 py-8 text-center text-sm text-text-tertiary">
        No completed tests for this period yet.
      </div>
    );
  }

  return (
    <>
      {/* Desktop/tablet: table. Hidden on narrow screens to avoid horizontal scroll. */}
      <div className="hidden overflow-hidden rounded-lg border border-border sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/60 text-left">
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Date</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Mode</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Duration</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">WPM</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Accuracy</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Errors</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-b-0 odd:bg-surface/20">
                <td className="px-4 py-2.5 text-text-secondary">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-2.5 text-text-primary">{MODE_LABELS[t.mode] || t.mode}</td>
                <td className="px-4 py-2.5 tabular-nums text-text-secondary">{t.durationSeconds}s</td>
                <td className="px-4 py-2.5 tabular-nums font-semibold text-text-primary">{t.wpm}</td>
                <td className="px-4 py-2.5 tabular-nums text-text-primary">{t.accuracy}%</td>
                <td className="px-4 py-2.5 tabular-nums text-text-secondary">{t.errors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards, no horizontal scroll. */}
      <div className="flex flex-col gap-2 sm:hidden">
        {tests.map((t) => (
          <div key={t.id} className="rounded-lg border border-border bg-surface/40 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">{MODE_LABELS[t.mode] || t.mode}</span>
              <span className="font-mono text-xs text-text-tertiary">{formatDate(t.createdAt)}</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col">
                <span className="text-base font-semibold tabular-nums text-text-primary">{t.wpm}</span>
                <span className="text-[10px] uppercase tracking-wide text-text-tertiary">WPM</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold tabular-nums text-text-primary">{t.accuracy}%</span>
                <span className="text-[10px] uppercase tracking-wide text-text-tertiary">Acc.</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold tabular-nums text-text-primary">{t.errors}</span>
                <span className="text-[10px] uppercase tracking-wide text-text-tertiary">Errors</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold tabular-nums text-text-primary">{t.durationSeconds}s</span>
                <span className="text-[10px] uppercase tracking-wide text-text-tertiary">Duration</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
