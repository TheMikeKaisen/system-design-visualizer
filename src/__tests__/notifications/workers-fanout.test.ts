import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubjectChannel, SubscriptionStatus, type PrismaClient } from "@prisma/client";
import {
  processEpisodeFanout,
  EpisodeFanoutHandler,
} from "@/workers/fanout";
import type { SQSEvent } from "@/workers/types";
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

interface MockLogger {
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
}

describe("Worker Fanout Handler (workers-fanout.test.ts)", () => {
  let mockPrisma: MockPrisma;
  let mockSqsClient: { send: ReturnType<typeof vi.fn> };
  let mockLogger: MockLogger;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockPrisma = {
      publishedEpisode: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({ id: "pub-1" }),
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
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  });

  describe("Payload Validation & Normalization", () => {
    it("rejects invalid payload with missing episodeId and title", async () => {
      await expect(
        processEpisodeFanout(
          {
            subject: "COMPUTER_NETWORKS",
            episodeNumber: 1,
            // episodeId and title missing
          },
          { db: mockPrisma as unknown as PrismaClient, sqsClient: mockSqsClient as unknown as SQSClient, logger: mockLogger as unknown as Console }
        )
      ).rejects.toThrow("Fanout message validation failed");
    });

    it("rejects invalid subject channel", async () => {
      await expect(
        processEpisodeFanout(
          {
            episodeId: "ep-1",
            subject: "INVALID_CHANNEL",
            episodeNumber: 1,
            title: "Test Episode",
            releaseCommitSha: "sha-1",
          },
          { db: mockPrisma as unknown as PrismaClient, sqsClient: mockSqsClient as unknown as SQSClient, logger: mockLogger as unknown as Console }
        )
      ).rejects.toThrow("Invalid subject channel");
    });

    it("normalizes kebab-case subject strings to SubjectChannel enum", async () => {
      mockPrisma.subscriber.findMany.mockResolvedValue([
        { id: "sub-1", email: "user@example.com", unsubscribeToken: "tok-1" },
      ]);

      const result = await processEpisodeFanout(
        {
          episodeId: "tcp-handshake",
          subject: "computer-networks",
          episodeNumber: 1,
          title: "TCP 3-Way Handshake",
          releaseCommitSha: "sha-net-1",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      expect(result.status).toBe("DISPATCHED");
      expect(result.subject).toBe(SubjectChannel.COMPUTER_NETWORKS);
      expect(result.totalRecipients).toBe(1);
      expect(result.chunksDispatched).toBe(1);
    });
  });

  describe("Idempotency Gate", () => {
    it("skips fanout when episode was already dispatched and force=false", async () => {
      const dispatchedDate = new Date("2026-10-15T12:00:00Z");
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "pe-1",
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "event-loop",
        totalRecipients: 42,
        dispatchedAt: dispatchedDate,
      });

      const result = await processEpisodeFanout(
        {
          episodeId: "event-loop",
          subject: SubjectChannel.JAVASCRIPT,
          episodeNumber: 1,
          title: "Event Loop Visualizer",
          releaseCommitSha: "sha-js-1",
          force: false,
        },
        { db: mockPrisma as unknown as PrismaClient, sqsClient: mockSqsClient as unknown as SQSClient, logger: mockLogger as unknown as Console }
      );

      expect(result.status).toBe("ALREADY_DISPATCHED");
      expect(result.totalRecipients).toBe(42);
      expect(result.chunksDispatched).toBe(0);
      expect(result.dispatchedAt).toBe(dispatchedDate);
      expect(mockPrisma.subscriber.findMany).not.toHaveBeenCalled();
      expect(mockSqsClient.send).not.toHaveBeenCalled();
    });

    it("bypasses idempotency gate when force=true", async () => {
      const dispatchedDate = new Date("2026-10-15T12:00:00Z");
      mockPrisma.publishedEpisode.findUnique.mockResolvedValue({
        id: "pe-1",
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "event-loop",
        totalRecipients: 42,
        dispatchedAt: dispatchedDate,
      });

      mockPrisma.subscriber.findMany.mockResolvedValue([
        { id: "sub-1", email: "fan@example.com", unsubscribeToken: "tok-1" },
      ]);

      const result = await processEpisodeFanout(
        {
          episodeId: "event-loop",
          subject: SubjectChannel.JAVASCRIPT,
          episodeNumber: 1,
          title: "Event Loop Visualizer",
          releaseCommitSha: "sha-js-1",
          force: true,
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
      expect(mockSqsClient.send).toHaveBeenCalled();
    });
  });

  describe("Subscriber Query & Deduplication", () => {
    it("queries active and verified subscribers for the channel OR ALL", async () => {
      mockPrisma.subscriber.findMany.mockResolvedValue([
        { id: "s1", email: "net-lover@example.com", unsubscribeToken: "tok-1" },
        { id: "s2", email: "all-lover@example.com", unsubscribeToken: "tok-2" },
      ]);

      await processEpisodeFanout(
        {
          episodeId: "dns-resolution",
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeNumber: 3,
          title: "DNS Resolution Flow",
          releaseCommitSha: "sha-dns",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

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
    });

    it("queries all subject channels when release channel is ALL", async () => {
      mockPrisma.subscriber.findMany.mockResolvedValue([]);

      await processEpisodeFanout(
        {
          episodeId: "global-launch",
          subject: SubjectChannel.ALL,
          episodeNumber: 1,
          title: "System Simulator V2",
          releaseCommitSha: "sha-v2",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      const queryArg = mockPrisma.subscriber.findMany.mock.calls[0][0];
      expect(queryArg.where.subscriptions.some.subject.in).toEqual(
        Object.values(SubjectChannel)
      );
    });

    it("deduplicates case-insensitive duplicate emails in memory", async () => {
      mockPrisma.subscriber.findMany.mockResolvedValue([
        { id: "s1", email: "User@Domain.COM", unsubscribeToken: "tok-1" },
        { id: "s2", email: "user@domain.com", unsubscribeToken: "tok-2" },
        { id: "s3", email: "other@domain.com", unsubscribeToken: "tok-3" },
      ]);

      const result = await processEpisodeFanout(
        {
          episodeId: "process-threads",
          subject: SubjectChannel.OPERATING_SYSTEMS,
          episodeNumber: 2,
          title: "Processes vs Threads",
          releaseCommitSha: "sha-os",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      expect(result.totalRecipients).toBe(2);
      expect(result.chunksDispatched).toBe(1);
    });
  });

  describe("Edge Case: 0 Subscribers", () => {
    it("handles 0 subscribers gracefully without calling SQS and updates metrics", async () => {
      mockPrisma.subscriber.findMany.mockResolvedValue([]);

      const result = await processEpisodeFanout(
        {
          episodeId: "zero-subs-ep",
          subject: SubjectChannel.FRONTEND,
          episodeNumber: 5,
          title: "Micro-frontends Visualizer",
          releaseCommitSha: "sha-fe",
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
          update: expect.objectContaining({ totalRecipients: 0 }),
          create: expect.objectContaining({ totalRecipients: 0 }),
        })
      );
    });
  });

  describe("Chunking into <= 10 Recipients per SQS Message", () => {
    it("slices 23 subscribers into 3 dispatch messages of sizes 10, 10, 3", async () => {
      const subscribers = Array.from({ length: 23 }, (_, i) => ({
        id: `s-${i}`,
        email: `dev${i}@example.com`,
        unsubscribeToken: `tok-${i}`,
      }));
      mockPrisma.subscriber.findMany.mockResolvedValue(subscribers);

      const result = await processEpisodeFanout(
        {
          episodeId: "ep-23",
          subject: SubjectChannel.BACKEND,
          episodeNumber: 10,
          title: "Distributed Consensus: Raft",
          releaseCommitSha: "sha-raft",
        },
        {
          db: mockPrisma as unknown as PrismaClient,
          sqsClient: mockSqsClient as unknown as SQSClient,
          dispatchQueueUrl: "https://sqs.mock/dispatch",
          logger: mockLogger as unknown as Console,
        }
      );

      expect(result.totalRecipients).toBe(23);
      expect(result.chunksDispatched).toBe(3);

      // Verify SQS SendMessageBatch was called with 3 entries
      expect(mockSqsClient.send).toHaveBeenCalledTimes(1);
      const command = mockSqsClient.send.mock.calls[0][0];
      expect(command.input.Entries).toHaveLength(3);

      const chunk1Payload = JSON.parse(command.input.Entries[0].MessageBody);
      const chunk2Payload = JSON.parse(command.input.Entries[1].MessageBody);
      const chunk3Payload = JSON.parse(command.input.Entries[2].MessageBody);

      expect(chunk1Payload.recipients).toHaveLength(10);
      expect(chunk2Payload.recipients).toHaveLength(10);
      expect(chunk3Payload.recipients).toHaveLength(3);
      expect(chunk1Payload.episode.title).toBe("Distributed Consensus: Raft");
    });
  });

  describe("Lambda SQS Event Handler (EpisodeFanoutHandler)", () => {
    it("returns empty batchItemFailures on complete success", async () => {
      mockPrisma.subscriber.findMany.mockResolvedValue([
        { id: "s1", email: "user@example.com", unsubscribeToken: "tok-1" },
      ]);

      const event: SQSEvent = {
        Records: [
          {
            messageId: "rec-1",
            receiptHandle: "h-1",
            body: JSON.stringify({
              episodeId: "ep-1",
              subject: SubjectChannel.JAVA,
              episodeNumber: 1,
              title: "Java Concurrency",
              releaseCommitSha: "sha-jc",
            }),
          },
        ],
      };

      const response = await EpisodeFanoutHandler(event, undefined, {
        db: mockPrisma as unknown as PrismaClient,
        sqsClient: mockSqsClient as unknown as SQSClient,
        dispatchQueueUrl: "https://sqs.mock/dispatch",
      });

      expect(response.batchItemFailures).toEqual([]);
    });

    it("isolates failures in batchItemFailures on malformed JSON", async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: "rec-malformed",
            receiptHandle: "h-malformed",
            body: "{not-valid-json",
          },
        ],
      };

      const response = await EpisodeFanoutHandler(event, undefined, {
        db: mockPrisma as unknown as PrismaClient,
        sqsClient: mockSqsClient as unknown as SQSClient,
      });

      expect(response.batchItemFailures).toEqual([
        { itemIdentifier: "rec-malformed" },
      ]);
    });

    it("returns empty failures for empty event.Records", async () => {
      const response = await EpisodeFanoutHandler({ Records: [] });
      expect(response.batchItemFailures).toEqual([]);
    });
  });
});
