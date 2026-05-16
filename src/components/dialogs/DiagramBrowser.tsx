"use client";

import { useEffect, useState, useCallback } from "react";
import { useDiagramStore } from "@/lib/store/useDiagramStore";
import { localStoragePersistence } from "@/lib/persistence/localStoragePersistence";
import type { SerializedDiagram, DiagramListItem } from "@/types";

interface DiagramBrowserProps {
  onClose: () => void;
  onLoad: (diagram: SerializedDiagram) => void;
}

export function DiagramBrowser({ onClose, onLoad }: DiagramBrowserProps) {
  const { savedList, deleteSaved, refreshList } = useDiagramStore();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const handleLoad = useCallback(
    (item: DiagramListItem) => {
      setLoadError(null);
      const diagram = localStoragePersistence.load(item.id);
      if (!diagram) {
        setLoadError(`Could not load "${item.name}". The file may be corrupted.`);
        return;
      }
      onLoad(diagram);
    },
    [onLoad]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
      deleteSaved(id);
    },
    [deleteSaved]
  );

  return (
    // Overlay — using an in-flow div so iframe height isn't collapsed
    <div
      className="absolute inset-0 z-50 flex items-center justify-center
                 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[480px] max-h-[70vh] flex flex-col rounded-xl border border-border
                   bg-background shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Open diagram"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Saved diagrams</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {savedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-sm text-muted-foreground">No saved diagrams yet.</p>
              <p className="text-xs text-muted-foreground/60">
                Diagrams auto-save as you work.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {savedList.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleLoad(item)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 text-left
                               hover:bg-accent transition-colors group"
                  >
                    {/* Diagram icon */}
                    <div className="shrink-0 w-9 h-9 rounded-lg border border-border
                                    bg-muted/40 flex items-center justify-center">
                      <DiagramIcon />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.nodeCount} nodes · {item.edgeCount} edges ·{" "}
                        {formatRelativeTime(item.updatedAt)}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDelete(e, item.id, item.name)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5
                                 text-muted-foreground hover:text-destructive transition-all
                                 rounded hover:bg-destructive/10"
                      aria-label={`Delete ${item.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Error */}
        {loadError && (
          <div className="px-5 py-3 border-t border-border bg-destructive/5">
            <p className="text-xs text-destructive" role="alert">{loadError}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>;
}
function DiagramIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="text-muted-foreground"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M2 4h10M5 4V2h4v2M5 7v4M9 7v4"/><path d="M3 4l1 8h6l1-8"/></svg>;
}
