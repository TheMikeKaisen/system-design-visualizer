import type { ICommand } from "./ICommand";
import { registerCommand } from "./ICommand";
import type { SystemNode, SerializedCommand } from "@/types";
import { useCanvasStore } from "@/lib/store/useCanvasStore";

interface Position { x: number; y: number }

export class MoveNodeCommand implements ICommand {
  constructor(
    private readonly nodeId: string,
    private readonly nodeLabel: string,
    private readonly from: Position,
    private readonly to: Position,
  ) {}

  execute(): void {
    useCanvasStore.getState().setNodePosition(this.nodeId, this.to.x, this.to.y);
  }

  undo(): void {
    useCanvasStore.getState().setNodePosition(this.nodeId, this.from.x, this.from.y);
  }

  getDescription(): string {
    return `Move "${this.nodeLabel}"`;
  }

  serialize(): SerializedCommand {
    return {
      type: "MoveNode",
      payload: {
        nodeId: this.nodeId,
        nodeLabel: this.nodeLabel,
        fromX: this.from.x,
        fromY: this.from.y,
        toX: this.to.x,
        toY: this.to.y,
      },
      timestamp: Date.now(),
      clientId: "",
    };
  }
}

registerCommand("MoveNode", (payload) => new MoveNodeCommand(
  payload.nodeId as string,
  payload.nodeLabel as string,
  { x: payload.fromX as number, y: payload.fromY as number },
  { x: payload.toX as number,   y: payload.toY as number  },
));