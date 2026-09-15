import { Trophy } from "lucide-react";
import Button from "../ui/Button";
import { ROUTES } from "../../config/constants";

export default function LeaderboardEmptyState({ scopedToFilters = false }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-16 text-center sm:py-20">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-secondary">
        <Trophy size={20} strokeWidth={1.75} />
      </span>
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="text-lg font-semibold text-text-primary">No rankings yet.</h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {scopedToFilters
            ? "No qualifying results match these filters yet. Try a broader filter, or be the first."
            : "Complete a typing test to be the first on the board."}
        </p>
      </div>
      <Button to={ROUTES.test} variant="primary" size="md">
        Take a Test
      </Button>
    </div>
  );
}
