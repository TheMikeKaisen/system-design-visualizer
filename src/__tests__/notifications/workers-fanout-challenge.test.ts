import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubjectChannel, SubscriptionStatus, type PrismaClient } from "@prisma/client";
import { processEpisodeFanout, EpisodeFanoutHandler } from "@/workers/fanout";
import { enqueueDispatchBatch, chunkArray } from "@/workers/sqs";
import type { SQSEvent, DispatchMessagePayload } from "@/workers/types";
import type { SQSClient } from "@aws-sdk/client-sqs";

interface MockPrisma {
  publishedEpisode: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  subscriber: {
    findMany: ReturnType<typeof vi.fn>;
  };
}

describe("Empirical Challenger M4-1: Fanout & SQS Batching Stress Suite", () => {
  let mockPrisma: MockPrisma;
  let mockSqsClient: { send: ReturnType<typeof vi.fn> };
  let mockLogger: { info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockPrisma = {
      publishedEpisode: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({ id: "pe-challenge-1" }),
      },
      subscriber: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    mockSqsClient = {
      send: vi.fn().mockImplementation((command) => {
        const count = command.input.Entries?.length || 1;
        return Promise.resolve({
          Successful: Array.from({ length: count }, (_, i) => ({ Id: command.input.Entries?.[i]?.Id || `ok-${i}` })),
          Failed: [],
        });
      }),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  });

  // ==========================================================================
  // 1. Topic Matching: Target Discipline vs ALL vs Unrelated vs Both
  // ==========================================================================
  describe("Topic Matching: Target Discipline vs ALL vs Unrelated vs Both", () => {
    interface SubscriberRecord {
      id: string;
      email: string;
      status: SubscriptionStatus;
      isVerified: boolean;
      unsubscribeToken: string;
      subscriptions: Array<{ subject: SubjectChannel }>;
    }

    const testSubscribers: SubscriberRecord[] = [
      {
        id: "sub-target-only",
        email: "target-only@example.com",
        status: SubscriptionStatus.ACTIVE,
        isVerified: true,
        unsubscribeToken: "tok-1",
        subscriptions: [{ subject: SubjectChannel.COMPUTER_NETWORKS }],
      },
      {
        id: "sub-all-only",
        email: "all-only@example.com",
        status: SubscriptionStatus.ACTIVE,
        isVerified: true,
        unsubscribeToken: "tok-2",
        subscriptions: [{ subject: SubjectChannel.ALL }],
      },
      {
        id: "sub-unrelated-only",
        email: "unrelated-only@example.com",
        status: SubscriptionStatus.ACTIVE,
        isVerified: true,
        unsubscribeToken: "tok-3",
        subscriptions: [{ subject: SubjectChannel.JAVASCRIPT }],
      },
      {
        id: "sub-both-target-and-all",
        email: "both-target-all@example.com",
        status: SubscriptionStatus.ACTIVE,
        isVerified: true,
        unsubscribeToken: "tok-4",
        subscriptions: [
          { subject: SubjectChannel.COMPUTER_NETWORKS },
          { subject: SubjectChannel.ALL },
        ],
      },
      {
        id: "sub-multiple-unrelated",
        email: "multi-unrelated@example.com",
        status: SubscriptionStatus.ACTIVE,
        isVerified: true,
        unsubscribeToken: "tok-5",
        subscriptions: [
          { subject: SubjectChannel.JAVASCRIPT },
          { subject: SubjectChannel.OPERATING_SYSTEMS },
        ],
      },
      {
        id: "sub-target-and-unrelated",
        email: "target-and-unrelated@example.com",
        status: SubscriptionStatus.ACTIVE,
        isVerified: true,
        unsubscribeToken: "tok-6",
        subscriptions: [
          { subject: SubjectChannel.COMPUTER_NETWORKS },
          { subject: SubjectChannel.BACKEND },
        ],
      },
    ];

    it("accurately targets COMPUTER_NETWORKS and ALL while excluding unrelated disciplines and deduplicating dual subscriptions", async () => {
      // Simulate Prisma relational query evaluation in-memory oracle
      mockPrisma.subscriber.findMany.mockImplementation((args) => {
        const targetSubjects = args.where.subscriptions.some.subject.in as SubjectChannel[];
        const status = args.where.status;
        const isVerified = args.where.isVerified;

        const filtered = testSubscribers.filter((s) => {
          if (s.status !== status || s.isVerified !== isVerified) return false;
          return s.subscriptions.some((sub) => targetSubjects.includes(sub.subject));
        });

        return Promise.resolve(
          filtered.map((s) => ({
            id: s.id,
            email: s.email,
            unsubscribeToken: s.unsubscribeToken,
          }))
        );
      });

      const result = await processEpisodeFanout(
        {
          episodeId: "tcp-flow",
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeNumber: 1,
          title: "TCP Congestion Control",
          releaseCommitSha: "sha-net-1",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      // Verify Prisma query structure
      expect(mockPrisma.subscriber.findMany).toHaveBeenCalledWith({
        distinct: ["email"],
        where: {
          status: SubscriptionStatus.ACTIVE,
          isVerified: true,
          subscriptions: {
            some: {
              subject: {
                in: [SubjectChannel.COMPUTER_NETWORKS, SubjectChannel.ALL],
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          unsubscribeToken: true,
        },
      });

      // Target (COMPUTER_NETWORKS) + ALL + Both (target+ALL) + Target+Unrelated = 4 recipients
      // Unrelated-only (JAVASCRIPT) and Multi-unrelated (JS+OS) must NOT be present
      expect(result.totalRecipients).toBe(4);
      expect(result.chunksDispatched).toBe(1);

      const command = mockSqsClient.send.mock.calls[0][0];
      const chunkPayload = JSON.parse(command.input.Entries[0].MessageBody);
      const recipientEmails = chunkPayload.recipients.map((r: { email: string }) => r.email);

      expect(recipientEmails).toContain("target-only@example.com");
      expect(recipientEmails).toContain("all-only@example.com");
      expect(recipientEmails).toContain("both-target-all@example.com");
      expect(recipientEmails).toContain("target-and-unrelated@example.com");

      // Adversarial negative checks:
      expect(recipientEmails).not.toContain("unrelated-only@example.com");
      expect(recipientEmails).not.toContain("multi-unrelated@example.com");

      // Verify that subscriber with BOTH received exactly 1 email
      const dualSubOccurrences = recipientEmails.filter((e: string) => e === "both-target-all@example.com");
      expect(dualSubOccurrences).toHaveLength(1);
    });

    it("matches all active verified subscribers when episode subject is ALL", async () => {
      mockPrisma.subscriber.findMany.mockImplementation((args) => {
        const targetSubjects = args.where.subscriptions.some.subject.in as SubjectChannel[];
        const filtered = testSubscribers.filter((s) => {
          return s.status === args.where.status &&
                 s.isVerified === args.where.isVerified &&
                 s.subscriptions.some((sub) => targetSubjects.includes(sub.subject));
        });
        return Promise.resolve(
          filtered.map((s) => ({
            id: s.id,
            email: s.email,
            unsubscribeToken: s.unsubscribeToken,
          }))
        );
      });

      const result = await processEpisodeFanout(
        {
          episodeId: "sys-v2",
          subject: SubjectChannel.ALL,
          episodeNumber: 100,
          title: "System Simulator V2 Release",
          releaseCommitSha: "sha-v2",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      // All 6 unique subscribers have subscriptions in SubjectChannel and are ACTIVE + isVerified
      expect(result.totalRecipients).toBe(6);
      expect(result.chunksDispatched).toBe(1);
    });
  });

  // ==========================================================================
  // 2. Status Filtering: isVerified: false, UNSUBSCRIBED, and BOUNCED Exclusion
  // ==========================================================================
  describe("Status Filtering: isVerified: false, UNSUBSCRIBED, and BOUNCED Exclusion", () => {
    const mixedStatusSubscribers = [
      {
        id: "sub-unverified-active",
        email: "unverified-active@example.com",
        status: SubscriptionStatus.ACTIVE,
        isVerified: false, // EXCLUDED
        unsubscribeToken: "t1",
        subscriptions: [{ subject: SubjectChannel.JAVA }],
      },
      {
        id: "sub-unsubscribed-verified",
        email: "unsubscribed-verified@example.com",
        status: SubscriptionStatus.UNSUBSCRIBED, // EXCLUDED
        isVerified: true,
        unsubscribeToken: "t2",
        subscriptions: [{ subject: SubjectChannel.JAVA }],
      },
      {
        id: "sub-unsubscribed-unverified",
        email: "unsubscribed-unverified@example.com",
        status: SubscriptionStatus.UNSUBSCRIBED, // EXCLUDED
        isVerified: false,
        unsubscribeToken: "t3",
        subscriptions: [{ subject: SubjectChannel.JAVA }],
      },
      {
        id: "sub-bounced-verified",
        email: "bounced-verified@example.com",
        status: SubscriptionStatus.BOUNCED, // EXCLUDED
        isVerified: true,
        unsubscribeToken: "t4",
        subscriptions: [{ subject: SubjectChannel.JAVA }],
      },
      {
        id: "sub-bounced-unverified",
        email: "bounced-unverified@example.com",
        status: SubscriptionStatus.BOUNCED, // EXCLUDED
        isVerified: false,
        unsubscribeToken: "t5",
        subscriptions: [{ subject: SubjectChannel.JAVA }],
      },
      {
        id: "sub-valid-active-verified",
        email: "valid-active@example.com",
        status: SubscriptionStatus.ACTIVE, // INCLUDED
        isVerified: true,
        unsubscribeToken: "t6",
        subscriptions: [{ subject: SubjectChannel.JAVA }],
      },
    ];

    it("strictly excludes isVerified: false, UNSUBSCRIBED, and BOUNCED from the dispatch pipeline", async () => {
      // In-memory Prisma filter evaluation oracle
      mockPrisma.subscriber.findMany.mockImplementation((args) => {
        const targetSubjects = args.where.subscriptions.some.subject.in as SubjectChannel[];
        const filtered = mixedStatusSubscribers.filter((s) => {
          return s.status === args.where.status &&
                 s.isVerified === args.where.isVerified &&
                 s.subscriptions.some((sub) => targetSubjects.includes(sub.subject));
        });
        return Promise.resolve(
          filtered.map((s) => ({
            id: s.id,
            email: s.email,
            unsubscribeToken: s.unsubscribeToken,
          }))
        );
      });

      const result = await processEpisodeFanout(
        {
          episodeId: "java-gc",
          subject: SubjectChannel.JAVA,
          episodeNumber: 1,
          title: "ZGC & Shenandoah Architecture",
          releaseCommitSha: "sha-zgc",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      // Only the 1 ACTIVE + isVerified: true subscriber matches
      expect(result.totalRecipients).toBe(1);
      expect(result.chunksDispatched).toBe(1);

      const command = mockSqsClient.send.mock.calls[0][0];
      const payload = JSON.parse(command.input.Entries[0].MessageBody);
      const recipientEmails = payload.recipients.map((r: { email: string }) => r.email);

      expect(recipientEmails).toEqual(["valid-active@example.com"]);
      expect(recipientEmails).not.toContain("unverified-active@example.com");
      expect(recipientEmails).not.toContain("unsubscribed-verified@example.com");
      expect(recipientEmails).not.toContain("unsubscribed-unverified@example.com");
      expect(recipientEmails).not.toContain("bounced-verified@example.com");
      expect(recipientEmails).not.toContain("bounced-unverified@example.com");
    });
  });

  // ==========================================================================
  // 3. Chunking Boundaries: 0 recipients, 10 recipients, 25 recipients
  // ==========================================================================
  describe("Chunking Boundaries: 0 recipients, 10 recipients, 25 recipients", () => {
    it("boundary 0 recipients: 0 chunks, 0 SQS calls, sets totalRecipients to 0", async () => {
      mockPrisma.subscriber.findMany.mockResolvedValue([]);

      const result = await processEpisodeFanout(
        {
          episodeId: "zero-ep",
          subject: SubjectChannel.BACKEND,
          episodeNumber: 1,
          title: "Zero Subscribers Test",
          releaseCommitSha: "sha-zero",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      expect(result.status).toBe("NO_SUBSCRIBERS");
      expect(result.totalRecipients).toBe(0);
      expect(result.chunksDispatched).toBe(0);
      expect(mockSqsClient.send).not.toHaveBeenCalled();
      expect(mockPrisma.publishedEpisode.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { subject_episodeId: { subject: SubjectChannel.BACKEND, episodeId: "zero-ep" } },
          update: expect.objectContaining({ totalRecipients: 0 }),
          create: expect.objectContaining({ totalRecipients: 0 }),
        })
      );
    });

    it("boundary 10 recipients: exactly 1 chunk of size 10, 1 SQS SendMessageBatch call", async () => {
      const tenRecipients = Array.from({ length: 10 }, (_, i) => ({
        id: `s-ten-${i}`,
        email: `ten-${i}@example.com`,
        unsubscribeToken: `tok-ten-${i}`,
      }));
      mockPrisma.subscriber.findMany.mockResolvedValue(tenRecipients);

      const result = await processEpisodeFanout(
        {
          episodeId: "ten-ep",
          subject: SubjectChannel.OPERATING_SYSTEMS,
          episodeNumber: 4,
          title: "Page Replacement Algorithms",
          releaseCommitSha: "sha-ten",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      expect(result.status).toBe("DISPATCHED");
      expect(result.totalRecipients).toBe(10);
      expect(result.chunksDispatched).toBe(1);

      expect(mockSqsClient.send).toHaveBeenCalledTimes(1);
      const command = mockSqsClient.send.mock.calls[0][0];
      expect(command.input.Entries).toHaveLength(1);

      const chunkPayload = JSON.parse(command.input.Entries[0].MessageBody);
      expect(chunkPayload.recipients).toHaveLength(10);
      expect(chunkPayload.recipients[0].email).toBe("ten-0@example.com");
      expect(chunkPayload.recipients[9].email).toBe("ten-9@example.com");
    });

    it("boundary 25 recipients: exactly 3 chunks of sizes 10, 10, 5", async () => {
      const twentyFiveRecipients = Array.from({ length: 25 }, (_, i) => ({
        id: `s-25-${i}`,
        email: `twentyfive-${i}@example.com`,
        unsubscribeToken: `tok-25-${i}`,
      }));
      mockPrisma.subscriber.findMany.mockResolvedValue(twentyFiveRecipients);

      const result = await processEpisodeFanout(
        {
          episodeId: "twentyfive-ep",
          subject: SubjectChannel.JAVASCRIPT,
          episodeNumber: 8,
          title: "V8 Hidden Classes & Inline Caches",
          releaseCommitSha: "sha-25",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      expect(result.status).toBe("DISPATCHED");
      expect(result.totalRecipients).toBe(25);
      expect(result.chunksDispatched).toBe(3);

      expect(mockSqsClient.send).toHaveBeenCalledTimes(1);
      const command = mockSqsClient.send.mock.calls[0][0];
      expect(command.input.Entries).toHaveLength(3);

      const chunk0 = JSON.parse(command.input.Entries[0].MessageBody);
      const chunk1 = JSON.parse(command.input.Entries[1].MessageBody);
      const chunk2 = JSON.parse(command.input.Entries[2].MessageBody);

      expect(chunk0.recipients).toHaveLength(10);
      expect(chunk1.recipients).toHaveLength(10);
      expect(chunk2.recipients).toHaveLength(5);

      const allEmails = [
        ...chunk0.recipients.map((r: { email: string }) => r.email),
        ...chunk1.recipients.map((r: { email: string }) => r.email),
        ...chunk2.recipients.map((r: { email: string }) => r.email),
      ];
      expect(new Set(allEmails).size).toBe(25);
    });
  });

  // ==========================================================================
  // 4. SQS SendMessageBatchCommand Limits (<= 10 entries per call)
  // ==========================================================================
  describe("SQS SendMessageBatchCommand Limits (<= 10 entries per call)", () => {
    it("guarantees SendMessageBatchCommand NEVER receives > 10 entries even with 25 dispatch messages", async () => {
      // 25 dispatch payloads to enqueue
      const dispatchMessages: DispatchMessagePayload[] = Array.from({ length: 25 }, (_, i) => ({
        episode: {
          episodeId: `ep-${i}`,
          subject: SubjectChannel.FRONTEND,
          episodeNumber: i + 1,
          title: `CSS Grid Layout ${i}`,
          summary: "",
          keyConcepts: [],
          releaseCommitSha: "sha-fe",
        },
        recipients: [{ email: `fe-${i}@example.com`, unsubscribeToken: `tok-${i}` }],
      }));

      const batchEntriesCounts: number[] = [];
      const mockSqs = {
        send: vi.fn().mockImplementation((command) => {
          const entryCount = command.input.Entries.length;
          batchEntriesCounts.push(entryCount);
          return Promise.resolve({
            Successful: command.input.Entries.map((e: { Id: string }) => ({ Id: e.Id })),
            Failed: [],
          });
        }),
      } as unknown as SQSClient;

      const result = await enqueueDispatchBatch(
        dispatchMessages,
        "https://sqs.mock/dispatch-queue",
        mockSqs,
        { initialRetryDelayMs: 1 }
      );

      expect(result.successfulCount).toBe(25);
      expect(result.failedCount).toBe(0);

      // Verify that 25 messages were sent across 3 SQS calls
      expect(mockSqs.send).toHaveBeenCalledTimes(3);

      // Verify EVERY single call obeyed the AWS SQS <= 10 entries limit
      expect(batchEntriesCounts).toEqual([10, 10, 5]);
      batchEntriesCounts.forEach((count) => {
        expect(count).toBeLessThanOrEqual(10);
        expect(count).toBeGreaterThan(0);
      });
    });

    it("verifies chunkArray utility enforces strict boundaries", () => {
      const items = Array.from({ length: 37 }, (_, i) => i);
      const chunks = chunkArray(items, 10);
      expect(chunks).toHaveLength(4);
      expect(chunks.map((c) => c.length)).toEqual([10, 10, 10, 7]);
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(10);
      });
    });
  });

  // ==========================================================================
  // 5. SQS Partial Failure Recovery (Retrying response.Failed)
  // ==========================================================================
  describe("SQS Partial Failure Recovery (Retrying response.Failed)", () => {
    it("retries failed entries with backoff and recovers successfully", async () => {
      const dispatchMessages: DispatchMessagePayload[] = [
        {
          episode: {
            episodeId: "ep-recovery-1",
            subject: SubjectChannel.BACKEND,
            episodeNumber: 1,
            title: "Distributed Lock",
            summary: "",
            keyConcepts: [],
            releaseCommitSha: "sha-1",
          },
          recipients: [{ email: "r1@example.com", unsubscribeToken: "tok-r1" }],
        },
        {
          episode: {
            episodeId: "ep-recovery-2",
            subject: SubjectChannel.BACKEND,
            episodeNumber: 2,
            title: "Saga Pattern",
            summary: "",
            keyConcepts: [],
            releaseCommitSha: "sha-2",
          },
          recipients: [{ email: "r2@example.com", unsubscribeToken: "tok-r2" }],
        },
        {
          episode: {
            episodeId: "ep-recovery-3",
            subject: SubjectChannel.BACKEND,
            episodeNumber: 3,
            title: "Event Sourcing",
            summary: "",
            keyConcepts: [],
            releaseCommitSha: "sha-3",
          },
          recipients: [{ email: "r3@example.com", unsubscribeToken: "tok-r3" }],
        },
      ];

      let callAttempt = 0;
      const sleepFn = vi.fn().mockResolvedValue(undefined);

      const mockSqs = {
        send: vi.fn().mockImplementation((command) => {
          callAttempt++;
          const entries = command.input.Entries;

          if (callAttempt === 1) {
            // Attempt 1: Entry 0 succeeds, Entries 1 and 2 fail
            return Promise.resolve({
              Successful: [{ Id: entries[0].Id }],
              Failed: [
                { Id: entries[1].Id, Code: "ThrottlingException", Message: "Rate exceeded" },
                { Id: entries[2].Id, Code: "ServiceUnavailable", Message: "Transient SQS glitch" },
              ],
            });
          }

          if (callAttempt === 2) {
            // Attempt 2: Only [Entry 1, Entry 2] should be retried!
            // Entry 1 succeeds, Entry 2 fails
            expect(entries).toHaveLength(2);
            return Promise.resolve({
              Successful: [{ Id: entries[0].Id }],
              Failed: [
                { Id: entries[1].Id, Code: "ServiceUnavailable", Message: "Still recovering" },
              ],
            });
          }

          if (callAttempt === 3) {
            // Attempt 3: Only Entry 2 should be retried!
            expect(entries).toHaveLength(1);
            return Promise.resolve({
              Successful: [{ Id: entries[0].Id }],
              Failed: [],
            });
          }

          throw new Error("Unexpected call attempt");
        }),
      } as unknown as SQSClient;

      const result = await enqueueDispatchBatch(
        dispatchMessages,
        "https://sqs.mock/dispatch",
        mockSqs,
        { maxRetries: 3, initialRetryDelayMs: 50, sleepFn }
      );

      expect(result.successfulCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.failedEntries).toEqual([]);
      expect(callAttempt).toBe(3);

      // Verify sleepFn was called for attempts 1 and 2 with linear backoff (50ms, 100ms)
      expect(sleepFn).toHaveBeenCalledTimes(2);
      expect(sleepFn).toHaveBeenNthCalledWith(1, 50);
      expect(sleepFn).toHaveBeenNthCalledWith(2, 100);
    });

    it("propagates failure to EpisodeFanoutHandler when SQS fails persistently", async () => {
      mockPrisma.subscriber.findMany.mockResolvedValue([
        { id: "sub-1", email: "pers@example.com", unsubscribeToken: "tok-1" },
      ]);

      const failingSqs = {
        send: vi.fn().mockImplementation((command) => {
          return Promise.resolve({
            Successful: [],
            Failed: [
              {
                Id: command.input.Entries[0].Id,
                Code: "InternalError",
                Message: "Permanent SQS failure",
              },
            ],
          });
        }),
      } as unknown as SQSClient;

      const event: SQSEvent = {
        Records: [
          {
            messageId: "rec-persistent-fail",
            receiptHandle: "h-fail",
            body: JSON.stringify({
              episodeId: "ep-fail-perm",
              subject: SubjectChannel.JAVASCRIPT,
              episodeNumber: 1,
              title: "Permanent SQS Failure Test",
              releaseCommitSha: "sha-fail",
            }),
          },
        ],
      };

      const response = await EpisodeFanoutHandler(event, undefined, {
        db: mockPrisma as unknown as PrismaClient,
        sqsClient: failingSqs,
        dispatchQueueUrl: "https://sqs.mock/dispatch",
      });

      // The record must be returned in batchItemFailures for AWS SQS retry/DLQ
      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "rec-persistent-fail" },
      ]);

      // PublishedEpisode must NOT have been marked as dispatched!
      expect(mockPrisma.publishedEpisode.upsert).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 6. Idempotency Gate (Skipping dispatchedAt !== null)
  // ==========================================================================
  describe("Idempotency Gate (Skipping dispatchedAt !== null)", () => {
    it("skips fanout when dispatchedAt is already present and force is false", async () => {
      const existingDate = new Date("2026-10-31T10:00:00Z");
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "pe-idemp-1",
        subject: SubjectChannel.COMPUTER_NETWORKS,
        episodeId: "dns-recursive",
        totalRecipients: 50,
        dispatchedAt: existingDate,
      });

      const result = await processEpisodeFanout(
        {
          episodeId: "dns-recursive",
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeNumber: 2,
          title: "Recursive DNS Resolution",
          releaseCommitSha: "sha-dns",
          force: false,
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          logger: mockLogger as unknown as Console,
        }
      );

      expect(result.status).toBe("ALREADY_DISPATCHED");
      expect(result.totalRecipients).toBe(50);
      expect(result.chunksDispatched).toBe(0);
      expect(result.dispatchedAt).toBe(existingDate);

      // Verify no side-effects
      expect(mockPrisma.subscriber.findMany).not.toHaveBeenCalled();
      expect(mockSqsClient.send).not.toHaveBeenCalled();
      expect(mockPrisma.publishedEpisode.upsert).not.toHaveBeenCalled();
    });

    it("proceeds with fanout when existing record has dispatchedAt === null (e.g. created during ingest)", async () => {
      // Record exists but was never dispatched
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "pe-idemp-2",
        subject: SubjectChannel.COMPUTER_NETWORKS,
        episodeId: "bgp-routing",
        totalRecipients: 0,
        dispatchedAt: null, // NOT dispatched yet
      });

      mockPrisma.subscriber.findMany.mockResolvedValue([
        { id: "sub-1", email: "net-admin@example.com", unsubscribeToken: "tok-bgp" },
      ]);

      const result = await processEpisodeFanout(
        {
          episodeId: "bgp-routing",
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeNumber: 4,
          title: "BGP Path Vector Routing",
          releaseCommitSha: "sha-bgp",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      expect(result.status).toBe("DISPATCHED");
      expect(result.totalRecipients).toBe(1);
      expect(result.chunksDispatched).toBe(1);

      expect(mockPrisma.subscriber.findMany).toHaveBeenCalledTimes(1);
      expect(mockSqsClient.send).toHaveBeenCalledTimes(1);
      expect(mockPrisma.publishedEpisode.upsert).toHaveBeenCalledTimes(1);
    });

    it("bypasses idempotency check when force: true is explicitly provided", async () => {
      const existingDate = new Date("2026-10-31T10:00:00Z");
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "pe-idemp-3",
        subject: SubjectChannel.COMPUTER_NETWORKS,
        episodeId: "tls-handshake",
        totalRecipients: 30,
        dispatchedAt: existingDate,
      });

      mockPrisma.subscriber.findMany.mockResolvedValue([
        { id: "sub-1", email: "crypto@example.com", unsubscribeToken: "tok-tls" },
      ]);

      const result = await processEpisodeFanout(
        {
          episodeId: "tls-handshake",
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeNumber: 5,
          title: "TLS 1.3 Handshake Protocol",
          releaseCommitSha: "sha-tls",
          force: true, // BYPASS GATE
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      expect(result.status).toBe("DISPATCHED");
      expect(mockPrisma.subscriber.findMany).toHaveBeenCalledTimes(1);
      expect(mockSqsClient.send).toHaveBeenCalledTimes(1);
      expect(mockPrisma.publishedEpisode.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
