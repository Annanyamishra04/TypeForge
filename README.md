# TYPEFORGE

A premium, from-scratch typing-speed test. Real typing engine, multiple
content modes, live-switchable themes, a backend that persists
completed results, and (as of Phase 5) real user accounts with JWT
authentication.

## Tech stack

**Frontend**
- React 19 + Vite
- React Router
- Tailwind CSS (custom token-based theme system — Midnight / Emerald / Paper)
- lucide-react icons
- Recharts (WPM/accuracy trend charts on the Stats dashboard)
- Framer Motion (podium/row entrance animation on the Leaderboard;
  achievement card/streak entrance and progress-bar animation on
  Profile)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- bcryptjs (password hashing) + jsonwebtoken (JWT auth)
- CORS, dotenv

No extra infrastructure — deliberately kept simple and free-tier
deployable (see below).

## Currently implemented features

- Words / Quotes / Custom typing modes
- Punctuation and Numbers options (Words mode)
- 15 / 30 / 60 / 120 second durations
- Real typing engine: live WPM, accuracy, error tracking, backspace,
  correct/incorrect character highlighting, caret
- Configuration locked while a test is running; safe to change setup
  before starting or after finishing
- Three full themes (Midnight, Emerald, Paper) with live switching and
  localStorage persistence
- Anonymous session identifier (localStorage) for logged-out use
- Real user accounts: register/login with bcrypt-hashed passwords and
  JWT-based authentication
- Completed results are saved to MongoDB via a real REST API when a
  database is configured, tagged to the authenticated user when logged
  in and to the anonymous session otherwise, and remain visible locally
  with an honest "couldn't sync" message when the database isn't
  configured
- A safe, one-way "claim" flow that moves a browser's existing
  anonymous results onto a new/logged-in account
- An authenticated Profile page showing real account info and stats
  pulled from the backend (`/api/results/me/stats`)
- A real, authenticated **Stats dashboard** (`/stats`) — see "Analytics
  dashboard (Phase 6)" below
- A real, public **Leaderboard** (`/leaderboard`) — see "Leaderboard
  (Phase 7)" below
- Session history and stats API endpoints (anonymous and authenticated)
- A real, backend-verified **Achievements & Streak system**, integrated
  into Profile — see "Achievements & Streaks (Phase 8)" below
- A real, backend-verified **AI Coach** report
- A real, backend-issued **Performance Certificate** system (PDF +
  public verification page), generated from an actual saved test
  result — see "Performance Certificates (Phase 10)" below

**Not implemented yet** (intentionally, future phases): profile
editing, social features, admin dashboard.

## Project structure

```
typeforge/
├── src/                      # Frontend (React + Vite)
│   ├── components/
│   │   ├── auth/               # AuthCard, FormField, ProtectedRoute
│   │   ├── analytics/          # StatCard, WpmChart, AccuracyChart, ModeBreakdown,
│   │   │                       # DurationBreakdown, RecentTests, AnalyticsSkeleton,
│   │   │                       # AnalyticsEmptyState, AnalyticsErrorState, PeriodFilter
│   │   ├── leaderboard/        # LeaderboardFilterBar, Podium, LeaderboardTable,
│   │                           # CurrentUserRankCard, PaginationControls,
│   │                           # LeaderboardSkeleton, LeaderboardEmptyState, LeaderboardErrorState
│   │   └── achievements/       # StreakCard, AchievementCard, AchievementIcon, AchievementsGrid,
│   │                           # AchievementDetailModal, AchievementsSkeleton,
│   │                           # AchievementsEmptyState, AchievementsErrorState
│   ├── pages/                  # ...LoginPage.jsx, RegisterPage.jsx, ProfilePage.jsx, StatsPage.jsx, LeaderboardPage.jsx
│   ├── hooks/                # useTypingTest (the typing engine), useChartColors (theme-aware chart colors)
│   ├── context/              # ThemeContext, AuthContext (shared auth state)
│   ├── config/                # themes.js, typingModes.js, constants.js, achievementIcons.js
│   ├── data/                  # words.js, quotes.js (pure data)
│   ├── utils/                  # textGeneration.js, typingMetrics.js, session.js, authToken.js
│   └── services/               # api.js — the only place that calls the backend
├── server/                    # Backend (Node + Express + Mongoose)
│   ├── config/                  # db.js (MongoDB connection), achievements.js (achievement definitions)
│   ├── models/                 # User.js, TypingResult.js
│   ├── controllers/            # health, results, auth, leaderboard, achievements
│   ├── services/                # achievementsService.js — achievement + streak computation
│   ├── routes/                 # /api/health, /api/results, /api/auth, /api/leaderboard, /api/achievements
│   ├── middleware/              # 404, centralized error handler, auth (requireAuth/optionalAuth)
│   ├── utils/                   # asyncHandler, validateResult, validateAuth, jwt, streaks
│   └── server.js                # composition root
├── .env.example
└── package.json                 # single package.json for both frontend and backend
```

## Setup

### 1. Install dependencies

```bash
npm install
```

