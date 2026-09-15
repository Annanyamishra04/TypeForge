import DurationSelector from "./DurationSelector";
import ModeSelector from "./ModeSelector";
import ToggleChip from "./ToggleChip";
import CustomTextInput from "./CustomTextInput";
import { MODES } from "../../config/typingModes";

/**
 * Polished test-setup area shown on /test. Only shows controls that
 * are relevant to the current mode (Punctuation/Numbers for Words,
 * the textarea for Custom) so it never feels cluttered. All controls
 * are disabled together while a test is running.
 */
export default function TestConfigPanel({
  duration,
  onDurationChange,
  mode,
  onModeChange,
  punctuation,
  onTogglePunctuation,
  numbers,
  onToggleNumbers,
  customText,
  onCustomTextChange,
  customTextError,
  disabled,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <DurationSelector duration={duration} onChange={onDurationChange} disabled={disabled} />
        <ModeSelector mode={mode} onChange={onModeChange} disabled={disabled} />

        {mode === MODES.WORDS && (
          <div className="flex items-center gap-2">
            <ToggleChip
              label="Punctuation"
              active={punctuation}
              onClick={() => onTogglePunctuation(!punctuation)}
              disabled={disabled}
            />
            <ToggleChip
              label="Numbers"
              active={numbers}
              onClick={() => onToggleNumbers(!numbers)}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {mode === MODES.CUSTOM && (
        <CustomTextInput
          value={customText}
          onChange={onCustomTextChange}
          disabled={disabled}
          error={customTextError}
        />
      )}

      {disabled && (
        <p className="font-mono text-xs text-text-tertiary">
          Finish or restart the test to change configuration.
        </p>
      )}
    </div>
  );
}
