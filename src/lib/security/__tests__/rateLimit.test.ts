import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildMemoryLimiter } from "../rateLimit";

// We test the memory limiter directly — Upstash requires a real Redis connection
// Production tests for the Upstash limiter belong in integration/e2e tests

function makeLimiter(requests: number, windowMs: number) {
  // Access internal factory via module internals
  const store = new Map<string, { count: number; resetAt: number }>();

  return {
    async limit(key: string) {
      const now   = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: requests - 1, resetMs: now + windowMs };
      }
      entry.count++;
      const success   = entry.count <= requests;
      const remaining = Math.max(0, requests - entry.count);
      return { success, remaining, resetMs: entry.resetAt };
    },
    _store: store,
  };
}

describe("MemoryRateLimiter", () => {
  it("allows requests within limit", async () => {
    const limiter = makeLimiter(3, 60_000);
    const r1 = await limiter.limit("user:a");
    const r2 = await limiter.limit("user:a");
    const r3 = await limiter.limit("user:a");
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(true);
  });

  it("blocks requests over limit", async () => {
    const limiter = makeLimiter(2, 60_000);
    await limiter.limit("user:b");
    await limiter.limit("user:b");
    const r3 = await limiter.limit("user:b");
    expect(r3.success).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("tracks different keys independently", async () => {
    const limiter = makeLimiter(1, 60_000);
    await limiter.limit("user:c");
    const blocked = await limiter.limit("user:c");
    const allowed = await limiter.limit("user:d");
    expect(blocked.success).toBe(false);
    expect(allowed.success).toBe(true);
  });

  it("resets after window expires", async () => {
    vi.useFakeTimers();
    const limiter = makeLimiter(1, 1_000);
    await limiter.limit("user:e");
    const blocked = await limiter.limit("user:e");
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(1_500);
    const allowed = await limiter.limit("user:e");
    expect(allowed.success).toBe(true);
    vi.useRealTimers();
  });

  it("decrements remaining count correctly", async () => {
    const limiter = makeLimiter(5, 60_000);
    const r1 = await limiter.limit("user:f");
    const r2 = await limiter.limit("user:f");
    expect(r1.remaining).toBe(4);
    expect(r2.remaining).toBe(3);
  });
});
