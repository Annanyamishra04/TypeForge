/**
 * Resolves the icon name string returned by the backend's achievement
 * definitions (server/config/achievements.js) to an actual Lucide
 * React component. Kept as a lookup table (rather than dynamic
 * `lucide-react[name]` indexing) so the icon set stays explicit,
 * tree-shakeable, and impossible to silently break with a typo on
 * either side.
 */
import {
  Flag,
  ListChecks,
  BadgeCheck,
  Cpu,
  Gauge,
  Zap,
  Flame,
  Rocket,
  Sparkles,
  Target,
  Crosshair,
  Award,
  Gem,
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  Trophy,
  Compass,
  Clock,
} from "lucide-react";

export const ACHIEVEMENT_ICONS = {
  Flag,
  ListChecks,
  BadgeCheck,
  Cpu,
  Gauge,
  Zap,
  Flame,
  Rocket,
  Sparkles,
  Target,
  Crosshair,
  Award,
  Gem,
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  Trophy,
  Compass,
  Clock,
};

/** Falls back to Award for any unrecognized icon name, so a new backend
 * achievement never renders a blank icon before the frontend map is updated. */
export function getAchievementIcon(name) {
  return ACHIEVEMENT_ICONS[name] || Award;
}

/** Category display labels, shared by the grid and the detail modal. */
export const CATEGORY_LABELS = {
  testing: "Testing",
  speed: "Speed",
  accuracy: "Accuracy",
  consistency: "Consistency",
  variety: "Variety",
};
