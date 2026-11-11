import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import {
  SubjectChannel,
  generateReleaseHeaders,
  dispatchEpisodeRelease,
  dispatchAllEpisodes,
  type DispatchConfig,
  type DispatchDependencies,
} from "../../../scripts/detect-new-episodes";
import {
  verifyReleaseSignatureDetailed,
  verifyReleaseSignature,
  validateReleaseTimestamp,
  computeReleaseSignature,
} from "@/lib/security/releaseSignature";
import type { FanoutMessagePayload } from "@/workers/types";

// ============================================================================
// Test Fixtures & Shared Helpers
// ============================================================================

const TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const SAMPLE_PAYLOAD: FanoutMessagePayload = {
  subject: SubjectChannel.COMPUTER_NETWORKS,
  episodeId: "tls-handshake",
  episodeNumber: 5,
  title: "TLS 1.3 Handshake & Cryptographic Key Exchange",
  releaseCommitSha: "deadbeefcafebabe1234567890abcdef12345678",
  summary: "Detailed step-by-step simulation of Diffie-Hellman Ephemeral key exchange.",
  keyConcepts: ["tls", "diffie-hellman", "crypto"],
  ctaUrl: "https://system-design-visualizer.com/computer-networks/simulator/tls-handshake",
  force: false,
};

function createSilentLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  };
}

function createMockResponse(options: {
  status: number;
  statusText?: string;
  body?: unknown;
  rawText?: string;
  isJson?: boolean;
}): Response {
  const { status, statusText = "OK", body, rawText, isJson = true } = options;

  return {
    status,
    statusText,
    ok: status >= 200 && status < 300,
    headers: new Headers({
      "Content-Type": isJson ? "application/json" : "text/html; charset=utf-8",
    }),
    json: async () => {
      if (!isJson) {
        throw new SyntaxError("Unexpected token '<', \"<html>502\"... is not valid JSON");
      }
      return body ?? {};
    },
    text: async () => {
      if (rawText !== undefined) return rawText;
      if (body !== undefined) return typeof body === "string" ? body : JSON.stringify(body);
      return "";
    },
  } as unknown as Response;
}

