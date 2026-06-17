import type { Packet, MiddlewareStep } from "@/types";

// ─────────────────────────────────────────────
// Verdicts
// ─────────────────────────────────────────────

export type MiddlewareVerdict =
  | { action: "pass";  packet: Packet }
  | { action: "drop";  reason: string }
  | { action: "queue"; delayMs: number }
  | { action: "transform"; packet: Packet };

// ─────────────────────────────────────────────
// Evaluation context passed to each step
// ─────────────────────────────────────────────

export interface MiddlewareContext {
  /** The node ID of the gateway being traversed */
  gatewayId: string;
  /** Current wall clock (performance.now()) for rate-limiter refills */
  nowMs:      number;
  /** Step config from the node's middleware chain */
  step:       MiddlewareStep;
}

// ─────────────────────────────────────────────
// Individual middleware handler interface
// ─────────────────────────────────────────────

export interface IMiddlewareHandler {
  evaluate(packet: Packet, ctx: MiddlewareContext): MiddlewareVerdict;
  /** Called once per tick for time-based state (token refills, CB timeout) */
  tick?(deltaMs: number, gatewayId: string): void;
}

// ─────────────────────────────────────────────
// Circuit breaker states (exported for Zustand)
// ─────────────────────────────────────────────

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerStatus {
  state:         CircuitBreakerState;
  failureCount:  number;
  /** When the CB entered OPEN state (performance.now()) */
  openedAt?:     number;
  /** Total requests shed while OPEN */
  shedCount:     number;
}

// ─────────────────────────────────────────────
// Audit log entry
// ─────────────────────────────────────────────

export interface AuditEntry {
  ts:          number;
  packetId:    string;
  protocol:    string;
  stepType:    MiddlewareStep["type"];
  verdict:     "pass" | "drop" | "queue" | "transform";
  reason?:     string;
}
