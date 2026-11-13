import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SubjectChannel, SubscriptionStatus } from "@prisma/client";

// ─── Stateful In-Memory Relational Engine & Mocks ───────────────────────────

interface MockUser {
  id: string;
  email: string | null;
  name: string | null;
}

interface MockSubscriber {
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

interface MockSubscription {
  id: string;
  subscriberId: string;
  subject: SubjectChannel;
  createdAt: Date;
}

interface MockPublishedEpisode {
  id: string;
  subject: SubjectChannel;
  episodeId: string;
  episodeNumber: number;
  title: string;
  releaseCommitSha: string;
  totalRecipients: number;
  publishedAt: Date;
  dispatchedAt: Date | null;
}

const { mockAuth, mockEnv, memoryStore, mockPrisma, mockResendSend, TEST_WEBHOOK_SECRET } = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockResendSend = vi.fn().mockResolvedValue({ data: { id: "mock_resend_email_id" }, error: null });

  const TEST_WEBHOOK_SECRET =
    "whsec_" + Buffer.from("mock_resend_webhook_secret_key!").toString("base64");

  const mockEnv = {
    DATABASE_URL: "postgresql://mock:5432/test_db",
    NEXT_PUBLIC_APP_URL: "https://systemsimulator.io",
    NODE_ENV: "test" as const,
    RESEND_API_KEY: "re_mock_api_key_test_12345",
    RESEND_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
    RESEND_FROM_EMAIL: "notifications@systemsimulator.io",
  };

  const memoryStore = {
    users: new Map<string, MockUser>(),
    subscribers: new Map<string, MockSubscriber>(),
    subscriptions: new Map<string, MockSubscription>(),
    publishedEpisodes: new Map<string, MockPublishedEpisode>(),
    reset() {
      this.users.clear();
      this.subscribers.clear();
      this.subscriptions.clear();
      this.publishedEpisodes.clear();
    },
  };

  let idCounter = 1;
  const generateId = (prefix: string) => `${prefix}_${idCounter++}_${Date.now()}`;

