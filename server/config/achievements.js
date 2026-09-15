/**
 * Centralized, deterministic achievement definitions.
 * ------------------------------------------------------------------
 * This is the single source of truth for what achievements exist in
 * TYPEFORGE. Nothing here is user-specific — a definition only says
 * *what* it takes to unlock something and *how* to measure progress
 * toward it. Per-user status (unlocked/progress) is always computed
 * fresh from real data in `services/achievementsService.js`.
 *
 * `type` tells the achievement service which field on the computed
 * "context" object (see achievementsService.js) to compare against
 * `target`:
 *
 *   - "count"     -> context.totalTests
 *   - "wpm"       -> context.bestWpm
 *   - "accuracy"  -> context.bestAccuracy
 *   - "perfect"   -> context.hasPerfectAccuracyRun (binary)
 *   - "modes"     -> context.modesCompleted (unique modes practiced)
 *   - "durations" -> context.durationsCompleted (unique durations practiced)
 *   - "streak"    -> context.historicalMaxStreak (NOT current streak —
 *                     see README "Streak System" for why streak
 *                     achievements must not un-unlock when a streak
 *                     breaks)
 *
 * `icon` is a Lucide React icon name (PascalCase, e.g. "Zap"). The
 * frontend resolves it via `src/config/achievementIcons.js` — this
 * keeps the definitions themselves framework-agnostic and safe to
 * reuse from either side if needed.
 */

export const ACHIEVEMENT_CATEGORIES = {
  TESTING: "testing",
  SPEED: "speed",
  ACCURACY: "accuracy",
  CONSISTENCY: "consistency",
  VARIETY: "variety",
};

export const ACHIEVEMENTS = [
  // --- Testing / consistency of showing up -----------------------------
  {
    id: "first-strike",
    name: "First Strike",
    description: "Complete your first typing test.",
    icon: "Flag",
    category: ACHIEVEMENT_CATEGORIES.TESTING,
    type: "count",
    target: 1,
    rarity: "common",
  },
  {
    id: "getting-started",
    name: "Getting Started",
    description: "Complete 10 typing tests.",
    icon: "ListChecks",
    category: ACHIEVEMENT_CATEGORIES.TESTING,
    type: "count",
    target: 10,
    rarity: "common",
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Complete 50 typing tests.",
    icon: "BadgeCheck",
    category: ACHIEVEMENT_CATEGORIES.TESTING,
    type: "count",
    target: 50,
    rarity: "rare",
  },
  {
    id: "typing-machine",
    name: "Typing Machine",
    description: "Complete 100 typing tests.",
    icon: "Cpu",
    category: ACHIEVEMENT_CATEGORIES.TESTING,
    type: "count",
    target: 100,
    rarity: "epic",
  },

  // --- Speed -------------------------------------------------------------
  {
    id: "speed-rookie",
    name: "Speed Rookie",
    description: "Reach 40 WPM in a test.",
    icon: "Gauge",
    category: ACHIEVEMENT_CATEGORIES.SPEED,
    type: "wpm",
    target: 40,
    rarity: "common",
  },
  {
    id: "speed-runner",
    name: "Speed Runner",
    description: "Reach 60 WPM in a test.",
    icon: "Zap",
    category: ACHIEVEMENT_CATEGORIES.SPEED,
    type: "wpm",
    target: 60,
    rarity: "common",
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Reach 80 WPM in a test.",
    icon: "Flame",
    category: ACHIEVEMENT_CATEGORIES.SPEED,
    type: "wpm",
    target: 80,
    rarity: "rare",
  },
  {
    id: "speed-master",
    name: "Speed Master",
    description: "Reach 100 WPM in a test.",
    icon: "Rocket",
    category: ACHIEVEMENT_CATEGORIES.SPEED,
    type: "wpm",
    target: 100,
    rarity: "epic",
  },
  {
    id: "lightning",
    name: "Lightning",
    description: "Reach 120 WPM in a test.",
    icon: "Sparkles",
    category: ACHIEVEMENT_CATEGORIES.SPEED,
    type: "wpm",
    target: 120,
    rarity: "legendary",
  },

  // --- Accuracy ------------------------------------------------------------
  {
    id: "sharp-fingers",
    name: "Sharp Fingers",
    description: "Reach 95% accuracy in a test.",
    icon: "Target",
    category: ACHIEVEMENT_CATEGORIES.ACCURACY,
    type: "accuracy",
    target: 95,
    rarity: "common",
  },
  {
    id: "precision",
    name: "Precision",
    description: "Reach 98% accuracy in a test.",
    icon: "Crosshair",
    category: ACHIEVEMENT_CATEGORIES.ACCURACY,
    type: "accuracy",
    target: 98,
    rarity: "rare",
  },
  {
    id: "near-perfect",
    name: "Near Perfect",
    description: "Reach 99% accuracy in a test.",
    icon: "Award",
    category: ACHIEVEMENT_CATEGORIES.ACCURACY,
    type: "accuracy",
    target: 99,
    rarity: "epic",
  },
  {
    id: "perfect-run",
    name: "Perfect Run",
    description: "Complete a test with 100% accuracy.",
    icon: "Gem",
    category: ACHIEVEMENT_CATEGORIES.ACCURACY,
    type: "perfect",
    target: 100,
    rarity: "legendary",
  },

  // --- Consistency (streaks) ------------------------------------------
  {
    id: "three-day-flow",
    name: "Three Day Flow",
    description: "Reach a 3-day streak.",
    icon: "CalendarDays",
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    type: "streak",
    target: 3,
    rarity: "common",
  },
  {
    id: "one-week-strong",
    name: "One Week Strong",
    description: "Reach a 7-day streak.",
    icon: "CalendarCheck",
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    type: "streak",
    target: 7,
    rarity: "rare",
  },
  {
    id: "two-week-flow",
    name: "Two Week Flow",
    description: "Reach a 14-day streak.",
    icon: "CalendarClock",
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    type: "streak",
    target: 14,
    rarity: "epic",
  },
  {
    id: "monthly-discipline",
    name: "Monthly Discipline",
    description: "Reach a 30-day streak.",
    icon: "Trophy",
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    type: "streak",
    target: 30,
    rarity: "legendary",
  },

  // --- Variety -------------------------------------------------------------
  {
    id: "mode-explorer",
    name: "Mode Explorer",
    description: "Complete a test in all 3 modes: Words, Quotes, and Custom.",
    icon: "Compass",
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    type: "modes",
    target: 3,
    rarity: "rare",
  },
  {
    id: "time-traveler",
    name: "Time Traveler",
    description: "Complete a test at all 4 durations: 15s, 30s, 60s, and 120s.",
    icon: "Clock",
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    type: "durations",
    target: 4,
    rarity: "rare",
  },
];

/** All modes a "Mode Explorer" run must cover. Mirrors src/config/typingModes.js MODES. */
export const REQUIRED_MODES = ["words", "quotes", "custom"];

/** All durations (seconds) a "Time Traveler" run must cover. Mirrors src/config/typingModes.js DURATIONS. */
export const REQUIRED_DURATIONS = [15, 30, 60, 120];
