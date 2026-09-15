import { X } from "lucide-react";

const MAX_LENGTH = 2000;

/**
 * Setup-time textarea for Custom mode. This is deliberately separate
 * from the typing engine's own input (TypingArea) — this is where the
 * user drafts/pastes the text; the engine only ever receives the
 * validated, trimmed result once the test target is built.
 */
export default function CustomTextInput({ value, onChange, disabled, error }) {
  const count = value.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="custom-text" className="text-sm font-medium text-text-primary">
          Custom text
        </label>
        <span className="font-mono text-xs text-text-tertiary">
          {count}/{MAX_LENGTH}
        </span>
      </div>

      <textarea
        id="custom-text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        disabled={disabled}
        placeholder="Paste or type the text you want to practice with…"
        rows={4}
        aria-describedby={error ? "custom-text-error" : "custom-text-hint"}
        aria-invalid={Boolean(error)}
        className="w-full resize-y rounded-md border border-border bg-surface p-3 font-mono text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus-visible:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="flex items-center justify-between gap-3">
        {error ? (
          <p id="custom-text-error" role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : (
          <span id="custom-text-hint" className="text-xs text-text-tertiary">
            This becomes the exact text you'll type — nothing is added or removed.
          </span>
        )}

        {value.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
