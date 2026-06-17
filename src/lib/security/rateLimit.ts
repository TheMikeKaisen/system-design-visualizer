import { env } from "@/lib/env";

// ─────────────────────────────────────────────
// Strategy interface
// ─────────────────────────────────────────────

export interface RateLimitResult {
  success:   boolean;
  remaining: number;
  resetMs:   number;
}

export interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>;
}

// ─────────────────────────────────────────────
// Production — Upstash Redis (sliding window)
// ─────────────────────────────────────────────

async function buildUpstashLimiter(
  requests: number,
  windowSeconds: number
): Promise<RateLimiter> {
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis }     = await import("@upstash/redis");

  const redis = new Redis({
    url:   env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    analytics: true,
    prefix: "sysvis:rl",
  });

  return {
    async limit(key) {
      const result = await limiter.limit(key);
      return {
        success:   result.success,
        remaining: result.remaining,
        resetMs:   result.reset,
      };
    },
  };
}

// ─────────────────────────────────────────────
// Development — in-memory (single instance only)
// ─────────────────────────────────────────────

interface MemoryEntry { count: number; resetAt: number }
const memoryStore = new Map<string, MemoryEntry>();

function buildMemoryLimiter(requests: number, windowMs: number): RateLimiter {
  return {
    async limit(key) {
      const now   = Date.now();
      const entry = memoryStore.get(key);

      if (!entry || now > entry.resetAt) {
        memoryStore.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: requests - 1, resetMs: now + windowMs };
      }

      entry.count++;
      const success   = entry.count <= requests;
      const remaining = Math.max(0, requests - entry.count);
      return { success, remaining, resetMs: entry.resetAt };
    },
  };
}

// ─────────────────────────────────────────────
// Factory — picks the right backend
// ─────────────────────────────────────────────

export type LimiterPreset = "api" | "auth" | "diagram-save" | "diagram-list";

interface PresetConfig { requests: number; windowSeconds: number }

const PRESETS: Record<LimiterPreset, PresetConfig> = {
  "api":           { requests: 100, windowSeconds: 60 },   // General API
  "auth":          { requests: 10,  windowSeconds: 60 },   // Sign-in attempts
  "diagram-save":  { requests: 30,  windowSeconds: 60 },   // Saves per minute
  "diagram-list":  { requests: 60,  windowSeconds: 60 },   // List requests
};

const limiterCache = new Map<LimiterPreset, RateLimiter>();

export async function getRateLimiter(preset: LimiterPreset): Promise<RateLimiter> {
  if (limiterCache.has(preset)) return limiterCache.get(preset)!;

  const { requests, windowSeconds } = PRESETS[preset];
  const isUpstashConfigured =
    !!env.UPSTASH_REDIS_REST_URL && !!env.UPSTASH_REDIS_REST_TOKEN;

  const limiter = isUpstashConfigured
    ? await buildUpstashLimiter(requests, windowSeconds)
    : buildMemoryLimiter(requests, windowSeconds * 1000);

  limiterCache.set(preset, limiter);
  return limiter;
}

// ─────────────────────────────────────────────
// Helper for Next.js API routes
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";

/**
 * Check rate limit and return a 429 response if exceeded.
 *
 * @param identifier  Unique key — use `ip:${clientIp}` or `user:${userId}`
 * @param preset      Which rate limit config to apply
 * @returns null if allowed, NextResponse(429) if exceeded
 */
export async function checkRateLimit(
  identifier: string,
  preset: LimiterPreset
): Promise<NextResponse | null> {
  try {
    const limiter = await getRateLimiter(preset);
    const result  = await limiter.limit(identifier);

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit":     String(PRESETS[preset].requests),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset":     String(result.resetMs),
            "Retry-After":           String(Math.ceil((result.resetMs - Date.now()) / 1000)),
          },
        }
      );
    }

    return null;
  } catch {
    // If the rate limiter fails (Redis down), fail open — don't block users
    console.error("[rateLimit] Rate limiter error — failing open");
    return null;
  }
}