(One `npm install` covers both the frontend and backend — see note below on why there's a single `package.json`.)

### 2. Environment variables

Copy the template and fill in what you have:

```bash
cp .env.example .env
```

| Variable       | Used by  | Required?   | Notes                                                                 |
|----------------|----------|-------------|--------------------------------------------------------------------------|
| `MONGODB_URI`  | backend  | No          | Leave empty to run the API without persistence — see below.              |
| `PORT`         | backend  | No          | Defaults to `5000`.                                                       |
| `CLIENT_URL`   | backend  | No          | Frontend origin allowed by CORS. Defaults to `http://localhost:5173`.     |
| `JWT_SECRET`   | backend  | Effectively yes | Registration, login, and every protected route fail without it. Generate a long random value, e.g. `openssl rand -hex 32`. Never commit the real value. |
| `VITE_API_URL` | frontend | No          | Backend base URL including `/api`. Defaults to `http://localhost:5000/api`. |

`.env` is git-ignored — never commit real credentials.

### 3. MongoDB Atlas (optional but recommended)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow your IP (or `0.0.0.0/0` for quick testing).
3. Copy the connection string into `MONGODB_URI` in `.env`, e.g.
   `mongodb+srv://user:password@cluster0.mongodb.net/typeforge`.

If you skip this step, the backend still starts normally. `/api/health`
will report `"database": "not_configured"`, registration/login return a
clear `503`, and completed tests show "Could not sync — result remains
available locally" instead of silently pretending to save.

## Running it

**Frontend** (Vite dev server, default `http://localhost:5173`):

```bash
npm run dev
```

**Backend** (Express API, default `http://localhost:5000`):

```bash
npm run server        # node server/server.js
npm run server:dev    # same, with nodemon auto-restart
```

Run both at once in two terminals for full local development.

**Production build (frontend only — the backend runs as-is under Node):**

```bash
npm run build
npm run preview   # optional local preview of the build
```

## Authentication architecture

### User model (`server/models/User.js`)

- `name` — required, trimmed, capped length.
- `email` — required, trimmed, lowercased, unique, format-validated.
- `passwordHash` — required, `select: false` by default (never comes
  back from a normal query) and stripped again in `toJSON` as a second
  layer of defense. The plaintext password itself is **never** stored,
  logged, or returned anywhere.
- `createdAt` / `updatedAt` timestamps.

### Password security

- Hashed with **bcryptjs** at registration (cost factor 12); only the
  hash is stored.
- Login compares the supplied password against the stored hash with
  `bcrypt.compare` — the plaintext password is never persisted or
  logged.
- Login failures (unknown email vs. wrong password) return the same
  generic `"Incorrect email or password."` message and status code, so
  the endpoint can't be used to enumerate registered emails.

### JWT flow

- Tokens are signed with **jsonwebtoken** using `JWT_SECRET` from the
  environment (never hardcoded; the server logs a clear warning on
  startup if it's missing).
- The payload contains only `{ userId }` — no password, no hash, no
  unnecessary personal data.
- Tokens expire after 7 days.
- The frontend sends `Authorization: Bearer <token>` on every request
  once logged in (`src/services/api.js` attaches it automatically when
  a token is stored).
- `server/middleware/auth.js` exposes two middlewares:
  - `requireAuth` — rejects the request with a clean `401` if the
    token is missing, malformed, or expired; otherwise attaches
    `req.userId`.
  - `optionalAuth` — used only on `POST /api/results`, so the same
    endpoint keeps working for logged-out users (`req.userId = null`)
    and automatically recognizes logged-in ones, without a separate
    endpoint or a chance to silently break anonymous saving.
- Logout is purely client-side: the token is removed from storage.
  Because JWTs are stateless, there is no server-side token table for
  this project.

### Auth API

| Method | Path                        | Auth       | Description                                      |
|--------|-----------------------------|------------|---------------------------------------------------|
| POST   | `/api/auth/register`        | —          | Create an account, returns `{ token, user }`.      |
| POST   | `/api/auth/login`           | —          | Log in, returns `{ token, user }`.                 |
| GET    | `/api/auth/me`               | required   | Returns the authenticated user's safe profile.     |
| POST   | `/api/auth/claim-session`    | required   | Attaches a browser's anonymous results to this account. |

`user` in every response is `{ id, name, email, createdAt }` —
`passwordHash` is never included.

### Result ownership & the authenticated results API

`TypingResult` now has a `userId` field (`ObjectId`, `ref: "User"`,
`default: null`, indexed), alongside the original `sessionId`. Ownership
on save comes **only** from the server-verified JWT via `req.userId` —
`POST /api/results` completely ignores any `userId` a client puts in
the request body, so it's impossible to save a result under someone
else's account.

| Method | Path                          | Auth       | Description                                       |
|--------|-------------------------------|------------|-----------------------------------------------------|
| POST   | `/api/results`                | optional   | Saves a result; tagged to `req.userId` if logged in, otherwise anonymous. |
| GET    | `/api/results/me`              | required   | The authenticated user's own history, newest first. |
| GET    | `/api/results/me/stats`        | required   | Aggregated stats computed only from that user's results. |
| GET    | `/api/results/:sessionId`      | —          | Legacy anonymous-session history (unchanged from Phase 4). |
| GET    | `/api/results/:sessionId/stats`| —          | Legacy anonymous-session stats (unchanged from Phase 4). |

`POST /api/results` body (unchanged shape from Phase 4 — `userId` is
never accepted from the client, only derived server-side from the JWT):

```json
{
  "sessionId": "…",
  "mode": "words",
  "durationSeconds": 30,
  "elapsedSeconds": 12.5,
  "wpm": 72.4,
  "accuracy": 97.3,
  "correctChars": 123,
  "incorrectChars": 4,
  "totalChars": 127,
  "errors": 4,
  "punctuation": false,
  "numbers": false
}
```

Every field is validated server-side (type, range, and cross-field
consistency) regardless of what the frontend already checked. If the
database isn't connected, every `/api/results*` and `/api/auth/*`
route that needs it returns `503` with an honest message — none of
them ever claim success without a real save/read.

### Anonymous → account transition

Existing anonymous results are identified by a `sessionId` generated
client-side and stored in `localStorage` (`typeforge_session_id`) — see
`src/utils/session.js`. Logging in or registering does **not**
automatically claim anything. Instead:

1. The frontend calls `POST /api/auth/claim-session` with the current
   browser's `sessionId`, right after a successful login/registration.
2. The backend verifies the JWT, then runs an update scoped to
   `{ sessionId, userId: null }` — matching only results that are (a)
   from this exact session and (b) not already owned by anyone.
3. Results already owned by another account are never touched, so one
   user can never claim another user's history this way.
4. The number of claimed results is returned; the frontend treats this
   as best-effort and silent — a failed or empty claim never blocks
   login.

### Frontend auth state

`src/context/AuthContext.jsx` is the single source of truth, mirroring
the existing `ThemeContext` pattern:

- On load, if a token is stored, it's verified against `GET /api/auth/me`
  rather than trusted blindly; an invalid/expired token is cleared
  silently instead of leaving stale "logged in" state around.
- `login` / `register` save the token, set the user, and attempt the
  session claim.
- `logout` clears the token and user state.
- `ProtectedRoute` (`src/components/auth/ProtectedRoute.jsx`) redirects
  logged-out users to `/login`, remembering the page they were headed
  to so they land back there after logging in. Currently guards
  `/profile` only — the typing test itself stays fully public.

### Token storage (and its tradeoff)

For this portfolio project, the JWT is stored in `localStorage` under
`typeforge_auth_token` (`src/utils/authToken.js`) — only the token,
never the password. This is simple and works well for a client-only
SPA with no server-rendered pages, but it is **not** as safe against
XSS as an HttpOnly cookie: any script that manages to run in the page
(e.g. via a dependency vulnerability) could read the token from
`localStorage`, whereas an HttpOnly cookie would be invisible to it. A
production app handling sensitive data would likely prefer HttpOnly
cookies with CSRF protection instead. That tradeoff is accepted here
deliberately, in exchange for simplicity.

### Security considerations

- Passwords hashed with bcrypt (cost factor 12); plaintext is never
  stored or logged.
- JWTs signed with a server-only secret from the environment; payload
  carries only `userId`.
- Every auth/result payload is re-validated server-side regardless of
  what the client already checked.
- Login errors are generic (no "email not found" vs. "wrong password"
  distinction).
- `passwordHash` is excluded by default at the schema level and
  stripped again in `toJSON`.
- Result ownership is determined exclusively from the verified JWT —
  never from a client-supplied `userId`.
- `claim-session` can only attach currently-unowned (`userId: null`)
  results, never another account's.
- Centralized error handler never leaks stack traces or raw MongoDB
  errors to the client (unchanged from Phase 4).
- CORS origin and the `10kb` request body limit are preserved from
  Phase 4.
- Basic auth-endpoint rate limiting was considered but intentionally
  left out for this phase to avoid adding a dependency/complexity that
  wasn't clearly needed yet — a reasonable addition (e.g.
  `express-rate-limit` on `/api/auth/*`) for a real deployment.

## Analytics dashboard (Phase 6)

### Overview

`/stats` is a fully authenticated page (guarded by the existing
`ProtectedRoute`, same pattern as `/profile`). Logged-out visitors are
redirected to `/login` with the intended destination preserved, so they
land back on `/stats` after signing in. Anonymous users can keep using
the typing test itself — only the analytics dashboard requires an
account.

### Analytics API

| Method | Path                                      | Auth     | Description |
|--------|-------------------------------------------|----------|--------------|
| GET    | `/api/results/me/analytics?period=<p>`    | required | Full analytics payload for the authenticated user only. `period` is one of `all` (default), `7d`, `30d`, `90d`; an invalid value returns `400`. |

Ownership works exactly like the other `/me/*` routes: `requireAuth`
derives `req.userId` from the verified JWT, and every MongoDB query in
`getMyAnalytics` (`server/controllers/resultsController.js`) is scoped
to that id. There is no `userId` query parameter or body field the
client can use to override this — cross-user access is not possible
from the API surface.

The response shape:

```json
{
  "success": true,
  "analytics": {
    "period": "30d",
    "summary": {
      "totalTests": 42,
      "bestWpm": 88,
      "averageWpm": 71.4,
      "bestAccuracy": 99.2,
      "averageAccuracy": 96.1,
      "totalErrors": 137,
      "totalTypedCharacters": 21540,
      "averageErrors": 3.3
    },
    "trend": [{ "date": "2026-08-14T…", "wpm": 68, "accuracy": 95.5, "errors": 4, "testNumber": 1 }],
    "recentTests": [{ "id": "…", "mode": "words", "durationSeconds": 30, "elapsedSeconds": 30, "wpm": 88, "accuracy": 97.1, "errors": 2, "punctuation": false, "numbers": true, "createdAt": "…" }],
    "modeBreakdown": [{ "mode": "words", "tests": 30, "averageWpm": 70.2, "averageAccuracy": 96.4, "bestWpm": 88 }],
    "durationBreakdown": [{ "durationSeconds": 30, "tests": 25, "averageWpm": 72.1, "bestWpm": 88 }]
  }
}
```

`recentTests` never includes `password`, `passwordHash`, `sessionId`,
`userId`, or any other internal field — only the columns the dashboard
actually displays.

### How the numbers are calculated

Everything is a MongoDB aggregation over that user's own
`TypingResult` documents, filtered by `createdAt` when a period other
than `all` is selected:

- **Best WPM / Best Accuracy** — `$max` over the filtered set.
- **Average WPM / Average Accuracy / Average Errors** — `$avg` over
  the filtered set.
- **Total Tests** — `$sum: 1` (document count).
- **Total Errors / Total Typed Characters** — `$sum` of `errors` /
  `totalChars`.
- **Trend** — the filtered set sorted oldest → newest, capped at 2000
  points, mapped to `{ date, wpm, accuracy, errors, testNumber }` for
  the two trend charts.
- **Mode / duration breakdowns** — grouped by `mode` / `durationSeconds`
  respectively; a mode or duration with zero results in the selected
  period simply doesn't appear (never shown with fabricated zeros).

An account (or period) with zero results returns honest zeros in
`summary` and empty arrays elsewhere — the frontend renders this as an
empty state, not as a chart with invented data.

### Dashboard UI

- **Summary** — six KPI cards (Best/Average WPM, Best/Average Accuracy,
  Tests Completed, Total Errors), `components/analytics/StatCard.jsx`.
- **WPM & Accuracy trend charts** — `WpmChart.jsx` / `AccuracyChart.jsx`,
  built with Recharts. Colors are pulled at render time from the active
  theme's own token values (`src/hooks/useChartColors.js` reads
  `THEMES` from `src/config/themes.js`), so charts stay correctly
  themed across Midnight/Emerald/Paper with no hardcoded colors. A
  single data point still renders a clearly visible dot instead of a
  broken-looking empty line.
