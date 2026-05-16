"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDiagramStore } from "@/lib/store/useDiagramStore";

export function DiagramNameInput() {
  const { meta, isDirty, rename, save } = useDiagramStore();
  const [draft, setDraft] = useState(meta.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync when the diagram is loaded from outside
  useEffect(() => {
    setDraft(meta.name);
  }, [meta.id, meta.name]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(meta.name); // revert empty
      return;
    }
    if (trimmed !== meta.name) {
      rename(trimmed);
      save();
    }
  }, [draft, meta.name, rename, save]);

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); inputRef.current?.blur(); }
          if (e.key === "Escape") { setDraft(meta.name); inputRef.current?.blur(); }
        }}
        className="min-w-0 max-w-[200px] text-sm font-medium bg-transparent
                   border-0 border-b border-transparent hover:border-border
                   focus:border-primary focus:outline-none text-foreground
                   transition-colors px-0.5 py-0.5 truncate"
        aria-label="Diagram name"
      />
      {isDirty && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
          title="Unsaved changes"
          aria-label="Unsaved changes"
        />
      )}
    </div>
  );
}
