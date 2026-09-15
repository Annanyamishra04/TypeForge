/**
 * Honest placeholder for functionality that does not exist yet.
 * Used by /stats, /leaderboard, /profile, /settings so the app never
 * implies there is real data behind these pages before it exists.
 */
export default function EmptyState({ icon: Icon, title, description, phase, action }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-16 text-center sm:py-20">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-secondary">
          <Icon size={20} strokeWidth={1.75} />
        </span>
      )}
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
      </div>
      {phase && (
        <span className="rounded-full border border-border-strong bg-bg-elevated px-3 py-1 font-mono text-xs text-text-tertiary">
          {phase}
        </span>
      )}
      {action}
    </div>
  );
}
