import { CanvasStore } from "@/lib/store/useCanvasStore";
import type { ICommand } from "./ICommand";
import type { SystemNode } from "@/types";

export class AddNodeCommand implements ICommand {
  constructor(
    private readonly store: CanvasStore,
    private readonly node: SystemNode
  ) { }

  execute(): void {
    this.store.addNode(this.node);
  }

  undo(): void {
    this.store.removeNode(this.node.id);
  }

  getDescription(): string {
    return `Add ${this.node.data.kind} node "${this.node.data.label}"`;
  }
}