"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, LayoutTemplate } from "lucide-react";
import { useJavaArraysStore } from "@/store/useJavaArraysStore";
import { CodePanel } from "@/components/java-simulator/arrays/CodePanel";
import { MemoryCanvas } from "@/components/java-simulator/arrays/MemoryCanvas";
import { javaArraysPhases } from "@/lib/java-simulator/arrays-scenarios";
import { toast } from "sonner";

function parseBoldText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-amber-300 font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="text-amber-200 bg-amber-500/10 px-1 py-0.5 rounded font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function JavaArraysSimulatorPage() {
  const { 
    scenario, 
    currentStepIndex,
    currentPhaseIndex,
    isPlaying,
    nextStep,
    prevStep,
    reset,
    togglePlay,
    setPhase
  } = useJavaArraysStore();

  const step = scenario.steps[currentStepIndex];

  // Auto-play effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPlaying) {
      timer = setTimeout(() => {
        nextStep();
      }, 3000);
    }
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, nextStep]);

  useEffect(() => {
    if (step?.toastMessage) {
      toast(step.toastMessage, { duration: 2500 });
    }
  }, [step?.id, step?.toastMessage]);

  if (!step) return null;

  return (
    <div className="flex flex-col h-screen bg-background font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="h-16 shrink-0 border-b border-border bg-zinc-950 flex items-center justify-between px-4 md:px-6 z-50 shadow-sm relative">
        <div className="flex items-center">
          <Link
            href="/java"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="p-1 rounded-md bg-muted group-hover:bg-border transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            Back to Java Path
          </Link>
          <div className="mx-4 w-px h-4 bg-border hidden sm:block" />
          <span className="text-sm font-semibold text-amber-500 hidden sm:block">Episode 6</span>
          <span className="mx-2 text-muted-foreground hidden sm:block">•</span>
          
          {/* Phase Selector */}
          <div className="relative group ml-4 sm:ml-0">
            <select
              value={currentPhaseIndex}
              onChange={(e) => setPhase(Number(e.target.value))}
              className="appearance-none bg-zinc-900 border border-zinc-800 text-sm font-medium text-foreground py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
            >
              {javaArraysPhases.map((phase, idx) => (
                <option key={phase.id} value={idx}>
                  {phase.title}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <LayoutTemplate className="w-4 h-4" />
            </div>
          </div>
        </div>

        {scenario.steps.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-xs font-medium text-muted-foreground tracking-widest uppercase">
              Step <span className="text-foreground">{currentStepIndex + 1}</span> of {scenario.steps.length}
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg shadow-inner">
              <button
                onClick={reset}
                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 transition-colors"
                title="Restart Phase"
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
                onClick={togglePlay}
                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                )}
              </button>

              <button
                onClick={nextStep}
                disabled={currentStepIndex === scenario.steps.length - 1}
                className="flex items-center gap-1 pl-3 pr-2 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 rounded-md disabled:opacity-30 text-xs font-bold transition-colors shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className="w-[380px] sm:w-[420px] shrink-0 border-r border-border bg-card flex flex-col h-full overflow-hidden shadow-xl z-20">
          <div className="p-6 border-b border-border bg-zinc-900/40">
            <div className="text-xs font-bold tracking-widest uppercase text-amber-500 mb-2">
              Step {currentStepIndex + 1} of {scenario.steps.length}
            </div>
            <h2 className="text-2xl font-bold text-foreground leading-tight">{scenario.title}</h2>
            <p className="text-sm text-muted-foreground mt-2">{scenario.description}</p>
          </div>

          <div className="flex-1 overflow-auto p-6 flex flex-col gap-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                What's Happening?
              </h3>
              <p className="text-lg text-zinc-100 leading-relaxed font-medium">
                {parseBoldText(step.explanation)}
              </p>
            </div>

            {step.notes && step.notes.length > 0 && (
              <div className="flex flex-col gap-4 mt-2">
                {step.notes.map((note, idx) => (
                  <div key={idx} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <h4 className="font-semibold text-amber-400 mb-2 text-sm">{note.title}</h4>
                    <div className="text-sm text-amber-100/90 leading-relaxed whitespace-pre-wrap">
                      {parseBoldText(note.content)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CANVAS */}
        <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden bg-zinc-950">
          {/* Left: Code Panel */}
          <div className="h-[40%] lg:h-full lg:w-[400px] shrink-0 flex w-full">
            <CodePanel />
          </div>

          {/* Right: Memory Canvas */}
          <div className="flex-1 min-h-0 min-w-0">
            <MemoryCanvas />
          </div>
        </div>
      </div>
    </div>
  );
}
