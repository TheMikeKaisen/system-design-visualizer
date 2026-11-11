import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubjectChannel } from "@prisma/client";
import {
  computeReleaseSignature,
  parseTimestamp,
  validateReleaseTimestamp,
  verifyReleaseSignatureDetailed,
  verifyReleaseSignature,
} from "@/lib/security/releaseSignature";
import {
  handlePublishEpisode,
  POST,
} from "@/app/api/internal/episodes/publish/route";

// ============================================================================
// Hoisted Mocks for Environment & DB
// ============================================================================

const { mockEnv, mockPrisma, mockSqsSend } = vi.hoisted(() => {
  const mockEnv = {
    NODE_ENV: "test" as const,
    DATABASE_URL: "postgresql://mock:5432/test",
    INTERNAL_RELEASE_SECRET: "mock_test_secret_32_characters_minimum_entropy_12345",
    SQS_FANOUT_QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/123456789012/test-fanout-queue",
  };

  const mockPrisma = {
    publishedEpisode: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockSqsSend = vi.fn();

  return { mockEnv, mockPrisma, mockSqsSend };
});

import { resetDefaultSqsClient } from "@/workers/sqs";

vi.mock("@/lib/env", () => ({ env: mockEnv }));
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: class {
    send = mockSqsSend;
  },
  SendMessageCommand: vi.fn(function (input) {
    return input;
  }),
}));

// ============================================================================
// Helper to build Signed Release Requests
// ============================================================================

const TEST_SECRET = "mock_test_secret_32_characters_minimum_entropy_12345";

function buildSignedRequest(options: {
  payload?: unknown;
  rawBody?: string;
  secret?: string;
  timestamp?: string | number | null;
  signature?: string;
  omitSignature?: boolean;
  omitTimestamp?: boolean;
  bound?: boolean;
  prefix?: boolean;
} = {}): Request {
  const secret = options.secret ?? TEST_SECRET;
  const nowSec = Math.floor(Date.now() / 1000);
  const timestamp =
    options.timestamp !== undefined
      ? options.timestamp !== null
        ? String(options.timestamp)
        : null
      : String(nowSec);

  const rawBody =
    options.rawBody !== undefined
      ? options.rawBody
      : JSON.stringify(
          options.payload ?? {
            subject: "JAVASCRIPT",
            episodeId: "event-loop-microtasks",
            episodeNumber: 1,
            title: "JavaScript Event Loop & Microtasks",
            releaseCommitSha: "a1b2c3d4e5f6789012345678901234567890abcd",
            summary: "Comprehensive guide to microtasks and rendering",
            keyConcepts: ["Event Loop", "Microtasks"],
            ctaUrl: "https://systemsimulator.io/javascript/event-loop",
          }
        );

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (!options.omitTimestamp && timestamp !== null) {
    headers["x-release-timestamp"] = timestamp;
  }

  if (!options.omitSignature) {
    let sig = options.signature;
    if (!sig) {
      sig = computeReleaseSignature({
        payload: rawBody,
        secret,
        timestamp,
        bound: options.bound ?? true,
        prefix: options.prefix ?? true,
      });
    }
    headers["x-release-signature"] = sig;
  }

  return new Request("http://localhost:3000/api/internal/episodes/publish", {
    method: "POST",
    headers,
    body: rawBody,
  });
}

// ============================================================================
// Test Suites
// ============================================================================

