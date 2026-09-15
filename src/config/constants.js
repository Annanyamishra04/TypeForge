export const ROUTES = {
  home: "/",
  test: "/test",
  stats: "/stats",
  leaderboard: "/leaderboard",
  profile: "/profile",
  settings: "/settings",
  coach: "/coach",
  login: "/login",
  register: "/register",
  certificate: "/certificate/:certificateId",
};

/** Builds a real, navigable certificate URL for a given public certificate id. */
export function certificatePath(certificateId) {
  return `/certificate/${certificateId}`;
}

export const NAV_LINKS = [
  { label: "Test", to: ROUTES.test },
  { label: "Analytics", to: ROUTES.stats },
  { label: "Rank", to: ROUTES.leaderboard },
  { label: "Coach", to: ROUTES.coach },
];

export const PRODUCT_NAME = "TYPEFORGE";

export const FEATURE_HIGHLIGHTS = [
  {
    title: "Precision timing",
    description:
      "Every keystroke is measured as it happens, so your WPM and accuracy reflect exactly what you typed.",
  },
  {
    title: "Built for practice",
    description:
      "Words, quotes, and custom text modes, with durations that fit a quick warm-up or a full session.",
  },
  {
    title: "Progress you can see",
    description:
      "A history of every test, kept in one place, so improvement is something you can point to.",
  },
];
