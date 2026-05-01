"use client";

import { useEffect } from "react";
import { useHistoryStore } from "@/lib/store/useHistoryStore";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { DeleteNodeCommand } from "@/lib/patterns/commands/DeleteNodeCommand";
import { commandInvoker } from "@/lib/store/useHistoryStore";

/**
 * Global keyboard shortcuts for the canvas.
 * Mount once inside CanvasRoot — not inside a node component.
 *
 * Shortcuts:
 *   Cmd/Ctrl + Z          → Undo
 *   Cmd/Ctrl + Shift + Z  → Redo
 *   Cmd/Ctrl + Y          → Redo (Windows)
 *   Delete / Backspace    → Delete selected nodes
 *   Escape                → Deselect all
 */
export function useKeyboardShortcuts() {
  const { undo, redo } = useHistoryStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ignore shortcuts when the user is typing in an input
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTyping) return;

      if (modKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if (modKey && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelectedNodes();
        return;
      }

      if (e.key === "Escape") {
        useCanvasStore.getState().setSelectedNodeIds([]);
        useCanvasStore.getState().setSelectedEdgeId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);
}

function deleteSelectedNodes(): void {
  const { nodes, edges, selectedNodeIds } = useCanvasStore.getState();

  for (const id of selectedNodeIds) {
    const node = nodes.find((n) => n.id === id);
    if (!node) continue;
    const connectedEdges = edges.filter(
      (e) => e.source === id || e.target === id
    );
    commandInvoker.execute(new DeleteNodeCommand(node, connectedEdges));
  }
}