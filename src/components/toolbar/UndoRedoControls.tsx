"use client";

import { useHistoryStore } from "@/lib/store/useHistoryStore";

export function UndoRedoControls() {
  const { canUndo, canRedo, undoLabel, redoLabel, undo, redo } = useHistoryStore();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        title={undoLabel ? `Undo: ${undoLabel}` : "Nothing to undo"}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs
                   text-muted-foreground hover:text-foreground hover:bg-accent
                   disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
      >
        <UndoIcon />
        <span className="hidden sm:inline">Undo</span>
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        title={redoLabel ? `Redo: ${redoLabel}` : "Nothing to redo"}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs
                   text-muted-foreground hover:text-foreground hover:bg-accent
                   disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
      >
        <RedoIcon />
        <span className="hidden sm:inline">Redo</span>
      </button>
    </div>
  );
}

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M2 6H9a3 3 0 0 1 0 6H7" />
      <path d="M4 4L2 6l2 2" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M12 6H5a3 3 0 0 0 0 6h2" />
      <path d="M10 4l2 2-2 2" />
    </svg>
  );
}