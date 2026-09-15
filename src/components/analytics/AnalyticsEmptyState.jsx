import { LineChart } from "lucide-react";
import Button from "../ui/Button";
import { ROUTES } from "../../config/constants";

/**
 * Shown when the authenticated user has no completed tests yet (all
 * time), or none within the currently selected period filter.
 */
export default function AnalyticsEmptyState({ scopedToPeriod = false }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-16 text-center sm:py-20">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-secondary">
        <LineChart size={20} strokeWidth={1.75} />
      </span>
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="text-lg font-semibold text-text-primary">
          {scopedToPeriod ? "No tests in this period" : "Your typing journey starts here"}
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {scopedToPeriod
            ? "There's no completed test data for the selected time range. Try a wider period, or start a new test."
            : "Complete your first typing test to unlock performance analytics."}
        </p>
      </div>
      <Button to={ROUTES.test} variant="primary" size="md">
        Start typing
      </Button>
    </div>
  );
}
