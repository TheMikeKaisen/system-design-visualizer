import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommandInvoker } from "../commands/CommandInvoker";
import type { ICommand } from "../commands/ICommand";
import type { SerializedCommand } from "@/types";

function makeMockCommand(description = "mock"): ICommand & {
  executeSpy: ReturnType<typeof vi.fn>;
  undoSpy: ReturnType<typeof vi.fn>;
} {
  const executeSpy = vi.fn();
  const undoSpy = vi.fn();
  return {
    execute: executeSpy,
    undo: undoSpy,
    getDescription: () => description,
    serialize: (): SerializedCommand => ({
      type: "MockCommand",
      payload: { description },
      timestamp: Date.now(),
      clientId: "test-client",
    }),
    executeSpy,
    undoSpy,
  };
}

describe("CommandInvoker — basic operation", () => {
  let invoker: CommandInvoker;
  beforeEach(() => { invoker = new CommandInvoker(); });

  it("executes a command", () => {
    const cmd = makeMockCommand();
    invoker.execute(cmd);
    expect(cmd.executeSpy).toHaveBeenCalledOnce();
  });

  it("undoes the last command", () => {
    const cmd = makeMockCommand();
    invoker.execute(cmd);
    invoker.undo();
    expect(cmd.undoSpy).toHaveBeenCalledOnce();
  });

  it("redoes an undone command", () => {
    const cmd = makeMockCommand();
    invoker.execute(cmd);
    invoker.undo();
    invoker.redo();
    expect(cmd.executeSpy).toHaveBeenCalledTimes(2);
  });

  it("clears redo stack when a new command is executed", () => {
    const cmd1 = makeMockCommand("1");
    const cmd2 = makeMockCommand("2");
    invoker.execute(cmd1);
    invoker.undo();
    expect(invoker.canRedo()).toBe(true);
    invoker.execute(cmd2);
    expect(invoker.canRedo()).toBe(false);
  });

  it("does nothing on undo when stack is empty", () => {
    expect(() => invoker.undo()).not.toThrow();
  });

  it("does nothing on redo when stack is empty", () => {
    expect(() => invoker.redo()).not.toThrow();
  });

  it("canUndo returns false on empty stack", () => {
    expect(invoker.canUndo()).toBe(false);
  });

  it("canRedo returns false before any undo", () => {
    invoker.execute(makeMockCommand());
    expect(invoker.canRedo()).toBe(false);
  });
});

describe("CommandInvoker — history", () => {
  it("records serialized commands in action log", () => {
    const invoker = new CommandInvoker();
    invoker.execute(makeMockCommand("first"));
    invoker.execute(makeMockCommand("second"));
    const history = invoker.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].payload.description).toBe("first");
  });

  it("respects maxHistorySize", () => {
    const invoker = new CommandInvoker({ maxHistorySize: 3 });
    for (let i = 0; i < 5; i++) invoker.execute(makeMockCommand(`cmd-${i}`));
    expect(invoker.canUndo()).toBe(true);
    // Can only undo 3 times max
    invoker.undo(); invoker.undo(); invoker.undo();
    expect(invoker.canUndo()).toBe(false);
  });
});

describe("CommandInvoker — collaboration", () => {
  it("calls onCommandExecuted callback with serialized command", () => {
    const onExecuted = vi.fn();
    const invoker = new CommandInvoker({ onCommandExecuted: onExecuted });
    invoker.execute(makeMockCommand("collab-test"));
    expect(onExecuted).toHaveBeenCalledOnce();
    expect(onExecuted.mock.calls[0][0].type).toBe("MockCommand");
  });

  it("applyRemote does not push to undo stack", async () => {
    const invoker = new CommandInvoker();
    // Register a mock command type
    const { registerCommand } = await import("../commands/ICommand");
    registerCommand("MockCommand", (payload) => makeMockCommand(payload.description as string));

    invoker.applyRemote({
      type: "MockCommand",
      payload: { description: "remote" },
      timestamp: Date.now(),
      clientId: "peer-123",
    });

    expect(invoker.canUndo()).toBe(false);
  });

  it("applyRemote logs a warning for unknown command types", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const invoker = new CommandInvoker();
    invoker.applyRemote({
      type: "UnknownCommandXYZ",
      payload: {},
      timestamp: Date.now(),
      clientId: "peer",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("UnknownCommandXYZ")
    );
    warnSpy.mockRestore();
  });
});