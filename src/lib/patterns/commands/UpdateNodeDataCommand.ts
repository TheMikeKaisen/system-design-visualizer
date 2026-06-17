import type { ICommand } from "./ICommand";
import { registerCommand } from "./ICommand";
import type { SystemNodeData, SerializedCommand } from "@/types";
import { useCanvasStore } from "@/lib/store/useCanvasStore";

export class UpdateNodeDataCommand implements ICommand {
  constructor(
    private readonly nodeId:    string,
    private readonly before:    Partial<SystemNodeData>,
    private readonly after:     Partial<SystemNodeData>,
  ) {}

  execute(): void {
    useCanvasStore.getState().updateNodeData(this.nodeId, this.after);
  }

  undo(): void {
    useCanvasStore.getState().updateNodeData(this.nodeId, this.before);
  }

  getDescription(): string {
    return `Update node properties`;
  }

  serialize(): SerializedCommand {
    return {
      type:    "UpdateNodeData",
      payload: {
        nodeId: this.nodeId,
        before: this.before as Record<string, unknown>,
        after:  this.after  as Record<string, unknown>,
      },
      timestamp: Date.now(),
      clientId:  "",
    };
  }
}

registerCommand("UpdateNodeData", (payload) =>
  new UpdateNodeDataCommand(
    payload.nodeId as string,
    payload.before as Partial<SystemNodeData>,
    payload.after  as Partial<SystemNodeData>,
  )
);
