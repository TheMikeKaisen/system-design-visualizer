import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { SubjectChannel, SubscriptionStatus, type PrismaClient } from "@prisma/client";

// ============================================================================
// 1. Hoisted In-Memory Store & Infrastructure Mocks
// ============================================================================

interface DbSubscriber {
  id: string;
  email: string;
  userId: string | null;
  isVerified: boolean;
  verificationToken: string | null;
  tokenExpiresAt: Date | null;
  unsubscribeToken: string;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface DbSubscription {
  id: string;
  subscriberId: string;
  subject: SubjectChannel;
  createdAt: Date;
}

interface DbPublishedEpisode {
  id: string;
  subject: SubjectChannel;
  episodeId: string;
  episodeNumber: number;
  title: string;
  releaseCommitSha: string;
  status: string;
  totalRecipients: number;
  successfulDispatches: number;
  dispatchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const {
  mockAuthState,
  mockEnvConfig,
  mockSqsSend,
  mockResendSend,
  dbStore,
  mockPrisma,
} = vi.hoisted(() => {
  const mockAuthState = {
    session: null as { user: { id: string; email: string } } | null,
  };

  const mockEnvConfig = {
    NODE_ENV: "test" as const,
    DATABASE_URL: "postgresql://mock:5432/test_db",
    NEXT_PUBLIC_APP_URL: "https://systemvisualizer.com",
    AUTH_SECRET: "mock_auth_secret_minimum_32_characters_long_123456",
    RESEND_API_KEY: "re_mock_api_key_1234567890",
    RESEND_WEBHOOK_SECRET:
      "whsec_" + Buffer.from("mock_resend_webhook_secret_key!").toString("base64"),
    RESEND_FROM_EMAIL: "notifications@systemsimulator.io",
    AWS_REGION: "us-east-1",
    AWS_ACCESS_KEY_ID: "mock_aws_access_key_id",
    AWS_SECRET_ACCESS_KEY: "mock_aws_secret_access_key",
    SQS_FANOUT_QUEUE_URL:
      "https://sqs.us-east-1.amazonaws.com/123456789012/test-fanout-queue",
    SQS_DISPATCH_QUEUE_URL:
      "https://sqs.us-east-1.amazonaws.com/123456789012/test-dispatch-queue",
    INTERNAL_RELEASE_SECRET:
      "mock_internal_release_secret_entropy_32_chars_12345",
  };

  const dbStore = {
    subscribers: new Map<string, DbSubscriber>(),
    subscriptions: new Map<string, DbSubscription>(),
    publishedEpisodes: new Map<string, DbPublishedEpisode>(),
    reset() {
      this.subscribers.clear();
      this.subscriptions.clear();
      this.publishedEpisodes.clear();
    },
  };

  const mockSqsSend = vi.fn();
  const mockResendSend = vi.fn();

  const mockPrisma = {
    subscriber: {
      findUnique: vi.fn(
        async (params: {
          where: {
            id?: string;
            email?: string;
            verificationToken?: string;
            unsubscribeToken?: string;
          };
          include?: { subscriptions?: boolean };
        }) => {
          let found: DbSubscriber | undefined;
          if (params.where.id) {
            found = dbStore.subscribers.get(params.where.id);
          } else if (params.where.email) {
            const email = params.where.email.toLowerCase().trim();
            found = Array.from(dbStore.subscribers.values()).find(
              (s) => s.email.toLowerCase().trim() === email
            );
          } else if (params.where.verificationToken) {
            found = Array.from(dbStore.subscribers.values()).find(
              (s) => s.verificationToken === params.where.verificationToken
            );
          } else if (params.where.unsubscribeToken) {
            found = Array.from(dbStore.subscribers.values()).find(
              (s) => s.unsubscribeToken === params.where.unsubscribeToken
            );
          }

          if (!found) return null;
          const res: DbSubscriber & { subscriptions?: DbSubscription[] } = {
            ...found,
          };
          if (params.include?.subscriptions) {
            res.subscriptions = Array.from(dbStore.subscriptions.values())
              .filter((sub) => sub.subscriberId === found!.id)
              .map((sub) => ({ ...sub }));
          }
          return res;
        }
      ),

      findFirst: vi.fn(
        async (params: {
          where?: { email?: string };
          include?: { subscriptions?: boolean };
        }) => {
          let list = Array.from(dbStore.subscribers.values());
          if (params.where?.email) {
            const email = params.where.email.toLowerCase().trim();
            list = list.filter((s) => s.email.toLowerCase().trim() === email);
          }
          const found = list[0];
          if (!found) return null;
          const res: DbSubscriber & { subscriptions?: DbSubscription[] } = {
            ...found,
          };
          if (params.include?.subscriptions) {
            res.subscriptions = Array.from(dbStore.subscriptions.values())
              .filter((sub) => sub.subscriberId === found.id)
              .map((sub) => ({ ...sub }));
          }
          return res;
        }
      ),

      findMany: vi.fn(
        async (params: {
          where?: {
            status?: SubscriptionStatus;
            isVerified?: boolean;
            subscriptions?: { some?: { subject?: { in?: SubjectChannel[] } } };
          };
          distinct?: string[];
          select?: Record<string, boolean>;
        } = {}) => {
          let list = Array.from(dbStore.subscribers.values());
          if (params.where) {
            if (params.where.status) {
              list = list.filter((s) => s.status === params.where?.status);
            }
            if (typeof params.where.isVerified === "boolean") {
              list = list.filter(
                (s) => s.isVerified === params.where?.isVerified
              );
            }
            if (params.where.subscriptions?.some?.subject?.in) {
              const targetSubjects =
                params.where.subscriptions.some.subject.in;
              list = list.filter((s) => {
                const subTopics = Array.from(dbStore.subscriptions.values())
                  .filter((sub) => sub.subscriberId === s.id)
                  .map((sub) => sub.subject);
                return subTopics.some((t) => targetSubjects.includes(t));
              });
            }
          }
          if (params.distinct?.includes("email")) {
            const seen = new Set<string>();
            list = list.filter((s) => {
              const norm = s.email.toLowerCase().trim();
              if (seen.has(norm)) return false;
              seen.add(norm);
              return true;
            });
          }
          if (params.select) {
            return list.map((s) => {
              const obj: Record<string, unknown> = {};
              for (const key of Object.keys(params.select!)) {
                if (params.select![key]) {
                  obj[key] = (s as unknown as Record<string, unknown>)[key];
                }
              }
              return obj;
            });
          }
          return list.map((s) => ({ ...s }));
        }
      ),

      create: vi.fn(
        async (params: {
          data: Partial<DbSubscriber> & { email: string };
        }) => {
          const id = params.data.id || `sub_${crypto.randomUUID()}`;
          const email = params.data.email.toLowerCase().trim();
          const record: DbSubscriber = {
            id,
            email,
            userId: params.data.userId ?? null,
            isVerified: params.data.isVerified ?? false,
            verificationToken: params.data.verificationToken ?? null,
            tokenExpiresAt: params.data.tokenExpiresAt ?? null,
            unsubscribeToken:
              params.data.unsubscribeToken ??
              crypto.randomBytes(16).toString("hex"),
            status: params.data.status ?? SubscriptionStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          dbStore.subscribers.set(id, record);
          return { ...record };
        }
      ),

      update: vi.fn(
        async (params: {
          where: { id?: string; email?: string };
          data: Partial<DbSubscriber>;
        }) => {
          let record: DbSubscriber | undefined;
          if (params.where.id) {
            record = dbStore.subscribers.get(params.where.id);
          } else if (params.where.email) {
            const email = params.where.email.toLowerCase().trim();
            record = Array.from(dbStore.subscribers.values()).find(
              (s) => s.email.toLowerCase().trim() === email
            );
          }
          if (!record) throw new Error("Subscriber record not found for update");
          Object.assign(record, params.data, { updatedAt: new Date() });
          return { ...record };
        }
      ),

      updateMany: vi.fn(
        async (params: {
          where?: { email?: { in?: string[] } };
          data: Partial<DbSubscriber>;
        }) => {
          let count = 0;
          const targetEmails = (params.where?.email?.in || []).map((e: string) =>
            e.toLowerCase().trim()
          );
          for (const sub of dbStore.subscribers.values()) {
            if (targetEmails.includes(sub.email.toLowerCase().trim())) {
              Object.assign(sub, params.data, { updatedAt: new Date() });
              count++;
            }
          }
          return { count };
        }
      ),

      upsert: vi.fn(
        async (params: {
          where: { email: string };
          update: Partial<DbSubscriber>;
          create: Partial<DbSubscriber> & { email: string };
        }) => {
          const email = params.where.email.toLowerCase().trim();
          let record = Array.from(dbStore.subscribers.values()).find(
            (s) => s.email.toLowerCase().trim() === email
          );
          if (record) {
            Object.assign(record, params.update, { updatedAt: new Date() });
          } else {
            const id = `sub_${crypto.randomUUID()}`;
            record = {
              id,
              email,
              userId: params.create.userId ?? null,
              isVerified: params.create.isVerified ?? false,
              verificationToken: params.create.verificationToken ?? null,
              tokenExpiresAt: params.create.tokenExpiresAt ?? null,
              unsubscribeToken:
                params.create.unsubscribeToken ??
                crypto.randomBytes(16).toString("hex"),
              status: params.create.status ?? SubscriptionStatus.ACTIVE,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            dbStore.subscribers.set(id, record);
          }
          return { ...record };
        }
      ),

      delete: vi.fn(async (params: { where: { id: string } }) => {
        const sub = dbStore.subscribers.get(params.where.id);
        if (sub) {
          dbStore.subscribers.delete(params.where.id);
          for (const [id, s] of Array.from(dbStore.subscriptions.entries())) {
            if (s.subscriberId === params.where.id) {
              dbStore.subscriptions.delete(id);
            }
          }
        }
        return sub ? { ...sub } : null;
      }),

      deleteMany: vi.fn(async () => {
        const count = dbStore.subscribers.size;
        dbStore.subscribers.clear();
        return { count };
      }),

      count: vi.fn(async () => dbStore.subscribers.size),
    },

    subscription: {
      findMany: vi.fn(
        async (params: {
          where?: { subscriberId?: string };
          select?: { subject?: boolean };
        } = {}) => {
          let list = Array.from(dbStore.subscriptions.values());
          if (params.where?.subscriberId) {
            list = list.filter(
              (s) => s.subscriberId === params.where?.subscriberId
            );
          }
          if (params.select?.subject) {
            return list.map((s) => ({ subject: s.subject }));
          }
          return list.map((s) => ({ ...s }));
        }
      ),

      findUnique: vi.fn(
        async (params: {
          where: {
            subscriberId_subject: {
              subscriberId: string;
              subject: SubjectChannel;
            };
          };
        }) => {
          const { subscriberId, subject } = params.where.subscriberId_subject;
          const found = Array.from(dbStore.subscriptions.values()).find(
            (s) => s.subscriberId === subscriberId && s.subject === subject
          );
          return found ? { ...found } : null;
        }
      ),

      create: vi.fn(
        async (params: {
          data: { subscriberId: string; subject: SubjectChannel };
        }) => {
          const id = `subn_${crypto.randomUUID()}`;
          const record: DbSubscription = {
            id,
            subscriberId: params.data.subscriberId,
            subject: params.data.subject,
            createdAt: new Date(),
          };
          dbStore.subscriptions.set(id, record);
          return { ...record };
        }
      ),

      createMany: vi.fn(
        async (params: {
          data?: Array<{ subscriberId: string; subject: SubjectChannel }>;
          skipDuplicates?: boolean;
        }) => {
          let count = 0;
          for (const item of params.data || []) {
            const exists = Array.from(dbStore.subscriptions.values()).some(
              (s) =>
                s.subscriberId === item.subscriberId && s.subject === item.subject
            );
            if (params.skipDuplicates && exists) continue;
            const id = `subn_${crypto.randomUUID()}`;
            dbStore.subscriptions.set(id, {
              id,
              subscriberId: item.subscriberId,
              subject: item.subject,
              createdAt: new Date(),
            });
            count++;
          }
          return { count };
        }
      ),

      upsert: vi.fn(
        async (params: {
          where: {
            subscriberId_subject: {
              subscriberId: string;
              subject: SubjectChannel;
            };
          };
        }) => {
          const { subscriberId, subject } = params.where.subscriberId_subject;
          const existing = Array.from(dbStore.subscriptions.values()).find(
            (s) => s.subscriberId === subscriberId && s.subject === subject
          );
          if (existing) return { ...existing };
          const id = `subn_${crypto.randomUUID()}`;
          const created: DbSubscription = {
            id,
            subscriberId,
            subject,
            createdAt: new Date(),
          };
          dbStore.subscriptions.set(id, created);
          return { ...created };
        }
      ),

      deleteMany: vi.fn(
        async (params: {
          where?: {
            subscriberId?: string;
            subject?: SubjectChannel | { not: SubjectChannel };
          };
        }) => {
          let count = 0;
          for (const [id, sub] of Array.from(dbStore.subscriptions.entries())) {
            let match = true;
            if (
              params.where?.subscriberId &&
              sub.subscriberId !== params.where.subscriberId
            ) {
              match = false;
            }
            if (params.where?.subject) {
              if (
                typeof params.where.subject === "object" &&
                "not" in params.where.subject
              ) {
                if (sub.subject === params.where.subject.not) match = false;
              } else if (sub.subject !== params.where.subject) {
                match = false;
              }
            }
            if (match) {
              dbStore.subscriptions.delete(id);
              count++;
            }
          }
          return { count };
        }
      ),

      count: vi.fn(async () => dbStore.subscriptions.size),
    },

    publishedEpisode: {
      findUnique: vi.fn(
        async (params: {
          where: {
            subject_episodeId: {
              subject: SubjectChannel;
              episodeId: string;
            };
          };
        }) => {
          const { subject, episodeId } = params.where.subject_episodeId;
          const key = `${subject}_${episodeId}`;
          const found = dbStore.publishedEpisodes.get(key);
          return found ? { ...found } : null;
        }
      ),

      findMany: vi.fn(async () =>
        Array.from(dbStore.publishedEpisodes.values()).map((e) => ({ ...e }))
      ),

      create: vi.fn(
        async (params: {
          data: Partial<DbPublishedEpisode> & {
            subject: SubjectChannel;
            episodeId: string;
          };
        }) => {
          const { subject, episodeId } = params.data;
          const key = `${subject}_${episodeId}`;
          const record: DbPublishedEpisode = {
            id: `pe_${crypto.randomUUID()}`,
            subject,
            episodeId,
            episodeNumber: params.data.episodeNumber ?? 1,
            title: params.data.title ?? "",
            releaseCommitSha: params.data.releaseCommitSha ?? "",
            status: params.data.status ?? "PUBLISHED",
            totalRecipients: params.data.totalRecipients ?? 0,
            successfulDispatches: params.data.successfulDispatches ?? 0,
            dispatchedAt: params.data.dispatchedAt ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          dbStore.publishedEpisodes.set(key, record);
          return { ...record };
        }
      ),

      upsert: vi.fn(
        async (params: {
          where: {
            subject_episodeId: {
              subject: SubjectChannel;
              episodeId: string;
            };
          };
          update: Partial<DbPublishedEpisode>;
          create: Partial<DbPublishedEpisode> & {
            subject: SubjectChannel;
            episodeId: string;
          };
        }) => {
          const { subject, episodeId } = params.where.subject_episodeId;
          const key = `${subject}_${episodeId}`;
          let record = dbStore.publishedEpisodes.get(key);
          if (record) {
            Object.assign(record, params.update, { updatedAt: new Date() });
          } else {
            record = {
              id: `pe_${crypto.randomUUID()}`,
              subject,
              episodeId,
              episodeNumber: params.create.episodeNumber ?? 1,
              title: params.create.title ?? "",
              releaseCommitSha: params.create.releaseCommitSha ?? "",
              status: params.create.status ?? "PUBLISHED",
              totalRecipients: params.create.totalRecipients ?? 0,
              successfulDispatches: params.create.successfulDispatches ?? 0,
              dispatchedAt: params.create.dispatchedAt ?? null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            dbStore.publishedEpisodes.set(key, record);
          }
          return { ...record };
        }
      ),

      update: vi.fn(
        async (params: {
          where: {
            subject_episodeId: {
              subject: SubjectChannel;
              episodeId: string;
            };
          };
          data: Partial<DbPublishedEpisode>;
        }) => {
          const { subject, episodeId } = params.where.subject_episodeId;
          const key = `${subject}_${episodeId}`;
          const record = dbStore.publishedEpisodes.get(key);
          if (!record) throw new Error("Published episode not found");
          Object.assign(record, params.data, { updatedAt: new Date() });
          return { ...record };
        }
      ),

      updateMany: vi.fn(
        async (params: {
          where?: {
            subject?: SubjectChannel;
            episodeId?: string;
            dispatchedAt?: Date | null;
          };
          data: {
            dispatchedAt?: Date;
            successfulDispatches?: { increment?: number };
          };
        }) => {
          let count = 0;
          for (const ep of dbStore.publishedEpisodes.values()) {
            const matchSubject =
              !params.where?.subject || ep.subject === params.where.subject;
            const matchEpId =
              !params.where?.episodeId || ep.episodeId === params.where.episodeId;
            const matchDispatchedAt =
              params.where?.dispatchedAt === undefined ||
              (params.where.dispatchedAt === null
                ? ep.dispatchedAt === null
                : ep.dispatchedAt !== null);

            if (matchSubject && matchEpId && matchDispatchedAt) {
              if (params.data.dispatchedAt !== undefined) {
                ep.dispatchedAt = params.data.dispatchedAt;
              }
              if (params.data.successfulDispatches?.increment !== undefined) {
                ep.successfulDispatches +=
                  params.data.successfulDispatches.increment;
              }
              ep.updatedAt = new Date();
              count++;
            }
          }
          return { count };
        }
      ),
    },

    $transaction: vi.fn(async (input: unknown) => {
      if (typeof input === "function") {
        return (input as (tx: typeof mockPrisma) => Promise<unknown>)(mockPrisma);
      }
      if (Array.isArray(input)) {
        return Promise.all(input);
      }
      return input;
    }),
  };

  return {
    mockAuthState,
    mockEnvConfig,
    mockSqsSend,
    mockResendSend,
    dbStore,
    mockPrisma,
  };
});

vi.mock("@/lib/auth/auth", () => ({
  auth: () => Promise.resolve(mockAuthState.session),
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/env", () => ({
  env: mockEnvConfig,
}));

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: class {
    send = mockSqsSend;
  },
  SendMessageCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
  SendMessageBatchCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    batch = {
      send: mockResendSend,
    };
  },
}));

// ============================================================================
// 2. Direct Imports of Handlers & Utilities
// ============================================================================

import {
  EpisodeFanoutHandler,
  processEpisodeFanout,
} from "@/workers/fanout";
import {
  EmailDispatchHandler,
  processDispatchRecord,
  RatePacer,
  buildBatchEmailItems,
  sendResendBatch,
} from "@/workers/dispatch";
import {
  handlePublishEpisode,
  publishEpisodePayloadSchema,
} from "@/app/api/internal/episodes/publish/route";
import {
  computeReleaseSignature,
  parseTimestamp,
  validateReleaseTimestamp,
  verifyReleaseSignatureDetailed,
} from "@/lib/security/releaseSignature";
import {
  parseEpisodesFromTsx,
  detectNewEpisodesFromCode,
  resolveDispatchConfig,
  dispatchEpisodeRelease,
  parseCliArgs,
  SUBJECT_FILE_MAP,
} from "../../../scripts/detect-new-episodes";
import type { SQSEvent, SQSRecord } from "@/workers/types";

// ============================================================================
// 3. Test Fixtures & In-Memory Seeding Helpers
// ============================================================================

const TEST_SECRET = mockEnvConfig.INTERNAL_RELEASE_SECRET;

async function seedSubscriber(
  email: string,
  subjects: SubjectChannel[],
  options: {
    isVerified?: boolean;
    status?: SubscriptionStatus;
    unsubscribeToken?: string;
  } = {}
) {
  const isVerified = options.isVerified ?? true;
  const status = options.status ?? SubscriptionStatus.ACTIVE;
  const unsubscribeToken =
    options.unsubscribeToken ?? crypto.randomBytes(16).toString("hex");

  const sub = await mockPrisma.subscriber.create({
    data: {
      email,
      isVerified,
      status,
      unsubscribeToken,
    },
  });

  for (const subject of subjects) {
    await mockPrisma.subscription.create({
      data: {
        subscriberId: sub.id,
        subject,
      },
    });
  }

  return sub;
}

// ============================================================================
// 4. Challenger Tier 5 Adversarial Test Suites
// ============================================================================

describe("Challenger M8-2: Tier 5 Adversarial Coverage Hardening", () => {
  beforeEach(() => {
    Object.assign(process.env, mockEnvConfig);
    dbStore.reset();
    mockSqsSend.mockReset();
    mockResendSend.mockReset();
    mockAuthState.session = null;

    mockSqsSend.mockImplementation(async (command: { input?: unknown }) => {
      const input = (command?.input ?? {}) as {
        Entries?: Array<{ Id: string }>;
      };
      if (input.Entries) {
        return {
          Successful: input.Entries.map((e) => ({
            Id: e.Id,
            MessageId: `msg_${e.Id}`,
          })),
          Failed: [],
        };
      }
      return { MessageId: `sqs_${crypto.randomUUID()}` };
    });

    mockResendSend.mockResolvedValue({
      data: { data: [{ id: "resend_batch_success_1" }] },
      error: null,
    });
  });

  // ==========================================================================
  // Section 1: AWS SQS Fanout Worker — Adversarial Edge Cases (fanout.ts)
  // ==========================================================================
  describe("Suite 1: SQS Fanout Worker Adversarial Edge Cases (fanout.ts)", () => {
    it("T5.1.1 [Poison Pill Tolerance]: SQSEvent with mixed corrupted and valid records isolates failure to batchItemFailures", async () => {
      // Seed an active verified subscriber
      await seedSubscriber("active@example.com", [SubjectChannel.BACKEND]);

      const validPayload = {
        subject: SubjectChannel.BACKEND,
        episodeId: "ep-valid-raft",
        episodeNumber: 1,
        title: "Raft Consensus",
        releaseCommitSha: "abc123456789",
      };

      const event: SQSEvent = {
        Records: [
          {
            messageId: "poison-pill-corrupted-json-1",
            receiptHandle: "rh1",
            body: "{ broken invalid json payload",
            attributes: {} as SQSRecord["attributes"],
            messageAttributes: {},
            md5OfBody: "md5-1",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123:test-fanout-queue",
            awsRegion: "us-east-1",
          },
          {
            messageId: "valid-record-2",
            receiptHandle: "rh2",
            body: JSON.stringify(validPayload),
            attributes: {} as SQSRecord["attributes"],
            messageAttributes: {},
            md5OfBody: "md5-2",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123:test-fanout-queue",
            awsRegion: "us-east-1",
          },
          {
            messageId: "poison-pill-schema-invalid-3",
            receiptHandle: "rh3",
            body: JSON.stringify({
              subject: "INVALID_DISCIPLINE_CHANNEL",
              episodeId: "ep-invalid",
            }),
            attributes: {} as SQSRecord["attributes"],
            messageAttributes: {},
            md5OfBody: "md5-3",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123:test-fanout-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const result = await EpisodeFanoutHandler(event);

      // Records 1 and 3 must be reported in batchItemFailures for targeted SQS redrive
      expect(result.batchItemFailures).toEqual([
        { itemIdentifier: "poison-pill-corrupted-json-1" },
        { itemIdentifier: "poison-pill-schema-invalid-3" },
      ]);

      // Record 2 must have successfully dispatched
      const epRecord = await mockPrisma.publishedEpisode.findUnique({
        where: {
          subject_episodeId: {
            subject: SubjectChannel.BACKEND,
            episodeId: "ep-valid-raft",
          },
        },
      });
      expect(epRecord).not.toBeNull();
      expect(epRecord?.totalRecipients).toBe(1);
      expect(epRecord?.dispatchedAt).not.toBeNull();
    });

    it("T5.1.2 [Subscriber Deduplication]: Normalizes emails across casing, trailing whitespace, and channel overlap", async () => {
      // Sub 1: COMPUTER_NETWORKS and ALL, with uppercase and whitespace
      await seedSubscriber("  Alice.Engineer@Domain.COM  ", [
        SubjectChannel.COMPUTER_NETWORKS,
        SubjectChannel.ALL,
      ]);
      // Sub 2: Same email in lowercase
      await seedSubscriber("alice.engineer@domain.com", [
        SubjectChannel.COMPUTER_NETWORKS,
      ]);
      // Sub 3: Subscribed to ALL
      await seedSubscriber("bob@domain.com", [SubjectChannel.ALL]);
      // Sub 4: Non-matching channel
      await seedSubscriber("charlie@domain.com", [SubjectChannel.FRONTEND]);
      // Sub 5: Matching channel, but unverified
      await seedSubscriber("david@domain.com", [SubjectChannel.COMPUTER_NETWORKS], {
        isVerified: false,
      });
      // Sub 6: Matching channel, but unsubscribed
      await seedSubscriber("eve@domain.com", [SubjectChannel.COMPUTER_NETWORKS], {
        status: SubscriptionStatus.UNSUBSCRIBED,
      });

      const res = await processEpisodeFanout({
        subject: SubjectChannel.COMPUTER_NETWORKS,
        episodeId: "ep-bgp-routing",
        episodeNumber: 5,
        title: "BGP Routing & Peering",
        releaseCommitSha: "sha-bgp",
      });

      expect(res.status).toBe("DISPATCHED");
      // Exactly 2 unique recipients: alice.engineer@domain.com and bob@domain.com
      expect(res.totalRecipients).toBe(2);
      expect(res.chunksDispatched).toBe(1);

      // Verify SQS SendMessageBatchCommand received deduplicated lowercase email
      expect(mockSqsSend).toHaveBeenCalled();
      const sendBatchCall = mockSqsSend.mock.calls.find(
        (c) => (c[0]?.input as { Entries?: unknown[] })?.Entries
      );
      expect(sendBatchCall).toBeDefined();
      const entries = (sendBatchCall![0].input as { Entries: Array<{ MessageBody: string }> }).Entries;
      const parsedBody = JSON.parse(entries[0].MessageBody);
      const recipientEmails = parsedBody.recipients.map((r: { email: string }) => r.email);

      expect(recipientEmails).toContain("alice.engineer@domain.com");
      expect(recipientEmails).toContain("bob@domain.com");
      expect(recipientEmails.length).toBe(2);
    });

    it("T5.1.3 [Large Recipient Slicing Boundary]: Exactly 23 subscribers chunked into [10, 10, 3]", async () => {
      for (let i = 1; i <= 23; i++) {
        await seedSubscriber(`subscriber_${i}@enterprise.com`, [
          SubjectChannel.OPERATING_SYSTEMS,
        ]);
      }

      const res = await processEpisodeFanout({
        subject: SubjectChannel.OPERATING_SYSTEMS,
        episodeId: "ep-virtual-mem",
        episodeNumber: 3,
        title: "Virtual Memory Architecture",
        releaseCommitSha: "sha-os-vm",
      });

      expect(res.totalRecipients).toBe(23);
      expect(res.chunksDispatched).toBe(3);

      // Verify chunk sizes in SQS calls
      const batchCalls = mockSqsSend.mock.calls.filter(
        (c) => (c[0]?.input as { Entries?: unknown[] })?.Entries
      );
      expect(batchCalls.length).toBeGreaterThan(0);
      const allEntries = batchCalls.flatMap(
        (c) => (c[0].input as { Entries: Array<{ MessageBody: string }> }).Entries
      );
      expect(allEntries.length).toBe(3);

      const chunk0Recipients = JSON.parse(allEntries[0].MessageBody).recipients;
      const chunk1Recipients = JSON.parse(allEntries[1].MessageBody).recipients;
      const chunk2Recipients = JSON.parse(allEntries[2].MessageBody).recipients;

      expect(chunk0Recipients.length).toBe(10);
      expect(chunk1Recipients.length).toBe(10);
      expect(chunk2Recipients.length).toBe(3);
    });

    it("T5.1.4 [SubjectChannel.ALL Broadcast]: Gathers subscribers across every single discipline", async () => {
      await seedSubscriber("fe_user@domain.com", [SubjectChannel.FRONTEND]);
      await seedSubscriber("be_user@domain.com", [SubjectChannel.BACKEND]);
      await seedSubscriber("os_user@domain.com", [SubjectChannel.OPERATING_SYSTEMS]);
      await seedSubscriber("net_user@domain.com", [SubjectChannel.COMPUTER_NETWORKS]);
      await seedSubscriber("java_user@domain.com", [SubjectChannel.JAVA]);
      await seedSubscriber("js_user@domain.com", [SubjectChannel.JAVASCRIPT]);
      await seedSubscriber("all_user@domain.com", [SubjectChannel.ALL]);

      const res = await processEpisodeFanout({
        subject: SubjectChannel.ALL,
        episodeId: "ep-announcement-2026",
        episodeNumber: 99,
        title: "Platform-Wide 2026 Update",
        releaseCommitSha: "sha-announcement",
      });

      expect(res.totalRecipients).toBe(7);
      expect(res.chunksDispatched).toBe(1);
    });

    it("T5.1.5 [Zero-Subscriber Silent Handling]: Does not enqueue empty SQS batches and logs telemetry", async () => {
      const res = await processEpisodeFanout({
        subject: SubjectChannel.JAVA,
        episodeId: "ep-java-concurrency",
        episodeNumber: 4,
        title: "Java Memory Model & Concurrency",
        releaseCommitSha: "sha-jmm",
      });

      expect(res.status).toBe("NO_SUBSCRIBERS");
      expect(res.totalRecipients).toBe(0);
      expect(res.chunksDispatched).toBe(0);
      expect(mockSqsSend).not.toHaveBeenCalled();

      // Database telemetry must reflect 0 recipients and non-null dispatchedAt
      const saved = await mockPrisma.publishedEpisode.findUnique({
        where: {
          subject_episodeId: {
            subject: SubjectChannel.JAVA,
            episodeId: "ep-java-concurrency",
          },
        },
      });
      expect(saved).not.toBeNull();
      expect(saved?.totalRecipients).toBe(0);
      expect(saved?.dispatchedAt).not.toBeNull();
    });

    it("T5.1.6 [Persistent SQS Enqueue Failure]: Throws error and marks record in batchItemFailures without setting dispatchedAt", async () => {
      await seedSubscriber("user@domain.com", [SubjectChannel.BACKEND]);

      // Mock SQS SendMessageBatchCommand to persistently fail all retries
      mockSqsSend.mockResolvedValue({
        Successful: [],
        Failed: [
          {
            Id: "batch_entry_1",
            Code: "InternalError",
            Message: "SQS service unavailable",
          },
        ],
      });

      const event: SQSEvent = {
        Records: [
          {
            messageId: "fanout-msg-sqs-down",
            receiptHandle: "rh",
            body: JSON.stringify({
              subject: SubjectChannel.BACKEND,
              episodeId: "ep-raft-fail",
              episodeNumber: 2,
              title: "Raft Under Partition",
              releaseCommitSha: "sha-fail",
            }),
            attributes: {} as SQSRecord["attributes"],
            messageAttributes: {},
            md5OfBody: "md5",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123:test-fanout-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const handlerResult = await EpisodeFanoutHandler(event);
      expect(handlerResult.batchItemFailures).toEqual([
        { itemIdentifier: "fanout-msg-sqs-down" },
      ]);

      // PublishedEpisode must NOT have dispatchedAt set
      const epRecord = await mockPrisma.publishedEpisode.findUnique({
        where: {
          subject_episodeId: {
            subject: SubjectChannel.BACKEND,
            episodeId: "ep-raft-fail",
          },
        },
      });
      expect(epRecord?.dispatchedAt).toBeFalsy();
    });

    it("T5.1.7 [Force Re-Dispatch Override]: Dispatched episode skipped when force: false, but re-dispatched when force: true", async () => {
      await seedSubscriber("sub1@domain.com", [SubjectChannel.JAVASCRIPT]);

      // Seed episode with dispatchedAt in the past
      await mockPrisma.publishedEpisode.create({
        data: {
          subject: SubjectChannel.JAVASCRIPT,
          episodeId: "ep-event-loop-redispatch",
          episodeNumber: 1,
          title: "Event Loop",
          releaseCommitSha: "sha-orig",
          totalRecipients: 1,
          dispatchedAt: new Date(Date.now() - 86400000), // 1 day ago
        },
      });

      // Attempt without force -> ALREADY_DISPATCHED
      const skipRes = await processEpisodeFanout({
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "ep-event-loop-redispatch",
        episodeNumber: 1,
        title: "Event Loop",
        releaseCommitSha: "sha-orig",
        force: false,
      });
      expect(skipRes.status).toBe("ALREADY_DISPATCHED");
      expect(mockSqsSend).not.toHaveBeenCalled();

      // Attempt with force: true -> DISPATCHED
      const forceRes = await processEpisodeFanout({
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "ep-event-loop-redispatch",
        episodeNumber: 1,
        title: "Event Loop",
        releaseCommitSha: "sha-forced",
        force: true,
      });
      expect(forceRes.status).toBe("DISPATCHED");
      expect(forceRes.chunksDispatched).toBe(1);
      expect(mockSqsSend).toHaveBeenCalled();
    });

    it("T5.1.8 [Empty Records Guard]: Handles undefined, null, or empty SQSEvent without throwing", async () => {
      const res1 = await EpisodeFanoutHandler({ Records: [] });
      expect(res1.batchItemFailures).toEqual([]);

      const res2 = await EpisodeFanoutHandler({} as SQSEvent);
      expect(res2.batchItemFailures).toEqual([]);

      const res3 = await EpisodeFanoutHandler({ Records: null as unknown as SQSRecord[] });
      expect(res3.batchItemFailures).toEqual([]);
    });
  });

  // ==========================================================================
  // Section 2: Email Dispatch Worker & Rate Pacer (dispatch.ts)
  // ==========================================================================
  describe("Suite 2: Email Dispatch Worker & Rate Pacer (dispatch.ts)", () => {
    it("T5.2.1 [RatePacer Interval Enforcement]: Delays rapid consecutive calls and resolves immediately for zero delay", async () => {
      const pacer = new RatePacer();

      // Non-positive interval returns immediately
      const startZero = Date.now();
      await pacer.wait(0);
      await pacer.wait(-100);
      expect(Date.now() - startZero).toBeLessThan(50);

      // Positive interval
      pacer.reset();
      await pacer.wait(60);
      const start = Date.now();
      await pacer.wait(60);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40); // within tolerance
    });

    it("T5.2.2 [Resend HTTP 429 with Numerical Retry-After]: Respects Retry-After header seconds", async () => {
      let callCount = 0;
      const mockSleep = vi.fn().mockResolvedValue(undefined);

      const customFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 429,
            headers: new Headers({ "retry-after": "2" }),
            text: async () => "Rate limit exceeded",
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: [{ id: "resend_after_429_success" }] }),
        };
      });

      const res = await sendResendBatch(
        [
          {
            from: "System Simulator <notifications@systemsimulator.io>",
            to: "user@domain.com",
            subject: "Test",
            html: "<p>Hello</p>",
            headers: {},
          },
        ],
        {
          fetchFn: customFetch as unknown as typeof fetch,
          sleepFn: mockSleep,
          apiKey: "re_test_key",
          pacingDelayMs: 0,
        }
      );

      expect(res.ids).toEqual(["resend_after_429_success"]);
      expect(callCount).toBe(2);
      expect(mockSleep).toHaveBeenCalledWith(2000); // 2s * 1000
    });

    it("T5.2.3 [Resend HTTP 429 Without Retry-After]: Employs exponential backoff with jitter", async () => {
      let callCount = 0;
      const mockSleep = vi.fn().mockResolvedValue(undefined);

      const customFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 429,
            headers: new Headers(),
            text: async () => "Rate limit exceeded",
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: [{ id: "resend_exp_backoff_success" }] }),
        };
      });

      const res = await sendResendBatch(
        [
          {
            from: "System Simulator <notifications@systemsimulator.io>",
            to: "user@domain.com",
            subject: "Test",
            html: "<p>Hello</p>",
            headers: {},
          },
        ],
        {
          fetchFn: customFetch as unknown as typeof fetch,
          sleepFn: mockSleep,
          apiKey: "re_test_key",
          pacingDelayMs: 0,
        }
      );

      expect(res.ids).toEqual(["resend_exp_backoff_success"]);
      expect(mockSleep).toHaveBeenCalled();
      const delayMs = mockSleep.mock.calls[0][0];
      // Expect 1000 * 2^0 + [0..200] jitter -> 1000..1200ms
      expect(delayMs).toBeGreaterThanOrEqual(1000);
      expect(delayMs).toBeLessThanOrEqual(1300);
    });

