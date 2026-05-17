import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Y from "yjs";
import { setupYjsBinding } from "../yjsBinding";
import { getYjsSharedTypes } from "../yjsDoc";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import type { SystemNode, SystemEdge } from "@/types";

vi.mock("@/components/nodes/NodeFactory", () => ({
  syncCountersFromNodes: vi.fn(),
}));

describe("yjsBinding", () => {
  let doc: Y.Doc;

  beforeEach(() => {
    doc = new Y.Doc();
    useCanvasStore.setState({
      nodes: [],
      edges: [],
    });
  });

  it("populates state when Yjs map receives remote changes", () => {
    const binding = setupYjsBinding(doc);
    const shared = getYjsSharedTypes(doc);

    const testNode: SystemNode = {
      id: "node-1",
      type: "client",
      position: { x: 10, y: 20 },
      data: { label: "Client" },
    };

    const testEdge: SystemEdge = {
      id: "edge-1",
      source: "node-1",
      target: "node-2",
      type: "simulationEdge",
      data: { protocol: "HTTP", latencyMs: 10, errorRate: 0, throughputLimit: null, middleware: [] },
    };

    // Simulate incoming remote transactions by generating and applying a Yjs update
    const remoteDoc = new Y.Doc();
    const remoteShared = getYjsSharedTypes(remoteDoc);
    remoteShared.nodes.set(testNode.id, testNode);
    remoteShared.edges.set(testEdge.id, testEdge);

    const update = Y.encodeStateAsUpdate(remoteDoc);
    Y.applyUpdate(doc, update, "remote-sync");

    // Manually trigger the observers (mocking the WebRTC transaction event loop context)
    // Wait, let's verify if the store got updated
    // setupYjsBinding registers observers directly.
    expect(useCanvasStore.getState().nodes).toContainEqual(testNode);
    expect(useCanvasStore.getState().edges).toContainEqual(testEdge);

    binding(); // Cleanup
  });

  it("applies Zustand changes to Yjs map during local interactions", () => {
    const binding = setupYjsBinding(doc);
    const shared = getYjsSharedTypes(doc);

    const testNode: SystemNode = {
      id: "node-2",
      type: "server",
      position: { x: 100, y: 200 },
      data: { label: "Server" },
    };

    // Update Zustand state (simulates local drag/add node)
    useCanvasStore.setState({
      nodes: [testNode],
      edges: [],
    });

    // Check if the Y.Map was populated accordingly
    const yNode = shared.nodes.get("node-2") as SystemNode | undefined;
    expect(yNode).toBeDefined();
    expect(yNode?.position).toEqual(testNode.position);

    binding(); // Cleanup
  });
});
