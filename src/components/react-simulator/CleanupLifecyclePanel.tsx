"use client";
import React from "react";
import { ReactStepState } from "@/lib/react-simulator/engine";

const MOMENTS = [
  {
    id: "first-run",
    label: "After First Run",
    icon: "🚀",
    description: "Effect ran for the first time. Cleanup registered but not yet called.",
    color: "blue",
  },
  {
    id: "dep-changed",
    label: "Before Re-run (Dep Changed)",
    icon: "🔄",
    description: "A dependency changed. Cleanup for the OLD effect runs FIRST, then the new effect.",
    color: "amber",
  },
  {
    id: "unmount",
    label: "On Component Unmount",
    icon: "💀",
    description: "Component removed from screen. Cleanup runs one final time.",
    color: "red",
  },
] as const;

const PHASES = [
  { id: "effect-setup", label: "Effect Setup", icon: "⚙️", description: "Effect function runs, sets something up" },
  { id: "cleanup-runs", label: "Cleanup Runs", icon: "🧹", description: "Cleanup function tears down the old setup" },
  { id: "new-effect", label: "New Effect", icon: "✨", description: "Fresh effect function runs for new deps" },
] as const;

interface CleanupLifecyclePanelProps {
  step: ReactStepState;
}

const colorMap = {
  blue: { active: "border-blue-400 bg-blue-500/15 shadow-[0_0_15px_rgba(59,130,246,0.25)]", text: "text-blue-300", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", desc: "text-blue-200/60" },
  amber: { active: "border-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.25)]", text: "text-amber-300", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", desc: "text-amber-200/60" },
  red: { active: "border-red-400 bg-red-500/15 shadow-[0_0_15px_rgba(239,68,68,0.25)]", text: "text-red-300", badge: "bg-red-500/20 text-red-400 border-red-500/30", desc: "text-red-200/60" },
};

export function CleanupLifecyclePanel({ step }: CleanupLifecyclePanelProps) {
  const { cleanupMoment, cleanupPhase } = step;

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="h-10 shrink-0 border-b border-zinc-800 bg-zinc-900/60 flex items-center px-4 gap-2">
        <span className="text-sm">🧹</span>
        <span className="text-xs font-bold tracking-wider uppercase text-zinc-400">Cleanup Lifecycle</span>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-3 overflow-auto">

        {/* When does cleanup run? — 3 moments */}
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
          When Cleanup Runs
        </div>
        <div className="flex flex-col gap-2">
          {MOMENTS.map((moment) => {
            const isActive = cleanupMoment === moment.id;
            const colors = colorMap[moment.color];
            return (
              <div
                key={`moment-${moment.id}`}
                className={`rounded-lg border px-3 py-2.5 transition-all duration-500 ${
                  isActive
                    ? colors.active
                    : "border-zinc-700/40 bg-zinc-900/30 opacity-40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{moment.icon}</span>
                  <div className="flex-1">
                    <div className={`text-xs font-bold transition-colors duration-300 ${isActive ? colors.text : "text-zinc-600"}`}>
                      {moment.label}
                      {isActive && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                    </div>
                    {isActive && (
                      <p className={`text-xs mt-0.5 ${colors.desc}`}>{moment.description}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase sequence for dep-changed */}
        {cleanupMoment === "dep-changed" && (
          <div className="mt-1">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Dep-Change Sequence
            </div>
            <div className="flex flex-col gap-1.5">
              {PHASES.map((phase, index) => {
                const isActive = cleanupPhase === phase.id;
                const isCompleted = cleanupPhase !== null && PHASES.findIndex(p => p.id === phase.id) < PHASES.findIndex(p => p.id === cleanupPhase);
                return (
                  <React.Fragment key={`phase-${phase.id}`}>
                    <div className={`rounded-lg border px-3 py-2 transition-all duration-400 ${
                      isActive
                        ? "border-amber-400/60 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        : isCompleted
                          ? "border-amber-700/30 bg-amber-950/20 opacity-60"
                          : "border-zinc-700/30 bg-zinc-900/20 opacity-30"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${isActive ? "scale-110" : ""} transition-transform`}>{phase.icon}</span>
                        <div>
                          <div className={`text-xs font-semibold ${isActive ? "text-amber-300" : isCompleted ? "text-amber-700" : "text-zinc-600"}`}>
                            {phase.label}
                          </div>
                          {isActive && (
                            <div className="text-xs text-amber-300/60 mt-0.5">{phase.description}</div>
                          )}
                        </div>
                        {isActive && (
                          <span className="ml-auto text-xs font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            NOW
                          </span>
                        )}
                      </div>
                    </div>
                    {index < PHASES.length - 1 && (
                      <div className={`ml-4 w-px h-2 ${isCompleted || isActive ? "bg-amber-600/40" : "bg-zinc-700/30"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {!cleanupMoment && (
          <p className="text-xs text-zinc-600 text-center mt-2">
            Step through to see cleanup moments activate
          </p>
        )}
      </div>
    </div>
  );
}
