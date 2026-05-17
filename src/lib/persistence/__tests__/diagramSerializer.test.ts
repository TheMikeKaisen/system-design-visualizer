import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  serializeDiagram,
  deserializeDiagram,
  diagramToJSON,
  jsonToDiagram,
} from "../diagramSerializer";
import { DIAGRAM_FORMAT_VERSION } from "@/types";
import type { ViewportTransform, DiagramMeta, SystemNode, SystemEdge } from "@/types";

vi.mock("@/components/nodes/NodeFactory", () => ({
  syncCountersFromNodes: vi.fn(),
}));

const vp: ViewportTransform = { x: 0, y: 0, zoom: 1 };
const meta: DiagramMeta = {
  id: "test-id", name: "Test", ownerId: "local",
  collaborators: [], createdAt: 1000, updatedAt: 1000,
};
const nodes: SystemNode[] = [];
const edges: SystemEdge[] = [];

describe("serializeDiagram", () => {
  it("produces correct version", () => {
    const d = serializeDiagram(nodes, edges, vp, meta);
    expect(d.version).toBe(DIAGRAM_FORMAT_VERSION);
  });

  it("updates updatedAt timestamp", () => {
    const before = Date.now();
    const d = serializeDiagram(nodes, edges, vp, meta);
    expect(d.meta.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("preserves node and edge arrays", () => {
    const d = serializeDiagram(nodes, edges, vp, meta);
    expect(d.nodes).toEqual(nodes);
    expect(d.edges).toEqual(edges);
  });
});

describe("deserializeDiagram", () => {
  const validPayload = {
    version: DIAGRAM_FORMAT_VERSION,
    meta,
    nodes: [],
    edges: [],
    viewport: vp,
  };

  it("accepts valid payload", () => {
    const r = deserializeDiagram(validPayload);
    expect(r.ok).toBe(true);
  });

  it("rejects wrong version", () => {
    const r = deserializeDiagram({ ...validPayload, version: 99 });
    expect(r.ok).toBe(false);
  });

  it("rejects missing meta fields", () => {
    const r = deserializeDiagram({ ...validPayload, meta: { id: "x" } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("meta");
  });

  it("rejects invalid viewport zoom", () => {
    const r = deserializeDiagram({ ...validPayload, viewport: { x: 0, y: 0, zoom: 0 } });
    expect(r.ok).toBe(false);
  });

  it("rejects null input", () => {
    const r = deserializeDiagram(null);
    expect(r.ok).toBe(false);
  });

  it("rejects non-object input", () => {
    const r = deserializeDiagram("hello");
    expect(r.ok).toBe(false);
  });

  it("calls syncCountersFromNodes on success", async () => {
    const { syncCountersFromNodes } = await import("@/components/nodes/NodeFactory");
    deserializeDiagram(validPayload);
    expect(syncCountersFromNodes).toHaveBeenCalled();
  });
});

describe("JSON round-trip", () => {
  it("serializes and deserializes symmetrically", () => {
    const original = serializeDiagram(nodes, edges, vp, meta);
    const json = diagramToJSON(original);
    const result = jsonToDiagram(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diagram.meta.id).toBe(meta.id);
      expect(result.diagram.version).toBe(DIAGRAM_FORMAT_VERSION);
    }
  });

  it("returns error for malformed JSON", () => {
    const r = jsonToDiagram("{not valid json");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("JSON");
  });

  it("returns error for valid JSON with wrong shape", () => {
    const r = jsonToDiagram('{"hello":"world"}');
    expect(r.ok).toBe(false);
  });
});
