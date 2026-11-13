import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SubscriptionStatus } from "@prisma/client";

// ─── Hoisted Mocks ──────────────────────────────────────────────────────────
const { mockEnv, mockPrisma, TEST_WEBHOOK_SECRET } = vi.hoisted(() => {
  const TEST_WEBHOOK_SECRET =
    "whsec_" + Buffer.from("mock_resend_webhook_secret_key!").toString("base64");

  const mockEnv = {
    DATABASE_URL: "postgresql://mock:5432/test",
    NEXT_PUBLIC_APP_URL: "https://systemvisualizer.com",
    NODE_ENV: "test" as const,
    RESEND_API_KEY: "re_test_dummy_key",
    RESEND_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
    RESEND_FROM_EMAIL: "notifications@systemsimulator.io",
  };

  const mockPrisma = {
    subscriber: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  return { mockEnv, mockPrisma, TEST_WEBHOOK_SECRET };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/env", () => ({ env: mockEnv }));

import { getEmailHeaders } from "@/emails/headers";
import { EpisodeReleaseEmail } from "@/emails/EpisodeReleaseEmail";
import { DoubleOptInEmail } from "@/emails/DoubleOptInEmail";
import {
  verifySvixSignature,
  verifySvixSignatureDetailed,
} from "@/lib/security/svix";
import { POST as resendWebhookHandler } from "@/app/api/webhooks/resend/route";

// ─── Svix Signature Test Utility ────────────────────────────────────────────
function createTestSvixHeaders({
  payload,
  secret,
  id = `msg_${Date.now()}`,
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

describe("Milestone 3: Email Templates & Resend Webhook", () => {
  const testSecret = TEST_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.DATABASE_URL = "postgresql://mock:5432/test";
    mockEnv.NEXT_PUBLIC_APP_URL = "https://systemvisualizer.com";
    mockEnv.RESEND_WEBHOOK_SECRET = testSecret;
    mockPrisma.subscriber.updateMany.mockResolvedValue({ count: 1 });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 1: RFC 8058 Header Helper
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 1: RFC 8058 Header Helper (getEmailHeaders)", () => {
    it("generates List-Unsubscribe and List-Unsubscribe-Post headers", () => {
      const headers = getEmailHeaders({
        unsubscribeToken: "token-abc-123",
        subject: "OPERATING_SYSTEMS",
        appUrl: "https://systemsimulator.io",
      });

      expect(headers).toHaveProperty("List-Unsubscribe");
      expect(headers).toHaveProperty("List-Unsubscribe-Post");
      expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    });

    it("wraps List-Unsubscribe URI in angle brackets per RFC 2369/8058", () => {
      const headers = getEmailHeaders({
        unsubscribeToken: "token-abc-123",
        appUrl: "https://systemsimulator.io",
      });

      expect(headers["List-Unsubscribe"]).toMatch(/^<https:\/\/.*>$/);
    });

    it("appends topic query param when subject is provided", () => {
      const headers = getEmailHeaders({
        unsubscribeToken: "tok-456",
        subject: "JAVASCRIPT",
        appUrl: "https://systemsimulator.io",
      });

      expect(headers["List-Unsubscribe"]).toContain("topic=JAVASCRIPT");
    });

    it("omits topic query param when subject is omitted", () => {
      const headers = getEmailHeaders({
        unsubscribeToken: "tok-789",
        appUrl: "https://systemsimulator.io",
      });

      expect(headers["List-Unsubscribe"]).not.toContain("topic=");
    });

    it("sanitizes trailing slash from base appUrl", () => {
      const headers = getEmailHeaders({
        unsubscribeToken: "tok-slash",
        appUrl: "https://systemsimulator.io///",
      });

      expect(headers["List-Unsubscribe"]).toContain(
        "https://systemsimulator.io/api/notifications/unsubscribe"
      );
      expect(headers["List-Unsubscribe"]).not.toContain("io///");
      expect(headers["List-Unsubscribe"]).not.toContain("io//api");
    });

    it("properly encodes query parameters", () => {
      const headers = getEmailHeaders({
        unsubscribeToken: "tok+special/val==",
        subject: "COMPUTER_NETWORKS",
        appUrl: "https://systemsimulator.io",
      });

      expect(headers["List-Unsubscribe"]).toContain(
        `token=${encodeURIComponent("tok+special/val==")}`
      );
      expect(headers["List-Unsubscribe"]).toContain("topic=COMPUTER_NETWORKS");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 2: EpisodeReleaseEmail Template Rendering
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 2: EpisodeReleaseEmail Template Rendering", () => {
    it("renders episode title, number, and summary synopsis", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "test-unsub-tok",
          subject: "JAVASCRIPT",
          episodeNumber: 4,
          title: "Microtasks & Macro-task Queues",
          summary: "An in-depth visual trace through Promise reaction jobs.",
          ctaUrl: "https://systemsimulator.io/javascript/episodes/04",
        })
      );

      expect(html).toContain("Microtasks &amp; Macro-task Queues");
      expect(html).toContain("EPISODE 04");
      expect(html).toContain("An in-depth visual trace through Promise reaction jobs.");
      expect(html).toContain("dev@example.com");
    });

    it("applies Amber (#f59e0b) accent for JAVASCRIPT", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "tok",
          subject: "JAVASCRIPT",
          title: "Event Loop",
          summary: "Runtime execution",
          ctaUrl: "https://systemsimulator.io/js",
        })
      );

      expect(html).toContain("#f59e0b");
      expect(html).toContain("JAVASCRIPT");
    });

    it("applies Sky (#0ea5e9) accent for OPERATING_SYSTEMS", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "tok",
          subject: "OPERATING_SYSTEMS",
          title: "Scheduler",
          summary: "CFS and Multitasking",
          ctaUrl: "https://systemsimulator.io/os",
        })
      );

      expect(html).toContain("#0ea5e9");
      expect(html).toContain("Operating Systems");
    });

    it("applies Emerald (#10b981) accent for JAVA", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "tok",
          subject: "JAVA",
          title: "JVM Memory",
          summary: "Young &amp; Old Generation",
          ctaUrl: "https://systemsimulator.io/java",
        })
      );

      expect(html).toContain("#10b981");
      expect(html).toContain("Java &amp; JVM");
    });

    it("applies Violet (#8b5cf6) accent for FRONTEND", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "tok",
          subject: "FRONTEND",
          title: "Virtual DOM",
          summary: "Fiber architecture",
          ctaUrl: "https://systemsimulator.io/frontend",
        })
      );

      expect(html).toContain("#8b5cf6");
      expect(html).toContain("Frontend Architecture");
    });

    it("applies Blue (#3b82f6) accent for BACKEND", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "tok",
          subject: "BACKEND",
          title: "Connection Pool",
          summary: "PostgreSQL connection pooling",
          ctaUrl: "https://systemsimulator.io/backend",
        })
      );

      expect(html).toContain("#3b82f6");
      expect(html).toContain("Backend Internals");
    });

    it("applies Teal (#14b8a6) accent for COMPUTER_NETWORKS", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "tok",
          subject: "COMPUTER_NETWORKS",
          title: "TCP 3-Way Handshake",
          summary: "SYN, SYN-ACK, ACK",
          ctaUrl: "https://systemsimulator.io/networks",
        })
      );

      expect(html).toContain("#14b8a6");
      expect(html).toContain("Computer Networks");
    });

    it("renders deep-link CTA button with matching href and min-height 44px", () => {
      const cta = "https://systemsimulator.io/javascript/episodes/04?utm_source=email";
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "tok",
          subject: "JAVASCRIPT",
          title: "Test Episode",
          summary: "Summary",
          ctaUrl: cta,
        })
      );

      expect(html).toContain(`href="${cta}"`);
      expect(html).toContain("Launch Interactive Simulator →");
      expect(html).toContain("min-height:44px");
    });

    it("renders key concepts pills when provided", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "tok",
          subject: "JAVASCRIPT",
          title: "Test Episode",
          summary: "Summary",
          keyConcepts: ["Call Stack", "Microtask Queue", "Event Loop"],
          ctaUrl: "https://systemsimulator.io",
        })
      );

      expect(html).toContain("Key Concepts In This Simulation");
      expect(html).toContain("Call Stack");
      expect(html).toContain("Microtask Queue");
      expect(html).toContain("Event Loop");
    });

    it("renders RFC 8058 footer with topic-specific and global unsubscribe links", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "unsub-999",
          subject: "COMPUTER_NETWORKS",
          title: "Network Simulator",
          summary: "Packet routing",
          ctaUrl: "https://systemsimulator.io",
          appUrl: "https://systemsimulator.io",
        })
      );

      expect(html).toContain(
        "https://systemsimulator.io/api/notifications/unsubscribe?token=unsub-999&amp;topic=COMPUTER_NETWORKS"
      );
      expect(html).toContain(
        "https://systemsimulator.io/api/notifications/unsubscribe?token=unsub-999&amp;topic=ALL"
      );
      expect(html).toContain("https://systemsimulator.io/unsubscribe?token=unsub-999");
      expect(html).toContain("1-Click Unsubscribe from Computer Networks");
    });

    it("includes canonical brand header wordmark", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: "dev@example.com",
          unsubscribeToken: "tok",
          subject: "ALL",
          title: "Test",
          summary: "Test",
          ctaUrl: "https://systemsimulator.io",
        })
      );

      expect(html).toContain("SYSTEM SIMULATOR");
      expect(html).toContain("Interactive Architectural Visualizer");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 3: DoubleOptInEmail Template Rendering
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 3: DoubleOptInEmail Template Rendering", () => {
    it("renders verification CTA button pointing to verification link with min-height 44px", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          recipientEmail: "dev@example.com",
          verificationToken: "verify-token-xyz",
          appUrl: "https://systemsimulator.io",
        })
      );

      expect(html).toContain("Verify Subscription →");
      expect(html).toContain(
        "https://systemsimulator.io/api/notifications/verify?token=verify-token-xyz"
      );
      expect(html).toContain("min-height:44px");
    });

    it("displays explicit 24-hour expiration notice", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, { verificationToken: "tok" })
      );

      expect(html).toContain("This verification link expires in 24 hours");
    });

    it("displays security disclaimer for unintended recipients", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, { verificationToken: "tok" })
      );

      expect(html).toContain(
        "If you didn&#x27;t request this subscription, you can safely ignore this email"
      );
    });

    it("renders requested discipline chips", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok",
          subjects: ["JAVASCRIPT", "OPERATING_SYSTEMS"],
        })
      );

      expect(html).toContain("Requested Disciplines");
      expect(html).toContain("JavaScript");
      expect(html).toContain("Operating Systems");
    });

    it("renders plaintext link fallback block", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok-plain",
          appUrl: "https://systemsimulator.io",
        })
      );

      expect(html).toContain("Or copy and paste this link into your browser:");
      expect(html).toContain(
        "https://systemsimulator.io/api/notifications/verify?token=tok-plain"
      );
    });

    it("renders brand header wordmark", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, { verificationToken: "tok" })
      );

      expect(html).toContain("SYSTEM SIMULATOR");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 4: Svix Signature Verification
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 4: Native Svix Signature Verification (verifySvixSignature)", () => {
    const payload = JSON.stringify({ type: "email.bounced", data: { to: ["user@test.com"] } });

    it("validates authentic signature with whsec_ prefix secret", () => {
      const headers = createTestSvixHeaders({ payload, secret: testSecret });
      const isValid = verifySvixSignature({ payload, headers, secret: testSecret });
      expect(isValid).toBe(true);

      const detailed = verifySvixSignatureDetailed({ payload, headers, secret: testSecret });
      expect(detailed.valid).toBe(true);
      expect(detailed.error).toBeUndefined();
    });

    it("validates authentic signature with raw base64 secret", () => {
      const rawSecret = testSecret.slice(6);
      const headers = createTestSvixHeaders({ payload, secret: rawSecret });
      const isValid = verifySvixSignature({ payload, headers, secret: rawSecret });
      expect(isValid).toBe(true);
    });

    it("rejects tampered payload", () => {
      const headers = createTestSvixHeaders({ payload, secret: testSecret });
      const tamperedPayload = JSON.stringify({ type: "email.bounced", data: { to: ["hacker@evil.com"] } });
      const isValid = verifySvixSignature({
        payload: tamperedPayload,
        headers,
        secret: testSecret,
      });

      expect(isValid).toBe(false);
      const detailed = verifySvixSignatureDetailed({
        payload: tamperedPayload,
        headers,
        secret: testSecret,
      });
      expect(detailed.valid).toBe(false);
      expect(detailed.error).toBe("Signature mismatch");
    });

    it("rejects expired timestamp > 300s in the past", () => {
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 305).toString();
      const headers = createTestSvixHeaders({
        payload,
        secret: testSecret,
        timestamp: oldTimestamp,
      });

      const isValid = verifySvixSignature({ payload, headers, secret: testSecret });
      expect(isValid).toBe(false);

      const detailed = verifySvixSignatureDetailed({ payload, headers, secret: testSecret });
      expect(detailed.error).toBe("Webhook timestamp outside tolerance window");
    });

    it("rejects future timestamp > 300s in the future", () => {
      const futureTimestamp = (Math.floor(Date.now() / 1000) + 305).toString();
      const headers = createTestSvixHeaders({
        payload,
        secret: testSecret,
        timestamp: futureTimestamp,
      });

      const isValid = verifySvixSignature({ payload, headers, secret: testSecret });
      expect(isValid).toBe(false);
    });

    it("supports key rotation with multiple space-delimited signatures", () => {
      const oldSecret = "whsec_oldSecretKey1234567890abcdef123456";
      const headersOld = createTestSvixHeaders({ payload, secret: oldSecret });
      const headersNew = createTestSvixHeaders({ payload, secret: testSecret });

      // Combine both signatures separated by space
      const combinedHeaders = {
        "svix-id": headersNew["svix-id"],
        "svix-timestamp": headersNew["svix-timestamp"],
        "svix-signature": `${headersOld["svix-signature"]} ${headersNew["svix-signature"]}`,
      };

      const isValid = verifySvixSignature({
        payload,
        headers: combinedHeaders,
        secret: testSecret,
      });
      expect(isValid).toBe(true);
    });

    it("returns false when required Svix headers are missing", () => {
      expect(
        verifySvixSignature({
          payload,
          headers: {},
          secret: testSecret,
        })
      ).toBe(false);

      expect(
        verifySvixSignature({
          payload,
          headers: { "svix-id": "1", "svix-timestamp": "2" },
          secret: testSecret,
        })
      ).toBe(false);
    });

    it("returns false on invalid secret", () => {
      expect(
        verifySvixSignature({
          payload,
          headers: { "svix-id": "1", "svix-timestamp": "2", "svix-signature": "v1,abc" },
          secret: "",
        })
      ).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 5: Resend Webhook Ingest Route (POST /api/webhooks/resend)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 5: Resend Webhook Ingest (POST /api/webhooks/resend)", () => {
    it("deactivates subscriber to BOUNCED on email.bounced event", async () => {
      const event = {
        type: "email.bounced",
        data: {
          email_id: "email-123",
          to: ["BounceUser@Example.com"],
          bounce: { message: "Mailbox does not exist" },
        },
      };
      const rawBody = JSON.stringify(event);
      const headers = createTestSvixHeaders({ payload: rawBody, secret: testSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...headers,
        },
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.event).toBe("email.bounced");
      expect(json.deactivatedCount).toBe(1);

      expect(mockPrisma.subscriber.updateMany).toHaveBeenCalledWith({
        where: { email: { in: ["bounceuser@example.com"] } },
        data: { status: SubscriptionStatus.BOUNCED },
      });
    });

    it("deactivates subscriber to BOUNCED on email.complained event", async () => {
      const event = {
        type: "email.complained",
        data: {
          email_id: "email-456",
          to: ["complaint@example.com"],
        },
      };
      const rawBody = JSON.stringify(event);
      const headers = createTestSvixHeaders({ payload: rawBody, secret: testSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...headers,
        },
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.event).toBe("email.complained");

      expect(mockPrisma.subscriber.updateMany).toHaveBeenCalledWith({
        where: { email: { in: ["complaint@example.com"] } },
        data: { status: SubscriptionStatus.BOUNCED },
      });
    });

    it("handles multiple recipient emails in event.data.to array", async () => {
      const event = {
        type: "email.bounced",
        data: {
          to: ["user1@example.com", "  User2@Example.COM  "],
        },
      };
      const rawBody = JSON.stringify(event);
      const headers = createTestSvixHeaders({ payload: rawBody, secret: testSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);

      expect(mockPrisma.subscriber.updateMany).toHaveBeenCalledWith({
        where: { email: { in: ["user1@example.com", "user2@example.com"] } },
        data: { status: SubscriptionStatus.BOUNCED },
      });
    });

    it("handles single string recipient in event.data.to", async () => {
      const event = {
        type: "email.bounced",
        data: {
          to: "SingleUser@Example.com",
        },
      };
      const rawBody = JSON.stringify(event);
      const headers = createTestSvixHeaders({ payload: rawBody, secret: testSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);

      expect(mockPrisma.subscriber.updateMany).toHaveBeenCalledWith({
        where: { email: { in: ["singleuser@example.com"] } },
        data: { status: SubscriptionStatus.BOUNCED },
      });
    });

    it("handles empty recipient list without calling database", async () => {
      const event = {
        type: "email.bounced",
        data: {
          to: [],
        },
      };
      const rawBody = JSON.stringify(event);
      const headers = createTestSvixHeaders({ payload: rawBody, secret: testSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);
      expect(mockPrisma.subscriber.updateMany).not.toHaveBeenCalled();
    });

    it("acknowledges informational events (email.delivered, email.sent, email.opened) with 200 without DB calls", async () => {
      for (const infoType of ["email.delivered", "email.sent", "email.opened", "email.clicked"]) {
        const event = {
          type: infoType,
          data: { email_id: "info-123" },
        };
        const rawBody = JSON.stringify(event);
        const headers = createTestSvixHeaders({ payload: rawBody, secret: testSecret });

        const req = new Request("http://localhost:3000/api/webhooks/resend", {
          method: "POST",
          headers,
          body: rawBody,
        });

        const res = await resendWebhookHandler(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.received).toBe(true);
        expect(json.event).toBe(infoType);
      }

      expect(mockPrisma.subscriber.updateMany).not.toHaveBeenCalled();
    });

    it("acknowledges unknown event types with 200 { received: true, ignored: true }", async () => {
      const event = {
        type: "custom.unknown.event",
        data: { foo: "bar" },
      };
      const rawBody = JSON.stringify(event);
      const headers = createTestSvixHeaders({ payload: rawBody, secret: testSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.ignored).toBe(true);
    });

    it("returns 400 when required Svix headers are missing", async () => {
      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers: {},
        body: JSON.stringify({ type: "email.bounced" }),
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Missing required Svix headers");
    });

    it("returns 400 when Svix signature is invalid", async () => {
      const rawBody = JSON.stringify({ type: "email.bounced", data: { to: ["bad@example.com"] } });
      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers: {
          "svix-id": "msg_bad",
          "svix-timestamp": Math.floor(Date.now() / 1000).toString(),
          "svix-signature": "v1,invalidBase64Signature==",
        },
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid webhook signature.");
    });

    it("returns 400 when Svix timestamp is expired (> 300 seconds)", async () => {
      const rawBody = JSON.stringify({ type: "email.bounced" });
      const expiredTimestamp = (Math.floor(Date.now() / 1000) - 350).toString();
      const headers = createTestSvixHeaders({
        payload: rawBody,
        secret: testSecret,
        timestamp: expiredTimestamp,
      });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 on malformed JSON payload", async () => {
      const rawBody = "{ not-valid-json ";
      const headers = createTestSvixHeaders({ payload: rawBody, secret: testSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Malformed JSON payload.");
    });

    it("returns 500 when RESEND_WEBHOOK_SECRET is not configured", async () => {
      delete process.env.RESEND_WEBHOOK_SECRET;
      // @ts-expect-error mutating mock
      mockEnv.RESEND_WEBHOOK_SECRET = undefined;

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers: {
          "svix-id": "id",
          "svix-timestamp": "123",
          "svix-signature": "sig",
        },
        body: "{}",
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Webhook secret is not configured.");
    });

    it("returns 503 when DATABASE_URL is not configured for bounce processing", async () => {
      // @ts-expect-error mutating mock
      mockEnv.DATABASE_URL = undefined;
      const event = {
        type: "email.bounced",
        data: { to: ["test@example.com"] },
      };
      const rawBody = JSON.stringify(event);
      const headers = createTestSvixHeaders({ payload: rawBody, secret: testSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toBe("Database not configured.");
    });

    it("returns 500 when database updateMany throws an error", async () => {
      mockPrisma.subscriber.updateMany.mockRejectedValue(
        new Error("Connection pool exhausted")
      );
      const event = {
        type: "email.bounced",
        data: { to: ["test@example.com"] },
      };
      const rawBody = JSON.stringify(event);
      const headers = createTestSvixHeaders({ payload: rawBody, secret: testSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Internal database error processing webhook.");
    });
  });
});
