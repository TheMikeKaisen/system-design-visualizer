import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeReleaseSignature } from "@/lib/security/releaseSignature";
import { handlePublishEpisode } from "@/app/api/internal/episodes/publish/route";

// ============================================================================
// Hoisted Mocks for Environment & DB
// ============================================================================

const { mockEnv, mockPrisma, mockSqsSend } = vi.hoisted(() => {
  const mockEnv = {
    NODE_ENV: "test" as const,
    DATABASE_URL: "postgresql://mock:5432/test",
    INTERNAL_RELEASE_SECRET: "adversarial_test_secret_32_chars_minimum_entropy_12345",
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
// Adversarial Helper
// ============================================================================

const SERVER_SECRET = "adversarial_test_secret_32_chars_minimum_entropy_12345";

function createSignedRequest(options: {
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
  const secret = options.secret ?? SERVER_SECRET;
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
// Adversarial Test Suites
// ============================================================================

describe("Cryptographic Release Ingest Pipeline — Adversarial Chaos Suite", () => {
  beforeEach(() => {
    resetDefaultSqsClient();
    vi.clearAllMocks();
    mockSqsSend.mockResolvedValue({ MessageId: "sqs-msg-adversarial" });
    mockPrisma.publishedEpisode.findUnique.mockResolvedValue(null);
    mockPrisma.publishedEpisode.upsert.mockResolvedValue({ id: "pub-adv-1" });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Cryptographic HMAC Attack Vectors
  // ──────────────────────────────────────────────────────────────────────────

  describe("HMAC Attacks & Forgery Prevention", () => {
    it("CR-01: rejects signature signed with attacker-controlled wrong secret", async () => {
      const enqueueMock = vi.fn();
      const req = createSignedRequest({
        secret: "malicious_attacker_forged_secret_key_1234567890",
      });

      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Signature mismatch");
      expect(enqueueMock).not.toHaveBeenCalled();
      expect(mockPrisma.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CR-02: rejects 1-bit flip mutation in signature hex", async () => {
      const enqueueMock = vi.fn();
      const validReq = createSignedRequest();
      const validSig = validReq.headers.get("x-release-signature")!;

      // Mutate last character of signature hex: flip '0' to '1' or 'a' to 'b'
      const lastChar = validSig.slice(-1);
      const flippedChar = lastChar === "a" ? "b" : "a";
      const mutatedSig = validSig.slice(0, -1) + flippedChar;

      const req = createSignedRequest({ signature: mutatedSig });
      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Signature mismatch");
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("CR-03: rejects request when payload body is modified post-signing", async () => {
      const enqueueMock = vi.fn();
      const originalPayload = {
        subject: "JAVASCRIPT",
        episodeId: "event-loop-microtasks",
        episodeNumber: 1,
        title: "JavaScript Event Loop & Microtasks",
        releaseCommitSha: "a1b2c3d4e5f6789012345678901234567890abcd",
      };

      const nowSec = Math.floor(Date.now() / 1000);
      const originalBody = JSON.stringify(originalPayload);
      const signature = computeReleaseSignature({
        payload: originalBody,
        secret: SERVER_SECRET,
        timestamp: nowSec,
      });

      // Attacker tampers with the body by replacing the commit sha
      const tamperedPayload = {
        ...originalPayload,
        releaseCommitSha: "tampered_commit_sha_malicious_attacker",
      };
      const tamperedBody = JSON.stringify(tamperedPayload);

      const headers = {
        "content-type": "application/json",
        "x-release-timestamp": String(nowSec),
        "x-release-signature": signature,
      };

      const req = new Request("http://localhost:3000/api/internal/episodes/publish", {
        method: "POST",
        headers,
        body: tamperedBody,
      });

      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Signature mismatch");
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("CR-04: rejects request when x-release-signature header is omitted", async () => {
      const enqueueMock = vi.fn();
      const req = createSignedRequest({ omitSignature: true });

      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Missing required x-release-signature header");
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("CR-05: guards against RangeError DoS on short/truncated/malformed signature strings", async () => {
      const enqueueMock = vi.fn();
      const malformedSignatures = [
        "sha256=",
        "sha256=a",
        "sha256=12345",
        "sha256=abcdefabcdef",
        "sha256=" + "a".repeat(63), // 63 hex chars (1 short of 64)
        "sha256=" + "a".repeat(65), // 65 hex chars (1 over 64)
        "short",
        "123",
      ];

      for (const malformedSig of malformedSignatures) {
        const req = createSignedRequest({ signature: malformedSig });
        const res = await handlePublishEpisode(req, {
          secret: SERVER_SECRET,
          enqueueFanout: enqueueMock,
        });

        // Crucial: Must be 401 Unauthorized, NEVER 500 RangeError!
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toMatch(/Invalid signature format|Signature mismatch/);
      }

      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("CR-06: rejects non-hex malformed characters in signature without crashing", async () => {
      const enqueueMock = vi.fn();
      const nonHexSig = "sha256=ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ";
      const req = createSignedRequest({ signature: nonHexSig });

      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Invalid signature format");
      expect(enqueueMock).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Anti-Replay & Timestamp Tolerance Attack Vectors
  // ──────────────────────────────────────────────────────────────────────────

  describe("Anti-Replay Attack Vectors & Tolerance Window", () => {
    it("RP-01 & RP-02: accepts timestamps within the tolerance window (T0, T0 - 299s)", async () => {
      const enqueueMock = vi.fn().mockResolvedValue("msg-t0");
      const fixedNowMs = 1730462400000;
      const nowSec = Math.floor(fixedNowMs / 1000);

      // T0 - 299s (inside 5 min window)
      const tMinus299 = nowSec - 299;
      const req = createSignedRequest({ timestamp: tMinus299 });

      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
        now: fixedNowMs,
      });

      expect(res.status).toBe(200);
      expect(enqueueMock).toHaveBeenCalledTimes(1);
    });

    it("RP-03: accepts timestamp exactly on the 300s past boundary (T0 - 300s)", async () => {
      const enqueueMock = vi.fn().mockResolvedValue("msg-boundary-300");
      const fixedNowMs = 1730462400000;
      const nowSec = Math.floor(fixedNowMs / 1000);
      const tMinus300 = nowSec - 300;

      const req = createSignedRequest({ timestamp: tMinus300 });
      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
        now: fixedNowMs,
      });

      expect(res.status).toBe(200);
      expect(enqueueMock).toHaveBeenCalledTimes(1);
    });

    it("RP-04: rejects replay attack timestamp 1 second beyond tolerance window (T0 - 301s)", async () => {
      const enqueueMock = vi.fn();
      const fixedNowMs = 1730462400000;
      const nowSec = Math.floor(fixedNowMs / 1000);
      const tMinus301 = nowSec - 301;

      const req = createSignedRequest({ timestamp: tMinus301 });
      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
        now: fixedNowMs,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("replay detected");
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("RP-05: rejects historic captured replay (T0 - 3600s / 1 hour ago)", async () => {
      const enqueueMock = vi.fn();
      const fixedNowMs = 1730462400000;
      const nowSec = Math.floor(fixedNowMs / 1000);
      const tMinus1hr = nowSec - 3600;

      const req = createSignedRequest({ timestamp: tMinus1hr });
      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
        now: fixedNowMs,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("replay detected");
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("RP-06 & RP-07: accepts T0 + 299s, rejects clock skew beyond tolerance (T0 + 301s)", async () => {
      const enqueueMock = vi.fn().mockResolvedValue("msg-future");
      const fixedNowMs = 1730462400000;
      const nowSec = Math.floor(fixedNowMs / 1000);

      // Skew within tolerance (+299s)
      const reqValid = createSignedRequest({ timestamp: nowSec + 299 });
      const resValid = await handlePublishEpisode(reqValid, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
        now: fixedNowMs,
      });
      expect(resValid.status).toBe(200);

      // Skew beyond tolerance (+301s)
      const reqInvalid = createSignedRequest({ timestamp: nowSec + 301 });
      const resInvalid = await handlePublishEpisode(reqInvalid, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
        now: fixedNowMs,
      });
      expect(resInvalid.status).toBe(401);
      const json = await resInvalid.json();
      expect(json.error).toContain("clock skew exceeds tolerance window");
    });

    it("RP-08: rejects request with missing x-release-timestamp header (400 Bad Request)", async () => {
      const enqueueMock = vi.fn();
      const req = createSignedRequest({ omitTimestamp: true });

      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Missing required x-release-timestamp");
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("RP-09: rejects non-numeric/malformed x-release-timestamp header (400 Bad Request)", async () => {
      const enqueueMock = vi.fn();
      const invalidTimestamps = ["invalid-timestamp", "NaN", "undefined", "-99999", ""];

      for (const ts of invalidTimestamps) {
        const req = createSignedRequest({ timestamp: ts });
        const res = await handlePublishEpisode(req, {
          secret: SERVER_SECRET,
          enqueueFanout: enqueueMock,
        });

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("x-release-timestamp");
      }
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("RP-10: enforces timestamp binding invariant (attacker attaches fresh timestamp to old payload signature)", async () => {
      const enqueueMock = vi.fn();
      const nowSec = Math.floor(Date.now() / 1000);
      const oldTimestamp = nowSec - 3600;

      const payload = {
        subject: "JAVASCRIPT",
        episodeId: "event-loop-microtasks",
        episodeNumber: 1,
        title: "JavaScript Event Loop & Microtasks",
        releaseCommitSha: "a1b2c3d4e5f6789012345678901234567890abcd",
      };
      const rawBody = JSON.stringify(payload);

      // Valid signature created with oldTimestamp bound
      const oldSignature = computeReleaseSignature({
        payload: rawBody,
        secret: SERVER_SECRET,
        timestamp: oldTimestamp,
        bound: true,
      });

      // Attacker replays by spoofing a fresh timestamp header with the old bound signature
      const headers = {
        "content-type": "application/json",
        "x-release-timestamp": String(nowSec),
        "x-release-signature": oldSignature,
      };

      const req = new Request("http://localhost:3000/api/internal/episodes/publish", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      // Must fail signature verification because timestamp is cryptographically bound into HMAC!
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Signature mismatch");
      expect(enqueueMock).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Schema & Input Validation Adversarial Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe("Schema Validation & Poison Pill Defense", () => {
    it("VAL-01: rejects missing episodeId", async () => {
      const enqueueMock = vi.fn();
      const payload = {
        subject: "JAVASCRIPT",
        episodeNumber: 1,
        title: "JavaScript Event Loop",
        releaseCommitSha: "abc1234567890",
      };

      const req = createSignedRequest({ payload });
      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(400);
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("VAL-02: rejects empty episodeId: ''", async () => {
      const enqueueMock = vi.fn();
      const payload = {
        episodeId: "",
        subject: "JAVASCRIPT",
        episodeNumber: 1,
        title: "JavaScript Event Loop",
        releaseCommitSha: "abc1234567890",
      };

      const req = createSignedRequest({ payload });
      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(400);
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("VAL-03 & VAL-04: rejects negative or zero episodeNumber", async () => {
      const enqueueMock = vi.fn();

      for (const num of [-1, 0, -100]) {
        const payload = {
          episodeId: "ep-1",
          subject: "JAVASCRIPT",
          episodeNumber: num,
          title: "Title",
          releaseCommitSha: "sha123",
        };

        const req = createSignedRequest({ payload });
        const res = await handlePublishEpisode(req, {
          secret: SERVER_SECRET,
          enqueueFanout: enqueueMock,
        });

        expect(res.status).toBe(400);
      }
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("VAL-05: rejects empty title: ''", async () => {
      const enqueueMock = vi.fn();
      const payload = {
        episodeId: "ep-1",
        subject: "JAVASCRIPT",
        episodeNumber: 1,
        title: "",
        releaseCommitSha: "sha123",
      };

      const req = createSignedRequest({ payload });
      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(400);
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("VAL-06: rejects missing releaseCommitSha", async () => {
      const enqueueMock = vi.fn();
      const payload = {
        episodeId: "ep-1",
        subject: "JAVASCRIPT",
        episodeNumber: 1,
        title: "Title",
      };

      const req = createSignedRequest({ payload });
      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(400);
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("VAL-07: rejects invalid subject channel enum", async () => {
      const enqueueMock = vi.fn();
      const payload = {
        episodeId: "ep-1",
        subject: "QUANTUM_COMPUTING",
        episodeNumber: 1,
        title: "Title",
        releaseCommitSha: "sha123",
      };

      const req = createSignedRequest({ payload });
      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(400);
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("VAL-08: rejects malformed JSON payload", async () => {
      const enqueueMock = vi.fn();
      const malformedBody = "{ invalid json syntax: 123";
      const req = createSignedRequest({ rawBody: malformedBody });

      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Malformed JSON payload");
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("VAL-09: rejects empty request body", async () => {
      const enqueueMock = vi.fn();
      const req = createSignedRequest({ rawBody: "" });

      const res = await handlePublishEpisode(req, {
        secret: SERVER_SECRET,
        enqueueFanout: enqueueMock,
      });

      expect(res.status).toBe(400);
      expect(enqueueMock).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Configuration & Server Errors
  // ──────────────────────────────────────────────────────────────────────────

  describe("Configuration & Server State Guards", () => {
    it("CONF-01: returns 500 when INTERNAL_RELEASE_SECRET is empty string", async () => {
      const req = createSignedRequest();
      const res = await handlePublishEpisode(req, {
        secret: "",
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("Internal release secret is not configured");
    });
  });
});
