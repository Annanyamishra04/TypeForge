import { motion, useReducedMotion } from "framer-motion";

const MODE_LABELS = { words: "Words", quotes: "Quotes", custom: "Custom" };

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

/**
 * `entries` come straight from GET /api/leaderboard — already ranked,
 * deduplicated per user, and paginated server-side. `metric` decides
 * which score column leads. `ownUserId` (the signed-in caller's own
 * id, if any) is compared against each row's `userId` purely to apply
 * a visual highlight — never used for anything else.
 */
export default function LeaderboardTable({ entries, metric, ownUserId }) {
  const reduceMotion = useReducedMotion();

  const primaryLabel = metric === "accuracy" ? "Accuracy" : "WPM";
  const secondaryLabel = metric === "accuracy" ? "WPM" : "Accuracy";
  const primaryValue = (e) => (metric === "accuracy" ? `${e.accuracy}%` : e.wpm);
  const secondaryValue = (e) => (metric === "accuracy" ? e.wpm : `${e.accuracy}%`);

  return (
    <>
      {/* Desktop/tablet table */}
      <div className="hidden overflow-hidden rounded-lg border border-border sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/60 text-left">
              <th className="w-16 px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Rank</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">User</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">{primaryLabel}</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">{secondaryLabel}</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Duration</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Mode</th>
              <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text-tertiary">Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const isSelf = ownUserId && e.userId === ownUserId;
              return (
                <motion.tr
                  key={e.userId}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: reduceMotion ? 0 : Math.min(i, 10) * 0.02 }}
                  className={`border-b border-border last:border-b-0 ${
                    isSelf ? "bg-accent/[0.08]" : i % 2 === 1 ? "bg-surface/20" : ""
                  }`}
                  aria-current={isSelf ? "true" : undefined}
                >
                  <td className="px-4 py-2.5 font-mono tabular-nums text-text-secondary">#{e.rank}</td>
                  <td className="px-4 py-2.5 text-text-primary">
                    {e.name}
                    {isSelf && (
                      <span className="ml-2 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold text-text-primary">{primaryValue(e)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-text-secondary">{secondaryValue(e)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-text-secondary">{e.duration}s</td>
                  <td className="px-4 py-2.5 text-text-secondary">{MODE_LABELS[e.mode] || e.mode}</td>
                  <td className="px-4 py-2.5 text-text-tertiary">{formatDate(e.createdAt)}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards, no horizontal scroll */}
      <div className="flex flex-col gap-2 sm:hidden">
        {entries.map((e, i) => {
          const isSelf = ownUserId && e.userId === ownUserId;
          return (
            <motion.div
              key={e.userId}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: reduceMotion ? 0 : Math.min(i, 10) * 0.02 }}
              className={`rounded-lg border px-4 py-3 ${
                isSelf ? "border-accent/40 bg-accent/[0.08]" : "border-border bg-surface/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-text-tertiary">#{e.rank}</span>
                <span className="text-[10px] text-text-tertiary">{formatDate(e.createdAt)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">{e.name}</span>
                {isSelf && (
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                    You
                  </span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                <div className="flex flex-col">
                  <span className="text-base font-semibold tabular-nums text-text-primary">{primaryValue(e)}</span>
                  <span className="text-[10px] uppercase tracking-wide text-text-tertiary">{primaryLabel}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold tabular-nums text-text-primary">{secondaryValue(e)}</span>
                  <span className="text-[10px] uppercase tracking-wide text-text-tertiary">{secondaryLabel}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold tabular-nums text-text-primary">{e.duration}s</span>
                  <span className="text-[10px] uppercase tracking-wide text-text-tertiary">Duration</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-text-primary">{MODE_LABELS[e.mode] || e.mode}</span>
                  <span className="text-[10px] uppercase tracking-wide text-text-tertiary">Mode</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
