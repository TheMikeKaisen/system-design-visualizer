"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDiagramStore } from "@/lib/store/useDiagramStore";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { localStoragePersistence } from "@/lib/persistence/localStoragePersistence";
import { exportDiagramToFile, importDiagramFromFile } from "@/lib/persistence/fileIO";
import { serializeDiagram } from "@/lib/persistence/diagramSerializer";
import { DiagramBrowser } from "@/components/dialogs/DiagramBrowser";

export function DiagramControls() {
  const router = useRouter();
  const { meta, isDirty, isSaving, save, newDiagram, loadDiagram } = useDiagramStore();
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // ── New ────────────────────────────────────────────────────────────

  const handleNew = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm(
        "You have unsaved changes. Create a new diagram anyway?"
      );
      if (!ok) return;
    }
    const newMeta = newDiagram();
    router.push(`/canvas/${newMeta.id}`);
  }, [isDirty, newDiagram, router]);

  // ── Save ───────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    save();
  }, [save]);

  // ── Export ─────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const { nodes, edges, viewport } = useCanvasStore.getState();
    const diagram = serializeDiagram(nodes, edges, viewport, meta);
    exportDiagramToFile(diagram);
  }, [meta]);

  // ── Import ─────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    setImportError(null);
    const result = await importDiagramFromFile();
    if (!result.ok) {
      if (result.error !== "Cancelled.") setImportError(result.error);
      return;
    }
    loadDiagram(result.diagram);
    router.push(`/canvas/${result.diagram.meta.id}`);
  }, [loadDiagram, router]);

  return (
    <>
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={handleNew} title="New diagram">
          <NewIcon /> <span className="hidden md:inline">New</span>
        </ToolbarButton>

        <ToolbarButton onClick={() => setIsBrowserOpen(true)} title="Open saved diagram">
          <OpenIcon /> <span className="hidden md:inline">Open</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          title={isDirty ? "Save changes" : "No changes to save"}
          className={isDirty ? "text-foreground" : ""}
        >
          <SaveIcon />
          <span className="hidden md:inline">
            {isSaving ? "Saving…" : "Save"}
          </span>
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-0.5" />

        <ToolbarButton onClick={handleExport} title="Export as .sysvis.json">
          <ExportIcon /> <span className="hidden md:inline">Export</span>
        </ToolbarButton>

        <ToolbarButton onClick={handleImport} title="Import a .sysvis.json file">
          <ImportIcon /> <span className="hidden md:inline">Import</span>
        </ToolbarButton>
      </div>

      {importError && (
        <span className="text-xs text-destructive ml-2" role="alert">
          {importError}
        </span>
      )}

      {isBrowserOpen && (
        <DiagramBrowser
          onClose={() => setIsBrowserOpen(false)}
          onLoad={(diagram) => {
            loadDiagram(diagram);
            router.push(`/${diagram.meta.id}`);
            setIsBrowserOpen(false);
          }}
        />
      )}
    </>
  );
}

// ─── Shared button ────────────────────────────────────────────────────

function ToolbarButton({
  children, onClick, disabled = false, title, className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs
                  text-muted-foreground hover:text-foreground hover:bg-accent
                  disabled:opacity-35 disabled:cursor-not-allowed transition-colors
                  ${className}`}
    >
      {children}
    </button>
  );
}

function NewIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="2" y="2" width="10" height="10" rx="2"/><path d="M7 5v4M5 7h4"/></svg>;
}
function OpenIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M2 5h10v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z"/><path d="M2 5l2-3h6l1 3"/></svg>;
}
function SaveIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M11 12H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h7l2 2v7a1 1 0 0 1-1 1z"/><rect x="4" y="7" width="6" height="5"/><rect x="4" y="2" width="4" height="3"/></svg>;
}
function ExportIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M7 2v7M4 6l3 3 3-3"/><path d="M2 10v2h10v-2"/></svg>;
}
function ImportIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M7 9V2M4 6l3-3 3 3"/><path d="M2 10v2h10v-2"/></svg>;
}
