import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubjectChannel, SubscriptionStatus } from "@prisma/client";

// ─── Stateful In-Memory Prisma Oracle ──────────────────────────────────────────

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

class InMemoryDb {
  subscribers: MockSubscriber[] = [];
  subscriptions: MockSubscription[] = [];

  reset() {
    this.subscribers = [];
    this.subscriptions = [];
  }

  addSubscriber(sub: Partial<MockSubscriber> & { id: string; email: string; unsubscribeToken: string }): MockSubscriber {
    const full: MockSubscriber = {
      id: sub.id,
      email: sub.email,
      userId: sub.userId ?? null,
      isVerified: sub.isVerified ?? true,
      verificationToken: sub.verificationToken ?? null,
      tokenExpiresAt: sub.tokenExpiresAt ?? null,
      unsubscribeToken: sub.unsubscribeToken,
      status: sub.status ?? SubscriptionStatus.ACTIVE,
      createdAt: sub.createdAt ?? new Date(),
      updatedAt: sub.updatedAt ?? new Date(),
    };
    this.subscribers.push(full);
    return full;
  }

  addSubscription(subId: string, subject: SubjectChannel): MockSubscription {
    const record: MockSubscription = {
      id: `subsc_${Math.random().toString(36).slice(2, 9)}`,
      subscriberId: subId,
      subject,
      createdAt: new Date(),
    };
    this.subscriptions.push(record);
    return record;
  }
}

const memoryDb = new InMemoryDb();

const { mockEnv, mockPrisma } = vi.hoisted(() => {
  const mockEnv = {
    DATABASE_URL: "postgresql://mock:5432/test",
    NEXT_PUBLIC_APP_URL: "https://systemvisualizer.com",
    NODE_ENV: "test" as const,
  };

  const mockPrisma = {
    subscriber: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
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

  return { mockEnv, mockPrisma };
});

export { mockEnv, mockPrisma };

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}));

import {
  GET as unsubscribeGetHandler,
  POST as unsubscribePostHandler,
} from "@/app/api/notifications/unsubscribe/route";

// IP generator for rate-limit isolation across tests
let ipSequence = 5000;
function nextIp(): string {
  ipSequence++;
  const o3 = Math.floor(ipSequence / 250);
  const o4 = (ipSequence % 250) + 1;
  return `10.150.${o3}.${o4}`;
}

