import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubjectChannel, SubscriptionStatus } from "@prisma/client";

// ─── Mock Setup ─────────────────────────────────────────────────────────────

const { mockAuth, mockEnv, mockPrisma } = vi.hoisted(() => {
  const mockAuth = vi.fn();

  const mockEnv = {
    DATABASE_URL: "postgresql://mock:5432/test",
    NEXT_PUBLIC_APP_URL: "https://systemvisualizer.com",
    NODE_ENV: "test" as const,
  };

  const mockPrisma = {
    subscriber: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
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

  return { mockAuth, mockEnv, mockPrisma };
});

export { mockAuth, mockEnv, mockPrisma };

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
import { POST as unsubscribePostHandler } from "@/app/api/notifications/unsubscribe/route";

let ipIndex = 1000;
function getAdversarialIp(): string {
  ipIndex++;
  const octet3 = Math.floor(ipIndex / 250);
  const octet4 = (ipIndex % 250) + 1;
  return `172.16.${octet3}.${octet4}`;
}

describe("Adversarial & Empirical Challenge Suite — Milestone 2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    mockEnv.DATABASE_URL = "postgresql://mock:5432/test";
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Challenge 1: Expired Token Verification (HTTP 410 Strict)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Challenge 1: Expired Token Verification strictly returns HTTP 410", () => {
    it("returns HTTP 410 when token expired 1 millisecond ago and does not mutate subscriber", async () => {
      const now = Date.now();
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_adv_expired_1",
        email: "adv1@example.com",
        isVerified: false,
        verificationToken: "token_expired_1ms",
        tokenExpiresAt: new Date(now - 1),
      });

      const req = new Request("http://localhost/api/notifications/verify?token=token_expired_1ms", {
        method: "GET",
        headers: { "x-forwarded-for": getAdversarialIp() },
      });

      const res = await verifyHandler(req);
      expect(res.status).toBe(410);

      const json = await res.json();
      expect(json.error).toBe("Verification token has expired. Please subscribe again.");

      // Critical security check: DB update MUST NOT have occurred
      expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();
    });

    it("returns HTTP 410 when token expired 30 days ago", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_adv_expired_30d",
        email: "adv30d@example.com",
        isVerified: false,
        verificationToken: "token_expired_30d",
        tokenExpiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });

      const req = new Request("http://localhost/api/notifications/verify?token=token_expired_30d", {
        method: "GET",
        headers: { "x-forwarded-for": getAdversarialIp() },
      });

      const res = await verifyHandler(req);
      expect(res.status).toBe(410);
      expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();
    });

    it("returns HTTP 410 when tokenExpiresAt is null on an unverified subscriber", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_adv_expired_null",
        email: "advnull@example.com",
        isVerified: false,
        verificationToken: "token_null_exp",
        tokenExpiresAt: null,
      });

      const req = new Request("http://localhost/api/notifications/verify?token=token_null_exp", {
        method: "GET",
        headers: { "x-forwarded-for": getAdversarialIp() },
      });

      const res = await verifyHandler(req);
      expect(res.status).toBe(410);
      expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Challenge 2: Replay of Verification Token (HTTP 400 on replay)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Challenge 2: Replay Attack Defense strictly returns HTTP 400", () => {
    it("first verification succeeds (200), subsequent replay with identical token fails with 400", async () => {
      const activeToken = "adversarial_single_use_token_999";

      // 1st request: token found and valid
      mockPrisma.subscriber.findUnique.mockResolvedValueOnce({
        id: "sub_replay_test",
        email: "replay@example.com",
        isVerified: false,
        verificationToken: activeToken,
        tokenExpiresAt: new Date(Date.now() + 600000),
      });
      mockPrisma.subscriber.update.mockResolvedValueOnce({
        id: "sub_replay_test",
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
      });

      const req1 = new Request(`http://localhost/api/notifications/verify?token=${activeToken}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-forwarded-for": getAdversarialIp(),
        },
      });

      const res1 = await verifyHandler(req1);
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.success).toBe(true);

      // Verify that the token was explicitly nullified in the update
      expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({
        where: { id: "sub_replay_test" },
        data: {
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // 2nd request (replay): token is now null in DB
      mockPrisma.subscriber.findUnique.mockResolvedValueOnce(null);

      const req2 = new Request(`http://localhost/api/notifications/verify?token=${activeToken}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-forwarded-for": getAdversarialIp(),
        },
      });

      const res2 = await verifyHandler(req2);
      expect(res2.status).toBe(400);
      const json2 = await res2.json();
      expect(json2.error).toBe("Invalid verification token.");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Challenge 3: Mixed Casing & Whitespace Normalization
  // ───────────────────────────────────────────────────────────────────────────
  describe("Challenge 3: Subscribing with mixed casing / whitespace email", () => {
    it("trims whitespace, newlines, and converts uppercase/mixed casing to lowercase", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue(null);
      mockPrisma.subscriber.upsert.mockImplementation(async ({ create }) => ({
        id: "sub_fuzz_1",
        ...create,
      }));
      mockPrisma.subscription.upsert.mockResolvedValue({ id: "subsc_fuzz_1" });

      const dirtyEmail = "  \n\t  AdVeRsArIaL.TeSt+HaCkEr@ExAmPlE.CoM \t \r\n ";
      const expectedNormalized = "adversarial.test+hacker@example.com";

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getAdversarialIp(),
        },
        body: JSON.stringify({
          email: dirtyEmail,
          subjects: ["BACKEND", "FRONTEND"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);

      // Verify findUnique query used normalized email
      expect(mockPrisma.subscriber.findUnique).toHaveBeenCalledWith({
        where: { email: expectedNormalized },
      });

      // Verify upsert query used normalized email
      expect(mockPrisma.subscriber.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: expectedNormalized },
          create: expect.objectContaining({
            email: expectedNormalized,
          }),
        })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Challenge 4: Adding Channel to Verified Subscriber (Zero Re-Verification)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Challenge 4: Adding a new channel to an already-verified subscriber", () => {
    it("returns requiresVerification: false and retains isVerified: true without generating token", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_verified_existing",
        email: "alreadyverified@example.com",
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        status: SubscriptionStatus.ACTIVE,
      });

      mockPrisma.subscriber.upsert.mockImplementation(async ({ update }) => ({
        id: "sub_verified_existing",
        email: "alreadyverified@example.com",
        ...update,
      }));
      mockPrisma.subscription.upsert.mockResolvedValue({ id: "subsc_new_channel" });

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getAdversarialIp(),
        },
        body: JSON.stringify({
          email: "alreadyverified@example.com",
          subjects: ["OPERATING_SYSTEMS"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.requiresVerification).toBe(false);
      expect(json.message).toBe("Subscribed successfully.");

      // Check the exact update payload applied
      const updatePayload = mockPrisma.subscriber.upsert.mock.calls[0][0].update;
      expect(updatePayload.isVerified).toBe(true);
      expect(updatePayload.verificationToken).toBeNull();
      expect(updatePayload.tokenExpiresAt).toBeNull();

      // Check subscription upsert for OPERATING_SYSTEMS
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith({
        where: {
          subscriberId_subject: {
            subscriberId: "sub_verified_existing",
            subject: SubjectChannel.OPERATING_SYSTEMS,
          },
        },
        update: {},
        create: {
          subscriberId: "sub_verified_existing",
          subject: SubjectChannel.OPERATING_SYSTEMS,
        },
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Challenge 5: Subscribing to ALL Pruning Individual Channels
  // ───────────────────────────────────────────────────────────────────────────
  describe("Challenge 5: Subscribing to ALL deletes individual channels and keeps only ALL", () => {
    it("deletes all existing individual channels and upserts only ALL", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_prune_test",
        email: "prune@example.com",
        isVerified: true,
      });
      mockPrisma.subscriber.upsert.mockResolvedValue({
        id: "sub_prune_test",
        email: "prune@example.com",
        isVerified: true,
      });
      mockPrisma.subscription.deleteMany.mockResolvedValue({ count: 4 });
      mockPrisma.subscription.upsert.mockResolvedValue({ id: "subsc_all_only" });

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getAdversarialIp(),
        },
        body: JSON.stringify({
          email: "prune@example.com",
          subjects: ["ALL"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);

      // Verify deletion of all non-ALL channels
      expect(mockPrisma.subscription.deleteMany).toHaveBeenCalledWith({
        where: {
          subscriberId: "sub_prune_test",
          subject: { not: SubjectChannel.ALL },
        },
      });

      // Verify upsert of SubjectChannel.ALL
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith({
        where: {
          subscriberId_subject: {
            subscriberId: "sub_prune_test",
            subject: SubjectChannel.ALL,
          },
        },
        update: {},
        create: {
          subscriberId: "sub_prune_test",
          subject: SubjectChannel.ALL,
        },
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Challenge 6: Request Flooding & Rate Limit Headers
  // ───────────────────────────────────────────────────────────────────────────
  describe("Challenge 6: Flooding requests triggers 429 and returns Retry-After header", () => {
    it("floods POST /api/notifications/subscribe and verifies 429 + Retry-After integer header", async () => {
      const floodIp = "192.0.2.100";

      // 5 requests pass
      for (let i = 1; i <= 5; i++) {
        const req = new Request("http://localhost/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": floodIp,
          },
          body: JSON.stringify({ email: `flood_${i}@example.com`, subjects: ["ALL"] }),
        });
        const res = await subscribeHandler(req);
        expect(res.status).toBe(200);
      }

      // 6th request: rejected with 429
      const floodReq = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": floodIp,
        },
        body: JSON.stringify({ email: "flood_6@example.com", subjects: ["ALL"] }),
      });
      const floodRes = await subscribeHandler(floodReq);
      expect(floodRes.status).toBe(429);

      // Check rate limit response body
      const json = await floodRes.json();
      expect(json.error).toBe("Too many requests. Please slow down.");

      // Check headers
      expect(floodRes.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(floodRes.headers.get("X-RateLimit-Remaining")).toBe("0");

      const retryAfter = floodRes.headers.get("Retry-After");
      expect(retryAfter).not.toBeNull();
      const retryAfterNum = Number.parseInt(retryAfter!, 10);
      expect(Number.isFinite(retryAfterNum)).toBe(true);
      expect(retryAfterNum).toBeGreaterThan(0);
      expect(retryAfterNum).toBeLessThanOrEqual(60);
    });

    it("floods GET /api/notifications/verify and verifies 429 + Retry-After header", async () => {
      const floodIp = "192.0.2.101";

      // 10 requests pass
      for (let i = 1; i <= 10; i++) {
        const req = new Request(`http://localhost/api/notifications/verify?token=flood_tok_${i}`, {
          method: "GET",
          headers: { "x-forwarded-for": floodIp },
        });
        const res = await verifyHandler(req);
        expect(res.status).not.toBe(429);
      }

      // 11th request: rejected with 429
      const floodReq = new Request("http://localhost/api/notifications/verify?token=flood_tok_11", {
        method: "GET",
        headers: { "x-forwarded-for": floodIp },
      });
      const floodRes = await verifyHandler(floodReq);
      expect(floodRes.status).toBe(429);

      const retryAfter = floodRes.headers.get("Retry-After");
      expect(retryAfter).not.toBeNull();
      const retryAfterNum = Number.parseInt(retryAfter!, 10);
      expect(retryAfterNum).toBeGreaterThan(0);
      expect(retryAfterNum).toBeLessThanOrEqual(60);
      expect(floodRes.headers.get("X-RateLimit-Limit")).toBe("10");
    });

    it("floods POST /api/notifications/unsubscribe and verifies 429 + Retry-After header", async () => {
      const floodIp = "192.0.2.102";

      // 20 requests pass
      for (let i = 1; i <= 20; i++) {
        const req = new Request("http://localhost/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": floodIp,
          },
          body: JSON.stringify({ token: `flood_unsub_${i}`, topic: "ALL" }),
        });
        const res = await unsubscribePostHandler(req);
        expect(res.status).not.toBe(429);
      }

      // 21st request: rejected with 429
      const floodReq = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": floodIp,
        },
        body: JSON.stringify({ token: "flood_unsub_21", topic: "ALL" }),
      });
      const floodRes = await unsubscribePostHandler(floodReq);
      expect(floodRes.status).toBe(429);

      const retryAfter = floodRes.headers.get("Retry-After");
      expect(retryAfter).not.toBeNull();
      const retryAfterNum = Number.parseInt(retryAfter!, 10);
      expect(retryAfterNum).toBeGreaterThan(0);
      expect(retryAfterNum).toBeLessThanOrEqual(60);
      expect(floodRes.headers.get("X-RateLimit-Limit")).toBe("20");
    });
  });
});
