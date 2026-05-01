import type { ICommand } from "./ICommand";
import { registerCommand } from "./ICommand";
import type { SystemEdgeData, SerializedCommand } from "@/types";
import { useCanvasStore } from "@/lib/store/useCanvasStore";

export class UpdateEdgeDataCommand implements ICommand {
  constructor(
    private readonly edgeId: string,
    private readonly before: Partial<SystemEdgeData>,
    private readonly after: Partial<SystemEdgeData>,
  ) {}

  execute(): void {
    useCanvasStore.getState().updateEdgeData(this.edgeId, this.after);
  }

  undo(): void {
    useCanvasStore.getState().updateEdgeData(this.edgeId, this.before);
  }

  getDescription(): string {
    return `Update edge properties`;
  }

  serialize(): SerializedCommand {
    return {
      type: "UpdateEdgeData",
      payload: {
        edgeId: this.edgeId,
        before: this.before as Record<string, unknown>,
        after: this.after as Record<string, unknown>,
      },
      timestamp: Date.now(),
      clientId: "",
    };
  }
}

registerCommand("UpdateEdgeData", (payload) =>
  new UpdateEdgeDataCommand(
    payload.edgeId as string,
    payload.before as Partial<SystemEdgeData>,
    payload.after as Partial<SystemEdgeData>,
  )
);