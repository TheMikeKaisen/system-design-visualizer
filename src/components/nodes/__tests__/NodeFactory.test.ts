import { describe, it, expect, beforeEach } from "vitest";
import { createNode, syncCountersFromNodes } from "../NodeFactory";

describe("createNode", () => {
  it("creates a node with correct kind and defaults", () => {
    const node = createNode({ kind: "database" });
    expect(node.data.kind).toBe("database");
    expect(node.data.label).toBe("Database");
    expect(node.data.activeConnections).toBe(0);
    expect(node.data.load).toBe(0);
    expect(node.data.securityPolicies).toEqual([]);
  });

  it("accepts a custom label", () => {
    const node = createNode({ kind: "service", label: "Auth Service" });
    expect(node.data.label).toBe("Auth Service");
  });

  it("uses forceId when provided", () => {
    const node = createNode({ kind: "service", forceId: "my-stable-id" });
    expect(node.id).toBe("my-stable-id");
  });

  it("generates prefixed deterministic IDs", () => {
    const lb = createNode({ kind: "loadBalancer" });
    expect(lb.id).toMatch(/^lb-\d+$/);

    const db = createNode({ kind: "database" });
    expect(db.id).toMatch(/^db-\d+$/);
  });

  it("IDs are unique across multiple creates of same kind", () => {
    const a = createNode({ kind: "service" });
    const b = createNode({ kind: "service" });
    expect(a.id).not.toBe(b.id);
  });
});

describe("syncCountersFromNodes", () => {
  it("prevents ID collision after loading a saved diagram", () => {
    const savedNodes = [
      createNode({ kind: "service", forceId: "svc-50" }),
      createNode({ kind: "service", forceId: "svc-99" }),
    ];
    syncCountersFromNodes(savedNodes);
    const newNode = createNode({ kind: "service" });
    // Counter should be > 99 — new node must not collide
    expect(newNode.id).not.toBe("svc-99");
    expect(newNode.id).not.toBe("svc-50");
  });
});