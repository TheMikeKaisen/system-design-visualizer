"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { UseRefLayout } from "@/components/react-simulator/UseRefLayout";
import { useReactSimulationStore } from "@/store/useReactSimulationStore";
import { REACT_SCENARIO_7 } from "@/lib/react-simulator/react-scenario-7";

export default function ReactEpisode7Page() {
  const { scenario, currentStepIndex, setScenario, nextStep, prevStep, reset } =
    useReactSimulationStore();

  useEffect(() => {
    setScenario(REACT_SCENARIO_7);
  }, [setScenario]);

  return (
    <div className="flex flex-col h-screen bg-background font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="h-16 shrink-0 border-b border-border bg-zinc-950 flex items-center justify-between px-4 md:px-6 z-50 shadow-sm relative">
        <div className="flex items-center">
          <Link
            href="/frontend"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="p-1 rounded-md bg-muted group-hover:bg-border transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            Back to Frontend Path
          </Link>
          <div className="mx-4 w-px h-4 bg-border" />
          <span className="text-sm font-semibold text-purple-500">Episode 7</span>
          <span className="mx-2 text-muted-foreground">•</span>
          <span className="text-sm font-medium text-foreground truncate">
            useRef
          </span>
        </div>

        {scenario?.steps?.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
              Step <span className="text-foreground">{currentStepIndex + 1}</span> of {scenario.steps.length}
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
                className="flex items-center gap-1 pl-3 pr-2 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-md disabled:opacity-30 text-xs font-bold transition-colors shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {scenario.id === "react-useref-7" && <UseRefLayout />}
    </div>
  );
}
