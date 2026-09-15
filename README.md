TypeForge ⌨️
A full-stack typing speed test app, built from scratch — real typing engine, user accounts, live stats, a public leaderboard, achievements, an AI coach, and downloadable performance certificates.

🔗 Live demo: 
https://type-forge-sable.vercel.app/

About
TypeForge started as a simple typing test clone and grew into a full product — real accounts, a backend that actually persists your results, an achievements/streak system, an AI-generated coaching report after each test, and even shareable performance certificates you can download as a PDF or verify via a public link. Built solo, one feature at a time.

Features
Words / Quotes / Custom typing modes, with punctuation & numbers toggles
15 / 30 / 60 / 120 second test durations
Real-time WPM, accuracy, and error tracking with proper caret + highlighting
Three switchable themes — Midnight, Emerald, Paper (persisted across sessions)
Accounts with JWT auth (works anonymously too — results sync once you log in)
Stats dashboard with WPM/accuracy trend charts over time
Public leaderboard with pagination and current-user rank
Achievements & streak tracking, backend-verified
AI-powered performance coach with a deterministic fallback report when no AI provider is configured
Auto-generated performance certificates — PDF download + public verification page, no login required to verify
Tech Stack
Frontend	React 19, Vite, React Router, Tailwind CSS, Recharts, Framer Motion, lucide-react
Backend	Node.js, Express, MongoDB + Mongoose, JWT, bcrypt
Getting Started
bash
# 1. install dependencies
npm install

# 2. set up environment variables
cp .env.example .env

# 3. run the frontend — localhost:5173
npm run dev

# 4. run the backend — localhost:5000
npm run server
Run both commands in separate terminals for full local development.

Environment variables
Variable	Required	Description
MONGODB_URI	optional	MongoDB connection string — app still runs without it, just skips persistence
JWT_SECRET	yes	secret used to sign auth tokens
CLIENT_URL	yes (prod)	frontend origin, for CORS
VITE_API_URL	yes (prod)	backend API base URL, used by the frontend
AI_API_KEY / AI_API_URL / AI_MODEL	optional	needed only for the AI Coach feature
Project Structure
├── src/            # React frontend
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── context/
│   └── services/
├── server/         # Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── services/
└── package.json
Testing
bash
npm run test:server
Backend routes and services are covered — auth, results, leaderboard, achievements, and certificates.

Deployment
Runs entirely on free-tier infra — Vercel (frontend), Render (backend), MongoDB Atlas (database). If you're deploying your own copy, set VITE_API_URL on Vercel to your Render backend URL, and CLIENT_URL on Render to your Vercel frontend URL — CORS won't work otherwise.

Roadmap
 Profile editing (avatar, display name)
 Social features (follow/friends, shared leaderboards)
 Admin dashboard
Contributing
This is a personal project, but issues and PRs are welcome — feel free to fork it and open a pull request.



Built to get better at shipping full-stack apps end to end, from a raw typing engine to auth, deployment, and everything in between.



