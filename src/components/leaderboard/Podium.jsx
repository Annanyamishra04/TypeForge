import { motion, useReducedMotion } from "framer-motion";

const MODE_LABELS = { words: "Words", quotes: "Quotes", custom: "Custom" };

// Visual order on the stand: 2nd — 1st — 3rd, with 1st raised highest.
const STAND_ORDER = [1, 0, 2];
const STAND_HEIGHT = { 0: "h-44 sm:h-52", 1: "h-36 sm:h-40", 2: "h-32 sm:h-36" };

function PodiumCard({ entry, place, metric, reduceMotion }) {
  const primary = metric === "accuracy" ? entry.accuracy : entry.wpm;
  const primaryLabel = metric === "accuracy" ? "accuracy" : "wpm";
  const secondary = metric === "accuracy" ? entry.wpm : entry.accuracy;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduceMotion ? 0 : place * 0.08, ease: "easeOut" }}
      className={`flex flex-1 flex-col items-center justify-end gap-2 rounded-lg border px-3 pb-5 pt-5 text-center
        ${place === 0 ? "border-accent/40 bg-accent/[0.06]" : "border-border bg-surface/40"}
        ${STAND_HEIGHT[place]}`}
    >
      <span
        className={`font-mono text-3xl font-semibold tabular-nums sm:text-4xl ${
          place === 0 ? "text-accent" : "text-text-secondary"
        }`}
      >
        {String(entry.rank).padStart(2, "0")}
      </span>
      <span className="max-w-full truncate text-sm font-semibold text-text-primary sm:text-base">{entry.name}</span>
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold tabular-nums text-text-primary sm:text-2xl">
          {primary}
          {metric === "accuracy" ? "%" : ""}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-tertiary">{primaryLabel}</span>
      </div>
      <span className="font-mono text-[11px] text-text-secondary">
        {secondary}
        {metric === "accuracy" ? " wpm" : "% acc"}
      </span>
      <span className="rounded-full border border-border-strong bg-bg-elevated px-2 py-0.5 font-mono text-[10px] text-text-tertiary">
        {MODE_LABELS[entry.mode] || entry.mode} · {entry.duration}s
      </span>
    </motion.div>
  );
}

/** Expects the leaderboard entries in rank order — only the first 3 are used. */
export default function Podium({ entries, metric }) {
  const reduceMotion = useReducedMotion();
  const top3 = entries.slice(0, 3);

  return (
    <div className="flex items-end gap-3 sm:gap-4">
      {STAND_ORDER.map((place) => {
        const entry = top3[place];
        if (!entry) return <div key={place} className="flex-1" />;
        return <PodiumCard key={entry.userId} entry={entry} place={place} metric={metric} reduceMotion={reduceMotion} />;
      })}
    </div>
  );
}
