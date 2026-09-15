import { useState } from "react";
import AchievementCard from "./AchievementCard";
import AchievementDetailModal from "./AchievementDetailModal";

/**
 * Renders every achievement definition returned by the backend —
 * unlocked ones first (visually prominent), then locked ones (subdued,
 * with real progress) so the user can always see what to work toward.
 * Locked achievements are never hidden.
 */
export default function AchievementsGrid({ achievements }) {
  const [selected, setSelected] = useState(null);

  const sorted = [...achievements].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return b.progress - a.progress;
  });

  return (
    <>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
        {sorted.map((achievement, index) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            index={index}
            onSelect={setSelected}
          />
        ))}
      </div>
      <AchievementDetailModal achievement={selected} onClose={() => setSelected(null)} />
    </>
  );
}
