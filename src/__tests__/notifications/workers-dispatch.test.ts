import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubjectChannel } from "@prisma/client";
import {
  buildBatchEmailItems,
  processDispatchRecord,
  EmailDispatchHandler,
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

describe("Worker Dispatch Handler (workers-dispatch.test.ts)", () => {
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
          data: { data: [{ id: "resend-batch-msg-1" }] },
          error: null,
        }),
      },
    } as unknown as Resend;
  });

  describe("Dispatch Payload Schema Validation", () => {
    it("validates valid dispatch payload with 1..10 recipients", () => {
      const validPayload: DispatchMessagePayload = {
        episode: {
          episodeId: "ep-1",
          subject: SubjectChannel.JAVASCRIPT,
          episodeNumber: 1,
          title: "JS Promises & Async",
          summary: "Event loop and microtasks",
          keyConcepts: ["Microtasks", "Macrotasks"],
          releaseCommitSha: "sha-1",
        },
        recipients: [
          { email: "alice@example.com", unsubscribeToken: "tok-alice" },
          { email: "bob@example.com", unsubscribeToken: "tok-bob" },
        ],
      };

      const result = dispatchMessagePayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("rejects payload with 0 recipients (min: 1)", () => {
      const invalid = {
        episode: {
          episodeId: "ep-1",
          subject: SubjectChannel.JAVASCRIPT,
          episodeNumber: 1,
          title: "Title",
        },
        recipients: [],
      };

      const result = dispatchMessagePayloadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least 1 recipient is required");
      }
    });

    it("rejects payload with > 10 recipients (max: 10)", () => {
      const invalid = {
        episode: {
          episodeId: "ep-1",
          subject: SubjectChannel.JAVASCRIPT,
          episodeNumber: 1,
          title: "Title",
        },
        recipients: Array.from({ length: 11 }, (_, i) => ({
          email: `u${i}@example.com`,
          unsubscribeToken: `tok-${i}`,
        })),
      };

      const result = dispatchMessagePayloadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At most 10 recipients are allowed");
      }
    });

    it("rejects invalid email address in recipients", () => {
      const invalid = {
        episode: {
          episodeId: "ep-1",
          subject: SubjectChannel.OPERATING_SYSTEMS,
          episodeNumber: 1,
          title: "Linux Kernel",
        },
        recipients: [{ email: "not-an-email", unsubscribeToken: "tok-1" }],
      };

      const result = dispatchMessagePayloadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects empty unsubscribeToken", () => {
      const invalid = {
        episode: {
          episodeId: "ep-1",
          subject: SubjectChannel.OPERATING_SYSTEMS,
          episodeNumber: 1,
          title: "Linux Kernel",
        },
        recipients: [{ email: "valid@example.com", unsubscribeToken: "" }],
      };

      const result = dispatchMessagePayloadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("HTML Rendering & RFC 8058 Header Generation", () => {
    it("renders valid static HTML prefixed with <!DOCTYPE html> and RFC 8058 headers", () => {
      const payload: DispatchMessagePayload = {
        episode: {
          episodeId: "tcp-handshake",
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeNumber: 2,
          title: "TCP 3-Way Handshake Deep Dive",
          summary: "SYN, SYN-ACK, ACK packet exchange flow.",
          keyConcepts: ["SYN", "ACK", "Seq Numbers"],
          releaseCommitSha: "sha-net-2",
        },
        recipients: [
          { email: "student1@example.com", unsubscribeToken: "unsub-tok-111" },
          { email: "student2@example.com", unsubscribeToken: "unsub-tok-222" },
        ],
      };

      const emailItems = buildBatchEmailItems(payload, {
        appUrl: "https://systemsimulator.io",
      });

      expect(emailItems).toHaveLength(2);

      // Verify item 1
      const item1 = emailItems[0];
      expect(item1.to).toBe("student1@example.com");
      expect(item1.subject).toContain("Computer Networks Release: TCP 3-Way Handshake Deep Dive");
      expect(item1.html.startsWith("<!DOCTYPE html>")).toBe(true);
      expect(item1.html).toContain("TCP 3-Way Handshake Deep Dive");
      expect(item1.html).toContain("SYN, SYN-ACK, ACK packet exchange flow.");
      expect(item1.headers["List-Unsubscribe"]).toContain("token=unsub-tok-111");
      expect(item1.headers["List-Unsubscribe"]).toContain("topic=COMPUTER_NETWORKS");
      expect(item1.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");

      // Verify item 2 has unique unsubscribe token
      const item2 = emailItems[1];
      expect(item2.to).toBe("student2@example.com");
      expect(item2.headers["List-Unsubscribe"]).toContain("token=unsub-tok-222");
    });
  });

  describe("Resend Batch Send & Rate Pacing / 429 Retries", () => {
    it("dispatches batch successfully and stamps database telemetry", async () => {
      const record: SQSRecord = {
        messageId: "rec-ok-1",
        receiptHandle: "h-1",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-jvm",
            subject: SubjectChannel.JAVA,
            episodeNumber: 4,
            title: "JVM Bytecode & Classloading",
            summary: "ClassLoader hierarchy and execution engine.",
            keyConcepts: ["ClassLoader", "Bytecode"],
            releaseCommitSha: "sha-jvm",
          },
          recipients: [{ email: "java-dev@example.com", unsubscribeToken: "tok-j" }],
        }),
      };

      const customPacer = new RatePacer();
      const waitSpy = vi.spyOn(customPacer, "wait");

      const result = await processDispatchRecord(record, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacer: customPacer,
        pacingDelayMs: 0,
      });

      expect(result.dispatchedCount).toBe(1);
      expect(waitSpy).toHaveBeenCalled();
      expect(mockResendClient.batch.send).toHaveBeenCalledTimes(1);
      expect(mockPrisma.publishedEpisode.updateMany).toHaveBeenCalledWith({
        where: {
          subject: SubjectChannel.JAVA,
          episodeId: "ep-jvm",
          dispatchedAt: null,
        },
        data: {
          dispatchedAt: expect.any(Date),
        },
      });
    });

    it("retries on 429 rate limit error and recovers", async () => {
      let sendAttempts = 0;
      const resendWith429 = {
        batch: {
          send: vi.fn().mockImplementation(() => {
            sendAttempts++;
            if (sendAttempts === 1) {
              return Promise.resolve({
                data: null,
                error: { name: "rate_limit_exceeded", message: "Rate limit exceeded (429)", statusCode: 429 },
              });
            }
            return Promise.resolve({
              data: { data: [{ id: "recovered-id" }] },
              error: null,
            });
          }),
        },
      } as unknown as Resend;

      const record: SQSRecord = {
        messageId: "rec-retry-429",
        receiptHandle: "h-429",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-429",
            subject: SubjectChannel.BACKEND,
            episodeNumber: 1,
            title: "Database Indexing",
            summary: "B-Trees and LSM Trees",
            releaseCommitSha: "sha-idx",
          },
          recipients: [{ email: "db@example.com", unsubscribeToken: "tok-db" }],
        }),
      };

      const sleepFn = vi.fn().mockResolvedValue(undefined);

      const result = await processDispatchRecord(record, {
        resendClient: resendWith429,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
        sleepFn,
      });

      expect(result.dispatchedCount).toBe(1);
      expect(sendAttempts).toBe(2);
      expect(sleepFn).toHaveBeenCalled();
    });

    it("does not fail email delivery if database telemetry update fails (non-fatal)", async () => {
      mockPrisma.publishedEpisode.updateMany.mockRejectedValue(
        new Error("Postgres connection timeout")
      );

      const record: SQSRecord = {
        messageId: "rec-db-err",
        receiptHandle: "h-db",
        body: JSON.stringify({
          episode: {
            episodeId: "ep-db-fail",
            subject: SubjectChannel.FRONTEND,
            episodeNumber: 1,
            title: "CSS Layout Engines",
            releaseCommitSha: "sha-css",
          },
          recipients: [{ email: "frontend@example.com", unsubscribeToken: "tok-fe" }],
        }),
      };

      // Should complete successfully without throwing
      const result = await processDispatchRecord(record, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      expect(result.dispatchedCount).toBe(1);
      expect(mockResendClient.batch.send).toHaveBeenCalled();
    });
  });

  describe("ReportBatchItemFailures Selective Retries", () => {
    it("reports selective batch failure for failed records while keeping successful ones", async () => {
      const validPayload1 = {
        episode: {
          episodeId: "ep-1",
          subject: SubjectChannel.JAVASCRIPT,
          episodeNumber: 1,
          title: "Event Loop",
          releaseCommitSha: "sha-1",
        },
        recipients: [{ email: "user1@example.com", unsubscribeToken: "tok-1" }],
      };

      const validPayload3 = {
        episode: {
          episodeId: "ep-3",
          subject: SubjectChannel.JAVASCRIPT,
          episodeNumber: 3,
          title: "V8 Engine Internals",
          releaseCommitSha: "sha-3",
        },
        recipients: [{ email: "user3@example.com", unsubscribeToken: "tok-3" }],
      };

      const event: SQSEvent = {
        Records: [
          { messageId: "msg-1-ok", receiptHandle: "h-1", body: JSON.stringify(validPayload1) },
          { messageId: "msg-2-bad", receiptHandle: "h-2", body: "invalid-json{{{" },
          { messageId: "msg-3-ok", receiptHandle: "h-3", body: JSON.stringify(validPayload3) },
        ],
      };

      const response = await EmailDispatchHandler(event, undefined, {
        resendClient: mockResendClient,
        prismaClient: mockPrisma as unknown as typeof defaultPrisma,
        pacingDelayMs: 0,
      });

      // Exactly msg-2-bad should be reported in batchItemFailures
      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "msg-2-bad" },
      ]);

      // Both record 1 and record 3 were dispatched
      expect(mockResendClient.batch.send).toHaveBeenCalledTimes(2);
    });

    it("handles empty event.Records array without error", async () => {
      const response = await EmailDispatchHandler({ Records: [] });
      expect(response.batchItemFailures).toEqual([]);
    });
  });
});
