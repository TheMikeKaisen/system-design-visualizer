import type { ICommand } from "./ICommand";
import { registerCommand } from "./ICommand";
import type { SystemEdge, SerializedCommand } from "@/types";
import { useCanvasStore } from "@/lib/store/useCanvasStore";

export class DeleteEdgeCommand implements ICommand {
  constructor(private readonly edge: SystemEdge) {}

  execute(): void {
    useCanvasStore.getState().removeEdge(this.edge.id);
  }

  undo(): void {
    useCanvasStore.getState().restoreEdge(this.edge);
  }

  getDescription(): string {
    return `Delete edge ${this.edge.source} → ${this.edge.target}`;
  }

  serialize(): SerializedCommand {
    return {
      type: "DeleteEdge",
      payload: { edge: this.edge as unknown as Record<string, unknown> },
      timestamp: Date.now(),
      clientId: "",
    };
  }
}

registerCommand("DeleteEdge", (payload) =>
  new DeleteEdgeCommand(payload.edge as unknown as SystemEdge)
);