- **Mode & duration breakdowns** — `ModeBreakdown.jsx`,
  `DurationBreakdown.jsx`.
- **Recent tests** — `RecentTests.jsx`; renders as a table on `sm:`
  and above, and as stacked cards on mobile to avoid horizontal
  scrolling.
- **Period filter** — `PeriodFilter.jsx`; changing it re-fetches
  `/api/results/me/analytics` with the new `period` and replaces every
  section of the dashboard, not just a label.
- **Loading / empty / error states** — `AnalyticsSkeleton.jsx` (no
  numbers shown while loading), `AnalyticsEmptyState.jsx` ("Your typing
  journey starts here" for a brand-new account, or a period-scoped
  variant when the filter itself has no matching data — either way with
  a working "Start typing" button to `/test`), `AnalyticsErrorState.jsx`
  ("Unable to load your statistics right now." with a Retry button; no
  fake cached values are shown).

### Data privacy

The analytics endpoint only ever returns the authenticated caller's
own documents — enforced server-side via `req.userId` from the JWT, not
by anything the frontend filters. This is the same ownership model
already used by `/api/results/me` and `/api/results/me/stats`.



- **Frontend → Vercel**: point it at `src/` with the standard Vite
  build command; set `VITE_API_URL` to your deployed backend's URL.
