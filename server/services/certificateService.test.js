import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateCertificateId, isValidObjectId, toPublicCertificate } from "./certificateService.js";
import { CERTIFICATE_ID_PATTERN } from "../models/Certificate.js";

describe("generateCertificateId", () => {
  test("matches the public TF-<year>-<8 hex> format", () => {
    const id = generateCertificateId(new Date("2026-09-14T12:00:00.000Z"));
    assert.match(id, CERTIFICATE_ID_PATTERN);
    assert.equal(id.startsWith("TF-2026-"), true);
    assert.equal(id.length, "TF-2026-XXXXXXXX".length);
  });

  test("uses the UTC year of the supplied date, not the local one", () => {
    const id = generateCertificateId(new Date("2027-01-01T00:00:00.000Z"));
    assert.equal(id.startsWith("TF-2027-"), true);
  });

  test("is collision-resistant across many generations", () => {
    const ids = new Set();
    for (let i = 0; i < 2000; i += 1) {
      ids.add(generateCertificateId());
    }
    // Every id should be unique — a collision here would indicate a
    // broken random source, not just bad luck (8 hex chars is a
    // 32-bit space).
    assert.equal(ids.size, 2000);
  });

  test("never collides with a MongoDB ObjectId shape", () => {
    const id = generateCertificateId();
    // A real ObjectId is 24 lowercase hex characters with no dashes or
    // prefix — structurally impossible to confuse with our format,
    // which is the point (Phase 10 spec: never expose an ObjectId
    // directly as the public certificate id).
    assert.equal(/^[0-9a-f]{24}$/.test(id), false);
  });
});

describe("isValidObjectId", () => {
  test("accepts a well-formed 24-char hex ObjectId", () => {
    assert.equal(isValidObjectId("64f1c2a2e4b0a1b2c3d4e5f6"), true);
  });

  test("rejects a certificate id, empty string, non-string, and garbage", () => {
    assert.equal(isValidObjectId("TF-2026-9F3C2A7B"), false);
    assert.equal(isValidObjectId(""), false);
    assert.equal(isValidObjectId(undefined), false);
    assert.equal(isValidObjectId(null), false);
    assert.equal(isValidObjectId(12345), false);
    assert.equal(isValidObjectId("not-an-id"), false);
  });
});

describe("toPublicCertificate", () => {
  test("includes only certificate-safe fields", () => {
    const cert = {
      certificateId: "TF-2026-ABCD1234",
      userId: "64f1c2a2e4b0a1b2c3d4e5f6",
      resultId: "64f1c2a2e4b0a1b2c3d4e5f7",
      userNameSnapshot: "Ada Lovelace",
      wpm: 104,
      accuracy: 98.7,
      errors: 3,
      durationSeconds: 30,
      mode: "words",
      issuedAt: new Date("2026-09-14T00:00:00.000Z"),
      _id: "64f1c2a2e4b0a1b2c3d4e5f8",
      __v: 0,
    };

    const publicShape = toPublicCertificate(cert);

    assert.deepEqual(publicShape, {
      certificateId: "TF-2026-ABCD1234",
      name: "Ada Lovelace",
      wpm: 104,
      accuracy: 98.7,
      errors: 3,
      durationSeconds: 30,
      mode: "words",
      issuedAt: cert.issuedAt,
    });

    // Never leaks internal identifiers, even by accident.
    assert.equal("userId" in publicShape, false);
    assert.equal("resultId" in publicShape, false);
    assert.equal("_id" in publicShape, false);
    assert.equal("__v" in publicShape, false);
  });
});
