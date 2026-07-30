"use client";
import React from "react";
import { ReactStepState } from "@/lib/react-simulator/engine";

type UEPhase = "render" | "dom-update" | "paint" | "effect" | null;
type ULEPhase = "render" | "dom-update" | "layout-effect" | "paint" | null;

const USE_EFFECT_PIPELINE = [
  { id: "render", label: "Render", icon: "⚛️", desc: "JSX → Virtual DOM" },
  { id: "dom-update", label: "DOM Update", icon: "🌐", desc: "Real DOM mutated" },
  { id: "paint", label: "Browser Paints", icon: "🖼️", desc: "User sees screen ← HERE" },
  { id: "effect", label: "useEffect Fires", icon: "⚡", desc: "After paint (async)" },
] as const;

const USE_LAYOUT_EFFECT_PIPELINE = [
  { id: "render", label: "Render", icon: "⚛️", desc: "JSX → Virtual DOM" },
  { id: "dom-update", label: "DOM Update", icon: "🌐", desc: "Real DOM mutated" },
  { id: "layout-effect", label: "useLayoutEffect Fires", icon: "⚡", desc: "Before paint (SYNC — browser blocked)" },
  { id: "paint", label: "Browser Paints", icon: "🖼️", desc: "User sees screen ← HERE" },
] as const;

interface PipelineColumnProps {
  title: string;
  accentColor: "blue" | "purple";
  phases: readonly { id: string; label: string; icon: string; desc: string }[];
  activePhaseId: string | null;
  isHighlighted: boolean;
}

function PipelineColumn({ title, accentColor, phases, activePhaseId, isHighlighted }: PipelineColumnProps) {
  const accent = accentColor === "blue"
    ? { header: "text-blue-400 border-blue-500/20 bg-blue-500/5", active: "border-blue-400 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]", completed: "border-blue-700/30 bg-blue-950/20 opacity-60", arrow: "bg-blue-600/50", label: "text-blue-200", desc: "text-blue-300/50" }
    : { header: "text-purple-400 border-purple-500/20 bg-purple-500/5", active: "border-purple-400 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]", completed: "border-purple-700/30 bg-purple-950/20 opacity-60", arrow: "bg-purple-600/50", label: "text-purple-200", desc: "text-purple-300/50" };

  return (
    <div className={`flex-1 flex flex-col rounded-xl border overflow-hidden transition-all duration-300 ${isHighlighted ? "border-zinc-600" : "border-zinc-800 opacity-70"}`}>
      {/* Column header */}
      <div className={`px-3 py-2 border-b text-xs font-bold text-center tracking-wider uppercase ${accent.header}`}>
        {title}
      </div>

      <div className="flex-1 flex flex-col items-stretch px-2 py-3 gap-0.5 bg-zinc-900/50">
        {phases.map((phase, index) => {
          const isActive = activePhaseId === phase.id;
          const phaseIndex = phases.findIndex(p => p.id === phase.id);
          const activeIndex = phases.findIndex(p => p.id === activePhaseId);
          const isCompleted = activePhaseId !== null && phaseIndex < activeIndex;
          const isLast = index === phases.length - 1;

          return (
            <React.Fragment key={`${title}-phase-${phase.id}`}>
              <div className={`rounded-lg border px-2 py-2 transition-all duration-400 ${
                isActive ? accent.active :
                isCompleted ? accent.completed :
                "border-zinc-700/30 bg-zinc-900/30 opacity-30"
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm transition-transform ${isActive ? "scale-110" : ""}`}>{phase.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold leading-tight ${isActive ? accent.label : "text-zinc-600"}`}>
                      {phase.label}
                      {isActive && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                    </div>
                    {isActive && (
                      <div className={`text-xs mt-0.5 leading-tight ${accent.desc}`}>{phase.desc}</div>
                    )}
                  </div>
                </div>
              </div>

              {!isLast && (
                <div className="flex justify-center py-0">
                  <div className={`w-px h-2 transition-colors duration-300 ${
                    isCompleted || isActive ? accent.arrow : "bg-zinc-800"
                  }`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

interface TimingComparisonPanelProps {
  step: ReactStepState;
}

export function TimingComparisonPanel({ step }: TimingComparisonPanelProps) {
  const { timingMode, useEffectPhaseActive, useLayoutEffectPhaseActive } = step;

  const showUE = timingMode === "use-effect" || timingMode === "both";
  const showULE = timingMode === "use-layout-effect" || timingMode === "both";

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="h-10 shrink-0 border-b border-zinc-800 bg-zinc-900/60 flex items-center px-4 gap-2">
        <span className="text-sm">⏱️</span>
        <span className="text-xs font-bold tracking-wider uppercase text-zinc-400">Timing Pipeline Comparison</span>
      </div>

      <div className="flex-1 flex flex-col px-3 py-3 gap-2 min-h-0">
        <div className="flex-1 flex gap-2 min-h-0">
          <PipelineColumn
            title="useEffect"
            accentColor="blue"
            phases={USE_EFFECT_PIPELINE}
            activePhaseId={useEffectPhaseActive ?? null}
            isHighlighted={showUE}
          />
          <PipelineColumn
            title="useLayoutEffect"
            accentColor="purple"
            phases={USE_LAYOUT_EFFECT_PIPELINE}
            activePhaseId={useLayoutEffectPhaseActive ?? null}
            isHighlighted={showULE}
          />
        </div>

        {/* Key difference callout */}
        {timingMode === "both" && (
          <div className="shrink-0 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2">
            <p className="text-xs text-purple-300/80 text-center">
              <span className="font-bold text-purple-300">Key difference</span>: useLayoutEffect inserts itself <em>before</em> paint. useEffect runs <em>after</em> paint.
            </p>
          </div>
        )}

        {timingMode === "use-layout-effect" && useLayoutEffectPhaseActive === "layout-effect" && (
          <div className="shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <p className="text-xs text-amber-300/80 text-center">
              ⚠️ <span className="font-bold text-amber-300">Browser is BLOCKED</span> — cannot paint until this finishes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
