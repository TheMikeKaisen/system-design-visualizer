"use client";

import { useTheme } from "next-themes";
import { useCallback, useState } from "react";
import { useDiagramStore }    from "@/lib/store/useDiagramStore";
import { useCanvasStore }     from "@/lib/store/useCanvasStore";
import { serializeDiagram }   from "@/lib/persistence/diagramSerializer";
import {
  exportCanvasToPng,
  exportDiagramJson,
  copyShareLink,
} from "@/lib/export/canvasExport";

export function ExportControls() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [isCopied,  setIsCopied]  = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { resolvedTheme } = useTheme();
  const { meta }  = useDiagramStore();
  const { nodes, edges, viewport } = useCanvasStore();

  const handleExportPng = useCallback(async () => {
    setIsExporting(true);
    setIsOpen(false);
    try {
      await exportCanvasToPng(nodes, resolvedTheme, {
        format:       "png",
        includeHud:   false,
        scale:        2,
        background:   "auto",
      });
    } catch (err) {
      console.error("[export] PNG export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [nodes, resolvedTheme]);

  const handleExportJson = useCallback(() => {
    setIsOpen(false);
    const diagram = serializeDiagram(nodes, edges, viewport, meta);
    exportDiagramJson(diagram);
  }, [nodes, edges, viewport, meta]);

  const handleCopyLink = useCallback(async () => {
    setIsOpen(false);
    const success = await copyShareLink(meta.id);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [meta.id]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        disabled={isExporting}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs
                   text-muted-foreground hover:text-foreground hover:bg-accent
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Export & Share"
      >
        {isExporting ? <SpinnerIcon /> : <ShareIcon />}
        <span className="hidden sm:inline">
          {isCopied ? "Link copied!" : isExporting ? "Exporting…" : "Share"}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute top-10 right-0 z-50 w-52 rounded-xl border border-border
                       bg-background shadow-md overflow-hidden"
            role="menu"
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Export
              </p>
            </div>
            <div className="py-1">
              <MenuItem
                icon={<ImageIcon />}
                label="Export as PNG"
                description="High-res image (2×)"
                onClick={handleExportPng}
              />
              <MenuItem
                icon={<JsonIcon />}
                label="Export as JSON"
                description="Importable diagram file"
                onClick={handleExportJson}
              />
            </div>
            <div className="px-3 py-2 border-t border-border">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Share
              </p>
            </div>
            <div className="py-1">
              <MenuItem
                icon={<LinkIcon />}
                label="Copy link"
                description="Shareable canvas URL"
                onClick={handleCopyLink}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon, label, description, onClick,
}: {
  icon: React.ReactNode; label: string; description: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      className="w-full flex items-center gap-3 px-4 py-2.5
                 hover:bg-accent transition-colors text-left"
    >
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="3"  cy="7" r="1.5" />
      <circle cx="11" cy="11" r="1.5" />
      <path d="M4.5 6.2L9.5 3.8M4.5 7.8L9.5 10.2" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <rect x="1" y="1" width="12" height="12" rx="2" />
      <circle cx="4.5" cy="4.5" r="1" />
      <path d="M1 9l3-3 2.5 2.5L9 6l4 4" />
    </svg>
  );
}
function JsonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8" />
      <path d="M7 7l4-4M9 3h2v2" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M5.5 8.5L8.5 5.5" />
      <path d="M7 5.5l1.5-1.5a2.12 2.12 0 0 1 3 3L10 8.5" />
      <path d="M7 8.5L5.5 10A2.12 2.12 0 0 1 2.5 7L4 5.5" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5}
         className="animate-spin">
      <path d="M7 1v2M7 11v2M1 7h2M11 7h2" strokeLinecap="round" />
    </svg>
  );
}
