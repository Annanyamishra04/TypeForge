import { Flame } from "lucide-react";
import Button from "../ui/Button";
import { ROUTES } from "../../config/constants";

/**
 * Shown when the authenticated user has zero completed typing tests.
 * No achievements are shown as unlocked here — locked definitions are
 * rendered elsewhere (with 0 progress) by the caller if desired.
 */
export default function AchievementsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-16 text-center sm:py-20">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-secondary">
        <Flame size={20} strokeWidth={1.75} />
      </span>
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="text-lg font-semibold text-text-primary">Your journey starts here.</h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          Complete your first typing test to unlock achievements and start building your streak.
        </p>
      </div>
      <Button to={ROUTES.test} variant="primary" size="md">
        Take a Test
      </Button>
    </div>
  );
}
