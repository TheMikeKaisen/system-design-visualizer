import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { MiddlewareEvaluator } from "../MiddlewareEvaluator";
import type { SystemNode, Packet, MiddlewareStep } from "@/types";

function makeGateway(chain: MiddlewareStep[]): SystemNode {
  return {
    id: "apigw-1", type: "apiGateway",
    position: { x: 0, y: 0 },
    data: {
      kind: "apiGateway", label: "Gateway",
      activeConnections: 0, load: 0,
      securityPolicies: [],
      metadata: { middlewareChain: JSON.stringify(chain) },
    },
  } as SystemNode;
}

function makePacket(overrides: Partial<Packet> = {}): Packet {
  return {
    id: "p1", sourceId: "svc-1", targetId: "apigw-1",
    progress: 0.5, status: "traveling", protocol: "HTTP",
    sizeBytes: 512, createdAt: 0, color: 0x378add,
    ...overrides,
  };
}

describe("MiddlewareEvaluator", () => {
  let evaluator: MiddlewareEvaluator;
  const NOW = 1000;

  beforeEach(() => { evaluator = new MiddlewareEvaluator(); });
  afterEach(() => { evaluator.destroy(); });

  describe("empty chain", () => {
    it("passes packet through with no steps", () => {
      const gw = makeGateway([]);
      const result = evaluator.evaluate(makePacket(), gw, NOW);
      expect(result.verdict.action).toBe("pass");
    });
  });

  describe("logging middleware", () => {
    it("always passes", () => {
      const chain: MiddlewareStep[] = [
        { id: "l1", type: "logging", enabled: true, label: "Log", config: {} },
      ];
      const result = evaluator.evaluate(makePacket(), makeGateway(chain), NOW);
      expect(result.verdict.action).toBe("pass");
    });

    it("writes an audit entry", () => {
      const chain: MiddlewareStep[] = [
        { id: "l1", type: "logging", enabled: true, label: "Log", config: {} },
      ];
      evaluator.evaluate(makePacket(), makeGateway(chain), NOW);
      const log = evaluator.getAuditLog("apigw-1");
      expect(log.length).toBe(1);
    });
  });

  describe("rate limit middleware", () => {
    it("passes when tokens available (full bucket)", () => {
      const chain: MiddlewareStep[] = [
        { id: "rl1", type: "rateLimit", enabled: true, label: "RL",
          config: { capacity: 10, ratePerSec: 5, retryAfterMs: 500 } },
      ];
      const result = evaluator.evaluate(makePacket(), makeGateway(chain), NOW);
      expect(result.verdict.action).toBe("pass");
    });

    it("queues when bucket is exhausted", () => {
      const chain: MiddlewareStep[] = [
        { id: "rl1", type: "rateLimit", enabled: true, label: "RL",
          config: { capacity: 1, ratePerSec: 0, retryAfterMs: 500 } },
      ];
      const gw = makeGateway(chain);
      evaluator.evaluate(makePacket(), gw, NOW); // Drains the 1 token
      const result = evaluator.evaluate(makePacket(), gw, NOW);
      expect(result.verdict.action).toBe("queue");
    });
  });

  describe("auth middleware", () => {
    it("passes packet that already has authToken", () => {
      const chain: MiddlewareStep[] = [
        { id: "a1", type: "auth", enabled: true, label: "Auth",
          config: { allowUnauthenticated: false, authRate: 0 } },
      ];
      const result = evaluator.evaluate(
        makePacket({ authToken: "existing-token" }),
        makeGateway(chain),
        NOW
      );
      expect(result.verdict.action).toBe("pass");
    });

    it("passes when allowUnauthenticated is true", () => {
      const chain: MiddlewareStep[] = [
        { id: "a1", type: "auth", enabled: true, label: "Auth",
          config: { allowUnauthenticated: true } },
      ];
      const result = evaluator.evaluate(makePacket(), makeGateway(chain), NOW);
      expect(result.verdict.action).toBe("pass");
    });

    it("drops unauthenticated packet when authRate is 0", () => {
      const chain: MiddlewareStep[] = [
        { id: "a1", type: "auth", enabled: true, label: "Auth",
          config: { allowUnauthenticated: false, authRate: 0 } },
      ];
      const result = evaluator.evaluate(makePacket(), makeGateway(chain), NOW);
      expect(result.verdict.action).toBe("drop");
      if (result.verdict.action === "drop") {
        expect(result.verdict.reason).toContain("401");
      }
    });
  });

  describe("circuit breaker middleware", () => {
    it("passes when CLOSED", () => {
      const chain: MiddlewareStep[] = [
        { id: "cb1", type: "circuitBreaker", enabled: true, label: "CB",
          config: { failureThreshold: 3, openTimeoutMs: 5000 } },
      ];
      const result = evaluator.evaluate(makePacket(), makeGateway(chain), NOW);
      expect(result.verdict.action).toBe("pass");
    });

    it("drops when OPEN after recording failures", () => {
      const chain: MiddlewareStep[] = [
        { id: "cb1", type: "circuitBreaker", enabled: true, label: "CB",
          config: { failureThreshold: 2, openTimeoutMs: 5000 } },
      ];
      const gw = makeGateway(chain);
      evaluator.evaluate(makePacket(), gw, NOW);
      evaluator.recordPacketOutcome("apigw-1", false, NOW);
      evaluator.evaluate(makePacket(), gw, NOW);
      evaluator.recordPacketOutcome("apigw-1", false, NOW);

      const result = evaluator.evaluate(makePacket(), gw, NOW);
      expect(result.verdict.action).toBe("drop");
      if (result.verdict.action === "drop") {
        expect(result.verdict.reason).toContain("503");
      }
    });
  });

  describe("disabled steps", () => {
    it("skips disabled steps", () => {
      const chain: MiddlewareStep[] = [
        { id: "rl1", type: "rateLimit", enabled: false, label: "RL",
          config: { capacity: 0, ratePerSec: 0 } }, // Would block all if enabled
      ];
      const result = evaluator.evaluate(makePacket(), makeGateway(chain), NOW);
      expect(result.verdict.action).toBe("pass");
    });
  });

  describe("chain short-circuits on drop", () => {
    it("does not evaluate later steps after a drop", () => {
      const chain: MiddlewareStep[] = [
        { id: "a1", type: "auth", enabled: true, label: "Auth",
          config: { allowUnauthenticated: false, authRate: 0 } }, // drops
        { id: "l1", type: "logging", enabled: true, label: "Log", config: {} },
      ];
      const result = evaluator.evaluate(makePacket(), makeGateway(chain), NOW);
      expect(result.verdict.action).toBe("drop");
    });
  });

  describe("audit log", () => {
    it("caps at 200 entries", () => {
      const chain: MiddlewareStep[] = [
        { id: "l1", type: "logging", enabled: true, label: "Log", config: {} },
      ];
      const gw = makeGateway(chain);
      for (let i = 0; i < 250; i++) {
        evaluator.evaluate(makePacket({ id: `p${i}` }), gw, NOW + i);
      }
      expect(evaluator.getAuditLog("apigw-1").length).toBe(200);
    });

    it("clearAuditLog empties the log", () => {
      const chain: MiddlewareStep[] = [
        { id: "l1", type: "logging", enabled: true, label: "Log", config: {} },
      ];
      evaluator.evaluate(makePacket(), makeGateway(chain), NOW);
      evaluator.clearAuditLog("apigw-1");
      expect(evaluator.getAuditLog("apigw-1").length).toBe(0);
    });
  });

  describe("getCircuitBreakerStatus", () => {
    it("returns null before CB is activated", () => {
      expect(evaluator.getCircuitBreakerStatus("apigw-1")).toBeNull();
    });

    it("returns status after first evaluation with CB step", () => {
      const chain: MiddlewareStep[] = [
        { id: "cb1", type: "circuitBreaker", enabled: true, label: "CB",
          config: { failureThreshold: 5, openTimeoutMs: 5000 } },
      ];
      evaluator.evaluate(makePacket(), makeGateway(chain), NOW);
      const status = evaluator.getCircuitBreakerStatus("apigw-1");
      expect(status).not.toBeNull();
      expect(status!.state).toBe("CLOSED");
    });
  });
});
