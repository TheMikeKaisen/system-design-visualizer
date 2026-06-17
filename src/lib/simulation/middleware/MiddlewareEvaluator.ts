import type { Packet, MiddlewareStep, SystemNode } from "@/types";
import type { MiddlewareVerdict, AuditEntry, CircuitBreakerStatus } from "./types";
import { TokenBucket }           from "./TokenBucket";
import { CircuitBreakerMachine } from "./CircuitBreakerMachine";

// ─────────────────────────────────────────────
// Result of evaluating the full chain
// ─────────────────────────────────────────────

export interface ChainResult {
  verdict:    MiddlewareVerdict;
  auditEntry: AuditEntry;
}

// ─────────────────────────────────────────────
// MiddlewareEvaluator
// Owns all stateful middleware objects for every gateway node.
// Lives inside SimulationEngine — never serialized, never in Zustand.
// ─────────────────────────────────────────────

export class MiddlewareEvaluator {
  /** nodeId → TokenBucket */
  private rateLimiters    = new Map<string, TokenBucket>();
  /** nodeId → CircuitBreakerMachine */
  private circuitBreakers = new Map<string, CircuitBreakerMachine>();
  /** nodeId → AuditEntry[] (capped at 200 entries) */
  private auditLogs       = new Map<string, AuditEntry[]>();

  private readonly AUDIT_CAP = 200;

  // ─────────────────────────────────────────────
  // Main entry point — called per packet per gateway
  // ─────────────────────────────────────────────

  evaluate(
    packet:  Packet,
    gateway: SystemNode,
    nowMs:   number,
  ): ChainResult {
    const chain = this.parseChain(gateway.data.metadata.middlewareChain);
    const enabledSteps = chain.filter((s) => s.enabled);

    let currentPacket = packet;
    let finalVerdict: MiddlewareVerdict = { action: "pass", packet };

    for (const step of enabledSteps) {
      const verdict = this.evaluateStep(currentPacket, gateway.id, step, nowMs);

      if (verdict.action === "transform") {
        currentPacket = verdict.packet;
        finalVerdict  = verdict;
        continue;
      }

      finalVerdict = verdict;

      // Short-circuit on drop or queue — don't evaluate remaining steps
      if (verdict.action === "drop" || verdict.action === "queue") break;
    }

    const auditEntry: AuditEntry = {
      ts:       nowMs,
      packetId: packet.id,
      protocol: packet.protocol,
      stepType: enabledSteps.at(-1)?.type ?? "logging",
      verdict:  finalVerdict.action,
      reason:   finalVerdict.action === "drop" ? (finalVerdict as any).reason
                : finalVerdict.action === "queue" ? `delayed ${(finalVerdict as any).delayMs}ms`
                : undefined,
    };

    this.appendAudit(gateway.id, auditEntry);

    return {
      verdict: finalVerdict,
      auditEntry,
    };
  }

  // ─────────────────────────────────────────────
  // Per-step evaluation
  // ─────────────────────────────────────────────

  private evaluateStep(
    packet:    Packet,
    gatewayId: string,
    step:      MiddlewareStep,
    nowMs:     number,
  ): MiddlewareVerdict {
    switch (step.type) {
      case "rateLimit":   return this.evalRateLimit(packet, gatewayId, step, nowMs);
      case "auth":        return this.evalAuth(packet, step);
      case "transform":   return this.evalTransform(packet, step);
      case "logging":     return this.evalLogging(packet);
      case "circuitBreaker": return this.evalCircuitBreaker(packet, gatewayId, step, nowMs);
      case "cors":        return this.evalCors(packet, step);
      default:            return { action: "pass", packet };
    }
  }

  // ── Rate limit ─────────────────────────────────────────────────────

  private evalRateLimit(
    packet:    Packet,
    gatewayId: string,
    step:      MiddlewareStep,
    nowMs:     number,
  ): MiddlewareVerdict {
    let bucket = this.rateLimiters.get(gatewayId);

    if (!bucket) {
      const capacity   = Number(step.config.capacity   ?? 10);
      const ratePerSec = Number(step.config.ratePerSec ?? 5);
      bucket = new TokenBucket(capacity, ratePerSec);
      this.rateLimiters.set(gatewayId, bucket);
    }

    bucket.refill(nowMs);

    if (bucket.consume()) {
      return { action: "pass", packet };
    }

    const retryMs = Number(step.config.retryAfterMs ?? 1000);
    return { action: "queue", delayMs: retryMs };
  }

  // ── Auth ───────────────────────────────────────────────────────────

