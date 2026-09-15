import { useEffect } from "react";
import { X, Check, Lock } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import AchievementIcon from "./AchievementIcon";
import { CATEGORY_LABELS } from "../../config/achievementIcons";

/**
 * Small, focused popover for a single achievement's detail. Renders
 * nothing when `achievement` is null — keeps the calling page's JSX
 * simple (`<AchievementDetailModal achievement={selected} onClose={...} />`).
 */
export default function AchievementDetailModal({ achievement, onClose }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!achievement) return undefined;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={achievement.name}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-5 rounded-lg border border-border-strong bg-bg-elevated p-6"
          >
            <ModalContent achievement={achievement} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModalContent({ achievement, onClose }) {
  const categoryLabel = CATEGORY_LABELS[achievement.category] || achievement.category;
  const percent = Math.round(Math.min(Math.max(achievement.progress, 0), 1) * 100);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border
            ${
              achievement.unlocked
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border-strong bg-surface text-text-tertiary"
            }`}
        >
          <AchievementIcon name={achievement.icon} size={22} strokeWidth={1.75} />
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-lg font-semibold text-text-primary">{achievement.name}</span>
        <span className="text-sm leading-relaxed text-text-secondary">{achievement.description}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border-strong bg-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-text-tertiary">
          {categoryLabel}
        </span>
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
            achievement.unlocked ? "bg-accent/10 text-accent" : "bg-surface text-text-tertiary"
          }`}
        >
          {achievement.unlocked ? <Check size={11} strokeWidth={2.5} /> : <Lock size={11} strokeWidth={2} />}
          {achievement.unlocked ? "Unlocked" : "Locked"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
          <div
            className={`h-full rounded-full ${achievement.unlocked ? "bg-accent" : "bg-border-strong"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="font-mono text-xs text-text-tertiary">{achievement.progressLabel}</span>
      </div>
    </>
  );
}
