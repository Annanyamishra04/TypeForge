// Route-level integration test. Run with:
//   node --experimental-test-module-mocks --test server/routes/achievements.test.js
// Mocks the service + db layers so this exercises real Express routing,
// real JWT auth middleware, and real request/response wiring — without
// needing a live MongoDB connection.
import { test, describe, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-achievements-route";

const calls = [];

mock.module("../services/achievementsService.js", {
  namedExports: {
    getAchievementsForUser: async (userId) => {
      calls.push(userId);
      return {
        summary: { currentStreak: 2, longestStreak: 5, totalActiveDays: 8, lastActiveDate: "2026-09-12T00:00:00.000Z" },
        achievements: [
          { id: "first-strike", name: "First Strike", unlocked: true, progress: 1 },
        ],
      };
    },
  },
});

let dbReady = true;
mock.module("../config/db.js", {
  namedExports: {
    isDbReady: () => dbReady,
  },
});

const { default: express } = await import("express");
const { signToken } = await import("../utils/jwt.js");
const { default: achievementsRoutes } = await import("./achievements.js");

let server;
let baseUrl;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/achievements", achievementsRoutes);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("GET /api/achievements/me", () => {
  test("rejects unauthenticated requests with 401", async () => {
    const res = await fetch(`${baseUrl}/api/achievements/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test("rejects an invalid/malformed token with 401", async () => {
    const res = await fetch(`${baseUrl}/api/achievements/me`, {
      headers: { Authorization: "Bearer not-a-real-token" },
    });
    assert.equal(res.status, 401);
  });

  test("authenticated request returns achievement data scoped to the token's userId", async () => {
    calls.length = 0;
    const token = signToken("user-aaa-111");
    const res = await fetch(`${baseUrl}/api/achievements/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.summary.currentStreak, 2);
    assert.equal(body.achievements[0].id, "first-strike");
    // The service was called with exactly the id from the verified JWT.
    assert.deepEqual(calls, ["user-aaa-111"]);
  });

  test("cross-user isolation: a different user's token yields a separate, independent call", async () => {
    calls.length = 0;
    const tokenA = signToken("user-aaa-111");
    const tokenB = signToken("user-bbb-222");

    await fetch(`${baseUrl}/api/achievements/me`, { headers: { Authorization: `Bearer ${tokenA}` } });
    await fetch(`${baseUrl}/api/achievements/me`, { headers: { Authorization: `Bearer ${tokenB}` } });

    assert.deepEqual(calls, ["user-aaa-111", "user-bbb-222"]);
    // Never the same id twice, never a mix-up between the two requests.
    assert.notEqual(calls[0], calls[1]);
  });

  test("database unavailable returns 503 with honest empty data, not fake stats", async () => {
    dbReady = false;
    const token = signToken("user-ccc-333");
    const res = await fetch(`${baseUrl}/api/achievements/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.summary.currentStreak, 0);
    assert.deepEqual(body.achievements, []);
    dbReady = true;
  });
});
