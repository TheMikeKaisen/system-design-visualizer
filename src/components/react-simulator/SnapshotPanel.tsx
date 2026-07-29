"use client";

import React from "react";
import { SnapshotEntry } from "@/lib/react-simulator/engine";

interface SnapshotPanelProps {
  entries: SnapshotEntry[] | undefined;
  renderCount?: number;
}

export function SnapshotPanel({ entries, renderCount }: SnapshotPanelProps) {
  const hasEntries = entries && entries.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium text-zinc-300">Snapshot (Current Render)</span>
        </div>
        {renderCount !== undefined && (
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            Render #{renderCount}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
        {/* Frozen label */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-amber-500">
            Frozen for this render
          </span>
        </div>

        {hasEntries ? (
          <div className="flex flex-col gap-2">
            {entries!.map((entry) => (
              <div
                key={entry.name}
                className={`
                  flex items-center justify-between gap-4 rounded-xl px-4 py-3 border transition-all duration-300
                  ${entry.isStale
                    ? "border-red-500/50 bg-red-900/20 shadow-[0_0_16px_-4px_rgba(239,68,68,0.4)]"
                    : "border-amber-500/20 bg-amber-900/10"}
                `}
              >
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-amber-300">const</code>
                  <code className="text-sm font-mono text-zinc-100 font-bold">{entry.name}</code>
                  <code className="text-sm font-mono text-zinc-500">=</code>
                  <code
                    className={`text-sm font-mono font-bold ${entry.isStale ? "text-red-300" : "text-emerald-300"}`}
                  >
                    {entry.value}
                  </code>
                </div>
                <div className="flex items-center gap-1.5">
                  {entry.isStale ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      ⚠ STALE
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      FROZEN
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Explanation */}
            <p className="text-xs text-zinc-600 italic mt-1 px-1 leading-relaxed">
              This value is a plain JavaScript <code className="text-zinc-400">const</code>. It cannot change
              mid-function — it is a snapshot of state at the time this render ran.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-zinc-600 text-sm">
            No snapshot yet
          </div>
        )}
      </div>
    </div>
  );
}
