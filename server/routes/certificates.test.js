// Route-level integration test. Run with:
//   node --experimental-test-module-mocks --test server/routes/certificates.test.js
// Mocks the service + db layers so this exercises real Express routing,
// real JWT auth middleware, and real request/response wiring — without
// needing a live MongoDB connection. Same pattern as
// server/routes/achievements.test.js.
import { test, describe, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-certificates-route";

class CertificateError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "CertificateError";
    this.statusCode = statusCode;
  }
}

const createCalls = [];
const publicLookupCalls = [];
const historyCalls = [];

// Fixture certificate as it would come back from the (mocked) service —
// deliberately includes userId/resultId so the tests can prove the
// controller's public shape strips them, exactly like the real
// toPublicCertificate would.
function fixtureCertificate(overrides = {}) {
  return {
    certificateId: "TF-2026-AAAA1111",
    userId: "user-owner-111",
    resultId: "result-abc-111",
    userNameSnapshot: "Ada Lovelace",
    wpm: 104,
    accuracy: 98.7,
    errors: 3,
    durationSeconds: 30,
    mode: "words",
    issuedAt: "2026-09-14T00:00:00.000Z",
    ...overrides,
  };
}

let nextCreateResult = { certificate: fixtureCertificate(), created: true };
let nextCreateError = null;
let nextPublicCertificate = fixtureCertificate();
let nextHistory = [fixtureCertificate()];
let dbReady = true;

mock.module("../services/certificateService.js", {
  namedExports: {
    CertificateError,
    createCertificateForResult: async ({ userId, resultId }) => {
      createCalls.push({ userId, resultId });
      if (nextCreateError) throw nextCreateError;
      return nextCreateResult;
    },
    getCertificateByPublicId: async (certificateId) => {
      publicLookupCalls.push(certificateId);
      return nextPublicCertificate;
    },
    getCertificatesForUser: async (userId) => {
      historyCalls.push(userId);
      return nextHistory;
    },
    // The real implementation — this is pure/safe to exercise for
    // real rather than mock, and doing so proves the controller's
    // response actually strips userId/resultId.
    toPublicCertificate: (cert) => ({
      certificateId: cert.certificateId,
      name: cert.userNameSnapshot,
      wpm: cert.wpm,
      accuracy: cert.accuracy,
      errors: cert.errors,
      durationSeconds: cert.durationSeconds,
      mode: cert.mode,
      issuedAt: cert.issuedAt,
    }),
  },
});

mock.module("../config/db.js", {
  namedExports: {
    isDbReady: () => dbReady,
  },
});

const { default: express } = await import("express");
const { signToken } = await import("../utils/jwt.js");
const { default: certificateRoutes } = await import("./certificates.js");

