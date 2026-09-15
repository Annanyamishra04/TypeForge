import { ACHIEVEMENT_ICONS } from "../../config/achievementIcons";
import { Award } from "lucide-react";

/**
 * Renders the Lucide icon named by `name` (falling back to Award for
 * an unrecognized name). Kept as its own component — rather than a
 * `const Icon = lookup(name)` variable elsewhere — so dynamic icon
 * selection happens in exactly one place via a normal prop-driven
 * render, the same pattern React uses for any "choose one of several
 * fixed components based on a prop" case.
 */
export default function AchievementIcon({ name, size = 18, strokeWidth = 1.75, className }) {
  const IconComponent = ACHIEVEMENT_ICONS[name] || Award;
  return <IconComponent size={size} strokeWidth={strokeWidth} className={className} />;
}