describe("Milestone 2 Challenger Suite: Unsubscription & Protocol Conformance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoryDb.reset();
    mockEnv.DATABASE_URL = "postgresql://mock:5432/test";

    // Wire up mockPrisma to reflect stateful memoryDb operations
    mockPrisma.subscriber.findUnique.mockImplementation(async ({ where, include }: { where: { unsubscribeToken?: string; id?: string }; include?: { subscriptions?: boolean } }) => {
      const found = memoryDb.subscribers.find((s) => {
        if (where.unsubscribeToken) return s.unsubscribeToken === where.unsubscribeToken;
        if (where.id) return s.id === where.id;
        return false;
      });
      if (!found) return null;
      if (include?.subscriptions) {
        const subs = memoryDb.subscriptions.filter((sub) => sub.subscriberId === found.id);
        return { ...found, subscriptions: subs };
      }
      return { ...found };
    });

    mockPrisma.subscriber.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: Partial<MockSubscriber> }) => {
      const idx = memoryDb.subscribers.findIndex((s) => s.id === where.id);
      if (idx === -1) throw new Error("Subscriber not found");
      memoryDb.subscribers[idx] = { ...memoryDb.subscribers[idx], ...data, updatedAt: new Date() };
      return memoryDb.subscribers[idx];
    });

    mockPrisma.subscription.deleteMany.mockImplementation(async ({ where }: { where: { subscriberId: string; subject?: SubjectChannel | { not?: SubjectChannel } } }) => {
      const initialCount = memoryDb.subscriptions.length;
      memoryDb.subscriptions = memoryDb.subscriptions.filter((sub) => {
        if (sub.subscriberId !== where.subscriberId) return true;
        if (!where.subject) return false; // Delete all for this subscriber
        if (typeof where.subject === "string") {
          return sub.subject !== where.subject;
        }
        if (where.subject.not) {
          return sub.subject === where.subject.not;
        }
        return true;
      });
      return { count: initialCount - memoryDb.subscriptions.length };
    });

    mockPrisma.subscription.createMany.mockImplementation(async ({ data }: { data: { subscriberId: string; subject: SubjectChannel }[] }) => {
      let created = 0;
      for (const item of data) {
        const exists = memoryDb.subscriptions.some(
          (s) => s.subscriberId === item.subscriberId && s.subject === item.subject
        );
        if (!exists) {
          memoryDb.addSubscription(item.subscriberId, item.subject);
          created++;
        }
      }
      return { count: created };
    });

    mockPrisma.subscription.findMany.mockImplementation(async ({ where, select }: { where: { subscriberId: string }; select?: { subject?: boolean } }) => {
      const matching = memoryDb.subscriptions.filter((s) => s.subscriberId === where.subscriberId);
      if (select?.subject) {
        return matching.map((s) => ({ subject: s.subject }));
      }
      return matching;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Challenge 1: RFC 8058 Standard Conformance (One-Click POST via MUA)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Challenge 1: RFC 8058 Standard Conformance (Mail User Agent POST)", () => {
    it("processes RFC 8058 MUA request: form-urlencoded body List-Unsubscribe=One-Click with token in query param", async () => {
      const token = "rfc8058_valid_token_abc";
      const sub = memoryDb.addSubscriber({
        id: "sub_rfc_test",
        email: "recipient@company.org",
        unsubscribeToken: token,
        status: SubscriptionStatus.ACTIVE,
      });
      memoryDb.addSubscription(sub.id, SubjectChannel.JAVASCRIPT);
      memoryDb.addSubscription(sub.id, SubjectChannel.BACKEND);

      expect(memoryDb.subscriptions).toHaveLength(2);
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);

      // RFC 8058 specifies POST to URI with header Content-Type: application/x-www-form-urlencoded
      // and body "List-Unsubscribe=One-Click"
      const req = new Request(`http://localhost:3000/api/notifications/unsubscribe?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-forwarded-for": nextIp(),
        },
        body: "List-Unsubscribe=One-Click",
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe("Unsubscribed successfully.");
      expect(json.topic).toBe("ALL");
      expect(json.status).toBe(SubscriptionStatus.UNSUBSCRIBED);

      // Verify state mutation in database:
      // 1. Subscriber status updated to UNSUBSCRIBED
      const updatedSubscriber = memoryDb.subscribers.find((s) => s.id === sub.id);
      expect(updatedSubscriber?.status).toBe(SubscriptionStatus.UNSUBSCRIBED);

      // 2. All subscriptions deleted
      const remainingSubscriptions = memoryDb.subscriptions.filter((s) => s.subscriberId === sub.id);
      expect(remainingSubscriptions).toHaveLength(0);
    });

    it("processes RFC 8058 request with charset parameterized content-type (application/x-www-form-urlencoded; charset=utf-8)", async () => {
      const token = "rfc8058_charset_token";
      const sub = memoryDb.addSubscriber({
        id: "sub_charset_test",
        email: "charset@example.com",
        unsubscribeToken: token,
      });
      memoryDb.addSubscription(sub.id, SubjectChannel.JAVA);

      const req = new Request(`http://localhost:3000/api/notifications/unsubscribe?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
          "x-forwarded-for": nextIp(),
        },
        body: "List-Unsubscribe=One-Click",
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe(SubscriptionStatus.UNSUBSCRIBED);

      const updated = memoryDb.subscribers.find((s) => s.id === sub.id);
      expect(updated?.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Challenge 2: JSON Unsubscription with Specific Topic
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Challenge 2: JSON Unsubscription with Specific Topic", () => {
    it("unsubscribes from specific topic without affecting other subscribed topics", async () => {
      const token = "json_specific_token";
      const sub = memoryDb.addSubscriber({
        id: "sub_multi_topics",
        email: "multi@example.com",
        unsubscribeToken: token,
        status: SubscriptionStatus.ACTIVE,
      });
      memoryDb.addSubscription(sub.id, SubjectChannel.JAVASCRIPT);
      memoryDb.addSubscription(sub.id, SubjectChannel.COMPUTER_NETWORKS);
      memoryDb.addSubscription(sub.id, SubjectChannel.BACKEND);

      const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({ token, topic: "JAVASCRIPT" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.topic).toBe(SubjectChannel.JAVASCRIPT);
      expect(json.status).toBe(SubscriptionStatus.ACTIVE);
      expect(json.remainingTopics).toHaveLength(2);
      expect(json.remainingTopics).toContain(SubjectChannel.COMPUTER_NETWORKS);
      expect(json.remainingTopics).toContain(SubjectChannel.BACKEND);
      expect(json.remainingTopics).not.toContain(SubjectChannel.JAVASCRIPT);

      // Verify DB state: JAVASCRIPT deleted, other 2 preserved, status remains ACTIVE
      const currentSubs = memoryDb.subscriptions.filter((s) => s.subscriberId === sub.id);
      expect(currentSubs.map((s) => s.subject)).toEqual([
        SubjectChannel.COMPUTER_NETWORKS,
        SubjectChannel.BACKEND,
      ]);
      const currentSub = memoryDb.subscribers.find((s) => s.id === sub.id);
      expect(currentSub?.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it("handles lowercase topic input gracefully via case-normalization", async () => {
      const token = "case_norm_token";
      const sub = memoryDb.addSubscriber({
        id: "sub_case_norm",
        email: "casenorm@example.com",
        unsubscribeToken: token,
      });
      memoryDb.addSubscription(sub.id, SubjectChannel.OPERATING_SYSTEMS);
      memoryDb.addSubscription(sub.id, SubjectChannel.JAVA);

      const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({ token, topic: "operating_systems" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.topic).toBe(SubjectChannel.OPERATING_SYSTEMS);
      expect(json.remainingTopics).toEqual([SubjectChannel.JAVA]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Challenge 3: Umbrella ALL Unsubscription & Dynamic Expansion
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Challenge 3: Umbrella ALL Dynamic Expansion Stress Testing", () => {
    it("dynamically expands ALL subscription into the remaining 5 canonical disciplines when unsubscribing from JAVASCRIPT", async () => {
      const token = "umbrella_expansion_token";
      const sub = memoryDb.addSubscriber({
        id: "sub_umbrella_all",
        email: "umbrella.user@example.com",
        unsubscribeToken: token,
        status: SubscriptionStatus.ACTIVE,
      });
      memoryDb.addSubscription(sub.id, SubjectChannel.ALL);

      const expectedRemaining: SubjectChannel[] = [
        SubjectChannel.OPERATING_SYSTEMS,
        SubjectChannel.JAVA,
        SubjectChannel.COMPUTER_NETWORKS,
        SubjectChannel.BACKEND,
        SubjectChannel.FRONTEND,
      ];

      const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({ token, topic: "JAVASCRIPT" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe(SubscriptionStatus.ACTIVE);
      expect(json.topic).toBe(SubjectChannel.JAVASCRIPT);
      expect(json.remainingTopics).toHaveLength(5);
      expect(json.remainingTopics.sort()).toEqual(expectedRemaining.slice().sort());

      // Verify DB state: ALL row is gone, exactly 5 specific disciplines inserted
      const currentSubs = memoryDb.subscriptions.filter((s) => s.subscriberId === sub.id);
      expect(currentSubs).toHaveLength(5);
      expect(currentSubs.some((s) => s.subject === SubjectChannel.ALL)).toBe(false);
      expect(currentSubs.some((s) => s.subject === SubjectChannel.JAVASCRIPT)).toBe(false);
      expect(currentSubs.map((s) => s.subject).sort()).toEqual(expectedRemaining.slice().sort());
    });

    it("survives step-by-step unsubscription sequence from ALL until zero topics remain", async () => {
      const token = "churn_token";
      const sub = memoryDb.addSubscriber({
        id: "sub_churn",
        email: "churn@example.com",
        unsubscribeToken: token,
        status: SubscriptionStatus.ACTIVE,
      });
      memoryDb.addSubscription(sub.id, SubjectChannel.ALL);

      const sequence: SubjectChannel[] = [
        SubjectChannel.JAVASCRIPT,
        SubjectChannel.OPERATING_SYSTEMS,
        SubjectChannel.JAVA,
        SubjectChannel.COMPUTER_NETWORKS,
        SubjectChannel.BACKEND,
        SubjectChannel.FRONTEND, // 6th and final canonical topic
      ];

      let expectedRemainingCount = 5;

      for (const topicToUnsub of sequence) {
        const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": nextIp(),
          },
          body: JSON.stringify({ token, topic: topicToUnsub }),
        });

        const res = await unsubscribePostHandler(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);

        if (expectedRemainingCount > 0) {
          expect(json.status).toBe(SubscriptionStatus.ACTIVE);
          expect(json.remainingTopics).toHaveLength(expectedRemainingCount);
          expectedRemainingCount--;
        } else {
          // Final topic unsubscription transitions status to UNSUBSCRIBED
          expect(json.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
          expect(json.remainingTopics).toHaveLength(0);
        }
      }

      // Verify final DB state
      const finalSubscriber = memoryDb.subscribers.find((s) => s.id === sub.id);
      expect(finalSubscriber?.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
      const finalSubs = memoryDb.subscriptions.filter((s) => s.subscriberId === sub.id);
      expect(finalSubs).toHaveLength(0);

      // Verify repeated call on already unsubscribed user is idempotent
      const idempotentReq = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({ token, topic: "ALL" }),
      });
      const idempotentRes = await unsubscribePostHandler(idempotentReq);
      expect(idempotentRes.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Challenge 4: Invalid, Forged, and Malformed Tokens
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Challenge 4: Token Validation & Tamper Resistance", () => {
    it("returns 400 Bad Request when token is missing entirely", async () => {
      const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({ topic: "JAVASCRIPT" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Unsubscribe token is required.");
    });

    it("returns 400 Bad Request when token is empty or whitespace", async () => {
      const req = new Request("http://localhost:3000/api/notifications/unsubscribe?token=%20%20%20", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({}),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Unsubscribe token is required.");
    });

    it("returns 404 Not Found when token does not exist in the database", async () => {
      const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({ token: "forged_unsub_token_nonexistent", topic: "ALL" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Subscriber not found or invalid token.");
    });

    it("safely handles SQL injection attempts in token without crashing", async () => {
      const maliciousToken = "' OR '1'='1' --; DROP TABLE Subscriber;";
      const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({ token: maliciousToken, topic: "ALL" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(404);
    });

    it("returns 400 Bad Request on invalid topic parameter", async () => {
      const token = "valid_token_for_bad_topic";
      memoryDb.addSubscriber({
        id: "sub_bad_topic",
        email: "badtopic@example.com",
        unsubscribeToken: token,
      });

      const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({ token, topic: "FORBIDDEN_TOPIC_123" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Invalid topic channel: 'FORBIDDEN_TOPIC_123'");
      expect(json.error).toContain("Must be one of: ALL");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Challenge 5: GET Request Safety & State Non-Mutation (RFC 8058 §3)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Challenge 5: GET Request Safety & State Non-Mutation", () => {
    it("redirects browser GET with token to /unsubscribe without mutating database state", async () => {
      const token = "get_safety_token";
      const sub = memoryDb.addSubscriber({
        id: "sub_get_safety",
        email: "getsafety@example.com",
        unsubscribeToken: token,
        status: SubscriptionStatus.ACTIVE,
      });
      memoryDb.addSubscription(sub.id, SubjectChannel.JAVASCRIPT);

      const req = new Request(`http://localhost:3000/api/notifications/unsubscribe?token=${token}&topic=JAVASCRIPT`, {
        method: "GET",
        headers: { "x-forwarded-for": nextIp() },
      });

      const res = await unsubscribeGetHandler(req);

      // Verify HTTP redirect response
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      const location = res.headers.get("location");
      expect(location).toContain("/unsubscribe");
      expect(location).toContain(`token=${token}`);
      expect(location).toContain("topic=JAVASCRIPT");

      // Verify ZERO database mutations took place
      expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.createMany).not.toHaveBeenCalled();

      // Subscriber must still be ACTIVE and have JAVASCRIPT subscription
      const checkSub = memoryDb.subscribers.find((s) => s.id === sub.id);
      expect(checkSub?.status).toBe(SubscriptionStatus.ACTIVE);
      const checkSubs = memoryDb.subscriptions.filter((s) => s.subscriberId === sub.id);
      expect(checkSubs).toHaveLength(1);
    });

    it("returns 405 Method Not Allowed when GET is called without token", async () => {
      const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "GET",
        headers: { "x-forwarded-for": nextIp() },
      });

      const res = await unsubscribeGetHandler(req);
      expect(res.status).toBe(405);
      expect(res.headers.get("Allow")).toBe("POST, GET");

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Method not allowed. Use POST for 1-click unsubscription.");

      // Verify zero DB calls
      expect(mockPrisma.subscriber.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Challenge 6: System Reliability & Fault Tolerance
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Challenge 6: System Reliability & Edge Cases", () => {
    it("returns 503 when DATABASE_URL is unconfigured", async () => {
      // @ts-expect-error simulating unset DATABASE_URL
      mockEnv.DATABASE_URL = undefined;

      const req = new Request("http://localhost:3000/api/notifications/unsubscribe?token=any", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toBe("Database not configured.");
    });

    it("handles invalid JSON payload gracefully with HTTP 400", async () => {
      const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: "{ malformed: json, missing quotes }",
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Invalid JSON payload.");
    });

    it("returns 500 Internal Server Error when database transaction throws unexpected error", async () => {
      const token = "db_crash_token";
      memoryDb.addSubscriber({
        id: "sub_crash",
        email: "crash@example.com",
        unsubscribeToken: token,
      });

      mockPrisma.subscriber.update.mockRejectedValueOnce(new Error("Database disk full"));

      const req = new Request("http://localhost:3000/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": nextIp(),
        },
        body: JSON.stringify({ token, topic: "ALL" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("An unexpected error occurred while processing unsubscription.");
    });
  });
});
