const SAMPLE =
  "precision is not an accident, it is a habit built one keystroke at a time";
const TYPED_LENGTH = 34;

/**
 * Purely visual preview of the typing test experience for the landing
 * page hero. This does not track input, timing, or accuracy — it is
 * a static illustration of what the real test (built in a later
 * phase) will look like.
 */
export default function TypingPreview() {
  const typed = SAMPLE.slice(0, TYPED_LENGTH);
  const current = SAMPLE[TYPED_LENGTH];
  const remaining = SAMPLE.slice(TYPED_LENGTH + 1);

  return (
    <div className="rounded-lg border border-border bg-surface p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
        </div>
        <span className="font-mono text-xs text-text-tertiary">test preview</span>
      </div>

      <p className="mt-6 font-mono text-lg leading-relaxed sm:text-xl">
        <span className="text-text-primary">{typed}</span>
        <span className="relative bg-accent/25 text-text-primary">
          {current}
          <span className="absolute -left-px top-0 h-full w-[2px] animate-blink bg-accent" />
        </span>
        <span className="text-text-tertiary">{remaining}</span>
      </p>

      <div className="mt-8 flex items-center gap-8 border-t border-border pt-5 font-mono text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold text-text-primary">—</span>
          <span className="text-xs uppercase tracking-wide text-text-tertiary">wpm</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold text-text-primary">—</span>
          <span className="text-xs uppercase tracking-wide text-text-tertiary">accuracy</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold text-text-primary">30s</span>
          <span className="text-xs uppercase tracking-wide text-text-tertiary">duration</span>
        </div>
      </div>
    </div>
  );
}
