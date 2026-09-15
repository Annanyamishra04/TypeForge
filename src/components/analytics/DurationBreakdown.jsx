/**
 * `breakdown` is the analytics API's `durationBreakdown` array —
 * already restricted to durations the user has actually tested at.
 */
export default function DurationBreakdown({ breakdown }) {
  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface/30 px-5 py-8 text-center text-sm text-text-tertiary">
        No duration data for this period yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/60 text-left">
            <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Duration</th>
            <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Tests</th>
            <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Avg WPM</th>
            <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Best WPM</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((d) => (
            <tr key={d.durationSeconds} className="border-b border-border last:border-b-0 odd:bg-surface/20">
              <td className="px-4 py-2.5 text-text-primary">{d.durationSeconds}s</td>
              <td className="px-4 py-2.5 tabular-nums text-text-secondary">{d.tests}</td>
              <td className="px-4 py-2.5 tabular-nums text-text-primary">{d.averageWpm}</td>
              <td className="px-4 py-2.5 tabular-nums text-text-primary">{d.bestWpm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
