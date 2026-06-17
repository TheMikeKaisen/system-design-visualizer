import type { CircuitBreakerState, CircuitBreakerStatus } from "./types";

/**
 * Three-state circuit breaker FSM:
 *
 *   CLOSED ──(failures ≥ threshold)──► OPEN
 *   OPEN   ──(timeout elapsed)──────► HALF_OPEN
 *   HALF_OPEN ──(probe passes)──────► CLOSED
 *   HALF_OPEN ──(probe fails)───────► OPEN
 *
 * State is private — only the status snapshot is ever exported.
 * No Zustand imports. The engine reads `getStatus()` and pushes to the store.
 */
export class CircuitBreakerMachine {
  private state:        CircuitBreakerState = "CLOSED";
  private failureCount: number              = 0;
  private openedAt:     number | undefined;
  private shedCount:    number              = 0;
  private probeInFlight:boolean             = false;

  constructor(
    /** Number of consecutive failures before opening */
    private readonly failureThreshold: number = 5,
    /** Milliseconds to wait in OPEN before moving to HALF_OPEN */
    private readonly openTimeoutMs:    number = 10_000,
  ) {}

  // ─────────────────────────────────────────────
  // Public API called by MiddlewareEvaluator
  // ─────────────────────────────────────────────

  /**
   * Called before processing a packet.
   * Returns whether the packet is allowed through.
   */
  canPass(nowMs: number): boolean {
    switch (this.state) {
      case "CLOSED":
        return true;

      case "OPEN": {
        // Check if timeout has elapsed — transition to HALF_OPEN
        if (this.openedAt !== undefined && nowMs - this.openedAt >= this.openTimeoutMs) {
          this.state        = "HALF_OPEN";
          this.probeInFlight = false;
          return this.canPass(nowMs); // Recurse into HALF_OPEN
        }
        this.shedCount++;
        return false;
      }

      case "HALF_OPEN":
        // Only allow one probe packet at a time
        if (!this.probeInFlight) {
          this.probeInFlight = true;
          return true;
        }
        this.shedCount++;
        return false;
    }
  }

  /** Call when a packet that passed the breaker arrived successfully */
  recordSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.state        = "CLOSED";
      this.failureCount = 0;
      this.probeInFlight = false;
      this.openedAt     = undefined;
    } else if (this.state === "CLOSED") {
      // Reset failure streak on any success
      this.failureCount = 0;
    }
  }

  /** Call when a packet that passed the breaker was dropped/errored */
  recordFailure(nowMs: number): void {
    if (this.state === "HALF_OPEN") {
      // Probe failed — trip back to OPEN
      this.state         = "OPEN";
      this.openedAt      = nowMs;
      this.probeInFlight = false;
      return;
    }
    this.failureCount++;
    if (this.state === "CLOSED" && this.failureCount >= this.failureThreshold) {
      this.state    = "OPEN";
      this.openedAt = nowMs;
    }
  }

  // ─────────────────────────────────────────────
  // Snapshot for Zustand / UI
  // ─────────────────────────────────────────────

  getStatus(): CircuitBreakerStatus {
    return {
      state:        this.state,
      failureCount: this.failureCount,
      openedAt:     this.openedAt,
      shedCount:    this.shedCount,
    };
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}