- **Backend → Render (or similar free Node host)**: set `MONGODB_URI`,
  `CLIENT_URL` (your deployed frontend's URL), and optionally `PORT`
  as environment variables in the host's dashboard.
- **Database → MongoDB Atlas free tier (M0)**: sufficient for this
  project's needs.

No Docker, Redis, or paid services are required anywhere in this stack.

## Leaderboard (Phase 7)

### Overview

`/leaderboard` is a **public** page — it works fully logged out, per
the spec. Only the "your rank" card needs an account. There is no new
environment variable or configuration requirement for this feature; it
reuses the existing `MONGODB_URI`/JWT setup from Phases 1–6.

### API

| Method | Path                | Auth               | Description |
|--------|---------------------|--------------------|--------------|
| GET    | `/api/leaderboard`  | public (optional)  | Global rankings from real `TypingResult` data. When a valid JWT is attached, the response also includes that caller's own rank under the same filters. |

Query parameters (all optional, all validated server-side — an invalid
value returns `400` rather than being silently ignored):

| Param      | Values                          | Default |
|------------|----------------------------------|---------|
| `mode`     | `all`, `words`, `quotes`, `custom` | `all` |
| `duration` | `all`, `15`, `30`, `60`, `120`     | `all` |
| `period`   | `all`, `7d`, `30d`, `90d`          | `all` |
| `metric`   | `wpm`, `accuracy`                  | `wpm` |
| `page`     | positive integer                  | `1` |
| `limit`    | positive integer, capped at `50`  | `20` |

Response shape:

```json
{
  "success": true,
  "leaderboard": {
    "entries": [
      { "rank": 1, "userId": "…", "name": "Annanya", "wpm": 112, "accuracy": 99.2, "duration": 60, "mode": "words", "createdAt": "…" }
    ],
    "pagination": { "page": 1, "limit": 20, "totalUsers": 37, "totalPages": 2 },
    "filters": { "mode": "all", "duration": "all", "period": "all", "metric": "wpm" },
    "currentUser": { "rank": 14, "name": "Annanya", "wpm": 96, "accuracy": 98.4, "duration": 30, "mode": "words", "createdAt": "…" }
  }
}
```

`currentUser` is `null` for a logged-out visitor, and also `null` for
a logged-in user with no qualifying result yet — the frontend tells
these two cases apart using its own `isAuthenticated` state, not
anything guessed from the payload. Entries never include `email`,
`passwordHash`, session identifiers, or any other private field —
only what's listed above.

### What counts as a qualifying result

A `TypingResult` only enters the leaderboard if it: belongs to a
registered user (`userId` is not null — anonymous results never
qualify), has `wpm > 0`, has `accuracy` between 0–100, and has a
positive `durationSeconds`. Mode/duration/period filters narrow this
set further before ranking.

### Ranking logic

Each user is represented by **one** result: their best qualifying
result for the active metric, picked with the same tie-break order
used to rank users against each other —

- **metric = wpm**: highest `wpm`, then highest `accuracy`, then
  fastest `elapsedSeconds`, then earliest `createdAt`.
- **metric = accuracy**: highest `accuracy`, then highest `wpm`, then
  fastest `elapsedSeconds`, then earliest `createdAt`.

This is computed with a single MongoDB aggregation pipeline
(`server/controllers/leaderboardController.js`): sort → group by
`userId` keeping the first (best) document per user → re-sort the
one-per-user set → `$setWindowFields` with `$rank` to assign standings
(ties share a rank, matching SQL `RANK()` semantics) → `$lookup` the
`users` collection (a result whose account no longer exists is
dropped here) → `$facet` for the paginated page, the total count, and
— when a JWT is present — that caller's own entry from the same ranked
set. Nothing is computed or filtered on the frontend.

### Current-user rank

Identical trust model to the Stats dashboard: the backend's
`optionalAuth` middleware derives `req.userId` from a verified JWT (or
leaves it unset for anonymous requests) — there is no `userId` query
parameter or body field a client can send to ask about a different
account. The public leaderboard query and the current-user lookup run
against the exact same ranked, deduplicated result set, so a visitor's
"your rank" always matches their position in the list they'd see by
paging through it.

### UI

- **Filter bar** — metric / mode / duration / period, each a segmented
  control; changing any filter re-queries the backend and resets to
  page 1 (`LeaderboardFilterBar.jsx`).
- **Podium** — shown only when at least 3 qualifying entries exist for
  the current filters and page 1 is active; with fewer than 3, the
  page simply shows them in the table instead of inventing placeholder
  slots (`Podium.jsx`).
- **Table** — `LeaderboardTable.jsx`; columns reorder around the active
  metric (WPM-first or Accuracy-first), renders as a table on `sm:`
  and up and as stacked cards on mobile, and subtly highlights the
  signed-in caller's own row (matched by `userId`, not by name).
- **Your rank card** — `CurrentUserRankCard.jsx`; three honest states —
  signed out ("Sign in to see your personal rank"), signed in with no
  qualifying result yet ("Complete a test to appear on the
  leaderboard"), or an actual rank/WPM/accuracy.
- **Pagination** — real server-side paging (`PaginationControls.jsx`);
  Previous/Next disable correctly at the first/last page.
- **Loading / empty / error states** — `LeaderboardSkeleton.jsx`
  (matches the podium+table layout so nothing jumps),
  `LeaderboardEmptyState.jsx` ("No rankings yet." + a working "Take a
  Test" link to `/test`), `LeaderboardErrorState.jsx` ("Leaderboard
  unavailable" + Retry — no fallback fake data).
- **Animation** — Framer Motion for podium and row entrance only
  (`Podium.jsx`, `LeaderboardTable.jsx`), both gated behind
  `useReducedMotion()` so they're skipped for anyone with that OS
  preference set.

### Performance

The leaderboard aggregation is bounded: pagination limits are capped
at 50 server-side regardless of what a client requests, and a
`{ mode: 1, durationSeconds: 1 }` index on `TypingResult` (added this
phase, alongside the existing `{ userId: 1, createdAt: -1 }` index)
covers the filter portion of the query before the ranking sort runs —
appropriate for MongoDB Atlas's free M0 tier at the scale this project
targets.

## Achievements & Streaks (Phase 8)

A real achievement and daily-streak system, computed entirely from a
user's own completed `TypingResult` documents. Nothing about
unlock/progress/streak status is ever accepted from the client as
authoritative — the backend is the sole source of truth, exactly like
the Stats dashboard and Leaderboard before it.

### Design decision: no new per-user collection

Rather than persisting a document-per-user tracking which achievements
are unlocked, Phase 8 **recomputes everything on every request** from
the same `TypingResult` data the Stats dashboard already reads. This
was a deliberate trade-off:

- **Correctness by construction** — there is no separate "unlocked"
  flag that could drift out of sync with the underlying results (e.g.
  from a bug, a manual DB edit, or a partially-failed write).
- **Zero migration risk** — adding, renaming, or retuning an
  achievement's target in `server/config/achievements.js` takes effect
  immediately and retroactively for every user, with no backfill job.
- **Free-tier friendly** — one indexed query
  (`{ userId, createdAt }`, already existing from Phase 5/6) per
  request, then everything else is derived in memory from that same
  result set. No per-achievement queries.
- **Trade-off accepted**: there is no persisted `unlockedAt` timestamp
  (the API always returns `unlockedAt: null`, reserved for a future
  phase that would need to start recording unlock *events*, not just
  unlock *state*). This was judged an acceptable cost for the
  correctness and simplicity gained.

### Achievement categories

19 curated achievements (defined once in `server/config/achievements.js`,
consumed by both the API and, via icon-name lookup, the frontend):

| Category | Achievements | Based on |
|---|---|---|
| Testing | First Strike, Getting Started, Dedicated, Typing Machine | total completed tests (1 / 10 / 50 / 100) |
| Speed | Speed Rookie → Lightning | best-ever WPM (40 / 60 / 80 / 100 / 120) |
| Accuracy | Sharp Fingers, Precision, Near Perfect, Perfect Run | best-ever accuracy (95 / 98 / 99%) and a 100%-accuracy run |
| Consistency | Three Day Flow → Monthly Discipline | historical maximum streak (3 / 7 / 14 / 30 days) |
| Variety | Mode Explorer, Time Traveler | unique modes (words/quotes/custom) and unique durations (15/30/60/120s) ever completed |

### Achievement unlock & progress logic

`server/services/achievementsService.js` fetches a user's results
once (`wpm accuracy mode durationSeconds createdAt`), derives a single
"context" object (best WPM, best accuracy, total tests, unique
modes/durations seen, historical max streak), then evaluates every
achievement definition against that context:

- Count/WPM/accuracy achievements: `progress = min(value / target, 1)`.
- Binary achievements (Perfect Run): 0% or 100%, never in between.
- Mode/duration achievements: `uniqueCompleted / target`, filtered to
  only the durations/modes actually supported today (`words`/`quotes`/
  `custom`, `15`/`30`/`60`/`120`) so stale data can never push progress
  past 100%.
- **Streak achievements intentionally use the historical maximum
  streak, not the current one.** If a user reaches a 14-day streak and
  later breaks it, "Two Week Flow" stays unlocked — exactly as
  specified. Only the *summary's* `currentStreak` reflects an active,
  ongoing streak.

Progress is always clamped to `[0, 1]` before being returned.

### Streak definition & date handling

A streak is measured in **calendar days**, not test count — multiple
tests on the same day count as a single active day. Implemented in
`server/utils/streaks.js` (pure, no DB access, fully unit tested):

- **Timezone strategy**: TYPEFORGE does not store a per-user timezone
  anywhere in the `User` model, so every `createdAt` is normalized to
  its **UTC calendar date** to decide "was there activity on this
  day?". This is a deliberate, documented choice (see the file's
  header comment) rather than an oversight — a test completed at
  11:30pm in a UTC-negative timezone will count toward the UTC day,
  which may differ from the user's local calendar day. Adding
  per-user timezones is a natural extension for a future phase, and
  this module is the only place that would need to change.
- **Current streak**: counts backward from the most recent active day
  as long as each preceding day is also active. If the most recent
  active day is today or yesterday, the streak is still "live"; a gap
  of more than one day resets it to 0.
- **Longest streak**: the true historical maximum run of consecutive
  active days — computed independently of the current streak (a user
  can have `longestStreak: 14, currentStreak: 0` after a long break).

### API

```
GET /api/achievements/me     (requires Authorization: Bearer <JWT>)

{
  "success": true,
  "summary": {
    "currentStreak": 7,
    "longestStreak": 14,
    "totalActiveDays": 23,
    "lastActiveDate": "2026-09-12T14:03:00.000Z"
  },
  "achievements": [
    {
      "id": "speed-master",
      "name": "Speed Master",
      "description": "Reach 100 WPM in a test.",
      "icon": "Rocket",
      "category": "speed",
      "rarity": "epic",
      "target": 100,
      "progress": 0.82,
      "progressLabel": "82 / 100 WPM",
      "unlocked": false,
      "unlockedAt": null
    }
  ]
}
```

Security model is identical to every other `/me` endpoint in the app:
`requireAuth` middleware verifies the JWT and sets `req.userId`; the
achievements service is only ever queried with that value, never with
anything from the request body/query/params, so one account can never
retrieve another's achievement or streak data.

### Profile integration

The Profile page (`/profile`) gained a "Streak & achievements" section
below the existing account/stats cards — the pre-existing Phase 5/6
profile UI is untouched:

- **`StreakCard`** — current streak (with a Lucide `Flame` icon, not
  emoji), best streak, total active days, last-active date; shows
  "Start your first test to begin your streak." when there's no
  activity yet.
- **`AchievementsGrid`** — every achievement definition, unlocked ones
  first (accent glow, checkmark badge) then locked ones (subdued, with
  a real progress bar and remaining-requirement label). Locked
  achievements are never hidden.
- **`AchievementDetailModal`** — clicking any card opens a small
  popover with the full description, category, unlock state, and
  progress bar.
- **Loading** — `AchievementsSkeleton` (bone placeholders matching the
  real layout, no layout shift).
- **Empty** — `AchievementsEmptyState` ("Your journey starts here.")
  with a working "Take a Test" link, shown above the (all-locked, 0%)
  grid rather than instead of it.
- **Error** — `AchievementsErrorState` ("Achievements unavailable" +
  Retry), no fallback fake stats.
- **Theming** — every component uses the existing `--tf-*` CSS
  variables (`bg-surface`, `text-text-primary`, `border-border`,
  `accent`, etc.), so it automatically matches Midnight, Emerald, and
  Paper with zero theme-specific code.
- **Animation** — Framer Motion for card/streak-card entrance and
  progress-bar fill, all gated behind `useReducedMotion()`.

### Testing

`server/utils/streaks.js`, `server/services/achievementsService.js`,
and the `/api/achievements/me` route each have a dedicated test file
using Node's built-in test runner (no extra test framework dependency
needed):

```bash
npm run test:server
```

Covers (26 tests total): zero/one/many tests, every WPM/accuracy/count
threshold boundary from the spec, mode/duration partial-vs-complete
coverage, same-day dedup, 3/7/14/30-day streaks, a one-day gap, a
multi-day gap, a broken streak with a historical max greater than the
current streak, progress never exceeding 100%, unauthenticated/invalid-token
rejection, cross-user isolation (two different JWTs never receive each
other's data), and the database-unavailable path returning honest
empty data rather than fake stats.

*Note on scope*: these are unit tests plus a route-level integration
test (with the achievement service mocked via `node:test`'s
`mock.module`) — this sandbox had no access to a live MongoDB instance
to run a full end-to-end test against real Atlas. The computation
logic itself (the part with real risk of subtle bugs — streak
boundaries, progress math) is exhaustively covered; before deploying,
a quick manual pass against a real account with a handful of typing
tests spread across a few real dates is still recommended.



## Performance Certificates (Phase 10)

### Overview

After a real, saved typing test, an authenticated user can generate a
premium **performance certificate** — a technical-editorial document
containing that exact test's WPM, accuracy, errors, duration, and
mode, plus a unique certificate ID and issue date. Certificates have a
public, no-login verification page, a client-generated PDF download,
and a print stylesheet. No new variables are required in `.env` — this
phase reuses `MONGODB_URI` and `JWT_SECRET`.

### Data model (`server/models/Certificate.js`)

```
certificateId    String, unique, matches /^TF-\d{4}-[A-Z0-9]{8}$/
userId           ObjectId ref User        (owner — never client-supplied)
resultId         ObjectId ref TypingResult, unique (one certificate per result)
userNameSnapshot String                   (copied at issuance, not re-read live)
wpm, accuracy, errors, durationSeconds, mode   (copied from the TypingResult)
issuedAt         Date
createdAt/updatedAt (timestamps)
```

Performance and name fields are a **snapshot** taken at issuance: if
the account's display name changes later, or (hypothetically) a
result were edited, an already-issued certificate stays historically
accurate rather than silently changing.

### Certificate ID

`TF-<UTC year>-<8 uppercase hex chars>`, e.g. `TF-2026-9F3C2A7B` —
generated server-side with `crypto.randomBytes` (see
`generateCertificateId` in `server/services/certificateService.js`),
never derived from or equal to a MongoDB ObjectId. 8 hex characters is
a 32-bit space per year; combined with a small retry loop on the rare
chance of a collision, this is effectively unique without needing a
heavier ID scheme.

### API

| Method | Route                    | Auth       | Notes |
| ------ | ------------------------ | ---------- | ----- |
| POST   | `/api/certificates`      | Required   | Body: `{ resultId }`. Creates (or returns the existing) certificate for that result. |
| GET    | `/api/certificates/:certificateId` | Public | Certificate-safe fields only. Unknown/invalid id → clean 404. |
| GET    | `/api/certificates/me`   | Required   | Every certificate owned by the caller, newest first. |

### Generation flow & security

1. A real test finishes and is saved via the existing
   `POST /api/results` flow; the frontend keeps the resulting
   `resultId` (`useTypingTest`'s `savedResultId`).
2. On the result screen, an authenticated user with a saved result
   sees **Generate certificate**. Clicking it calls
   `POST /api/certificates` with `{ resultId }` — nothing else.
3. The backend derives `userId` exclusively from the verified JWT
   (`requireAuth`), never from the request body. It then loads the
   *stored* `TypingResult` by `resultId` and checks
   `result.userId === req.userId`; a mismatch or missing result
   returns the same generic 404 either way, so the endpoint can't be
   used to enumerate other users' result ids.
4. Every performance number on the certificate is read back from that
   stored `TypingResult` document — never from anything the client
   sent.
5. If a certificate already exists for that `resultId` (checked first,
   and enforced again by a unique index at the database layer for
   concurrent requests), the existing certificate is returned instead
   of creating a duplicate.
6. The frontend is redirected/linked to `/certificate/:certificateId`,
   and the result-screen button becomes **View certificate**.

### PDF generation

Client-side, using `html2canvas` + `jsPDF` — both **dynamically
imported** only when "Download PDF" is actually clicked, so the
~250kb combined cost never touches the main bundle. The certificate
DOM node is rasterized at 2x scale, then placed into a `jsPDF` whose
page size exactly matches the canvas (`unit: "px"`), so there's no
clipping and no incidental blank second page. `window.print()` (with a
dedicated print stylesheet, see below) is offered as a fallback if PDF
generation ever fails.

### Print stylesheet

`src/index.css` adds an `@media print` block that hides the navbar,
footer, and every on-screen control (`.tf-no-print`), forces a white
page background regardless of the active theme, and marks the
certificate itself with `break-inside: avoid` so it never splits
across a page boundary.

### Print/PDF-safe visuals independent of theme

`CertificateDocument` uses a fixed, hardcoded light palette (lifted
from TYPEFORGE's own Paper theme values) instead of the app's
`--tf-*` theme tokens. A certificate is a print artifact first, so it
stays legible and premium on paper and in a PDF regardless of whether
someone generated it while using Midnight, Emerald, or Paper.

### Profile integration

Profile (`/profile`) gained a small **Certificates** section below
Achievements — a real, backend-verified list from
`GET /api/certificates/me` (loading/error/empty states, no mock data),
each row linking straight to that certificate's public page. It is
deliberately compact (WPM, accuracy, date, certificate ID, a "View →"
affordance) rather than a second dashboard.

### Testing

`server/services/certificateService.test.js` (pure: ID format,
uniqueness, ObjectId validation, and that the public shape strips
`userId`/`resultId`/`_id`) and `server/routes/certificates.test.js`
(route-level, mocking the service the same way
`achievements.test.js` does) cover: unauthenticated rejection,
creating a certificate for one's own result, a spoofed `userId`/`wpm`
in the request body being silently ignored in favor of the JWT and the
stored result, a 404 (not a leak) for another user's result, duplicate
generation returning the existing certificate, the public endpoint
working without auth and exposing only certificate-safe fields, an
unknown id returning a clean 404, and `/me` being scoped to the
caller's own certificates with verified cross-user isolation.

```bash
npm run test:server
```

Frontend and backend are small enough, and share no build tooling
conflicts (Vite only touches `src/`, Node only touches `server/`), so a
single `package.json` avoids duplicated dependency management. If the
backend grows substantially, splitting it into its own package is a
reasonable future refactor — not needed today.

## Deployment (Phase 11)

TYPEFORGE is designed to run entirely on free-tier infrastructure:
**Vercel** for the frontend, **Render** (or any Node host that behaves
similarly) for the backend, and **MongoDB Atlas** for the database. AI
Coach and PDF generation stay optional/client-side, so nothing here
requires a paid service.

### Frontend — Vercel

1. Import the repo in Vercel and let it auto-detect Vite, or set manually:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
2. **Required environment variable** (Project Settings → Environment Variables):
   - `VITE_API_URL` — your deployed backend's API base URL, including
     the `/api` prefix, e.g. `https://typeforge-api.onrender.com/api`.
     If unset, the frontend falls back to `http://localhost:5000/api`,
     which will not work in production.
3. **SPA routing:** the included `vercel.json` rewrites every path to
   `/index.html` (existing static files, like the hashed files under
   `assets/`, are still served directly — Vercel checks the filesystem
   before applying a rewrite). This is what makes a direct refresh on
   a client-side route like `/certificate/TF-2026-XXXXXXXX` or
   `/stats` load the app instead of a Vercel 404.

### Backend — Render

1. Create a new **Web Service** from the repo, runtime **Node**.
2. **Build command:** `npm install`
3. **Start command:** `npm start` (runs `node server/server.js`; `npm run server` does the same thing and still works if you've scripted around it).
4. **Required environment variables** (Render → Environment):

   | Variable      | Required?       | Notes |
   |---------------|------------------|-------|
   | `MONGODB_URI` | Effectively yes  | Without it the API still starts, but registration/login/results return a clean `503`. |
   | `JWT_SECRET`  | Effectively yes  | Long random value, e.g. `openssl rand -hex 32`. Never reuse a development secret in production. |
   | `CLIENT_URL`  | Yes in production | Your deployed Vercel frontend origin, e.g. `https://typeforge.vercel.app`. Used for CORS — without it the backend falls back to `http://localhost:5173`, which will block your real frontend. |
   | `PORT`        | No               | Render sets this automatically; the server reads `process.env.PORT` and binds to `0.0.0.0`, which Render requires to route traffic to the instance. |
   | `AI_API_KEY`, `AI_API_URL`, `AI_MODEL` | No | Optional AI Coach provider config — see below. |

5. **CORS:** the backend allows exactly one origin (`CLIENT_URL`), not
   `*` — this is intentional, since routes like `/auth/me` and
   `/certificates` are authenticated. Point `CLIENT_URL` at your real
   Vercel URL, including the scheme (`https://...`), with no trailing
   slash.
6. Render's free tier spins down an idle service; the first request
   after a period of inactivity will be slow to respond while it wakes
   up. This is a platform characteristic, not a TYPEFORGE bug.

### Database — MongoDB Atlas

1. Create a free (M0) cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user with a strong, generated password.
3. Under Network Access, allow the IPs that need to reach it — for a
   Render free-tier deployment (which uses dynamic egress IPs), the
   simplest option is allowing `0.0.0.0/0`; tighten this if your Atlas
   plan supports static/VPC peering later.
4. Copy the connection string (`mongodb+srv://...`) into `MONGODB_URI`
   in the **backend's** environment variables only — never in the
   frontend, never committed to source. `.env.example` documents the
   variable name but ships with an empty placeholder.

### AI Coach (optional)

`AI_API_KEY`, `AI_API_URL`, and `AI_MODEL` are optional and, when set,
must all be set together. The AI API key belongs **only** on the
backend (Render environment variables) — it is never sent to, read
by, or embedded in the frontend build. If any of the three are
missing, the app still starts normally and the Coach page falls back
to its deterministic "Performance Coach" report, exactly as in local
development.

### Certificates

`GET /api/certificates/:certificateId` is a public, unauthenticated
endpoint by design — it's what powers the "Copy verification link"
flow, letting anyone open a certificate URL and confirm it's genuine
without logging in. It returns only certificate-safe fields (see
`toPublicCertificate` in `server/services/certificateService.js`) —
never an email, password hash, or internal database id. PDF
generation (`html2canvas` + `jsPDF`) runs entirely client-side, so it
needs no backend configuration beyond the API being reachable.

### Production checklist

Before going live, confirm:

- [ ] No secrets in frontend source or the Vercel build output
- [ ] No secrets in Git-tracked files — `.env` is covered by `.gitignore`; `.env.example` holds placeholders only
- [ ] `JWT_SECRET` and `MONGODB_URI` are set as backend-only environment variables, not committed
- [ ] `AI_API_KEY` (if used) is backend-only
- [ ] `CLIENT_URL` on the backend matches your real Vercel origin exactly
- [ ] `VITE_API_URL` on the frontend points at your real Render origin, including `/api`
- [ ] Login/register are rate-limited (`server/middleware/rateLimiters.js`)
- [ ] Nothing in production configuration depends on `localhost`
