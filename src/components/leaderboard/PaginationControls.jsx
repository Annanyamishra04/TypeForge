import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationControls({ page, totalPages, onChange, disabled }) {
  if (totalPages <= 1) return null;

  const canPrev = page > 1 && !disabled;
  const canNext = page < totalPages && !disabled;

  return (
    <nav aria-label="Leaderboard pagination" className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border-strong text-text-secondary transition-colors duration-150 ease-out hover:enabled:bg-surface-hover hover:enabled:text-text-primary disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="font-mono text-xs text-text-tertiary" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={!canNext}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border-strong text-text-secondary transition-colors duration-150 ease-out hover:enabled:bg-surface-hover hover:enabled:text-text-primary disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
