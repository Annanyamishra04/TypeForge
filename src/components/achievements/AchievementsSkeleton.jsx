function Bone({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-surface-hover ${className}`} />;
}

/**
 * Pure loading placeholder — no fake streak numbers, no fake unlocked
 * achievements. Mirrors the real layout so there's no jump when the
 * actual data arrives.
 */
export default function AchievementsSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading your achievements and streak">
      <Bone className="h-28 sm:h-24" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}
