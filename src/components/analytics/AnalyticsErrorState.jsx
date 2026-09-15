import { CloudOff } from "lucide-react";
import Button from "../ui/Button";

export default function AnalyticsErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-16 text-center sm:py-20">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-elevated text-danger">
        <CloudOff size={20} strokeWidth={1.75} />
      </span>
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="text-lg font-semibold text-text-primary">Unable to load your statistics right now.</h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {message || "Something went wrong reaching the server. Your saved results are safe — this is just a connection issue."}
        </p>
      </div>
      <Button variant="secondary" size="md" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
