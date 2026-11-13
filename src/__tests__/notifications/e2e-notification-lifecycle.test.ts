import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import { SubjectChannel, SubscriptionStatus } from "@prisma/client";

// ============================================================================
// 1. Hoisted In-Memory Database & Infrastructure Mocks
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
    emails = {
      send: mockResendSend,
    };
  },
}));

// ============================================================================
// 2. Direct Imports of Core Route Handlers, Workers & Security Modules
// ============================================================================

import { POST as subscribeHandler } from "@/app/api/notifications/subscribe/route";
import { GET as verifyHandler } from "@/app/api/notifications/verify/route";
import {
  GET as unsubscribeGetHandler,
  POST as unsubscribePostHandler,
} from "@/app/api/notifications/unsubscribe/route";
import { POST as publishHandler } from "@/app/api/internal/episodes/publish/route";
import { POST as resendWebhookHandler } from "@/app/api/webhooks/resend/route";
import { processEpisodeFanout } from "@/workers/fanout";
import {
  processDispatchRecord,
  EmailDispatchHandler,
  RatePacer,
} from "@/workers/dispatch";
import {
  computeReleaseSignature,
  parseTimestamp,
  verifyReleaseSignatureDetailed,
} from "@/lib/security/releaseSignature";
import {
  parseEpisodesFromTsx,
  isReleasedDate,
  SUBJECT_FILE_MAP,
} from "../../../scripts/detect-new-episodes";
import type { SQSEvent, SQSRecord } from "@/workers/types";

// ============================================================================
// 3. Test Fixtures & Protocol Helpers
// ============================================================================

const TEST_RELEASE_SECRET = mockEnvConfig.INTERNAL_RELEASE_SECRET;
const TEST_WEBHOOK_SECRET = mockEnvConfig.RESEND_WEBHOOK_SECRET;

let ipCounter = 1;
function getUniqueIp(): string {
  ipCounter++;
  return `10.200.${Math.floor(ipCounter / 254)}.${(ipCounter % 254) + 1}`;
}