  private evalAuth(packet: Packet, step: MiddlewareStep): MiddlewareVerdict {
    // In simulation: packets "have auth" if they carry an authToken OR
    // if the step's allowUnauthenticated flag is set.
    // Real JWT validation is out of scope — we model the probability.
    const allowUnauthenticated = Boolean(step.config.allowUnauthenticated ?? false);

    if (allowUnauthenticated) return { action: "pass", packet };
    if (packet.authToken)     return { action: "pass", packet };

    // 10% of packets in simulation carry auth by default (override via step.config)
    const authRate = Number(step.config.authRate ?? 0.1);
    if (Math.random() < authRate) {
      // Attach a simulated token
      const authenticated = { ...packet, authToken: `sim-token-${packet.id}` };
      return { action: "transform", packet: authenticated };
    }

    return { action: "drop", reason: "401 Unauthorized — missing auth token" };
  }

  // ── Transform ──────────────────────────────────────────────────────

  private evalTransform(packet: Packet, step: MiddlewareStep): MiddlewareVerdict {
    // Merge configured headers into the packet's header map
    const extraHeaders = (step.config.headers as Record<string, string>) ?? {};
    const transformed: Packet = {
      ...packet,
      headers: { ...(packet.headers ?? {}), ...extraHeaders },
    };
    return { action: "transform", packet: transformed };
  }

  // ── Logging ────────────────────────────────────────────────────────

  private evalLogging(packet: Packet): MiddlewareVerdict {
    // Logging always passes — the audit log captures the entry separately
    return { action: "pass", packet };
  }

  // ── Circuit breaker ────────────────────────────────────────────────

  private evalCircuitBreaker(
    packet:    Packet,
    gatewayId: string,
    step:      MiddlewareStep,
    nowMs:     number,
  ): MiddlewareVerdict {
    let cb = this.circuitBreakers.get(gatewayId);

    if (!cb) {
      const threshold  = Number(step.config.failureThreshold ?? 5);
      const timeoutMs  = Number(step.config.openTimeoutMs    ?? 10_000);
      cb = new CircuitBreakerMachine(threshold, timeoutMs);
      this.circuitBreakers.set(gatewayId, cb);
    }

    if (cb.canPass(nowMs)) {
      return { action: "pass", packet };
    }

    return { action: "drop", reason: "503 Service Unavailable — circuit breaker OPEN" };
  }

  // ── CORS ───────────────────────────────────────────────────────────

  private evalCors(packet: Packet, step: MiddlewareStep): MiddlewareVerdict {
    const allowedOrigins = (step.config.allowedOrigins as string) ?? "*";

    // In simulation: HTTP packets always pass CORS unless explicitly blocked
    if (allowedOrigins === "*") return { action: "pass", packet };
    if (packet.protocol !== "HTTP") return { action: "pass", packet };

    // Simulate: 95% of requests come from allowed origins
    const originAllowed = Math.random() < 0.95;
    if (originAllowed) return { action: "pass", packet };

    return { action: "drop", reason: "403 Forbidden — CORS origin not allowed" };
  }

  // ─────────────────────────────────────────────
  // Circuit breaker outcome feedback
  // Called by SimulationEngine after a packet arrives/drops
  // ─────────────────────────────────────────────

  recordPacketOutcome(
    gatewayId: string,
    success:   boolean,
    nowMs:     number,
  ): void {
    const cb = this.circuitBreakers.get(gatewayId);
    if (!cb) return;
    if (success) cb.recordSuccess();
    else         cb.recordFailure(nowMs);
  }

  // ─────────────────────────────────────────────
  // Status accessors (for Zustand and UI)
  // ─────────────────────────────────────────────

  getCircuitBreakerStatus(gatewayId: string): CircuitBreakerStatus | null {
    return this.circuitBreakers.get(gatewayId)?.getStatus() ?? null;
  }

  getRateLimiterFillPct(gatewayId: string): number {
    return this.rateLimiters.get(gatewayId)?.fillPct ?? 1;
  }

  getAuditLog(gatewayId: string): AuditEntry[] {
    return this.auditLogs.get(gatewayId) ?? [];
  }

  clearAuditLog(gatewayId: string): void {
    this.auditLogs.set(gatewayId, []);
  }

  // ─────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────

  destroyGateway(gatewayId: string): void {
    this.rateLimiters.delete(gatewayId);
    this.circuitBreakers.delete(gatewayId);
    this.auditLogs.delete(gatewayId);
  }

  destroy(): void {
    this.rateLimiters.clear();
    this.circuitBreakers.clear();
    this.auditLogs.clear();
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private parseChain(raw: unknown): MiddlewareStep[] {
    if (!raw || typeof raw !== "string") return [];
    try { return JSON.parse(raw) as MiddlewareStep[]; }
    catch { return []; }
  }

  private appendAudit(gatewayId: string, entry: AuditEntry): void {
    const log = this.auditLogs.get(gatewayId) ?? [];
    log.unshift(entry); // newest first
    if (log.length > this.AUDIT_CAP) log.length = this.AUDIT_CAP;
    this.auditLogs.set(gatewayId, log);
  }
}
