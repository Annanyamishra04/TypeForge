function Bone({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-surface-hover ${className}`} />;
}

export default function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading the leaderboard">
      <div className="flex items-end gap-3 sm:gap-4">
        <Bone className="h-32 flex-1 sm:h-36" />
        <Bone className="h-40 flex-1 sm:h-48" />
        <Bone className="h-28 flex-1 sm:h-32" />
      </div>
      <Bone className="h-14" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-12" />
        ))}
      </div>
    </div>
  );
}
