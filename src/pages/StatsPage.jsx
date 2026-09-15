import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import MetricRail from "../components/ui/MetricRail";
import WpmChart from "../components/analytics/WpmChart";
import AccuracyChart from "../components/analytics/AccuracyChart";
import ModeBreakdown from "../components/analytics/ModeBreakdown";
import DurationBreakdown from "../components/analytics/DurationBreakdown";
import RecentTests from "../components/analytics/RecentTests";
import AnalyticsSkeleton from "../components/analytics/AnalyticsSkeleton";
import AnalyticsEmptyState from "../components/analytics/AnalyticsEmptyState";
import AnalyticsErrorState from "../components/analytics/AnalyticsErrorState";
import PeriodFilter from "../components/analytics/PeriodFilter";
import { getMyAnalytics, ApiError } from "../services/api";

// Auth is enforced one level up: App.jsx wraps this route in
// <ProtectedRoute>, which redirects logged-out users to /login
// (preserving /stats as the post-login destination) before this
// component ever mounts. That means every render of StatsPage itself
// can assume an authenticated user.
export default function StatsPage() {
  const [period, setPeriod] = useState("all");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (selectedPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyAnalytics(selectedPeriod);
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  const hasAnyData = analytics && analytics.summary.totalTests > 0;

  return (
    <PageContainer className="flex flex-col gap-12 py-14 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">03 / Analytics</span>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Performance Lab</h1>
          <p className="max-w-lg text-[15px] leading-relaxed text-text-secondary">
            Your typing history, measured — built entirely from your saved test results.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodFilter value={period} onChange={setPeriod} disabled={loading} />
          <Button
            variant="ghost"
            size="md"
            icon={RefreshCw}
            onClick={() => load(period)}
            disabled={loading}
            aria-label="Refresh statistics"
            className={loading ? "opacity-60" : ""}
          >
            <span className="sr-only sm:not-sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      {loading && <AnalyticsSkeleton />}

      {!loading && error && <AnalyticsErrorState message={error} onRetry={() => load(period)} />}

      {!loading && !error && analytics && !hasAnyData && (
        <AnalyticsEmptyState scopedToPeriod={period !== "all"} />
      )}

      {!loading && !error && analytics && hasAnyData && (
        <>
          <section className="flex flex-col gap-4">
            <SectionLabel coordinate="01" title="Current form" />
            <MetricRail
              metrics={[
                { label: "Best WPM", value: analytics.summary.bestWpm },
                { label: "Average WPM", value: analytics.summary.averageWpm },
                { label: "Best accuracy", value: analytics.summary.bestAccuracy, suffix: "%" },
                { label: "Average accuracy", value: analytics.summary.averageAccuracy, suffix: "%" },
                { label: "Tests", value: analytics.summary.totalTests },
                { label: "Errors", value: analytics.summary.totalErrors },
              ]}
            />
          </section>

          <section className="flex flex-col gap-4">
            <SectionLabel coordinate="02" title="Speed trajectory" />
            <WpmChart trend={analytics.trend} />
          </section>

          <section className="grid gap-10 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-3">
              <SectionLabel coordinate="03" title="Precision" />
              <AccuracyChart trend={analytics.trend} />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-2">
              <SectionLabel coordinate="04" title="Mode signature" />
              <ModeBreakdown breakdown={analytics.modeBreakdown} />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionLabel coordinate="05" title="Time profile" />
            <DurationBreakdown breakdown={analytics.durationBreakdown} />
          </section>

          <section className="flex flex-col gap-4">
            <SectionLabel coordinate="06" title="Recent tests" />
            <RecentTests tests={analytics.recentTests} />
          </section>
        </>
      )}
    </PageContainer>
  );
}

function SectionLabel({ coordinate, title }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-border pb-3">
      <span className="font-mono text-xs text-text-tertiary">{coordinate}</span>
      <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">{title}</h2>
    </div>
  );
}
