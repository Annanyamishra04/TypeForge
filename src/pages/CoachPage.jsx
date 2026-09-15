import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import { getCoachReport, ApiError } from "../services/api";
import { ROUTES } from "../config/constants";

const TREND_META = {
  improving: { label: "Improving", Icon: TrendingUp, className: "text-success" },
  declining: { label: "Cooling off", Icon: TrendingDown, className: "text-danger" },
  steady: { label: "Steady", Icon: Minus, className: "text-text-secondary" },
};

function CoachSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-4 w-40 rounded bg-surface" />
      <div className="h-10 w-full max-w-2xl rounded bg-surface sm:h-12" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-border bg-surface/40" />
        ))}
      </div>
      <div className="h-40 rounded-lg border border-border bg-surface/40" />
    </div>
  );
}

function NotEnoughData({ totalTests, testsRequired }) {
  const remaining = Math.max(testsRequired - totalTests, 0);
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-16 text-center sm:py-20">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-secondary">
        <Sparkles size={20} strokeWidth={1.75} />
      </span>
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="text-lg font-semibold text-text-primary">Not enough data yet</h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {remaining > 0
            ? `Complete ${remaining} more ${remaining === 1 ? "test" : "tests"} and your coach will have enough to work with.`
            : "Complete a few tests and your coach will have enough to work with."}
        </p>
      </div>
      <Button to={ROUTES.test} variant="secondary" size="md">
        Start a test
      </Button>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-16 text-center sm:py-20">
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="text-lg font-semibold text-text-primary">Coach unavailable</h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {message || "Something went wrong reaching the server."}
        </p>
      </div>
      <Button variant="secondary" size="md" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface/40 px-5 py-4">
      <span className="text-2xl font-semibold tabular-nums text-text-primary sm:text-3xl">{value}</span>
      <span className="font-mono text-[11px] uppercase tracking-wide text-text-tertiary">{label}</span>
    </div>
  );
}

function ListPanel({ coordinate, title, items }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface/40 p-6">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-text-tertiary">{coordinate}</span>
        <h3 className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">{title}</h3>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-text-primary">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CoachPage() {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  const load = useCallback(async () => {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await getCoachReport();
      setState({ status: "loaded", data, error: null });
    } catch (err) {
      setState({
        status: "error",
        data: null,
        error: err instanceof ApiError ? err.message : "Could not reach the server.",
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fadeIn = {
    initial: reduceMotion ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: "easeOut" },
  };

  return (
    <PageContainer className="flex flex-col gap-10 py-14 sm:py-16">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">04 / Coach</span>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">AI Coach</h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-text-secondary">
          Your typing data, translated into your next move.
        </p>
      </div>

      {state.status === "loading" && <CoachSkeleton />}

      {state.status === "error" && <ErrorState message={state.error} onRetry={load} />}

      {state.status === "loaded" && !state.data.ready && (
        <NotEnoughData totalTests={state.data.totalTests} testsRequired={state.data.testsRequired} />
      )}

      {state.status === "loaded" && state.data.ready && (
        <CoachReport insights={state.data.insights} summary={state.data.summary} fadeIn={fadeIn} />
      )}
    </PageContainer>
  );
}

function CoachReport({ insights, summary, fadeIn }) {
  const trend = TREND_META[insights.trend] || TREND_META.steady;
  const TrendIcon = trend.Icon;

  return (
    <div className="flex flex-col gap-10">
      <motion.div {...fadeIn} className="flex flex-col gap-4">
        <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">Coach assessment</span>
        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl">
          "{insights.headline}"
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border-strong bg-bg-elevated px-3 py-1 font-mono text-xs uppercase tracking-wide text-text-secondary">
            Level: {insights.level}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-bg-elevated px-3 py-1 font-mono text-xs uppercase tracking-wide ${trend.className}`}
          >
            <TrendIcon size={12} strokeWidth={2} /> {trend.label}
          </span>
          {insights.source === "deterministic" && (
            <span className="rounded-full border border-border-strong bg-bg-elevated px-3 py-1 font-mono text-xs uppercase tracking-wide text-text-tertiary">
              Performance Coach
            </span>
          )}
        </div>
      </motion.div>

      {summary && (
        <motion.div {...fadeIn} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Best WPM" value={summary.bestWpm} />
          <Metric label="Recent avg WPM" value={summary.recentAverageWpm} />
          <Metric label="Recent accuracy" value={`${summary.recentAverageAccuracy}%`} />
          <Metric label="Tests logged" value={summary.totalTests} />
        </motion.div>
      )}

      <motion.div {...fadeIn} className="grid gap-6 sm:grid-cols-2">
        <ListPanel coordinate="01" title="What you do well" items={insights.strengths} />
        <ListPanel coordinate="02" title="Where to focus" items={insights.focusAreas} />
      </motion.div>

      <motion.div {...fadeIn} className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface/40 p-6">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-text-tertiary">03</span>
            <h3 className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Next target</h3>
          </div>
          <div className="flex items-center gap-3">
            <Target size={18} strokeWidth={1.75} className="text-accent" />
            <span className="text-2xl font-semibold tabular-nums text-text-primary">
              {insights.nextTarget.wpm} WPM
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="text-2xl font-semibold tabular-nums text-text-primary">
              {insights.nextTarget.accuracy}%
            </span>
          </div>
        </div>

        <ListPanel coordinate="04" title="Practice plan" items={insights.practicePlan} />
      </motion.div>

      <motion.div {...fadeIn} className="flex flex-wrap items-center gap-3">
        <Button to={ROUTES.test} variant="primary" size="md">
          Try again
        </Button>
        <Button to={ROUTES.stats} variant="secondary" size="md">
          View full analytics
        </Button>
      </motion.div>
    </div>
  );
}
