import { nanoid } from "nanoid";
import type { ICommand } from "./ICommand";
import { registerCommand } from "./ICommand";
import type { SystemNode, SerializedCommand } from "@/types";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { createNode } from "@/components/nodes/NodeFactory";

export class AddNodeCommand implements ICommand {
  private readonly node: SystemNode;

  constructor(node: SystemNode) {
    this.node = node;
  }

  execute(): void {
    useCanvasStore.getState().addNode(this.node);
  }

  undo(): void {
    useCanvasStore.getState().removeNode(this.node.id);
  }

  getDescription(): string {
    return `Add ${this.node.data.kind} "${this.node.data.label}"`;
  }

  serialize(): SerializedCommand {
    return {
      type: "AddNode",
      payload: {
        // Only serializable primitives — no class instances
        id: this.node.id,
        kind: this.node.data.kind,
        label: this.node.data.label,
        positionX: this.node.position.x,
        positionY: this.node.position.y,
        metadata: this.node.data.metadata,
      },
      timestamp: Date.now(),
      clientId: "", // Populated by CollaborationProvider before broadcast
    };
  }
}

// Register so remote peers can reconstruct this command
registerCommand("AddNode", (payload) => {
  const node = createNode({
    kind: payload.kind as SystemNode["data"]["kind"],
    label: payload.label as string,
    position: {
      x: payload.positionX as number,
      y: payload.positionY as number,
    },
    // Force the same ID the originating peer used — referential stability
    forceId: payload.id as string,
  });
  return new AddNodeCommand(node);
});