import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubjectChannel, SubscriptionStatus } from "@prisma/client";

// ─── Mock Setup ─────────────────────────────────────────────────────────────

const { mockAuth, mockEnv, mockPrisma, mockResendSend } = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockResendSend = vi.fn().mockResolvedValue({ data: { id: "msg_mock_123" }, error: null });

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

  return { mockAuth, mockEnv, mockPrisma, mockResendSend };
});

export { mockAuth, mockEnv, mockPrisma, mockResendSend };

vi.mock("@/lib/resend", () => ({
  getResendClient: vi.fn(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
  resetDefaultResendClient: vi.fn(),
}));

vi.mock("@/workers/dispatch", () => ({
  getResendClient: vi.fn(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
  resetDefaultResendClient: vi.fn(),
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

// Counter to assign isolated IP addresses per functional test
let ipCounter = 1;
function getUniqueIp(): string {
  ipCounter++;
  const b3 = Math.floor(ipCounter / 250);
  const b4 = (ipCounter % 250) + 1;
  return `10.99.${b3}.${b4}`;
}

describe("Milestone 2: Notification API Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    mockEnv.DATABASE_URL = "postgresql://mock:5432/test";
    delete (mockEnv as Record<string, unknown>).RESEND_API_KEY;
    delete (mockEnv as Record<string, unknown>).RESEND_FROM_EMAIL;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. POST /api/notifications/subscribe
  // ═══════════════════════════════════════════════════════════════════════════

  describe("POST /api/notifications/subscribe", () => {
    it("returns 503 if DATABASE_URL is not configured", async () => {
      // @ts-expect-error simulating unset database URL
      mockEnv.DATABASE_URL = undefined;

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ email: "user@example.com", subjects: ["ALL"] }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toBe("Database not configured.");
    });

    it("returns 415 if Content-Type is not application/json", async () => {
      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "x-forwarded-for": getUniqueIp(),
        },
        body: "email=user@example.com",
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(415);
      const json = await res.json();
      expect(json.error).toBe("Content-Type must be application/json.");
    });

    it("returns 400 on malformed JSON payload", async () => {
      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: "{ not-valid-json }",
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid JSON body.");
    });

    it("returns 400 for invalid email format", async () => {
      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ email: "invalid-email-address", subjects: ["JAVA"] }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid email format.");
    });

    it("returns 400 for empty subjects array", async () => {
      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ email: "user@example.com", subjects: [] }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("At least one subject channel must be selected.");
    });

    it("returns 400 for invalid SubjectChannel enum key", async () => {
      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ email: "user@example.com", subjects: ["NOT_A_VALID_TOPIC"] }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.details).toBeDefined();
    });

    it("processes new guest subscription: creates unverified subscriber with 24h expiration token", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue(null);
      mockPrisma.subscriber.upsert.mockImplementation(async ({ create }) => ({
        id: "sub_guest_1",
        ...create,
      }));
      mockPrisma.subscription.upsert.mockResolvedValue({ id: "subsc_1" });

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "   Guest.User@Example.COM   ",
          subjects: ["JAVASCRIPT", "OPERATING_SYSTEMS"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.requiresVerification).toBe(true);
      expect(json.message).toContain("check your inbox");

      // Verify email was trimmed & lowercased
      expect(mockPrisma.subscriber.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "guest.user@example.com" },
          create: expect.objectContaining({
            email: "guest.user@example.com",
            isVerified: false,
            userId: null,
            status: SubscriptionStatus.ACTIVE,
          }),
        })
      );

      // Verify token is 64 hex characters (32 bytes)
      const upsertCall = mockPrisma.subscriber.upsert.mock.calls[0][0];
      const token = upsertCall.create.verificationToken;
      expect(token).toMatch(/^[0-9a-f]{64}$/);

      // Verify 24-hour expiration window (~86400000 ms in future)
      const expiresAt = upsertCall.create.tokenExpiresAt as Date;
      const diffMs = expiresAt.getTime() - Date.now();
      expect(diffMs).toBeGreaterThan(23.9 * 60 * 60 * 1000);
      expect(diffMs).toBeLessThanOrEqual(24.1 * 60 * 60 * 1000);

      // Verify both subscriptions were upserted
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledTimes(2);
    });

    it("enforces zero re-verification decoupling: existing verified guest does NOT generate token", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_verified_1",
        email: "verified@example.com",
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        status: SubscriptionStatus.ACTIVE,
      });

      mockPrisma.subscriber.upsert.mockImplementation(async ({ update }) => ({
        id: "sub_verified_1",
        email: "verified@example.com",
        ...update,
      }));
      mockPrisma.subscription.upsert.mockResolvedValue({ id: "subsc_2" });

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "verified@example.com",
          subjects: ["BACKEND"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.requiresVerification).toBe(false);
      expect(json.message).toBe("Subscribed successfully.");

      const updatePayload = mockPrisma.subscriber.upsert.mock.calls[0][0].update;
      expect(updatePayload.isVerified).toBe(true);
      expect(updatePayload.verificationToken).toBeNull();
      expect(updatePayload.tokenExpiresAt).toBeNull();
    });

    it("refreshes verification token and 24h expiration for existing unverified guest", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_unverified_old",
        email: "unverified@example.com",
        isVerified: false,
        verificationToken: "old_token_123",
        tokenExpiresAt: new Date(Date.now() - 1000), // expired
        status: SubscriptionStatus.ACTIVE,
      });

      mockPrisma.subscriber.upsert.mockImplementation(async ({ update }) => ({
        id: "sub_unverified_old",
        email: "unverified@example.com",
        ...update,
      }));
      mockPrisma.subscription.upsert.mockResolvedValue({ id: "subsc_3" });

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "unverified@example.com",
          subjects: ["FRONTEND"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.requiresVerification).toBe(true);

      const updatePayload = mockPrisma.subscriber.upsert.mock.calls[0][0].update;
      expect(updatePayload.verificationToken).toMatch(/^[0-9a-f]{64}$/);
      expect(updatePayload.verificationToken).not.toBe("old_token_123");
      const diffMs = (updatePayload.tokenExpiresAt as Date).getTime() - Date.now();
      expect(diffMs).toBeGreaterThan(23.9 * 60 * 60 * 1000);
    });

    it("processes authenticated user: links userId, sets isVerified: true with zero verification token", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_auth_99", email: "authuser@example.com" },
      });

      mockPrisma.subscriber.findUnique.mockResolvedValue(null);
      mockPrisma.subscriber.upsert.mockImplementation(async ({ create }) => ({
        id: "sub_auth_1",
        ...create,
      }));
      mockPrisma.subscription.upsert.mockResolvedValue({ id: "subsc_4" });

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "authuser@example.com",
          subjects: ["COMPUTER_NETWORKS"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.requiresVerification).toBe(false);

      const createPayload = mockPrisma.subscriber.upsert.mock.calls[0][0].create;
      expect(createPayload.userId).toBe("user_auth_99");
      expect(createPayload.isVerified).toBe(true);
      expect(createPayload.verificationToken).toBeNull();
      expect(createPayload.tokenExpiresAt).toBeNull();
    });

    it("SEC-01: prevents email hijacking when authenticated user attempts to subscribe with third-party email", async () => {
      // Attacker is logged in as attacker@example.com
      mockAuth.mockResolvedValue({
        user: { id: "user_attacker", email: "attacker@example.com" },
      });

      // Target victim email does not exist yet
      mockPrisma.subscriber.findUnique.mockResolvedValue(null);
      mockPrisma.subscriber.upsert.mockImplementation(async ({ create }) => ({
        id: "sub_victim_1",
        ...create,
      }));
      mockPrisma.subscription.upsert.mockResolvedValue({ id: "subsc_victim" });

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "victim@target-company.com",
          subjects: ["JAVASCRIPT"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      // Must require verification (double opt-in)
      expect(json.success).toBe(true);
      expect(json.requiresVerification).toBe(true);
      expect(json.message).toContain("check your inbox");

      // Must NOT auto-verify and must NOT bind attacker's userId to victim's email!
      const createPayload = mockPrisma.subscriber.upsert.mock.calls[0][0].create;
      expect(createPayload.userId).toBeNull();
      expect(createPayload.isVerified).toBe(false);
      expect(createPayload.verificationToken).toMatch(/^[0-9a-f]{64}$/);
      expect(createPayload.tokenExpiresAt).toBeInstanceOf(Date);
    });

    it("SEC-02: dispatches DoubleOptInEmail via Resend when guest requires verification and RESEND_API_KEY is configured", async () => {
      (mockEnv as Record<string, unknown>).RESEND_API_KEY = "re_test_key_123456";
      (mockEnv as Record<string, unknown>).RESEND_FROM_EMAIL = "System Simulator <releases@systemsimulator.dev>";

      mockPrisma.subscriber.findUnique.mockResolvedValue(null);
      mockPrisma.subscriber.upsert.mockImplementation(async ({ create }) => ({
        id: "sub_guest_email_test",
        ...create,
      }));
      mockPrisma.subscription.upsert.mockResolvedValue({ id: "subsc_1" });

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "guest.dispatch@example.com",
          subjects: ["JAVASCRIPT", "OPERATING_SYSTEMS"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.requiresVerification).toBe(true);

      // Verify that Resend emails.send was called with rendered HTML
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "System Simulator <releases@systemsimulator.dev>",
          to: "guest.dispatch@example.com",
          subject: "Confirm your System Simulator subscription",
          html: expect.stringContaining("<!DOCTYPE html>"),
        })
      );
    });

    it("rejects account collision when authenticated user attempts to subscribe with email linked to another account", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_attacker", email: "victim@example.com" },
      });

      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_victim",
        email: "victim@example.com",
        userId: "user_legitimate_owner",
        isVerified: true,
      });

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "victim@example.com",
          subjects: ["JAVA"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toBe("Email is already associated with another account.");
    });

    it("prunes redundant individual topics when subscribing to ALL", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_existing_all",
        email: "allsubscriber@example.com",
        isVerified: true,
      });
      mockPrisma.subscriber.upsert.mockResolvedValue({
        id: "sub_existing_all",
        email: "allsubscriber@example.com",
        isVerified: true,
      });
      mockPrisma.subscription.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.subscription.upsert.mockResolvedValue({ id: "subsc_all" });

      const req = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({
          email: "allsubscriber@example.com",
          subjects: ["JAVASCRIPT", "ALL", "BACKEND"],
        }),
      });

      const res = await subscribeHandler(req);
      expect(res.status).toBe(200);

      // Verify deletion of all non-ALL subscriptions for this subscriber
      expect(mockPrisma.subscription.deleteMany).toHaveBeenCalledWith({
        where: {
          subscriberId: "sub_existing_all",
          subject: { not: SubjectChannel.ALL },
        },
      });

      // Verify upsert of SubjectChannel.ALL
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith({
        where: {
          subscriberId_subject: {
            subscriberId: "sub_existing_all",
            subject: SubjectChannel.ALL,
          },
        },
        update: {},
        create: {
          subscriberId: "sub_existing_all",
          subject: SubjectChannel.ALL,
        },
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. GET /api/notifications/verify
  // ═══════════════════════════════════════════════════════════════════════════

  describe("GET /api/notifications/verify", () => {
    it("returns 503 if DATABASE_URL is not configured", async () => {
      // @ts-expect-error simulating unset database URL
      mockEnv.DATABASE_URL = undefined;

      const req = new Request("http://localhost/api/notifications/verify?token=abc", {
        method: "GET",
        headers: { "x-forwarded-for": getUniqueIp() },
      });

      const res = await verifyHandler(req);
      expect(res.status).toBe(503);
    });

    it("returns 400 when token query parameter is missing", async () => {
      const req = new Request("http://localhost/api/notifications/verify", {
        method: "GET",
        headers: { "x-forwarded-for": getUniqueIp() },
      });

      const res = await verifyHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Verification token is required.");
    });

    it("returns 400 when verification token is not found in database", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue(null);

      const req = new Request("http://localhost/api/notifications/verify?token=non_existent_token", {
        method: "GET",
        headers: { "x-forwarded-for": getUniqueIp() },
      });

      const res = await verifyHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid verification token.");
    });

    it("returns 410 Gone when verification token has expired (>24 hours)", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_expired_1",
        email: "expired@example.com",
        isVerified: false,
        verificationToken: "expired_token_123",
        tokenExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      });

      const req = new Request("http://localhost/api/notifications/verify?token=expired_token_123", {
        method: "GET",
        headers: { "x-forwarded-for": getUniqueIp() },
      });

      const res = await verifyHandler(req);
      expect(res.status).toBe(410);
      const json = await res.json();
      expect(json.error).toContain("expired");

      // Verify no update took place
      expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();
    });

    it("successfully verifies subscriber: updates isVerified: true, clears token & expiration", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_valid_1",
        email: "valid@example.com",
        isVerified: false,
        verificationToken: "valid_token_777",
        tokenExpiresAt: new Date(Date.now() + 10000000),
      });
      mockPrisma.subscriber.update.mockResolvedValue({
        id: "sub_valid_1",
        isVerified: true,
      });

      const req = new Request("http://localhost/api/notifications/verify?token=valid_token_777", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
      });

      const res = await verifyHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe("Email verified successfully.");

      // Check atomic update
      expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({
        where: { id: "sub_valid_1" },
        data: {
          isVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          status: SubscriptionStatus.ACTIVE,
        },
      });
    });

    it("redirects to /verify?status=success when accessed via browser navigation (Accept: text/html)", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_valid_browser",
        email: "browser@example.com",
        isVerified: false,
        verificationToken: "browser_token_888",
        tokenExpiresAt: new Date(Date.now() + 10000000),
      });
      mockPrisma.subscriber.update.mockResolvedValue({
        id: "sub_valid_browser",
        isVerified: true,
      });

      const req = new Request("http://localhost:3000/api/notifications/verify?token=browser_token_888", {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
          "x-forwarded-for": getUniqueIp(),
        },
      });

      const res = await verifyHandler(req);
      // NextResponse.redirect produces 307 Temporary Redirect by default
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      expect(res.headers.get("location")).toContain("/verify?status=success");
    });

    it("prevents replay attacks: second verification attempt fails because token was cleared", async () => {
      // First attempt succeeds
      mockPrisma.subscriber.findUnique.mockResolvedValueOnce({
        id: "sub_replay_1",
        verificationToken: "token_once",
        tokenExpiresAt: new Date(Date.now() + 1000000),
      });
      mockPrisma.subscriber.update.mockResolvedValueOnce({});

      const req1 = new Request("http://localhost/api/notifications/verify?token=token_once", {
        method: "GET",
        headers: { Accept: "application/json", "x-forwarded-for": getUniqueIp() },
      });
      const res1 = await verifyHandler(req1);
      expect(res1.status).toBe(200);

      // Second attempt finds nothing because verificationToken is null in DB
      mockPrisma.subscriber.findUnique.mockResolvedValueOnce(null);

      const req2 = new Request("http://localhost/api/notifications/verify?token=token_once", {
        method: "GET",
        headers: { Accept: "application/json", "x-forwarded-for": getUniqueIp() },
      });
      const res2 = await verifyHandler(req2);
      expect(res2.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. GET & POST /api/notifications/unsubscribe (RFC 8058)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("GET & POST /api/notifications/unsubscribe", () => {
    it("safe GET with token redirects to frontend /unsubscribe?token=... without modifying DB", async () => {
      const req = new Request("http://localhost:3000/api/notifications/unsubscribe?token=cuid_get_1&topic=JAVA", {
        method: "GET",
        headers: { "x-forwarded-for": getUniqueIp() },
      });

      const res = await unsubscribeGetHandler(req);
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      expect(res.headers.get("location")).toContain("/unsubscribe?token=cuid_get_1&topic=JAVA");

      expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.deleteMany).not.toHaveBeenCalled();
    });

    it("safe GET without token returns 405 Method Not Allowed", async () => {
      const req = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "GET",
        headers: { "x-forwarded-for": getUniqueIp() },
      });

      const res = await unsubscribeGetHandler(req);
      expect(res.status).toBe(405);
      const json = await res.json();
      expect(json.error).toContain("Method not allowed");
    });

    it("POST returns 400 when token is missing", async () => {
      const req = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ topic: "JAVA" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Unsubscribe token is required.");
    });

    it("POST returns 400 when topic is invalid", async () => {
      const req = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ token: "cuid_tok_1", topic: "INVALID_DISCIPLINE" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Invalid topic channel");
    });

    it("POST returns 404 when subscriber is not found", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue(null);

      const req = new Request("http://localhost/api/notifications/unsubscribe?token=non_existent_cuid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("not found");
    });

    it("executes global unsubscribe via JSON: sets UNSUBSCRIBED and removes all subscriptions", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_global_1",
        email: "global@example.com",
        unsubscribeToken: "unsub_cuid_global",
        status: SubscriptionStatus.ACTIVE,
        subscriptions: [{ id: "s1", subject: SubjectChannel.JAVASCRIPT }],
      });
      mockPrisma.subscriber.update.mockResolvedValue({});
      mockPrisma.subscription.deleteMany.mockResolvedValue({ count: 1 });

      const req = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ token: "unsub_cuid_global", topic: "ALL" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe(SubscriptionStatus.UNSUBSCRIBED);

      expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({
        where: { id: "sub_global_1" },
        data: { status: SubscriptionStatus.UNSUBSCRIBED },
      });
      expect(mockPrisma.subscription.deleteMany).toHaveBeenCalledWith({
        where: { subscriberId: "sub_global_1" },
      });
    });

    it("executes RFC 8058 1-click unsubscription from Mail User Agent (application/x-www-form-urlencoded)", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_rfc_1",
        email: "mua@example.com",
        unsubscribeToken: "rfc_token_cuid",
        status: SubscriptionStatus.ACTIVE,
        subscriptions: [{ id: "s2", subject: SubjectChannel.OPERATING_SYSTEMS }],
      });
      mockPrisma.subscriber.update.mockResolvedValue({});
      mockPrisma.subscription.deleteMany.mockResolvedValue({ count: 1 });

      // RFC 8058 MUA request: POST to URI with List-Unsubscribe=One-Click in body
      const req = new Request("http://localhost/api/notifications/unsubscribe?token=rfc_token_cuid", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-forwarded-for": getUniqueIp(),
        },
        body: "List-Unsubscribe=One-Click",
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe("Unsubscribed successfully.");
      expect(json.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
    });

    it("executes HTML form unsubscription with token in URL-encoded form body", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_form_1",
        email: "form@example.com",
        unsubscribeToken: "form_token_cuid",
        status: SubscriptionStatus.ACTIVE,
        subscriptions: [{ id: "s3", subject: SubjectChannel.JAVA }],
      });
      mockPrisma.subscriber.update.mockResolvedValue({});
      mockPrisma.subscription.deleteMany.mockResolvedValue({ count: 1 });

      const req = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-forwarded-for": getUniqueIp(),
        },
        body: "token=form_token_cuid&topic=ALL",
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("executes granular topic unsubscribe with remaining topics: status stays ACTIVE", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_granular_1",
        email: "granular@example.com",
        unsubscribeToken: "granular_cuid_1",
        status: SubscriptionStatus.ACTIVE,
        subscriptions: [
          { id: "s1", subject: SubjectChannel.JAVASCRIPT },
          { id: "s2", subject: SubjectChannel.COMPUTER_NETWORKS },
        ],
      });
      mockPrisma.subscription.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.subscription.findMany.mockResolvedValue([
        { subject: SubjectChannel.JAVASCRIPT },
      ]);

      const req = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ token: "granular_cuid_1", topic: "COMPUTER_NETWORKS" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.status).toBe(SubscriptionStatus.ACTIVE);
      expect(json.remainingTopics).toEqual(["JAVASCRIPT"]);

      // Verify only COMPUTER_NETWORKS was deleted
      expect(mockPrisma.subscription.deleteMany).toHaveBeenCalledWith({
        where: { subscriberId: "sub_granular_1", subject: SubjectChannel.COMPUTER_NETWORKS },
      });
      // Subscriber status was NOT set to UNSUBSCRIBED
      expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();
    });

    it("executes granular topic unsubscribe with umbrella ALL expansion", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_umbrella_1",
        email: "umbrella@example.com",
        unsubscribeToken: "umbrella_cuid_1",
        status: SubscriptionStatus.ACTIVE,
        subscriptions: [{ id: "s_all", subject: SubjectChannel.ALL }],
      });
      mockPrisma.subscription.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.subscription.createMany.mockResolvedValue({ count: 5 });
      mockPrisma.subscription.findMany.mockResolvedValue([
        { subject: SubjectChannel.JAVASCRIPT },
        { subject: SubjectChannel.OPERATING_SYSTEMS },
        { subject: SubjectChannel.JAVA },
        { subject: SubjectChannel.BACKEND },
        { subject: SubjectChannel.FRONTEND },
      ]);

      const req = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ token: "umbrella_cuid_1", topic: "COMPUTER_NETWORKS" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.status).toBe(SubscriptionStatus.ACTIVE);
      expect(json.remainingTopics).not.toContain("COMPUTER_NETWORKS");
      expect(json.remainingTopics).toContain("JAVASCRIPT");

      // Verify ALL was deleted
      expect(mockPrisma.subscription.deleteMany).toHaveBeenCalledWith({
        where: { subscriberId: "sub_umbrella_1", subject: SubjectChannel.ALL },
      });

      // Verify remaining 5 disciplines were inserted
      expect(mockPrisma.subscription.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          { subscriberId: "sub_umbrella_1", subject: SubjectChannel.JAVASCRIPT },
          { subscriberId: "sub_umbrella_1", subject: SubjectChannel.OPERATING_SYSTEMS },
          { subscriberId: "sub_umbrella_1", subject: SubjectChannel.JAVA },
          { subscriberId: "sub_umbrella_1", subject: SubjectChannel.BACKEND },
          { subscriberId: "sub_umbrella_1", subject: SubjectChannel.FRONTEND },
        ]),
        skipDuplicates: true,
      });
    });

    it("transitions subscriber to UNSUBSCRIBED when last remaining topic is unsubscribed", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_last_1",
        email: "last@example.com",
        unsubscribeToken: "last_cuid_1",
        status: SubscriptionStatus.ACTIVE,
        subscriptions: [{ id: "s_only", subject: SubjectChannel.FRONTEND }],
      });
      mockPrisma.subscription.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.subscription.findMany.mockResolvedValue([]); // 0 remaining
      mockPrisma.subscriber.update.mockResolvedValue({});

      const req = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ token: "last_cuid_1", topic: "FRONTEND" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.status).toBe(SubscriptionStatus.UNSUBSCRIBED);
      expect(json.remainingTopics).toEqual([]);

      expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({
        where: { id: "sub_last_1" },
        data: { status: SubscriptionStatus.UNSUBSCRIBED },
      });
    });

    it("maintains idempotency: repeated unsubscription returns 200 without error", async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        id: "sub_already_unsub",
        email: "already@example.com",
        unsubscribeToken: "already_cuid",
        status: SubscriptionStatus.UNSUBSCRIBED,
        subscriptions: [],
      });
      mockPrisma.subscriber.update.mockResolvedValue({});
      mockPrisma.subscription.deleteMany.mockResolvedValue({ count: 0 });

      const req = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": getUniqueIp(),
        },
        body: JSON.stringify({ token: "already_cuid", topic: "ALL" }),
      });

      const res = await unsubscribePostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Rate Limiting Enforcement (HTTP 429)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Rate Limiting Enforcement (HTTP 429)", () => {
    it("enforces 5 req/min on POST /api/notifications/subscribe, returning 429 on 6th request", async () => {
      const fixedIp = "198.51.100.50";

      // 5 requests allowed
      for (let i = 1; i <= 5; i++) {
        const req = new Request("http://localhost/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": fixedIp,
          },
          body: JSON.stringify({ email: `rl_user_${i}@example.com`, subjects: ["ALL"] }),
        });
        const res = await subscribeHandler(req);
        expect(res.status).not.toBe(429);
      }

      // 6th request must trigger rate limit
      const req6 = new Request("http://localhost/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": fixedIp,
        },
        body: JSON.stringify({ email: "rl_user_6@example.com", subjects: ["ALL"] }),
      });
      const res6 = await subscribeHandler(req6);
      expect(res6.status).toBe(429);
      const json = await res6.json();
      expect(json.error).toBe("Too many requests. Please slow down.");
      expect(res6.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(res6.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(res6.headers.get("Retry-After")).toBeDefined();
    });

    it("enforces 10 req/min on GET /api/notifications/verify, returning 429 on 11th request", async () => {
      const fixedIp = "198.51.100.51";

      for (let i = 1; i <= 10; i++) {
        const req = new Request(`http://localhost/api/notifications/verify?token=tok_${i}`, {
          method: "GET",
          headers: { "x-forwarded-for": fixedIp },
        });
        const res = await verifyHandler(req);
        expect(res.status).not.toBe(429);
      }

      const req11 = new Request("http://localhost/api/notifications/verify?token=tok_11", {
        method: "GET",
        headers: { "x-forwarded-for": fixedIp },
      });
      const res11 = await verifyHandler(req11);
      expect(res11.status).toBe(429);
      expect(res11.headers.get("X-RateLimit-Limit")).toBe("10");
      expect(res11.headers.get("Retry-After")).toBeDefined();
    });

    it("enforces 20 req/min on POST /api/notifications/unsubscribe, returning 429 on 21st request", async () => {
      const fixedIp = "198.51.100.52";

      for (let i = 1; i <= 20; i++) {
        const req = new Request("http://localhost/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": fixedIp,
          },
          body: JSON.stringify({ token: `unsub_tok_${i}`, topic: "ALL" }),
        });
        const res = await unsubscribePostHandler(req);
        expect(res.status).not.toBe(429);
      }

      const req21 = new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": fixedIp,
        },
        body: JSON.stringify({ token: "unsub_tok_21", topic: "ALL" }),
      });
      const res21 = await unsubscribePostHandler(req21);
      expect(res21.status).toBe(429);
      expect(res21.headers.get("X-RateLimit-Limit")).toBe("20");
      expect(res21.headers.get("Retry-After")).toBeDefined();
    });
  });
});
