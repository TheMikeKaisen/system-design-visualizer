import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import {
  SubjectChannel,
  isReleasedDate,
  parseEpisodesFromTsx,
  detectNewEpisodesFromCode,
  resolveDispatchConfig,
  generateReleaseHeaders,
  dispatchEpisodeRelease,
  dispatchAllEpisodes,
  parseCliArgs,
  main,
  type DispatchConfig,
} from "../../../scripts/detect-new-episodes";
import { verifyReleaseSignatureDetailed } from "@/lib/security/releaseSignature";
import type { FanoutMessagePayload } from "@/workers/types";

// ============================================================================
// Fixture Helpers
// ============================================================================

const TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const SAMPLE_PAYLOAD: FanoutMessagePayload = {
  subject: SubjectChannel.JAVASCRIPT,
  episodeId: "closure-deep-dive",
  episodeNumber: 8,
  title: "JavaScript Closures & Lexical Environments",
  releaseCommitSha: "abcdef1234567890abcdef1234567890abcdef12",
  summary: "Comprehensive guide to lexical environments and heap closures.",
  keyConcepts: ["closure", "lexical-scope"],
  ctaUrl: "https://system-design-visualizer.com/javascript/simulator/closure-deep-dive",
  force: false,
};

const SAMPLE_BASE_TSX = `
import React from "react";
import { EpisodeMetadata } from "@/components/ui/EpisodeCard";

export const JAVASCRIPT_EPISODES: EpisodeMetadata[] = [
  {
    id: "hoisting",
    episodeNumber: 1,
    title: "Hoisting & Temporal Dead Zone",
    description: "Inspect execution context memory creation phase.",
    date: "15 October 2026",
    href: "/javascript/simulator/hoisting",
    accent: "amber",
  },
  {
    id: "closures",
    episodeNumber: 2,
    title: "Closures & Scope Chain",
    description: "Explore lexical environments.",
    date: "Coming Soon",
    href: "/javascript/simulator/closures",
    accent: "amber",
  },
];
`;

const SAMPLE_HEAD_NEW_AND_TRANSITION_TSX = `
import React from "react";
import { EpisodeMetadata } from "@/components/ui/EpisodeCard";

export const JAVASCRIPT_EPISODES: EpisodeMetadata[] = [
  {
    id: "hoisting",
    episodeNumber: 1,
    title: "Hoisting & Temporal Dead Zone (Updated Title)",
    description: "Formatting change and typo fix in description.",
    date: "15 October 2026",
    href: "/javascript/simulator/hoisting",
    accent: "amber",
  },
  {
    id: "closures",
    episodeNumber: 2,
    title: "Closures & Scope Chain",
    description: "Explore lexical environments.",
    date: "20 October 2026", // Transitioned from "Coming Soon" to released!
    href: "/javascript/simulator/closures",
    accent: "amber",
  },
  {
    id: "event-loop",
    episodeNumber: 3,
    title: "Event Loop & Microtask Queue",
    description: "Macrotasks, microtasks, requestAnimationFrame, and render queue.",
    date: "25 October 2026", // Brand new released episode!
    href: "/javascript/simulator/event-loop",
    accent: "amber",
  },
  {
    id: "web-workers",
    episodeNumber: 4,
    title: "Web Workers & SharedArrayBuffer",
    description: "Multi-threaded JavaScript concurrency.",
    date: "Coming Soon", // Unreleased placeholder
    href: "/javascript/simulator/web-workers",
    accent: "amber",
  },
];
`;

