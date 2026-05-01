import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteNodeCommand } from "../commands/DeleteNodeCommand";
import { createNode } from "@/components/nodes/NodeFactory";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import type { SystemEdge } from "@/types";

vi.mock("@/lib/store/useCanvasStore", () => ({
  useCanvasStore: {
    getState: vi.fn(),
  },
}));

const mockStore = {
  nodes: [] as ReturnType<typeof createNode>[],
  edges: [] as SystemEdge[],
  addNode: vi.fn(),
  removeNode: vi.fn(),
  restoreEdge: vi.fn(),
};

beforeEach(() => {
  vi.mocked(useCanvasStore.getState).mockReturnValue(mockStore as any);
  mockStore.addNode.mockClear();
  mockStore.removeNode.mockClear();
  mockStore.restoreEdge.mockClear();
});

describe("DeleteNodeCommand", () => {
  const node = createNode({ kind: "service", label: "Auth", forceId: "svc-1" });
  const edges: SystemEdge[] = [
    {
      id: "e1", source: "svc-1", target: "db-1", type: "simulationEdge",
      data: { protocol: "HTTP", throughputLimit: null, latencyMs: 20, errorRate: 0, middleware: [] },
    },
  ];

  it("execute calls removeNode with correct id", () => {
    const cmd = new DeleteNodeCommand(node, edges);
    cmd.execute();
    expect(mockStore.removeNode).toHaveBeenCalledWith("svc-1");
  });

  it("undo restores node then edges", () => {
    const cmd = new DeleteNodeCommand(node, edges);
    cmd.undo();
    expect(mockStore.addNode).toHaveBeenCalledWith(node);
    expect(mockStore.restoreEdge).toHaveBeenCalledWith(edges[0]);
  });

  it("getDescription includes kind and label", () => {
    const cmd = new DeleteNodeCommand(node, edges);
    expect(cmd.getDescription()).toContain("service");
    expect(cmd.getDescription()).toContain("Auth");
  });

  it("serialize produces correct type and payload", () => {
    const cmd = new DeleteNodeCommand(node, edges);
    const s = cmd.serialize();
    expect(s.type).toBe("DeleteNode");
    expect(s.payload.nodeId).toBe("svc-1");
  });
});