import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenBucket } from "../TokenBucket";

beforeEach(() => {
  vi.spyOn(performance, "now").mockReturnValue(0);
});

describe("TokenBucket", () => {
  it("starts full", () => {
    const b = new TokenBucket(10, 5);
    expect(b.fillPct).toBe(1);
    expect(b.availableTokens).toBe(10);
  });

  it("consume returns true when tokens available", () => {
    const b = new TokenBucket(10, 5);
    expect(b.consume()).toBe(true);
    expect(b.availableTokens).toBe(9);
  });

  it("consume returns false when empty", () => {
    const b = new TokenBucket(1, 5);
    b.consume(); // Empties the bucket
    expect(b.consume()).toBe(false);
  });

  it("refill adds tokens proportional to elapsed time", () => {
    const b = new TokenBucket(10, 5);
    // Drain to 0
    for (let i = 0; i < 10; i++) b.consume();
    expect(b.availableTokens).toBe(0);

    // Advance 1 second → should add 5 tokens
    b.refill(1000);
    expect(b.availableTokens).toBe(5);
  });

  it("refill does not exceed capacity", () => {
    const b = new TokenBucket(10, 100);
    b.refill(10_000); // Massive refill
    expect(b.availableTokens).toBe(10);
    expect(b.fillPct).toBe(1);
  });

  it("multiple refills accumulate correctly", () => {
    const b = new TokenBucket(10, 10);
    for (let i = 0; i < 10; i++) b.consume();
    b.refill(500);  // +5 tokens
    b.refill(1000); // +5 more tokens (from 500ms elapsed)
    expect(b.availableTokens).toBe(10);
  });
});