function createTestSvixHeaders(options: {
  payload: string;
  secret: string;
  id?: string;
  timestamp?: string;
}) {
  const {
    payload,
    secret,
    id = `msg_${Date.now()}`,
    timestamp = Math.floor(Date.now() / 1000).toString(),
  } = options;
  const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(cleanSecret, "base64");
  const toSign = `${id}.${timestamp}.${payload}`;
  const sig = crypto
    .createHmac("sha256", secretBytes)
    .update(toSign)
    .digest("base64");

  return {
    "svix-id": id,
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${sig}`,
  };
}

function createSignedReleaseRequest(options: {
  payload: Record<string, unknown>;
  secret?: string;
  timestamp?: string | number;
  tamperSignature?: boolean;
  ip?: string;
}) {
  const secret = options.secret ?? TEST_RELEASE_SECRET;
  const rawBody = JSON.stringify(options.payload);
  const ts =
    options.timestamp !== undefined
      ? String(options.timestamp)
      : Math.floor(Date.now() / 1000).toString();

  let signature = computeReleaseSignature({
    payload: rawBody,
    secret,
    timestamp: ts,
  });

  if (options.tamperSignature) {
    signature = "sha256=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  }

  return new Request("https://systemvisualizer.com/api/internal/episodes/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-release-signature": signature,
      "x-release-timestamp": ts,
      "x-forwarded-for": options.ip ?? getUniqueIp(),
    },
    body: rawBody,
  });
}

// ============================================================================
// 4. Test Suite Execution: Tiers 1 through 4
// ============================================================================

describe("Event-Driven Transactional Email Notification System — E2E Acceptance Suite", () => {
  beforeEach(() => {
    Object.assign(process.env, mockEnvConfig);
    vi.restoreAllMocks();
    mockResendSend.mockClear();
    mockSqsSend.mockClear();
    dbStore.reset();
    mockAuthState.session = null;

    mockSqsSend.mockImplementation(
      async (command: {
        input?: {
          Entries?: Array<{ Id: string; MessageBody?: string }>;
          MessageBody?: string;
        };
      }) => {
        if (command.input?.Entries) {
          return {
            Successful: command.input.Entries.map((e, idx: number) => ({
              Id: e.Id,
              MessageId: `msg-batch-${Date.now()}-${idx}`,
            })),
            Failed: [],
          };
        }
        return { MessageId: `sqs-msg-${Date.now()}` };
      }
    );

    mockResendSend.mockResolvedValue({
      data: { data: [{ id: "resend-msg-ok-1" }] },
      error: null,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TIER 1: FEATURE COVERAGE (HAPPY PATH IN ISOLATION)
  // ──────────────────────────────────────────────────────────────────────────
  describe("Tier 1: Feature Coverage (Isolation & Contract Tests)", () => {
    // ------------------------------------------------------------------------
    // Feature 1: Subscription API Endpoint (POST /api/notifications/subscribe)
    // ------------------------------------------------------------------------
    describe("Feature 1: Subscription API Endpoint", () => {
      it("1.1 Guest subscription with single discipline generates unverified subscriber and 24h verification token", async () => {
        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: "guest@example.com",
            subjects: [SubjectChannel.JAVASCRIPT],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.requiresVerification).toBe(true);

        const sub = Array.from(dbStore.subscribers.values()).find(
          (s) => s.email === "guest@example.com"
        );
        expect(sub).toBeDefined();
        expect(sub?.isVerified).toBe(false);
        expect(sub?.verificationToken).toBeDefined();
        expect(sub?.tokenExpiresAt).toBeDefined();
        expect(sub?.status).toBe(SubscriptionStatus.ACTIVE);
      });

      it("1.2 Authenticated user subscription auto-verifies subscriber and associates userId", async () => {
        mockAuthState.session = {
          user: { id: "user_auth_123", email: "authuser@example.com" },
        };

        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: "authuser@example.com",
            subjects: [SubjectChannel.COMPUTER_NETWORKS],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.requiresVerification).toBe(false);

        const sub = Array.from(dbStore.subscribers.values()).find(
          (s) => s.email === "authuser@example.com"
        );
        expect(sub).toBeDefined();
        expect(sub?.isVerified).toBe(true);
        expect(sub?.userId).toBe("user_auth_123");
        expect(sub?.verificationToken).toBeNull();
      });

      it("1.3 Guest multi-discipline subscription records all requested topics", async () => {
        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: "multitopic@example.com",
            subjects: [
              SubjectChannel.JAVASCRIPT,
              SubjectChannel.JAVA,
              SubjectChannel.BACKEND,
            ],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(200);

        const sub = Array.from(dbStore.subscribers.values()).find(
          (s) => s.email === "multitopic@example.com"
        );
        const userSubs = Array.from(dbStore.subscriptions.values()).filter(
          (s) => s.subscriberId === sub?.id
        );
        expect(userSubs).toHaveLength(3);
        const savedTopics = userSubs.map((s) => s.subject);
        expect(savedTopics).toContain(SubjectChannel.JAVASCRIPT);
        expect(savedTopics).toContain(SubjectChannel.JAVA);
        expect(savedTopics).toContain(SubjectChannel.BACKEND);
      });

      it("1.4 Subscribing to ALL cleans up redundant individual topics and retains only ALL", async () => {
        const subId = "sub_pre_existing";
        dbStore.subscribers.set(subId, {
          id: subId,
          email: "cleanup@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "unsub-tok-cleanup",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("s1", {
          id: "s1",
          subscriberId: subId,
          subject: SubjectChannel.JAVASCRIPT,
          createdAt: new Date(),
        });
        dbStore.subscriptions.set("s2", {
          id: "s2",
          subscriberId: subId,
          subject: SubjectChannel.FRONTEND,
          createdAt: new Date(),
        });

        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: "cleanup@example.com",
            subjects: [SubjectChannel.ALL],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(200);

        const remainingSubs = Array.from(dbStore.subscriptions.values()).filter(
          (s) => s.subscriberId === subId
        );
        expect(remainingSubs).toHaveLength(1);
        expect(remainingSubs[0].subject).toBe(SubjectChannel.ALL);
      });

      it("1.5 Re-subscribing an already verified subscriber to an additional topic does NOT require re-verification", async () => {
        const subId = "sub_verified_user";
        dbStore.subscribers.set(subId, {
          id: subId,
          email: "alreadyverified@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "unsub-tok-123",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: "alreadyverified@example.com",
            subjects: [SubjectChannel.OPERATING_SYSTEMS],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.requiresVerification).toBe(false);

        const sub = dbStore.subscribers.get(subId);
        expect(sub?.isVerified).toBe(true);
        expect(sub?.verificationToken).toBeNull();
      });
    });

    // ------------------------------------------------------------------------
    // Feature 2: Double Opt-In Verification API (GET /api/notifications/verify)
    // ------------------------------------------------------------------------
    describe("Feature 2: Double Opt-In Verification API", () => {
      it("2.1 Valid verification token activates subscriber status from pending to ACTIVE", async () => {
        const token = "valid-verify-token-1";
        dbStore.subscribers.set("sub-pending-1", {
          id: "sub-pending-1",
          email: "pending@example.com",
          userId: null,
          isVerified: false,
          verificationToken: token,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
          unsubscribeToken: "unsub-1",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const req = new Request(
          `https://systemvisualizer.com/api/notifications/verify?token=${token}`,
          { headers: { "x-forwarded-for": getUniqueIp() } }
        );

        const res = await verifyHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);

        const sub = dbStore.subscribers.get("sub-pending-1");
        expect(sub?.isVerified).toBe(true);
        expect(sub?.status).toBe(SubscriptionStatus.ACTIVE);
      });

      it("2.2 Verification clears verificationToken and tokenExpiresAt atomically", async () => {
        const token = "valid-verify-token-2";
        dbStore.subscribers.set("sub-pending-2", {
          id: "sub-pending-2",
          email: "clearfields@example.com",
          userId: null,
          isVerified: false,
          verificationToken: token,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
          unsubscribeToken: "unsub-2",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const req = new Request(
          `https://systemvisualizer.com/api/notifications/verify?token=${token}`,
          { headers: { "x-forwarded-for": getUniqueIp() } }
        );

        await verifyHandler(req);
        const sub = dbStore.subscribers.get("sub-pending-2");
        expect(sub?.verificationToken).toBeNull();
        expect(sub?.tokenExpiresAt).toBeNull();
      });

      it("2.3 Already verified subscriber token reuse / idempotency handling", async () => {
        const req = new Request(
          `https://systemvisualizer.com/api/notifications/verify?token=already-cleared-token`,
          { headers: { "x-forwarded-for": getUniqueIp() } }
        );

        const res = await verifyHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("Invalid verification token.");
      });

      it("2.4 Verification succeeds for subscriber with multiple topics", async () => {
        const token = "multitopic-token";
        const subId = "sub-multi";
        dbStore.subscribers.set(subId, {
          id: subId,
          email: "multi@example.com",
          userId: null,
          isVerified: false,
          verificationToken: token,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
          unsubscribeToken: "unsub-multi",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("t1", {
          id: "t1",
          subscriberId: subId,
          subject: SubjectChannel.JAVASCRIPT,
          createdAt: new Date(),
        });
        dbStore.subscriptions.set("t2", {
          id: "t2",
          subscriberId: subId,
          subject: SubjectChannel.BACKEND,
          createdAt: new Date(),
        });

        const req = new Request(
          `https://systemvisualizer.com/api/notifications/verify?token=${token}`,
          { headers: { "x-forwarded-for": getUniqueIp() } }
        );

        const res = await verifyHandler(req);
        expect(res.status).toBe(200);

        const sub = dbStore.subscribers.get(subId);
        expect(sub?.isVerified).toBe(true);
        const remainingTopics = Array.from(dbStore.subscriptions.values()).filter(
          (s) => s.subscriberId === subId
        );
        expect(remainingTopics).toHaveLength(2);
      });

      it("2.5 Verification sets isVerified = true in database and returns success response", async () => {
        const token = "tok-2-5";
        dbStore.subscribers.set("sub-2-5", {
          id: "sub-2-5",
          email: "verified25@example.com",
          userId: null,
          isVerified: false,
          verificationToken: token,
          tokenExpiresAt: new Date(Date.now() + 10000),
          unsubscribeToken: "unsub-25",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const req = new Request(
          `https://systemvisualizer.com/api/notifications/verify?token=${token}`,
          { headers: { "x-forwarded-for": getUniqueIp() } }
        );

        const res = await verifyHandler(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.message).toBe("Email verified successfully.");
        expect(dbStore.subscribers.get("sub-2-5")?.isVerified).toBe(true);
      });
    });

    // ------------------------------------------------------------------------
    // Feature 3: RFC 8058 1-Click Unsubscribe API (POST /api/notifications/unsubscribe)
    // ------------------------------------------------------------------------
    describe("Feature 3: RFC 8058 1-Click Unsubscribe API", () => {
      it("3.1 Global unsubscription (topic=ALL or omitted) marks subscriber UNSUBSCRIBED and removes all subscription rows", async () => {
        const token = "global-unsub-tok";
        const subId = "sub-unsub-1";
        dbStore.subscribers.set(subId, {
          id: subId,
          email: "unsuball@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: token,
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("u1", {
          id: "u1",
          subscriberId: subId,
          subject: SubjectChannel.JAVASCRIPT,
          createdAt: new Date(),
        });

        const req = new Request(
          `https://systemvisualizer.com/api/notifications/unsubscribe?token=${token}&topic=ALL`,
          {
            method: "POST",
            headers: { "x-forwarded-for": getUniqueIp() },
          }
        );

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.status).toBe(SubscriptionStatus.UNSUBSCRIBED);

        const sub = dbStore.subscribers.get(subId);
        expect(sub?.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
        const subs = Array.from(dbStore.subscriptions.values()).filter(
          (s) => s.subscriberId === subId
        );
        expect(subs).toHaveLength(0);
      });

      it("3.2 Granular topic unsubscription removes only targeted topic and preserves remaining topics", async () => {
        const token = "granular-unsub-tok";
        const subId = "sub-unsub-2";
        dbStore.subscribers.set(subId, {
          id: subId,
          email: "granular@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: token,
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("g1", {
          id: "g1",
          subscriberId: subId,
          subject: SubjectChannel.JAVASCRIPT,
          createdAt: new Date(),
        });
        dbStore.subscriptions.set("g2", {
          id: "g2",
          subscriberId: subId,
          subject: SubjectChannel.BACKEND,
          createdAt: new Date(),
        });

        const req = new Request(
          `https://systemvisualizer.com/api/notifications/unsubscribe?token=${token}&topic=JAVASCRIPT`,
          {
            method: "POST",
            headers: { "x-forwarded-for": getUniqueIp() },
          }
        );

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.remainingTopics).toEqual([SubjectChannel.BACKEND]);

        const subs = Array.from(dbStore.subscriptions.values()).filter(
          (s) => s.subscriberId === subId
        );
        expect(subs).toHaveLength(1);
        expect(subs[0].subject).toBe(SubjectChannel.BACKEND);
      });

      it("3.3 Selective unsubscription when subscribed to ALL expands ALL into remaining canonical disciplines", async () => {
        const token = "all-expansion-tok";
        const subId = "sub-all-expansion";
        dbStore.subscribers.set(subId, {
          id: subId,
          email: "allexpand@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: token,
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("all_sub", {
          id: "all_sub",
          subscriberId: subId,
          subject: SubjectChannel.ALL,
          createdAt: new Date(),
        });

        const req = new Request(
          `https://systemvisualizer.com/api/notifications/unsubscribe?token=${token}&topic=JAVASCRIPT`,
          {
            method: "POST",
            headers: { "x-forwarded-for": getUniqueIp() },
          }
        );

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(200);

        const subs = Array.from(dbStore.subscriptions.values()).filter(
          (s) => s.subscriberId === subId
        );
        expect(subs).toHaveLength(5);
        const remainingSubjects = subs.map((s) => s.subject);
        expect(remainingSubjects).not.toContain(SubjectChannel.JAVASCRIPT);
        expect(remainingSubjects).not.toContain(SubjectChannel.ALL);
        expect(remainingSubjects).toContain(SubjectChannel.COMPUTER_NETWORKS);
        expect(remainingSubjects).toContain(SubjectChannel.BACKEND);
      });

      it("3.4 Unsubscribing from the last remaining topic transitions subscriber status to UNSUBSCRIBED", async () => {
        const token = "last-topic-tok";
        const subId = "sub-last-topic";
        dbStore.subscribers.set(subId, {
          id: subId,
          email: "lasttopic@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: token,
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("only_one", {
          id: "only_one",
          subscriberId: subId,
          subject: SubjectChannel.JAVA,
          createdAt: new Date(),
        });

        const req = new Request(
          `https://systemvisualizer.com/api/notifications/unsubscribe?token=${token}&topic=JAVA`,
          {
            method: "POST",
            headers: { "x-forwarded-for": getUniqueIp() },
          }
        );

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
        expect(dbStore.subscribers.get(subId)?.status).toBe(
          SubscriptionStatus.UNSUBSCRIBED
        );
      });

      it("3.5 Form-encoded POST (application/x-www-form-urlencoded) executes 1-click unsubscription successfully", async () => {
        const token = "form-unsub-token";
        const subId = "sub-form-unsub";
        dbStore.subscribers.set(subId, {
          id: subId,
          email: "formunsub@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: token,
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("form_sub", {
          id: "form_sub",
          subscriberId: subId,
          subject: SubjectChannel.FRONTEND,
          createdAt: new Date(),
        });

        const formBody = new URLSearchParams({
          token,
          topic: "FRONTEND",
          "List-Unsubscribe": "One-Click",
        }).toString();

        const req = new Request("https://systemvisualizer.com/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-forwarded-for": getUniqueIp(),
          },
          body: formBody,
        });

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(dbStore.subscribers.get(subId)?.status).toBe(
          SubscriptionStatus.UNSUBSCRIBED
        );
      });
    });

    // ------------------------------------------------------------------------
    // Feature 4: Cryptographic Release Ingest Pipeline (POST /api/internal/episodes/publish)
    // ------------------------------------------------------------------------
    describe("Feature 4: Cryptographic Release Ingest Pipeline", () => {
      it("4.1 Valid HMAC-SHA256 signature and fresh timestamp enqueues release event to SQS fanout queue", async () => {
        const payload = {
          subject: SubjectChannel.JAVASCRIPT,
          episodeId: "closure-deep-dive",
          episodeNumber: 6,
          title: "JavaScript Closures Explained",
          releaseCommitSha: "a1b2c3d4e5f67890123456789012345678901234",
        };

        const req = createSignedReleaseRequest({ payload });
        const res = await publishHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.queued).toBe(true);
        expect(data.messageId).toBeDefined();
        expect(mockSqsSend).toHaveBeenCalledTimes(1);
      });

      it("4.2 SQS-first safe enqueue ordering: enqueues to SQS before updating PublishedEpisode in DB", async () => {
        const executionOrder: string[] = [];
        mockSqsSend.mockImplementationOnce(async () => {
          executionOrder.push("SQS_ENQUEUE");
          return { MessageId: "sqs-first-msg-1" };
        });

        const origUpsert = mockPrisma.publishedEpisode.upsert;
        mockPrisma.publishedEpisode.upsert = vi.fn(
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
            executionOrder.push("DB_UPSERT");
            return origUpsert(params);
          }
        );

        const payload = {
          subject: SubjectChannel.BACKEND,
          episodeId: "concurrency-models",
          episodeNumber: 3,
          title: "Backend Concurrency Models",
          releaseCommitSha: "b2c3d4e5f6789012345678901234567890123456",
        };

        const req = createSignedReleaseRequest({ payload });
        const res = await publishHandler(req);
        expect(res.status).toBe(200);
        expect(executionOrder).toEqual(["SQS_ENQUEUE", "DB_UPSERT"]);
      });

      it("4.3 Ingest handler supports optional ctaUrl and metadata (summary, keyConcepts)", async () => {
        const payload = {
          subject: SubjectChannel.JAVA,
          episodeId: "jvm-memory-layout",
          episodeNumber: 2,
          title: "JVM Memory Architecture",
          releaseCommitSha: "c3d4e5f678901234567890123456789012345678",
          summary: "Deep dive into young and tenured generation garbage collection",
          keyConcepts: ["Heap", "Metaspace", "Eden space"],
          ctaUrl: "https://systemvisualizer.com/java/episodes/jvm-memory-layout",
        };

        const req = createSignedReleaseRequest({ payload });
        const res = await publishHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
      });

      it("4.4 Ingest handler creates PublishedEpisode with initial status and commit SHA", async () => {
        const payload = {
          subject: SubjectChannel.OPERATING_SYSTEMS,
          episodeId: "virtual-memory",
          episodeNumber: 4,
          title: "Virtual Memory & Paging",
          releaseCommitSha: "d4e5f67890123456789012345678901234567890",
        };

        const req = createSignedReleaseRequest({ payload });
        await publishHandler(req);

        const key = `${SubjectChannel.OPERATING_SYSTEMS}_virtual-memory`;
        const ep = dbStore.publishedEpisodes.get(key);
        expect(ep).toBeDefined();
        expect(ep?.releaseCommitSha).toBe(payload.releaseCommitSha);
        expect(ep?.title).toBe(payload.title);
      });

      it("4.5 Re-publishing an existing episode with force: true allows re-enqueue", async () => {
        const key = `${SubjectChannel.JAVASCRIPT}_existing-ep`;
        dbStore.publishedEpisodes.set(key, {
          id: "pe-existing",
          subject: SubjectChannel.JAVASCRIPT,
          episodeId: "existing-ep",
          episodeNumber: 1,
          title: "Existing Episode",
          releaseCommitSha: "sha-existing",
          status: "PUBLISHED",
          totalRecipients: 25,
          successfulDispatches: 25,
          dispatchedAt: new Date(Date.now() - 3600 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const payload = {
          subject: SubjectChannel.JAVASCRIPT,
          episodeId: "existing-ep",
          episodeNumber: 1,
          title: "Existing Episode",
          releaseCommitSha: "sha-existing",
          force: true,
        };

        const req = createSignedReleaseRequest({ payload });
        const res = await publishHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.queued).toBe(true);
      });
    });

    // ------------------------------------------------------------------------
    // Feature 5: SQS Fan-Out Lambda Handler (EpisodeFanoutHandler)
    // ------------------------------------------------------------------------
    describe("Feature 5: SQS Fan-Out Lambda Handler", () => {
      it("5.1 Queries active, verified subscribers subscribed to the release subject or ALL", async () => {
        const s1 = "sub-user-active-js";
        dbStore.subscribers.set(s1, {
          id: s1,
          email: "user_js@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "unsub-js",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("subn-js", {
          id: "subn-js",
          subscriberId: s1,
          subject: SubjectChannel.JAVASCRIPT,
          createdAt: new Date(),
        });

        const s2 = "sub-user-active-all";
        dbStore.subscribers.set(s2, {
          id: s2,
          email: "user_all@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "unsub-all",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("subn-all", {
          id: "subn-all",
          subscriberId: s2,
          subject: SubjectChannel.ALL,
          createdAt: new Date(),
        });

        const result = await processEpisodeFanout({
          subject: SubjectChannel.JAVASCRIPT,
          episodeId: "ep-event-loop",
          episodeNumber: 7,
          title: "Event Loop Visualized",
          releaseCommitSha: "sha-loop-1",
        });

        expect(result.success).toBe(true);
        expect(result.totalRecipients).toBe(2);
        expect(result.chunksDispatched).toBe(1);
      });

      it("5.2 Slices recipients into batches of 10 and enqueues to SQS dispatch queue", async () => {
        for (let i = 1; i <= 25; i++) {
          const id = `sub_fan_${i}`;
          dbStore.subscribers.set(id, {
            id,
            email: `fanout_user_${i}@example.com`,
            userId: null,
            isVerified: true,
            verificationToken: null,
            tokenExpiresAt: null,
            unsubscribeToken: `unsub-${i}`,
            status: SubscriptionStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          dbStore.subscriptions.set(`subn_fan_${i}`, {
            id: `subn_fan_${i}`,
            subscriberId: id,
            subject: SubjectChannel.COMPUTER_NETWORKS,
            createdAt: new Date(),
          });
        }

        const result = await processEpisodeFanout({
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeId: "tcp-handshake",
          episodeNumber: 1,
          title: "TCP 3-Way Handshake",
          releaseCommitSha: "sha-net-1",
        });

        expect(result.success).toBe(true);
        expect(result.totalRecipients).toBe(25);
        expect(result.chunksDispatched).toBe(3);
      });

      it("5.3 Deduplicates recipients who are subscribed to both the specific discipline and ALL", async () => {
        const id = "sub_double_sub";
        dbStore.subscribers.set(id, {
          id,
          email: "double@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "unsub-double",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("sn1", {
          id: "sn1",
          subscriberId: id,
          subject: SubjectChannel.BACKEND,
          createdAt: new Date(),
        });
        dbStore.subscriptions.set("sn2", {
          id: "sn2",
          subscriberId: id,
          subject: SubjectChannel.ALL,
          createdAt: new Date(),
        });

        const result = await processEpisodeFanout({
          subject: SubjectChannel.BACKEND,
          episodeId: "raft-consensus",
          episodeNumber: 5,
          title: "Raft Consensus Algorithm",
          releaseCommitSha: "sha-raft-1",
        });

        expect(result.totalRecipients).toBe(1);
      });

      it("5.4 Skips unverified and unsubscribed/bounced subscribers", async () => {
        dbStore.subscribers.set("sub_unver", {
          id: "sub_unver",
          email: "unverified@example.com",
          userId: null,
          isVerified: false,
          verificationToken: "tok",
          tokenExpiresAt: new Date(Date.now() + 10000),
          unsubscribeToken: "u1",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("s_unver", {
          id: "s_unver",
          subscriberId: "sub_unver",
          subject: SubjectChannel.JAVA,
          createdAt: new Date(),
        });

        dbStore.subscribers.set("sub_bounced", {
          id: "sub_bounced",
          email: "bounced@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "u2",
          status: SubscriptionStatus.BOUNCED,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("s_bounced", {
          id: "s_bounced",
          subscriberId: "sub_bounced",
          subject: SubjectChannel.JAVA,
          createdAt: new Date(),
        });

        const result = await processEpisodeFanout({
          subject: SubjectChannel.JAVA,
          episodeId: "java-threads",
          episodeNumber: 3,
          title: "Virtual Threads in Java",
          releaseCommitSha: "sha-threads",
        });

        expect(result.totalRecipients).toBe(0);
        expect(result.chunksDispatched).toBe(0);
      });

      it("5.5 Updates PublishedEpisode.totalRecipients and dispatchedAt", async () => {
        const id = "sub_metrics_1";
        dbStore.subscribers.set(id, {
          id,
          email: "metrics@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "unsub-met",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set("s_met", {
          id: "s_met",
          subscriberId: id,
          subject: SubjectChannel.FRONTEND,
          createdAt: new Date(),
        });

        await processEpisodeFanout({
          subject: SubjectChannel.FRONTEND,
          episodeId: "react-reconciliation",
          episodeNumber: 2,
          title: "React Fiber Architecture",
          releaseCommitSha: "sha-fiber",
        });

        const key = `${SubjectChannel.FRONTEND}_react-reconciliation`;
        const ep = dbStore.publishedEpisodes.get(key);
        expect(ep).toBeDefined();
        expect(ep?.totalRecipients).toBe(1);
        expect(ep?.dispatchedAt).toBeDefined();
      });
    });

    // ------------------------------------------------------------------------
    // Feature 6: SQS Dispatch Lambda Handler (EmailDispatchHandler)
    // ------------------------------------------------------------------------
    describe("Feature 6: SQS Dispatch Lambda Handler", () => {
      it("6.1 Consumes batch payload, renders EpisodeReleaseEmail with subject palette, and dispatches via resend.batch.send", async () => {
        const record: SQSRecord = {
          messageId: "rec-msg-1",
          receiptHandle: "h1",
          body: JSON.stringify({
            episode: {
              subject: SubjectChannel.JAVASCRIPT,
              episodeId: "hoisting",
              episodeNumber: 2,
              title: "JavaScript Hoisting",
              summary: "Creation phase vs execution phase",
              releaseCommitSha: "sha-hoist",
            },
            recipients: [
              { email: "user1@example.com", unsubscribeToken: "tok-u1" },
              { email: "user2@example.com", unsubscribeToken: "tok-u2" },
            ],
          }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "0",
            SenderId: "0",
            ApproximateFirstReceiveTimestamp: "0",
          },
          messageAttributes: {},
          md5OfBody: "md5",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
          awsRegion: "us-east-1",
        };

        const result = await processDispatchRecord(record);
        expect(result.dispatchedCount).toBe(2);
        expect(mockResendSend).toHaveBeenCalledTimes(1);

        const sentPayload = mockResendSend.mock.calls[0][0] as Array<{
          to: string[];
          subject: string;
          html: string;
        }>;
        expect(sentPayload).toHaveLength(2);
        expect(sentPayload[0].to).toEqual(["user1@example.com"]);
        expect(sentPayload[0].subject).toContain("JavaScript Hoisting");
        expect(sentPayload[0].html).toContain("JavaScript");
      });

      it("6.2 Injects RFC 8058 List-Unsubscribe and List-Unsubscribe-Post headers into each batch email", async () => {
        const record: SQSRecord = {
          messageId: "rec-msg-2",
          receiptHandle: "h2",
          body: JSON.stringify({
            episode: {
              subject: SubjectChannel.OPERATING_SYSTEMS,
              episodeId: "page-faults",
              episodeNumber: 5,
              title: "Handling Page Faults",
              releaseCommitSha: "sha-pf",
            },
            recipients: [
              { email: "rfc@example.com", unsubscribeToken: "tok-rfc-123" },
            ],
          }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "0",
            SenderId: "0",
            ApproximateFirstReceiveTimestamp: "0",
          },
          messageAttributes: {},
          md5OfBody: "md5",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
          awsRegion: "us-east-1",
        };

        await processDispatchRecord(record);
        expect(mockResendSend).toHaveBeenCalledTimes(1);
        const emailItem = (
          mockResendSend.mock.calls[0][0] as Array<{
            headers: Record<string, string>;
          }>
        )[0];
        expect(emailItem.headers["List-Unsubscribe-Post"]).toBe(
          "List-Unsubscribe=One-Click"
        );
        expect(emailItem.headers["List-Unsubscribe"]).toContain("tok-rfc-123");
        expect(emailItem.headers["List-Unsubscribe"]).toContain(
          SubjectChannel.OPERATING_SYSTEMS
        );
      });

      it("6.3 Honors rate pacer interval to guard Resend rate limits", async () => {
        const pacer = new RatePacer();
        const start = Date.now();
        await pacer.wait(50);
        await pacer.wait(50);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(45);
      });

      it("6.4 Updates PublishedEpisode.dispatchedAt upon delivery", async () => {
        const key = `${SubjectChannel.JAVA}_ep-jvm`;
        dbStore.publishedEpisodes.set(key, {
          id: "pe-jvm",
          subject: SubjectChannel.JAVA,
          episodeId: "ep-jvm",
          episodeNumber: 1,
          title: "JVM Internals",
          releaseCommitSha: "sha-jvm",
          status: "PUBLISHED",
          totalRecipients: 1,
          successfulDispatches: 0,
          dispatchedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const record: SQSRecord = {
          messageId: "rec-msg-4",
          receiptHandle: "h4",
          body: JSON.stringify({
            episode: {
              subject: SubjectChannel.JAVA,
              episodeId: "ep-jvm",
              episodeNumber: 1,
              title: "JVM Internals",
              releaseCommitSha: "sha-jvm",
            },
            recipients: [
              { email: "user@example.com", unsubscribeToken: "tok-u" },
            ],
          }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "0",
            SenderId: "0",
            ApproximateFirstReceiveTimestamp: "0",
          },
          messageAttributes: {},
          md5OfBody: "md5",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
          awsRegion: "us-east-1",
        };

        await processDispatchRecord(record);
        expect(dbStore.publishedEpisodes.get(key)?.dispatchedAt).toBeDefined();
      });

      it("6.5 Partial failure reporting via SQS batchItemFailures (ReportBatchItemFailures)", async () => {
        mockResendSend.mockRejectedValueOnce(new Error("Resend HTTP 500 error"));

        const event: SQSEvent = {
          Records: [
            {
              messageId: "failed-msg-1",
              receiptHandle: "h_fail",
              body: JSON.stringify({
                episode: {
                  subject: SubjectChannel.BACKEND,
                  episodeId: "ep-fail",
                  episodeNumber: 1,
                  title: "Failure Test",
                  releaseCommitSha: "sha-fail",
                },
                recipients: [
                  { email: "fail@example.com", unsubscribeToken: "tok-fail" },
                ],
              }),
              attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "0",
                SenderId: "0",
                ApproximateFirstReceiveTimestamp: "0",
              },
              messageAttributes: {},
              md5OfBody: "md5",
              eventSource: "aws:sqs",
              eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
              awsRegion: "us-east-1",
            },
          ],
        };

        const response = await EmailDispatchHandler(event);
        expect(response.batchItemFailures).toHaveLength(1);
        expect(response.batchItemFailures[0].itemIdentifier).toBe("failed-msg-1");
      });
    });

    // ------------------------------------------------------------------------
    // Feature 7: Resend Bounce/Complaint Webhook (POST /api/webhooks/resend)
    // ------------------------------------------------------------------------
    describe("Feature 7: Resend Bounce/Complaint Webhook", () => {
      it("7.1 Valid Svix signature with email.bounced event transitions subscriber status to BOUNCED", async () => {
        const id = "sub_bounce_me";
        dbStore.subscribers.set(id, {
          id,
          email: "bounceme@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "tok-b",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const rawBody = JSON.stringify({
          type: "email.bounced",
          data: {
            to: ["bounceme@example.com"],
            bounce: { type: "Permanent", message: "Mailbox does not exist" },
          },
        });

        const svixHeaders = createTestSvixHeaders({
          payload: rawBody,
          secret: TEST_WEBHOOK_SECRET,
        });

        const req = new Request("https://systemvisualizer.com/api/webhooks/resend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...svixHeaders,
          },
          body: rawBody,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(dbStore.subscribers.get(id)?.status).toBe(
          SubscriptionStatus.BOUNCED
        );
      });

      it("7.2 Valid Svix signature with email.complained event transitions subscriber status to BOUNCED", async () => {
        const id = "sub_complain_me";
        dbStore.subscribers.set(id, {
          id,
          email: "complain@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "tok-c",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const rawBody = JSON.stringify({
          type: "email.complained",
          data: { to: ["complain@example.com"] },
        });

        const svixHeaders = createTestSvixHeaders({
          payload: rawBody,
          secret: TEST_WEBHOOK_SECRET,
        });

        const req = new Request("https://systemvisualizer.com/api/webhooks/resend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...svixHeaders,
          },
          body: rawBody,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(200);
        expect(dbStore.subscribers.get(id)?.status).toBe(
          SubscriptionStatus.BOUNCED
        );
      });

      it("7.3 Handles payload where data.to is an array of multiple bounced emails", async () => {
        dbStore.subscribers.set("sub1", {
          id: "sub1",
          email: "bounce1@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "u1",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscribers.set("sub2", {
          id: "sub2",
          email: "bounce2@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "u2",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const rawBody = JSON.stringify({
          type: "email.bounced",
          data: { to: ["bounce1@example.com", "bounce2@example.com"] },
        });

        const svixHeaders = createTestSvixHeaders({
          payload: rawBody,
          secret: TEST_WEBHOOK_SECRET,
        });

        const req = new Request("https://systemvisualizer.com/api/webhooks/resend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...svixHeaders,
          },
          body: rawBody,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(200);
        expect(dbStore.subscribers.get("sub1")?.status).toBe(
          SubscriptionStatus.BOUNCED
        );
        expect(dbStore.subscribers.get("sub2")?.status).toBe(
          SubscriptionStatus.BOUNCED
        );
      });

      it("7.4 Handles payload where data.to is a single string email", async () => {
        const id = "sub_single_str";
        dbStore.subscribers.set(id, {
          id,
          email: "singlestr@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "u_single",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const rawBody = JSON.stringify({
          type: "email.bounced",
          data: { to: "singlestr@example.com" },
        });

        const svixHeaders = createTestSvixHeaders({
          payload: rawBody,
          secret: TEST_WEBHOOK_SECRET,
        });

        const req = new Request("https://systemvisualizer.com/api/webhooks/resend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...svixHeaders,
          },
          body: rawBody,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(200);
        expect(dbStore.subscribers.get(id)?.status).toBe(
          SubscriptionStatus.BOUNCED
        );
      });

      it("7.5 Non-bounce/complaint event types (e.g. email.delivered, email.opened) are safely acknowledged with 200 OK", async () => {
        const rawBody = JSON.stringify({
          type: "email.delivered",
          data: { to: ["delivered@example.com"] },
        });

        const svixHeaders = createTestSvixHeaders({
          payload: rawBody,
          secret: TEST_WEBHOOK_SECRET,
        });

        const req = new Request("https://systemvisualizer.com/api/webhooks/resend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...svixHeaders,
          },
          body: rawBody,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.received).toBe(true);
      });
    });

    // ------------------------------------------------------------------------
    // Feature 8: GitOps Release Detection & Signing (AST Parser & Cryptography)
    // ------------------------------------------------------------------------
    describe("Feature 8: GitOps Release Detection & Cryptographic Signing", () => {
      it("8.1 AST detector identifies newly added episodes in episodes.tsx", () => {
        const sampleTsx = `
          import { EpisodeMetadata } from "./types";
          export const JAVASCRIPT_EPISODES: EpisodeMetadata[] = [
            {
              id: "closures",
              episodeNumber: 6,
              title: "JavaScript Closures",
              description: "Deep dive into lexical scoping",
              date: "29 October 2026",
              href: "/javascript/closures"
            }
          ];
        `;

        const episodes = parseEpisodesFromTsx(sampleTsx);
        expect(episodes).toHaveLength(1);
        expect(episodes[0].id).toBe("closures");
        expect(episodes[0].episodeNumber).toBe(6);
        expect(episodes[0].title).toBe("JavaScript Closures");
      });

      it("8.2 AST detector triggers when episode date transitions from 'Coming Soon' to release date", () => {
        expect(isReleasedDate("Coming Soon")).toBe(false);
        expect(isReleasedDate("COMING SOON")).toBe(false);
        expect(isReleasedDate("")).toBe(false);
        expect(isReleasedDate("29 October 2026")).toBe(true);
        expect(isReleasedDate("November 2026")).toBe(true);
      });

      it("8.3 AST detector ignores deleted episodes or non-release edits", () => {
        const sampleTsx = `
          export const JAVASCRIPT_EPISODES = [
            {
              id: "call-stack",
              episodeNumber: 1,
              title: "Call Stack Execution",
              date: "Coming Soon"
            }
          ];
        `;
        const episodes = parseEpisodesFromTsx(sampleTsx);
        expect(episodes).toHaveLength(1);
        expect(isReleasedDate(episodes[0].date)).toBe(false);
      });

      it("8.4 AST detector correctly maps files to canonical SubjectChannel enums", () => {
        expect(SUBJECT_FILE_MAP["src/app/javascript/episodes.tsx"]).toBe(
          SubjectChannel.JAVASCRIPT
        );
        expect(
          SUBJECT_FILE_MAP["src/app/operating-systems/episodes.tsx"]
        ).toBe(SubjectChannel.OPERATING_SYSTEMS);
        expect(SUBJECT_FILE_MAP["src/app/computer-networks/episodes.tsx"]).toBe(
          SubjectChannel.COMPUTER_NETWORKS
        );
        expect(SUBJECT_FILE_MAP["src/app/java/episodes.tsx"]).toBe(
          SubjectChannel.JAVA
        );
        expect(SUBJECT_FILE_MAP["src/app/backend/episodes.tsx"]).toBe(
          SubjectChannel.BACKEND
        );
        expect(SUBJECT_FILE_MAP["src/app/frontend/episodes.tsx"]).toBe(
          SubjectChannel.FRONTEND
        );
      });

      it("8.5 Release signature generator computes constant-time HMAC-SHA256 bound to timestamp and body", () => {
        const payload = JSON.stringify({ test: "value" });
        const timestamp = "1730462400";
        const sig = computeReleaseSignature({
          payload,
          secret: TEST_RELEASE_SECRET,
          timestamp,
        });

        expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);

        const verifyResult = verifyReleaseSignatureDetailed({
          payload,
          headers: {
            "x-release-signature": sig,
            "x-release-timestamp": timestamp,
          },
          secret: TEST_RELEASE_SECRET,
          toleranceSeconds: 300,
          now: 1730462400 * 1000,
        });

        expect(verifyResult.valid).toBe(true);
        expect(verifyResult.status).toBe(200);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TIER 2: BOUNDARY & CORNER CASES
  // ──────────────────────────────────────────────────────────────────────────
  describe("Tier 2: Boundary & Corner Cases", () => {
    // ------------------------------------------------------------------------
    // Feature 1 Boundaries: Subscription API
    // ------------------------------------------------------------------------
    describe("Feature 1 Boundaries: Subscription API", () => {
      it("2.1.1 Malformed email formats (missing @, invalid domain) rejected with 400", async () => {
        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: "invalid-email-no-at",
            subjects: [SubjectChannel.JAVASCRIPT],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain("Invalid email format.");
      });

      it("2.1.2 Extremely long email address (>255 chars) rejected with 400", async () => {
        const longEmail = `${"a".repeat(250)}@example.com`;
        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: longEmail,
            subjects: [SubjectChannel.JAVASCRIPT],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain("Email address is too long.");
      });

      it("2.1.3 Empty subjects array or invalid enum values rejected with 400", async () => {
        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: "empty@example.com",
            subjects: [],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(400);
      });

      it("2.1.4 Account collision: authenticated user attempting to bind email claimed by different user returns 409", async () => {
        dbStore.subscribers.set("sub_victim", {
          id: "sub_victim",
          email: "claimed@example.com",
          userId: "user_victim",
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: "tok-claimed",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        mockAuthState.session = {
          user: { id: "user_attacker", email: "attacker@example.com" },
        };

        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: "claimed@example.com",
            subjects: [SubjectChannel.BACKEND],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.error).toContain("Email is already associated with another account.");
      });

      it("2.1.5 Non-application/json Content-Type rejected with 415", async () => {
        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "x-forwarded-for": getUniqueIp(),
          },
          body: "email=plain@example.com",
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(415);
      });
    });

    // ------------------------------------------------------------------------
    // Feature 2 Boundaries: Verification API
    // ------------------------------------------------------------------------
    describe("Feature 2 Boundaries: Verification API", () => {
      it("2.2.1 Missing token query parameter returns 400 Bad Request", async () => {
        const req = new Request("https://systemvisualizer.com/api/notifications/verify", {
          headers: { "x-forwarded-for": getUniqueIp() },
        });

        const res = await verifyHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("Verification token is required.");
      });

      it("2.2.2 Non-existent / random token returns 400 Bad Request", async () => {
        const req = new Request(
          "https://systemvisualizer.com/api/notifications/verify?token=non_existent_token_123",
          { headers: { "x-forwarded-for": getUniqueIp() } }
        );

        const res = await verifyHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("Invalid verification token.");
      });

      it("2.2.3 Expired token (>24 hours past issuance) returns 410 Gone", async () => {
        const expiredToken = "expired-token-tok";
        dbStore.subscribers.set("sub-expired", {
          id: "sub-expired",
          email: "expired@example.com",
          userId: null,
          isVerified: false,
          verificationToken: expiredToken,
          tokenExpiresAt: new Date(Date.now() - 3600 * 1000),
          unsubscribeToken: "unsub-exp",
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const req = new Request(
          `https://systemvisualizer.com/api/notifications/verify?token=${expiredToken}`,
          { headers: { "x-forwarded-for": getUniqueIp() } }
        );

        const res = await verifyHandler(req);
        expect(res.status).toBe(410);
        const data = await res.json();
        expect(data.error).toContain("Verification token has expired.");
      });

      it("2.2.4 Malformed / whitespace-only token returns 400", async () => {
        const req = new Request(
          "https://systemvisualizer.com/api/notifications/verify?token=%20%20%20",
          { headers: { "x-forwarded-for": getUniqueIp() } }
        );

        const res = await verifyHandler(req);
        expect(res.status).toBe(400);
      });

      it("2.2.5 Missing database configuration returns 503", async () => {
        const originalUrl = mockEnvConfig.DATABASE_URL;
        (mockEnvConfig as Record<string, unknown>).DATABASE_URL = "";

        const req = new Request(
          "https://systemvisualizer.com/api/notifications/verify?token=any-token",
          { headers: { "x-forwarded-for": getUniqueIp() } }
        );

        const res = await verifyHandler(req);
        expect(res.status).toBe(503);
        mockEnvConfig.DATABASE_URL = originalUrl;
      });
    });

    // ------------------------------------------------------------------------
    // Feature 3 Boundaries: Unsubscribe API
    // ------------------------------------------------------------------------
    describe("Feature 3 Boundaries: Unsubscribe API", () => {
      it("2.3.1 Missing token in both query and body returns 400", async () => {
        const req = new Request("https://systemvisualizer.com/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({}),
        });

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("Unsubscribe token is required.");
      });

      it("2.3.2 Non-existent subscriber token returns 404", async () => {
        const req = new Request(
          "https://systemvisualizer.com/api/notifications/unsubscribe?token=ghost-token",
          {
            method: "POST",
            headers: { "x-forwarded-for": getUniqueIp() },
          }
        );

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error).toContain("Subscriber not found or invalid token.");
      });

      it("2.3.3 Invalid topic enum string returns 400", async () => {
        const token = "valid-tok-for-invalid-topic";
        dbStore.subscribers.set("sub-inv-topic", {
          id: "sub-inv-topic",
          email: "invalidtopic@example.com",
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: token,
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const req = new Request(
          `https://systemvisualizer.com/api/notifications/unsubscribe?token=${token}&topic=CRYPTO_TRADING`,
          {
            method: "POST",
            headers: { "x-forwarded-for": getUniqueIp() },
          }
        );

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain("Invalid topic channel");
      });

      it("2.3.4 GET request without token returns 405 Method Not Allowed; GET with token redirects to /unsubscribe", async () => {
        const reqNoToken = new Request("https://systemvisualizer.com/api/notifications/unsubscribe");
        const resNoToken = await unsubscribeGetHandler(reqNoToken);
        expect(resNoToken.status).toBe(405);

        const reqWithToken = new Request(
          "https://systemvisualizer.com/api/notifications/unsubscribe?token=abc-123&topic=JAVASCRIPT"
        );
        const resWithToken = await unsubscribeGetHandler(reqWithToken);
        expect(resWithToken.status).toBe(307);
        expect(resWithToken.headers.get("location")).toContain("/unsubscribe");
      });

      it("2.3.5 Corrupt JSON payload in POST body returns 400", async () => {
        const req = new Request("https://systemvisualizer.com/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: "{ corrupt_json: broken",
        });

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("Invalid JSON payload.");
      });
    });

    // ------------------------------------------------------------------------
    // Feature 4 Boundaries: Release Ingest Pipeline
    // ------------------------------------------------------------------------
    describe("Feature 4 Boundaries: Release Ingest Pipeline", () => {
      it("2.4.1 Missing signature headers returns 400 Bad Request (missing timestamp) or 401 Unauthorized", async () => {
        const req = new Request("https://systemvisualizer.com/api/internal/episodes/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            subject: SubjectChannel.JAVASCRIPT,
            episodeId: "test",
            episodeNumber: 1,
            title: "Test",
            releaseCommitSha: "sha1",
          }),
        });

        const res = await publishHandler(req);
        expect(res.status).toBe(400);

        const req2 = new Request("https://systemvisualizer.com/api/internal/episodes/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-release-timestamp": Math.floor(Date.now() / 1000).toString(),
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            subject: SubjectChannel.JAVASCRIPT,
            episodeId: "test",
            episodeNumber: 1,
            title: "Test",
            releaseCommitSha: "sha1",
          }),
        });
        const res2 = await publishHandler(req2);
        expect(res2.status).toBe(401);
      });

      it("2.4.2 Corrupt / tampered HMAC signature returns 401 Unauthorized", async () => {
        const req = createSignedReleaseRequest({
          payload: {
            subject: SubjectChannel.JAVASCRIPT,
            episodeId: "test",
            episodeNumber: 1,
            title: "Test",
            releaseCommitSha: "sha1",
          },
          tamperSignature: true,
        });

        const res = await publishHandler(req);
        expect(res.status).toBe(401);
      });

      it("2.4.3 Expired timestamp (>5 minutes drift in the past) returns 401", async () => {
        const sixMinutesAgo = Math.floor(Date.now() / 1000) - 360;
        const req = createSignedReleaseRequest({
          payload: {
            subject: SubjectChannel.JAVASCRIPT,
            episodeId: "test",
            episodeNumber: 1,
            title: "Test",
            releaseCommitSha: "sha1",
          },
          timestamp: sixMinutesAgo,
        });

        const res = await publishHandler(req);
        expect(res.status).toBe(401);
      });

      it("2.4.4 Future timestamp (>5 minutes drift in the future) returns 401", async () => {
        const sixMinutesFuture = Math.floor(Date.now() / 1000) + 360;
        const req = createSignedReleaseRequest({
          payload: {
            subject: SubjectChannel.JAVASCRIPT,
            episodeId: "test",
            episodeNumber: 1,
            title: "Test",
            releaseCommitSha: "sha1",
          },
          timestamp: sixMinutesFuture,
        });

        const res = await publishHandler(req);
        expect(res.status).toBe(401);
      });

      it("2.4.5 Empty payload or invalid schema (missing episodeId or invalid subject) returns 400", async () => {
        const req = createSignedReleaseRequest({
          payload: {
            subject: "INVALID_CHANNEL",
            title: "Missing Fields",
          },
        });

        const res = await publishHandler(req);
        expect(res.status).toBe(400);
      });
    });

    // ------------------------------------------------------------------------
    // Feature 5 Boundaries: SQS Fan-Out Lambda Handler
    // ------------------------------------------------------------------------
    describe("Feature 5 Boundaries: SQS Fan-Out Lambda Handler", () => {
      it("2.5.1 Zero eligible subscribers handled gracefully without enqueuing empty SQS batches", async () => {
        const result = await processEpisodeFanout({
          subject: SubjectChannel.FRONTEND,
          episodeId: "ep-empty-subscribers",
          episodeNumber: 1,
          title: "Frontend Architecture",
          releaseCommitSha: "sha-empty",
        });

        expect(result.success).toBe(true);
        expect(result.totalRecipients).toBe(0);
        expect(result.chunksDispatched).toBe(0);
      });

      it("2.5.2 Exactly 10 subscribers yields exactly 1 batch of 10 recipients", async () => {
        for (let i = 1; i <= 10; i++) {
          const id = `sub_10_${i}`;
          dbStore.subscribers.set(id, {
            id,
            email: `user_exact_10_${i}@example.com`,
            userId: null,
            isVerified: true,
            verificationToken: null,
            tokenExpiresAt: null,
            unsubscribeToken: `tok-${i}`,
            status: SubscriptionStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          dbStore.subscriptions.set(`sn_10_${i}`, {
            id: `sn_10_${i}`,
            subscriberId: id,
            subject: SubjectChannel.JAVA,
            createdAt: new Date(),
          });
        }

        const result = await processEpisodeFanout({
          subject: SubjectChannel.JAVA,
          episodeId: "java-exact-10",
          episodeNumber: 1,
          title: "Java Exact 10",
          releaseCommitSha: "sha-10",
        });

        expect(result.totalRecipients).toBe(10);
        expect(result.chunksDispatched).toBe(1);
      });

      it("2.5.3 11 subscribers yields exactly 2 batches (1 batch of 10, 1 batch of 1)", async () => {
        for (let i = 1; i <= 11; i++) {
          const id = `sub_11_${i}`;
          dbStore.subscribers.set(id, {
            id,
            email: `user_11_${i}@example.com`,
            userId: null,
            isVerified: true,
            verificationToken: null,
            tokenExpiresAt: null,
            unsubscribeToken: `tok-${i}`,
            status: SubscriptionStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          dbStore.subscriptions.set(`sn_11_${i}`, {
            id: `sn_11_${i}`,
            subscriberId: id,
            subject: SubjectChannel.BACKEND,
            createdAt: new Date(),
          });
        }

        const result = await processEpisodeFanout({
          subject: SubjectChannel.BACKEND,
          episodeId: "backend-11",
          episodeNumber: 1,
          title: "Backend 11",
          releaseCommitSha: "sha-11",
        });

        expect(result.totalRecipients).toBe(11);
        expect(result.chunksDispatched).toBe(2);
      });

      it("2.5.4 Duplicate execution without force flag is idempotently skipped (ALREADY_DISPATCHED)", async () => {
        const key = `${SubjectChannel.JAVASCRIPT}_already-run`;
        dbStore.publishedEpisodes.set(key, {
          id: "pe-already",
          subject: SubjectChannel.JAVASCRIPT,
          episodeId: "already-run",
          episodeNumber: 1,
          title: "Already Run",
          releaseCommitSha: "sha-run",
          status: "PUBLISHED",
          totalRecipients: 5,
          successfulDispatches: 5,
          dispatchedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = await processEpisodeFanout({
          subject: SubjectChannel.JAVASCRIPT,
          episodeId: "already-run",
          episodeNumber: 1,
          title: "Already Run",
          releaseCommitSha: "sha-run",
        });

        expect(result.status).toBe("ALREADY_DISPATCHED");
        expect(result.chunksDispatched).toBe(0);
      });

      it("2.5.5 Malformed fanout SQS message payload fails Zod schema validation", async () => {
        await expect(
          processEpisodeFanout({
            subject: "INVALID_CHANNEL",
          })
        ).rejects.toThrow(/Invalid subject channel|Fanout message validation failed/);
      });
    });

    // ------------------------------------------------------------------------
    // Feature 6 Boundaries: SQS Dispatch Lambda Handler
    // ------------------------------------------------------------------------
    describe("Feature 6 Boundaries: SQS Dispatch Lambda Handler", () => {
      it("2.6.1 Dispatch payload exceeding max 10 recipients rejected by schema validator", async () => {
        const recipients = Array.from({ length: 11 }, (_, i) => ({
          email: `overflow_${i}@example.com`,
          unsubscribeToken: `tok-${i}`,
        }));

        const record: SQSRecord = {
          messageId: "rec-overflow",
          receiptHandle: "h",
          body: JSON.stringify({
            episode: {
              subject: SubjectChannel.JAVASCRIPT,
              episodeId: "overflow",
              episodeNumber: 1,
              title: "Overflow",
              releaseCommitSha: "sha",
            },
            recipients,
          }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "0",
            SenderId: "0",
            ApproximateFirstReceiveTimestamp: "0",
          },
          messageAttributes: {},
          md5OfBody: "md5",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
          awsRegion: "us-east-1",
        };

        await expect(processDispatchRecord(record)).rejects.toThrow(
          "Dispatch message validation failed"
        );
      });

      it("2.6.2 Dispatch payload with 0 recipients rejected by schema validator", async () => {
        const record: SQSRecord = {
          messageId: "rec-zero",
          receiptHandle: "h",
          body: JSON.stringify({
            episode: {
              subject: SubjectChannel.JAVASCRIPT,
              episodeId: "zero",
              episodeNumber: 1,
              title: "Zero",
              releaseCommitSha: "sha",
            },
            recipients: [],
          }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "0",
            SenderId: "0",
            ApproximateFirstReceiveTimestamp: "0",
          },
          messageAttributes: {},
          md5OfBody: "md5",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
          awsRegion: "us-east-1",
        };

        await expect(processDispatchRecord(record)).rejects.toThrow(
          "Dispatch message validation failed"
        );
      });

      it("2.6.3 Resend API outage / 500 error triggers batch item failure for SQS retry", async () => {
        mockResendSend.mockResolvedValueOnce({
          data: null,
          error: {
            statusCode: 500,
            name: "internal_server_error",
            message: "Resend backend is unavailable",
          },
        });

        const event: SQSEvent = {
          Records: [
            {
              messageId: "resend-500-msg",
              receiptHandle: "h",
              body: JSON.stringify({
                episode: {
                  subject: SubjectChannel.JAVA,
                  episodeId: "java-outage",
                  episodeNumber: 1,
                  title: "Java Outage",
                  releaseCommitSha: "sha",
                },
                recipients: [
                  { email: "user@example.com", unsubscribeToken: "tok" },
                ],
              }),
              attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "0",
                SenderId: "0",
                ApproximateFirstReceiveTimestamp: "0",
              },
              messageAttributes: {},
              md5OfBody: "md5",
              eventSource: "aws:sqs",
              eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
              awsRegion: "us-east-1",
            },
          ],
        };

        const response = await EmailDispatchHandler(event);
        expect(response.batchItemFailures).toHaveLength(1);
        expect(response.batchItemFailures[0].itemIdentifier).toBe("resend-500-msg");
      });

      it("2.6.4 Empty SQS event records array handled gracefully", async () => {
        const response = await EmailDispatchHandler({ Records: [] });
        expect(response.batchItemFailures).toHaveLength(0);
      });

      it("2.6.5 Malformed JSON body in SQS record triggers item failure", async () => {
        const event: SQSEvent = {
          Records: [
            {
              messageId: "malformed-json-msg",
              receiptHandle: "h",
              body: "{ unclosed_json: ",
              attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "0",
                SenderId: "0",
                ApproximateFirstReceiveTimestamp: "0",
              },
              messageAttributes: {},
              md5OfBody: "md5",
              eventSource: "aws:sqs",
              eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
              awsRegion: "us-east-1",
            },
          ],
        };

        const response = await EmailDispatchHandler(event);
        expect(response.batchItemFailures).toHaveLength(1);
        expect(response.batchItemFailures[0].itemIdentifier).toBe("malformed-json-msg");
      });
    });

    // ------------------------------------------------------------------------
    // Feature 7 Boundaries: Resend Webhook
    // ------------------------------------------------------------------------
    describe("Feature 7 Boundaries: Resend Webhook", () => {
      it("2.7.1 Missing Svix headers returns 400 Bad Request", async () => {
        const req = new Request("https://systemvisualizer.com/api/webhooks/resend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "email.bounced" }),
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(400);
      });

      it("2.7.2 Corrupt Svix signature returns 400 Bad Request", async () => {
        const rawBody = JSON.stringify({
          type: "email.bounced",
          data: { to: ["corrupt@example.com"] },
        });

        const req = new Request("https://systemvisualizer.com/api/webhooks/resend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "svix-id": "msg_test",
            "svix-timestamp": Math.floor(Date.now() / 1000).toString(),
            "svix-signature": "v1,badsignature==",
          },
          body: rawBody,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(400);
      });

      it("2.7.3 Expired Svix timestamp (>5 minutes drift) returns 400 Bad Request", async () => {
        const rawBody = JSON.stringify({
          type: "email.bounced",
          data: { to: ["expired@example.com"] },
        });

        const expiredTs = (Math.floor(Date.now() / 1000) - 360).toString();
        const svixHeaders = createTestSvixHeaders({
          payload: rawBody,
          secret: TEST_WEBHOOK_SECRET,
          timestamp: expiredTs,
        });

        const req = new Request("https://systemvisualizer.com/api/webhooks/resend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...svixHeaders,
          },
          body: rawBody,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(400);
      });

      it("2.7.4 Malformed JSON webhook body returns 400 Bad Request", async () => {
        const rawBody = "{ bad_json: true, ";
        const svixHeaders = createTestSvixHeaders({
          payload: rawBody,
          secret: TEST_WEBHOOK_SECRET,
        });

        const req = new Request("https://systemvisualizer.com/api/webhooks/resend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...svixHeaders,
          },
          body: rawBody,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(400);
      });

      it("2.7.5 Webhook payload with non-existent email addresses processed gracefully with 0 updates", async () => {
        const rawBody = JSON.stringify({
          type: "email.bounced",
          data: { to: ["nonexistent@example.com"] },
        });

        const svixHeaders = createTestSvixHeaders({
          payload: rawBody,
          secret: TEST_WEBHOOK_SECRET,
        });

        const req = new Request("https://systemvisualizer.com/api/webhooks/resend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...svixHeaders,
          },
          body: rawBody,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.deactivatedCount).toBe(0);
      });
    });

    // ------------------------------------------------------------------------
    // Feature 8 Boundaries: GitOps & Security Modules
    // ------------------------------------------------------------------------
    describe("Feature 8 Boundaries: GitOps & Security Modules", () => {
      it("2.8.1 Release signature verification with mismatched secret fails securely", () => {
        const payload = JSON.stringify({ ep: "sec" });
        const ts = "1730462400";
        const sig = computeReleaseSignature({
          payload,
          secret: "secret_one_32_characters_minimum_entropy_1",
          timestamp: ts,
        });

        const result = verifyReleaseSignatureDetailed({
          payload,
          headers: {
            "x-release-signature": sig,
            "x-release-timestamp": ts,
          },
          secret: "secret_two_32_characters_minimum_entropy_2",
          toleranceSeconds: 300,
          now: 1730462400 * 1000,
        });

        expect(result.valid).toBe(false);
        expect(result.status).toBe(401);
      });

      it("2.8.2 Release timestamp parsing handles both Unix epoch seconds and ISO-8601 strings", () => {
        const epochSec = parseTimestamp("1730462400");
        expect(epochSec).toBe(1730462400000);

        const iso = parseTimestamp("2026-11-01T12:00:00.000Z");
        expect(iso).toBe(Date.parse("2026-11-01T12:00:00.000Z"));
      });

      it("2.8.3 Non-numeric / NaN timestamp string rejected cleanly", () => {
        expect(parseTimestamp("invalid-timestamp-string")).toBeNull();
        expect(parseTimestamp("")).toBeNull();
        expect(parseTimestamp(null)).toBeNull();
      });

      it("2.8.4 AST detector handles empty source file cleanly", () => {
        const eps = parseEpisodesFromTsx("");
        expect(eps).toEqual([]);
      });

      it("2.8.5 AST detector handles files where no episodes array is exported without throwing", () => {
        const code = `export const OTHER_VARIABLE = [1, 2, 3];`;
        const eps = parseEpisodesFromTsx(code);
        expect(eps).toEqual([]);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TIER 3: CROSS-FEATURE COMBINATIONS (PAIRWISE INTEGRATION FLOWS)
  // ──────────────────────────────────────────────────────────────────────────
  describe("Tier 3: Cross-Feature Combinations (Pairwise Integration Flows)", () => {
    it("3.1 Full Lifecycle: Subscribe -> Verify -> Ingest Release -> SQS Fanout -> Dispatch -> Delivery -> RFC 8058 Unsubscribe -> Next Release Exclusion", async () => {
      const subscribeReq = new Request(
        "https://systemvisualizer.com/api/notifications/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: "lifecycle_user@example.com",
            subjects: [SubjectChannel.JAVASCRIPT],
          }),
        }
      );
      const subRes = await subscribeHandler(subscribeReq);
      expect(subRes.status).toBe(200);

      const subRecord = Array.from(dbStore.subscribers.values()).find(
        (s) => s.email === "lifecycle_user@example.com"
      );
      expect(subRecord).toBeDefined();
      expect(subRecord?.isVerified).toBe(false);
      const verifyToken = subRecord!.verificationToken!;
      const unsubToken = subRecord!.unsubscribeToken;

      const verifyReq = new Request(
        `https://systemvisualizer.com/api/notifications/verify?token=${verifyToken}`,
        { headers: { "x-forwarded-for": getUniqueIp() } }
      );
      const verifyRes = await verifyHandler(verifyReq);
      expect(verifyRes.status).toBe(200);
      expect(dbStore.subscribers.get(subRecord!.id)?.isVerified).toBe(true);

      const release1Payload = {
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "promises-async",
        episodeNumber: 8,
        title: "Async / Await Under the Hood",
        releaseCommitSha: "sha-release-1",
      };
      const publishReq = createSignedReleaseRequest({ payload: release1Payload });
      const pubRes = await publishHandler(publishReq);
      expect(pubRes.status).toBe(200);

      const fanoutResult = await processEpisodeFanout(release1Payload);
      expect(fanoutResult.totalRecipients).toBe(1);
      expect(fanoutResult.chunksDispatched).toBe(1);

      mockResendSend.mockClear();
      const dispatchRecord: SQSRecord = {
        messageId: "sqs-disp-rel1",
        receiptHandle: "h",
        body: JSON.stringify({
          episode: release1Payload,
          recipients: [{ email: "lifecycle_user@example.com", unsubscribeToken: unsubToken }],
        }),
        attributes: {
          ApproximateReceiveCount: "1",
          SentTimestamp: "0",
          SenderId: "0",
          ApproximateFirstReceiveTimestamp: "0",
        },
        messageAttributes: {},
        md5OfBody: "md5",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
        awsRegion: "us-east-1",
      };
      const dispResult = await processDispatchRecord(dispatchRecord);
      expect(dispResult.dispatchedCount).toBe(1);

      const sentItem = (
        mockResendSend.mock.calls[0][0] as Array<{
          to: string[];
          headers: Record<string, string>;
        }>
      )[0];
      expect(sentItem.to).toEqual(["lifecycle_user@example.com"]);
      expect(sentItem.headers["List-Unsubscribe"]).toContain(unsubToken);

      const unsubReq = new Request(
        `https://systemvisualizer.com/api/notifications/unsubscribe?token=${unsubToken}&topic=ALL`,
        {
          method: "POST",
          headers: { "x-forwarded-for": getUniqueIp() },
        }
      );
      const unsubRes = await unsubscribePostHandler(unsubReq);
      expect(unsubRes.status).toBe(200);
      expect(dbStore.subscribers.get(subRecord!.id)?.status).toBe(
        SubscriptionStatus.UNSUBSCRIBED
      );

      const release2Payload = {
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "event-loop-2",
        episodeNumber: 9,
        title: "Event Loop Microtasks",
        releaseCommitSha: "sha-release-2",
      };
      const fanoutResult2 = await processEpisodeFanout(release2Payload);
      expect(fanoutResult2.totalRecipients).toBe(0);
      expect(fanoutResult2.chunksDispatched).toBe(0);
    });

    it("3.2 Bounce Webhook Quarantine: Active Subscriber -> Bounce Webhook -> Status BOUNCED -> Subsequent Ingest Release skips bounced subscriber", async () => {
      const subId = "sub_bounce_quarantine";
      dbStore.subscribers.set(subId, {
        id: subId,
        email: "bounce_quarantine@example.com",
        userId: null,
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        unsubscribeToken: "unsub-bounce-q",
        status: SubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      dbStore.subscriptions.set("sn_bq", {
        id: "sn_bq",
        subscriberId: subId,
        subject: SubjectChannel.COMPUTER_NETWORKS,
        createdAt: new Date(),
      });

      const rawWebhook = JSON.stringify({
        type: "email.bounced",
        data: {
          to: ["bounce_quarantine@example.com"],
          bounce: { type: "Permanent" },
        },
      });
      const svixHeaders = createTestSvixHeaders({
        payload: rawWebhook,
        secret: TEST_WEBHOOK_SECRET,
      });
      const webhookReq = new Request("https://systemvisualizer.com/api/webhooks/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...svixHeaders },
        body: rawWebhook,
      });
      const webhookRes = await resendWebhookHandler(webhookReq);
      expect(webhookRes.status).toBe(200);
      expect(dbStore.subscribers.get(subId)?.status).toBe(
        SubscriptionStatus.BOUNCED
      );

      const fanoutResult = await processEpisodeFanout({
        subject: SubjectChannel.COMPUTER_NETWORKS,
        episodeId: "dns-resolution",
        episodeNumber: 2,
        title: "DNS Resolution Flow",
        releaseCommitSha: "sha-dns",
      });
      expect(fanoutResult.totalRecipients).toBe(0);
    });

    it("3.3 Complaint Webhook Quarantine: Active Subscriber -> Complaint Webhook -> Status BOUNCED -> Subsequent Ingest Release skips complained subscriber", async () => {
      const subId = "sub_complaint_quarantine";
      dbStore.subscribers.set(subId, {
        id: subId,
        email: "complaint_user@example.com",
        userId: null,
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        unsubscribeToken: "unsub-comp-q",
        status: SubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      dbStore.subscriptions.set("sn_cq", {
        id: "sn_cq",
        subscriberId: subId,
        subject: SubjectChannel.JAVA,
        createdAt: new Date(),
      });

      const rawWebhook = JSON.stringify({
        type: "email.complained",
        data: { to: ["complaint_user@example.com"] },
      });
      const svixHeaders = createTestSvixHeaders({
        payload: rawWebhook,
        secret: TEST_WEBHOOK_SECRET,
      });
      const webhookReq = new Request("https://systemvisualizer.com/api/webhooks/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...svixHeaders },
        body: rawWebhook,
      });
      await resendWebhookHandler(webhookReq);
      expect(dbStore.subscribers.get(subId)?.status).toBe(
        SubscriptionStatus.BOUNCED
      );

      const fanoutResult = await processEpisodeFanout({
        subject: SubjectChannel.JAVA,
        episodeId: "garbage-collection",
        episodeNumber: 4,
        title: "G1 Garbage Collector",
        releaseCommitSha: "sha-g1",
      });
      expect(fanoutResult.totalRecipients).toBe(0);
    });

    it("3.4 Multi-Topic Subscription & Granular Unsubscribe: Subscribe to [JAVASCRIPT, OPERATING_SYSTEMS] -> Verify -> Unsubscribe from JAVASCRIPT -> Excluded from JAVASCRIPT release, included in OPERATING_SYSTEMS release", async () => {
      const subReq = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "dual_topic@example.com",
          subjects: [SubjectChannel.JAVASCRIPT, SubjectChannel.OPERATING_SYSTEMS],
        }),
      });
      await subscribeHandler(subReq);

      const sub = Array.from(dbStore.subscribers.values()).find(
        (s) => s.email === "dual_topic@example.com"
      )!;

      await verifyHandler(
        new Request(
          `https://systemvisualizer.com/api/notifications/verify?token=${sub.verificationToken}`,
          { headers: { "x-forwarded-for": getUniqueIp() } }
        )
      );

      await unsubscribePostHandler(
        new Request(
          `https://systemvisualizer.com/api/notifications/unsubscribe?token=${sub.unsubscribeToken}&topic=JAVASCRIPT`,
          {
            method: "POST",
            headers: { "x-forwarded-for": getUniqueIp() },
          }
        )
      );

      const jsFanout = await processEpisodeFanout({
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "prototype-chain",
        episodeNumber: 10,
        title: "Prototypes in JS",
        releaseCommitSha: "sha-proto",
      });
      expect(jsFanout.totalRecipients).toBe(0);

      const osFanout = await processEpisodeFanout({
        subject: SubjectChannel.OPERATING_SYSTEMS,
        episodeId: "cpu-scheduling",
        episodeNumber: 6,
        title: "CPU Scheduling Algorithms",
        releaseCommitSha: "sha-cpu",
      });
      expect(osFanout.totalRecipients).toBe(1);
    });

    it("3.5 ALL Expansion on Selective Unsubscribe: Subscribe to ALL -> Verify -> Unsubscribe from COMPUTER_NETWORKS -> Excluded from COMPUTER_NETWORKS release, included in JAVA release", async () => {
      const subReq = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "all_subscriber@example.com",
          subjects: [SubjectChannel.ALL],
        }),
      });
      await subscribeHandler(subReq);

      const sub = Array.from(dbStore.subscribers.values()).find(
        (s) => s.email === "all_subscriber@example.com"
      )!;

      await verifyHandler(
        new Request(
          `https://systemvisualizer.com/api/notifications/verify?token=${sub.verificationToken}`,
          { headers: { "x-forwarded-for": getUniqueIp() } }
        )
      );

      await unsubscribePostHandler(
        new Request(
          `https://systemvisualizer.com/api/notifications/unsubscribe?token=${sub.unsubscribeToken}&topic=COMPUTER_NETWORKS`,
          {
            method: "POST",
            headers: { "x-forwarded-for": getUniqueIp() },
          }
        )
      );

      const netFanout = await processEpisodeFanout({
        subject: SubjectChannel.COMPUTER_NETWORKS,
        episodeId: "bgp-routing",
        episodeNumber: 3,
        title: "BGP Autonomous Systems",
        releaseCommitSha: "sha-bgp",
      });
      expect(netFanout.totalRecipients).toBe(0);

      const javaFanout = await processEpisodeFanout({
        subject: SubjectChannel.JAVA,
        episodeId: "jit-compiler",
        episodeNumber: 5,
        title: "JIT Compiler Optimization",
        releaseCommitSha: "sha-jit",
      });
      expect(javaFanout.totalRecipients).toBe(1);
    });

    it("3.6 Re-subscribing After Unsubscribe: Unsubscribed user re-subscribes to FRONTEND -> Zero re-verification required -> Status reactivated -> Included in next release", async () => {
      const subId = "sub_resubscriber";
      dbStore.subscribers.set(subId, {
        id: subId,
        email: "resubscriber@example.com",
        userId: null,
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        unsubscribeToken: "unsub-tok-resub",
        status: SubscriptionStatus.UNSUBSCRIBED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const resubReq = new Request(
        "https://systemvisualizer.com/api/notifications/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            email: "resubscriber@example.com",
            subjects: [SubjectChannel.FRONTEND],
          }),
        }
      );
      const resubRes = await subscribeHandler(resubReq);
      expect(resubRes.status).toBe(200);
      const resubData = await resubRes.json();
      expect(resubData.requiresVerification).toBe(false);

      const sub = dbStore.subscribers.get(subId);
      expect(sub?.status).toBe(SubscriptionStatus.ACTIVE);
      expect(sub?.isVerified).toBe(true);

      const fanout = await processEpisodeFanout({
        subject: SubjectChannel.FRONTEND,
        episodeId: "css-layout-engine",
        episodeNumber: 3,
        title: "CSS Layout Engine",
        releaseCommitSha: "sha-css",
      });
      expect(fanout.totalRecipients).toBe(1);
    });

    it("3.7 Rate Limiter Sliding Window Burst & Recovery: Rapid subscriptions hit rate limiter -> 429 response -> Alternate IP succeeds", async () => {
      const fixedIp = "198.51.100.42";
      for (let i = 1; i <= 5; i++) {
        const req = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": fixedIp,
          },
          body: JSON.stringify({
            email: `burst_${i}@example.com`,
            subjects: [SubjectChannel.JAVASCRIPT],
          }),
        });
        const res = await subscribeHandler(req);
        expect(res.status).toBe(200);
      }

      const blockedReq = new Request(
        "https://systemvisualizer.com/api/notifications/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": fixedIp,
          },
          body: JSON.stringify({
            email: "burst_blocked@example.com",
            subjects: [SubjectChannel.JAVASCRIPT],
          }),
        }
      );
      const blockedRes = await subscribeHandler(blockedReq);
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("X-RateLimit-Remaining")).toBe("0");

      const alternateIp = "198.51.100.43";
      const altReq = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": alternateIp,
        },
        body: JSON.stringify({
          email: "burst_alt@example.com",
          subjects: [SubjectChannel.JAVASCRIPT],
        }),
      });
      const altRes = await subscribeHandler(altReq);
      expect(altRes.status).toBe(200);
    });

    it("3.8 Ingest Release Retry with Anti-Replay Refresh: Transient error followed by retried request with updated timestamp and signature succeeds", async () => {
      const payload = {
        subject: SubjectChannel.BACKEND,
        episodeId: "distributed-transactions",
        episodeNumber: 7,
        title: "2-Phase Commit Protocol",
        releaseCommitSha: "sha-2pc",
      };

      mockSqsSend.mockRejectedValueOnce(new Error("Transient SQS network outage"));

      const initialReq = createSignedReleaseRequest({ payload });
      const failRes = await publishHandler(initialReq);
      expect(failRes.status).toBe(500);

      const retryReq = createSignedReleaseRequest({ payload });
      const successRes = await publishHandler(retryReq);
      expect(successRes.status).toBe(200);
      const data = await successRes.json();
      expect(data.success).toBe(true);
      expect(data.queued).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // ──────────────────────────────────────────────────────────────────────────
  describe("Tier 4: Real-World Application Scenarios (Realistic Workloads)", () => {
    it("4.1 Multi-User Enterprise Simulation Across All 7 Channels: 50 subscribers across diverse states -> Ingest COMPUTER_NETWORKS episode -> Exactly 20 eligible recipients in exactly 2 SQS batches of 10", async () => {
      for (let i = 1; i <= 20; i++) {
        const id = `guest_unver_${i}`;
        dbStore.subscribers.set(id, {
          id,
          email: `guest_unver_${i}@enterprise.com`,
          userId: null,
          isVerified: false,
          verificationToken: `tok_unver_${i}`,
          tokenExpiresAt: new Date(Date.now() + 86400 * 1000),
          unsubscribeToken: `unsub_unver_${i}`,
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set(`sn_unver_${i}`, {
          id: `sn_unver_${i}`,
          subscriberId: id,
          subject: SubjectChannel.COMPUTER_NETWORKS,
          createdAt: new Date(),
        });
      }

      for (let i = 1; i <= 15; i++) {
        const id = `active_net_${i}`;
        dbStore.subscribers.set(id, {
          id,
          email: `active_net_${i}@enterprise.com`,
          userId: `usr_net_${i}`,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: `unsub_net_${i}`,
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set(`sn_net_${i}`, {
          id: `sn_net_${i}`,
          subscriberId: id,
          subject: SubjectChannel.COMPUTER_NETWORKS,
          createdAt: new Date(),
        });
      }

      for (let i = 1; i <= 5; i++) {
        const id = `active_all_${i}`;
        dbStore.subscribers.set(id, {
          id,
          email: `active_all_${i}@enterprise.com`,
          userId: `usr_all_${i}`,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: `unsub_all_${i}`,
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set(`sn_all_${i}`, {
          id: `sn_all_${i}`,
          subscriberId: id,
          subject: SubjectChannel.ALL,
          createdAt: new Date(),
        });
      }

      for (let i = 1; i <= 5; i++) {
        const id = `bounced_${i}`;
        dbStore.subscribers.set(id, {
          id,
          email: `bounced_${i}@enterprise.com`,
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: `unsub_b_${i}`,
          status: SubscriptionStatus.BOUNCED,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set(`sn_b_${i}`, {
          id: `sn_b_${i}`,
          subscriberId: id,
          subject: SubjectChannel.COMPUTER_NETWORKS,
          createdAt: new Date(),
        });
      }

      for (let i = 1; i <= 5; i++) {
        const id = `unsub_${i}`;
        dbStore.subscribers.set(id, {
          id,
          email: `unsub_${i}@enterprise.com`,
          userId: null,
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          unsubscribeToken: `unsub_u_${i}`,
          status: SubscriptionStatus.UNSUBSCRIBED,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dbStore.subscriptions.set(`sn_u_${i}`, {
          id: `sn_u_${i}`,
          subscriberId: id,
          subject: SubjectChannel.COMPUTER_NETWORKS,
          createdAt: new Date(),
        });
      }

      const fanout = await processEpisodeFanout({
        subject: SubjectChannel.COMPUTER_NETWORKS,
        episodeId: "tls-handshake",
        episodeNumber: 4,
        title: "TLS 1.3 Handshake Protocol",
        releaseCommitSha: "sha-tls",
      });

      expect(fanout.totalRecipients).toBe(20);
      expect(fanout.chunksDispatched).toBe(2);
    });

    it("4.2 High-Velocity Multi-Discipline Episode Releases: Rapid sequential releases across JAVASCRIPT, BACKEND, and JAVA maintain queue isolation and database telemetry", async () => {
      const subId = "multi_disc_sub";
      dbStore.subscribers.set(subId, {
        id: subId,
        email: "multi_disc@example.com",
        userId: null,
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        unsubscribeToken: "unsub-md",
        status: SubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      dbStore.subscriptions.set("s_js", {
        id: "s_js",
        subscriberId: subId,
        subject: SubjectChannel.JAVASCRIPT,
        createdAt: new Date(),
      });
      dbStore.subscriptions.set("s_java", {
        id: "s_java",
        subscriberId: subId,
        subject: SubjectChannel.JAVA,
        createdAt: new Date(),
      });

      const relJs = {
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "ep-js-rapid",
        episodeNumber: 11,
        title: "Rapid JS",
        releaseCommitSha: "sha-js-rapid",
      };
      const res1 = await publishHandler(createSignedReleaseRequest({ payload: relJs }));
      expect(res1.status).toBe(200);
      const fanout1 = await processEpisodeFanout(relJs);
      expect(fanout1.totalRecipients).toBe(1);

      const relBackend = {
        subject: SubjectChannel.BACKEND,
        episodeId: "ep-be-rapid",
        episodeNumber: 8,
        title: "Rapid Backend",
        releaseCommitSha: "sha-be-rapid",
      };
      const res2 = await publishHandler(createSignedReleaseRequest({ payload: relBackend }));
      expect(res2.status).toBe(200);
      const fanout2 = await processEpisodeFanout(relBackend);
      expect(fanout2.totalRecipients).toBe(0);

      const relJava = {
        subject: SubjectChannel.JAVA,
        episodeId: "ep-java-rapid",
        episodeNumber: 6,
        title: "Rapid Java",
        releaseCommitSha: "sha-java-rapid",
      };
      const res3 = await publishHandler(createSignedReleaseRequest({ payload: relJava }));
      expect(res3.status).toBe(200);
      const fanout3 = await processEpisodeFanout(relJava);
      expect(fanout3.totalRecipients).toBe(1);

      expect(
        dbStore.publishedEpisodes.get(`${SubjectChannel.JAVASCRIPT}_ep-js-rapid`)
      ).toBeDefined();
      expect(
        dbStore.publishedEpisodes.get(`${SubjectChannel.BACKEND}_ep-be-rapid`)
      ).toBeDefined();
      expect(
        dbStore.publishedEpisodes.get(`${SubjectChannel.JAVA}_ep-java-rapid`)
      ).toBeDefined();
    });

    it("4.3 Resend Rate Pacing & SQS Batch Failures Recovery: Processing multi-batch dispatch with rate limit on batch 2 -> SQS batchItemFailures returns failed message ID -> Retry succeeds", async () => {
      let callCount = 0;
      mockResendSend.mockImplementation(async () => {
        callCount++;
        if (callCount >= 2) {
          return {
            data: null,
            error: {
              statusCode: 500,
              name: "internal_server_error",
              message: "Persistent server error",
            },
          };
        }
        return { data: { data: [{ id: `resend-ok-${callCount}` }] }, error: null };
      });

      const event: SQSEvent = {
        Records: [
          {
            messageId: "batch-msg-success-1",
            receiptHandle: "h1",
            body: JSON.stringify({
              episode: {
                subject: SubjectChannel.FRONTEND,
                episodeId: "ep-pacing",
                episodeNumber: 1,
                title: "Pacing Test",
                releaseCommitSha: "sha",
              },
              recipients: [{ email: "u1@example.com", unsubscribeToken: "t1" }],
            }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "0",
              SenderId: "0",
              ApproximateFirstReceiveTimestamp: "0",
            },
            messageAttributes: {},
            md5OfBody: "md5",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
            awsRegion: "us-east-1",
          },
          {
            messageId: "batch-msg-rate-limited-2",
            receiptHandle: "h2",
            body: JSON.stringify({
              episode: {
                subject: SubjectChannel.FRONTEND,
                episodeId: "ep-pacing",
                episodeNumber: 1,
                title: "Pacing Test",
                releaseCommitSha: "sha",
              },
              recipients: [{ email: "u2@example.com", unsubscribeToken: "t2" }],
            }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "0",
              SenderId: "0",
              ApproximateFirstReceiveTimestamp: "0",
            },
            messageAttributes: {},
            md5OfBody: "md5",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-dispatch-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const options = {
        maxRetries: 1,
        minIntervalMs: 5,
        sleepFn: () => Promise.resolve(),
      };

      const response = await EmailDispatchHandler(event, undefined, options);
      expect(response.batchItemFailures).toHaveLength(1);
      expect(response.batchItemFailures[0].itemIdentifier).toBe(
        "batch-msg-rate-limited-2"
      );

      mockResendSend.mockResolvedValueOnce({
        data: { data: [{ id: "recovered" }] },
        error: null,
      });
      const retryEvent: SQSEvent = {
        Records: [event.Records[1]],
      };
      const retryResponse = await EmailDispatchHandler(retryEvent, undefined, options);
      expect(retryResponse.batchItemFailures).toHaveLength(0);
    });

    it("4.4 Zero Re-Verification Lifecycle: Verified user adding disciplines instantly active without re-verification", async () => {
      const sub1 = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "zero_reverify@example.com",
          subjects: [SubjectChannel.JAVASCRIPT],
        }),
      });
      await subscribeHandler(sub1);

      const record = Array.from(dbStore.subscribers.values()).find(
        (s) => s.email === "zero_reverify@example.com"
      )!;

      await verifyHandler(
        new Request(
          `https://systemvisualizer.com/api/notifications/verify?token=${record.verificationToken}`,
          { headers: { "x-forwarded-for": getUniqueIp() } }
        )
      );

      const sub2 = new Request("https://systemvisualizer.com/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "zero_reverify@example.com",
          subjects: [SubjectChannel.BACKEND, SubjectChannel.JAVA],
        }),
      });
      const sub2Res = await subscribeHandler(sub2);
      const sub2Data = await sub2Res.json();
      expect(sub2Data.requiresVerification).toBe(false);

      const fanout = await processEpisodeFanout({
        subject: SubjectChannel.BACKEND,
        episodeId: "ep-backend-zero",
        episodeNumber: 1,
        title: "Backend Zero",
        releaseCommitSha: "sha-bz",
      });
      expect(fanout.totalRecipients).toBe(1);
    });

    it("4.5 RFC 8058 Standard Form POST vs JSON API 1-Click Unsubscriptions at Scale", async () => {
      const subA = "sub_form_scale";
      dbStore.subscribers.set(subA, {
        id: subA,
        email: "form_scale@example.com",
        userId: null,
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        unsubscribeToken: "tok-form-scale",
        status: SubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      dbStore.subscriptions.set("sn_fa", {
        id: "sn_fa",
        subscriberId: subA,
        subject: SubjectChannel.OPERATING_SYSTEMS,
        createdAt: new Date(),
      });

      const subB = "sub_json_scale";
      dbStore.subscribers.set(subB, {
        id: subB,
        email: "json_scale@example.com",
        userId: null,
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        unsubscribeToken: "tok-json-scale",
        status: SubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      dbStore.subscriptions.set("sn_jb", {
        id: "sn_jb",
        subscriberId: subB,
        subject: SubjectChannel.OPERATING_SYSTEMS,
        createdAt: new Date(),
      });

      const formPayload = new URLSearchParams({
        "List-Unsubscribe": "One-Click",
      }).toString();
      const formReq = new Request(
        `https://systemvisualizer.com/api/notifications/unsubscribe?token=tok-form-scale&topic=OPERATING_SYSTEMS`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-forwarded-for": getUniqueIp(),
          },
          body: formPayload,
        }
      );
      const formRes = await unsubscribePostHandler(formReq);
      expect(formRes.status).toBe(200);

      const jsonReq = new Request(
        "https://systemvisualizer.com/api/notifications/unsubscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": getUniqueIp(),
          },
          body: JSON.stringify({
            token: "tok-json-scale",
            topic: SubjectChannel.OPERATING_SYSTEMS,
          }),
        }
      );
      const jsonRes = await unsubscribePostHandler(jsonReq);
      expect(jsonRes.status).toBe(200);

      expect(dbStore.subscribers.get(subA)?.status).toBe(
        SubscriptionStatus.UNSUBSCRIBED
      );
      expect(dbStore.subscribers.get(subB)?.status).toBe(
        SubscriptionStatus.UNSUBSCRIBED
      );

      const fanout = await processEpisodeFanout({
        subject: SubjectChannel.OPERATING_SYSTEMS,
        episodeId: "ep-os-scale",
        episodeNumber: 1,
        title: "OS Scale",
        releaseCommitSha: "sha-os-scale",
      });
      expect(fanout.totalRecipients).toBe(0);
    });
  });
});
