import { useCallback, useEffect, useRef, useState } from "react";
import PageContainer from "../components/layout/PageContainer";
import LeaderboardFilterBar from "../components/leaderboard/LeaderboardFilterBar";
import Podium from "../components/leaderboard/Podium";
import LeaderboardTable from "../components/leaderboard/LeaderboardTable";
import CurrentUserRankCard from "../components/leaderboard/CurrentUserRankCard";
import PaginationControls from "../components/leaderboard/PaginationControls";
import LeaderboardSkeleton from "../components/leaderboard/LeaderboardSkeleton";
import LeaderboardEmptyState from "../components/leaderboard/LeaderboardEmptyState";
import LeaderboardErrorState from "../components/leaderboard/LeaderboardErrorState";
import { useAuth } from "../context/AuthContext";
import { getLeaderboard, ApiError } from "../services/api";

const DEFAULT_FILTERS = { metric: "wpm", mode: "all", duration: "all", period: "all" };

/**
 * Public page — works fully logged out (per Phase 7 spec). The
 * authenticated user's own id (from AuthContext, itself sourced from
 * the verified JWT) is only ever used client-side to visually
 * highlight their row; ranking and privacy are already enforced
 * server-side by GET /api/leaderboard.
 */
export default function LeaderboardPage() {
  const { currentUser, isAuthenticated } = useAuth();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guards against a slow, now-stale request overwriting a newer one
  // (e.g. rapid filter clicks) — same pattern used elsewhere in this
  // codebase rather than introducing a new cancellation mechanism.
  const requestId = useRef(0);

  const load = useCallback(async (activeFilters, activePage) => {
    const thisRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getLeaderboard({ ...activeFilters, page: activePage, limit: 20 });
      if (requestId.current !== thisRequest) return;
      setData(result.leaderboard);
    } catch (err) {
      if (requestId.current !== thisRequest) return;
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      if (requestId.current === thisRequest) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters, page);
  }, [filters, page, load]);

  const handleFilterChange = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const hasEntries = data && data.entries.length > 0;
  const hasPodium = hasEntries && data.entries.length >= 3 && page === 1;
  const scopedToFilters =
    filters.mode !== "all" || filters.duration !== "all" || filters.period !== "all";

  return (
    <PageContainer className="flex flex-col gap-8 py-14 sm:py-16">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">TYPEFORGE / Rank</span>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Leaderboard</h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-text-secondary">
          Compete globally. Improve consistently. Rankings are calculated from real, completed typing tests only.
        </p>
      </div>

      <LeaderboardFilterBar filters={filters} onChange={handleFilterChange} disabled={loading} />

      <CurrentUserRankCard
        currentUser={data?.currentUser ?? null}
        isAuthenticated={isAuthenticated}
        metric={filters.metric}
      />

      {loading && <LeaderboardSkeleton />}

      {!loading && error && <LeaderboardErrorState message={error} onRetry={() => load(filters, page)} />}

      {!loading && !error && data && !hasEntries && (
        <LeaderboardEmptyState scopedToFilters={scopedToFilters} />
      )}

      {!loading && !error && data && hasEntries && (
        <>
          {hasPodium && <Podium entries={data.entries} metric={filters.metric} />}

          <LeaderboardTable
            entries={data.entries}
            metric={filters.metric}
            ownUserId={currentUser?.id}
          />

          <PaginationControls
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onChange={setPage}
            disabled={loading}
          />
        </>
      )}
    </PageContainer>
  );
}