describe("Challenger M7-2: Cryptographic Boundary, Anti-Replay & Network Chaos Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Dimension 1: Cryptographic Boundary & Replay Tolerance Tests
  // ==========================================================================
  describe("1. Cryptographic Boundary & Replay Tolerance Tests", () => {
    it("binds HMAC-SHA256 signature to `${timestamp}.${rawBody}` in constant time", () => {
      const fixedNowMs = 1730462400000; // 2024-11-01T12:00:00Z
      const { rawBody, timestamp, signature, headers } = generateReleaseHeaders(
        SAMPLE_PAYLOAD,
        TEST_SECRET,
        fixedNowMs
      );

      expect(timestamp).toBe("1730462400");
      expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);

      // Verify exact manual HMAC derivation
      const manualExpected = crypto
        .createHmac("sha256", TEST_SECRET)
        .update(`${timestamp}.${rawBody}`, "utf8")
        .digest("hex");
      expect(signature).toBe(`sha256=${manualExpected}`);

      // Verify verifyReleaseSignatureDetailed verification
      const verification = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers,
        secret: TEST_SECRET,
        now: fixedNowMs,
      });

      expect(verification.valid).toBe(true);
      expect(verification.status).toBe(200);
      expect(verification.timestampMs).toBe(fixedNowMs);
    });

    it("verifies temporal replay boundaries: ±290s passes but ±310s fails with 401", () => {
      const baselineMs = 1730462400000;
      const { rawBody, headers } = generateReleaseHeaders(
        SAMPLE_PAYLOAD,
        TEST_SECRET,
        baselineMs
      );

      // 1. Normal (+290s): Server clock is 290s ahead of request timestamp (acceptable delay)
      const passPast = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers,
        secret: TEST_SECRET,
        toleranceSeconds: 300,
        now: baselineMs + 290_000,
      });
      expect(passPast.valid).toBe(true);
      expect(passPast.status).toBe(200);

      // 2. Normal (-290s): Server clock is 290s behind request timestamp (acceptable clock skew)
      const passFuture = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers,
        secret: TEST_SECRET,
        toleranceSeconds: 300,
        now: baselineMs - 290_000,
      });
      expect(passFuture.valid).toBe(true);
      expect(passFuture.status).toBe(200);

      // 3. Boundary expired (+310s): Request is older than 300s anti-replay window
      const failExpired = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers,
        secret: TEST_SECRET,
        toleranceSeconds: 300,
        now: baselineMs + 310_000,
      });
      expect(failExpired.valid).toBe(false);
      expect(failExpired.status).toBe(401);
      expect(failExpired.error).toContain("Timestamp expired / replay detected");

      // 4. Boundary clock skew (-310s): Request is from future beyond 300s window
      const failClockSkew = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers,
        secret: TEST_SECRET,
        toleranceSeconds: 300,
        now: baselineMs - 310_000,
      });
      expect(failClockSkew.valid).toBe(false);
      expect(failClockSkew.status).toBe(401);
      expect(failClockSkew.error).toContain("Timestamp in the future");
    });

    it("evaluates exact boundary edges at ±300s vs ±300.001s", () => {
      const timestampMs = 1730462400000;
      const timestampSecStr = "1730462400";

      // Exactly +300s (300,000ms): diffMs === toleranceMs => PASS
      const exactEdge = validateReleaseTimestamp(timestampSecStr, 300, timestampMs + 300_000);
      expect(exactEdge.valid).toBe(true);
      expect(exactEdge.status).toBe(200);

      // +300s + 1ms (300,001ms): diffMs > toleranceMs => REJECT
      const overEdge = validateReleaseTimestamp(timestampSecStr, 300, timestampMs + 300_001);
      expect(overEdge.valid).toBe(false);
      expect(overEdge.status).toBe(401);
      expect(overEdge.error).toContain("Timestamp expired / replay detected");

      // Exactly -300s (-300,000ms): diffMs === -toleranceMs => PASS
      const futureEdge = validateReleaseTimestamp(timestampSecStr, 300, timestampMs - 300_000);
      expect(futureEdge.valid).toBe(true);
      expect(futureEdge.status).toBe(200);

      // -300s - 1ms (-300,001ms): diffMs < -toleranceMs => REJECT
      const futureOverEdge = validateReleaseTimestamp(timestampSecStr, 300, timestampMs - 300_001);
      expect(futureOverEdge.valid).toBe(false);
      expect(futureOverEdge.status).toBe(401);
      expect(futureOverEdge.error).toContain("Timestamp in the future");
    });

    it("detects single-byte tampering in rawBody and rejects with 401 signature mismatch", () => {
      const nowMs = 1730462400000;
      const { rawBody, headers } = generateReleaseHeaders(
        SAMPLE_PAYLOAD,
        TEST_SECRET,
        nowMs
      );

      // Modify single byte in JSON body (e.g. change episodeNumber from 5 to 6)
      const tamperedBody = rawBody.replace('"episodeNumber":5', '"episodeNumber":6');
      expect(tamperedBody).not.toBe(rawBody);

      const result = verifyReleaseSignatureDetailed({
        payload: tamperedBody,
        headers,
        secret: TEST_SECRET,
        now: nowMs,
      });

      expect(result.valid).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe("Signature mismatch");
    });

    it("detects single-byte tampering in x-release-timestamp header and rejects with 401 signature mismatch", () => {
      const nowMs = 1730462400000;
      const { rawBody, headers } = generateReleaseHeaders(
        SAMPLE_PAYLOAD,
        TEST_SECRET,
        nowMs
      );

      // Tamper timestamp by 1 second (1730462400 -> 1730462401)
      const tamperedHeaders = {
        ...headers,
        "x-release-timestamp": "1730462401",
      };

      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: tamperedHeaders,
        secret: TEST_SECRET,
        now: nowMs,
      });

      expect(result.valid).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe("Signature mismatch");
    });

    it("detects single-character tampering and length anomalies in x-release-signature header", () => {
      const nowMs = 1730462400000;
      const { rawBody, headers, signature } = generateReleaseHeaders(
        SAMPLE_PAYLOAD,
        TEST_SECRET,
        nowMs
      );

      // 1. Bit flip / char change in valid hex
      const lastChar = signature.slice(-1);
      const flippedChar = lastChar === "a" ? "b" : "a";
      const tamperedSig = signature.slice(0, -1) + flippedChar;

      const flipResult = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: { ...headers, "x-release-signature": tamperedSig },
        secret: TEST_SECRET,
        now: nowMs,
      });
      expect(flipResult.valid).toBe(false);
      expect(flipResult.status).toBe(401);
      expect(flipResult.error).toBe("Signature mismatch");

      // 2. Truncated hex (63 chars instead of 64)
      const truncatedSig = signature.slice(0, -1);
      const truncResult = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: { ...headers, "x-release-signature": truncatedSig },
        secret: TEST_SECRET,
        now: nowMs,
      });
      expect(truncResult.valid).toBe(false);
      expect(truncResult.status).toBe(401);
      expect(truncResult.error).toBe("Invalid signature format: expected 64-character hex digest");

      // 3. Extended hex (65 chars instead of 64)
      const extendedSig = signature + "f";
      const extResult = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: { ...headers, "x-release-signature": extendedSig },
        secret: TEST_SECRET,
        now: nowMs,
      });
      expect(extResult.valid).toBe(false);
      expect(extResult.status).toBe(401);
      expect(extResult.error).toBe("Invalid signature format: expected 64-character hex digest");
    });

    it("supports multi-signature rotation headers where candidate contains both old and new signatures", () => {
      const nowMs = 1730462400000;
      const timestamp = "1730462400";
      const rawBody = JSON.stringify(SAMPLE_PAYLOAD);

      const activeSig = computeReleaseSignature({
        payload: rawBody,
        secret: TEST_SECRET,
        timestamp,
        bound: true,
      });

      const oldSig = computeReleaseSignature({
        payload: rawBody,
        secret: "old_deprecated_secret_01234567890123456789",
        timestamp,
        bound: true,
      });

      // Space-separated multiple signatures
      const rotatedHeaderValue = `${oldSig} ${activeSig}`;

      const result = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers: {
          "x-release-timestamp": timestamp,
          "x-release-signature": rotatedHeaderValue,
        },
        secret: TEST_SECRET,
        now: nowMs,
      });

      expect(result.valid).toBe(true);
      expect(result.status).toBe(200);
      expect(verifyReleaseSignature({
        payload: rawBody,
        headers: {
          "x-release-timestamp": timestamp,
          "x-release-signature": rotatedHeaderValue,
        },
        secret: TEST_SECRET,
        now: nowMs,
      })).toBe(true);
    });
  });

  // ==========================================================================
  // Dimension 2: Anti-Replay Refresh During Severe Retry Backoff
  // ==========================================================================
  describe("2. Anti-Replay Refresh During Severe Retry Backoff", () => {
    it("regenerates fresh timestamp and signature on EVERY retry attempt across long backoffs", async () => {
      let simulatedTimeMs = 1730462400000; // t = 0
      const recordedAttempts: Array<{
        attemptIndex: number;
        timestampHeader: string;
        signatureHeader: string;
        body: string;
        simulatedInstant: number;
      }> = [];

      const mockFetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        const headers = init.headers as Record<string, string>;
        recordedAttempts.push({
          attemptIndex: recordedAttempts.length + 1,
          timestampHeader: headers["x-release-timestamp"],
          signatureHeader: headers["x-release-signature"],
          body: init.body as string,
          simulatedInstant: simulatedTimeMs,
        });

        // Fail first 2 attempts with HTTP 503, succeed on attempt 3
        if (recordedAttempts.length < 3) {
          return createMockResponse({
            status: 503,
            statusText: "Service Unavailable",
            body: { error: "Temporary SQS backpressure" },
          });
        }

        return createMockResponse({
          status: 200,
          body: { queued: true, messageId: "sqs-success-998877" },
        });
      });

      // Advance clock significantly between sleep delays to simulate multi-minute congestion
      const mockSleep = vi.fn().mockImplementation(async () => {
        simulatedTimeMs += 120_000; // Advance simulated clock by 2 minutes (120 seconds) per retry!
      });

      const config: DispatchConfig = {
        appUrl: "https://system-simulator.internal",
        releaseSecret: TEST_SECRET,
        maxRetries: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 1000,
      };

      const deps: DispatchDependencies = {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
        logger: createSilentLogger(),
        now: () => simulatedTimeMs,
      };

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, deps);

      // Verify dispatch result
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.attempts).toBe(3);
      expect(result.messageId).toBe("sqs-success-998877");

      // Verify 3 distinct attempts were made
      expect(recordedAttempts).toHaveLength(3);

      // Verify attempt 1 was at t=0
      expect(recordedAttempts[0].timestampHeader).toBe("1730462400");
      // Verify attempt 2 was at t=+120s
      expect(recordedAttempts[1].timestampHeader).toBe("1730462520");
      // Verify attempt 3 was at t=+240s
      expect(recordedAttempts[2].timestampHeader).toBe("1730462640");

      // Verify every attempt's signature was unique and valid for that exact instant
      const sig1 = recordedAttempts[0].signatureHeader;
      const sig2 = recordedAttempts[1].signatureHeader;
      const sig3 = recordedAttempts[2].signatureHeader;

      expect(sig1).not.toBe(sig2);
      expect(sig2).not.toBe(sig3);

      for (const attempt of recordedAttempts) {
        const verification = verifyReleaseSignatureDetailed({
          payload: attempt.body,
          headers: {
            "x-release-timestamp": attempt.timestampHeader,
            "x-release-signature": attempt.signatureHeader,
          },
          secret: TEST_SECRET,
          now: attempt.simulatedInstant,
        });
        expect(verification.valid).toBe(true);
        expect(verification.status).toBe(200);
      }
    });

    it("demonstrates catastrophic replay failure if timestamp had NOT been refreshed", () => {
      const initialTimestampMs = 1730462400000; // t = 0
      const initialHeaders = generateReleaseHeaders(SAMPLE_PAYLOAD, TEST_SECRET, initialTimestampMs);

      // Simulate a server receiving the request at t = +350s (after cumulative retry delays)
      const delayedServerTimeMs = initialTimestampMs + 350_000;

      // Reusing initial timestamp against server time triggers replay detection (401)
      const staleVerification = verifyReleaseSignatureDetailed({
        payload: initialHeaders.rawBody,
        headers: initialHeaders.headers,
        secret: TEST_SECRET,
        now: delayedServerTimeMs,
      });

      expect(staleVerification.valid).toBe(false);
      expect(staleVerification.status).toBe(401);
      expect(staleVerification.error).toContain("Timestamp expired / replay detected");

      // But refreshing with current server time succeeds
      const refreshedHeaders = generateReleaseHeaders(SAMPLE_PAYLOAD, TEST_SECRET, delayedServerTimeMs);
      const freshVerification = verifyReleaseSignatureDetailed({
        payload: refreshedHeaders.rawBody,
        headers: refreshedHeaders.headers,
        secret: TEST_SECRET,
        now: delayedServerTimeMs,
      });

      expect(freshVerification.valid).toBe(true);
      expect(freshVerification.status).toBe(200);
    });
  });

  // ==========================================================================
  // Dimension 3: Network Chaos & Non-JSON Server Responses
  // ==========================================================================
  describe("3. Network Chaos & Non-JSON Server Responses", () => {
    it("handles DNS resolution failures gracefully with retries and clean error report", async () => {
      const mockSleep = vi.fn().mockResolvedValue(undefined);
      const dnsError = new TypeError("fetch failed");
      (dnsError as unknown as { cause: { code: string; syscall: string } }).cause = {
        code: "ENOTFOUND",
        syscall: "getaddrinfo",
      };

      const mockFetch = vi.fn().mockRejectedValue(dnsError);

      const config: DispatchConfig = {
        appUrl: "https://unreachable-dns-domain-1234567.org",
        releaseSecret: TEST_SECRET,
        maxRetries: 3,
        initialDelayMs: 10,
        backoffFactor: 2,
        maxDelayMs: 50,
      };

      const deps: DispatchDependencies = {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
        logger: createSilentLogger(),
      };

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, deps);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(4); // Initial + 3 retries
      expect(result.error).toContain("Network failure: fetch failed");
      expect(mockSleep).toHaveBeenCalledTimes(3);
    });

    it("handles TCP socket timeouts and abrupt connection resets (ECONNRESET)", async () => {
      let callCount = 0;
      const mockSleep = vi.fn().mockResolvedValue(undefined);

      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("connect ETIMEDOUT 10.0.0.1:443");
        }
        if (callCount === 2) {
          throw new Error("read ECONNRESET");
        }
        // Succeeds on attempt 3
        return createMockResponse({
          status: 200,
          body: { queued: true, messageId: "recovered-after-reset" },
        });
      });

      const config: DispatchConfig = {
        appUrl: "https://system-simulator.internal",
        releaseSecret: TEST_SECRET,
        maxRetries: 3,
        initialDelayMs: 5,
        backoffFactor: 2,
      };

      const deps: DispatchDependencies = {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
        logger: createSilentLogger(),
      };

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, deps);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(result.messageId).toBe("recovered-after-reset");
      expect(mockSleep).toHaveBeenCalledTimes(2);
    });

    it("survives HTTP 502 Bad Gateway returning raw HTML without uncaught JSON parse crash", async () => {
      const mockSleep = vi.fn().mockResolvedValue(undefined);
      const html502 = "<!DOCTYPE html><html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center><hr><center>cloudflare</center></body></html>";

      // Simulates reverse proxy returning 502 with HTML payload
      const mockFetch = vi.fn().mockImplementation(async () => {
        return createMockResponse({
          status: 502,
          statusText: "Bad Gateway",
          rawText: html502,
          isJson: false,
        });
      });

      const config: DispatchConfig = {
        appUrl: "https://system-simulator.internal",
        releaseSecret: TEST_SECRET,
        maxRetries: 2,
        initialDelayMs: 5,
      };

      const deps: DispatchDependencies = {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
        logger: createSilentLogger(),
      };

      // Must NOT throw SyntaxError: Unexpected token < in JSON at position 0
      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, deps);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(502);
      expect(result.attempts).toBe(3); // 1 initial + 2 retries
      expect(result.error).toBe("Server error HTTP 502");
      expect(mockSleep).toHaveBeenCalledTimes(2);
    });

    it("survives HTTP 504 Gateway Timeout returning raw plain text or empty body", async () => {
      const mockSleep = vi.fn().mockResolvedValue(undefined);

      const mockFetch = vi.fn().mockImplementation(async () => {
        return createMockResponse({
          status: 504,
          statusText: "Gateway Time-out",
          rawText: "504 Gateway Time-out\nnginx/1.24.0",
          isJson: false,
        });
      });

      const config: DispatchConfig = {
        appUrl: "https://system-simulator.internal",
        releaseSecret: TEST_SECRET,
        maxRetries: 1,
        initialDelayMs: 5,
      };

      const deps: DispatchDependencies = {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
        logger: createSilentLogger(),
      };

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, deps);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(504);
      expect(result.attempts).toBe(2);
      expect(result.error).toBe("Server error HTTP 504");
    });
  });

  // ==========================================================================
  // Dimension 4: Status Code Invariants & Concurrency
  // ==========================================================================
  describe("4. Status Code Invariants & Concurrency", () => {
    it("handles HTTP 200 (queued) as successful", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse({
          status: 200,
          body: { queued: true, messageId: "sqs-msg-1001" },
        })
      );

      const result = await dispatchEpisodeRelease(
        SAMPLE_PAYLOAD,
        { appUrl: "https://api.test", releaseSecret: TEST_SECRET },
        { fetchFn: mockFetch as unknown as typeof fetch, logger: createSilentLogger() }
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.messageId).toBe("sqs-msg-1001");
      expect(result.attempts).toBe(1);
    });

    it("handles HTTP 200 (already_published) idempotently as successful", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse({
          status: 200,
          body: { status: "already_published", message: "Episode already published previously" },
        })
      );

      const result = await dispatchEpisodeRelease(
        SAMPLE_PAYLOAD,
        { appUrl: "https://api.test", releaseSecret: TEST_SECRET },
        { fetchFn: mockFetch as unknown as typeof fetch, logger: createSilentLogger() }
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.alreadyPublished).toBe(true);
      expect(result.attempts).toBe(1);
    });

    it("handles HTTP 202 (secondary enqueue with deferred DB upsert) as successful", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse({
          status: 202,
          body: {
            queued: true,
            warning: "Database record creation deferred to Lambda worker fallback",
            messageId: "sqs-msg-deferred-55",
          },
        })
      );

      const result = await dispatchEpisodeRelease(
        SAMPLE_PAYLOAD,
        { appUrl: "https://api.test", releaseSecret: TEST_SECRET },
        { fetchFn: mockFetch as unknown as typeof fetch, logger: createSilentLogger() }
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(202);
      expect(result.messageId).toBe("sqs-msg-deferred-55");
      expect(result.attempts).toBe(1);
    });

    it("fails fast with 0 retries on permanent client errors (HTTP 400, 401, 403, 404, 422)", async () => {
      const clientErrorCodes = [400, 401, 403, 404, 422];

      for (const code of clientErrorCodes) {
        const mockSleep = vi.fn();
        const mockFetch = vi.fn().mockResolvedValue(
          createMockResponse({
            status: code,
            statusText: `Client Error ${code}`,
            body: { error: `Validation or auth failed with code ${code}` },
          })
        );

        const result = await dispatchEpisodeRelease(
          SAMPLE_PAYLOAD,
          { appUrl: "https://api.test", releaseSecret: TEST_SECRET, maxRetries: 3 },
          {
            fetchFn: mockFetch as unknown as typeof fetch,
            sleepFn: mockSleep,
            logger: createSilentLogger(),
          }
        );

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(code);
        expect(result.attempts).toBe(1); // STRICT: exactly 1 attempt, 0 retries!
        expect(mockSleep).not.toHaveBeenCalled();
        expect(result.error).toContain(`Validation or auth failed with code ${code}`);
      }
    });

    it("retries on HTTP 429 Rate Limit (transient) unlike other 4xx errors", async () => {
      let attempts = 0;
      const mockSleep = vi.fn().mockResolvedValue(undefined);

      const mockFetch = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          return createMockResponse({
            status: 429,
            statusText: "Too Many Requests",
            body: { error: "Rate limit exceeded" },
          });
        }
        return createMockResponse({
          status: 200,
          body: { queued: true, messageId: "sqs-after-rate-limit" },
        });
      });

      const result = await dispatchEpisodeRelease(
        SAMPLE_PAYLOAD,
        { appUrl: "https://api.test", releaseSecret: TEST_SECRET, maxRetries: 3, initialDelayMs: 10 },
        {
          fetchFn: mockFetch as unknown as typeof fetch,
          sleepFn: mockSleep,
          logger: createSilentLogger(),
        }
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(result.messageId).toBe("sqs-after-rate-limit");
      expect(mockSleep).toHaveBeenCalledTimes(2);
    });

    it("verifies partial batch failures in dispatchAllEpisodes: 1 failure completes all N dispatches without early termination", async () => {
      const episode1: FanoutMessagePayload = {
        ...SAMPLE_PAYLOAD,
        episodeId: "ep-1-success",
        title: "Episode 1 Success",
      };
      const episode2: FanoutMessagePayload = {
        ...SAMPLE_PAYLOAD,
        episodeId: "ep-2-failed",
        title: "Episode 2 Failure",
      };
      const episode3: FanoutMessagePayload = {
        ...SAMPLE_PAYLOAD,
        episodeId: "ep-3-deferred",
        title: "Episode 3 Deferred DB",
      };
      const episode4: FanoutMessagePayload = {
        ...SAMPLE_PAYLOAD,
        episodeId: "ep-4-already-pub",
        title: "Episode 4 Already Published",
      };

      const episodes = [episode1, episode2, episode3, episode4];

      const mockFetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        const bodyStr = init.body as string;
        if (bodyStr.includes("ep-1-success")) {
          return createMockResponse({
            status: 200,
            body: { queued: true, messageId: "msg-1" },
          });
        }
        if (bodyStr.includes("ep-2-failed")) {
          // Fails fast with 400
          return createMockResponse({
            status: 400,
            statusText: "Bad Request",
            body: { error: "Corrupted schema payload" },
          });
        }
        if (bodyStr.includes("ep-3-deferred")) {
          return createMockResponse({
            status: 202,
            body: { queued: true, messageId: "msg-3" },
          });
        }
        if (bodyStr.includes("ep-4-already-pub")) {
          return createMockResponse({
            status: 200,
            body: { status: "already_published" },
          });
        }
        throw new Error("Unexpected payload in mock");
      });

      const config: DispatchConfig = {
        appUrl: "https://api.test",
        releaseSecret: TEST_SECRET,
        maxRetries: 2,
      };

      const batchResult = await dispatchAllEpisodes(episodes, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
        logger: createSilentLogger(),
      });

      // Overall batch must report failure
      expect(batchResult.success).toBe(false);

      // But ALL 4 dispatches MUST have been executed to completion
      expect(batchResult.results).toHaveLength(4);

      expect(batchResult.results[0]).toMatchObject({
        episodeId: "ep-1-success",
        success: true,
        statusCode: 200,
        messageId: "msg-1",
      });

      expect(batchResult.results[1]).toMatchObject({
        episodeId: "ep-2-failed",
        success: false,
        statusCode: 400,
        error: "Corrupted schema payload",
      });

      expect(batchResult.results[2]).toMatchObject({
        episodeId: "ep-3-deferred",
        success: true,
        statusCode: 202,
        messageId: "msg-3",
      });

      expect(batchResult.results[3]).toMatchObject({
        episodeId: "ep-4-already-pub",
        success: true,
        statusCode: 200,
        alreadyPublished: true,
      });

      // Confirm mock was called 4 times
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});
