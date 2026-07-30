"use client";
import React, { useEffect, useState } from "react";
import { ReactStepState } from "@/lib/react-simulator/engine";

interface BrowserViewportProps {
  step: ReactStepState;
}

export function BrowserViewport({ step }: BrowserViewportProps) {
  const { viewportElementPosition, viewportShowFlickerFlash, viewportLabel, timingMode } = step;

  // Flicker animation state — triggers when viewportShowFlickerFlash is true
  const [flickerActive, setFlickerActive] = useState(false);

  useEffect(() => {
    if (viewportShowFlickerFlash) {
      setFlickerActive(true);
      const timer = setTimeout(() => setFlickerActive(false), 600);
      return () => clearTimeout(timer);
    } else {
      setFlickerActive(false);
    }
  }, [viewportShowFlickerFlash, step.id]);

  const getTooltipStyles = () => {
    switch (viewportElementPosition) {
      case "wrong":
        return { top: "8px", left: "8px" };
      case "correct":
        return { bottom: "40px", left: "50%", transform: "translateX(-50%)" };
      default: // initial
        return { top: "8px", left: "8px", opacity: 0 };
    }
  };

  const tooltipStyles = getTooltipStyles();
  const isBlocked = timingMode === "use-layout-effect" && viewportElementPosition === "initial";

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="h-10 shrink-0 border-b border-zinc-800 bg-zinc-900/60 flex items-center px-4 gap-2">
        <span className="text-sm">🖥️</span>
        <span className="text-xs font-bold tracking-wider uppercase text-zinc-400">Browser Viewport</span>
        {timingMode && (
          <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${
            timingMode === "use-effect"
              ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
              : timingMode === "use-layout-effect"
                ? "text-purple-400 bg-purple-500/10 border-purple-500/30"
                : "text-zinc-400 bg-zinc-800 border-zinc-700"
          }`}>
            {timingMode === "use-effect" ? "useEffect mode"
              : timingMode === "use-layout-effect" ? "useLayoutEffect mode"
              : "—"}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">

        {/* Browser chrome mockup */}
        <div className="w-full max-w-sm rounded-xl border border-zinc-600 overflow-hidden shadow-2xl">
          {/* Chrome bar */}
          <div className="h-8 bg-zinc-700 flex items-center px-3 gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <div className="flex-1 h-4 bg-zinc-600 rounded-sm ml-2 flex items-center px-2">
              <span className="text-xs text-zinc-400">localhost:3000</span>
            </div>
          </div>

          {/* Viewport area */}
          <div
            className={`relative bg-zinc-100 transition-all duration-300 overflow-hidden`}
            style={{ height: "160px" }}
          >
            {/* Blocked overlay */}
            {isBlocked && (
              <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-[1px] z-30 flex items-center justify-center">
                <div className="bg-amber-500/90 text-black text-xs font-bold px-3 py-1.5 rounded-full">
                  ⏸ Browser Blocked — Waiting for useLayoutEffect
                </div>
              </div>
            )}

            {/* Flicker overlay */}
            {flickerActive && (
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  animation: "none",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "2px solid rgba(239, 68, 68, 0.4)",
                }}
              />
            )}

            {/* Page content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              {/* Button target */}
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg shadow-md"
                style={{ position: "relative" }}
              >
                Hover me
              </button>
              <p className="text-xs text-zinc-400">Page content here</p>
            </div>

            {/* Tooltip element */}
            {viewportElementPosition !== "initial" && viewportLabel && (
              <div
                className={`absolute z-10 px-2.5 py-1.5 rounded-lg shadow-lg border text-xs font-semibold transition-all duration-300 ${
                  viewportElementPosition === "wrong"
                    ? "bg-red-100 border-red-300 text-red-700"
                    : "bg-zinc-800 border-zinc-600 text-zinc-100"
                } ${flickerActive ? "ring-2 ring-red-400" : ""}`}
                style={tooltipStyles as React.CSSProperties}
              >
                {viewportLabel}
                {viewportElementPosition === "wrong" && (
                  <span className="ml-1.5 text-red-500">← Wrong!</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Position indicator */}
        <div className="w-full max-w-sm">
          {viewportElementPosition === "wrong" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center">
              <span className="text-xs font-bold text-red-400">
                ❌ Tooltip at (0, 0) — user sees WRONG position
              </span>
              {flickerActive && (
                <p className="text-xs text-red-300/60 mt-0.5">⚡ This is the flicker!</p>
              )}
            </div>
          )}
          {viewportElementPosition === "correct" && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
              <span className="text-xs font-bold text-emerald-400">
                ✅ Tooltip at correct position — user sees correct state
              </span>
            </div>
          )}
          {viewportElementPosition === "initial" && !isBlocked && (
            <div className="rounded-lg border border-zinc-700/30 bg-zinc-900/30 px-3 py-2 text-center">
              <span className="text-xs text-zinc-500">
                Tooltip not yet rendered
              </span>
            </div>
          )}
          {isBlocked && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center">
              <span className="text-xs font-bold text-amber-400">
                ⏸ Paint is blocked — useLayoutEffect is running synchronously
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
