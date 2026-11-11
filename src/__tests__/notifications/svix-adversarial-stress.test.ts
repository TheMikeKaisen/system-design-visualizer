import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import { SubscriptionStatus } from "@prisma/client";

// ─── Hoisted Mocks ──────────────────────────────────────────────────────────
const { mockEnv, mockPrisma } = vi.hoisted(() => {
  const mockEnv = {
    DATABASE_URL: "postgresql://mock:5432/test",
    NEXT_PUBLIC_APP_URL: "https://systemvisualizer.com",
    NODE_ENV: "test" as const,
    RESEND_API_KEY: "re_test_dummy_key",
    RESEND_WEBHOOK_SECRET: "whsec_mfYJuJTruqd1GLmUsICDugwOTBmGtJn2",
    RESEND_FROM_EMAIL: "notifications@systemsimulator.io",
  };

  const mockPrisma = {
    subscriber: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  return { mockEnv, mockPrisma };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/env", () => ({ env: mockEnv }));

import {
  verifySvixSignature,
  verifySvixSignatureDetailed,
} from "@/lib/security/svix";
import { POST as resendWebhookHandler } from "@/app/api/webhooks/resend/route";

// Helper to sign svix payload
function createRawSignature({
  id,
  timestamp,
  payload,
  secret,
}: {
  id: string;
  timestamp: string;
  payload: string;
  secret: string;
}) {
  const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(cleanSecret, "base64");
  const toSign = `${id}.${timestamp}.${payload}`;
  return crypto
    .createHmac("sha256", secretBytes)
    .update(toSign)
    .digest("base64");
}

function makeSvixHeaders({
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
  const sig = createRawSignature({ id, timestamp, payload, secret });
  return {
    "svix-id": id,
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${sig}`,
  };
}

describe("Empirical Challenger M3-2: Svix Crypto & Webhook Stress Suite", () => {
  const validSecret = "whsec_mfYJuJTruqd1GLmUsICDugwOTBmGtJn2";
  const alternateSecret = "whsec_anotherValidSecretForRotation1234=";
  const defaultPayload = JSON.stringify({
    type: "email.bounced",
    data: { to: ["adversary@test.com"] },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.DATABASE_URL = "postgresql://mock:5432/test";
    mockEnv.NEXT_PUBLIC_APP_URL = "https://systemvisualizer.com";
    mockEnv.RESEND_WEBHOOK_SECRET = validSecret;
    mockPrisma.subscriber.updateMany.mockResolvedValue({ count: 1 });
  });

  // =========================================================================
  // 1. Replay Attack Resistance & Timestamp Boundaries
  // =========================================================================
  describe("1. Replay Attack Resistance & Timestamp Boundaries", () => {
    it("accepts timestamp exactly at current time", () => {
      const now = Math.floor(Date.now() / 1000).toString();
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
        timestamp: now,
      });
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(true);
    });

    it("accepts timestamp within tolerance boundary (299s in the past)", () => {
      const pastTime = (Math.floor(Date.now() / 1000) - 299).toString();
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
        timestamp: pastTime,
      });
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(true);
    });

    it("accepts timestamp exactly at lower tolerance boundary (300s in past)", () => {
      const pastTime = (Math.floor(Date.now() / 1000) - 300).toString();
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
        timestamp: pastTime,
      });
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(true);
    });

    it("rejects timestamp 301s in the past (1s beyond boundary)", () => {
      const pastTime = (Math.floor(Date.now() / 1000) - 301).toString();
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
        timestamp: pastTime,
      });
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Webhook timestamp outside tolerance window");
    });

    it("rejects replay attack timestamp 1 hour in the past (3600s)", () => {
      const pastTime = (Math.floor(Date.now() / 1000) - 3600).toString();
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
        timestamp: pastTime,
      });
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Webhook timestamp outside tolerance window");
    });

    it("accepts timestamp within future tolerance boundary (299s in future)", () => {
      const futureTime = (Math.floor(Date.now() / 1000) + 299).toString();
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
        timestamp: futureTime,
      });
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(true);
    });

    it("accepts timestamp exactly at future boundary (300s in future)", () => {
      const futureTime = (Math.floor(Date.now() / 1000) + 300).toString();
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
        timestamp: futureTime,
      });
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(true);
    });

    it("rejects timestamp 301s in future (clock skew beyond boundary)", () => {
      const futureTime = (Math.floor(Date.now() / 1000) + 301).toString();
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
        timestamp: futureTime,
      });
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Webhook timestamp outside tolerance window");
    });

    it("rejects non-numeric timestamp strings", () => {
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
        timestamp: "not-a-number",
      });
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Invalid Svix timestamp header");
    });

    it("rejects negative epoch timestamps", () => {
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
        timestamp: "-10000",
      });
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Webhook timestamp outside tolerance window");
    });
  });

  // =========================================================================
  // 2. Malformed & Missing Header Stress
  // =========================================================================
  describe("2. Malformed & Missing Header Stress", () => {
    it("rejects when svix-id is missing", () => {
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
      });
      delete (headers as Record<string, string>)["svix-id"];

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Missing required Svix headers");
    });

    it("rejects when svix-timestamp is missing", () => {
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
      });
      delete (headers as Record<string, string>)["svix-timestamp"];

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Missing required Svix headers");
    });

    it("rejects when svix-signature is missing", () => {
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
      });
      delete (headers as Record<string, string>)["svix-signature"];

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Missing required Svix headers");
    });

    it("rejects when headers object is null or undefined", () => {
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers: null as unknown as Record<string, string>,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Missing required Svix headers");
    });

    it("rejects empty string header values", () => {
      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers: {
          "svix-id": "",
          "svix-timestamp": Math.floor(Date.now() / 1000).toString(),
          "svix-signature": "v1,abc",
        },
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Missing required Svix headers");
    });

    it("rejects unsupported signature versions (e.g. v2)", () => {
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
      });
      headers["svix-signature"] = headers["svix-signature"].replace("v1,", "v2,");

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Signature mismatch");
    });

    it("rejects malformed signature strings without version prefix", () => {
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
      });
      headers["svix-signature"] = "plainbase64stringwithnocomma";

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Signature mismatch");
    });

    it("handles Headers Web API instance case-insensitively", () => {
      const now = Math.floor(Date.now() / 1000).toString();
      const id = "msg_headers_test";
      const sig = createRawSignature({
        id,
        timestamp: now,
        payload: defaultPayload,
        secret: validSecret,
      });

      const webHeaders = new Headers();
      webHeaders.set("SvIx-Id", id);
      webHeaders.set("SVIX-TIMESTAMP", now);
      webHeaders.set("svix-signature", `v1,${sig}`);

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers: webHeaders,
        secret: validSecret,
      });
      expect(res.valid).toBe(true);
    });
  });

  // =========================================================================
  // 3. Cryptographic Signature Tampering & Rotation Stress
  // =========================================================================
  describe("3. Cryptographic Signature Tampering & Rotation Stress", () => {
    it("rejects 1-character payload tampering (subtle bit flip)", () => {
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
      });
      // Flip adversary@test.com to adversary@test.con
      const tampered = defaultPayload.replace(".com", ".con");

      const res = verifySvixSignatureDetailed({
        payload: tampered,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Signature mismatch");
    });

    it("rejects signature signed with different secret key", () => {
      const wrongSecret = "whsec_wrongKeyTotallyDifferentBase64Key12=";
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: wrongSecret,
      });

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Signature mismatch");
    });

    it("rejects tampered svix-id even if signature matches original id", () => {
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
      });
      headers["svix-id"] = `${headers["svix-id"]}_tampered`;

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Signature mismatch");
    });

    it("supports secret rotation: valid signature first, invalid second", () => {
      const now = Math.floor(Date.now() / 1000).toString();
      const id = "msg_rot_1";
      const validSig = createRawSignature({
        id,
        timestamp: now,
        payload: defaultPayload,
        secret: validSecret,
      });
      const invalidSig = "v1,bm90YXJlYWxzaWduYXR1cmVhdGFsbGZha2U=";

      const headers = {
        "svix-id": id,
        "svix-timestamp": now,
        "svix-signature": `v1,${validSig} ${invalidSig}`,
      };

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(true);
    });

    it("supports secret rotation: invalid signature first, valid second", () => {
      const now = Math.floor(Date.now() / 1000).toString();
      const id = "msg_rot_2";
      const validSig = createRawSignature({
        id,
        timestamp: now,
        payload: defaultPayload,
        secret: validSecret,
      });
      const alternateSig = createRawSignature({
        id,
        timestamp: now,
        payload: defaultPayload,
        secret: alternateSecret,
      });

      const headers = {
        "svix-id": id,
        "svix-timestamp": now,
        "svix-signature": `v1,${alternateSig} v1,${validSig}`,
      };

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(true);

      const boolRes = verifySvixSignature({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(boolRes).toBe(true);
    });

    it("supports secret rotation with multiple space separators and tabs", () => {
      const now = Math.floor(Date.now() / 1000).toString();
      const id = "msg_rot_3";
      const validSig = createRawSignature({
        id,
        timestamp: now,
        payload: defaultPayload,
        secret: validSecret,
      });
      const bogusSig1 = "v1,YWJjZGVm";
      const bogusSig2 = "v2,skipthis";

      const headers = {
        "svix-id": id,
        "svix-timestamp": now,
        "svix-signature": `  ${bogusSig1}   ${bogusSig2}   v1,${validSig}  `,
      };

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: validSecret,
      });
      expect(res.valid).toBe(true);
    });

    it("handles secret without whsec_ prefix correctly", () => {
      const cleanSecret = validSecret.replace("whsec_", "");
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: cleanSecret,
      });

      const res = verifySvixSignatureDetailed({
        payload: defaultPayload,
        headers,
        secret: cleanSecret,
      });
      expect(res.valid).toBe(true);
    });

    it("rejects empty secret or secret containing only whitespace", () => {
      const headers = makeSvixHeaders({
        payload: defaultPayload,
        secret: validSecret,
      });

      expect(
        verifySvixSignatureDetailed({
          payload: defaultPayload,
          headers,
          secret: "",
        }).error
      ).toBe("Missing or invalid secret");

      expect(
        verifySvixSignatureDetailed({
          payload: defaultPayload,
          headers,
          secret: "   ",
        }).error
      ).toBe("Missing or invalid secret");
    });
  });

  // =========================================================================
  // 4. Webhook Ingest Endpoint (POST /api/webhooks/resend) Adversarial Edge Cases
  // =========================================================================
  describe("4. Webhook Ingest Route (POST /api/webhooks/resend) Edge Cases", () => {
    it("returns 500 when RESEND_WEBHOOK_SECRET is empty string or unset", async () => {
      delete process.env.RESEND_WEBHOOK_SECRET;
      mockEnv.RESEND_WEBHOOK_SECRET = "";

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers: {
          "svix-id": "msg_1",
          "svix-timestamp": Math.floor(Date.now() / 1000).toString(),
          "svix-signature": "v1,test",
        },
        body: defaultPayload,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Webhook secret is not configured.");
    });

    it("returns 400 when svix headers are missing from HTTP request", async () => {
      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: defaultPayload,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Missing required Svix headers");
    });

    it("returns 400 when signature verification fails on HTTP request", async () => {
      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers: {
          "svix-id": "msg_tampered",
          "svix-timestamp": Math.floor(Date.now() / 1000).toString(),
          "svix-signature": "v1,ZmFrZXNpZ25hdHVyZQ==",
        },
        body: defaultPayload,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid webhook signature.");
      expect(json.details).toBe("Signature mismatch");
    });

    it("returns 400 when body is not valid JSON", async () => {
      const rawInvalidBody = "<<<Not Valid JSON Object>>>";
      const headers = makeSvixHeaders({
        payload: rawInvalidBody,
        secret: validSecret,
      });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawInvalidBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Malformed JSON payload.");
    });

    it("returns 400 when JSON body violates event schema (missing type)", async () => {
      const badEvent = { data: { to: ["user@test.com"] } };
      const rawBody = JSON.stringify(badEvent);
      const headers = makeSvixHeaders({
        payload: rawBody,
        secret: validSecret,
      });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Malformed webhook payload structure.");
    });

    it("handles bounce event with missing email ('to' field omitted) -> returns 200 without DB call", async () => {
      const event = {
        type: "email.bounced",
        data: {
          email_id: "em_nobounce",
          bounce: { message: "General drop" },
        },
      };
      const rawBody = JSON.stringify(event);
      const headers = makeSvixHeaders({ payload: rawBody, secret: validSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.message).toContain("No recipient emails specified");
      expect(mockPrisma.subscriber.updateMany).not.toHaveBeenCalled();
    });

    it("handles bounce event with empty recipient array -> returns 200 without DB call", async () => {
      const event = {
        type: "email.bounced",
        data: { to: [] },
      };
      const rawBody = JSON.stringify(event);
      const headers = makeSvixHeaders({ payload: rawBody, secret: validSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(mockPrisma.subscriber.updateMany).not.toHaveBeenCalled();
    });

    it("handles bounce event with array of whitespace-only emails -> returns 200 without DB call", async () => {
      const event = {
        type: "email.bounced",
        data: { to: ["   ", "", "\t\n"] },
      };
      const rawBody = JSON.stringify(event);
      const headers = makeSvixHeaders({ payload: rawBody, secret: validSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);
      expect(mockPrisma.subscriber.updateMany).not.toHaveBeenCalled();
    });

    it("normalizes mixed-case and whitespace emails to lowercase", async () => {
      const event = {
        type: "email.bounced",
        data: {
          to: [
            "  Alice.Smith@Domain.COM  ",
            "BOB@ACME.ORG",
            "charlie+tag@example.io",
          ],
        },
      };
      const rawBody = JSON.stringify(event);
      const headers = makeSvixHeaders({ payload: rawBody, secret: validSecret });

      const req = new Request("http://localhost:3000/api/webhooks/resend", {
        method: "POST",
        headers,
        body: rawBody,
      });

      const res = await resendWebhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      expect(mockPrisma.subscriber.updateMany).toHaveBeenCalledWith({
        where: {
          email: {
            in: [
              "alice.smith@domain.com",
              "bob@acme.org",
              "charlie+tag@example.io",
            ],
          },
        },
        data: { status: SubscriptionStatus.BOUNCED },
      });
    });

    it("acknowledges completely unknown event types with 200 { received: true, ignored: true } without DB call", async () => {
      const event = {
        type: "unknown.future.event_type",
        data: { extraField: 12345 },
      };
      const rawBody = JSON.stringify(event);
      const headers = makeSvixHeaders({ payload: rawBody, secret: validSecret });

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
      expect(json.event).toBe("unknown.future.event_type");
      expect(mockPrisma.subscriber.updateMany).not.toHaveBeenCalled();
    });

    it("acknowledges delivered, sent, delivery_delayed, opened, clicked with 200 without DB call", async () => {
      const informationalTypes = [
        "email.delivered",
        "email.sent",
        "email.delivery_delayed",
        "email.opened",
        "email.clicked",
      ];

      for (const infoType of informationalTypes) {
        const event = {
          type: infoType,
          data: {
            email_id: "msg_info_123",
            to: ["user@domain.com"],
          },
        };
        const rawBody = JSON.stringify(event);
        const headers = makeSvixHeaders({ payload: rawBody, secret: validSecret });

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

    it("returns 503 if DATABASE_URL is not configured during bounce", async () => {
      // @ts-expect-error mocking undefined
      mockEnv.DATABASE_URL = undefined;

      const event = {
        type: "email.bounced",
        data: { to: ["bounce@test.com"] },
      };
      const rawBody = JSON.stringify(event);
      const headers = makeSvixHeaders({ payload: rawBody, secret: validSecret });

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

    it("returns 500 when database updateMany rejects (Prisma failure)", async () => {
      mockPrisma.subscriber.updateMany.mockRejectedValue(
        new Error("PrismaClientInitializationError: Connection timed out")
      );

      const event = {
        type: "email.bounced",
        data: { to: ["bounce@test.com"] },
      };
      const rawBody = JSON.stringify(event);
      const headers = makeSvixHeaders({ payload: rawBody, secret: validSecret });

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
