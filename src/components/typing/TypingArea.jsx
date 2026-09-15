import { useEffect, useRef, useState } from "react";

/**
 * Renders the target text with per-character correctness state and a
 * blinking caret at the current typing position, backed by a hidden
 * text input so it captures real keyboard (and mobile) input.
 *
 * Words are wrapped in `inline-block` spans so a word never breaks
 * across a line, while the space between words remains a normal
 * inline character and stays a valid line-wrap point.
 */
export default function TypingArea({ target, typed, status, onChange, inputRef }) {
  const containerRef = useRef(null);
  const caretRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Keep the active typing position visible as the user progresses,
  // without scrolling the surrounding page.
  useEffect(() => {
    caretRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
  }, [typed]);

  const focusInput = () => inputRef.current?.focus();

  const words = target.split(" ");
  let globalIndex = 0;

  const renderChar = (ch, idx) => {
    const isTyped = idx < typed.length;
    const isCorrect = isTyped && typed[idx] === ch;
    const isIncorrect = isTyped && typed[idx] !== ch;
    const isCurrent = idx === typed.length && status !== "finished";

    let stateClasses = "text-text-tertiary";
    if (isCorrect) stateClasses = "text-text-primary";
    if (isIncorrect) stateClasses = "text-danger underline decoration-danger/70 decoration-2 underline-offset-[3px]";

    return (
      <span
        key={idx}
        ref={isCurrent ? caretRef : null}
        className={`relative ${stateClasses} ${isCurrent ? "bg-accent/20" : ""}`}
      >
        {ch}
        {isCurrent && (
          <span className="pointer-events-none absolute -left-px top-0 h-full w-[2px] animate-blink bg-accent" />
        )}
      </span>
    );
  };

  const content = words.map((word, wIdx) => {
    const wordStartIndex = globalIndex;
    const wordSpans = word.split("").map((ch, i) => renderChar(ch, wordStartIndex + i));
    globalIndex += word.length;

    const isLastWord = wIdx === words.length - 1;
    const spaceIndex = globalIndex;
    if (!isLastWord) globalIndex += 1;

    return (
      <span key={wIdx}>
        <span className="inline-block">{wordSpans}</span>
        {!isLastWord && renderChar(" ", spaceIndex)}
      </span>
    );
  });

  return (
    <div
      ref={containerRef}
      onClick={focusInput}
      className="group relative cursor-text rounded-lg border border-border bg-surface p-6 transition-colors focus-within:border-border-strong sm:p-8"
    >
      {/* Measurement rail: a purely decorative technical motif — a thin
          tick strip along the top edge, echoing the "performance rails"
          concept from the design brief without competing with the text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 flex h-px justify-between opacity-40 sm:inset-x-8"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="h-1.5 w-px bg-border-strong" />
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={status === "finished"}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Typing test input — type the text shown to begin"
        className="sr-only"
      />

      <div
        aria-hidden={false}
        className="max-h-[9.5rem] overflow-y-auto font-mono text-lg leading-relaxed tracking-wide sm:text-xl"
      >
        {content}
      </div>

      {!isFocused && status !== "finished" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-bg/70 backdrop-blur-[1px]">
          <span className="rounded-full border border-border-strong bg-bg-elevated px-4 py-1.5 font-mono text-xs text-text-secondary">
            Click here and start typing
          </span>
        </div>
      )}
    </div>
  );
}
