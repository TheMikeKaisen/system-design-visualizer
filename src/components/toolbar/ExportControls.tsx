"use client";

import { useCallback, useState } from "react";
import { useDiagramStore }    from "@/lib/store/useDiagramStore";
import { copyShareLink } from "@/lib/export/canvasExport";

export function ExportControls() {
  const [isCopied, setIsCopied] = useState(false);
  const { meta }  = useDiagramStore();

  const handleCopyLink = useCallback(async () => {
    const success = await copyShareLink(meta.id);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [meta.id]);

  return (
    <button
      onClick={handleCopyLink}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs
                 text-muted-foreground hover:text-foreground hover:bg-accent
                 transition-colors"
      title="Copy share link"
    >
      <ShareIcon />
      <span className="hidden sm:inline">
        {isCopied ? "Link copied!" : "Share"}
      </span>
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="3"  cy="7" r="1.5" />
      <circle cx="11" cy="11" r="1.5" />
      <path d="M4.5 6.2L9.5 3.8M4.5 7.8L9.5 10.2" />
    </svg>
  );
}
