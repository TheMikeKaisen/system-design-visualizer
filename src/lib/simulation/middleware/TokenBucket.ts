/**
 * Token bucket rate limiter.
 *
 * Tokens are added at `refillRate` per millisecond up to `capacity`.
 * Each packet consumes 1 token. If no tokens remain the verdict is "queue".
 *
 * Pure class — no side effects, no imports from React or Zustand.
 */
export class TokenBucket {
  private tokens:       number;
  private lastRefillMs: number;

  constructor(
    /** Maximum burst capacity (tokens) */
    private readonly capacity:    number,
    /** Tokens added per second */
    private readonly ratePerSec:  number,
  ) {
    this.tokens       = capacity;
    this.lastRefillMs = performance.now();
  }

  /** Refill tokens based on elapsed time. Call before consume(). */
  refill(nowMs: number): void {
    const elapsed    = nowMs - this.lastRefillMs;
    const newTokens  = (elapsed / 1000) * this.ratePerSec;
    this.tokens      = Math.min(this.capacity, this.tokens + newTokens);
    this.lastRefillMs = nowMs;
  }

  /**
   * Attempt to consume one token.
   * Returns true (packet passes) or false (packet queued).
   */
  consume(): boolean {
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  get availableTokens(): number {
    return Math.floor(this.tokens);
  }

  get fillPct(): number {
    return this.tokens / this.capacity;
  }
}
