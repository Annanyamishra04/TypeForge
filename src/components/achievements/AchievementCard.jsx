import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import AchievementIcon from "./AchievementIcon";
import { CATEGORY_LABELS } from "../../config/achievementIcons";

/**
 * A single milestone row, unlocked or locked. Every value shown
 * (progress, progressLabel, unlocked) comes directly from the
 * backend's GET /api/achievements/me response — this component never
 * computes or fabricates status itself.
 */
export default function AchievementCard({ achievement, index = 0, onSelect }) {
  const reduceMotion = useReducedMotion();
  const categoryLabel = CATEGORY_LABELS[achievement.category] || achievement.category;
  const percent = Math.round(Math.min(Math.max(achievement.progress, 0), 1) * 100);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect?.(achievement)}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: reduceMotion ? 0 : Math.min(index * 0.02, 0.3), ease: "easeOut" }}
      className={`group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors duration-150 sm:px-5 ${
        achievement.unlocked ? "bg-accent/[0.04] hover:bg-accent/[0.07]" : "hover:bg-surface-hover"
      } ${achievement.unlocked ? "opacity-100" : "opacity-70"}`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
          achievement.unlocked
            ? "border-accent/40 bg-accent/10 text-accent"
            : "border-border-strong bg-bg-elevated text-text-tertiary"
        }`}
      >
        <AchievementIcon name={achievement.icon} size={17} strokeWidth={1.75} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className={`truncate text-sm font-semibold sm:text-[15px] ${
              achievement.unlocked ? "text-text-primary" : "text-text-secondary"
            }`}
          >
            {achievement.name}
          </span>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-text-tertiary">
            {categoryLabel}
          </span>
        </div>
        <span className="truncate text-xs leading-relaxed text-text-tertiary">{achievement.description}</span>
        <div className="flex items-center gap-2 pt-0.5">
          <div className="h-1 w-full max-w-[10rem] overflow-hidden rounded-full bg-bg-elevated">
            <motion.div
              className={`h-full rounded-full ${achievement.unlocked ? "bg-accent" : "bg-border-strong"}`}
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.1, ease: "easeOut" }}
            />
          </div>
          <span className="font-mono text-[10px] text-text-tertiary">{achievement.progressLabel}</span>
        </div>
      </div>

      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          achievement.unlocked ? "bg-accent text-accent-contrast" : "border border-border-strong text-transparent"
        }`}
      >
        <Check size={13} strokeWidth={2.5} />
      </span>
    </motion.button>
  );
}