  const mockPrisma = {
    user: {
      delete: vi.fn(async (params: { where: { id: string } }) => {
        const user = memoryStore.users.get(params.where.id);
        if (!user) throw new Error("Record to delete does not exist.");
        memoryStore.users.delete(params.where.id);

        // Cascade delete: User -> Subscriber -> Subscriptions
        for (const [subId, sub] of memoryStore.subscribers.entries()) {
          if (sub.userId === params.where.id) {
            // Delete all associated subscriptions
            for (const [sId, s] of memoryStore.subscriptions.entries()) {
              if (s.subscriberId === subId) {
                memoryStore.subscriptions.delete(sId);
              }
            }
            memoryStore.subscribers.delete(subId);
          }
        }
        return user;
      }),
    },
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
          let found: MockSubscriber | undefined;
          if (params.where.id) {
            found = memoryStore.subscribers.get(params.where.id);
          } else if (params.where.email) {
            const email = params.where.email.toLowerCase().trim();
            found = Array.from(memoryStore.subscribers.values()).find(
              (s) => s.email.toLowerCase().trim() === email
            );
          } else if (params.where.verificationToken) {
            found = Array.from(memoryStore.subscribers.values()).find(
              (s) => s.verificationToken === params.where.verificationToken
            );
          } else if (params.where.unsubscribeToken) {
            found = Array.from(memoryStore.subscribers.values()).find(
              (s) => s.unsubscribeToken === params.where.unsubscribeToken
            );
          }

          if (!found) return null;

          if (params.include?.subscriptions) {
            const subs = Array.from(memoryStore.subscriptions.values()).filter(
              (s) => s.subscriberId === found!.id
            );
            return { ...found, subscriptions: subs };
          }

          return { ...found };
        }
      ),
      create: vi.fn(async (params: { data: Partial<MockSubscriber> & { email: string } }) => {
        const email = params.data.email.toLowerCase().trim();
        // Unique constraint checks
        for (const s of memoryStore.subscribers.values()) {
          if (s.email === email) {
            throw new Error("Unique constraint failed on email");
          }
          if (params.data.userId && s.userId === params.data.userId) {
            throw new Error("Unique constraint failed on userId");
          }
          if (params.data.unsubscribeToken && s.unsubscribeToken === params.data.unsubscribeToken) {
            throw new Error("Unique constraint failed on unsubscribeToken");
          }
          if (params.data.verificationToken && s.verificationToken === params.data.verificationToken) {
            throw new Error("Unique constraint failed on verificationToken");
          }
        }

        const id = params.data.id || generateId("sub");
        const subscriber: MockSubscriber = {
          id,
          email,
          userId: params.data.userId ?? null,
          isVerified: params.data.isVerified ?? false,
          verificationToken: params.data.verificationToken ?? null,
          tokenExpiresAt: params.data.tokenExpiresAt ?? null,
          unsubscribeToken: params.data.unsubscribeToken ?? generateId("unsub_tok"),
          status: params.data.status ?? SubscriptionStatus.ACTIVE,
          createdAt: params.data.createdAt ?? new Date(),
          updatedAt: new Date(),
        };
        memoryStore.subscribers.set(id, subscriber);
        return { ...subscriber };
      }),
      upsert: vi.fn(
        async (params: {
          where: { email: string };
          update: Partial<MockSubscriber>;
          create: Partial<MockSubscriber> & { email: string };
        }) => {
          const email = params.where.email.toLowerCase().trim();
          const existing = Array.from(memoryStore.subscribers.values()).find(
            (s) => s.email.toLowerCase().trim() === email
          );

          if (existing) {
            const updated: MockSubscriber = {
              ...existing,
              ...params.update,
              updatedAt: new Date(),
            };
            memoryStore.subscribers.set(existing.id, updated);
            return { ...updated };
          } else {
            const id = generateId("sub");
            const created: MockSubscriber = {
              id,
              email,
              userId: params.create.userId ?? null,
              isVerified: params.create.isVerified ?? false,
              verificationToken: params.create.verificationToken ?? null,
              tokenExpiresAt: params.create.tokenExpiresAt ?? null,
              unsubscribeToken: params.create.unsubscribeToken ?? generateId("unsub_tok"),
              status: params.create.status ?? SubscriptionStatus.ACTIVE,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            memoryStore.subscribers.set(id, created);
            return { ...created };
          }
        }
      ),
      update: vi.fn(async (params: { where: { id: string }; data: Partial<MockSubscriber> }) => {
        const existing = memoryStore.subscribers.get(params.where.id);
        if (!existing) throw new Error("Subscriber not found.");
        const updated: MockSubscriber = {
          ...existing,
          ...params.data,
          updatedAt: new Date(),
        };
        memoryStore.subscribers.set(params.where.id, updated);
        return { ...updated };
      }),
      updateMany: vi.fn(
        async (params: {
          where: { email?: { in?: string[] } };
          data: Partial<MockSubscriber>;
        }) => {
          let count = 0;
          const emails = params.where.email?.in?.map((e) => e.toLowerCase().trim()) ?? [];
          for (const [id, sub] of memoryStore.subscribers.entries()) {
            if (emails.includes(sub.email.toLowerCase().trim())) {
              memoryStore.subscribers.set(id, {
                ...sub,
                ...params.data,
                updatedAt: new Date(),
              });
              count++;
            }
          }
          return { count };
        }
      ),
      delete: vi.fn(async (params: { where: { id: string } }) => {
        const sub = memoryStore.subscribers.get(params.where.id);
        if (!sub) throw new Error("Subscriber not found.");
        memoryStore.subscribers.delete(params.where.id);
        // Cascade delete subscriptions
        for (const [sId, s] of memoryStore.subscriptions.entries()) {
          if (s.subscriberId === params.where.id) {
            memoryStore.subscriptions.delete(sId);
          }
        }
        return sub;
      }),
    },
    subscription: {
      findMany: vi.fn(
        async (params: {
          where: { subscriberId?: string; subject?: SubjectChannel };
          select?: { subject?: boolean };
        }) => {
          let list = Array.from(memoryStore.subscriptions.values());
          if (params.where.subscriberId) {
            list = list.filter((s) => s.subscriberId === params.where.subscriberId);
          }
          if (params.where.subject) {
            list = list.filter((s) => s.subject === params.where.subject);
          }
          if (params.select?.subject) {
            return list.map((s) => ({ subject: s.subject }));
          }
          return list.map((s) => ({ ...s }));
        }
      ),
      create: vi.fn(async (params: { data: { subscriberId: string; subject: SubjectChannel } }) => {
        // Enforce composite unique
        for (const s of memoryStore.subscriptions.values()) {
          if (s.subscriberId === params.data.subscriberId && s.subject === params.data.subject) {
            throw new Error("Unique constraint failed on subscriberId_subject");
          }
        }
        const id = generateId("subsc");
        const subsc: MockSubscription = {
          id,
          subscriberId: params.data.subscriberId,
          subject: params.data.subject,
          createdAt: new Date(),
        };
        memoryStore.subscriptions.set(id, subsc);
        return { ...subsc };
      }),
      createMany: vi.fn(
        async (params: {
          data: Array<{ subscriberId: string; subject: SubjectChannel }>;
          skipDuplicates?: boolean;
        }) => {
          let count = 0;
          for (const item of params.data) {
            const exists = Array.from(memoryStore.subscriptions.values()).some(
              (s) => s.subscriberId === item.subscriberId && s.subject === item.subject
            );
            if (exists) {
              if (params.skipDuplicates) continue;
              throw new Error("Unique constraint failed on subscriberId_subject");
            }
            const id = generateId("subsc");
            memoryStore.subscriptions.set(id, {
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
          update: Partial<MockSubscription>;
          create: {
            subscriberId: string;
            subject: SubjectChannel;
          };
        }) => {
          const { subscriberId, subject } = params.where.subscriberId_subject;
          const existing = Array.from(memoryStore.subscriptions.values()).find(
            (s) => s.subscriberId === subscriberId && s.subject === subject
          );

          if (existing) {
            return { ...existing };
          } else {
            const id = generateId("subsc");
            const created: MockSubscription = {
              id,
              subscriberId,
              subject,
              createdAt: new Date(),
            };
            memoryStore.subscriptions.set(id, created);
            return { ...created };
          }
        }
      ),
      deleteMany: vi.fn(
        async (params: {
          where: {
            subscriberId?: string;
            subject?: SubjectChannel | { not: SubjectChannel };
          };
        }) => {
          let count = 0;
          for (const [id, s] of memoryStore.subscriptions.entries()) {
            let match = true;
            if (params.where.subscriberId && s.subscriberId !== params.where.subscriberId) {
              match = false;
            }
            if (params.where.subject !== undefined) {
              if (
                typeof params.where.subject === "object" &&
                "not" in params.where.subject
              ) {
                if (s.subject === params.where.subject.not) match = false;
              } else if (s.subject !== params.where.subject) {
                match = false;
              }
            }

            if (match) {
              memoryStore.subscriptions.delete(id);
              count++;
            }
          }
          return { count };
        }
      ),
    },
    publishedEpisode: {
      create: vi.fn(async (params: { data: Omit<MockPublishedEpisode, "id" | "publishedAt"> }) => {
        // Enforce unique (subject, episodeId)
        for (const ep of memoryStore.publishedEpisodes.values()) {
          if (ep.subject === params.data.subject && ep.episodeId === params.data.episodeId) {
            throw new Error("Unique constraint failed on subject_episodeId");
          }
        }
        const id = generateId("pub_ep");
        const ep: MockPublishedEpisode = {
          ...params.data,
          id,
          publishedAt: new Date(),
        };
        memoryStore.publishedEpisodes.set(id, ep);
        return { ...ep };
      }),
      findUnique: vi.fn(
        async (params: {
          where: {
            subject_episodeId?: {
              subject: SubjectChannel;
              episodeId: string;
            };
          };
        }) => {
          if (params.where.subject_episodeId) {
            const { subject, episodeId } = params.where.subject_episodeId;
            return (
              Array.from(memoryStore.publishedEpisodes.values()).find(
                (ep) => ep.subject === subject && ep.episodeId === episodeId
              ) ?? null
            );
          }
          return null;
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

  return { mockAuth, mockEnv, memoryStore, mockPrisma, mockResendSend, TEST_WEBHOOK_SECRET };
});

export { mockAuth, mockEnv, memoryStore, mockPrisma, mockResendSend };

vi.mock("@/lib/resend", () => ({
  getResendClient: vi.fn(() => ({
    emails: {
      send: mockResendSend,
    },
    batch: {
      send: vi.fn().mockResolvedValue({ data: [{ id: "mock_batch_id" }], error: null }),
    },
  })),
  resetDefaultResendClient: vi.fn(),
}));

vi.mock("@/workers/dispatch", () => ({
  getResendClient: vi.fn(() => ({
    emails: {
      send: mockResendSend,
    },
    batch: {
      send: vi.fn().mockResolvedValue({ data: [{ id: "mock_batch_id" }], error: null }),
    },
  })),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}));

import { POST as subscribeHandler } from "@/app/api/notifications/subscribe/route";
import { GET as verifyHandler } from "@/app/api/notifications/verify/route";
import {
  GET as unsubscribeGetHandler,
  POST as unsubscribePostHandler,
} from "@/app/api/notifications/unsubscribe/route";
import { POST as resendWebhookHandler } from "@/app/api/webhooks/resend/route";
import {
  verifySvixSignature,
  verifySvixSignatureDetailed,
} from "@/lib/security/svix";
import {
  EpisodeReleaseEmail,
  getSubjectPalette,
} from "@/emails/EpisodeReleaseEmail";
import { DoubleOptInEmail } from "@/emails/DoubleOptInEmail";

// Dedicated counter for IP rate-limiting partition
let ipNonce = 3000;
function freshIp(): string {
  ipNonce++;
  const octet3 = Math.floor(ipNonce / 250);
  const octet4 = (ipNonce % 250) + 1;
  return `10.200.${octet3}.${octet4}`;
}

function createSvixHeaderBundle({
  payload,
  secret,
  id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  timestamp = Math.floor(Date.now() / 1000).toString(),
}: {
  payload: string;
  secret: string;
  id?: string;
  timestamp?: string;
}) {
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

describe("Challenger M8-1: Tier 5 White-Box Adversarial Hardening Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoryStore.reset();
    mockAuth.mockResolvedValue(null);
    mockEnv.DATABASE_URL = "postgresql://mock:5432/test_db";
    mockEnv.NEXT_PUBLIC_APP_URL = "https://systemsimulator.io";
    mockEnv.RESEND_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 1: Relational Schema, Unique Constraints & Cascade Invariants
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Suite 1: Relational Schema & Cascade Invariants (prisma/schema.prisma)", () => {
    it("1.1 enforces two-level cascade: deleting User deletes Subscriber and associated Subscriptions", async () => {
      // Setup: User -> Subscriber -> Subscriptions
      const user: MockUser = { id: "usr_alice", email: "alice@example.com", name: "Alice" };
      memoryStore.users.set(user.id, user);

      const sub = await mockPrisma.subscriber.create({
        data: {
          email: "alice@example.com",
          userId: user.id,
          isVerified: true,
        },
      });

      await mockPrisma.subscription.create({
        data: { subscriberId: sub.id, subject: SubjectChannel.BACKEND },
      });
      await mockPrisma.subscription.create({
        data: { subscriberId: sub.id, subject: SubjectChannel.JAVASCRIPT },
      });

      expect(memoryStore.users.size).toBe(1);
      expect(memoryStore.subscribers.size).toBe(1);
      expect(memoryStore.subscriptions.size).toBe(2);

      // Act: Delete User
      await mockPrisma.user.delete({ where: { id: user.id } });

      // Assert: Both subscriber and their subscriptions cascaded away
      expect(memoryStore.users.has(user.id)).toBe(false);
      expect(memoryStore.subscribers.has(sub.id)).toBe(false);
      expect(memoryStore.subscriptions.size).toBe(0);
    });

    it("1.2 preserves PublishedEpisodes when Subscribers or Users are deleted", async () => {
      const sub = await mockPrisma.subscriber.create({
        data: { email: "student@example.com", isVerified: true },
      });
      await mockPrisma.subscription.create({
        data: { subscriberId: sub.id, subject: SubjectChannel.OPERATING_SYSTEMS },
      });

      const ep = await mockPrisma.publishedEpisode.create({
        data: {
          subject: SubjectChannel.OPERATING_SYSTEMS,
          episodeId: "process-lifecycle",
          episodeNumber: 1,
          title: "Process Lifecycle",
          releaseCommitSha: "abcdef123456",
          totalRecipients: 10,
          dispatchedAt: new Date(),
        },
      });

      expect(memoryStore.publishedEpisodes.size).toBe(1);

      // Act: Delete Subscriber
      await mockPrisma.subscriber.delete({ where: { id: sub.id } });

      // Assert: Subscriber and Subscription are deleted, but PublishedEpisode remains intact
      expect(memoryStore.subscribers.has(sub.id)).toBe(false);
      expect(memoryStore.subscriptions.size).toBe(0);
      expect(memoryStore.publishedEpisodes.has(ep.id)).toBe(true);
    });

    it("1.3 permits multiple guest subscribers with userId: null, but rejects duplicate non-null userId", async () => {
      // Two guest subscribers with userId = null should both succeed
      const guest1 = await mockPrisma.subscriber.create({
        data: { email: "guest1@example.com", userId: null },
      });
      const guest2 = await mockPrisma.subscriber.create({
        data: { email: "guest2@example.com", userId: null },
      });

      expect(guest1.id).toBeDefined();
      expect(guest2.id).toBeDefined();
      expect(memoryStore.subscribers.size).toBe(2);

      // Now create an authenticated user
      const user: MockUser = { id: "usr_shared", email: "auth@example.com", name: "Auth" };
      memoryStore.users.set(user.id, user);

      await mockPrisma.subscriber.create({
        data: { email: "auth@example.com", userId: user.id },
      });

      // Attempting to assign the SAME non-null userId to another subscriber must throw
      await expect(
        mockPrisma.subscriber.create({
          data: { email: "duplicate-user@example.com", userId: user.id },
        })
      ).rejects.toThrow("Unique constraint failed on userId");
    });

    it("1.4 rejects duplicate subscriptions for the same subscriber and subject channel", async () => {
      const sub = await mockPrisma.subscriber.create({
        data: { email: "dev@example.com", isVerified: true },
      });

      await mockPrisma.subscription.create({
        data: { subscriberId: sub.id, subject: SubjectChannel.JAVA },
      });

      // Second identical subscription must violate composite key
      await expect(
        mockPrisma.subscription.create({
          data: { subscriberId: sub.id, subject: SubjectChannel.JAVA },
        })
      ).rejects.toThrow("Unique constraint failed on subscriberId_subject");
    });

    it("1.5 rejects duplicate PublishedEpisodes for the same subject and episodeId", async () => {
      await mockPrisma.publishedEpisode.create({
        data: {
          subject: SubjectChannel.COMPUTER_NETWORKS,
          episodeId: "tcp-handshake",
          episodeNumber: 1,
          title: "TCP 3-Way Handshake",
          releaseCommitSha: "sha111",
          totalRecipients: 0,
          dispatchedAt: null,
        },
      });

      // Duplicate publish for the same subject & episodeId must fail
      await expect(
        mockPrisma.publishedEpisode.create({
          data: {
            subject: SubjectChannel.COMPUTER_NETWORKS,
            episodeId: "tcp-handshake",
            episodeNumber: 1,
            title: "TCP Handshake Revision",
            releaseCommitSha: "sha222",
            totalRecipients: 0,
            dispatchedAt: null,
          },
        })
      ).rejects.toThrow("Unique constraint failed on subject_episodeId");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 2: Subscription Route & Rate Limiting Hardening
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Suite 2: Subscription API & Rate Limiting Hardening", () => {
    it("2.1 accepts 254-char valid email at max RFC limit, but rejects 256-char email", async () => {
      // 64 chars local part + '@' + 185 chars domain + '.com' = 254 chars
      const localPart = "a".repeat(64);
      const domainLabel = "b".repeat(185);
      const validMaxEmail = `${localPart}@${domainLabel}.com`;
      expect(validMaxEmail.length).toBe(254);

      const validReq = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": freshIp(),
        },
        body: JSON.stringify({
          email: validMaxEmail,
          subjects: [SubjectChannel.FRONTEND],
        }),
      });

      const validRes = await subscribeHandler(validReq);
      expect(validRes.status).toBe(200);

      // Now create a 256-char email (over the 255 Zod max)
      const oversizedEmail = `${localPart}@${"b".repeat(187)}.com`;
      expect(oversizedEmail.length).toBe(256);

      const invalidReq = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": freshIp(),
        },
        body: JSON.stringify({
          email: oversizedEmail,
          subjects: [SubjectChannel.FRONTEND],
        }),
      });

      const invalidRes = await subscribeHandler(invalidReq);
      expect(invalidRes.status).toBe(400);
      const data = await invalidRes.json();
      expect(data.error).toBe("Email address is too long.");
    });

    it("2.2 trims leading/trailing whitespace and normalizes email casing to prevent duplicates", async () => {
      const untrimmedMixedEmail = "  Alice.Developer@Example.COM  ";

      const req1 = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": freshIp(),
        },
        body: JSON.stringify({
          email: untrimmedMixedEmail,
          subjects: [SubjectChannel.JAVA],
        }),
      });

      const res1 = await subscribeHandler(req1);
      expect(res1.status).toBe(200);

      const storedSubscriber = Array.from(memoryStore.subscribers.values())[0];
      expect(storedSubscriber.email).toBe("alice.developer@example.com");

      // Re-subscribing with lowercase trimmed email should match the existing row
      const req2 = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": freshIp(),
        },
        body: JSON.stringify({
          email: "alice.developer@example.com",
          subjects: [SubjectChannel.BACKEND],
        }),
      });

      const res2 = await subscribeHandler(req2);
      expect(res2.status).toBe(200);
      // No duplicate subscriber created
      expect(memoryStore.subscribers.size).toBe(1);
    });

    it("2.3 safely preserves RFC 5322 plus-addressed emails (e.g. user+tag@domain.com)", async () => {
      const taggedEmail = "tester+release-alerts@systemsimulator.io";

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": freshIp(),
        },
        body: JSON.stringify({
          email: taggedEmail,
          subjects: [SubjectChannel.OPERATING_SYSTEMS],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);

      const sub = Array.from(memoryStore.subscribers.values())[0];
      expect(sub.email).toBe(taggedEmail);
    });

    it("2.4 rejects malformed email syntaxes with HTTP 400", async () => {
      const malformedEmails = [
        "not-an-email",
        "missing-at-sign.com",
        "missing-tld@domain",
        "@domain.com",
        "spaces in local@domain.com",
      ];

      for (const badEmail of malformedEmails) {
        const req = new Request("http://localhost/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": freshIp(),
          },
          body: JSON.stringify({
            email: badEmail,
            subjects: [SubjectChannel.JAVASCRIPT],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(400);
      }
    });

    it("2.5 deduplicates heavily redundant topic selections in request payload", async () => {
      // 30 duplicates of JAVASCRIPT
      const repeatedSubjects = Array(30).fill(SubjectChannel.JAVASCRIPT);

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": freshIp(),
        },
        body: JSON.stringify({
          email: "dedup@example.com",
          subjects: repeatedSubjects,
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);

      // Must have exactly 1 subscription created
      const subs = Array.from(memoryStore.subscriptions.values());
      expect(subs.length).toBe(1);
      expect(subs[0].subject).toBe(SubjectChannel.JAVASCRIPT);
    });

    it("2.6 prunes granular topics when 'ALL' is submitted in the same subscription payload", async () => {
      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": freshIp(),
        },
        body: JSON.stringify({
          email: "all-inclusive@example.com",
          subjects: [
            SubjectChannel.FRONTEND,
            SubjectChannel.ALL,
            SubjectChannel.BACKEND,
          ],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);

      const subs = Array.from(memoryStore.subscriptions.values());
      expect(subs.length).toBe(1);
      expect(subs[0].subject).toBe(SubjectChannel.ALL);
    });

    it("2.7 validates Content-Type variations: permits application/json with charset, rejects urlencoded with 415", async () => {
      // Case 1: application/json; charset=utf-8 -> 200
      const okReq = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "x-forwarded-for": freshIp(),
        },
        body: JSON.stringify({
          email: "charset@example.com",
          subjects: [SubjectChannel.COMPUTER_NETWORKS],
        }),
      });
      const okRes = await subscribeHandler(okReq);
      expect(okRes.status).toBe(200);

      // Case 2: application/x-www-form-urlencoded -> 415 Unsupported Media Type
      const badReq = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-forwarded-for": freshIp(),
        },
        body: "email=bad@example.com&subjects=JAVA",
      });
      const badRes = await subscribeHandler(badReq);
      expect(badRes.status).toBe(415);
      const badData = await badRes.json();
      expect(badData.error).toBe("Content-Type must be application/json.");
    });

    it("2.8 rejects corrupted and non-JSON request bodies with HTTP 400", async () => {
      const corruptReq = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": freshIp(),
        },
        body: '{"email": "broken-json',
      });

      const res = await subscribeHandler(corruptReq);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON body.");
    });

    it("2.9 protects against account collision when an authenticated user attempts to steal another user's email", async () => {
      // Bob owns this email
      const bob: MockUser = { id: "usr_bob", email: "bob@example.com", name: "Bob" };
      memoryStore.users.set(bob.id, bob);
      await mockPrisma.subscriber.create({
        data: {
          email: "bob@example.com",
          userId: bob.id,
          isVerified: true,
        },
      });

      // Alice is authenticated as 'usr_alice'
      mockAuth.mockResolvedValue({
        user: { id: "usr_alice", email: "alice@example.com" },
      });

      // Alice tries to subscribe using Bob's email
      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": freshIp(),
        },
        body: JSON.stringify({
          email: "bob@example.com",
          subjects: [SubjectChannel.JAVASCRIPT],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe("Email is already associated with another account.");
    });

    it("2.10 throttles abusive IP addresses exceeding sliding window (5 req/min) with HTTP 429", async () => {
      const spamIp = "192.0.2.77";

      for (let i = 1; i <= 5; i++) {
        const req = new Request("http://localhost/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": spamIp,
          },
          body: JSON.stringify({
            email: `burst_${i}@example.com`,
            subjects: [SubjectChannel.JAVA],
          }),
        });

        const res = await subscribeHandler(req);
        expect(res.status).toBe(200);
      }

      // 6th request from the same IP within the 60s window must fail with 429
      const throttledReq = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": spamIp,
        },
        body: JSON.stringify({
          email: "burst_6@example.com",
          subjects: [SubjectChannel.JAVA],
        }),
      });

      const throttledRes = await subscribeHandler(throttledReq);
      expect(throttledRes.status).toBe(429);
      expect(throttledRes.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(throttledRes.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 3: Double Opt-In Verification & Expiry Precision
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Suite 3: Double Opt-In Verification & Expiry Precision (src/app/api/notifications/verify/route.ts)", () => {
    it("3.1 invalidates verification token on first use to prevent replay attacks", async () => {
      const token = "secure_verify_token_hex_32_bytes_12345";
      const sub = await mockPrisma.subscriber.create({
        data: {
          email: "guest@example.com",
          isVerified: false,
          verificationToken: token,
          tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const req1 = new Request(`http://localhost/api/notifications/verify?token=${token}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-forwarded-for": freshIp(),
        },
      });

      const res1 = await verifyHandler(req1);
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.success).toBe(true);

      // Verify DB state: token cleared, isVerified true
      const updatedSub = memoryStore.subscribers.get(sub.id);
      expect(updatedSub?.isVerified).toBe(true);
      expect(updatedSub?.verificationToken).toBeNull();
      expect(updatedSub?.tokenExpiresAt).toBeNull();

      // Immediate second call with identical token must fail (single-use)
      const req2 = new Request(`http://localhost/api/notifications/verify?token=${token}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-forwarded-for": freshIp(),
        },
      });

      const res2 = await verifyHandler(req2);
      expect(res2.status).toBe(400);
      const data2 = await res2.json();
      expect(data2.error).toBe("Invalid verification token.");
    });

    it("3.2 strictly returns HTTP 410 when token expired 1 millisecond ago, but succeeds if valid by 1 second", async () => {
      const now = Date.now();

      // Expired token: expired 1 ms ago
      await mockPrisma.subscriber.create({
        data: {
          email: "expired@example.com",
          verificationToken: "token_expired_1ms",
          tokenExpiresAt: new Date(now - 1),
        },
      });

      const expiredReq = new Request(
        "http://localhost/api/notifications/verify?token=token_expired_1ms",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "x-forwarded-for": freshIp(),
          },
        }
      );

      const expiredRes = await verifyHandler(expiredReq);
      expect(expiredRes.status).toBe(410);
      const expiredData = await expiredRes.json();
      expect(expiredData.error).toContain("expired");

      // Valid token: expires in 5 seconds
      await mockPrisma.subscriber.create({
        data: {
          email: "fresh@example.com",
          verificationToken: "token_fresh_5s",
          tokenExpiresAt: new Date(now + 5000),
        },
      });

      const freshReq = new Request(
        "http://localhost/api/notifications/verify?token=token_fresh_5s",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "x-forwarded-for": freshIp(),
          },
        }
      );

      const freshRes = await verifyHandler(freshReq);
      expect(freshRes.status).toBe(200);
    });

    it("3.3 rejects empty, whitespace, and missing token query parameters with HTTP 400", async () => {
      const badUrls = [
        "http://localhost/api/notifications/verify",
        "http://localhost/api/notifications/verify?token=",
        "http://localhost/api/notifications/verify?token=%20%20%20",
      ];

      for (const url of badUrls) {
        const req = new Request(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "x-forwarded-for": freshIp(),
          },
        });

        const res = await verifyHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("Verification token is required.");
      }
    });

    it("3.4 supports dual-mode content negotiation: redirects browser navigation, returns JSON for API clients", async () => {
      const token = "dual_mode_token_abc123";
      await mockPrisma.subscriber.create({
        data: {
          email: "browser-user@example.com",
          verificationToken: token,
          tokenExpiresAt: new Date(Date.now() + 60000),
        },
      });

      // Browser request: Accept contains text/html
      const browserReq = new Request(`http://localhost/api/notifications/verify?token=${token}`, {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "x-forwarded-for": freshIp(),
        },
      });

      const browserRes = await verifyHandler(browserReq);
      // NextResponse.redirect produces 307 or 302
      expect([302, 307]).toContain(browserRes.status);
      expect(browserRes.headers.get("location")).toContain("/verify?status=success");

      // Reset subscriber for API test
      const apiToken = "api_mode_token_xyz987";
      await mockPrisma.subscriber.create({
        data: {
          email: "api-user@example.com",
          verificationToken: apiToken,
          tokenExpiresAt: new Date(Date.now() + 60000),
        },
      });

      // API request: Accept contains application/json
      const apiReq = new Request(`http://localhost/api/notifications/verify?token=${apiToken}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-forwarded-for": freshIp(),
        },
      });

      const apiRes = await verifyHandler(apiReq);
      expect(apiRes.status).toBe(200);
      const apiData = await apiRes.json();
      expect(apiData.success).toBe(true);
      expect(apiData.message).toBe("Email verified successfully.");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 4: RFC 8058 Unsubscribe Engine & ALL Channel Partitioning
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Suite 4: RFC 8058 Unsubscribe Engine & Dynamic Partitioning", () => {
    it("4.1 strictly prohibits state mutations on GET and issues safe 307/302 browser landing page redirect", async () => {
      const sub = await mockPrisma.subscriber.create({
        data: {
          email: "get-safe@example.com",
          unsubscribeToken: "unsub_token_safe_get",
          status: SubscriptionStatus.ACTIVE,
        },
      });
      await mockPrisma.subscription.create({
        data: { subscriberId: sub.id, subject: SubjectChannel.BACKEND },
      });

      const getReq = new Request(
        "http://localhost/api/notifications/unsubscribe?token=unsub_token_safe_get&topic=BACKEND",
        {
          method: "GET",
          headers: { "x-forwarded-for": freshIp() },
        }
      );

      const getRes = await unsubscribeGetHandler(getReq);
      expect([302, 307]).toContain(getRes.status);
      expect(getRes.headers.get("location")).toContain("/unsubscribe?token=unsub_token_safe_get");

      // Verify that no subscription state was mutated on GET
      const unchangedSub = memoryStore.subscribers.get(sub.id);
      expect(unchangedSub?.status).toBe(SubscriptionStatus.ACTIVE);
      expect(memoryStore.subscriptions.size).toBe(1);
    });

    it("4.2 expands 'ALL' into remaining 5 canonical disciplines when unsubscribing a granular topic", async () => {
      const sub = await mockPrisma.subscriber.create({
        data: {
          email: "dynamic-all@example.com",
          unsubscribeToken: "unsub_all_expansion",
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // Subscriber has 'ALL'
      await mockPrisma.subscription.create({
        data: { subscriberId: sub.id, subject: SubjectChannel.ALL },
      });

      // Unsubscribe from COMPUTER_NETWORKS
      const postReq = new Request(
        "http://localhost/api/notifications/unsubscribe?token=unsub_all_expansion&topic=COMPUTER_NETWORKS",
        {
          method: "POST",
          headers: { "x-forwarded-for": freshIp() },
        }
      );

      const postRes = await unsubscribePostHandler(postReq);
      expect(postRes.status).toBe(200);
      const data = await postRes.json();
      expect(data.success).toBe(true);

      // Verify database state: ALL removed, and remaining 5 canonical disciplines exist
      const remainingSubs = Array.from(memoryStore.subscriptions.values()).filter(
        (s) => s.subscriberId === sub.id
      );

      expect(remainingSubs.length).toBe(5);
      const remainingChannels = remainingSubs.map((s) => s.subject);
      expect(remainingChannels).not.toContain(SubjectChannel.COMPUTER_NETWORKS);
      expect(remainingChannels).not.toContain(SubjectChannel.ALL);
      expect(remainingChannels).toContain(SubjectChannel.JAVASCRIPT);
      expect(remainingChannels).toContain(SubjectChannel.OPERATING_SYSTEMS);
      expect(remainingChannels).toContain(SubjectChannel.JAVA);
      expect(remainingChannels).toContain(SubjectChannel.BACKEND);
      expect(remainingChannels).toContain(SubjectChannel.FRONTEND);

      // Subscriber remains ACTIVE because 5 channels remain
      expect(memoryStore.subscribers.get(sub.id)?.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it("4.3 accepts unsubscribe parameters across query string, JSON payload, and Form URL-encoded body", async () => {
      const sub = await mockPrisma.subscriber.create({
        data: {
          email: "multi-input@example.com",
          unsubscribeToken: "unsub_multi_input",
          status: SubscriptionStatus.ACTIVE,
        },
      });
      await mockPrisma.subscription.create({
        data: { subscriberId: sub.id, subject: SubjectChannel.JAVA },
      });
      await mockPrisma.subscription.create({
        data: { subscriberId: sub.id, subject: SubjectChannel.FRONTEND },
      });

      // Part A: JSON Payload
      const jsonReq = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": freshIp(),
        },
        body: JSON.stringify({
          token: "unsub_multi_input",
          topic: "JAVA",
        }),
      });

      const jsonRes = await unsubscribePostHandler(jsonReq);
      expect(jsonRes.status).toBe(200);

      // JAVA removed, FRONTEND remaining
      let subs = Array.from(memoryStore.subscriptions.values()).filter(
        (s) => s.subscriberId === sub.id
      );
      expect(subs.length).toBe(1);
      expect(subs[0].subject).toBe(SubjectChannel.FRONTEND);

      // Part B: Form URL-encoded (RFC 8058 standard MUA 1-click)
      const formReq = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-forwarded-for": freshIp(),
        },
        body: "token=unsub_multi_input&topic=FRONTEND",
      });

      const formRes = await unsubscribePostHandler(formReq);
      expect(formRes.status).toBe(200);

      // All topics gone, status flipped to UNSUBSCRIBED
      subs = Array.from(memoryStore.subscriptions.values()).filter(
        (s) => s.subscriberId === sub.id
      );
      expect(subs.length).toBe(0);
      expect(memoryStore.subscribers.get(sub.id)?.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
    });

    it("4.4 automatically flips status to UNSUBSCRIBED when the last remaining topic is removed", async () => {
      const sub = await mockPrisma.subscriber.create({
        data: {
          email: "single-topic@example.com",
          unsubscribeToken: "unsub_last_topic",
          status: SubscriptionStatus.ACTIVE,
        },
      });
      await mockPrisma.subscription.create({
        data: { subscriberId: sub.id, subject: SubjectChannel.BACKEND },
      });

      const req = new Request(
        "http://localhost/api/notifications/unsubscribe?token=unsub_last_topic&topic=BACKEND",
        {
          method: "POST",
          headers: { "x-forwarded-for": freshIp() },
        }
      );

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
      expect(data.remainingTopics).toEqual([]);

      expect(memoryStore.subscribers.get(sub.id)?.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
    });

    it("4.5 rejects non-canonical topics and injection attacks with HTTP 400", async () => {
      const maliciousTopics = [
        "MACHINE_LEARNING",
        "../../etc/passwd",
        "<script>alert('xss')</script>",
        "SELECT * FROM subscribers",
      ];

      for (const badTopic of maliciousTopics) {
        const req = new Request(
          `http://localhost/api/notifications/unsubscribe?token=some_token&topic=${encodeURIComponent(badTopic)}`,
          {
            method: "POST",
            headers: { "x-forwarded-for": freshIp() },
          }
        );

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain("Invalid topic channel");
      }
    });

    it("4.6 provides idempotent success when repeating unsubscription calls on an already-unsubscribed user", async () => {
      await mockPrisma.subscriber.create({
        data: {
          email: "already-unsub@example.com",
          unsubscribeToken: "unsub_idempotent_tok",
          status: SubscriptionStatus.UNSUBSCRIBED,
        },
      });

      // Call unsubscribe 3 times consecutively
      for (let i = 0; i < 3; i++) {
        const req = new Request(
          "http://localhost/api/notifications/unsubscribe?token=unsub_idempotent_tok&topic=ALL",
          {
            method: "POST",
            headers: { "x-forwarded-for": freshIp() },
          }
        );

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 5: Resend Webhooks & Cryptographic Svix Verification
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Suite 5: Resend Webhook & Cryptographic Svix Verification", () => {
    const testSecret = TEST_WEBHOOK_SECRET;

    it("5.1 rejects Svix webhooks with timestamps outside the ±300s anti-replay window", async () => {
      const payload = JSON.stringify({ type: "email.bounced", data: { to: ["bounced@example.com"] } });
      const nowSeconds = Math.floor(Date.now() / 1000);

      // Scenario A: 305 seconds in the past
      const oldHeaders = createSvixHeaderBundle({
        payload,
        secret: testSecret,
        timestamp: (nowSeconds - 305).toString(),
      });

      const oldResult = verifySvixSignatureDetailed({
        payload,
        headers: oldHeaders,
        secret: testSecret,
      });
      expect(oldResult.valid).toBe(false);
      expect(oldResult.error).toBe("Webhook timestamp outside tolerance window");

      // Scenario B: 305 seconds in the future
      const futureHeaders = createSvixHeaderBundle({
        payload,
        secret: testSecret,
        timestamp: (nowSeconds + 305).toString(),
      });

      const futureResult = verifySvixSignatureDetailed({
        payload,
        headers: futureHeaders,
        secret: testSecret,
      });
      expect(futureResult.valid).toBe(false);
      expect(futureResult.error).toBe("Webhook timestamp outside tolerance window");

      // Scenario C: Within tolerance (10 seconds ago) -> valid
      const validHeaders = createSvixHeaderBundle({
        payload,
        secret: testSecret,
        timestamp: (nowSeconds - 10).toString(),
      });

      const validResult = verifySvixSignatureDetailed({
        payload,
        headers: validHeaders,
        secret: testSecret,
      });
      expect(validResult.valid).toBe(true);
    });

    it("5.2 verifies successfully under multi-signature key rotation when candidate signatures are space-delimited", async () => {
      const payload = JSON.stringify({ type: "email.delivered", data: {} });
      const nowSeconds = Math.floor(Date.now() / 1000).toString();
      const id = "msg_rotation_123";

      const validBundle = createSvixHeaderBundle({ payload, secret: testSecret, id, timestamp: nowSeconds });
      const validSig = validBundle["svix-signature"]; // e.g. "v1,abc..."

      // Construct a rotated header with bogus signatures surrounding the real one
      const rotatedSignatureHeader = `v1,dGhpcy1pcy1hLWZha2Utc2lnbmF0dXJl- ${validSig} v2,some-future-version-sig`;

      const result = verifySvixSignatureDetailed({
        payload,
        headers: {
          "svix-id": id,
          "svix-timestamp": nowSeconds,
          "svix-signature": rotatedSignatureHeader,
        },
        secret: testSecret,
      });

      expect(result.valid).toBe(true);
    });

    it("5.3 verifies identically with either 'whsec_' prefix or raw base64 secret string", () => {
      const payload = JSON.stringify({ type: "email.opened", data: {} });
      const rawBase64Secret = testSecret.replace("whsec_", "");

      // Sign with raw base64 secret
      const bundle1 = createSvixHeaderBundle({ payload, secret: rawBase64Secret });
      expect(verifySvixSignature({ payload, headers: bundle1, secret: testSecret })).toBe(true);

      // Sign with whsec_ prefixed secret
      const bundle2 = createSvixHeaderBundle({ payload, secret: testSecret });
      expect(verifySvixSignature({ payload, headers: bundle2, secret: rawBase64Secret })).toBe(true);
    });

    it("5.4 deactivates multiple subscribers when receiving a batch bounce event with array recipient list", async () => {
      const sub1 = await mockPrisma.subscriber.create({
        data: { email: "bounce1@example.com", status: SubscriptionStatus.ACTIVE },
      });
      const sub2 = await mockPrisma.subscriber.create({
        data: { email: "bounce2@example.com", status: SubscriptionStatus.ACTIVE },
      });
      const sub3 = await mockPrisma.subscriber.create({
        data: { email: "innocent@example.com", status: SubscriptionStatus.ACTIVE },
      });

      const payload = JSON.stringify({
        type: "email.bounced",
        data: {
          to: ["Bounce1@example.com ", " bounce2@example.com"],
        },
      });

      const headers = createSvixHeaderBundle({ payload, secret: testSecret });

      const req = new Request("http://localhost/api/webhooks/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: payload,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.deactivatedCount).toBe(2);

      // Verify DB: sub1 & sub2 marked BOUNCED, sub3 remains ACTIVE
      expect(memoryStore.subscribers.get(sub1.id)?.status).toBe(SubscriptionStatus.BOUNCED);
      expect(memoryStore.subscribers.get(sub2.id)?.status).toBe(SubscriptionStatus.BOUNCED);
      expect(memoryStore.subscribers.get(sub3.id)?.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it("5.5 acknowledges informational events (delivered, opened, clicked) with HTTP 200 without mutating database", async () => {
      const sub = await mockPrisma.subscriber.create({
        data: { email: "reader@example.com", status: SubscriptionStatus.ACTIVE },
      });

      const infoEvents = ["email.delivered", "email.opened", "email.clicked", "email.sent"];

      for (const eventType of infoEvents) {
        const payload = JSON.stringify({ type: eventType, data: { email_id: "re_123" } });
        const headers = createSvixHeaderBundle({ payload, secret: testSecret });

        const req = new Request("http://localhost/api/webhooks/resend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: payload,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.received).toBe(true);
        expect(data.info).toContain("without state mutation");
      }

      // Subscriber remains ACTIVE
      expect(memoryStore.subscribers.get(sub.id)?.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it("5.6 gracefully ignores unknown webhook event types with HTTP 200 and ignored: true", async () => {
      const payload = JSON.stringify({ type: "contact.created", data: {} });
      const headers = createSvixHeaderBundle({ payload, secret: testSecret });

      const req = new Request("http://localhost/api/webhooks/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: payload,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ignored).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 6: Transactional Email Template Security & Resilience
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Suite 6: Transactional Email Template Security & Resilience", () => {
    it("6.1 escapes XSS injections in EpisodeReleaseEmail and prevents raw script tag rendering", () => {
      const maliciousProps = {
        title: "<script>alert('XSS Title')</script>",
        summary: '<img src=x onerror="alert(\'XSS Summary\')">',
        keyConcepts: ["<svg onload=alert('XSS Concept')>", "Virtual Memory"],
        ctaUrl: "https://systemsimulator.io/operating-systems/virtual-memory",
        recipientEmail: "victim@example.com",
        unsubscribeToken: "token_xss_test",
      };

      const html = renderToStaticMarkup(React.createElement(EpisodeReleaseEmail, maliciousProps));

      // Verify that malicious tags are escaped by React into &lt;script&gt;
      expect(html).not.toContain("<script>alert('XSS Title')</script>");
      expect(html).toContain("&lt;script&gt;alert(&#x27;XSS Title&#x27;)&lt;/script&gt;");

      expect(html).not.toContain('<img src=x onerror="alert(\'XSS Summary\')">');
      expect(html).toContain("&lt;img src=x onerror=&quot;alert(&#x27;XSS Summary&#x27;)&quot;&gt;");

      expect(html).not.toContain("<svg onload=alert('XSS Concept')>");
      expect(html).toContain("&lt;svg onload=alert(&#x27;XSS Concept&#x27;)&gt;");
    });

    it("6.2 properly URL-encodes special characters in unsubscribe tokens within footer links", () => {
      const specialToken = "tok+with spaces/and=symbols&more";
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          title: "Network Sockets",
          summary: "Deep dive into TCP socket state machine.",
          subject: "COMPUTER_NETWORKS",
          ctaUrl: "https://systemsimulator.io/computer-networks/sockets",
          unsubscribeToken: specialToken,
        })
      );

      const encodedToken = encodeURIComponent(specialToken);
      expect(html).toContain(encodedToken);
      // Unencoded spaces or ampersands should not appear in raw href queries
      expect(html).not.toContain(`token=${specialToken}`);
    });

    it("6.3 safely resolves unknown or malformed discipline channels to 'All Disciplines' palette", () => {
      const unknownChannels = [
        "quantum-computing",
        "BIOINFORMATICS",
        "random_unknown_subject",
        "",
        undefined,
      ];

      for (const ch of unknownChannels) {
        const palette = getSubjectPalette(ch);
        expect(palette).toBeDefined();
        expect(palette.channel).toBe("ALL");
        expect(palette.accentColor).toBe("#f59e0b");
      }

      // Check underscored format resolves correctly
      const osPalette = getSubjectPalette("OPERATING_SYSTEMS");
      expect(osPalette.channel).toBe("OPERATING_SYSTEMS");
      expect(osPalette.accentColor).toBe("#0ea5e9");
    });

    it("6.4 renders fallback discipline label when DoubleOptInEmail receives an empty subjects array", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok_verify_fallback",
          subjects: [],
          recipientEmail: "subscriber@example.com",
        })
      );

      expect(html).toContain("All Disciplines");
      expect(html).toContain("subscriber@example.com");
      expect(html).toContain("tok_verify_fallback");
    });

    it("6.5 verifies Rule #7 mobile touch target ergonomics (min-height: 44px) across CTA buttons in both templates", () => {
      const releaseHtml = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          title: "JVM Garbage Collection",
          summary: "G1 vs ZGC generational collectors.",
          subject: "JAVA",
          ctaUrl: "https://systemsimulator.io/java/gc",
          unsubscribeToken: "tok_touch_target",
        })
      );

      expect(releaseHtml).toContain("min-height:44px");

      const optInHtml = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok_touch_target_verify",
          subjects: ["BACKEND"],
        })
      );

      expect(optInHtml).toContain("min-height:44px");
    });
  });
});
