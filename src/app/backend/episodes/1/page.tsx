"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, Info } from "lucide-react";
import { useBackendSimulationStore } from "@/store/useBackendSimulationStore";
import { BE_SCENARIO_1 } from "@/lib/backend-simulator/be-scenario-1";
import { ProcessArchitectureLayout } from "@/components/backend-simulator/ProcessArchitectureLayout";
import { IOTimelineLayout } from "@/components/backend-simulator/IOTimelineLayout";
import { NodeRuntimeLayout } from "@/components/backend-simulator/NodeRuntimeLayout";

// Extracted the Shell so it can be reused by all episodes
export function BackendEpisodeShell({ episodeNumber, title }: { episodeNumber: number, title: string }) {
  const { scenario, currentStepIndex, nextStep, prevStep, reset } = useBackendSimulationStore();

  const step = scenario.steps[currentStepIndex];

  // Helper to render basic markdown bold/italic
  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-emerald-300">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic text-emerald-200">{part.slice(1, -1)}</em>;
      return part;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="h-16 shrink-0 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 md:px-6 z-50 shadow-sm relative">
        <div className="flex items-center">
          <Link
            href="/backend"
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-emerald-400 transition-colors group"
          >
            <div className="p-1 rounded-md bg-zinc-900 group-hover:bg-emerald-500/10 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            Back to Backend Path
          </Link>
          <div className="mx-4 w-px h-4 bg-zinc-800" />
          <span className="text-sm font-semibold text-emerald-500">Episode {episodeNumber}</span>
          <span className="mx-2 text-zinc-600">•</span>
          <span className="text-sm font-medium text-zinc-300 truncate">{title}</span>
        </div>

        {/* Playback Controls */}
        {scenario.steps.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-xs font-medium text-zinc-500 tracking-widest uppercase">
              Step <span className="text-emerald-400">{currentStepIndex + 1}</span> of {scenario.steps.length}
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg shadow-inner">
              <button
                onClick={reset}
                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-zinc-800 mx-1" />
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-1 pl-2 pr-3 py-1.5 hover:bg-zinc-800 rounded-md disabled:opacity-30 text-xs font-semibold transition-colors text-zinc-300"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={nextStep}
                disabled={currentStepIndex === scenario.steps.length - 1}
                className="flex items-center gap-1 pl-3 pr-2 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md disabled:opacity-30 text-xs font-bold transition-colors shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#050505]">
        
        {/* Explanation Banner */}
        {step && (
          <div className="bg-zinc-900 border-b border-zinc-800 p-4 px-6 flex items-start gap-4 shadow-sm shrink-0">
            <div className="mt-0.5 p-1.5 bg-emerald-500/10 rounded-lg">
              <Info className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-zinc-200 leading-relaxed">{formatText(step.explanation)}</p>
              {step.notes && step.notes.map((note, idx) => (
                <div key={idx} className="mt-3 bg-emerald-950/20 border border-emerald-900/50 rounded-md p-3 max-w-3xl">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1 block">{note.title}</span>
                  <p className="text-sm text-emerald-100/70">{formatText(note.content)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Engine Layout */}
        <div className="flex-1 min-h-0 relative">
          {step && scenario.layoutMode === "process-architecture" && <ProcessArchitectureLayout step={step} />}
          {step && scenario.layoutMode === "io-timeline" && <IOTimelineLayout step={step} />}
          {step && scenario.layoutMode === "node-runtime-dashboard" && <NodeRuntimeLayout step={step} />}
        </div>
      </div>
    </div>
  );
}

export default function BackendEpisode1Page() {
  const { setScenario } = useBackendSimulationStore();

  useEffect(() => {
    setScenario(BE_SCENARIO_1);
  }, [setScenario]);

  return <BackendEpisodeShell episodeNumber={1} title="Node Architecture" />;
}
