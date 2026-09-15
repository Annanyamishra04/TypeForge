import { LogIn } from "lucide-react";
import Button from "../ui/Button";
import { ROUTES } from "../../config/constants";

/**
 * `currentUser` is exactly what GET /api/leaderboard returned for this
 * caller under the active filters (or null). `isAuthenticated` decides
 * which "no rank yet" message applies — never inferred, never guessed.
 */
export default function CurrentUserRankCard({ currentUser, isAuthenticated, metric }) {
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-wide text-text-tertiary">Your rank</span>
          <span className="text-sm text-text-secondary">Sign in to see your personal rank.</span>
        </div>
        <Button to={ROUTES.login} variant="secondary" size="md" icon={LogIn} iconPosition="leading">
          Sign in
        </Button>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-wide text-text-tertiary">Your rank</span>
          <span className="text-sm text-text-secondary">Complete a test to appear on the leaderboard.</span>
        </div>
        <Button to={ROUTES.test} variant="secondary" size="md">
          Take a test
        </Button>
      </div>
    );
  }

  const primary = metric === "accuracy" ? `${currentUser.accuracy}%` : currentUser.wpm;
  const primaryLabel = metric === "accuracy" ? "Accuracy" : "WPM";
  const secondary = metric === "accuracy" ? currentUser.wpm : `${currentUser.accuracy}%`;
  const secondaryLabel = metric === "accuracy" ? "WPM" : "Accuracy";

  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-accent/30 bg-accent/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-wide text-text-tertiary">Your rank</span>
        <span className="text-3xl font-bold tabular-nums text-text-primary">#{currentUser.rank}</span>
      </div>
      <div className="flex gap-6">
        <div className="flex flex-col">
          <span className="text-lg font-semibold tabular-nums text-text-primary">{primary}</span>
          <span className="text-[10px] uppercase tracking-wide text-text-tertiary">{primaryLabel}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold tabular-nums text-text-primary">{secondary}</span>
          <span className="text-[10px] uppercase tracking-wide text-text-tertiary">{secondaryLabel}</span>
        </div>
      </div>
    </div>
  );
}
