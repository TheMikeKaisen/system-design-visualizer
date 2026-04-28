import type { ICommand, CommandConstructor } from "./ICommand";
import { commandRegistry } from "./ICommand";
import type { SerializedCommand } from "@/types";

interface CommandInvokerOptions {
  /**
   * Called after every local command execution with the serialized form.
   * In the Collaboration phase, this callback broadcasts to Yjs peers.
   * Left undefined during local-only operation.
   */
  onCommandExecuted?: (serialized: SerializedCommand) => void;
  /** Max undo stack depth — prevents unbounded memory growth */
  maxHistorySize?: number;
}

export class CommandInvoker {
  private readonly undoStack: ICommand[] = [];
  private readonly redoStack: ICommand[] = [];
  private readonly actionLog: SerializedCommand[] = [];
  private readonly maxHistorySize: number;
  private readonly onCommandExecuted?: (s: SerializedCommand) => void;

  constructor(options: CommandInvokerOptions = {}) {
    this.maxHistorySize = options.maxHistorySize ?? 100;
    this.onCommandExecuted = options.onCommandExecuted;
  }

  // ── Local execution ────────────────────────────────────

  execute(command: ICommand): void {
    command.execute();

    this.undoStack.push(command);
    // Trim history if over limit
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    // Any new action clears the redo branch
    this.redoStack.length = 0;

    const serialized = command.serialize();
    this.actionLog.push(serialized);
    this.onCommandExecuted?.(serialized);
  }

 /**
 * Records a command on the undo stack WITHOUT calling execute().
 * Use when the action was already applied externally (e.g., React Flow drag).
 * The command's undo() and redo() still work normally.
 */
  record(command: ICommand): void {
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
    this.actionLog.push(command.serialize());
    // NOTE: onCommandExecuted is NOT called here — no broadcast for recorded commands
    // because the action originated locally and is already applied.
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;
    command.execute();
    this.undoStack.push(command);
  }

  // ── Remote replay (Collaboration phase) ───────────────

  /**
   * Reconstructs and executes a command received from a remote peer via Yjs.
   * Does NOT push to undo stack — remote operations are not locally undoable.
   * Does NOT call onCommandExecuted — prevents broadcast loops.
   */
  applyRemote(serialized: SerializedCommand): void {
    const constructor = commandRegistry.get(serialized.type);
    if (!constructor) {
      console.warn(
        `[CommandInvoker] Unknown remote command type: ${serialized.type}. ` +
        `Register it via registerCommand().`
      );
      return;
    }
    const command = constructor(serialized.payload);
    command.execute();
  }

  // ── Inspection ─────────────────────────────────────────

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getHistory(): SerializedCommand[] {
    return [...this.actionLog];
  }

  getUndoDescription(): string | null {
    return this.undoStack.at(-1)?.getDescription() ?? null;
  }

  getRedoDescription(): string | null {
    return this.redoStack.at(-1)?.getDescription() ?? null;
  }
}