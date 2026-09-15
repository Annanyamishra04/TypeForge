import { useEffect, useState } from "react";
import { ArrowRight, Gauge, Layers, LineChart } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import TypingPreview from "../components/ui/TypingPreview";
import { FEATURE_HIGHLIGHTS, ROUTES } from "../config/constants";
import { useAuth } from "../context/AuthContext";
import { getMyStats } from "../services/api";

const ICONS = [Gauge, Layers, LineChart];

/**
 * Lives in the hero's technical status bar, not a separate card.
 * Shows a live "system ready" indicator by default, and switches to
 * the user's real best WPM/accuracy once GET /api/results/me/stats
 * confirms they have at least one saved result — never guessed or
 * hardcoded.
 */
function StatusReadout() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getMyStats()
      .then((data) => {
        if (!cancelled) setStats(data.stats);
      })
      .catch(() => {
        // Silent here — this is a nice-to-have status readout, not
        // something worth surfacing an error banner for.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated || !stats || stats.totalTests === 0) {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-tertiary sm:text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
        System ready
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-text-tertiary sm:gap-4 sm:text-xs">
      <span className="hidden items-center gap-1.5 sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        Best
      </span>
      <span className="normal-case text-text-primary">
        <span className="font-semibold tabular-nums">{stats.bestWpm}</span> wpm
      </span>
      <span className="normal-case text-text-primary">
        <span className="font-semibold tabular-nums">{stats.bestAccuracy}</span>% acc
      </span>
    </span>
  );
}

export default function Home() {
  return (
    <>
      <section className="border-b border-border">
        <PageContainer>
          <div className="flex items-center justify-between border-b border-border py-4 font-mono text-[11px] uppercase tracking-widest text-text-tertiary sm:text-xs">
            <span>01 / Home</span>
            <StatusReadout />
          </div>

          <div className="grid gap-12 py-14 lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-20">
            <div className="flex flex-col gap-6 lg:col-span-7">
              <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-[3.25rem]">
                Build real typing speed, not a lucky screenshot.
              </h1>
              <p className="max-w-md text-[15px] leading-relaxed text-text-secondary">
                TYPEFORGE times every keystroke as you type, so your words per
                minute and accuracy come from what actually happened during
                the test — not an estimate.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button to={ROUTES.test} size="lg" icon={ArrowRight}>
                  Start typing
                </Button>
                <Button to={ROUTES.stats} variant="secondary" size="lg">
                  View analytics
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <TypingPreview />
            </div>
          </div>
        </PageContainer>
      </section>

      <section>
        <PageContainer>
          <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {FEATURE_HIGHLIGHTS.map((feature, i) => {
              const Icon = ICONS[i];
              return (
                <div
                  key={feature.title}
                  className="flex flex-col gap-3 py-8 sm:px-8 sm:py-12 sm:first:pl-0 sm:last:pr-0"
                >
                  <Icon size={18} strokeWidth={1.75} className="text-accent" />
                  <h3 className="text-[15px] font-semibold text-text-primary">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </PageContainer>
      </section>
    </>
  );
}