describe("Cryptographic Release Ingest Pipeline — Functional Suite", () => {
  beforeEach(() => {
    resetDefaultSqsClient();
    vi.clearAllMocks();
    mockSqsSend.mockResolvedValue({ MessageId: "sqs-msg-100" });
    mockPrisma.publishedEpisode.findUnique.mockResolvedValue(null);
    mockPrisma.publishedEpisode.upsert.mockResolvedValue({ id: "pub-1" });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Security Primitives Unit Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe("Security Utility: parseTimestamp", () => {
    it("parses 10-digit epoch seconds into milliseconds", () => {
      const ms = parseTimestamp("1730462400");
      expect(ms).toBe(1730462400000);
    });

    it("parses 13-digit epoch milliseconds", () => {
      const ms = parseTimestamp("1730462400000");
      expect(ms).toBe(1730462400000);
    });

    it("parses numeric epoch input", () => {
      expect(parseTimestamp(1730462400)).toBe(1730462400000);
      expect(parseTimestamp(1730462400000)).toBe(1730462400000);
    });

    it("parses ISO-8601 UTC date string", () => {
      const iso = "2026-11-01T12:00:00.000Z";
      const expected = Date.parse(iso);
      expect(parseTimestamp(iso)).toBe(expected);
    });

    it("returns null for malformed, negative, or invalid timestamps", () => {
      expect(parseTimestamp("")).toBeNull();
      expect(parseTimestamp("   ")).toBeNull();
      expect(parseTimestamp(null)).toBeNull();
      expect(parseTimestamp(undefined)).toBeNull();
      expect(parseTimestamp("not-a-date")).toBeNull();
      expect(parseTimestamp("NaN")).toBeNull();
      expect(parseTimestamp(-100)).toBeNull();
    });
  });

  describe("Security Utility: validateReleaseTimestamp", () => {
    const fixedNow = 1730462400000; // Reference epoch ms

    it("accepts timestamp within the 5-minute tolerance window", () => {
      const validHeader = String(Math.floor((fixedNow - 60_000) / 1000));
      const res = validateReleaseTimestamp(validHeader, 300, fixedNow);
      expect(res.valid).toBe(true);
      expect(res.status).toBe(200);
    });

    it("accepts boundary timestamp at exactly 300s in the past", () => {
      const past300s = String(Math.floor((fixedNow - 300_000) / 1000));
      const res = validateReleaseTimestamp(past300s, 300, fixedNow);
      expect(res.valid).toBe(true);
      expect(res.status).toBe(200);
    });

    it("accepts boundary timestamp at exactly 300s in the future (clock skew)", () => {
      const future300s = String(Math.floor((fixedNow + 300_000) / 1000));
      const res = validateReleaseTimestamp(future300s, 300, fixedNow);
      expect(res.valid).toBe(true);
      expect(res.status).toBe(200);
    });

    it("rejects timestamp at 301s in the past (expired / replay)", () => {
      const past301s = String(Math.floor((fixedNow - 301_000) / 1000));
      const res = validateReleaseTimestamp(past301s, 300, fixedNow);
      expect(res.valid).toBe(false);
      expect(res.status).toBe(401);
      expect(res.error).toContain("replay detected");
    });

    it("rejects timestamp at 301s in the future (clock skew)", () => {
      const future301s = String(Math.floor((fixedNow + 301_000) / 1000));
      const res = validateReleaseTimestamp(future301s, 300, fixedNow);
      expect(res.valid).toBe(false);
      expect(res.status).toBe(401);
      expect(res.error).toContain("clock skew exceeds tolerance");
    });

    it("rejects missing timestamp with status 400", () => {
      const res = validateReleaseTimestamp(null, 300, fixedNow);
      expect(res.valid).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain("Missing required x-release-timestamp");
    });

    it("rejects invalid timestamp string with status 400", () => {
      const res = validateReleaseTimestamp("invalid-timestamp-value", 300, fixedNow);
      expect(res.valid).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain("Invalid x-release-timestamp format");
    });
  });

  describe("Security Utility: verifyReleaseSignatureDetailed", () => {
    it("returns valid true for genuine HMAC-SHA256 signature with sha256= prefix", () => {
      const payload = JSON.stringify({ test: "data" });
      const nowSec = Math.floor(Date.now() / 1000);
      const sig = computeReleaseSignature({
        payload,
        secret: TEST_SECRET,
        timestamp: nowSec,
        prefix: true,
      });

      const res = verifyReleaseSignatureDetailed({
        payload,
        headers: {
          "x-release-timestamp": String(nowSec),
          "x-release-signature": sig,
        },
        secret: TEST_SECRET,
      });

      expect(res.valid).toBe(true);
      expect(res.status).toBe(200);
      expect(verifyReleaseSignature({
        payload,
        headers: {
          "x-release-timestamp": String(nowSec),
          "x-release-signature": sig,
        },
        secret: TEST_SECRET,
      })).toBe(true);
    });

    it("accepts raw hex signature without sha256= prefix", () => {
      const payload = JSON.stringify({ test: "data" });
      const nowSec = Math.floor(Date.now() / 1000);
      const rawHex = computeReleaseSignature({
        payload,
        secret: TEST_SECRET,
        timestamp: nowSec,
        prefix: false,
      });

      const res = verifyReleaseSignatureDetailed({
        payload,
        headers: {
          "x-release-timestamp": String(nowSec),
          "x-release-signature": rawHex,
        },
        secret: TEST_SECRET,
      });

      expect(res.valid).toBe(true);
      expect(res.status).toBe(200);
    });

    it("accepts uppercase SHA256= prefix and hex", () => {
      const payload = JSON.stringify({ test: "data" });
      const nowSec = Math.floor(Date.now() / 1000);
      const rawHex = computeReleaseSignature({
        payload,
        secret: TEST_SECRET,
        timestamp: nowSec,
        prefix: false,
      }).toUpperCase();

      const res = verifyReleaseSignatureDetailed({
        payload,
        headers: {
          "x-release-timestamp": String(nowSec),
          "x-release-signature": `SHA256=${rawHex}`,
        },
        secret: TEST_SECRET,
      });

      expect(res.valid).toBe(true);
      expect(res.status).toBe(200);
    });

    it("supports secret rotation with multiple space/comma separated signatures", () => {
      const payload = JSON.stringify({ test: "rotation" });
      const nowSec = Math.floor(Date.now() / 1000);
      const oldSecretSig = computeReleaseSignature({
        payload,
        secret: "old_secret_that_has_been_retired_12345",
        timestamp: nowSec,
      });
      const newSecretSig = computeReleaseSignature({
        payload,
        secret: TEST_SECRET,
        timestamp: nowSec,
      });

      const multiSigHeader = `${oldSecretSig}, ${newSecretSig}`;
      const res = verifyReleaseSignatureDetailed({
        payload,
        headers: {
          "x-release-timestamp": String(nowSec),
          "x-release-signature": multiSigHeader,
        },
        secret: TEST_SECRET,
      });

      expect(res.valid).toBe(true);
      expect(res.status).toBe(200);
    });

    it("returns status 500 when server secret is empty or missing", () => {
      const res = verifyReleaseSignatureDetailed({
        payload: "{}",
        headers: { "x-release-timestamp": "123", "x-release-signature": "abc" },
        secret: "",
      });
      expect(res.valid).toBe(false);
      expect(res.status).toBe(500);
      expect(res.error).toContain("Internal release secret is not configured");
    });

    it("rejects unbound signatures (HMAC over payload alone) to prevent replay bypass (SEC-04)", () => {
      const payload = JSON.stringify({ test: "unbound-replay-attempt" });
      const nowSec = Math.floor(Date.now() / 1000);
      const unboundSig = computeReleaseSignature({
        payload,
        secret: TEST_SECRET,
        timestamp: nowSec,
        bound: false, // computes HMAC(payload) without binding timestamp
      });

      const res = verifyReleaseSignatureDetailed({
        payload,
        headers: {
          "x-release-timestamp": String(nowSec),
          "x-release-signature": unboundSig,
        },
        secret: TEST_SECRET,
      });

      expect(res.valid).toBe(false);
      expect(res.status).toBe(401);
      expect(res.error).toBe("Signature mismatch");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Ingest Route Functional Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe("Ingest Endpoint: Happy Path & Payload Normalization", () => {
    it("rejects ctaUrl containing javascript: pseudo-protocol (URL Hardening)", async () => {
      const req = buildSignedRequest({
        payload: {
          subject: "JAVASCRIPT",
          episodeId: "xss-test",
          episodeNumber: 1,
          title: "XSS Ingestion Attempt",
          releaseCommitSha: "a1b2c3d4e5f6789012345678901234567890abcd",
          ctaUrl: "javascript:alert(1)",
        },
      });

      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("ctaUrl");
    });
    it("HP-01: successfully enqueues to SQS and records PublishedEpisode in DB", async () => {
      const enqueueMock = vi.fn().mockResolvedValue("msg-12345");
      const req = buildSignedRequest();

      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("msg-12345");
      expect(json.episodeId).toBe("event-loop-microtasks");
      expect(json.subject).toBe(SubjectChannel.JAVASCRIPT);

      // Verify SQS was called with validated data
      expect(enqueueMock).toHaveBeenCalledTimes(1);
      const [sqsPayload] = enqueueMock.mock.calls[0];
      expect(sqsPayload.episodeId).toBe("event-loop-microtasks");
      expect(sqsPayload.subject).toBe(SubjectChannel.JAVASCRIPT);
      expect(sqsPayload.episodeNumber).toBe(1);
      expect(sqsPayload.releaseCommitSha).toBe("a1b2c3d4e5f6789012345678901234567890abcd");

      // Verify DB upsert was called with operational fields
      expect(mockPrisma.publishedEpisode.upsert).toHaveBeenCalledTimes(1);
      expect(mockPrisma.publishedEpisode.upsert).toHaveBeenCalledWith({
        where: {
          subject_episodeId: {
            subject: SubjectChannel.JAVASCRIPT,
            episodeId: "event-loop-microtasks",
          },
        },
        update: {
          episodeNumber: 1,
          title: "JavaScript Event Loop & Microtasks",
          releaseCommitSha: "a1b2c3d4e5f6789012345678901234567890abcd",
        },
        create: {
          subject: SubjectChannel.JAVASCRIPT,
          episodeId: "event-loop-microtasks",
          episodeNumber: 1,
          title: "JavaScript Event Loop & Microtasks",
          releaseCommitSha: "a1b2c3d4e5f6789012345678901234567890abcd",
          totalRecipients: 0,
          dispatchedAt: null,
        },
      });
    });

    it("HP-02: preserves optional summary, keyConcepts, and ctaUrl in SQS payload", async () => {
      const enqueueMock = vi.fn().mockResolvedValue("msg-opt-1");
      const payload = {
        subject: "OPERATING_SYSTEMS",
        episodeId: "virtual-memory-paging",
        episodeNumber: 4,
        title: "Virtual Memory & Paging",
        releaseCommitSha: "b2c3d4e5f6a1789012345678901234567890bcde",
        summary: "In-depth look at TLBs, page faults, and page table walks.",
        keyConcepts: ["Paging", "TLB", "Page Fault"],
        ctaUrl: "https://systemsimulator.io/os/paging",
      };

      const req = buildSignedRequest({ payload });
      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(200);
      expect(enqueueMock).toHaveBeenCalledTimes(1);
      const [sqsPayload] = enqueueMock.mock.calls[0];
      expect(sqsPayload.summary).toBe("In-depth look at TLBs, page faults, and page table walks.");
      expect(sqsPayload.keyConcepts).toEqual(["Paging", "TLB", "Page Fault"]);
      expect(sqsPayload.ctaUrl).toBe("https://systemsimulator.io/os/paging");
    });

    it("HP-03: coerces empty ctaUrl: '' to undefined", async () => {
      const enqueueMock = vi.fn().mockResolvedValue("msg-cta-empty");
      const payload = {
        subject: "COMPUTER_NETWORKS",
        episodeId: "tcp-handshake",
        episodeNumber: 2,
        title: "TCP 3-Way Handshake",
        releaseCommitSha: "c3d4e5f6a1b2789012345678901234567890cdef",
        ctaUrl: "",
      };

      const req = buildSignedRequest({ payload });
      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(200);
      expect(enqueueMock).toHaveBeenCalledTimes(1);
      const [sqsPayload] = enqueueMock.mock.calls[0];
      expect(sqsPayload.ctaUrl).toBeUndefined();
    });

    it("HP-04: normalizes kebab-case and lowercase subjects (e.g. computer-networks -> COMPUTER_NETWORKS)", async () => {
      const enqueueMock = vi.fn().mockResolvedValue("msg-kebab");
      const payload = {
        subject: "computer-networks",
        episodeId: "dns-resolution",
        episodeNumber: 3,
        title: "DNS Resolution Flow",
        releaseCommitSha: "d4e5f6a1b2c3789012345678901234567890defa",
      };

      const req = buildSignedRequest({ payload });
      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(200);
      const [sqsPayload] = enqueueMock.mock.calls[0];
      expect(sqsPayload.subject).toBe(SubjectChannel.COMPUTER_NETWORKS);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Fast-Path Idempotency & Force Override
  // ──────────────────────────────────────────────────────────────────────────

  describe("Ingest Endpoint: Idempotency", () => {
    it("ID-01: skips SQS enqueue if episode was already dispatched and force is false", async () => {
      const alreadyDispatchedDate = new Date("2026-10-31T10:00:00Z");
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "pub-existing",
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "event-loop-microtasks",
        dispatchedAt: alreadyDispatchedDate,
      });

      const enqueueMock = vi.fn();
      const req = buildSignedRequest();

      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe("already_published");
      expect(json.alreadyDispatched).toBe(true);

      // Enqueue and Upsert must NOT have been called
      expect(enqueueMock).not.toHaveBeenCalled();
      expect(mockPrisma.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("ID-02: forces re-dispatch to SQS if force: true is provided on already-dispatched episode", async () => {
      const alreadyDispatchedDate = new Date("2026-10-31T10:00:00Z");
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "pub-existing",
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "event-loop-microtasks",
        dispatchedAt: alreadyDispatchedDate,
      });

      const enqueueMock = vi.fn().mockResolvedValue("msg-force-1");
      const payload = {
        subject: "JAVASCRIPT",
        episodeId: "event-loop-microtasks",
        episodeNumber: 1,
        title: "JavaScript Event Loop & Microtasks",
        releaseCommitSha: "a1b2c3d4e5f6789012345678901234567890abcd",
        force: true,
      };

      const req = buildSignedRequest({ payload });
      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("msg-force-1");
      expect(enqueueMock).toHaveBeenCalledTimes(1);
      expect(mockPrisma.publishedEpisode.upsert).toHaveBeenCalledTimes(1);
    });

    it("ID-03: continues to SQS enqueue if read-only idempotency check throws a DB error", async () => {
      mockPrisma.publishedEpisode.findUnique.mockRejectedValue(
        new Error("Connection pool timeout on read")
      );

      const enqueueMock = vi.fn().mockResolvedValue("msg-db-read-fail");
      const req = buildSignedRequest();

      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
      });

      // Intake must succeed despite DB read error!
      expect(res.status).toBe(200);
      expect(enqueueMock).toHaveBeenCalledTimes(1);
    });

    it("ID-04: in-flight protection skips duplicate SQS enqueue under CI/CD retries", async () => {
      const nowMs = 1730620000000;
      // Episode enqueued 15 seconds ago, currently in-flight (dispatchedAt is null)
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "pub-in-flight",
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "event-loop-microtasks",
        publishedAt: new Date(nowMs - 15000),
        dispatchedAt: null,
      });

      const enqueueMock = vi.fn();
      const req = buildSignedRequest({ timestamp: Math.floor(nowMs / 1000) });

      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
        now: nowMs,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.alreadyQueued).toBe(true);
      expect(enqueueMock).not.toHaveBeenCalled();
      expect(mockPrisma.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("ID-05: in-flight override allows forced re-enqueue when force: true", async () => {
      const nowMs = 1730620000000;
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "pub-in-flight",
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "event-loop-microtasks",
        publishedAt: new Date(nowMs - 15000),
        dispatchedAt: null,
      });

      const enqueueMock = vi.fn().mockResolvedValue("msg-force-override");
      const req = buildSignedRequest({
        timestamp: Math.floor(nowMs / 1000),
        payload: {
          subject: "JAVASCRIPT",
          episodeId: "event-loop-microtasks",
          episodeNumber: 1,
          title: "JavaScript Event Loop & Microtasks",
          releaseCommitSha: "a1b2c3d4e5f6789012345678901234567890abcd",
          force: true,
        },
      });

      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
        now: nowMs,
      });

      expect(res.status).toBe(200);
      expect(enqueueMock).toHaveBeenCalledTimes(1);
      expect(mockPrisma.publishedEpisode.upsert).toHaveBeenCalledTimes(1);
    });

    it("ID-06: allows SQS enqueue if un-dispatched record is older than 10m grace window", async () => {
      const nowMs = 1730620000000;
      // Stale record created 20 minutes ago without dispatchedAt
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "pub-stale",
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "event-loop-microtasks",
        publishedAt: new Date(nowMs - 20 * 60 * 1000),
        dispatchedAt: null,
      });

      const enqueueMock = vi.fn().mockResolvedValue("msg-stale-recovered");
      const req = buildSignedRequest({ timestamp: Math.floor(nowMs / 1000) });

      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
        now: nowMs,
      });

      expect(res.status).toBe(200);
      expect(enqueueMock).toHaveBeenCalledTimes(1);
      expect(mockPrisma.publishedEpisode.upsert).toHaveBeenCalledTimes(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Critical SQS-First Safe Ordering Architecture
  // ──────────────────────────────────────────────────────────────────────────

  describe("Ingest Endpoint: SQS-First Safe Ordering & Resilience", () => {
    it("CHAOS-01: returns 500 when SQS enqueue fails, and NEVER touches PostgreSQL", async () => {
      const enqueueMock = vi.fn().mockRejectedValue(new Error("AWS SQS connection refused"));
      const req = buildSignedRequest();

      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("Failed to enqueue release notification event to SQS");

      // Critical architecture invariant: PostgreSQL must NEVER be updated on SQS failure!
      expect(mockPrisma.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CHAOS-02: returns 202 Accepted when DB upsert fails post-SQS, deferring upsert to Lambda worker", async () => {
      const enqueueMock = vi.fn().mockResolvedValue("msg-sqs-durable-persisted");
      mockPrisma.publishedEpisode.upsert.mockRejectedValue(
        new Error("PostgreSQL write connection exhausted")
      );

      const req = buildSignedRequest();
      const res = await handlePublishEpisode(req, {
        secret: TEST_SECRET,
        enqueueFanout: enqueueMock,
      });

      // Status must be 202 Accepted, not 500 (avoids CI/CD duplicate retry)
      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("msg-sqs-durable-persisted");
      expect(json.warning).toBe("Database record creation deferred to Lambda worker.");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Next.js App Router POST Entrypoint
  // ──────────────────────────────────────────────────────────────────────────

  describe("HTTP POST Entrypoint Delegation", () => {
    it("delegates to handlePublishEpisode via POST export", async () => {
      const req = buildSignedRequest();
      const res = await POST(req);
      expect([200, 202]).toContain(res.status);
    });
  });
});
