import { useId } from "react";

/**
 * Labeled text input with an inline error, shared by Login/Register
 * so both forms look and behave identically.
 */
export default function FormField({ label, error, type = "text", rightElement, ...props }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus-visible:border-border-strong disabled:cursor-not-allowed disabled:opacity-60 ${
            rightElement ? "pr-10" : ""
          } ${error ? "border-danger" : "border-border"}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
