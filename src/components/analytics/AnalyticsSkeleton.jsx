function Bone({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-surface-hover ${className}`} />;
}

/**
 * Pure loading placeholder — no numbers, no charts with fake data.
 * Mirrors the real dashboard's layout so there's no visual jump when
 * the actual analytics arrive.
 */
export default function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading your statistics">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bone className="h-64" />
        <Bone className="h-64" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Bone className="h-28" />
        <Bone className="h-28" />
        <Bone className="h-28" />
      </div>
      <Bone className="h-48" />
    </div>
  );
}
