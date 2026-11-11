import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeReleaseSignature } from "@/lib/security/releaseSignature";
import {
  handlePublishEpisode,
  POST,
} from "@/app/api/internal/episodes/publish/route";
import type { PrismaClient } from "@prisma/client";

// ============================================================================
// Hoisted Mocks for Environment, Database, and AWS SQS Client
// ============================================================================

const { mockEnv, mockPrisma, mockSqsSend } = vi.hoisted(() => {
  const mockEnv = {
    NODE_ENV: "test" as const,
    DATABASE_URL: "postgresql://challenger:5432/test",
    INTERNAL_RELEASE_SECRET: "challenger_m5_2_test_secret_32_chars_minimum_entropy_12345",
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
  SendMessageCommand: vi.fn(function (input: unknown) {
    return input;
  }),
}));

// ============================================================================
// Test Constants & Request Builders
// ============================================================================

const TEST_SECRET = "challenger_m5_2_test_secret_32_chars_minimum_entropy_12345";

function createSilentLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function buildSignedPublishRequest(options: {
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
// Challenger Test Suites: Chaos, Circuit-Breaking & Resilience
// ============================================================================

describe("Challenger M5-2: Ingest Chaos, SQS Circuit-Breaker & Secondary DB Resilience", () => {
  beforeEach(() => {
    resetDefaultSqsClient();
    vi.clearAllMocks();
    mockSqsSend.mockResolvedValue({ MessageId: "mock-sqs-message-100" });
    mockPrisma.publishedEpisode.findUnique.mockResolvedValue(null);
    mockPrisma.publishedEpisode.upsert.mockResolvedValue({ id: "pub-ep-100" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Suite 1: SQS Ingest Circuit-Breaker & Distributed Failure Modes
  // ==========================================================================
  describe("Suite 1: SQS Ingest Circuit-Breaker (Hard Failure Barrier)", () => {
    it("CHAOS-SQS-01: TCP connection timeout (ETIMEDOUT) -> returns 500 AND NEVER calls prisma.publishedEpisode.upsert", async () => {
      const silentLogger = createSilentLogger();
      const networkTimeoutErr = new Error("connect ETIMEDOUT 54.239.28.85:443");

      const enqueueFanout = vi.fn().mockRejectedValue(networkTimeoutErr);
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Failed to enqueue release notification event to SQS.");
      expect(json.details).toContain("connect ETIMEDOUT");

      // Verify strict invariant: database is NEVER modified
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
      expect(mockDb.publishedEpisode.create).not.toHaveBeenCalled();
      expect(mockDb.publishedEpisode.update).not.toHaveBeenCalled();
      expect(silentLogger.error).toHaveBeenCalled();
    });

    it("CHAOS-SQS-02: TCP connection refused (ECONNREFUSED) -> returns 500 AND NEVER touches DB", async () => {
      const silentLogger = createSilentLogger();
      const connRefusedErr = new Error("connect ECONNREFUSED 127.0.0.1:4566");

      const enqueueFanout = vi.fn().mockRejectedValue(connRefusedErr);
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.details).toContain("ECONNREFUSED");
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CHAOS-SQS-03: AWS IAM credential rejection (AccessDeniedException) -> returns 500 AND leaves DB untouched", async () => {
      const silentLogger = createSilentLogger();
      const iamRejection = new Error(
        "AccessDeniedException: User arn:aws:iam::123456789012:user/release-agent is not authorized to perform: sqs:SendMessage"
      );

      const enqueueFanout = vi.fn().mockRejectedValue(iamRejection);
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.details).toContain("AccessDeniedException");
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CHAOS-SQS-04: AWS SQS throughput rate-limiting (ThrottlingException) -> returns 500 AND leaves DB untouched", async () => {
      const silentLogger = createSilentLogger();
      const throttlingErr = new Error("ThrottlingException: Rate exceeded");

      const enqueueFanout = vi.fn().mockRejectedValue(throttlingErr);
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.details).toContain("ThrottlingException");
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CHAOS-SQS-05: Missing / deleted SQS queue (QueueDoesNotExist) -> returns 500 AND leaves DB untouched", async () => {
      const silentLogger = createSilentLogger();
      const queueNotFoundErr = new Error("AWS.SimpleQueueService.NonExistentQueue: The specified queue does not exist");

      const enqueueFanout = vi.fn().mockRejectedValue(queueNotFoundErr);
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.details).toContain("NonExistentQueue");
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CHAOS-SQS-06: AWS KMS key failure / encryption error -> returns 500 AND leaves DB untouched", async () => {
      const silentLogger = createSilentLogger();
      const kmsErr = new Error("KMS.DisabledException: The KMS key used for SQS SSE is disabled");

      const enqueueFanout = vi.fn().mockRejectedValue(kmsErr);
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.details).toContain("KMS.DisabledException");
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CHAOS-SQS-07: SQS client abort / request timeout (AbortError) -> returns 500 AND leaves DB untouched", async () => {
      const silentLogger = createSilentLogger();
      const abortErr = new Error("AbortError: The operation was aborted due to timeout");

      const enqueueFanout = vi.fn().mockRejectedValue(abortErr);
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.details).toContain("AbortError");
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CHAOS-SQS-08: Non-Error primitive rejected by SQS SDK -> formats cleanly into 500 without crashing", async () => {
      const silentLogger = createSilentLogger();
      // AWS SDK or synthetic proxy rejecting with non-Error string
      const enqueueFanout = vi.fn().mockRejectedValue("FATAL_AWS_TRANSPORT_PANIC");
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Failed to enqueue release notification event to SQS.");
      expect(json.details).toBe("FATAL_AWS_TRANSPORT_PANIC");
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CHAOS-SQS-09: Production App Router entrypoint POST(request) triggers SQS circuit breaker", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockSqsSend.mockRejectedValueOnce(new Error("AWS SQS Outage in us-east-1"));

      const req = buildSignedPublishRequest();
      const res = await POST(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Failed to enqueue release notification event to SQS.");
      expect(json.details).toContain("AWS SQS Outage in us-east-1");
      expect(mockPrisma.publishedEpisode.upsert).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Suite 2: Post-SQS Secondary Database Resilience (HTTP 202 Fallback)
  // ==========================================================================
  describe("Suite 2: Post-SQS Secondary Database Resilience (HTTP 202 Fallback)", () => {
    it("CHAOS-DB-01: Prisma connection pool starvation (P2024) post-SQS -> returns 202 Accepted with queued: true", async () => {
      const silentLogger = createSilentLogger();
      const enqueueFanout = vi.fn().mockResolvedValue("sqs-msg-resilience-01");

      const poolTimeoutErr = new Error(
        "PrismaClientKnownRequestError: Timed out fetching a new connection from the connection pool. (P2024)"
      );

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockRejectedValue(poolTimeoutErr),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("sqs-msg-resilience-01");
      expect(json.warning).toBe("Database record creation deferred to Lambda worker.");
      expect(json.episodeId).toBe("event-loop-microtasks");
      expect(json.subject).toBe("JAVASCRIPT");

      expect(enqueueFanout).toHaveBeenCalledTimes(1);
      expect(mockDb.publishedEpisode.upsert).toHaveBeenCalledTimes(1);
      expect(silentLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("DB upsert failed after successful SQS enqueue"),
        poolTimeoutErr
      );
    });

    it("CHAOS-DB-02: PostgreSQL transaction deadlock / write conflict (P2034) -> returns 202 Accepted", async () => {
      const silentLogger = createSilentLogger();
      const enqueueFanout = vi.fn().mockResolvedValue("sqs-msg-resilience-02");

      const deadlockErr = new Error(
        "PrismaClientKnownRequestError: Transaction failed due to a write conflict or a deadlock. Please retry your transaction. (P2034)"
      );

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockRejectedValue(deadlockErr),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("sqs-msg-resilience-02");
    });

    it("CHAOS-DB-03: TCP socket disconnection during upsert (ECONNRESET) -> returns 202 Accepted", async () => {
      const silentLogger = createSilentLogger();
      const enqueueFanout = vi.fn().mockResolvedValue("sqs-msg-resilience-03");

      const socketResetErr = new Error("read ECONNRESET at TCP.onStreamRead");

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockRejectedValue(socketResetErr),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("sqs-msg-resilience-03");
    });

    it("CHAOS-DB-04: Database slow query timeout (Query timed out) -> returns 202 Accepted", async () => {
      const silentLogger = createSilentLogger();
      const enqueueFanout = vi.fn().mockResolvedValue("sqs-msg-resilience-04");

      const timeoutErr = new Error("Query timed out after 5000ms");

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockRejectedValue(timeoutErr),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("sqs-msg-resilience-04");
    });

    it("CHAOS-DB-05: Non-Error object rejection during DB upsert -> safely catches and returns 202", async () => {
      const silentLogger = createSilentLogger();
      const enqueueFanout = vi.fn().mockResolvedValue("sqs-msg-resilience-05");

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockRejectedValue({ code: "CRITICAL_DATABASE_CRASH", unhandled: true }),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("sqs-msg-resilience-05");
      expect(json.warning).toBe("Database record creation deferred to Lambda worker.");
    });

    it("CHAOS-DB-06: Production App Router entrypoint POST(request) returns 202 on DB upsert failure", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockSqsSend.mockResolvedValueOnce({ MessageId: "msg-prod-route-resilience-06" });
      mockPrisma.publishedEpisode.upsert.mockRejectedValueOnce(
        new Error("PrismaClientInitializationError: DB unavailable during upsert")
      );

      const req = buildSignedPublishRequest();
      const res = await POST(req);

      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("msg-prod-route-resilience-06");
      expect(json.warning).toBe("Database record creation deferred to Lambda worker.");
      consoleWarnSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Suite 3: Dual-Failure Chaos (Fast-Path Read Fails -> SQS Succeeds -> Secondary DB Upsert Fails)
  // ==========================================================================
  describe("Suite 3: Dual-Failure Chaos (Total Database Outage with SQS Surviving)", () => {
    it("CHAOS-DUAL-01: DB read fails on check, SQS succeeds, DB write fails on upsert -> still returns 202 Accepted", async () => {
      const silentLogger = createSilentLogger();
      const enqueueFanout = vi.fn().mockResolvedValue("sqs-dual-failure-msg-01");

      const dbDownErr = new Error("Can't reach database server at postgresql.internal:5432");

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockRejectedValue(dbDownErr),
          upsert: vi.fn().mockRejectedValue(dbDownErr),
        },
      } as unknown as PrismaClient;

      const req = buildSignedPublishRequest();
      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
        logger: silentLogger,
      });

      // Assertions
      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("sqs-dual-failure-msg-01");
      expect(json.warning).toBe("Database record creation deferred to Lambda worker.");

      // Check evidence chain:
      // 1. Read-only idempotency failed but was caught
      expect(silentLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Read-only idempotency check failed, continuing to SQS:"),
        dbDownErr
      );
      // 2. SQS was successfully invoked
      expect(enqueueFanout).toHaveBeenCalledTimes(1);
      // 3. Upsert failed and was caught with 202
      expect(silentLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("DB upsert failed after successful SQS enqueue"),
        dbDownErr
      );
    });
  });

  // ==========================================================================
  // Suite 4: Concurrent Idempotency Races & Force Overrides
  // ==========================================================================
  describe("Suite 4: Concurrent Idempotency Races & Force Overrides", () => {
    it("CONC-01: 10 concurrent publish requests for unpublished episode all enqueue and upsert cleanly", async () => {
      const silentLogger = createSilentLogger();
      let sqsCallCounter = 0;
      const enqueueFanout = vi.fn().mockImplementation(async () => {
        sqsCallCounter++;
        return `sqs-msg-concurrent-${sqsCallCounter}`;
      });

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({ id: "pub-concurrent-ok" }),
        },
      } as unknown as PrismaClient;

      // 10 concurrent publish requests executed in parallel
      const requests = Array.from({ length: 10 }, (_, i) =>
        buildSignedPublishRequest({
          payload: {
            subject: "COMPUTER_NETWORKS",
            episodeId: "bgp-routing-protocols",
            episodeNumber: 4,
            title: "BGP Routing & Path Vector Protocols",
            releaseCommitSha: `sha-burst-${i}-1234567890abcdef1234567890`,
            summary: "Deep dive into Autonomous Systems and BGP",
            keyConcepts: ["BGP", "Autonomous Systems", "Path Vector"],
          },
        })
      );

      const responses = await Promise.all(
        requests.map((req) =>
          handlePublishEpisode(req, {
            enqueueFanout,
            db: mockDb,
            logger: silentLogger,
          })
        )
      );

      expect(responses).toHaveLength(10);
      for (const res of responses) {
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.queued).toBe(true);
      }

      expect(enqueueFanout).toHaveBeenCalledTimes(10);
      expect(mockDb.publishedEpisode.upsert).toHaveBeenCalledTimes(10);
    });

    it("CONC-02: 15 concurrent requests for already-dispatched episode (force: false) are 100% suppressed", async () => {
      const silentLogger = createSilentLogger();
      const enqueueFanout = vi.fn();
      const dispatchedAt = new Date("2026-10-31T15:30:00.000Z");

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue({
            subject: "OPERATING_SYSTEMS",
            episodeId: "process-scheduling-cfs",
            dispatchedAt,
          }),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const requests = Array.from({ length: 15 }, () =>
        buildSignedPublishRequest({
          payload: {
            subject: "OPERATING_SYSTEMS",
            episodeId: "process-scheduling-cfs",
            episodeNumber: 2,
            title: "Completely Fair Scheduler (CFS)",
            releaseCommitSha: "sha-os-cfs-1234567890abcdef1234567890",
            force: false,
          },
        })
      );

      const responses = await Promise.all(
        requests.map((req) =>
          handlePublishEpisode(req, {
            enqueueFanout,
            db: mockDb,
            logger: silentLogger,
          })
        )
      );

      expect(responses).toHaveLength(15);
      for (const res of responses) {
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.status).toBe("already_published");
        expect(json.alreadyDispatched).toBe(true);
        expect(json.dispatchedAt).toBe(dispatchedAt.toISOString());
      }

      // SQS and DB upsert must NEVER have been called for any of the 15 requests
      expect(enqueueFanout).not.toHaveBeenCalled();
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CONC-03: Interleaved concurrent requests: 5 force:false suppressed vs 5 force:true enqueued", async () => {
      const silentLogger = createSilentLogger();
      let sqsCallCounter = 0;
      const enqueueFanout = vi.fn().mockImplementation(async () => {
        sqsCallCounter++;
        return `sqs-msg-force-${sqsCallCounter}`;
      });

      const dispatchedAt = new Date("2026-10-31T12:00:00.000Z");

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue({
            subject: "BACKEND",
            episodeId: "cache-invalidation-patterns",
            dispatchedAt,
          }),
          upsert: vi.fn().mockResolvedValue({ id: "pub-forced" }),
        },
      } as unknown as PrismaClient;

      // Build interleaved requests: alternating false and true
      const requestConfigs = [
        { force: false, id: 0 },
        { force: true, id: 1 },
        { force: false, id: 2 },
        { force: true, id: 3 },
        { force: false, id: 4 },
        { force: true, id: 5 },
        { force: false, id: 6 },
        { force: true, id: 7 },
        { force: false, id: 8 },
        { force: true, id: 9 },
      ];

      const responses = await Promise.all(
        requestConfigs.map(({ force, id }) => {
          const req = buildSignedPublishRequest({
            payload: {
              subject: "BACKEND",
              episodeId: "cache-invalidation-patterns",
              episodeNumber: 3,
              title: "Cache Invalidation & Thundering Herd",
              releaseCommitSha: `sha-interleaved-${id}-1234567890abcdef1234`,
              force,
            },
          });
          return handlePublishEpisode(req, {
            enqueueFanout,
            db: mockDb,
            logger: silentLogger,
          });
        })
      );

      expect(responses).toHaveLength(10);

      // Verify each individual response according to its force flag
      for (let i = 0; i < requestConfigs.length; i++) {
        const config = requestConfigs[i];
        const res = responses[i];
        expect(res.status).toBe(200);
        const json = await res.json();

        if (config.force) {
          expect(json.queued).toBe(true);
          expect(json.messageId).toBeDefined();
        } else {
          expect(json.status).toBe("already_published");
          expect(json.alreadyDispatched).toBe(true);
          expect(json.dispatchedAt).toBe(dispatchedAt.toISOString());
        }
      }

      // Exactly 5 forced requests enqueued, 5 skipped
      expect(enqueueFanout).toHaveBeenCalledTimes(5);
      expect(mockDb.publishedEpisode.upsert).toHaveBeenCalledTimes(5);
    });

    it("CONC-04: Realistic lifecycle transition: unpublished -> published -> unforced retry skipped -> forced retry enqueued", async () => {
      const silentLogger = createSilentLogger();
      let publishedDispatchedAt: Date | null = null;

      const enqueueFanout = vi.fn().mockImplementation(async () => "sqs-lifecycle-msg-01");

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockImplementation(async () => {
            if (publishedDispatchedAt) {
              return {
                subject: "JAVA",
                episodeId: "jvm-garbage-collection-zgc",
                dispatchedAt: publishedDispatchedAt,
              };
            }
            return null;
          }),
          upsert: vi.fn().mockImplementation(async () => {
            return { id: "pub-lifecycle-ep" };
          }),
        },
      } as unknown as PrismaClient;

      // Step 1: Initial release arrives
      const req1 = buildSignedPublishRequest({
        payload: {
          subject: "JAVA",
          episodeId: "jvm-garbage-collection-zgc",
          episodeNumber: 1,
          title: "JVM Garbage Collection & ZGC",
          releaseCommitSha: "sha-zgc-1234567890abcdef1234567890",
        },
      });

      const res1 = await handlePublishEpisode(req1, { enqueueFanout, db: mockDb, logger: silentLogger });
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.queued).toBe(true);
      expect(enqueueFanout).toHaveBeenCalledTimes(1);

      // Lambda worker processes and sets dispatchedAt
      publishedDispatchedAt = new Date("2026-11-01T12:00:00Z");

      // Step 2: CI/CD re-runs the step without force: false (idempotent duplicate run)
      const req2 = buildSignedPublishRequest({
        payload: {
          subject: "JAVA",
          episodeId: "jvm-garbage-collection-zgc",
          episodeNumber: 1,
          title: "JVM Garbage Collection & ZGC",
          releaseCommitSha: "sha-zgc-1234567890abcdef1234567890",
          force: false,
        },
      });

      const res2 = await handlePublishEpisode(req2, { enqueueFanout, db: mockDb, logger: silentLogger });
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.status).toBe("already_published");
      expect(json2.alreadyDispatched).toBe(true);
      // SQS enqueue call count remains 1 (not called again)
      expect(enqueueFanout).toHaveBeenCalledTimes(1);

      // Step 3: Admin issues deliberate override with force: true
      const req3 = buildSignedPublishRequest({
        payload: {
          subject: "JAVA",
          episodeId: "jvm-garbage-collection-zgc",
          episodeNumber: 1,
          title: "JVM Garbage Collection & ZGC",
          releaseCommitSha: "sha-zgc-1234567890abcdef1234567890",
          force: true,
        },
      });

      const res3 = await handlePublishEpisode(req3, { enqueueFanout, db: mockDb, logger: silentLogger });
      expect(res3.status).toBe(200);
      const json3 = await res3.json();
      expect(json3.queued).toBe(true);
      // SQS enqueue call count increments to 2
      expect(enqueueFanout).toHaveBeenCalledTimes(2);
    });

    it("CONC-05: Multi-subject concurrent burst across 4 different subject channels", async () => {
      const silentLogger = createSilentLogger();
      const enqueueFanout = vi.fn().mockImplementation(async (payload) => `sqs-msg-${payload.subject}-${payload.episodeId}`);

      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({ id: "pub-multi" }),
        },
      } as unknown as PrismaClient;

      const subjects = ["JAVASCRIPT", "OPERATING_SYSTEMS", "COMPUTER_NETWORKS", "BACKEND"] as const;
      const burstRequests = subjects.flatMap((subj, idx) => [
        buildSignedPublishRequest({
          payload: {
            subject: subj,
            episodeId: `burst-ep-${idx}-a`,
            episodeNumber: idx + 1,
            title: `${subj} Deep Dive Part 1`,
            releaseCommitSha: `sha-${subj}-a-1234567890abcdef1234567890`,
          },
        }),
        buildSignedPublishRequest({
          payload: {
            subject: subj,
            episodeId: `burst-ep-${idx}-b`,
            episodeNumber: idx + 2,
            title: `${subj} Deep Dive Part 2`,
            releaseCommitSha: `sha-${subj}-b-1234567890abcdef1234567890`,
          },
        }),
        buildSignedPublishRequest({
          payload: {
            subject: subj,
            episodeId: `burst-ep-${idx}-c`,
            episodeNumber: idx + 3,
            title: `${subj} Deep Dive Part 3`,
            releaseCommitSha: `sha-${subj}-c-1234567890abcdef1234567890`,
          },
        }),
      ]);

      expect(burstRequests).toHaveLength(12);

      const responses = await Promise.all(
        burstRequests.map((req) =>
          handlePublishEpisode(req, {
            enqueueFanout,
            db: mockDb,
            logger: silentLogger,
          })
        )
      );

      expect(responses).toHaveLength(12);
      for (const res of responses) {
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.queued).toBe(true);
      }
      expect(enqueueFanout).toHaveBeenCalledTimes(12);
      expect(mockDb.publishedEpisode.upsert).toHaveBeenCalledTimes(12);
    });
  });

  // ==========================================================================
  // Suite 5: Cryptographic Boundary & Payload Integrity Under Chaos
  // ==========================================================================
  describe("Suite 5: Cryptographic Boundary & Payload Integrity Under Chaos", () => {
    it("CRYPTO-01: Replay attack: expired timestamp (>300s old) rejects with 401 and NEVER invokes SQS", async () => {
      const enqueueFanout = vi.fn();
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn(),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const serverNow = 1700000500;
      // 301 seconds old
      const expiredTimestamp = serverNow - 301;

      const req = buildSignedPublishRequest({
        timestamp: expiredTimestamp,
      });

      const res = await handlePublishEpisode(req, {
        now: serverNow * 1000,
        enqueueFanout,
        db: mockDb,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/replay detected/i);
      expect(enqueueFanout).not.toHaveBeenCalled();
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CRYPTO-02: Exact boundary test: timestamp at exactly -300s is ACCEPTED", async () => {
      const enqueueFanout = vi.fn().mockResolvedValue("sqs-msg-boundary-valid");
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({ id: "pub-boundary" }),
        },
      } as unknown as PrismaClient;

      const serverNow = 1700000500;
      // Exactly 300 seconds old
      const validBoundaryTimestamp = serverNow - 300;

      const req = buildSignedPublishRequest({
        timestamp: validBoundaryTimestamp,
      });

      const res = await handlePublishEpisode(req, {
        now: serverNow * 1000,
        enqueueFanout,
        db: mockDb,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.queued).toBe(true);
      expect(enqueueFanout).toHaveBeenCalledTimes(1);
    });

    it("CRYPTO-03: Clock skew: future timestamp (>300s ahead) rejects with 401 and NEVER invokes SQS", async () => {
      const enqueueFanout = vi.fn();
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn(),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const serverNow = 1700000500;
      // 301 seconds in future
      const futureTimestamp = serverNow + 301;

      const req = buildSignedPublishRequest({
        timestamp: futureTimestamp,
      });

      const res = await handlePublishEpisode(req, {
        now: serverNow * 1000,
        enqueueFanout,
        db: mockDb,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/clock skew/i);
      expect(enqueueFanout).not.toHaveBeenCalled();
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CRYPTO-04: In-flight payload tampering (altered episodeId) rejects with 401 and NEVER touches SQS or DB", async () => {
      const enqueueFanout = vi.fn();
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn(),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const originalPayload = {
        subject: "JAVASCRIPT",
        episodeId: "event-loop-microtasks",
        episodeNumber: 1,
        title: "JavaScript Event Loop & Microtasks",
        releaseCommitSha: "a1b2c3d4e5f6789012345678901234567890abcd",
      };

      const nowSec = Math.floor(Date.now() / 1000);
      const originalSig = computeReleaseSignature({
        payload: JSON.stringify(originalPayload),
        secret: TEST_SECRET,
        timestamp: String(nowSec),
        bound: true,
        prefix: true,
      });

      // Attacker intercepts and tampers body payload in transit
      const tamperedPayload = {
        ...originalPayload,
        episodeId: "malicious-code-injection",
      };

      const req = new Request("http://localhost:3000/api/internal/episodes/publish", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-release-timestamp": String(nowSec),
          "x-release-signature": originalSig, // Valid for original, invalid for tampered
        },
        body: JSON.stringify(tamperedPayload),
      });

      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/signature/i);
      expect(enqueueFanout).not.toHaveBeenCalled();
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CRYPTO-05: In-flight payload tampering (altered releaseCommitSha) rejects with 401", async () => {
      const enqueueFanout = vi.fn();
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn(),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const originalPayload = {
        subject: "OPERATING_SYSTEMS",
        episodeId: "virtual-memory-paging",
        episodeNumber: 3,
        title: "Virtual Memory & Paging",
        releaseCommitSha: "trusted-sha-1234567890abcdef1234567890",
      };

      const nowSec = Math.floor(Date.now() / 1000);
      const originalSig = computeReleaseSignature({
        payload: JSON.stringify(originalPayload),
        secret: TEST_SECRET,
        timestamp: String(nowSec),
        bound: true,
        prefix: true,
      });

      // Attacker attempts to swap release commit
      const tamperedPayload = {
        ...originalPayload,
        releaseCommitSha: "untrusted-compromised-commit-sha-9999",
      };

      const req = new Request("http://localhost:3000/api/internal/episodes/publish", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-release-timestamp": String(nowSec),
          "x-release-signature": originalSig,
        },
        body: JSON.stringify(tamperedPayload),
      });

      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
      });

      expect(res.status).toBe(401);
      expect(enqueueFanout).not.toHaveBeenCalled();
    });

    it("CRYPTO-06: Valid signature but non-JSON payload -> returns 400 Bad Request, neither SQS nor DB touched", async () => {
      const enqueueFanout = vi.fn();
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn(),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      const rawNonJson = "plain text raw payload not in json format";
      const nowSec = Math.floor(Date.now() / 1000);
      const sig = computeReleaseSignature({
        payload: rawNonJson,
        secret: TEST_SECRET,
        timestamp: String(nowSec),
        bound: true,
        prefix: true,
      });

      const req = new Request("http://localhost:3000/api/internal/episodes/publish", {
        method: "POST",
        headers: {
          "content-type": "text/plain",
          "x-release-timestamp": String(nowSec),
          "x-release-signature": sig,
        },
        body: rawNonJson,
      });

      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Malformed JSON payload.");
      expect(enqueueFanout).not.toHaveBeenCalled();
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("CRYPTO-07: Valid signature but schema validation failure -> returns 400 Bad Request, neither SQS nor DB touched", async () => {
      const enqueueFanout = vi.fn();
      const mockDb = {
        publishedEpisode: {
          findUnique: vi.fn(),
          upsert: vi.fn(),
        },
      } as unknown as PrismaClient;

      // Missing episodeId and title
      const invalidSchemaPayload = {
        subject: "JAVASCRIPT",
        episodeNumber: 1,
      };

      const req = buildSignedPublishRequest({
        payload: invalidSchemaPayload,
      });

      const res = await handlePublishEpisode(req, {
        enqueueFanout,
        db: mockDb,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/expected string|required/i);
      expect(enqueueFanout).not.toHaveBeenCalled();
      expect(mockDb.publishedEpisode.upsert).not.toHaveBeenCalled();
    });
  });
});