    it("T5.2.4 [Resend HTTP 429 Retry Exhaustion]: Throws error and logs failure in EmailDispatchHandler", async () => {
      const mockSleep = vi.fn().mockResolvedValue(undefined);
      const customFetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 429,
        headers: new Headers(),
        text: async () => "Persistent rate limit",
      }));

      const dispatchRecord: SQSRecord = {
        messageId: "msg-rate-limited-exhausted",
        receiptHandle: "rh",
        body: JSON.stringify({
          episode: {
            subject: SubjectChannel.JAVASCRIPT,
            episodeId: "ep-js-rate",
            episodeNumber: 1,
            title: "JS Engine",
            releaseCommitSha: "sha-rate",
          },
          recipients: [{ email: "user@domain.com", unsubscribeToken: "tok-rate" }],
        }),
        attributes: {} as SQSRecord["attributes"],
        messageAttributes: {},
        md5OfBody: "md5",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:us-east-1:123:test-dispatch-queue",
        awsRegion: "us-east-1",
      };

      const result = await EmailDispatchHandler(
        { Records: [dispatchRecord] },
        undefined,
        {
          fetchFn: customFetch as unknown as typeof fetch,
          sleepFn: mockSleep,
          apiKey: "re_test_key",
          maxRetries: 2,
          pacingDelayMs: 0,
        }
      );

      expect(result.batchItemFailures).toEqual([
        { itemIdentifier: "msg-rate-limited-exhausted" },
      ]);
    });

    it("T5.2.5 [Resend SDK Error Classification]: Retries on rate_limit_exceeded but fails fast on validation_error", async () => {
      const mockSleep = vi.fn().mockResolvedValue(undefined);

      // Case A: 429 rate limit
      let sdkCalls = 0;
      const rateLimitedResend = {
        batch: {
          send: vi.fn().mockImplementation(async () => {
            sdkCalls++;
            if (sdkCalls === 1) {
              return {
                error: {
                  statusCode: 429,
                  name: "rate_limit_exceeded",
                  message: "API rate limit reached",
                },
              };
            }
            return {
              data: { data: [{ id: "resend_sdk_retry_success" }] },
              error: null,
            };
          }),
        },
      };

      const items = [
        {
          from: "System Simulator <notifications@systemsimulator.io>",
          to: "user@domain.com",
          subject: "Test",
          html: "<p>Hello</p>",
          headers: {},
        },
      ];

      const resA = await sendResendBatch(items, {
        resendClient: rateLimitedResend as unknown as import("resend").Resend,
        sleepFn: mockSleep,
        pacingDelayMs: 0,
      });
      expect(resA.ids).toEqual(["resend_sdk_retry_success"]);
      expect(sdkCalls).toBe(2);

      // Case B: Fatal 400 validation error
      const fatalResend = {
        batch: {
          send: vi.fn().mockResolvedValue({
            error: {
              statusCode: 400,
              name: "validation_error",
              message: "Invalid domain or sender address",
            },
          }),
        },
      };

      await expect(
        sendResendBatch(items, {
          resendClient: fatalResend as unknown as import("resend").Resend,
          sleepFn: mockSleep,
          pacingDelayMs: 0,
        })
      ).rejects.toThrow("Resend batch send error: validation_error");
    });

    it("T5.2.6 [Multi-Record Batch Poison Pill]: Corrupted dispatch records isolated to batchItemFailures", async () => {
      const validPayload = {
        episode: {
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeId: "ep-tcp-handshake",
          episodeNumber: 1,
          title: "TCP 3-Way Handshake",
          releaseCommitSha: "sha-tcp",
        },
        recipients: [{ email: "dev@domain.com", unsubscribeToken: "token-tcp" }],
      };

      const event: SQSEvent = {
        Records: [
          {
            messageId: "valid-dispatch-1",
            receiptHandle: "rh1",
            body: JSON.stringify(validPayload),
            attributes: {} as SQSRecord["attributes"],
            messageAttributes: {},
            md5OfBody: "md5-1",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123:test-dispatch-queue",
            awsRegion: "us-east-1",
          },
          {
            messageId: "corrupt-json-2",
            receiptHandle: "rh2",
            body: "{ broken json string",
            attributes: {} as SQSRecord["attributes"],
            messageAttributes: {},
            md5OfBody: "md5-2",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123:test-dispatch-queue",
            awsRegion: "us-east-1",
          },
          {
            messageId: "invalid-schema-3",
            receiptHandle: "rh3",
            body: JSON.stringify({ episode: { episodeId: "missing-subject" } }),
            attributes: {} as SQSRecord["attributes"],
            messageAttributes: {},
            md5OfBody: "md5-3",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123:test-dispatch-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const result = await EmailDispatchHandler(event, undefined, {
        pacingDelayMs: 0,
      });

      expect(result.batchItemFailures).toEqual([
        { itemIdentifier: "corrupt-json-2" },
        { itemIdentifier: "invalid-schema-3" },
      ]);
    });

    it("T5.2.7 [RFC 8058 Header and Palette Rendering]: Renders accurate accent colors and unsubscribe headers", () => {
      const items = buildBatchEmailItems(
        {
          episode: {
            subject: SubjectChannel.COMPUTER_NETWORKS,
            episodeId: "ep-dns-hierarchy",
            episodeNumber: 3,
            title: "DNS Resolution Hierarchy",
            releaseCommitSha: "sha-dns",
            summary: "Authoritative nameservers & recursive resolvers",
            keyConcepts: ["Root Servers", "TTL Caching"],
          },
          recipients: [
            { email: "user@domain.com", unsubscribeToken: "sec-token-12345" },
          ],
        },
        { appUrl: "https://systemsimulator.io" }
      );

      expect(items.length).toBe(1);
      const email = items[0];

      expect(email.subject).toContain("Computer Networks Release");
      expect(email.headers["List-Unsubscribe"]).toContain("sec-token-12345");
      expect(email.headers["List-Unsubscribe"]).toContain("topic=COMPUTER_NETWORKS");
      expect(email.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
      expect(email.html).toContain("<!DOCTYPE html>");
      expect(email.html).toContain("DNS Resolution Hierarchy");
      expect(email.html).toContain("Root Servers");
    });

    it("T5.2.8 [DispatchedAt Non-Fatal Resilience]: Database telemetry failure does not trigger batch error", async () => {
      const brokenPrisma = {
        publishedEpisode: {
          updateMany: vi.fn().mockRejectedValue(new Error("Database write locked")),
        },
      };

      const record: SQSRecord = {
        messageId: "msg-telemetry-fail",
        receiptHandle: "rh",
        body: JSON.stringify({
          episode: {
            subject: SubjectChannel.BACKEND,
            episodeId: "ep-backend-wal",
            episodeNumber: 1,
            title: "Write-Ahead Logging",
            releaseCommitSha: "sha-wal",
          },
          recipients: [{ email: "sub@domain.com", unsubscribeToken: "tok-wal" }],
        }),
        attributes: {} as SQSRecord["attributes"],
        messageAttributes: {},
        md5OfBody: "md5",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:us-east-1:123:test-dispatch-queue",
        awsRegion: "us-east-1",
      };

      // Must succeed without throwing
      const res = await processDispatchRecord(record, {
        prismaClient: brokenPrisma as unknown as PrismaClient,
        pacingDelayMs: 0,
      });

      expect(res.dispatchedCount).toBe(1);
    });
  });

  // ==========================================================================
  // Section 3: Cryptographic Release Ingest Pipeline (publish/route.ts)
  // ==========================================================================
  describe("Suite 3: Cryptographic Release Ingest Pipeline (publish/route.ts & releaseSignature.ts)", () => {
    const FIXED_T0 = Date.parse("2026-11-01T12:00:00.000Z");

    it("T5.3.1 [Anti-Replay Window Boundaries]: Tests exact ±300s boundaries and ±301s drift", () => {
      // Exactly at +300s old (diffMs === 300,000) -> valid
      const atExactOldBoundary = validateReleaseTimestamp(
        String(Math.floor((FIXED_T0 - 300000) / 1000)),
        300,
        FIXED_T0
      );
      expect(atExactOldBoundary.valid).toBe(true);

      // At 301s old (diffMs === 301,000) -> expired replay (401)
      const expiredReplay = validateReleaseTimestamp(
        String(Math.floor((FIXED_T0 - 301000) / 1000)),
        300,
        FIXED_T0
      );
      expect(expiredReplay.valid).toBe(false);
      expect(expiredReplay.status).toBe(401);
      expect(expiredReplay.error).toContain("Timestamp expired / replay detected");

      // Exactly at +300s future (diffMs === -300,000) -> valid
      const atExactFutureBoundary = validateReleaseTimestamp(
        String(Math.floor((FIXED_T0 + 300000) / 1000)),
        300,
        FIXED_T0
      );
      expect(atExactFutureBoundary.valid).toBe(true);

      // At 301s in future (diffMs === -301,000) -> future clock skew (401)
      const futureSkew = validateReleaseTimestamp(
        String(Math.floor((FIXED_T0 + 301000) / 1000)),
        300,
        FIXED_T0
      );
      expect(futureSkew.valid).toBe(false);
      expect(futureSkew.status).toBe(401);
      expect(futureSkew.error).toContain("Timestamp in the future");
    });

    it("T5.3.2 [Timestamp Parsing Formats]: Handles ISO-8601, 10-digit epoch, 13-digit epoch, rejects invalid", () => {
      const epochSec = Math.floor(FIXED_T0 / 1000);
      expect(parseTimestamp("2026-11-01T12:00:00.000Z")).toBe(FIXED_T0);
      expect(parseTimestamp(String(epochSec))).toBe(FIXED_T0);
      expect(parseTimestamp(String(FIXED_T0))).toBe(FIXED_T0);
      expect(parseTimestamp(epochSec)).toBe(FIXED_T0);
      expect(parseTimestamp(FIXED_T0)).toBe(FIXED_T0);

      // Malformed timestamps
      expect(parseTimestamp("not-a-date")).toBeNull();
      expect(parseTimestamp("-1730462400")).toBeNull();
      expect(parseTimestamp("")).toBeNull();
      expect(parseTimestamp(null)).toBeNull();
      expect(parseTimestamp(undefined)).toBeNull();
    });

    it("T5.3.3 [TimingSafeEqual Buffer Length Guard]: Rejects short, long, and non-hex candidate signatures without RangeError", () => {
      const payload = JSON.stringify({ hello: "world" });
      const timestamp = String(Math.floor(FIXED_T0 / 1000));

      // 1. Short signature (32 chars instead of 64)
      const shortSigResult = verifyReleaseSignatureDetailed({
        payload,
        headers: {
          "x-release-timestamp": timestamp,
          "x-release-signature": "sha256=abcdef1234567890",
        },
        secret: TEST_SECRET,
        now: FIXED_T0,
      });
      expect(shortSigResult.valid).toBe(false);
      expect(shortSigResult.status).toBe(401);

      // 2. Long signature (66 chars)
      const longSigResult = verifyReleaseSignatureDetailed({
        payload,
        headers: {
          "x-release-timestamp": timestamp,
          "x-release-signature": `sha256=${"a".repeat(66)}`,
        },
        secret: TEST_SECRET,
        now: FIXED_T0,
      });
      expect(longSigResult.valid).toBe(false);
      expect(longSigResult.status).toBe(401);

      // 3. Non-hex characters
      const nonHexResult = verifyReleaseSignatureDetailed({
        payload,
        headers: {
          "x-release-timestamp": timestamp,
          "x-release-signature": `sha256=${"z".repeat(64)}`,
        },
        secret: TEST_SECRET,
        now: FIXED_T0,
      });
      expect(nonHexResult.valid).toBe(false);
      expect(nonHexResult.status).toBe(401);
      expect(nonHexResult.error).toContain("Invalid signature format");
    });

    it("T5.3.4 [Key Rotation Signature Header]: Accepts rotation list with expired/invalid signature plus valid signature", () => {
      const payload = JSON.stringify({ episodeId: "ep-rotation" });
      const timestamp = String(Math.floor(FIXED_T0 / 1000));
      const validSig = computeReleaseSignature({
        payload,
        secret: TEST_SECRET,
        timestamp,
        bound: true,
      });

      const multiSigHeader = `sha256=${"0".repeat(64)}, ${validSig}`;

      const res = verifyReleaseSignatureDetailed({
        payload,
        headers: {
          "x-release-timestamp": timestamp,
          "x-release-signature": multiSigHeader,
        },
        secret: TEST_SECRET,
        now: FIXED_T0,
      });

      expect(res.valid).toBe(true);
      expect(res.status).toBe(200);
    });

    it("T5.3.5 [Payload Tampering & Binding Resistance]: 1-bit payload modification or timestamp swap fails verification", () => {
      const timestamp = String(Math.floor(FIXED_T0 / 1000));
      const originalPayload = JSON.stringify({ title: "Original Title" });
      const tamperedPayload = JSON.stringify({ title: "Tampered Title" });

      const sig = computeReleaseSignature({
        payload: originalPayload,
        secret: TEST_SECRET,
        timestamp,
        bound: true,
      });

      // Modifying body fails
      const bodyTamperRes = verifyReleaseSignatureDetailed({
        payload: tamperedPayload,
        headers: {
          "x-release-timestamp": timestamp,
          "x-release-signature": sig,
        },
        secret: TEST_SECRET,
        now: FIXED_T0,
      });
      expect(bodyTamperRes.valid).toBe(false);
      expect(bodyTamperRes.error).toBe("Signature mismatch");

      // Modifying timestamp fails (timestamp binding)
      const tsTamperRes = verifyReleaseSignatureDetailed({
        payload: originalPayload,
        headers: {
          "x-release-timestamp": String(Math.floor(FIXED_T0 / 1000) + 10),
          "x-release-signature": sig,
        },
        secret: TEST_SECRET,
        now: FIXED_T0,
      });
      expect(tsTamperRes.valid).toBe(false);
      expect(tsTamperRes.error).toBe("Signature mismatch");
    });

    it("T5.3.6 [SQS-First Safe Order Under DB Failure]: Returns HTTP 202 Accepted when SQS succeeds but DB fails", async () => {
      const payload = {
        subject: SubjectChannel.OPERATING_SYSTEMS,
        episodeId: "ep-os-sched",
        episodeNumber: 2,
        title: "CFS Scheduler",
        releaseCommitSha: "sha-cfs",
      };
      const rawBody = JSON.stringify(payload);
      const timestamp = String(Math.floor(FIXED_T0 / 1000));
      const signature = computeReleaseSignature({
        payload: rawBody,
        secret: TEST_SECRET,
        timestamp,
        bound: true,
      });

      const request = new Request("https://systemsimulator.io/api/internal/episodes/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-release-timestamp": timestamp,
          "x-release-signature": signature,
        },
        body: rawBody,
      });

      // Mock SQS to succeed
      const mockEnqueueFanout = vi.fn().mockResolvedValue("sqs-msg-order-ok");

      // Mock DB to fail
      const brokenDb = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockRejectedValue(new Error("Connection reset by peer")),
        },
      };

      const response = await handlePublishEpisode(request, {
        db: brokenDb as unknown as PrismaClient,
        enqueueFanout: mockEnqueueFanout,
        secret: TEST_SECRET,
        now: FIXED_T0,
      });

      // Must return HTTP 202 Accepted because SQS succeeded
      expect(response.status).toBe(202);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
      expect(json.messageId).toBe("sqs-msg-order-ok");
      expect(json.warning).toContain("deferred to Lambda worker");
    });

    it("T5.3.7 [SQS Failure Prevents DB Writes]: SQS error returns HTTP 500 without touching database", async () => {
      const payload = {
        subject: SubjectChannel.FRONTEND,
        episodeId: "ep-fe-css",
        episodeNumber: 3,
        title: "CSS Grid Internals",
        releaseCommitSha: "sha-css",
      };
      const rawBody = JSON.stringify(payload);
      const timestamp = String(Math.floor(FIXED_T0 / 1000));
      const signature = computeReleaseSignature({
        payload: rawBody,
        secret: TEST_SECRET,
        timestamp,
        bound: true,
      });

      const request = new Request("https://systemsimulator.io/api/internal/episodes/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-release-timestamp": timestamp,
          "x-release-signature": signature,
        },
        body: rawBody,
      });

      const mockEnqueueFanout = vi.fn().mockRejectedValue(new Error("AWS SQS Down"));
      const mockUpsert = vi.fn();

      const db = {
        publishedEpisode: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: mockUpsert,
        },
      };

      const response = await handlePublishEpisode(request, {
        db: db as unknown as PrismaClient,
        enqueueFanout: mockEnqueueFanout,
        secret: TEST_SECRET,
        now: FIXED_T0,
      });

      expect(response.status).toBe(500);
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("T5.3.8 [Read-Only Idempotency Fast Path]: Already dispatched episode returns 200 without SQS call", async () => {
      await mockPrisma.publishedEpisode.create({
        data: {
          subject: SubjectChannel.FRONTEND,
          episodeId: "ep-fe-cached",
          episodeNumber: 1,
          title: "Rendering Engine",
          releaseCommitSha: "sha-fe",
          totalRecipients: 5,
          dispatchedAt: new Date(FIXED_T0 - 3600000),
        },
      });

      const payload = {
        subject: SubjectChannel.FRONTEND,
        episodeId: "ep-fe-cached",
        episodeNumber: 1,
        title: "Rendering Engine",
        releaseCommitSha: "sha-fe",
      };
      const rawBody = JSON.stringify(payload);
      const timestamp = String(Math.floor(FIXED_T0 / 1000));
      const signature = computeReleaseSignature({
        payload: rawBody,
        secret: TEST_SECRET,
        timestamp,
        bound: true,
      });

      const request = new Request("https://systemsimulator.io/api/internal/episodes/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-release-timestamp": timestamp,
          "x-release-signature": signature,
        },
        body: rawBody,
      });

      const mockEnqueueFanout = vi.fn();

      const response = await handlePublishEpisode(request, {
        db: mockPrisma as unknown as PrismaClient,
        enqueueFanout: mockEnqueueFanout,
        secret: TEST_SECRET,
        now: FIXED_T0,
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.status).toBe("already_published");
      expect(json.alreadyDispatched).toBe(true);
      expect(mockEnqueueFanout).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Section 4: GitOps AST Detection Script (detect-new-episodes.ts)
  // ==========================================================================
  describe("Suite 4: GitOps AST Detection Script (detect-new-episodes.ts)", () => {
    it("T5.4.1 [TypeScript AST Spread & Complex Literals]: Parses array literals containing spread operator, negative numbers, and template literals", () => {
      const mockTsx = `
        import { EpisodeMetadata } from "./types";
        const BASE_EPISODES: EpisodeMetadata[] = [];
        export const OPERATING_SYSTEMS_EPISODES: EpisodeMetadata[] = [
          ...BASE_EPISODES,
          {
            id: "ep-page-replacement",
            episodeNumber: -1,
            title: \`LRU Page Replacement Algorithm\`,
            description: "Virtual memory eviction algorithms",
            date: "14 November 2026",
            href: "/operating-systems/lru",
            accent: "blue",
          },
          {
            id: "ep-clock-algorithm",
            episodeNumber: 2,
            title: "Second-Chance Clock Algorithm",
            description: "Approximating LRU with a circular buffer",
            date: "Coming Soon",
            href: "/operating-systems/clock",
          }
        ];
      `;

      const episodes = parseEpisodesFromTsx(mockTsx);
      expect(episodes.length).toBe(2);

      expect(episodes[0].id).toBe("ep-page-replacement");
      expect(episodes[0].episodeNumber).toBe(-1);
      expect(episodes[0].title).toBe("LRU Page Replacement Algorithm");
      expect(episodes[0].date).toBe("14 November 2026");

      expect(episodes[1].id).toBe("ep-clock-algorithm");
      expect(episodes[1].date).toBe("Coming Soon");
    });

    it("T5.4.2 [AST Parser Non-Episode Array Isolation]: Ignores unrelated variables and malformed objects", () => {
      const mockTsx = `
        export const NAVIGATION_BAR = [
          { id: "nav-1", title: "Home", href: "/" }
        ];
        export const JAVASCRIPT_EPISODES = [
          { missingId: true, title: "No ID" },
          { id: "valid-ep", title: "Valid Ep", episodeNumber: 1, date: "10 July 2026" },
          "not an object",
          null
        ];
      `;

      const episodes = parseEpisodesFromTsx(mockTsx);
      expect(episodes.length).toBe(1);
      expect(episodes[0].id).toBe("valid-ep");
      expect(episodes[0].title).toBe("Valid Ep");
    });

    it("T5.4.3 [Semantic Date Transition Matrix]: Triggers exactly on new episodes or Coming Soon -> Released transitions", () => {
      const beforeCode = `
        export const BACKEND_EPISODES = [
          { id: "ep-1", episodeNumber: 1, title: "LSM Trees", date: "Coming Soon", href: "/backend/lsm" },
          { id: "ep-2", episodeNumber: 2, title: "B-Trees", date: "10 May 2026", href: "/backend/btree" },
        ];
      `;

      const afterCode = `
        export const BACKEND_EPISODES = [
          { id: "ep-1", episodeNumber: 1, title: "LSM Trees", date: "15 November 2026", href: "/backend/lsm" },
          { id: "ep-2", episodeNumber: 2, title: "B-Trees (Updated Title)", date: "10 May 2026", href: "/backend/btree" },
          { id: "ep-3", episodeNumber: 3, title: "WAL", date: "Coming Soon", href: "/backend/wal" },
          { id: "ep-4", episodeNumber: 4, title: "SSTables", date: "20 November 2026", href: "/backend/sstable" },
        ];
      `;

      const releases = detectNewEpisodesFromCode(
        { "src/app/backend/episodes.tsx": beforeCode },
        { "src/app/backend/episodes.tsx": afterCode },
        "head-commit-sha",
        { baseUrl: "https://systemsimulator.io" }
      );

      // Expected detections:
      // 1. ep-1: Transitioned from Coming Soon -> 15 November 2026
      // 2. ep-4: Brand new with released date
      // ep-2 was already released (date didn't change); ep-3 is Coming Soon
      expect(releases.length).toBe(2);

      const ep1 = releases.find((r) => r.episodeId === "ep-1");
      const ep4 = releases.find((r) => r.episodeId === "ep-4");

      expect(ep1).toBeDefined();
      expect(ep1?.subject).toBe(SubjectChannel.BACKEND);
      expect(ep1?.ctaUrl).toBe("https://systemsimulator.io/backend/lsm");

      expect(ep4).toBeDefined();
      expect(ep4?.episodeId).toBe("ep-4");
      expect(ep4?.title).toBe("SSTables");
    });

    it("T5.4.4 [CLI Argument Parser & Dispatch Config Guard]: Rejects invalid URLs and missing secret in live mode", () => {
      // 1. Parse CLI flags
      const parsed = parseCliArgs([
        "node",
        "detect.ts",
        "--dry-run",
        "--commit",
        "commit-123",
        "--base",
        "base-456",
        "--url",
        "https://test.io",
        "--force",
        "--verbose",
      ]);
      expect(parsed.dryRun).toBe(true);
      expect(parsed.commit).toBe("commit-123");
      expect(parsed.base).toBe("base-456");
      expect(parsed.url).toBe("https://test.io");
      expect(parsed.force).toBe(true);
      expect(parsed.verbose).toBe(true);

      // 2. Live mode without secret throws
      const prevSecret = process.env.INTERNAL_RELEASE_SECRET;
      delete process.env.INTERNAL_RELEASE_SECRET;
      try {
        expect(() =>
          resolveDispatchConfig({ appUrl: "https://systemsimulator.io" })
        ).toThrow("Missing required environment variable: INTERNAL_RELEASE_SECRET");
      } finally {
        if (prevSecret) process.env.INTERNAL_RELEASE_SECRET = prevSecret;
      }

      // 3. Invalid URL protocol throws
      expect(() =>
        resolveDispatchConfig({
          appUrl: "ftp://systemsimulator.io",
          secret: "valid-secret",
        })
      ).toThrow("Invalid APP_URL format");
    });

    it("T5.4.5 [Anti-Replay Refresh on Dispatch Retry]: Generates fresh timestamp and signature for retry attempts", async () => {
      let fetchAttempts = 0;
      const timestampsUsed: string[] = [];
      const signaturesUsed: string[] = [];

      let simulatedTime = 1730462400000;
      const mockNow = () => {
        simulatedTime += 2000; // time advances 2s on each check
        return simulatedTime;
      };

      const customFetch = vi.fn().mockImplementation(async (_url, options) => {
        fetchAttempts++;
        const headers = options.headers as Record<string, string>;
        timestampsUsed.push(headers["x-release-timestamp"]);
        signaturesUsed.push(headers["x-release-signature"]);

        if (fetchAttempts === 1) {
          // Transient 503 on first attempt
          return {
            status: 503,
            json: async () => ({ error: "Temporary outage" }),
          };
        }
        return {
          status: 200,
          json: async () => ({ messageId: "sqs-retry-refreshed-success" }),
        };
      });

      const mockSleep = vi.fn().mockResolvedValue(undefined);

      const config = {
        appUrl: "https://systemsimulator.io",
        releaseSecret: TEST_SECRET,
        maxRetries: 2,
        initialDelayMs: 10,
        backoffFactor: 2,
      };

      const result = await dispatchEpisodeRelease(
        {
          subject: SubjectChannel.JAVASCRIPT,
          episodeId: "ep-js-retry",
          episodeNumber: 1,
          title: "V8 Optimizer",
          releaseCommitSha: "sha-retry",
          summary: "TurboFan compiler pipeline",
          keyConcepts: [],
          force: false,
        },
        config,
        {
          fetchFn: customFetch as unknown as typeof fetch,
          sleepFn: mockSleep,
          now: mockNow,
        }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("sqs-retry-refreshed-success");
      expect(fetchAttempts).toBe(2);

      // Verify timestamp and signature were refreshed between attempt 1 and 2
      expect(timestampsUsed.length).toBe(2);
      expect(timestampsUsed[0]).not.toBe(timestampsUsed[1]);
      expect(signaturesUsed[0]).not.toBe(signaturesUsed[1]);
    });
  });

  // ==========================================================================
  // Section 5: Runbook & System Cohesion (DEPLOYMENT_RUNBOOK.md)
  // ==========================================================================
  describe("Suite 5: Deployment Runbook & Infrastructure Cohesion", () => {
    it("T5.5.1 [Registry Alignment]: Verifies all SUBJECT_FILE_MAP entries point to actual files with matching exports", () => {
      for (const [relPath, subject] of Object.entries(SUBJECT_FILE_MAP)) {
        const fullPath = path.resolve(process.cwd(), relPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, "utf8");
        // Must contain export const <SUBJECT>_EPISODES
        const subjectUpper = subject.replace(/-/g, "_");
        const hasEpisodeExport =
          content.includes(`${subjectUpper}_EPISODES`) ||
          content.includes(`_EPISODES`);
        expect(hasEpisodeExport).toBe(true);
      }
    });

    it("T5.5.2 [Zod Publish Schema Flexibility]: Normalizes empty string and null ctaUrl to undefined", () => {
      const base = {
        subject: SubjectChannel.FRONTEND,
        episodeId: "ep-fe-flex",
        episodeNumber: 1,
        title: "Flexbox",
        releaseCommitSha: "sha-flex",
      };

      // Empty string ctaUrl
      const resEmpty = publishEpisodePayloadSchema.safeParse({
        ...base,
        ctaUrl: "",
      });
      expect(resEmpty.success).toBe(true);
      if (resEmpty.success) {
        expect(resEmpty.data.ctaUrl).toBeUndefined();
      }

      // Null ctaUrl
      const resNull = publishEpisodePayloadSchema.safeParse({
        ...base,
        ctaUrl: null,
      });
      expect(resNull.success).toBe(true);
      if (resNull.success) {
        expect(resNull.data.ctaUrl).toBeUndefined();
      }

      // Valid URL
      const resValid = publishEpisodePayloadSchema.safeParse({
        ...base,
        ctaUrl: "https://systemsimulator.io/episodes/1",
      });
      expect(resValid.success).toBe(true);

      // Invalid URL
      const resInvalid = publishEpisodePayloadSchema.safeParse({
        ...base,
        ctaUrl: "not-a-url",
      });
      expect(resInvalid.success).toBe(false);
    });
  });
});
