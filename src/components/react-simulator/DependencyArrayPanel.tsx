"use client";
import React from "react";
import { ReactStepState } from "@/lib/react-simulator/engine";

interface DependencyArrayPanelProps {
  step: ReactStepState;
}

export function DependencyArrayPanel({ step }: DependencyArrayPanelProps) {
  const { depArrayMode, depArrayCurrent, depArrayPrevious, depArrayChanged } = step;

  const hasComparison = depArrayMode === "with-value" || depArrayMode === "empty";

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="h-10 shrink-0 border-b border-zinc-800 bg-zinc-900/60 flex items-center px-4 gap-2">
        <span className="text-sm">🎯</span>
        <span className="text-xs font-bold tracking-wider uppercase text-zinc-400">Dependency Array</span>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 py-4 gap-4">

        {/* Mode Cards */}
        <div className="flex flex-col gap-2">
          {/* No array */}
          <div className={`rounded-lg border px-3 py-2.5 transition-all duration-300 ${
            depArrayMode === "no-array"
              ? "border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              : "border-zinc-700/40 bg-zinc-900/30 opacity-40"
          }`}>
            <div className="flex items-center justify-between">
              <code className={`text-xs font-mono ${depArrayMode === "no-array" ? "text-red-300" : "text-zinc-500"}`}>
                useEffect(fn)
              </code>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                depArrayMode === "no-array"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-zinc-600"
              }`}>
                Every render
              </span>
            </div>
            {depArrayMode === "no-array" && (
              <p className="text-xs text-red-300/70 mt-1">⚠️ No second argument — runs after every render without exception</p>
            )}
          </div>

          {/* Empty array */}
          <div className={`rounded-lg border px-3 py-2.5 transition-all duration-300 ${
            depArrayMode === "empty"
              ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.2)]"
              : "border-zinc-700/40 bg-zinc-900/30 opacity-40"
          }`}>
            <div className="flex items-center justify-between">
              <code className={`text-xs font-mono ${depArrayMode === "empty" ? "text-emerald-300" : "text-zinc-500"}`}>
                useEffect(fn, [])
              </code>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                depArrayMode === "empty"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-600"
              }`}>
                Once on mount
              </span>
            </div>
            {depArrayMode === "empty" && (
              <p className="text-xs text-emerald-300/70 mt-1">✓ Empty array: no values to watch, never re-runs after first render</p>
            )}
          </div>

          {/* With value */}
          <div className={`rounded-lg border px-3 py-2.5 transition-all duration-300 ${
            depArrayMode === "with-value"
              ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              : "border-zinc-700/40 bg-zinc-900/30 opacity-40"
          }`}>
            <div className="flex items-center justify-between">
              <code className={`text-xs font-mono ${depArrayMode === "with-value" ? "text-blue-300" : "text-zinc-500"}`}>
                useEffect(fn, [dep])
              </code>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                depArrayMode === "with-value"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-600"
              }`}>
                When dep changes
              </span>
            </div>
            {depArrayMode === "with-value" && (
              <p className="text-xs text-blue-300/70 mt-1">Compared via Object.is() — new refs always fail the check</p>
            )}
          </div>
        </div>

        {/* Comparison section */}
        {hasComparison && depArrayMode === "with-value" && (
          <div className="mt-1">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Object.is() Comparison</div>
            <div className="flex items-center gap-2">
              {/* Previous */}
              <div className="flex-1 bg-zinc-800/60 rounded-lg border border-zinc-700/50 p-2.5">
                <div className="text-xs text-zinc-500 mb-1">Previous render</div>
                <code className="text-sm font-mono text-zinc-300 font-bold">
                  {depArrayPrevious ?? "— (first render)"}
                </code>
              </div>

              {/* Operator */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className={`text-base font-bold ${
                  depArrayChanged === true ? "text-red-400" :
                  depArrayChanged === false ? "text-emerald-400" :
                  "text-zinc-500"
                }`}>===</div>
              </div>

              {/* Current */}
              <div className="flex-1 bg-zinc-800/60 rounded-lg border border-zinc-700/50 p-2.5">
                <div className="text-xs text-zinc-500 mb-1">Current render</div>
                <code className="text-sm font-mono text-zinc-300 font-bold">
                  {depArrayCurrent ?? "—"}
                </code>
              </div>
            </div>

            {/* Result badge */}
            {depArrayChanged !== undefined && (
              <div className={`mt-2 rounded-lg border px-3 py-2 text-center transition-all duration-300 ${
                depArrayChanged
                  ? "border-red-500/40 bg-red-500/10"
                  : "border-emerald-500/40 bg-emerald-500/10"
              }`}>
                <span className={`text-sm font-bold ${depArrayChanged ? "text-red-400" : "text-emerald-400"}`}>
                  {depArrayChanged ? "❌ Different → Effect RE-RUNS" : "✅ Same → Effect SKIPPED"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* No mode selected */}
        {!depArrayMode && (
          <p className="text-xs text-zinc-600 text-center mt-2">
            Step through to see the dependency array forms
          </p>
        )}
      </div>
    </div>
  );
}
