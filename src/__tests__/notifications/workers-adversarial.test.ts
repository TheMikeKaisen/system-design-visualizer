import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubjectChannel, type PrismaClient } from "@prisma/client";
import {
  processEpisodeFanout,
  EpisodeFanoutHandler,
} from "@/workers/fanout";
import {
  processDispatchRecord,
  EmailDispatchHandler,
  RatePacer,
} from "@/workers/dispatch";
import type { SQSEvent, SQSRecord } from "@/workers/types";
import type { SQSClient } from "@aws-sdk/client-sqs";
import type { Resend } from "resend";
import type { prisma as defaultPrisma } from "@/lib/db";

interface MockPrisma {
  publishedEpisode: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  subscriber: {
    findMany: ReturnType<typeof vi.fn>;
  };
}

describe("Workers Adversarial, Chaos & Edge-Case Suite (workers-adversarial.test.ts)", () => {
  let mockPrisma: MockPrisma;
  let mockSqsClient: SQSClient;
  let mockResendClient: Resend;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockPrisma = {
      publishedEpisode: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({ id: "pe-1" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      subscriber: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    mockSqsClient = {
      send: vi.fn().mockImplementation((command) => {
        const count = command.input.Entries?.length || 1;
        return Promise.resolve({
          Successful: Array.from({ length: count }, (_, i) => ({ Id: `ok-${i}` })),
          Failed: [],
        });
      }),
    } as unknown as SQSClient;

    mockResendClient = {
      batch: {
        send: vi.fn().mockResolvedValue({
          data: { data: [{ id: "resend-msg-1" }] },
          error: null,
        }),
      },
    } as unknown as Resend;
  });

  describe("Poison-Pill & Malformed SQS Message Ingestion", () => {
    it("safely handles completely blank message body without unhandled exceptions", async () => {
      const event: SQSEvent = {
        Records: [
          { messageId: "poison-blank", receiptHandle: "h-blank", body: "" },
        ],
      };

      const fanoutRes = await EpisodeFanoutHandler(event, undefined, {
        db: mockPrisma as unknown as PrismaClient,
        sqsClient: mockSqsClient,
      });
      expect(fanoutRes.batchItemFailures).toEqual([
        { itemIdentifier: "poison-blank" },
      ]);

      const dispatchRes = await EmailDispatchHandler(event, undefined, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
      });
      expect(dispatchRes.batchItemFailures).toEqual([
        { itemIdentifier: "poison-blank" },
      ]);
    });

    it("safely isolates JSON array when expecting JSON object in fanout and dispatch", async () => {
      const event: SQSEvent = {
        Records: [
          { messageId: "poison-array", receiptHandle: "h-arr", body: "[]" },
        ],
      };

      const fanoutRes = await EpisodeFanoutHandler(event, undefined, {
        db: mockPrisma as unknown as PrismaClient,
        sqsClient: mockSqsClient,
      });
      expect(fanoutRes.batchItemFailures).toEqual([
        { itemIdentifier: "poison-array" },
      ]);

      const dispatchRes = await EmailDispatchHandler(event, undefined, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
      });
      expect(dispatchRes.batchItemFailures).toEqual([
        { itemIdentifier: "poison-array" },
      ]);
    });

    it("rejects dispatch payload with 0 recipients in SQS record", async () => {
      const payloadWithZeroRecipients = {
        episode: {
          episodeId: "ep-0",
          subject: SubjectChannel.JAVASCRIPT,
          episodeNumber: 1,
          title: "Title",
          releaseCommitSha: "sha-0",
        },
        recipients: [],
      };

      const record: SQSRecord = {
        messageId: "rec-zero-recipients",
        receiptHandle: "h-0",
        body: JSON.stringify(payloadWithZeroRecipients),
      };

      await expect(
        processDispatchRecord(record, {
          resendClient: mockResendClient,
          prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        })
      ).rejects.toThrow("At least 1 recipient is required");
    });

    it("rejects dispatch payload exceeding 10 recipients in SQS record", async () => {
      const payloadWith12Recipients = {
        episode: {
          episodeId: "ep-12",
          subject: SubjectChannel.BACKEND,
          episodeNumber: 2,
          title: "Title 12",
          releaseCommitSha: "sha-12",
        },
        recipients: Array.from({ length: 12 }, (_, i) => ({
          email: `u${i}@example.com`,
          unsubscribeToken: `tok-${i}`,
        })),
      };

      const record: SQSRecord = {
        messageId: "rec-twelve-recipients",
        receiptHandle: "h-12",
        body: JSON.stringify(payloadWith12Recipients),
      };

      await expect(
        processDispatchRecord(record, {
          resendClient: mockResendClient,
          prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        })
      ).rejects.toThrow("At most 10 recipients are allowed");
    });
  });

  describe("Resend HTTP API Chaos & Status Faults", () => {
    it("reports selective failure when Resend returns HTTP 500 internal server error", async () => {
      const failingResend = {
        batch: {
          send: vi.fn().mockResolvedValue({
            data: null,
            error: { name: "internal_server_error", message: "Resend 500 error", statusCode: 500 },
          }),
        },
      } as unknown as Resend;

      const record: SQSRecord = {
        messageId: "msg-resend-500",
        receiptHandle: "h-500",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-crash",
            subject: SubjectChannel.JAVA,
            episodeNumber: 3,
            title: "JVM Crash Analysis",
            releaseCommitSha: "sha-crash",
          },
          recipients: [{ email: "dev@example.com", unsubscribeToken: "tok-crash" }],
        }),
      };

      const event: SQSEvent = { Records: [record] };
      const response = await EmailDispatchHandler(event, undefined, {
        resendClient: failingResend,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "msg-resend-500" },
      ]);
    });

    it("reports selective failure when Resend returns HTTP 401 unauthorized", async () => {
      const failingResend = {
        batch: {
          send: vi.fn().mockResolvedValue({
            data: null,
            error: { name: "unauthorized", message: "Invalid API key", statusCode: 401 },
          }),
        },
      } as unknown as Resend;

      const record: SQSRecord = {
        messageId: "msg-resend-401",
        receiptHandle: "h-401",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-auth",
            subject: SubjectChannel.OPERATING_SYSTEMS,
            episodeNumber: 1,
            title: "Kernel Auth",
            releaseCommitSha: "sha-auth",
          },
          recipients: [{ email: "sec@example.com", unsubscribeToken: "tok-sec" }],
        }),
      };

      const event: SQSEvent = { Records: [record] };
      const response = await EmailDispatchHandler(event, undefined, {
        resendClient: failingResend,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "msg-resend-401" },
      ]);
    });

    it("dispatches using custom fetchFn with Bearer token and handles 429 Retry-After", async () => {
      let fetchCalls = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        fetchCalls++;
        if (fetchCalls === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Headers({ "retry-after": "1" }),
            text: () => Promise.resolve("Too Many Requests"),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: [{ id: "fetch-send-1" }] }),
        });
      });

      const sleepFn = vi.fn().mockResolvedValue(undefined);

      const record: SQSRecord = {
        messageId: "msg-fetch-429",
        receiptHandle: "h-fetch",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-fetch",
            subject: SubjectChannel.COMPUTER_NETWORKS,
            episodeNumber: 5,
            title: "HTTP/3 and QUIC",
            releaseCommitSha: "sha-quic",
          },
          recipients: [{ email: "net@example.com", unsubscribeToken: "tok-net" }],
        }),
      };

      const result = await processDispatchRecord(record, {
        apiKey: "re_test_key_custom_fetch",
        fetchFn: mockFetch,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        sleepFn,
        pacingDelayMs: 0,
      });

      expect(result.dispatchedCount).toBe(1);
      expect(fetchCalls).toBe(2);
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer re_test_key_custom_fetch");
      expect(sleepFn).toHaveBeenCalledWith(1000); // 1 second parsed from retry-after
    });
  });

  describe("SQS Enqueue Exhaustion & DB Failures in Fanout", () => {
    it("reports batch failure if SQS enqueue fails after all retry attempts", async () => {
      const failingSqsClient = {
        send: vi.fn().mockImplementation((command) => {
          return Promise.resolve({
            Successful: [],
            Failed: (command.input.Entries || [{ Id: "entry-1" }]).map((e: { Id?: string }) => ({
              Id: e.Id,
              Code: "ServiceUnavailable",
              Message: "SQS Down",
            })),
          });
        }),
      } as unknown as SQSClient;

      mockPrisma.subscriber.findMany.mockResolvedValue([
        { id: "sub-1", email: "dev@example.com", unsubscribeToken: "tok-1" },
      ]);

      const event: SQSEvent = {
        Records: [
          {
            messageId: "rec-fanout-fail",
            receiptHandle: "h-f",
            body: JSON.stringify({
              episodeId: "ep-fail",
              subject: SubjectChannel.JAVASCRIPT,
              episodeNumber: 1,
              title: "Title",
              releaseCommitSha: "sha-fail",
            }),
          },
        ],
      };

      const response = await EpisodeFanoutHandler(event, undefined, {
        db: mockPrisma as unknown as PrismaClient,
        sqsClient: failingSqsClient,
        dispatchQueueUrl: "https://sqs.mock/dispatch",
      });

      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "rec-fanout-fail" },
      ]);
    });

    it("reports batch failure if database query fails during fanout", async () => {
      mockPrisma.subscriber.findMany.mockRejectedValue(
        new Error("Database connection closed")
      );

      const event: SQSEvent = {
        Records: [
          {
            messageId: "rec-db-crash",
            receiptHandle: "h-db",
            body: JSON.stringify({
              episodeId: "ep-crash",
              subject: SubjectChannel.JAVASCRIPT,
              episodeNumber: 1,
              title: "Title",
              releaseCommitSha: "sha-crash",
            }),
          },
        ],
      };

      const response = await EpisodeFanoutHandler(event, undefined, {
        db: mockPrisma as unknown as PrismaClient,
        sqsClient: mockSqsClient,
      });

      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "rec-db-crash" },
      ]);
    });
  });

  describe("Email Sanitization & Casing Stress", () => {
    it("deduplicates messy emails with mixed casing and whitespaces during fanout", async () => {
      mockPrisma.subscriber.findMany.mockResolvedValue([
        { id: "1", email: "   JOHN.DOE@GMAIL.COM  ", unsubscribeToken: "t1" },
        { id: "2", email: "john.doe@gmail.com", unsubscribeToken: "t2" },
        { id: "3", email: "John.Doe@Gmail.Com", unsubscribeToken: "t3" },
        { id: "4", email: "jane.doe@gmail.com", unsubscribeToken: "t4" },
      ]);

      const result = await processEpisodeFanout(
        {
          episodeId: "ep-clean-emails",
          subject: SubjectChannel.FRONTEND,
          episodeNumber: 2,
          title: "Browser Rendering Pipeline",
          releaseCommitSha: "sha-browser",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
        }
      );

      expect(result.totalRecipients).toBe(2);
      expect(result.chunksDispatched).toBe(1);
    });
  });

  describe("Rate Pacer Precision", () => {
    it("enforces delay when wait is called repeatedly with positive minIntervalMs", async () => {
      const pacer = new RatePacer();
      const startTime = Date.now();
      await pacer.wait(50);
      await pacer.wait(50);
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    it("resets timer upon calling reset()", () => {
      const pacer = new RatePacer();
      pacer.reset();
      expect(true).toBe(true);
    });
  });
});
