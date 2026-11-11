import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import {
  computeReleaseSignature,
  validateReleaseTimestamp,
  verifyReleaseSignatureDetailed,
  verifyReleaseSignature,
} from "@/lib/security/releaseSignature";
import {
  handlePublishEpisode,
  type PublishEpisodePayload,
} from "@/app/api/internal/episodes/publish/route";

// ============================================================================
// Mocks & Setup
// ============================================================================

const { mockEnv, mockPrisma, mockSqsSend } = vi.hoisted(() => {
  const mockEnv = {
    NODE_ENV: "test" as const,
    DATABASE_URL: "postgresql://mock:5432/test",
    INTERNAL_RELEASE_SECRET: "challenger_m5_secret_entropy_32_characters_minimum_12345",
    SQS_FANOUT_QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/123456789012/challenger-queue",
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

const CHALLENGER_SECRET = "challenger_m5_secret_entropy_32_characters_minimum_12345";
const FIXED_T0_MS = 1730462400000; // 2024-11-01T12:00:00.000Z
const FIXED_T0_SEC = 1730462400;

const SAMPLE_PAYLOAD: PublishEpisodePayload = {
  subject: "BACKEND",
  episodeId: "distributed-caching-patterns",
  episodeNumber: 42,
  title: "Distributed Caching & Invalidation Patterns",
  releaseCommitSha: "deadbeefcafe1234567890abcdef1234567890ab",
  summary: "Comprehensive study of cache-aside, write-through, and CDN caching.",
  keyConcepts: ["Cache-Aside", "Write-Through", "Thundering Herd"],
  ctaUrl: "https://systemsimulator.io/backend/distributed-caching",
  force: false,
};

function createPublishRequest(options: {
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
  const secret = options.secret ?? CHALLENGER_SECRET;
  const rawBody =
    options.rawBody !== undefined
      ? options.rawBody
      : JSON.stringify(options.payload ?? SAMPLE_PAYLOAD);

  const timestampStr =
    options.timestamp !== undefined
      ? options.timestamp !== null
        ? String(options.timestamp)
        : null
      : String(FIXED_T0_SEC);

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (!options.omitTimestamp && timestampStr !== null) {
    headers["x-release-timestamp"] = timestampStr;
  }

  if (!options.omitSignature) {
    if (options.signature !== undefined) {
      headers["x-release-signature"] = options.signature;
    } else {
      headers["x-release-signature"] = computeReleaseSignature({
        payload: rawBody,
        secret,
        timestamp: timestampStr,
        bound: options.bound ?? true,
        prefix: options.prefix ?? true,
      });
    }
  }

  return new Request("http://localhost:3000/api/internal/episodes/publish", {
    method: "POST",
    headers,
    body: rawBody,
  });
}

// ============================================================================
// CHALLENGER M5-1 EMPIRICAL ADVERSARIAL TEST SUITE
// ============================================================================

describe("Challenger M5-1: Cryptographic Release Ingest Stress & Chaos Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSqsSend.mockResolvedValue({ MessageId: "challenger-sqs-msg-id" });
    mockPrisma.publishedEpisode.findUnique.mockResolvedValue(null);
    mockPrisma.publishedEpisode.upsert.mockResolvedValue({ id: "challenger-record-id" });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 1. TIMING ATTACK RESISTANCE & BUFFER LENGTH VARIATIONS
  // ══════════════════════════════════════════════════════════════════════════

  describe("1. Timing Attack Resistance & Buffer Length Variations", () => {
    const rawBody = JSON.stringify(SAMPLE_PAYLOAD);
    const testLengths = [0, 1, 15, 31, 32, 33, 63, 64, 65, 128];

    testLengths.forEach((len) => {
      it(`length ${len}: rejects without RangeError DoS (both raw and prefixed)`, async () => {
        const rawHex = "a".repeat(len);
        const prefixed = `sha256=${rawHex}`;

        for (const candidate of [rawHex, prefixed]) {
          // Direct API test
          const directResult = verifyReleaseSignatureDetailed({
            payload: rawBody,
            headers: {
              "x-release-timestamp": String(FIXED_T0_SEC),
              "x-release-signature": candidate,
            },
            secret: CHALLENGER_SECRET,
            now: FIXED_T0_MS,
          });

          // len 64 with all 'a's is valid hex format but incorrect digest -> 401 Signature mismatch
          // all other lengths are invalid hex format -> 401 Invalid signature format
          expect(directResult.valid).toBe(false);
          expect(directResult.status).toBe(401);
          expect(directResult.error).toBeDefined();

          // HTTP route test
          const req = createPublishRequest({
            rawBody,
            timestamp: FIXED_T0_SEC,
            signature: candidate,
          });

          const enqueueMock = vi.fn();
          const response = await handlePublishEpisode(req, {
            secret: CHALLENGER_SECRET,
            enqueueFanout: enqueueMock,
            now: FIXED_T0_MS,
          });

          expect(response.status).toBe(401);
          const body = await response.json();
          expect(body.error).toBeDefined();
          expect(enqueueMock).not.toHaveBeenCalled();
          expect(mockPrisma.publishedEpisode.upsert).not.toHaveBeenCalled();
        }
      });
    });

    it("guards against odd-length hex strings without unhandled buffer parsing crash", async () => {
      const oddHexStrings = [
        "a",
        "abc",
        "abcdef1",
        "a".repeat(63),
        "f".repeat(65),
      ];

      for (const oddHex of oddHexStrings) {
        const directResult = verifyReleaseSignatureDetailed({
          payload: rawBody,
          headers: {
            "x-release-timestamp": String(FIXED_T0_SEC),
            "x-release-signature": `sha256=${oddHex}`,
          },
          secret: CHALLENGER_SECRET,
          now: FIXED_T0_MS,
        });

        expect(directResult.valid).toBe(false);
        expect(directResult.status).toBe(401);
        expect(directResult.error).toContain("Invalid signature format");
      }
    });

    it("guards against non-hex characters and symbols in 64-char strings", async () => {
      const nonHexCandidates = [
        "g".repeat(64), // Valid length 64, but 'g' is non-hex
        "z".repeat(64), // Valid length 64, but 'z' is non-hex
        "x".repeat(64),
        "!" + "a".repeat(63),
        "a".repeat(32) + " " + "a".repeat(31),
        "a".repeat(32) + "\x00" + "a".repeat(31), // null byte
        "a".repeat(32) + "🦀" + "a".repeat(30),   // unicode emoji
      ];

      for (const nonHex of nonHexCandidates) {
        const directResult = verifyReleaseSignatureDetailed({
          payload: rawBody,
          headers: {
            "x-release-timestamp": String(FIXED_T0_SEC),
            "x-release-signature": `sha256=${nonHex}`,
          },
          secret: CHALLENGER_SECRET,
          now: FIXED_T0_MS,
        });

        expect(directResult.valid).toBe(false);
        expect(directResult.status).toBe(401);
        expect(directResult.error).toContain("Invalid signature format");
      }
    });

    it("guards against massive signature payload denial-of-service (100KB string)", async () => {
      const massiveSig = "sha256=" + "a".repeat(100_000);
      const directResult = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: {
          "x-release-timestamp": String(FIXED_T0_SEC),
          "x-release-signature": massiveSig,
        },
        secret: CHALLENGER_SECRET,
        now: FIXED_T0_MS,
      });

      expect(directResult.valid).toBe(false);
      expect(directResult.status).toBe(401);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. PRECISION REPLAY BOUNDARY TESTING
  // ══════════════════════════════════════════════════════════════════════════

  describe("2. Precision Replay Boundary Testing (Past & Future Windows)", () => {
    const toleranceSeconds = 300; // 5 minutes

    describe("Past replay boundary: T0 - 299s (pass), T0 - 300s (pass), T0 - 301s (fail)", () => {
      it("T0 - 299s: passes replay check (299s <= 300s tolerance)", () => {
        const timestamp = FIXED_T0_SEC - 299;
        const result = validateReleaseTimestamp(
          String(timestamp),
          toleranceSeconds,
          FIXED_T0_MS
        );
        expect(result.valid).toBe(true);
        expect(result.status).toBe(200);
      });

      it("T0 - 300s: passes exact boundary (300s <= 300s tolerance)", () => {
        const timestamp = FIXED_T0_SEC - 300;
        const result = validateReleaseTimestamp(
          String(timestamp),
          toleranceSeconds,
          FIXED_T0_MS
        );
        expect(result.valid).toBe(true);
        expect(result.status).toBe(200);
      });

      it("T0 - 301s: FAILS boundary check (301s > 300s tolerance)", () => {
        const timestamp = FIXED_T0_SEC - 301;
        const result = validateReleaseTimestamp(
          String(timestamp),
          toleranceSeconds,
          FIXED_T0_MS
        );
        expect(result.valid).toBe(false);
        expect(result.status).toBe(401);
        expect(result.error).toContain("replay detected");
      });

      it("T0 - 300s - 1ms: FAILS with millisecond precision", () => {
        const timestampMs = FIXED_T0_MS - 300_001;
        const result = validateReleaseTimestamp(
          String(timestampMs),
          toleranceSeconds,
          FIXED_T0_MS
        );
        expect(result.valid).toBe(false);
        expect(result.status).toBe(401);
        expect(result.error).toContain("replay detected");
      });

      it("verifies HTTP route behavior at T0 - 300s (200 OK) vs T0 - 301s (401 Replay)", async () => {
        const enqueueMock = vi.fn().mockResolvedValue("msg-123");

        // Pass at T0 - 300s
        const validReq = createPublishRequest({
          timestamp: FIXED_T0_SEC - 300,
        });
        const validRes = await handlePublishEpisode(validReq, {
          secret: CHALLENGER_SECRET,
          enqueueFanout: enqueueMock,
          now: FIXED_T0_MS,
        });
        expect(validRes.status).toBe(200);
        expect(enqueueMock).toHaveBeenCalledTimes(1);

        // Fail at T0 - 301s
        const expiredReq = createPublishRequest({
          timestamp: FIXED_T0_SEC - 301,
        });
        const expiredRes = await handlePublishEpisode(expiredReq, {
          secret: CHALLENGER_SECRET,
          enqueueFanout: enqueueMock,
          now: FIXED_T0_MS,
        });
        expect(expiredRes.status).toBe(401);
        const expiredBody = await expiredRes.json();
        expect(expiredBody.error).toContain("replay detected");
        expect(enqueueMock).toHaveBeenCalledTimes(1); // unchanged
      });
    });

    describe("Future clock skew boundary: T0 + 299s (pass), T0 + 300s (pass), T0 + 301s (fail)", () => {
      it("T0 + 299s: passes future skew check (299s <= 300s tolerance)", () => {
        const timestamp = FIXED_T0_SEC + 299;
        const result = validateReleaseTimestamp(
          String(timestamp),
          toleranceSeconds,
          FIXED_T0_MS
        );
        expect(result.valid).toBe(true);
        expect(result.status).toBe(200);
      });

      it("T0 + 300s: passes exact future boundary (300s <= 300s tolerance)", () => {
        const timestamp = FIXED_T0_SEC + 300;
        const result = validateReleaseTimestamp(
          String(timestamp),
          toleranceSeconds,
          FIXED_T0_MS
        );
        expect(result.valid).toBe(true);
        expect(result.status).toBe(200);
      });

      it("T0 + 301s: FAILS future skew check (301s > 300s tolerance)", () => {
        const timestamp = FIXED_T0_SEC + 301;
        const result = validateReleaseTimestamp(
          String(timestamp),
          toleranceSeconds,
          FIXED_T0_MS
        );
        expect(result.valid).toBe(false);
        expect(result.status).toBe(401);
        expect(result.error).toContain("clock skew exceeds tolerance window");
      });

      it("T0 + 300s + 1ms: FAILS future skew with millisecond precision", () => {
        const timestampMs = FIXED_T0_MS + 300_001;
        const result = validateReleaseTimestamp(
          String(timestampMs),
          toleranceSeconds,
          FIXED_T0_MS
        );
        expect(result.valid).toBe(false);
        expect(result.status).toBe(401);
        expect(result.error).toContain("clock skew exceeds tolerance window");
      });

      it("verifies HTTP route behavior at T0 + 300s (200 OK) vs T0 + 301s (401 Clock Skew)", async () => {
        const enqueueMock = vi.fn().mockResolvedValue("msg-123");

        // Pass at T0 + 300s
        const validReq = createPublishRequest({
          timestamp: FIXED_T0_SEC + 300,
        });
        const validRes = await handlePublishEpisode(validReq, {
          secret: CHALLENGER_SECRET,
          enqueueFanout: enqueueMock,
          now: FIXED_T0_MS,
        });
        expect(validRes.status).toBe(200);
        expect(enqueueMock).toHaveBeenCalledTimes(1);

        // Fail at T0 + 301s
        const skewReq = createPublishRequest({
          timestamp: FIXED_T0_SEC + 301,
        });
        const skewRes = await handlePublishEpisode(skewReq, {
          secret: CHALLENGER_SECRET,
          enqueueFanout: enqueueMock,
          now: FIXED_T0_MS,
        });
        expect(skewRes.status).toBe(401);
        const skewBody = await skewRes.json();
        expect(skewBody.error).toContain("clock skew exceeds tolerance window");
        expect(enqueueMock).toHaveBeenCalledTimes(1); // unchanged
      });
    });

    describe("Multi-format timestamp precision (ISO-8601, Epoch Seconds, Epoch Milliseconds)", () => {
      it("validates boundary consistently across ISO-8601 strings", () => {
        const passIso = new Date(FIXED_T0_MS - 300_000).toISOString();
        const failIso = new Date(FIXED_T0_MS - 301_000).toISOString();

        expect(validateReleaseTimestamp(passIso, 300, FIXED_T0_MS).valid).toBe(true);
        expect(validateReleaseTimestamp(failIso, 300, FIXED_T0_MS).valid).toBe(false);
      });

      it("rejects non-date strings or corrupted formats with 400 Bad Request", () => {
        const invalidFormats = [
          "not-a-timestamp",
          "2024-99-99T99:99:99.999Z",
          "-1730462400",
          "NaN",
          "undefined",
          "null",
          "",
          "   ",
        ];

        for (const fmt of invalidFormats) {
          const res = validateReleaseTimestamp(fmt, 300, FIXED_T0_MS);
          expect(res.valid).toBe(false);
          expect(res.status).toBe(400);
        }
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. CRYPTOGRAPHIC TIMESTAMP BINDING INTEGRITY
  // ══════════════════════════════════════════════════════════════════════════

  describe("3. Cryptographic Timestamp Binding Integrity", () => {
    const rawBody = JSON.stringify(SAMPLE_PAYLOAD);

    it("prevents replay of expired signed message by substituting fresh timestamp in header", async () => {
      const expiredTimestamp = FIXED_T0_SEC - 600; // 10 minutes ago
      const freshTimestamp = FIXED_T0_SEC;         // Right now

      // Sender signs payload bound to expired timestamp
      const validExpiredSignature = computeReleaseSignature({
        payload: rawBody,
        secret: CHALLENGER_SECRET,
        timestamp: String(expiredTimestamp),
        bound: true,
      });

      // Attacker intercepts and attempts to forward with fresh timestamp
      const headers = {
        "x-release-timestamp": String(freshTimestamp),
        "x-release-signature": validExpiredSignature,
      };

      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers,
        secret: CHALLENGER_SECRET,
        now: FIXED_T0_MS,
      });

      // Because timestamp is bound in the digest, verifying with freshTimestamp must fail!
      expect(result.valid).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toContain("Signature mismatch");
    });

    it("rejects timestamp shifting within the valid window (T0 -> T0 + 10s)", async () => {
      const originalTimestamp = FIXED_T0_SEC;
      const shiftedTimestamp = FIXED_T0_SEC + 10;

      const boundSig = computeReleaseSignature({
        payload: rawBody,
        secret: CHALLENGER_SECRET,
        timestamp: String(originalTimestamp),
        bound: true,
      });

      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: {
          "x-release-timestamp": String(shiftedTimestamp),
          "x-release-signature": boundSig,
        },
        secret: CHALLENGER_SECRET,
        now: FIXED_T0_MS,
      });

      expect(result.valid).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toContain("Signature mismatch");
    });

    it("rejects request if timestamp header is omitted even if signature is validly computed", async () => {
      const sig = computeReleaseSignature({
        payload: rawBody,
        secret: CHALLENGER_SECRET,
        timestamp: String(FIXED_T0_SEC),
        bound: true,
      });

      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: {
          "x-release-signature": sig,
          // "x-release-timestamp" omitted!
        },
        secret: CHALLENGER_SECRET,
        now: FIXED_T0_MS,
      });

      expect(result.valid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain("Missing required x-release-timestamp header");
    });

    it("rejects formatting mutation of timestamp post-signing (e.g. numeric epoch vs ISO-8601)", async () => {
      const epochSec = FIXED_T0_SEC;
      const isoString = new Date(FIXED_T0_MS).toISOString();

      // Signed with epoch string
      const sigSignedWithEpoch = computeReleaseSignature({
        payload: rawBody,
        secret: CHALLENGER_SECRET,
        timestamp: String(epochSec),
        bound: true,
      });

      // Forwarded with ISO string
      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: {
          "x-release-timestamp": isoString,
          "x-release-signature": sigSignedWithEpoch,
        },
        secret: CHALLENGER_SECRET,
        now: FIXED_T0_MS,
      });

      // Raw byte binding rejects format mismatch
      expect(result.valid).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. MULTI-KEY ROTATION SCENARIOS
  // ══════════════════════════════════════════════════════════════════════════

  describe("4. Multi-Key Secret Rotation Scenarios", () => {
    const rawBody = JSON.stringify(SAMPLE_PAYLOAD);
    const SECRET_OLD = "secret_old_generation_32_characters_long_12345";
    const SECRET_NEW = "secret_new_generation_32_characters_long_67890";
    const SECRET_ROGUE = "secret_rogue_attacker_32_characters_long_00000";

    const sigOld = computeReleaseSignature({
      payload: rawBody,
      secret: SECRET_OLD,
      timestamp: String(FIXED_T0_SEC),
    });

    const sigNew = computeReleaseSignature({
      payload: rawBody,
      secret: SECRET_NEW,
      timestamp: String(FIXED_T0_SEC),
    });

    const sigRogue = computeReleaseSignature({
      payload: rawBody,
      secret: SECRET_ROGUE,
      timestamp: String(FIXED_T0_SEC),
    });

    it("accepts candidate list when 1st is valid and 2nd is invalid", () => {
      const header = `${sigNew}, ${sigRogue}`;
      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: {
          "x-release-timestamp": String(FIXED_T0_SEC),
          "x-release-signature": header,
        },
        secret: SECRET_NEW,
        now: FIXED_T0_MS,
      });

      expect(result.valid).toBe(true);
      expect(result.status).toBe(200);
    });

    it("accepts candidate list when 1st is invalid and 2nd is valid", () => {
      const header = `${sigRogue}, ${sigNew}`;
      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: {
          "x-release-timestamp": String(FIXED_T0_SEC),
          "x-release-signature": header,
        },
        secret: SECRET_NEW,
        now: FIXED_T0_MS,
      });

      expect(result.valid).toBe(true);
      expect(result.status).toBe(200);
    });

    it("accepts candidate list when 5th signature in a 5-item list is valid", () => {
      const fake1 = "sha256=" + "1".repeat(64);
      const fake2 = "sha256=" + "2".repeat(64);
      const fake3 = "sha256=" + "3".repeat(64);
      const fake4 = "sha256=" + "4".repeat(64);
      const header = `${fake1} ${fake2} ${fake3} ${fake4} ${sigNew}`;

      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: {
          "x-release-timestamp": String(FIXED_T0_SEC),
          "x-release-signature": header,
        },
        secret: SECRET_NEW,
        now: FIXED_T0_MS,
      });

      expect(result.valid).toBe(true);
      expect(result.status).toBe(200);
    });

    it("rejects candidate list when ALL signatures in the list are invalid", () => {
      const fake1 = "sha256=" + "1".repeat(64);
      const fake2 = "sha256=" + "2".repeat(64);
      const fake3 = "sha256=" + "3".repeat(64);
      const header = `${fake1}, ${fake2}, ${fake3}, ${sigRogue}`;

      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: {
          "x-release-timestamp": String(FIXED_T0_SEC),
          "x-release-signature": header,
        },
        secret: SECRET_NEW,
        now: FIXED_T0_MS,
      });

      expect(result.valid).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toContain("Signature mismatch");
    });

    it("handles dirty candidate lists containing malformed, truncated, and empty items alongside valid signature", () => {
      const dirtyHeader = `short, !!!, sha256=12345, ${sigNew}, sha256=${"g".repeat(64)},  `;

      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: {
          "x-release-timestamp": String(FIXED_T0_SEC),
          "x-release-signature": dirtyHeader,
        },
        secret: SECRET_NEW,
        now: FIXED_T0_MS,
      });

      expect(result.valid).toBe(true);
      expect(result.status).toBe(200);
    });

    it("supports zero-downtime secret rotation across fleet: dual signatures accepted by both old and new secret servers", async () => {
      // Producer signs with BOTH OLD and NEW secrets
      const dualSignatureHeader = `${sigOld}, ${sigNew}`;

      // Server A still running on OLD secret
      const serverAReq = createPublishRequest({
        rawBody,
        timestamp: FIXED_T0_SEC,
        signature: dualSignatureHeader,
      });
      const enqueueA = vi.fn().mockResolvedValue("msg-server-a");
      const resA = await handlePublishEpisode(serverAReq, {
        secret: SECRET_OLD,
        enqueueFanout: enqueueA,
        now: FIXED_T0_MS,
      });
      expect(resA.status).toBe(200);
      expect(enqueueA).toHaveBeenCalledTimes(1);

      // Server B upgraded to NEW secret
      const serverBReq = createPublishRequest({
        rawBody,
        timestamp: FIXED_T0_SEC,
        signature: dualSignatureHeader,
      });
      const enqueueB = vi.fn().mockResolvedValue("msg-server-b");
      const resB = await handlePublishEpisode(serverBReq, {
        secret: SECRET_NEW,
        enqueueFanout: enqueueB,
        now: FIXED_T0_MS,
      });
      expect(resB.status).toBe(200);
      expect(enqueueB).toHaveBeenCalledTimes(1);

      // Rogue server with unauthorized secret
      const serverRogueReq = createPublishRequest({
        rawBody,
        timestamp: FIXED_T0_SEC,
        signature: dualSignatureHeader,
      });
      const enqueueRogue = vi.fn();
      const resRogue = await handlePublishEpisode(serverRogueReq, {
        secret: SECRET_ROGUE,
        enqueueFanout: enqueueRogue,
        now: FIXED_T0_MS,
      });
      expect(resRogue.status).toBe(401);
      expect(enqueueRogue).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. DISTRIBUTED ARCHITECTURE & SQS-FIRST RESILIENCE
  // ══════════════════════════════════════════════════════════════════════════

  describe("5. Distributed Architecture & SQS-First Invariants", () => {
    it("ARCH-01: returns 500 when SQS throws, preserving PostgreSQL untouched", async () => {
      const enqueueFailingMock = vi
        .fn()
        .mockRejectedValue(new Error("AWS SQS Network Timeout / ETIMEDOUT"));

      const req = createPublishRequest();
      const response = await handlePublishEpisode(req, {
        secret: CHALLENGER_SECRET,
        enqueueFanout: enqueueFailingMock,
        now: FIXED_T0_MS,
      });

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toContain("Failed to enqueue release notification event to SQS");

      // CRITICAL ASSERTION: PostgreSQL upsert MUST NEVER be called when SQS fails
      expect(mockPrisma.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("ARCH-02: returns 202 Accepted when PostgreSQL fails post-SQS enqueue, preventing duplicate CI retries", async () => {
      const enqueueSuccessMock = vi.fn().mockResolvedValue("sqs-durable-id-999");
      mockPrisma.publishedEpisode.upsert.mockRejectedValue(
        new Error("PostgreSQL connection pool exhausted")
      );

      const req = createPublishRequest();
      const response = await handlePublishEpisode(req, {
        secret: CHALLENGER_SECRET,
        enqueueFanout: enqueueSuccessMock,
        now: FIXED_T0_MS,
      });

      expect(response.status).toBe(202);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("sqs-durable-id-999");
      expect(json.warning).toContain("Database record creation deferred to Lambda worker");
    });

    it("ARCH-03: fast-path skips SQS enqueue if episode was already dispatched and force=false", async () => {
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "existing-published-1",
        subject: "BACKEND",
        episodeId: "distributed-caching-patterns",
        dispatchedAt: new Date("2024-11-01T10:00:00.000Z"),
      });

      const enqueueMock = vi.fn();
      const req = createPublishRequest({
        payload: {
          ...SAMPLE_PAYLOAD,
          force: false,
        },
      });

      const response = await handlePublishEpisode(req, {
        secret: CHALLENGER_SECRET,
        enqueueFanout: enqueueMock,
        now: FIXED_T0_MS,
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.status).toBe("already_published");
      expect(json.alreadyDispatched).toBe(true);
      expect(enqueueMock).not.toHaveBeenCalled();
      expect(mockPrisma.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("ARCH-04: proceeds to SQS enqueue even if read-only idempotency DB check throws an error", async () => {
      mockPrisma.publishedEpisode.findUnique.mockRejectedValue(
        new Error("Prisma read socket hung up")
      );

      const enqueueMock = vi.fn().mockResolvedValue("sqs-recovery-msg-id");
      const req = createPublishRequest();

      const response = await handlePublishEpisode(req, {
        secret: CHALLENGER_SECRET,
        enqueueFanout: enqueueMock,
        now: FIXED_T0_MS,
      });

      expect(response.status).toBe(200);
      expect(enqueueMock).toHaveBeenCalledTimes(1);
      expect(mockPrisma.publishedEpisode.upsert).toHaveBeenCalledTimes(1);
    });

    it("ARCH-05: returns 500 when server secret is empty or missing", async () => {
      const enqueueMock = vi.fn();
      const req = createPublishRequest();

      const response = await handlePublishEpisode(req, {
        secret: "", // Empty secret
        enqueueFanout: enqueueMock,
        now: FIXED_T0_MS,
      });

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toContain("Internal release secret is not configured");
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("ARCH-06: returns 400 Bad Request on invalid subject channel enum", async () => {
      const enqueueMock = vi.fn();
      const req = createPublishRequest({
        payload: {
          ...SAMPLE_PAYLOAD,
          subject: "QUANTUM_COMPUTING", // Non-existent subject channel enum
        },
      });

      const response = await handlePublishEpisode(req, {
        secret: CHALLENGER_SECRET,
        enqueueFanout: enqueueMock,
        now: FIXED_T0_MS,
      });

      expect(response.status).toBe(400);
      expect(enqueueMock).not.toHaveBeenCalled();
    });

    it("ARCH-07: returns 400 Bad Request on malformed JSON body", async () => {
      const enqueueMock = vi.fn();
      const malformedBody = "{ invalid json: true, ";
      const req = createPublishRequest({
        rawBody: malformedBody,
      });

      const response = await handlePublishEpisode(req, {
        secret: CHALLENGER_SECRET,
        enqueueFanout: enqueueMock,
        now: FIXED_T0_MS,
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("Malformed JSON payload");
      expect(enqueueMock).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. HELPER & UTILITY ROBUSTNESS
  // ══════════════════════════════════════════════════════════════════════════

  describe("6. Helper & Utility Robustness", () => {
    it("verifyReleaseSignature convenience boolean predicate matches detailed result", () => {
      const rawBody = JSON.stringify(SAMPLE_PAYLOAD);
      const validSig = computeReleaseSignature({
        payload: rawBody,
        secret: CHALLENGER_SECRET,
        timestamp: String(FIXED_T0_SEC),
      });

      const valid = verifyReleaseSignature({
        payload: rawBody,
        headers: {
          "x-release-timestamp": String(FIXED_T0_SEC),
          "x-release-signature": validSig,
        },
        secret: CHALLENGER_SECRET,
        now: FIXED_T0_MS,
      });
      expect(valid).toBe(true);

      const invalid = verifyReleaseSignature({
        payload: rawBody,
        headers: {
          "x-release-timestamp": String(FIXED_T0_SEC),
          "x-release-signature": "sha256=" + "f".repeat(64),
        },
        secret: CHALLENGER_SECRET,
        now: FIXED_T0_MS,
      });
      expect(invalid).toBe(false);
    });

    it("computeReleaseSignature handles prefix=false and bound=false configurations", () => {
      const rawBody = JSON.stringify(SAMPLE_PAYLOAD);
      const rawHexNoPrefix = computeReleaseSignature({
        payload: rawBody,
        secret: CHALLENGER_SECRET,
        prefix: false,
        bound: false,
      });

      expect(rawHexNoPrefix.startsWith("sha256=")).toBe(false);
      expect(rawHexNoPrefix).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(rawHexNoPrefix)).toBe(true);

      const expectedManualHex = crypto
        .createHmac("sha256", CHALLENGER_SECRET)
        .update(rawBody, "utf8")
        .digest("hex");

      expect(rawHexNoPrefix).toBe(expectedManualHex);
    });
  });
});
