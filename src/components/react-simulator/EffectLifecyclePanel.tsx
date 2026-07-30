"use client";
import React from "react";
import { ReactStepState } from "@/lib/react-simulator/engine";

const PHASES = [
  { id: "render", label: "Component Renders", icon: "⚛️", description: "JSX evaluated, Virtual DOM built" },
  { id: "dom-update", label: "Real DOM Updated", icon: "🌐", description: "React applies minimal changes to the DOM" },
  { id: "paint", label: "Browser Paints", icon: "🖼️", description: "Pixels drawn — user sees the screen" },
  { id: "effect-runs", label: "useEffect Fires", icon: "⚡", description: "Effect function runs asynchronously" },
] as const;

type PhaseId = "render" | "dom-update" | "paint" | "effect-runs";

interface EffectLifecyclePanelProps {
  step: ReactStepState;
}

export function EffectLifecyclePanel({ step }: EffectLifecyclePanelProps) {
  const activePhase = step.effectPhase ?? null;

  const getPhaseStyle = (phaseId: PhaseId) => {
    const isActive = activePhase === phaseId;
    const isCompleted = activePhase !== null && PHASES.findIndex(p => p.id === phaseId) < PHASES.findIndex(p => p.id === activePhase);

    if (isActive) return {
      border: "border-emerald-400",
      bg: "bg-emerald-500/15",
      icon: "text-emerald-300",
      label: "text-emerald-100 font-bold",
      desc: "text-emerald-200/70",
      glow: "shadow-[0_0_20px_rgba(52,211,153,0.3)]",
    };
    if (isCompleted) return {
      border: "border-emerald-700/50",
      bg: "bg-emerald-950/30",
      icon: "text-emerald-600",
      label: "text-emerald-700 font-semibold",
      desc: "text-emerald-800/60",
      glow: "",
    };
    return {
      border: "border-zinc-700/50",
      bg: "bg-zinc-900/40",
      icon: "text-zinc-500",
      label: "text-zinc-500",
      desc: "text-zinc-600",
      glow: "",
    };
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="h-10 shrink-0 border-b border-zinc-800 bg-zinc-900/60 flex items-center px-4 gap-2">
        <span className="text-sm">⚡</span>
        <span className="text-xs font-bold tracking-wider uppercase text-zinc-400">Effect Lifecycle Pipeline</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-1">
        {PHASES.map((phase, index) => {
          const styles = getPhaseStyle(phase.id as PhaseId);
          const isActive = activePhase === phase.id;
          const isLast = index === PHASES.length - 1;

          return (
            <React.Fragment key={`phase-${phase.id}`}>
              {/* Phase node */}
              <div
                className={`w-full rounded-xl border px-4 py-3 transition-all duration-500 ${styles.border} ${styles.bg} ${styles.glow}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xl transition-all duration-300 ${styles.icon} ${isActive ? "scale-125" : ""}`}>
                    {phase.icon}
                  </span>
                  <div className="flex-1">
                    <div className={`text-sm transition-colors duration-300 ${styles.label}`}>
                      {phase.label}
                      {isActive && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <div className={`text-xs mt-0.5 transition-colors duration-300 ${styles.desc}`}>
                      {phase.description}
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      NOW
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow connector */}
              {!isLast && (
                <div className="flex flex-col items-center gap-0.5 py-0.5">
                  <div className={`w-px h-3 transition-colors duration-500 ${
                    activePhase !== null && PHASES.findIndex(p => p.id === PHASES[index + 1].id) <= PHASES.findIndex(p => p.id === activePhase)
                      ? "bg-emerald-600"
                      : "bg-zinc-700"
                  }`} />
                  <svg width="8" height="6" viewBox="0 0 8 6" className={`transition-colors duration-500 ${
                    activePhase !== null && PHASES.findIndex(p => p.id === PHASES[index + 1].id) <= PHASES.findIndex(p => p.id === activePhase)
                      ? "text-emerald-600"
                      : "text-zinc-700"
                  }`}>
                    <path d="M4 6L0 0h8z" fill="currentColor" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Idle state */}
        {activePhase === null && (
          <p className="text-xs text-zinc-600 mt-4 text-center">
            Step through to see the pipeline activate
          </p>
        )}
      </div>
    </div>
  );
}
