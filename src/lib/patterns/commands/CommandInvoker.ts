import { ICommand } from "./ICommand";

export class CommandInvoker {
  private readonly undoStack: ICommand[] = [];
  private readonly redoStack: ICommand[] = [];
  private readonly actionLog: string[] = [];

  execute(command: ICommand): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack.length = 0; // A new command clears the redo branch
    this.actionLog.push(`[${new Date().toISOString()}] ${command.getDescription()}`);
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

  getHistory(): string[] {
    return [...this.actionLog];
  }
}
