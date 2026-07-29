"use client";

import React from "react";
import { ComponentTreeNode } from "@/lib/react-simulator/engine";

interface ComponentTreePanelProps {
  tree: ComponentTreeNode | null | undefined;
}

function parseValue(val: string) {
  // simple: bold the arrow if it contains "→"
  if (val.includes("→")) {
    const parts = val.split("→");
    return (
      <>
        <span className="line-through text-zinc-500">{parts[0].trim()}</span>
        <span className="text-emerald-400 font-bold ml-1">→ {parts[1].trim()}</span>
      </>
    );
  }
  return <span>{val}</span>;
}

function ComponentBox({ node, depth = 0 }: { node: ComponentTreeNode; depth?: number }) {
  const isActive = node.isActive;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center gap-0 w-full">
      {/* Component Box */}
      <div
        className={`
          relative w-full rounded-xl border-2 p-4 transition-all duration-500
          ${isActive
            ? "border-blue-500 bg-blue-500/10 shadow-[0_0_24px_-4px_rgba(59,130,246,0.5)]"
            : "border-zinc-700 bg-zinc-900/60"}
        `}
      >
        {/* Component name badge */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-blue-400 animate-pulse" : "bg-zinc-600"}`}
          />
          <span
            className={`text-sm font-bold font-mono ${isActive ? "text-blue-300" : "text-zinc-300"}`}
          >
            &lt;{node.name}&gt;
          </span>
          {node.isParent && (
            <span className="ml-auto text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
              PARENT
            </span>
          )}
        </div>

        {/* State (if any) */}
        {node.state && node.state.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] font-bold tracking-wider uppercase text-violet-400 mb-1.5">
              State (owned here)
            </div>
            <div className="flex flex-col gap-1">
              {node.state.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between gap-2 bg-violet-900/20 border border-violet-500/20 rounded-lg px-3 py-1.5"
                >
                  <span className="text-xs font-mono text-violet-300">{s.name}</span>
                  <span className="text-xs font-mono text-zinc-300">{parseValue(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Props (if any) */}
        {node.props && node.props.length > 0 && (
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-blue-400 mb-1.5">
              Props (received)
            </div>
            <div className="flex flex-col gap-1">
              {node.props.map((p) => (
                <div
                  key={p.name}
                  className={`
                    flex items-center justify-between gap-2 rounded-lg px-3 py-1.5
                    ${p.isNew
                      ? "bg-emerald-900/30 border border-emerald-500/40 animate-pulse"
                      : "bg-zinc-800/50 border border-zinc-700/50"}
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-blue-300">{p.name}</span>
                    {p.isFunction && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20">
                        fn
                      </span>
                    )}
                    {p.isReadOnly && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-zinc-700/50 text-zinc-400 border border-zinc-600/50">
                        read-only
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-zinc-300 truncate max-w-[100px]">
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Connector arrow to children */}
      {hasChildren && (
        <div className="flex flex-col items-center w-full">
          {/* Arrow stem */}
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-blue-500/50" />
            {/* Props label on arrow */}
            <div className="text-[10px] text-blue-400/70 font-mono italic px-2 py-0.5 bg-blue-500/5 border border-blue-500/10 rounded-full">
              props ↓
            </div>
            <div className="w-px h-4 bg-blue-500/50" />
            {/* Arrowhead */}
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M6 8L0 0H12L6 8Z" fill="rgba(59,130,246,0.6)" />
            </svg>
          </div>

          {/* Children */}
          <div className="flex flex-col gap-2 w-full">
            {node.children.map((child) => (
              <ComponentBox key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ComponentTreePanel({ tree }: ComponentTreePanelProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 shrink-0">
        <svg className="w-4 h-4 text-violet-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h8M4 18h4" />
        </svg>
        <span className="text-xs font-medium text-zinc-300">Component Tree</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4">
        {tree ? (
          <ComponentBox node={tree} />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600 text-sm">
            No component tree yet
          </div>
        )}
      </div>
    </div>
  );
}
