"use client";

import { useEffect, useRef } from "react";
import type { OSLogEntry } from "@/lib/os-simulator/engine";

interface OSLogPanelProps {
  entries: OSLogEntry[];
}

export function OSLogPanel({ entries }: OSLogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div className="rounded-lg border border-border/40 bg-card/50 overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border/30 px-3 py-2">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted-foreground/60"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          OS Log
        </span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground/40">
          {entries.length}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[200px] overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed"
      >
        {entries.length === 0 ? (
          <p className="text-muted-foreground/30 italic">No events yet</p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={`${entry.timeMs}-${i}`}
              className="flex gap-2 py-0.5"
            >
              <span className="shrink-0 text-muted-foreground/40 tabular-nums">
                {String(entry.timeMs).padStart(5, " ")}ms
              </span>
              <span className="text-muted-foreground">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
