import type { ICommand } from "./ICommand";
import { registerCommand } from "./ICommand";
import type { SystemNode, SystemEdge, SerializedCommand } from "@/types";
import { useCanvasStore } from "@/lib/store/useCanvasStore";

export class DeleteNodeCommand implements ICommand {
  private readonly node: SystemNode;
  /** All edges where source === node.id OR target === node.id */
  private readonly connectedEdges: SystemEdge[];

  constructor(node: SystemNode, connectedEdges: SystemEdge[]) {
    this.node = node;
    this.connectedEdges = connectedEdges;
  }

  execute(): void {
    const store = useCanvasStore.getState();
    store.removeNode(this.node.id);
    // removeNode already removes connected edges in our store implementation
  }

  undo(): void {
    const store = useCanvasStore.getState();
    // Restore node first, then edges (edges reference node IDs)
    store.addNode(this.node);
    for (const edge of this.connectedEdges) {
      store.restoreEdge(edge);
    }
  }

  getDescription(): string {
    return `Delete ${this.node.data.kind} "${this.node.data.label}"`;
  }

  serialize(): SerializedCommand {
    return {
      type: "DeleteNode",
      payload: {
        nodeId: this.node.id,
        // Peers need the full snapshot to be able to apply remote deletes
        // and reconstruct for undo if they originated the action
        node: this.node as unknown as Record<string, unknown>,
        connectedEdges: this.connectedEdges as unknown as Record<string, unknown>[],
      },
      timestamp: Date.now(),
      clientId: "",
    };
  }
}

registerCommand("DeleteNode", (payload) => {
  const store = useCanvasStore.getState();
  const node = store.nodes.find((n) => n.id === payload.nodeId);
  if (!node) {
    // Node already gone — create a no-op command
    return {
      execute: () => {},
      undo: () => {},
      getDescription: () => "Delete node (already removed)",
      serialize: () => ({ type: "DeleteNode", payload, timestamp: Date.now(), clientId: "" }),
    };
  }
  const edges = store.edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );
  return new DeleteNodeCommand(node, edges);
});