let server;
let baseUrl;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/certificates", certificateRoutes);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("POST /api/certificates", () => {
  test("rejects unauthenticated requests with 401", async () => {
    const res = await fetch(`${baseUrl}/api/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId: "result-abc-111" }),
    });
    assert.equal(res.status, 401);
  });

  test("authenticated user can create a certificate for their own result", async () => {
    createCalls.length = 0;
    nextCreateError = null;
    nextCreateResult = { certificate: fixtureCertificate(), created: true };

    const token = signToken("user-owner-111");
    const res = await fetch(`${baseUrl}/api/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resultId: "result-abc-111" }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.created, true);
    assert.equal(body.certificate.certificateId, "TF-2026-AAAA1111");
    assert.equal(body.certificate.name, "Ada Lovelace");

    // Ownership was derived from the verified JWT, not from the body.
    assert.deepEqual(createCalls, [{ userId: "user-owner-111", resultId: "result-abc-111" }]);

    // Never exposes internal ids in the response.
    assert.equal("userId" in body.certificate, false);
    assert.equal("resultId" in body.certificate, false);
  });

  test("client-supplied userId/name/wpm are ignored — ownership always comes from the token", async () => {
    createCalls.length = 0;
    const token = signToken("user-owner-111");
    await fetch(`${baseUrl}/api/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        resultId: "result-abc-111",
        userId: "someone-else-999",
        name: "Not My Name",
        wpm: 999,
        accuracy: 100,
      }),
    });

    // Only { userId, resultId } ever reaches the service, and userId
    // is the token's — never the spoofed body value.
    assert.deepEqual(createCalls, [{ userId: "user-owner-111", resultId: "result-abc-111" }]);
  });

  test("cannot create a certificate for another user's result — service's 404 passes through untouched", async () => {
    nextCreateError = new CertificateError("Typing result not found.", 404);

    const token = signToken("user-attacker-222");
    const res = await fetch(`${baseUrl}/api/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resultId: "result-belongs-to-someone-else" }),
    });

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Typing result not found.");
    nextCreateError = null;
  });

  test("duplicate generation returns the existing certificate with a 200, not a new one", async () => {
    nextCreateError = null;
    nextCreateResult = { certificate: fixtureCertificate(), created: false };

    const token = signToken("user-owner-111");
    const res = await fetch(`${baseUrl}/api/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resultId: "result-abc-111" }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.created, false);
    assert.equal(body.certificate.certificateId, "TF-2026-AAAA1111");
  });

  test("database unavailable returns 503 rather than attempting creation", async () => {
    dbReady = false;
    createCalls.length = 0;
    const token = signToken("user-owner-111");
    const res = await fetch(`${baseUrl}/api/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resultId: "result-abc-111" }),
    });
    assert.equal(res.status, 503);
    assert.deepEqual(createCalls, []);
    dbReady = true;
  });
});

describe("GET /api/certificates/:certificateId (public)", () => {
  test("works without authentication", async () => {
    nextPublicCertificate = fixtureCertificate();
    const res = await fetch(`${baseUrl}/api/certificates/TF-2026-AAAA1111`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.certificate.certificateId, "TF-2026-AAAA1111");
  });

  test("never exposes private/internal information", async () => {
    nextPublicCertificate = fixtureCertificate();
    const res = await fetch(`${baseUrl}/api/certificates/TF-2026-AAAA1111`);
    const body = await res.json();
    const keys = Object.keys(body.certificate);
    assert.deepEqual(
      keys.sort(),
      ["accuracy", "certificateId", "durationSeconds", "errors", "issuedAt", "mode", "name", "wpm"].sort()
    );
    assert.equal("userId" in body.certificate, false);
    assert.equal("resultId" in body.certificate, false);
    assert.equal("email" in body.certificate, false);
    assert.equal("_id" in body.certificate, false);
  });

  test("invalid/unknown certificate id returns a clean 404", async () => {
    nextPublicCertificate = null;
    const res = await fetch(`${baseUrl}/api/certificates/TF-2026-DOESNOTEXIST`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    nextPublicCertificate = fixtureCertificate();
  });
});

describe("GET /api/certificates/me", () => {
  test("rejects unauthenticated requests with 401", async () => {
    const res = await fetch(`${baseUrl}/api/certificates/me`);
    assert.equal(res.status, 401);
  });

  test("returns only the authenticated user's own certificates", async () => {
    historyCalls.length = 0;
    nextHistory = [fixtureCertificate()];
    const token = signToken("user-owner-111");
    const res = await fetch(`${baseUrl}/api/certificates/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.certificates.length, 1);
    assert.deepEqual(historyCalls, ["user-owner-111"]);
  });

  test("cross-user isolation: a different user's token yields a separate, independent call", async () => {
    historyCalls.length = 0;
    const tokenA = signToken("user-aaa-111");
    const tokenB = signToken("user-bbb-222");

    await fetch(`${baseUrl}/api/certificates/me`, { headers: { Authorization: `Bearer ${tokenA}` } });
    await fetch(`${baseUrl}/api/certificates/me`, { headers: { Authorization: `Bearer ${tokenB}` } });

    assert.deepEqual(historyCalls, ["user-aaa-111", "user-bbb-222"]);
    assert.notEqual(historyCalls[0], historyCalls[1]);
  });
});
