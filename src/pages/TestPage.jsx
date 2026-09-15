import { useRef } from "react";
import PageContainer from "../components/layout/PageContainer";
import SectionHeader from "../components/ui/SectionHeader";
import TypingArea from "../components/typing/TypingArea";
import TestConfigPanel from "../components/typing/TestConfigPanel";
import ResultScreen from "../components/typing/ResultScreen";
import { useTypingTest } from "../hooks/useTypingTest";
import { MODES } from "../config/typingModes";

function formatTime(seconds) {
  return Math.ceil(seconds).toString();
}

function TestStat({ label, value }) {
  return (
    <div className="flex flex-1 flex-col gap-1 px-4 py-3 sm:px-6 sm:py-4">
      <span className="text-xl font-semibold tabular-nums text-text-primary sm:text-2xl">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-text-tertiary sm:text-xs">{label}</span>
    </div>
  );
}

export default function TestPage() {
  const {
    duration,
    setDuration,
    mode,
    setMode,
    punctuation,
    setPunctuation,
    numbers,
    setNumbers,
    customText,
    setCustomText,
    customTextError,
    isConfigLocked,
    targetText,
    typed,
    status,
    timeLeft,
    handleChange,
    restart,
    finalMetrics,
    finishedAt,
    liveMetrics,
    saveStatus,
    saveError,
    savedResultId,
  } = useTypingTest(30);

  const inputRef = useRef(null);
  const configSectionRef = useRef(null);

  const handleChangeDuration = () => {
    restart();
    configSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const isFinished = status === "finished";
  const customEmpty = mode === MODES.CUSTOM && targetText.trim().length === 0;

  return (
    <PageContainer className="flex flex-col gap-10 py-14 sm:py-16">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">02 / Test</span>
        <SectionHeader
          title="Typing test"
          description="Choose your setup below, then click the typing area and start typing to begin. Your WPM and accuracy are calculated from this test only."
        />
      </div>

      <div ref={configSectionRef}>
        <TestConfigPanel
          duration={duration}
          onDurationChange={setDuration}
          mode={mode}
          onModeChange={setMode}
          punctuation={punctuation}
          onTogglePunctuation={setPunctuation}
          numbers={numbers}
          onToggleNumbers={setNumbers}
          customText={customText}
          onCustomTextChange={setCustomText}
          customTextError={customTextError}
          disabled={isConfigLocked}
        />
      </div>

      <div className="flex items-stretch divide-x divide-border rounded-lg border border-border bg-surface/30 font-mono text-sm">
        <TestStat label="time" value={`${formatTime(timeLeft)}s`} />
        <TestStat label="wpm" value={status === "idle" ? "—" : liveMetrics.wpm} />
        <TestStat label="accuracy" value={status === "idle" ? "—" : `${liveMetrics.accuracy}%`} />
        <TestStat label="errors" value={status === "idle" ? "—" : liveMetrics.errors} />
      </div>

      {!isFinished && customEmpty && (
        <div
          role="alert"
          className="rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-10 text-center"
        >
          <p className="text-sm text-text-secondary">
            {customTextError || "Enter your custom text above to begin the test."}
          </p>
        </div>
      )}

      {!isFinished && !customEmpty && (
        <TypingArea
          target={targetText}
          typed={typed}
          status={status}
          onChange={handleChange}
          inputRef={inputRef}
        />
      )}

      {isFinished && (
        <ResultScreen
          metrics={finalMetrics}
          finishedAt={finishedAt}
          onRestart={restart}
          onChangeDuration={handleChangeDuration}
          saveStatus={saveStatus}
          saveError={saveError}
          resultId={savedResultId}
        />
      )}
    </PageContainer>
  );
}
