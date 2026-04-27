import { describe, it, expect, beforeEach } from "vitest";
import { RoundRobinStrategy } from "../strategies/RoundRobinStrategy";
import { LeastConnectionsStrategy } from "../strategies/LeastConnectionsStrategy";
import { WeightedStrategy } from "../strategies/WeightedStrategy";
import { createNode } from "@/components/nodes/NodeFactory";
import type { SystemNode } from "@/types";

function makeNode(id: string, connections = 0): SystemNode {
  const n = createNode({ kind: "service", label: id });
  // Force a stable ID for test assertions
  return { ...n, id, data: { ...n.data, activeConnections: connections } };
}

describe("RoundRobinStrategy", () => {
  it("cycles through candidates in order", () => {
    const s = new RoundRobinStrategy();
    const source = makeNode("src");
    const candidates = [makeNode("a"), makeNode("b"), makeNode("c")];

    expect(s.selectTarget(source, candidates, []).id).toBe("a");
    expect(s.selectTarget(source, candidates, []).id).toBe("b");
    expect(s.selectTarget(source, candidates, []).id).toBe("c");
    expect(s.selectTarget(source, candidates, []).id).toBe("a"); // wraps
  });

  it("handles single candidate without cycling errors", () => {
    const s = new RoundRobinStrategy();
    const source = makeNode("src");
    const candidates = [makeNode("only")];

    expect(s.selectTarget(source, candidates, []).id).toBe("only");
    expect(s.selectTarget(source, candidates, []).id).toBe("only");
  });

  it("getName returns correct identifier", () => {
    expect(new RoundRobinStrategy().getName()).toBe("roundRobin");
  });
});

describe("LeastConnectionsStrategy", () => {
  it("selects the node with fewest active connections", () => {
    const s = new LeastConnectionsStrategy();
    const source = makeNode("src");
    const candidates = [makeNode("busy", 10), makeNode("idle", 1), makeNode("medium", 5)];

    expect(s.selectTarget(source, candidates, []).id).toBe("idle");
  });

  it("handles all-equal connections by returning first", () => {
    const s = new LeastConnectionsStrategy();
    const source = makeNode("src");
    const candidates = [makeNode("a", 3), makeNode("b", 3)];

    expect(s.selectTarget(source, candidates, []).id).toBe("a");
  });

  it("handles single candidate", () => {
    const s = new LeastConnectionsStrategy();
    const source = makeNode("src");
    expect(s.selectTarget(source, [makeNode("only", 99)], []).id).toBe("only");
  });
});

describe("WeightedStrategy", () => {
  it("getName returns correct identifier", () => {
    expect(new WeightedStrategy().getName()).toBe("weighted");
  });

  it("always returns a valid candidate", () => {
    const s = new WeightedStrategy();
    const source = makeNode("src");
    const candidates = [makeNode("a"), makeNode("b"), makeNode("c")];
    const result = s.selectTarget(source, candidates, []);
    expect(candidates.map((c) => c.id)).toContain(result.id);
  });
});