import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubjectChannel } from "@prisma/client";
import {
  EmailDispatchHandler,
  processDispatchRecord,
  buildBatchEmailItems,
  RatePacer,
} from "@/workers/dispatch";
import { dispatchMessagePayloadSchema } from "@/workers/types";
import type { DispatchMessagePayload, SQSEvent, SQSRecord } from "@/workers/types";
import type { Resend } from "resend";
import type { prisma as defaultPrisma } from "@/lib/db";

interface MockPrisma {
  publishedEpisode: {
    updateMany: ReturnType<typeof vi.fn>;
  };
}

describe("Empirical Challenger M4-2: Dispatcher & Resend Concurrency Suite", () => {
  let mockPrisma: MockPrisma;
  let mockResendClient: Resend;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockPrisma = {
      publishedEpisode: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    mockResendClient = {
      batch: {
        send: vi.fn().mockResolvedValue({
          data: { data: [{ id: "resend-batch-ok" }] },
          error: null,
        }),
      },
    } as unknown as Resend;
  });

  // ==========================================================================
  // Focus Area 1: Selective failure isolation via ReportBatchItemFailures
  // ==========================================================================
  describe("1. Selective Failure Isolation (ReportBatchItemFailures)", () => {
    it("reports ONLY the 1 failed messageId in a batch of 3 records without re-driving successful records", async () => {
      const recordOk1: SQSRecord = {
        messageId: "msg-batch-ok-1",
        receiptHandle: "handle-1",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-sel-1",
            subject: SubjectChannel.JAVASCRIPT,
            episodeNumber: 1,
            title: "JS Event Loop",
            releaseCommitSha: "sha-sel-1",
          },
          recipients: [{ email: "dev1@example.com", unsubscribeToken: "tok-1" }],
        }),
      };

      const recordFail2: SQSRecord = {
        messageId: "msg-batch-fail-2",
        receiptHandle: "handle-2",
        body: "BROKEN_NON_JSON_DATA_{{",
      };

      const recordOk3: SQSRecord = {
        messageId: "msg-batch-ok-3",
        receiptHandle: "handle-3",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-sel-3",
            subject: SubjectChannel.JAVASCRIPT,
            episodeNumber: 3,
            title: "V8 Optimization Pipelines",
            releaseCommitSha: "sha-sel-3",
          },
          recipients: [{ email: "dev3@example.com", unsubscribeToken: "tok-3" }],
        }),
      };

      const event: SQSEvent = {
        Records: [recordOk1, recordFail2, recordOk3],
      };

      const response = await EmailDispatchHandler(event, undefined, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      // Exactly record 2 must be reported in batchItemFailures
      expect(response.batchItemFailures).toHaveLength(1);
      expect(response.batchItemFailures[0]).toEqual({
        itemIdentifier: "msg-batch-fail-2",
      });

      // Exactly 2 successful calls to Resend batch.send
      expect(mockResendClient.batch.send).toHaveBeenCalledTimes(2);

      // Exactly 2 DB updates for the successful records
      expect(mockPrisma.publishedEpisode.updateMany).toHaveBeenCalledTimes(2);
      expect(mockPrisma.publishedEpisode.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ episodeId: "ep-sel-1" }),
        })
      );
      expect(mockPrisma.publishedEpisode.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ episodeId: "ep-sel-3" }),
        })
      );
    });

    it("isolates non-adjacent multi-record failures across 5 records (records 2 & 4 fail)", async () => {
      const records: SQSRecord[] = [
        {
          messageId: "rec-1-ok",
          receiptHandle: "h1",
          body: JSON.stringify({
            episode: { episodeId: "ep-1", subject: SubjectChannel.BACKEND, episodeNumber: 1, title: "T1" },
            recipients: [{ email: "u1@example.com", unsubscribeToken: "t1" }],
          }),
        },
        {
          messageId: "rec-2-fail-schema",
          receiptHandle: "h2",
          body: JSON.stringify({
            episode: { episodeId: "ep-2", subject: SubjectChannel.BACKEND, episodeNumber: 2, title: "T2" },
            recipients: [], // 0 recipients invalid
          }),
        },
        {
          messageId: "rec-3-ok",
          receiptHandle: "h3",
          body: JSON.stringify({
            episode: { episodeId: "ep-3", subject: SubjectChannel.BACKEND, episodeNumber: 3, title: "T3" },
            recipients: [{ email: "u3@example.com", unsubscribeToken: "t3" }],
          }),
        },
        {
          messageId: "rec-4-fail-parse",
          receiptHandle: "h4",
          body: "!!INVALID!!",
        },
        {
          messageId: "rec-5-ok",
          receiptHandle: "h5",
          body: JSON.stringify({
            episode: { episodeId: "ep-5", subject: SubjectChannel.BACKEND, episodeNumber: 5, title: "T5" },
            recipients: [{ email: "u5@example.com", unsubscribeToken: "t5" }],
          }),
        },
      ];

      const response = await EmailDispatchHandler({ Records: records }, undefined, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "rec-2-fail-schema" },
        { itemIdentifier: "rec-4-fail-parse" },
      ]);
      expect(mockResendClient.batch.send).toHaveBeenCalledTimes(3);
    });

    it("returns empty batchItemFailures when all records in batch succeed", async () => {
      const records: SQSRecord[] = [
        {
          messageId: "rec-all-ok-1",
          receiptHandle: "h1",
          body: JSON.stringify({
            episode: { episodeId: "ep-a", subject: SubjectChannel.FRONTEND, episodeNumber: 1, title: "CSS" },
            recipients: [{ email: "a@example.com", unsubscribeToken: "ta" }],
          }),
        },
        {
          messageId: "rec-all-ok-2",
          receiptHandle: "h2",
          body: JSON.stringify({
            episode: { episodeId: "ep-b", subject: SubjectChannel.FRONTEND, episodeNumber: 2, title: "DOM" },
            recipients: [{ email: "b@example.com", unsubscribeToken: "tb" }],
          }),
        },
      ];

      const response = await EmailDispatchHandler({ Records: records }, undefined, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      expect(response.batchItemFailures).toEqual([]);
      expect(mockResendClient.batch.send).toHaveBeenCalledTimes(2);
    });

    it("returns all messageIds when every record in batch fails", async () => {
      const records: SQSRecord[] = [
        { messageId: "fail-1", receiptHandle: "h1", body: "{" },
        { messageId: "fail-2", receiptHandle: "h2", body: "[]" },
        { messageId: "fail-3", receiptHandle: "h3", body: "null" },
      ];

      const response = await EmailDispatchHandler({ Records: records }, undefined, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "fail-1" },
        { itemIdentifier: "fail-2" },
        { itemIdentifier: "fail-3" },
      ]);
      expect(mockResendClient.batch.send).not.toHaveBeenCalled();
    });

    it("handles degenerate / empty / malformed SQS events gracefully", async () => {
      expect(await EmailDispatchHandler({ Records: [] })).toEqual({ batchItemFailures: [] });
      expect(await EmailDispatchHandler({} as SQSEvent)).toEqual({ batchItemFailures: [] });
      expect(await EmailDispatchHandler(null as unknown as SQSEvent)).toEqual({ batchItemFailures: [] });
      expect(await EmailDispatchHandler(undefined as unknown as SQSEvent)).toEqual({ batchItemFailures: [] });
    });
  });

  // ==========================================================================
  // Focus Area 2: Malformed Payloads Caught Without Process Crash
  // ==========================================================================
  describe("2. Malformed Payloads Resilience", () => {
    const validEpisode = {
      episodeId: "ep-valid",
      subject: SubjectChannel.COMPUTER_NETWORKS,
      episodeNumber: 1,
      title: "Networking 101",
      releaseCommitSha: "sha-net-1",
    };

    it("catches syntax error in JSON body and reports messageId without crashing", async () => {
      const record: SQSRecord = {
        messageId: "rec-syntax-error",
        receiptHandle: "h-syn",
        body: "{ bad: json, unquoted }",
      };

      const res = await EmailDispatchHandler({ Records: [record] }, undefined, {
        resendClient: mockResendClient,
      });

      expect(res.batchItemFailures).toEqual([{ itemIdentifier: "rec-syntax-error" }]);
    });

    it("catches non-object primitives in JSON (number, boolean, string, null, array)", async () => {
      const payloads = ["12345", "true", "false", '"a string"', "null", "[1, 2, 3]"];

      for (let i = 0; i < payloads.length; i++) {
        const messageId = `rec-prim-${i}`;
        const record: SQSRecord = {
          messageId,
          receiptHandle: `h-${i}`,
          body: payloads[i],
        };

        const res = await EmailDispatchHandler({ Records: [record] }, undefined, {
          resendClient: mockResendClient,
        });

        expect(res.batchItemFailures).toEqual([{ itemIdentifier: messageId }]);
      }
    });

    it("catches missing recipients field", async () => {
      const record: SQSRecord = {
        messageId: "rec-no-recipients",
        receiptHandle: "h-nr",
        body: JSON.stringify({ episode: validEpisode }),
      };

      const res = await EmailDispatchHandler({ Records: [record] }, undefined, {
        resendClient: mockResendClient,
      });

      expect(res.batchItemFailures).toEqual([{ itemIdentifier: "rec-no-recipients" }]);
    });

    it("catches 0 recipients (empty array)", async () => {
      const record: SQSRecord = {
        messageId: "rec-empty-recipients",
        receiptHandle: "h-er",
        body: JSON.stringify({ episode: validEpisode, recipients: [] }),
      };

      const res = await EmailDispatchHandler({ Records: [record] }, undefined, {
        resendClient: mockResendClient,
      });

      expect(res.batchItemFailures).toEqual([{ itemIdentifier: "rec-empty-recipients" }]);
    });

    it("catches recipient count exceeding maximum of 10", async () => {
      const elevenRecipients = Array.from({ length: 11 }, (_, i) => ({
        email: `dev${i}@example.com`,
        unsubscribeToken: `tok-${i}`,
      }));

      const record: SQSRecord = {
        messageId: "rec-11-recipients",
        receiptHandle: "h-11",
        body: JSON.stringify({ episode: validEpisode, recipients: elevenRecipients }),
      };

      const res = await EmailDispatchHandler({ Records: [record] }, undefined, {
        resendClient: mockResendClient,
      });

      expect(res.batchItemFailures).toEqual([{ itemIdentifier: "rec-11-recipients" }]);
    });

    it("successfully accepts boundary recipient counts of exactly 1 and 10", async () => {
      // Test 1 recipient
      const single = {
        episode: validEpisode,
        recipients: [{ email: "one@example.com", unsubscribeToken: "tok-1" }],
      };
      expect(dispatchMessagePayloadSchema.safeParse(single).success).toBe(true);

      // Test 10 recipients
      const ten = {
        episode: validEpisode,
        recipients: Array.from({ length: 10 }, (_, i) => ({
          email: `ten${i}@example.com`,
          unsubscribeToken: `tok-${i}`,
        })),
      };
      expect(dispatchMessagePayloadSchema.safeParse(ten).success).toBe(true);
    });

    it("catches invalid email formatting variants without crashing", async () => {
      const invalidEmails = [
        "not-an-email",
        "user@",
        "@domain.com",
        "user@.com",
        "user name@domain.com",
        "user@domain..com",
        "",
        "   ",
      ];

      for (let i = 0; i < invalidEmails.length; i++) {
        const messageId = `rec-bad-email-${i}`;
        const record: SQSRecord = {
          messageId,
          receiptHandle: `h-be-${i}`,
          body: JSON.stringify({
            episode: validEpisode,
            recipients: [{ email: invalidEmails[i], unsubscribeToken: "tok-test" }],
          }),
        };

        const res = await EmailDispatchHandler({ Records: [record] }, undefined, {
          resendClient: mockResendClient,
        });

        expect(res.batchItemFailures).toEqual([{ itemIdentifier: messageId }]);
      }
    });

    it("catches missing or empty unsubscribeToken", async () => {
      const record: SQSRecord = {
        messageId: "rec-empty-token",
        receiptHandle: "h-et",
        body: JSON.stringify({
          episode: validEpisode,
          recipients: [{ email: "valid@example.com", unsubscribeToken: "" }],
        }),
      };

      const res = await EmailDispatchHandler({ Records: [record] }, undefined, {
        resendClient: mockResendClient,
      });

      expect(res.batchItemFailures).toEqual([{ itemIdentifier: "rec-empty-token" }]);
    });

    it("catches invalid episode metadata (missing id, 0 episodeNumber, invalid subject)", async () => {
      const badEpisodes = [
        { ...validEpisode, episodeId: "" },
        { ...validEpisode, episodeNumber: 0 },
        { ...validEpisode, episodeNumber: -1 },
        { ...validEpisode, title: "" },
        { ...validEpisode, subject: "INVALID_CHANNEL_XYZ" },
      ];

      for (let i = 0; i < badEpisodes.length; i++) {
        const messageId = `rec-bad-ep-${i}`;
        const record: SQSRecord = {
          messageId,
          receiptHandle: `h-ep-${i}`,
          body: JSON.stringify({
            episode: badEpisodes[i],
            recipients: [{ email: "dev@example.com", unsubscribeToken: "tok" }],
          }),
        };

        const res = await EmailDispatchHandler({ Records: [record] }, undefined, {
          resendClient: mockResendClient,
        });

        expect(res.batchItemFailures).toEqual([{ itemIdentifier: messageId }]);
      }
    });
  });

  // ==========================================================================
  // Focus Area 3: Resend HTTP 429 Rate Limit Backoff with Retry-After Header
  // ==========================================================================
  describe("3. Resend HTTP 429 Backoff & Retry-After Handling", () => {
    it("backs off using explicit integer Retry-After header and succeeds on retry (fetchFn)", async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Headers({ "retry-after": "3" }), // 3 seconds
            text: () => Promise.resolve("Rate limit exceeded"),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: [{ id: "resend-rec-retry-ok" }] }),
        });
      });

      const sleepFn = vi.fn().mockResolvedValue(undefined);

      const record: SQSRecord = {
        messageId: "rec-429-retry-after",
        receiptHandle: "h-429",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-429",
            subject: SubjectChannel.JAVA,
            episodeNumber: 1,
            title: "Java Concurrency",
            releaseCommitSha: "sha-j-1",
          },
          recipients: [{ email: "java@example.com", unsubscribeToken: "tok-j" }],
        }),
      };

      const result = await processDispatchRecord(record, {
        apiKey: "re_test_key_429",
        fetchFn: mockFetch,
        sleepFn,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      expect(result.dispatchedCount).toBe(1);
      expect(callCount).toBe(2);
      expect(sleepFn).toHaveBeenCalledWith(3000); // 3 seconds * 1000ms
    });

    it("falls back to exponential backoff when Retry-After header is missing or non-numeric", async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Headers({ "retry-after": "invalid-non-numeric-value" }),
            text: () => Promise.resolve("Rate limit exceeded"),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: [{ id: "resend-ok" }] }),
        });
      });

      const sleepFn = vi.fn().mockResolvedValue(undefined);

      const record: SQSRecord = {
        messageId: "rec-429-fallback",
        receiptHandle: "h-fb",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-fb",
            subject: SubjectChannel.BACKEND,
            episodeNumber: 1,
            title: "Backend Title",
            releaseCommitSha: "sha-fb",
          },
          recipients: [{ email: "be@example.com", unsubscribeToken: "tok-be" }],
        }),
      };

      const result = await processDispatchRecord(record, {
        apiKey: "re_test_key_fb",
        fetchFn: mockFetch,
        sleepFn,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      expect(result.dispatchedCount).toBe(1);
      expect(callCount).toBe(2);
      // Fallback delay: Math.min(1000 * 2^0 + random*200, 4000) ~ between 1000 and 1200 ms
      const calledDelay = sleepFn.mock.calls[0][0];
      expect(calledDelay).toBeGreaterThanOrEqual(1000);
      expect(calledDelay).toBeLessThanOrEqual(1250);
    });

    it("backs off and recovers using Resend SDK client when receiving 429", async () => {
      let sdkCalls = 0;
      const resendWith429 = {
        batch: {
          send: vi.fn().mockImplementation(() => {
            sdkCalls++;
            if (sdkCalls === 1) {
              return Promise.resolve({
                data: null,
                error: {
                  name: "rate_limit_exceeded",
                  message: "Too many requests",
                  statusCode: 429,
                },
              });
            }
            return Promise.resolve({
              data: { data: [{ id: "resend-sdk-recovered" }] },
              error: null,
            });
          }),
        },
      } as unknown as Resend;

      const sleepFn = vi.fn().mockResolvedValue(undefined);

      const record: SQSRecord = {
        messageId: "rec-sdk-429",
        receiptHandle: "h-sdk-429",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-sdk-429",
            subject: SubjectChannel.OPERATING_SYSTEMS,
            episodeNumber: 1,
            title: "Process Scheduling",
            releaseCommitSha: "sha-os-1",
          },
          recipients: [{ email: "os@example.com", unsubscribeToken: "tok-os" }],
        }),
      };

      const result = await processDispatchRecord(record, {
        resendClient: resendWith429,
        sleepFn,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      expect(result.dispatchedCount).toBe(1);
      expect(sdkCalls).toBe(2);
      expect(sleepFn).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Focus Area 4: Resend Failure Exhaustion & Non-Transient Faults
  // ==========================================================================
  describe("4. Resend Failure Exhaustion & Non-Transient Faults", () => {
    it("reports selective failure when 429 retries are completely exhausted", async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 429,
          headers: new Headers({ "retry-after": "1" }),
          text: () => Promise.resolve("Exhausted rate limit"),
        });
      });

      const sleepFn = vi.fn().mockResolvedValue(undefined);

      const record: SQSRecord = {
        messageId: "rec-exhausted-429",
        receiptHandle: "h-ex-429",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-ex-429",
            subject: SubjectChannel.JAVASCRIPT,
            episodeNumber: 2,
            title: "JS Memory Management",
            releaseCommitSha: "sha-mem",
          },
          recipients: [{ email: "mem@example.com", unsubscribeToken: "tok-mem" }],
        }),
      };

      const response = await EmailDispatchHandler({ Records: [record] }, undefined, {
        apiKey: "re_test_key_ex",
        fetchFn: mockFetch,
        sleepFn,
        maxRetries: 2,
        pacingDelayMs: 0,
      });

      // initial attempt (0) + 2 retries (1, 2) = 3 total attempts
      expect(callCount).toBe(3);
      expect(sleepFn).toHaveBeenCalledTimes(2);
      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "rec-exhausted-429" },
      ]);
    });

    it("immediately fails and does NOT retry non-transient HTTP 500 internal server error", async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve("Internal Server Error"),
        });
      });

      const record: SQSRecord = {
        messageId: "rec-resend-500",
        receiptHandle: "h-500",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-500",
            subject: SubjectChannel.FRONTEND,
            episodeNumber: 1,
            title: "Web Workers",
            releaseCommitSha: "sha-ww",
          },
          recipients: [{ email: "ww@example.com", unsubscribeToken: "tok-ww" }],
        }),
      };

      const response = await EmailDispatchHandler({ Records: [record] }, undefined, {
        apiKey: "re_test_key_500",
        fetchFn: mockFetch,
        maxRetries: 2,
        pacingDelayMs: 0,
      });

      // Only 1 call because 500 is non-transient
      expect(callCount).toBe(1);
      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "rec-resend-500" },
      ]);
    });

    it("immediately fails and does NOT retry HTTP 401 unauthorized or 403 forbidden", async () => {
      const failingSdk = {
        batch: {
          send: vi.fn().mockResolvedValue({
            data: null,
            error: {
              name: "unauthorized",
              message: "Invalid API key supplied",
              statusCode: 401,
            },
          }),
        },
      } as unknown as Resend;

      const record: SQSRecord = {
        messageId: "rec-resend-401",
        receiptHandle: "h-401",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-401",
            subject: SubjectChannel.BACKEND,
            episodeNumber: 1,
            title: "Auth Systems",
            releaseCommitSha: "sha-auth",
          },
          recipients: [{ email: "sec@example.com", unsubscribeToken: "tok-sec" }],
        }),
      };

      const response = await EmailDispatchHandler({ Records: [record] }, undefined, {
        resendClient: failingSdk,
        maxRetries: 3,
        pacingDelayMs: 0,
      });

      expect(failingSdk.batch.send).toHaveBeenCalledTimes(1);
      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "rec-resend-401" },
      ]);
    });

    it("safely isolates unexpected network exception (ECONNRESET) during batch delivery", async () => {
      const mockFetchNetworkErr = vi.fn().mockRejectedValue(new Error("ECONNRESET: socket closed"));

      const record: SQSRecord = {
        messageId: "rec-net-err",
        receiptHandle: "h-net",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-net",
            subject: SubjectChannel.JAVA,
            episodeNumber: 1,
            title: "Java Sockets",
            releaseCommitSha: "sha-sock",
          },
          recipients: [{ email: "sock@example.com", unsubscribeToken: "tok-sock" }],
        }),
      };

      const response = await EmailDispatchHandler({ Records: [record] }, undefined, {
        apiKey: "re_key_net",
        fetchFn: mockFetchNetworkErr,
        pacingDelayMs: 0,
      });

      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "rec-net-err" },
      ]);
    });
  });

  // ==========================================================================
  // Focus Area 5: Database Failure Non-Fatal (Does not re-send emails)
  // ==========================================================================
  describe("5. Database Failure Non-Fatal Resilience", () => {
    it("treats database failure during dispatchedAt stamping as non-fatal and does NOT re-send emails", async () => {
      // Setup DB to crash
      mockPrisma.publishedEpisode.updateMany.mockRejectedValue(
        new Error("Database deadlock / write connection dropped")
      );

      const record: SQSRecord = {
        messageId: "rec-db-fatal-test",
        receiptHandle: "h-db-fatal",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-db-test",
            subject: SubjectChannel.COMPUTER_NETWORKS,
            episodeNumber: 3,
            title: "DNS Resolution Flow",
            releaseCommitSha: "sha-dns",
          },
          recipients: [{ email: "netdev@example.com", unsubscribeToken: "tok-dns" }],
        }),
      };

      // Handler must NOT report this record in batchItemFailures
      const response = await EmailDispatchHandler({ Records: [record] }, undefined, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      // No item failures! Because the emails were already dispatched to Resend.
      expect(response.batchItemFailures).toEqual([]);
      // Resend was called exactly once
      expect(mockResendClient.batch.send).toHaveBeenCalledTimes(1);
    });

    it("verifies idempotency condition in database update query (dispatchedAt: null)", async () => {
      const record: SQSRecord = {
        messageId: "rec-db-query-check",
        receiptHandle: "h-db-qc",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-qc",
            subject: SubjectChannel.JAVASCRIPT,
            episodeNumber: 5,
            title: "Garbage Collection",
            releaseCommitSha: "sha-gc",
          },
          recipients: [{ email: "gc@example.com", unsubscribeToken: "tok-gc" }],
        }),
      };

      await processDispatchRecord(record, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      // Must explicitly query where dispatchedAt: null so already stamped records are unchanged
      expect(mockPrisma.publishedEpisode.updateMany).toHaveBeenCalledWith({
        where: {
          subject: SubjectChannel.JAVASCRIPT,
          episodeId: "ep-qc",
          dispatchedAt: null,
        },
        data: {
          dispatchedAt: expect.any(Date),
        },
      });
    });
  });

  // ==========================================================================
  // Focus Area 6: Rate Pacing (minIntervalMs = 600ms)
  // ==========================================================================
  describe("6. Rate Pacing Enforcement (minIntervalMs = 600ms)", () => {
    it("defaults to 600ms pacing delay when pacingDelayMs is omitted", async () => {
      const customPacer = new RatePacer();
      const waitSpy = vi.spyOn(customPacer, "wait").mockResolvedValue(undefined);

      const record: SQSRecord = {
        messageId: "rec-pacing-test",
        receiptHandle: "h-pace",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-pace",
            subject: SubjectChannel.FRONTEND,
            episodeNumber: 1,
            title: "Paint & Composite",
            releaseCommitSha: "sha-pc",
          },
          recipients: [{ email: "css@example.com", unsubscribeToken: "tok-pc" }],
        }),
      };

      // Do NOT pass pacingDelayMs to verify default
      await processDispatchRecord(record, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacer: customPacer,
      });

      // Verify wait was called with 600ms
      expect(waitSpy).toHaveBeenCalledWith(600);
    });

    it("RatePacer enforces elapsed delay between consecutive calls", async () => {
      const pacer = new RatePacer();
      const startTime = Date.now();

      await pacer.wait(80);
      await pacer.wait(80);

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(70);
    });

    it("RatePacer returns immediately if minIntervalMs <= 0", async () => {
      const pacer = new RatePacer();
      const startTime = Date.now();

      await pacer.wait(0);
      await pacer.wait(-10);

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(50);
    });

    it("calls pacer.wait for each record sequentially in a batch", async () => {
      const customPacer = new RatePacer();
      const waitSpy = vi.spyOn(customPacer, "wait").mockResolvedValue(undefined);

      const records: SQSRecord[] = [
        {
          messageId: "p-rec-1",
          receiptHandle: "h1",
          body: JSON.stringify({
            episode: { episodeId: "ep-p1", subject: SubjectChannel.BACKEND, episodeNumber: 1, title: "T1" },
            recipients: [{ email: "u1@example.com", unsubscribeToken: "t1" }],
          }),
        },
        {
          messageId: "p-rec-2",
          receiptHandle: "h2",
          body: JSON.stringify({
            episode: { episodeId: "ep-p2", subject: SubjectChannel.BACKEND, episodeNumber: 2, title: "T2" },
            recipients: [{ email: "u2@example.com", unsubscribeToken: "t2" }],
          }),
        },
      ];

      await EmailDispatchHandler({ Records: records }, undefined, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacer: customPacer,
        pacingDelayMs: 600,
      });

      expect(waitSpy).toHaveBeenCalledTimes(2);
      expect(waitSpy).toHaveBeenNthCalledWith(1, 600);
      expect(waitSpy).toHaveBeenNthCalledWith(2, 600);
    });
  });

  // ==========================================================================
  // Additional Edge Cases: Email Templates, Personalization & Headers
  // ==========================================================================
  describe("7. RFC 8058 Header and Template Personalization", () => {
    it("generates separate personalized tokens and RFC 8058 headers for multiple recipients in batch", () => {
      const payload: DispatchMessagePayload = {
        episode: {
          episodeId: "ep-crypto",
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeNumber: 4,
          title: "TLS 1.3 Key Exchange",
          summary: "Diffie-Hellman Ephemeral and Zero Round Trip Time",
          keyConcepts: ["ECDHE", "0-RTT", "Forward Secrecy"],
          releaseCommitSha: "sha-tls",
        },
        recipients: [
          { email: "alice@company.org", unsubscribeToken: "token-alice-secret-123" },
          { email: "bob@company.org", unsubscribeToken: "token-bob-secret-456" },
        ],
      };

      const emailItems = buildBatchEmailItems(payload, {
        appUrl: "https://systemsimulator.io",
      });

      expect(emailItems).toHaveLength(2);

      const aliceItem = emailItems[0];
      expect(aliceItem.to).toBe("alice@company.org");
      expect(aliceItem.subject).toContain("Computer Networks Release: TLS 1.3 Key Exchange");
      expect(aliceItem.html.startsWith("<!DOCTYPE html>")).toBe(true);
      expect(aliceItem.html).toContain("TLS 1.3 Key Exchange");
      expect(aliceItem.html).toContain("token-alice-secret-123");
      expect(aliceItem.headers["List-Unsubscribe"]).toContain("token=token-alice-secret-123");
      expect(aliceItem.headers["List-Unsubscribe"]).toContain("topic=COMPUTER_NETWORKS");
      expect(aliceItem.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");

      const bobItem = emailItems[1];
      expect(bobItem.to).toBe("bob@company.org");
      expect(bobItem.html).toContain("token-bob-secret-456");
      expect(bobItem.headers["List-Unsubscribe"]).toContain("token=token-bob-secret-456");
      expect(bobItem.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");

      // Verify tokens are isolated and never cross-pollinated
      expect(aliceItem.html).not.toContain("token-bob-secret-456");
      expect(bobItem.html).not.toContain("token-alice-secret-123");
    });

    it("supports kebab-case subject strings in SQS payload and normalizes them correctly", async () => {
      const record: SQSRecord = {
        messageId: "rec-kebab-subject",
        receiptHandle: "h-kebab",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-kebab",
            subject: "computer-networks", // kebab-case
            episodeNumber: 1,
            title: "Network Sockets",
            releaseCommitSha: "sha-ks",
          },
          recipients: [{ email: "dev@example.com", unsubscribeToken: "tok-kebab" }],
        }),
      };

      const result = await processDispatchRecord(record, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      expect(result.dispatchedCount).toBe(1);
      expect(mockPrisma.publishedEpisode.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ subject: SubjectChannel.COMPUTER_NETWORKS }),
        })
      );
    });

    it("respects custom ctaUrl override, custom sender formatting, and handles optional summary/concepts", () => {
      const payload: DispatchMessagePayload = dispatchMessagePayloadSchema.parse({
        episode: {
          episodeId: "ep-opt",
          subject: SubjectChannel.JAVASCRIPT,
          episodeNumber: 10,
          title: "Advanced JS",
          releaseCommitSha: "sha-opt",
          ctaUrl: "https://custom-domain.io/override-episode-url",
          // summary and keyConcepts omitted to verify schema defaults
        },
        recipients: [{ email: "reader@example.com", unsubscribeToken: "tok-reader" }],
      });

      const emailItems = buildBatchEmailItems(payload, {
        fromEmail: "custom-sender@systemsimulator.io", // plain email without angle brackets
      });

      expect(emailItems).toHaveLength(1);
      const item = emailItems[0];
      // Should wrap plain email in "System Simulator <email>"
      expect(item.from).toBe("System Simulator <custom-sender@systemsimulator.io>");
      // HTML must contain the custom ctaUrl
      expect(item.html).toContain("https://custom-domain.io/override-episode-url");
      // HTML must contain fallback summary
      expect(item.html).toContain("Episode 10 of Advanced JS is now live on System Simulator.");
    });
  });
});

