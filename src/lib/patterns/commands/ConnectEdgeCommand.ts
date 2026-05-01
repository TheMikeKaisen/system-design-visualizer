import type { ICommand } from "./ICommand";
import { registerCommand } from "./ICommand";
import type { SystemEdge, SerializedCommand } from "@/types";
import { useCanvasStore } from "@/lib/store/useCanvasStore";

export class ConnectEdgeCommand implements ICommand {
  constructor(private readonly edge: SystemEdge) {}

  execute(): void {
    useCanvasStore.getState().restoreEdge(this.edge);
  }

  undo(): void {
    useCanvasStore.getState().removeEdge(this.edge.id);
  }

  getDescription(): string {
    return `Connect ${this.edge.source} → ${this.edge.target}`;
  }

  serialize(): SerializedCommand {
    return {
      type: "ConnectEdge",
      payload: { edge: this.edge as unknown as Record<string, unknown> },
      timestamp: Date.now(),
      clientId: "",
    };
  }
}

registerCommand("ConnectEdge", (payload) =>
  new ConnectEdgeCommand(payload.edge as unknown as SystemEdge)
);