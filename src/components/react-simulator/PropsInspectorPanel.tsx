"use client";

import React from "react";
import { PropsInspectorEntry } from "@/lib/react-simulator/engine";

interface PropsInspectorPanelProps {
  entries: PropsInspectorEntry[] | null | undefined;
}

export function PropsInspectorPanel({ entries }: PropsInspectorPanelProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 shrink-0">
        <svg className="w-4 h-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="text-xs font-medium text-zinc-300">Props Inspector — Counter</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4">
        {entries && entries.length > 0 ? (
          <div className="flex flex-col gap-3">
            {/* Table header */}
            <div className="grid grid-cols-3 gap-2 px-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Prop</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Value</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Flags</span>
            </div>

            {/* Rows */}
            {entries.map((entry) => (
              <div
                key={entry.name}
                className={`
                  grid grid-cols-3 gap-2 items-center rounded-xl px-3 py-3 border transition-all duration-500
                  ${entry.isNew
                    ? "border-emerald-500/50 bg-emerald-900/20 shadow-[0_0_16px_-4px_rgba(16,185,129,0.3)]"
                    : "border-zinc-700/50 bg-zinc-900/40"}
                `}
              >
                {/* Name */}
                <span className="text-sm font-mono font-medium text-blue-300">{entry.name}</span>

                {/* Value */}
                <div className="flex items-center gap-1.5">
                  {entry.isFunction ? (
                    <span className="text-sm font-mono text-amber-300">{entry.value}</span>
                  ) : entry.isNew ? (
                    <span className="text-sm font-mono text-emerald-300 font-bold">{entry.value}</span>
                  ) : (
                    <span className="text-sm font-mono text-zinc-200">{entry.value}</span>
                  )}
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-1">
                  {entry.isReadOnly && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      read-only
                    </span>
                  )}
                  {entry.isFunction && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      fn()
                    </span>
                  )}
                  {entry.isNew && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      updated
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Footer note */}
            <p className="text-xs text-zinc-600 italic mt-2 px-1">
              Props are read-only inside the child component. To change them, the parent must re-render with new values.
            </p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600 text-sm">
            No props in scope yet
          </div>
        )}
      </div>
    </div>
  );
}