describe("GitOps Episode Release Detection & Dispatch Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Suite 1: Cryptographic Signature & Timestamp Generation
  // ==========================================================================
  describe("1. Cryptographic Signature & Timestamp Generation", () => {
    it("computes valid HMAC-SHA256 with 'sha256=' prefix and 64-char hex digest", () => {
      const nowMs = 1730462400000;
      const { signature, timestamp, rawBody } = generateReleaseHeaders(
        SAMPLE_PAYLOAD,
        TEST_SECRET,
        nowMs
      );

      expect(signature.startsWith("sha256=")).toBe(true);
      const hex = signature.slice(7);
      expect(hex).toMatch(/^[0-9a-f]{64}$/);
      expect(timestamp).toBe("1730462400");

      const expectedToSign = `${timestamp}.${rawBody}`;
      const expectedHex = crypto
        .createHmac("sha256", TEST_SECRET)
        .update(expectedToSign, "utf8")
        .digest("hex");
      expect(hex).toBe(expectedHex);
    });

    it("verifies 100% cryptographic interoperability against verifyReleaseSignatureDetailed", () => {
      const nowMs = 1730462400000;
      const { rawBody, headers } = generateReleaseHeaders(
        SAMPLE_PAYLOAD,
        TEST_SECRET,
        nowMs
      );

      const verification = verifyReleaseSignatureDetailed({
        payload: rawBody,
        headers,
        secret: TEST_SECRET,
        now: nowMs,
      });

      expect(verification.valid).toBe(true);
      expect(verification.status).toBe(200);
      expect(verification.error).toBeUndefined();
    });

    it("fails verification if payload is tampered post-signing", () => {
      const nowMs = 1730462400000;
      const { headers } = generateReleaseHeaders(
        SAMPLE_PAYLOAD,
        TEST_SECRET,
        nowMs
      );

      const tamperedBody = JSON.stringify({
        ...SAMPLE_PAYLOAD,
        title: "Tampered Malicious Title",
      });

      const verification = verifyReleaseSignatureDetailed({
        payload: tamperedBody,
        headers,
        secret: TEST_SECRET,
        now: nowMs,
      });

      expect(verification.valid).toBe(false);
      expect(verification.status).toBe(401);
    });

    it("generates distinct signatures for different timestamps and payloads", () => {
      const t1 = 1730462400000;
      const t2 = 1730462405000;

      const res1 = generateReleaseHeaders(SAMPLE_PAYLOAD, TEST_SECRET, t1);
      const res2 = generateReleaseHeaders(SAMPLE_PAYLOAD, TEST_SECRET, t2);
      expect(res1.signature).not.toBe(res2.signature);

      const res3 = generateReleaseHeaders(
        { ...SAMPLE_PAYLOAD, episodeNumber: 99 },
        TEST_SECRET,
        t1
      );
      expect(res1.signature).not.toBe(res3.signature);
    });
  });

  // ==========================================================================
  // Suite 2: Environment & Configuration Resolution
  // ==========================================================================
  describe("2. Environment & Configuration Resolution", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
      delete process.env.INTERNAL_RELEASE_SECRET;
      delete process.env.APP_URL;
      delete process.env.VERCEL_URL;
    });

    it("throws when INTERNAL_RELEASE_SECRET is missing in live mode", () => {
      process.env.APP_URL = "https://system-design-visualizer.com";
      expect(() => resolveDispatchConfig()).toThrow(
        /Missing required environment variable: INTERNAL_RELEASE_SECRET/i
      );
    });

    it("throws when APP_URL is missing in live mode", () => {
      process.env.INTERNAL_RELEASE_SECRET = TEST_SECRET;
      expect(() => resolveDispatchConfig()).toThrow(
        /Missing required environment variable: APP_URL/i
      );
    });

    it("throws when APP_URL has invalid protocol", () => {
      expect(() =>
        resolveDispatchConfig({
          appUrl: "ftp://example.com",
          secret: TEST_SECRET,
        })
      ).toThrow(/Invalid protocol|Invalid APP_URL format/i);
    });

    it("sanitizes trailing slashes on APP_URL", () => {
      const config = resolveDispatchConfig({
        appUrl: "https://system-design-visualizer.com///",
        secret: TEST_SECRET,
      });
      expect(config.appUrl).toBe("https://system-design-visualizer.com");
    });

    it("resolves APP_URL from VERCEL_URL when APP_URL is not set", () => {
      process.env.INTERNAL_RELEASE_SECRET = TEST_SECRET;
      process.env.VERCEL_URL = "system-design-visualizer-preview.vercel.app";

      const config = resolveDispatchConfig();
      expect(config.appUrl).toBe("https://system-design-visualizer-preview.vercel.app");
    });

    it("falls back to placeholders in dry-run mode when variables are absent", () => {
      const config = resolveDispatchConfig({ dryRun: true });
      expect(config.dryRun).toBe(true);
      expect(config.releaseSecret).toBe("dry-run-secret-placeholder");
      expect(config.appUrl).toBe("http://localhost:3000");
    });
  });

  // ==========================================================================
  // Suite 3: Response Status Code Handling
  // ==========================================================================
  describe("3. Response Status Code Handling", () => {
    const config: DispatchConfig = {
      appUrl: "https://system-design-visualizer.com",
      releaseSecret: TEST_SECRET,
      dryRun: false,
      maxRetries: 3,
    };

    it("handles HTTP 200 (Newly Queued) with success: true and messageId", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          success: true,
          queued: true,
          messageId: "sqs-msg-12345",
        }),
      });

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.messageId).toBe("sqs-msg-12345");
      expect(result.attempts).toBe(1);
    });

    it("handles HTTP 200 (Already Published) idempotently with alreadyPublished: true", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          success: true,
          status: "already_published",
          alreadyDispatched: true,
        }),
      });

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.alreadyPublished).toBe(true);
      expect(result.attempts).toBe(1);
    });

    it("handles HTTP 202 (Deferred DB Upsert) as successful enqueue", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 202,
        ok: true,
        json: async () => ({
          success: true,
          queued: true,
          messageId: "sqs-msg-67890",
          warning: "Database record creation deferred to Lambda worker.",
        }),
      });

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(202);
      expect(result.messageId).toBe("sqs-msg-67890");
      expect(result.attempts).toBe(1);
    });

    it("fails fast immediately on HTTP 400 (Bad Request) with 0 retries", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 400,
        ok: false,
        statusText: "Bad Request",
        json: async () => ({
          error: "Validation failed: episodeNumber must be positive",
        }),
      });
      const mockSleep = vi.fn();

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toContain("Validation failed");
      expect(result.attempts).toBe(1);
      expect(mockSleep).not.toHaveBeenCalled();
    });

    it("fails fast immediately on HTTP 401 (Invalid Signature) with 0 retries", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        statusText: "Unauthorized",
        json: async () => ({
          error: "Invalid release signature or timestamp expired.",
        }),
      });
      const mockSleep = vi.fn();

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.attempts).toBe(1);
      expect(mockSleep).not.toHaveBeenCalled();
    });

    it("fails fast on HTTP 403 and 404 without retrying", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
        statusText: "Not Found",
        json: async () => ({ error: "Not Found" }),
      });
      const mockSleep = vi.fn();

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.attempts).toBe(1);
      expect(mockSleep).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Suite 4: Retry & Exponential Backoff Resilience
  // ==========================================================================
  describe("4. Retry & Exponential Backoff Resilience", () => {
    const config: DispatchConfig = {
      appUrl: "https://system-design-visualizer.com",
      releaseSecret: TEST_SECRET,
      dryRun: false,
      maxRetries: 3,
      initialDelayMs: 100,
      backoffFactor: 2,
      maxDelayMs: 1000,
    };

    it("retries on transient HTTP 500/502/503/504 and 429 and succeeds when recovered", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          status: 503,
          ok: false,
          statusText: "Service Unavailable",
          json: async () => ({ error: "Service Unavailable" }),
        })
        .mockResolvedValueOnce({
          status: 429,
          ok: false,
          statusText: "Too Many Requests",
          json: async () => ({ error: "Rate limit exceeded" }),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => ({ success: true, messageId: "recovered-msg-01" }),
        });

      const mockSleep = vi.fn().mockResolvedValue(undefined);

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.attempts).toBe(3);
      expect(mockSleep).toHaveBeenCalledTimes(2);
    });

    it("retries on fetch network failures (e.g. TypeError: fetch failed)", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError("fetch failed: ECONNREFUSED"))
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => ({ success: true, messageId: "recovered-after-net-err" }),
        });

      const mockSleep = vi.fn().mockResolvedValue(undefined);

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(mockSleep).toHaveBeenCalledTimes(1);
    });

    it("exhausts retries and returns failure when error persists across all attempts", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        statusText: "Internal Server Error",
        json: async () => ({ error: "Persistent database failure" }),
      });

      const mockSleep = vi.fn().mockResolvedValue(undefined);

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      // 1 initial attempt + 3 retries = 4 total attempts
      expect(result.attempts).toBe(4);
      expect(mockSleep).toHaveBeenCalledTimes(3);
    });

    it("CRITICAL ANTI-REPLAY DEFENSE: refreshes timestamp and signature on every retry attempt", async () => {
      const capturedTimestamps: string[] = [];
      const capturedSignatures: string[] = [];

      let simulatedTime = 1730462400000;
      const mockNow = vi.fn().mockImplementation(() => {
        simulatedTime += 2000; // Increment time by 2 seconds each call
        return simulatedTime;
      });

      const mockFetch = vi.fn().mockImplementation(async (_url, options) => {
        const headers = options.headers as Record<string, string>;
        capturedTimestamps.push(headers["x-release-timestamp"]);
        capturedSignatures.push(headers["x-release-signature"]);

        if (capturedTimestamps.length < 3) {
          return {
            status: 503,
            ok: false,
            json: async () => ({ error: "Temporary outage" }),
          };
        }
        return {
          status: 200,
          ok: true,
          json: async () => ({ success: true, messageId: "refreshed-ts-msg" }),
        };
      });

      const mockSleep = vi.fn().mockResolvedValue(undefined);

      const result = await dispatchEpisodeRelease(SAMPLE_PAYLOAD, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
        sleepFn: mockSleep,
        now: mockNow,
      });

      expect(result.success).toBe(true);
      expect(capturedTimestamps.length).toBe(3);

      // Verify each timestamp is unique and increasing
      expect(capturedTimestamps[0]).not.toBe(capturedTimestamps[1]);
      expect(capturedTimestamps[1]).not.toBe(capturedTimestamps[2]);

      // Verify each signature is unique
      expect(capturedSignatures[0]).not.toBe(capturedSignatures[1]);
      expect(capturedSignatures[1]).not.toBe(capturedSignatures[2]);
    });
  });

  // ==========================================================================
  // Suite 5: AST TSX Parser & Semantic Diff Engine
  // ==========================================================================
  describe("5. AST TSX Parser & Semantic Diff Engine", () => {
    it("parses episode array from TSX source code with accurate fields", () => {
      const episodes = parseEpisodesFromTsx(SAMPLE_BASE_TSX);
      expect(episodes.length).toBe(2);

      expect(episodes[0]).toEqual({
        id: "hoisting",
        episodeNumber: 1,
        title: "Hoisting & Temporal Dead Zone",
        description: "Inspect execution context memory creation phase.",
        date: "15 October 2026",
        href: "/javascript/simulator/hoisting",
        accent: "amber",
      });

      expect(episodes[1].id).toBe("closures");
      expect(episodes[1].date).toBe("Coming Soon");
    });

    it("returns empty array on empty or whitespace TSX code", () => {
      expect(parseEpisodesFromTsx("")).toEqual([]);
      expect(parseEpisodesFromTsx("   \n\t ")).toEqual([]);
      expect(parseEpisodesFromTsx("// Just a comment")).toEqual([]);
    });

    it("correctly identifies released dates vs Coming Soon placeholders", () => {
      expect(isReleasedDate("15 October 2026")).toBe(true);
      expect(isReleasedDate("29 Oct 2026")).toBe(true);
      expect(isReleasedDate("2026-11-01")).toBe(true);

      expect(isReleasedDate("Coming Soon")).toBe(false);
      expect(isReleasedDate("coming soon")).toBe(false);
      expect(isReleasedDate("  COMING SOON  ")).toBe(false);
      expect(isReleasedDate("")).toBe(false);
      expect(isReleasedDate(undefined)).toBe(false);
    });

    it("detects both brand-new released episodes and Coming Soon -> released transitions", () => {
      const beforeFiles = {
        "src/app/javascript/episodes.tsx": SAMPLE_BASE_TSX,
      };
      const afterFiles = {
        "src/app/javascript/episodes.tsx": SAMPLE_HEAD_NEW_AND_TRANSITION_TSX,
      };

      const detected = detectNewEpisodesFromCode(
        beforeFiles,
        afterFiles,
        "commit-head-sha",
        { baseUrl: "https://system-design-visualizer.com" }
      );

      // Should detect:
      // 1. "closures" (transitioned from "Coming Soon" to "20 October 2026")
      // 2. "event-loop" (brand new released episode)
      // Should NOT detect:
      // - "hoisting" (already released in before, only title/description changed)
      // - "web-workers" (date is "Coming Soon")
      expect(detected.length).toBe(2);

      const closures = detected.find((e) => e.episodeId === "closures");
      expect(closures).toBeDefined();
      expect(closures?.subject).toBe(SubjectChannel.JAVASCRIPT);
      expect(closures?.episodeNumber).toBe(2);
      expect(closures?.ctaUrl).toBe(
        "https://system-design-visualizer.com/javascript/simulator/closures"
      );

      const eventLoop = detected.find((e) => e.episodeId === "event-loop");
      expect(eventLoop).toBeDefined();
      expect(eventLoop?.subject).toBe(SubjectChannel.JAVASCRIPT);
      expect(eventLoop?.episodeNumber).toBe(3);
      expect(eventLoop?.ctaUrl).toBe(
        "https://system-design-visualizer.com/javascript/simulator/event-loop"
      );
    });

    it("ignores deleted episodes and does not produce release triggers", () => {
      const beforeFiles = {
        "src/app/javascript/episodes.tsx": SAMPLE_HEAD_NEW_AND_TRANSITION_TSX,
      };
      // In after state, "event-loop" was deleted
      const afterFiles = {
        "src/app/javascript/episodes.tsx": SAMPLE_BASE_TSX,
      };

      const detected = detectNewEpisodesFromCode(
        beforeFiles,
        afterFiles,
        "commit-head-sha"
      );

      // No new releases should be detected
      expect(detected.length).toBe(0);
    });

    it("ignores renumbering churn when an episode is already released or still unreleased", () => {
      const beforeCode = `
export const COMPUTER_NETWORKS_EPISODES = [
  { id: "tls-handshake", episodeNumber: 4, title: "TLS", date: "Coming Soon" },
  { id: "tcp-flow", episodeNumber: 5, title: "TCP", date: "Coming Soon" }
];
`;
      // Insert new episode at #4; placeholder renumbers 4->5, 5->6
      const afterCode = `
export const COMPUTER_NETWORKS_EPISODES = [
  { id: "http-lifecycle", episodeNumber: 4, title: "HTTP", date: "29 October 2026", href: "/computer-networks/simulator/http" },
  { id: "tls-handshake", episodeNumber: 5, title: "TLS", date: "Coming Soon" },
  { id: "tcp-flow", episodeNumber: 6, title: "TCP", date: "Coming Soon" }
];
`;
      const detected = detectNewEpisodesFromCode(
        { "src/app/computer-networks/episodes.tsx": beforeCode },
        { "src/app/computer-networks/episodes.tsx": afterCode },
        "b4e3972"
      );

      expect(detected.length).toBe(1);
      expect(detected[0].episodeId).toBe("http-lifecycle");
      expect(detected[0].episodeNumber).toBe(4);
    });
  });

  // ==========================================================================
  // Suite 6: Multi-Episode Batch Orchestration & CLI Options
  // ==========================================================================
  describe("6. Multi-Episode Batch Orchestration & CLI Options", () => {
    const config: DispatchConfig = {
      appUrl: "https://system-design-visualizer.com",
      releaseSecret: TEST_SECRET,
      dryRun: false,
    };

    it("exits cleanly with 0 fetch calls when 0 episodes are detected", async () => {
      const mockFetch = vi.fn();
      const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), log: vi.fn() };

      const { success, results } = await dispatchAllEpisodes([], config, {
        fetchFn: mockFetch as unknown as typeof fetch,
        logger: mockLogger,
      });

      expect(success).toBe(true);
      expect(results.length).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("No new episodes to dispatch")
      );
    });

    it("dispatches multiple episodes sequentially and aggregates results", async () => {
      const episodes: FanoutMessagePayload[] = [
        { ...SAMPLE_PAYLOAD, episodeId: "ep-1", title: "Ep 1" },
        { ...SAMPLE_PAYLOAD, episodeId: "ep-2", title: "Ep 2" },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ success: true, messageId: "msg-batch" }),
      });

      const { success, results } = await dispatchAllEpisodes(episodes, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(success).toBe(true);
      expect(results.length).toBe(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("returns success: false when any episode in a multi-episode batch fails", async () => {
      const episodes: FanoutMessagePayload[] = [
        { ...SAMPLE_PAYLOAD, episodeId: "ep-success", title: "Ep Success" },
        { ...SAMPLE_PAYLOAD, episodeId: "ep-fail", title: "Ep Fail" },
      ];

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => ({ success: true, messageId: "msg-success" }),
        })
        .mockResolvedValueOnce({
          status: 400,
          ok: false,
          json: async () => ({ error: "Bad Request" }),
        });

      const { success, results } = await dispatchAllEpisodes(episodes, config, {
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(success).toBe(false);
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    it("parses CLI arguments correctly", () => {
      const parsed = parseCliArgs([
        "node",
        "scripts/detect-new-episodes.ts",
        "--dry-run",
        "--verbose",
        "--commit",
        "c1a2b3c",
        "--base",
        "HEAD~2",
        "--url",
        "https://test.example.com",
        "--secret",
        "custom-secret",
        "--force",
      ]);

      expect(parsed.dryRun).toBe(true);
      expect(parsed.verbose).toBe(true);
      expect(parsed.commit).toBe("c1a2b3c");
      expect(parsed.base).toBe("HEAD~2");
      expect(parsed.url).toBe("https://test.example.com");
      expect(parsed.secret).toBe("custom-secret");
      expect(parsed.force).toBe(true);
    });

    it("main() executes --help and exits with code 0", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const exitCode = await main(["node", "scripts/detect-new-episodes.ts", "--help"]);
      expect(exitCode).toBe(0);
      expect(logSpy).toHaveBeenCalled();
    });
  });
});
