import { create } from "zustand";
import { CommandInvoker } from "@/lib/patterns/commands/CommandInvoker";
import type { ICommand } from "@/lib/patterns/commands/ICommand";
import type { SerializedCommand } from "@/types";

// ─────────────────────────────────────────────
// Singleton invoker — created once, lives forever

/**
 * The single CommandInvoker instance for the entire app.
 * Import this directly in event handlers — don't use the hook for imperative calls.
 * Use useHistoryStore() only for reactive UI state (canUndo, canRedo labels).
 */
export const commandInvoker = new CommandInvoker({
  maxHistorySize: 100,
  onCommandExecuted: (serialized: SerializedCommand) => {
    // Sync reactive state after every execution
    useHistoryStore.getState()._syncFromInvoker();
  },
});

// ─────────────────────────────────────────────
// Reactive store — only UI state, no logic
// ─────────────────────────────────────────────

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;

  // Actions — these wrap the singleton invoker
  execute: (command: ICommand) => void;
  undo: () => void;
  redo: () => void;
  /**
   * Adds a command to the undo stack WITHOUT executing it.
   * Use this when the action has already been applied by React Flow
   * (e.g., node drag — React Flow moved the node, we just need undo support).
   */
  record: (command: ICommand) => void;

  // Internal — called by the invoker's onCommandExecuted callback
  _syncFromInvoker: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  canUndo: false,
  canRedo: false,
  undoLabel: null,
  redoLabel: null,

  execute: (command) => {
    commandInvoker.execute(command);
    // _syncFromInvoker called by onCommandExecuted callback above
  },

  undo: () => {
    commandInvoker.undo();
    useHistoryStore.getState()._syncFromInvoker();
  },

  redo: () => {
    commandInvoker.redo();
    useHistoryStore.getState()._syncFromInvoker();
  },

  record: (command) => {
    commandInvoker.record(command);
    useHistoryStore.getState()._syncFromInvoker();
  },

  _syncFromInvoker: () =>
    set({
      canUndo: commandInvoker.canUndo(),
      canRedo: commandInvoker.canRedo(),
      undoLabel: commandInvoker.getUndoDescription(),
      redoLabel: commandInvoker.getRedoDescription(),
    }),
}));