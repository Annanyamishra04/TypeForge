import { Flame } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

function formatLastActive(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

/**
 * Every number here comes straight from GET /api/achievements/me —
 * nothing is computed or guessed client-side.
 */
export default function StreakCard({ summary }) {
  const reduceMotion = useReducedMotion();
  const { currentStreak, longestStreak, totalActiveDays, lastActiveDate } = summary;
  const lastActive = formatLastActive(lastActiveDate);
  const hasActivity = totalActiveDays > 0;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-5 rounded-lg border border-border bg-surface/40 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${
            currentStreak > 0
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border-strong bg-bg-elevated text-text-tertiary"
          }`}
        >
          <Flame size={26} strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-1">
          {hasActivity ? (
            <>
              <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">Current run</span>
              <span className="font-mono text-3xl font-semibold tabular-nums leading-none text-text-primary sm:text-4xl">
                {String(currentStreak).padStart(2, "0")}
                <span className="ml-2 text-sm font-normal normal-case text-text-secondary">
                  {currentStreak === 1 ? "day" : "days"}
                </span>
              </span>
              <span className="text-sm text-text-secondary">
                Best run: {longestStreak} {longestStreak === 1 ? "day" : "days"} · {totalActiveDays} active{" "}
                {totalActiveDays === 1 ? "day" : "days"}
                {lastActive && ` · Last active ${lastActive}`}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold text-text-primary">No streak yet</span>
              <span className="text-sm text-text-secondary">
                Start your first test to begin your streak.
              </span>
            </>
          )}
        </div>
      </div>

      {hasActivity && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StreakStat label="Current" value={currentStreak} />
          <StreakStat label="Best" value={longestStreak} />
          <StreakStat label="Active days" value={totalActiveDays} />
        </div>
      )}
    </motion.div>
  );
}

function StreakStat({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-bg-elevated px-4 py-3 sm:items-start">
      <span className="text-lg font-semibold tabular-nums text-text-primary">{value}</span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-tertiary">{label}</span>
    </div>
  );
}
