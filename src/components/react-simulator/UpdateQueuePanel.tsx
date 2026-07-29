"use client";

import React from "react";
import { UpdateQueueEntry } from "@/lib/react-simulator/engine";

interface UpdateQueuePanelProps {
  queue: UpdateQueueEntry[] | undefined;
  resolvedValue: string | null | undefined;
}

export function UpdateQueuePanel({ queue, resolvedValue }: UpdateQueuePanelProps) {
  const hasQueue = queue && queue.length > 0;
  const hasResolved = resolvedValue !== null && resolvedValue !== undefined;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 shrink-0">
        <svg className="w-4 h-4 text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="text-xs font-medium text-zinc-300">React's Internal Update Queue</span>
        {hasQueue && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">
            {queue!.length} queued
          </span>
        )}
      </div>

      {/* Queue entries */}
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
        {hasQueue ? (
          <>
            {/* Entry list */}
            <div className="flex flex-col gap-2">
              {queue!.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`
                    relative flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-500
                    ${entry.isProcessed
                      ? entry.isStale
                        ? "border-orange-500/40 bg-orange-900/10"
                        : "border-emerald-500/40 bg-emerald-900/10"
                      : entry.isStale
                        ? "border-red-500/40 bg-red-900/10"
                        : "border-purple-500/40 bg-purple-900/10"}
                  `}
                >
                  {/* Index badge */}
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                      ${entry.isProcessed
                        ? "bg-zinc-700 text-zinc-300"
                        : "bg-purple-500/30 text-purple-300"}
                    `}
                  >
                    {idx + 1}
                  </div>

                  {/* Entry content */}
                  <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    <div className="flex items-center gap-2 mb-1">
                      {entry.type === "fn" ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                          FUNCTION
                        </span>
                      ) : (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${entry.isStale
                            ? "bg-red-500/20 text-red-400 border-red-500/20"
                            : "bg-purple-500/20 text-purple-400 border-purple-500/20"
                            }`}
                        >
                          VALUE
                        </span>
                      )}
                      {entry.isStale && !entry.isProcessed && (
                        <span className="text-[9px] font-bold text-red-400">⚠ uses stale snapshot</span>
                      )}
                    </div>

                    {/* Label */}
                    <code className="text-sm font-mono text-zinc-100">setCount({entry.displayLabel})</code>
                  </div>

                  {/* Resolved arrow */}
                  {entry.isProcessed && entry.resolvedTo !== undefined && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-zinc-500">→</span>
                      <span
                        className={`text-sm font-bold font-mono ${entry.isStale ? "text-orange-300" : "text-emerald-300"
                          }`}
                      >
                        {entry.resolvedTo}
                      </span>
                    </div>
                  )}

                  {/* Processed checkmark */}
                  {entry.isProcessed && (
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${entry.isStale ? "bg-orange-500/20 text-orange-300" : "bg-emerald-500/20 text-emerald-300"
                        }`}
                    >
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Empty state for queue */}
            {!hasQueue && (
              <div className="flex flex-1 items-center justify-center text-zinc-600 text-sm">
                Queue is empty
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-zinc-600 text-sm">
            Queue is empty — no setState calls queued yet
          </div>
        )}
      </div>

      {/* Resolved value footer */}
      {hasResolved && (
        <div
          className={`
            shrink-0 border-t px-4 py-3 flex items-center justify-between
            ${resolvedValue === "3"
              ? "border-emerald-500/30 bg-emerald-900/20"
              : "border-orange-500/30 bg-orange-900/20"}
          `}
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">
              Final Resolved Value
            </span>
            <span className="text-xs text-zinc-400 mt-0.5">After React processes the full queue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold font-mono text-white">{resolvedValue}</span>
            {resolvedValue === "3" ? (
              <span className="text-lg">✅</span>
            ) : (
              <span className="text-lg">⚠️</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
