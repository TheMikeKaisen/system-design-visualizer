import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore } from "../useCanvasStore";
import type { SystemNode, SystemEdge } from "@/types";

describe("useCanvasStore", () => {
  beforeEach(() => {
    // Reset state before each test
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: [],
      selectedEdgeId: null,
    });
  });

  it("can add a node", () => {
    const node: SystemNode = { id: "n1", type: "apiGateway", position: { x: 0, y: 0 }, data: { label: "N1" } };
    useCanvasStore.getState().addNode(node);
    expect(useCanvasStore.getState().nodes).toHaveLength(1);
    expect(useCanvasStore.getState().nodes[0].id).toBe("n1");
  });

  it("can remove a node and its edges", () => {
    const n1: SystemNode = { id: "n1", type: "apiGateway", position: { x: 0, y: 0 }, data: { label: "N1" } };
    const n2: SystemNode = { id: "n2", type: "apiGateway", position: { x: 0, y: 0 }, data: { label: "N2" } };
    const edge: SystemEdge = { id: "e1", source: "n1", target: "n2" };
    
    useCanvasStore.getState().addNode(n1);
    useCanvasStore.getState().addNode(n2);
    useCanvasStore.setState({ edges: [edge] });
    
    useCanvasStore.getState().removeNode("n1");
    expect(useCanvasStore.getState().nodes).toHaveLength(1);
    expect(useCanvasStore.getState().edges).toHaveLength(0);
  });

  it("can update node data", () => {
    const node: SystemNode = { id: "n1", type: "apiGateway", position: { x: 0, y: 0 }, data: { label: "N1" } };
    useCanvasStore.getState().addNode(node);
    
    useCanvasStore.getState().updateNodeData("n1", { label: "Updated" });
    expect(useCanvasStore.getState().nodes[0].data.label).toBe("Updated");
  });

  it("can set node position", () => {
    const node: SystemNode = { id: "n1", type: "apiGateway", position: { x: 0, y: 0 }, data: { label: "N1" } };
    useCanvasStore.getState().addNode(node);
    
    useCanvasStore.getState().setNodePosition("n1", 100, 200);
    expect(useCanvasStore.getState().nodes[0].position).toEqual({ x: 100, y: 200 });
  });

  it("can update edge data", () => {
    const edge: SystemEdge = { id: "e1", source: "n1", target: "n2", data: { protocol: "http" } };
    useCanvasStore.setState({ edges: [edge] });
    
    useCanvasStore.getState().updateEdgeData("e1", { protocol: "grpc" });
    expect(useCanvasStore.getState().edges[0].data?.protocol).toBe("grpc");
  });

  it("can restore an edge", () => {
    const edge: SystemEdge = { id: "e1", source: "n1", target: "n2" };
    useCanvasStore.getState().restoreEdge(edge);
    expect(useCanvasStore.getState().edges).toHaveLength(1);
    
    // Test duplicate restore ignores
    useCanvasStore.getState().restoreEdge(edge);
    expect(useCanvasStore.getState().edges).toHaveLength(1);
  });

  it("can remove an edge", () => {
    const edge: SystemEdge = { id: "e1", source: "n1", target: "n2" };
    useCanvasStore.setState({ edges: [edge] });
    
    useCanvasStore.getState().removeEdge("e1");
    expect(useCanvasStore.getState().edges).toHaveLength(0);
  });

  it("handles selection and viewport", () => {
    useCanvasStore.getState().setSelectedNodeIds(["n1"]);
    expect(useCanvasStore.getState().selectedNodeIds).toEqual(["n1"]);
    
    useCanvasStore.getState().setSelectedEdgeId("e1");
    expect(useCanvasStore.getState().selectedEdgeId).toBe("e1");
    
    useCanvasStore.getState().setViewport({ x: 10, y: 20, zoom: 2 });
    expect(useCanvasStore.getState().viewport).toEqual({ x: 10, y: 20, zoom: 2 });
  });

  it("handles react flow changes", () => {
    useCanvasStore.getState().addNode({ id: "n1", type: "apiGateway", position: { x: 0, y: 0 }, data: { label: "N1" } });
    useCanvasStore.getState().onNodesChange([{ type: "remove", id: "n1" }]);
    expect(useCanvasStore.getState().nodes).toHaveLength(0);
    
    useCanvasStore.setState({ edges: [{ id: "e1", source: "n1", target: "n2" }] });
    useCanvasStore.getState().onEdgesChange([{ type: "remove", id: "e1" }]);
    expect(useCanvasStore.getState().edges).toHaveLength(0);
  });
  
  it("handles onConnect", () => {
    useCanvasStore.getState().onConnect({ source: "n1", target: "n2", sourceHandle: null, targetHandle: null });
    expect(useCanvasStore.getState().edges).toHaveLength(1);
    expect(useCanvasStore.getState().edges[0].source).toBe("n1");
  });
});
