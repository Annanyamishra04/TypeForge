import { useEffect, useCallback, useState } from "react";
import { LogOut, Loader2, CloudOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import MetricRail from "../components/ui/MetricRail";
import StreakCard from "../components/achievements/StreakCard";
import AchievementsGrid from "../components/achievements/AchievementsGrid";
import AchievementsSkeleton from "../components/achievements/AchievementsSkeleton";
import AchievementsEmptyState from "../components/achievements/AchievementsEmptyState";
import AchievementsErrorState from "../components/achievements/AchievementsErrorState";
import CertificateHistoryList from "../components/certificates/CertificateHistoryList";
import { useAuth } from "../context/AuthContext";
import { getMyStats, getMyAchievements, getMyCertificates, ApiError } from "../services/api";
import { ROUTES } from "../config/constants";

function formatJoinDate(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [achievementsData, setAchievementsData] = useState(null);
  const [achievementsError, setAchievementsError] = useState(null);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  const [certificates, setCertificates] = useState(null);
  const [certificatesError, setCertificatesError] = useState(null);
  const [certificatesLoading, setCertificatesLoading] = useState(true);

  const loadCertificates = useCallback(async () => {
    setCertificatesLoading(true);
    setCertificatesError(null);
    try {
      const data = await getMyCertificates();
      setCertificates(data.certificates);
    } catch (err) {
      setCertificatesError(
        err instanceof ApiError ? err.message : "Could not load your certificates right now."
      );
    } finally {
      setCertificatesLoading(false);
    }
  }, []);

  const loadAchievements = useCallback(async () => {
    setAchievementsLoading(true);
    setAchievementsError(null);
    try {
      const data = await getMyAchievements();
      setAchievementsData(data);
    } catch (err) {
      setAchievementsError(
        err instanceof ApiError ? err.message : "Could not load your achievements right now."
      );
    } finally {
      setAchievementsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const data = await getMyStats();
        if (!cancelled) setStats(data.stats);
      } catch (err) {
        if (!cancelled) {
          setStatsError(
            err instanceof ApiError ? err.message : "Could not load your stats right now."
          );
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  function handleLogout() {
    logout();
    navigate(ROUTES.home);
  }

  if (!currentUser) return null; // ProtectedRoute guarantees this shouldn't render, but stay honest.

  const joinDate = formatJoinDate(currentUser.createdAt);

  return (
    <PageContainer className="flex flex-col gap-10 py-14 sm:py-16">
      <div className="flex flex-col gap-6 border-b border-border pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
            Profile / Performance identity
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            {currentUser.name}
          </h1>
          <span className="text-sm text-text-secondary">{currentUser.email}</span>
          {joinDate && <span className="font-mono text-xs text-text-tertiary">Member since {joinDate}</span>}
        </div>

        <Button variant="secondary" size="md" icon={LogOut} iconPosition="leading" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {statsLoading && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Loader2 size={14} className="animate-spin" /> Loading your stats…
          </div>
        )}

        {!statsLoading && statsError && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <CloudOff size={14} /> {statsError}
          </div>
        )}

        {!statsLoading && !statsError && stats && (
          <MetricRail
            metrics={[
              { label: "Tests completed", value: stats.totalTests },
              { label: "Best WPM", value: stats.bestWpm },
              { label: "Average WPM", value: stats.averageWpm },
              { label: "Best accuracy", value: stats.bestAccuracy, suffix: "%" },
            ]}
          />
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-baseline gap-3 border-b border-border pb-3">
          <span className="font-mono text-xs text-text-tertiary">01</span>
          <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
            Milestones
          </h2>
        </div>

        {achievementsLoading && <AchievementsSkeleton />}

        {!achievementsLoading && achievementsError && (
          <AchievementsErrorState message={achievementsError} onRetry={loadAchievements} />
        )}

        {!achievementsLoading && !achievementsError && achievementsData && (
          <>
            <StreakCard summary={achievementsData.summary} />

            {achievementsData.summary.totalActiveDays === 0 && <AchievementsEmptyState />}

            <AchievementsGrid achievements={achievementsData.achievements} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-baseline gap-3 border-b border-border pb-3">
          <span className="font-mono text-xs text-text-tertiary">02</span>
          <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
            Certificates
          </h2>
        </div>

        {certificatesLoading && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Loader2 size={14} className="animate-spin" /> Loading your certificates…
          </div>
        )}

        {!certificatesLoading && certificatesError && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <CloudOff size={14} /> {certificatesError}
          </div>
        )}

        {!certificatesLoading && !certificatesError && certificates && certificates.length === 0 && (
          <p className="text-sm leading-relaxed text-text-secondary">
            No certificates yet. Finish a test and generate one from the result screen.
          </p>
        )}

        {!certificatesLoading && !certificatesError && certificates && certificates.length > 0 && (
          <CertificateHistoryList certificates={certificates} />
        )}
      </div>
    </PageContainer>
  );
}
