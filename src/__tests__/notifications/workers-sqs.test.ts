import { describe, it, expect, vi, beforeEach } from "vitest";
import { SQSClient } from "@aws-sdk/client-sqs";
import {
  getSqsClient,
  resetDefaultSqsClient,
  chunkArray,
  enqueueFanoutMessage,
  enqueueDispatchBatch,
} from "@/workers/sqs";
import { SubjectChannel } from "@prisma/client";
import type { FanoutMessagePayload, DispatchMessagePayload } from "@/workers/types";

describe("Worker SQS Utilities (workers-sqs.test.ts)", () => {
  beforeEach(() => {
    resetDefaultSqsClient();
    vi.restoreAllMocks();
  });

  describe("getSqsClient & resetDefaultSqsClient", () => {
    it("creates an SQSClient instance with default region", () => {
      const client = getSqsClient();
      expect(client).toBeInstanceOf(SQSClient);
      const client2 = getSqsClient();
      expect(client2).toBe(client); // Singleton instance
    });

    it("creates a new SQSClient instance when customConfig is provided", () => {
      const client = getSqsClient({ region: "eu-west-1" });
      expect(client).toBeInstanceOf(SQSClient);
    });

    it("resets singleton client upon calling resetDefaultSqsClient", () => {
      const client1 = getSqsClient();
      resetDefaultSqsClient();
      const client2 = getSqsClient();
      expect(client2).not.toBe(client1);
    });
  });

  describe("chunkArray", () => {
    it("throws an error if chunkSize <= 0", () => {
      expect(() => chunkArray([1, 2, 3], 0)).toThrow("chunkSize must be greater than 0");
      expect(() => chunkArray([1, 2, 3], -1)).toThrow("chunkSize must be greater than 0");
    });

    it("returns empty array when input is empty or null", () => {
      expect(chunkArray([], 10)).toEqual([]);
      expect(chunkArray(null as unknown as number[], 10)).toEqual([]);
    });

    it("chunks array into specified size (25 items into [10, 10, 5])", () => {
      const items = Array.from({ length: 25 }, (_, i) => i + 1);
      const chunks = chunkArray(items, 10);
      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toHaveLength(10);
      expect(chunks[1]).toHaveLength(10);
      expect(chunks[2]).toHaveLength(5);
    });

    it("chunks exact multiple (20 items into [10, 10])", () => {
      const items = Array.from({ length: 20 }, (_, i) => i + 1);
      const chunks = chunkArray(items, 10);
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toHaveLength(10);
      expect(chunks[1]).toHaveLength(10);
    });

    it("handles single-item array", () => {
      const chunks = chunkArray(["single"], 10);
      expect(chunks).toEqual([["single"]]);
    });
  });

  describe("enqueueFanoutMessage", () => {
    it("throws an error if queueUrl is missing", async () => {
      const dummyPayload: FanoutMessagePayload = {
        episodeId: "ep-1",
        subject: SubjectChannel.JAVASCRIPT,
        episodeNumber: 1,
        title: "JS Event Loop",
        releaseCommitSha: "sha123",
        force: false,
        summary: "",
        keyConcepts: [],
      };

      // Ensure env var is empty
      const origEnv = process.env.SQS_FANOUT_QUEUE_URL;
      delete process.env.SQS_FANOUT_QUEUE_URL;

      try {
        await expect(enqueueFanoutMessage(dummyPayload, "")).rejects.toThrow(
          "SQS_FANOUT_QUEUE_URL is not configured."
        );
      } finally {
        if (origEnv) process.env.SQS_FANOUT_QUEUE_URL = origEnv;
      }
    });

    it("successfully sends message using mock SQSClient and returns messageId", async () => {
      const mockSend = vi.fn().mockResolvedValue({ MessageId: "msg-fanout-123" });
      const mockClient = { send: mockSend } as unknown as SQSClient;

      const dummyPayload: FanoutMessagePayload = {
        episodeId: "ep-101",
        subject: SubjectChannel.OPERATING_SYSTEMS,
        episodeNumber: 2,
        title: "Virtual Memory Paging",
        releaseCommitSha: "commit-abc-456",
        force: false,
        summary: "Detailed overview of paging and TLB.",
        keyConcepts: ["Paging", "TLB"],
      };

      const result = await enqueueFanoutMessage(
        dummyPayload,
        "https://sqs.us-east-1.amazonaws.com/123456789/fanout-queue",
        mockClient
      );

      expect(result).toBe("msg-fanout-123");
      expect(mockSend).toHaveBeenCalledTimes(1);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.QueueUrl).toBe(
        "https://sqs.us-east-1.amazonaws.com/123456789/fanout-queue"
      );
      const parsedBody = JSON.parse(command.input.MessageBody);
      expect(parsedBody.episodeId).toBe("ep-101");
      expect(parsedBody.subject).toBe("OPERATING_SYSTEMS");
    });
  });

  describe("enqueueDispatchBatch", () => {
    it("returns zero counts for empty payload array", async () => {
      const result = await enqueueDispatchBatch(
        [],
        "https://sqs.us-east-1.amazonaws.com/123456789/dispatch-queue"
      );
      expect(result).toEqual({
        successfulCount: 0,
        failedCount: 0,
        failedEntries: [],
      });
    });

    it("throws if queueUrl is missing", async () => {
      const orig = process.env.SQS_DISPATCH_QUEUE_URL;
      delete process.env.SQS_DISPATCH_QUEUE_URL;

      try {
        await expect(
          enqueueDispatchBatch(
            [
              {
                episode: {
                  episodeId: "ep-1",
                  subject: SubjectChannel.BACKEND,
                  episodeNumber: 1,
                  title: "Caching Strategies",
                  summary: "",
                  keyConcepts: [],
                  releaseCommitSha: "sha1",
                },
                recipients: [{ email: "dev@example.com", unsubscribeToken: "tok-1" }],
              },
            ],
            ""
          )
        ).rejects.toThrow("SQS_DISPATCH_QUEUE_URL is not configured.");
      } finally {
        if (orig) process.env.SQS_DISPATCH_QUEUE_URL = orig;
      }
    });

    it("sends batches in chunks of 10 entries and collects success", async () => {
      const payloads: DispatchMessagePayload[] = Array.from({ length: 25 }, (_, i) => ({
        episode: {
          episodeId: `ep-${i}`,
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeNumber: i + 1,
          title: `Network Episode ${i}`,
          summary: "",
          keyConcepts: [],
          releaseCommitSha: "sha-net",
        },
        recipients: [
          { email: `sub${i}@example.com`, unsubscribeToken: `tok-${i}` },
        ],
      }));

      const mockSend = vi.fn().mockImplementation((command) => {
        const count = command.input.Entries.length;
        return Promise.resolve({
          Successful: Array.from({ length: count }, (_, j) => ({ Id: `ok-${j}` })),
          Failed: [],
        });
      });
      const mockClient = { send: mockSend } as unknown as SQSClient;

      const result = await enqueueDispatchBatch(
        payloads,
        "https://sqs.us-east-1.amazonaws.com/123456789/dispatch-queue",
        mockClient,
        { initialRetryDelayMs: 1 }
      );

      expect(result.successfulCount).toBe(25);
      expect(result.failedCount).toBe(0);
      expect(result.failedEntries).toEqual([]);
      // 25 items chunked into batches of 10 -> 3 SQS SendMessageBatch calls (10, 10, 5)
      expect(mockSend).toHaveBeenCalledTimes(3);
      expect(mockSend.mock.calls[0][0].input.Entries).toHaveLength(10);
      expect(mockSend.mock.calls[1][0].input.Entries).toHaveLength(10);
      expect(mockSend.mock.calls[2][0].input.Entries).toHaveLength(5);
    });

    it("retries partial failures and collects remaining failures on exhaustion", async () => {
      const payloads: DispatchMessagePayload[] = [
        {
          episode: {
            episodeId: "ep-1",
            subject: SubjectChannel.JAVA,
            episodeNumber: 1,
            title: "Java Memory Model",
            summary: "",
            keyConcepts: [],
            releaseCommitSha: "sha-java",
          },
          recipients: [{ email: "a@example.com", unsubscribeToken: "tok-a" }],
        },
        {
          episode: {
            episodeId: "ep-2",
            subject: SubjectChannel.JAVA,
            episodeNumber: 2,
            title: "Garbage Collectors",
            summary: "",
            keyConcepts: [],
            releaseCommitSha: "sha-java",
          },
          recipients: [{ email: "b@example.com", unsubscribeToken: "tok-b" }],
        },
      ];

      let callCount = 0;
      const mockSend = vi.fn().mockImplementation((command) => {
        callCount++;
        const entries = command.input.Entries;
        if (callCount === 1) {
          // Entry 0 succeeds, Entry 1 fails
          return Promise.resolve({
            Successful: [{ Id: entries[0].Id }],
            Failed: [{ Id: entries[1].Id, Code: "ThrottlingException", Message: "Rate exceeded" }],
          });
        }
        // Attempt 2: Entry 1 still fails
        return Promise.resolve({
          Successful: [],
          Failed: [{ Id: entries[0].Id, Code: "ThrottlingException", Message: "Rate exceeded permanently" }],
        });
      });

      const mockClient = { send: mockSend } as unknown as SQSClient;
      const sleepFn = vi.fn().mockResolvedValue(undefined);

      const result = await enqueueDispatchBatch(
        payloads,
        "https://sqs.us-east-1.amazonaws.com/123456789/dispatch-queue",
        mockClient,
        { maxRetries: 2, initialRetryDelayMs: 10, sleepFn }
      );

      expect(callCount).toBe(2);
      expect(result.successfulCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.failedEntries).toHaveLength(1);
      expect(result.failedEntries[0].code).toBe("ThrottlingException");
      expect(sleepFn).toHaveBeenCalledWith(10);
    });
  });
});
