"use client";
import React, { useEffect } from "react";
import { useReactSimulationStore } from "@/store/useReactSimulationStore";
import { CodePanel } from "./CodePanel";
import { ReactMemoryPanel } from "./ReactMemoryPanel";
import { DomRefPanel } from "./DomRefPanel";
import { toast } from "sonner";

function parseBoldText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-purple-300 font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function UseRefLayout() {
  const { scenario, currentStepIndex } = useReactSimulationStore();
  const step = scenario.steps[currentStepIndex];

  useEffect(() => {
    if (step?.toastMessage) {
      toast(step.toastMessage, { duration: 2500 });
    }
  }, [step?.id, step?.toastMessage]);

  if (!step) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="w-[380px] sm:w-[420px] shrink-0 border-r border-border bg-card flex flex-col h-full overflow-hidden shadow-xl z-20">
        <div className="p-6 border-b border-border bg-zinc-900/40">
          <div className="text-xs font-bold tracking-widest uppercase text-purple-500 mb-2">
            Step {currentStepIndex + 1} of {scenario.steps.length}
          </div>
          <h2 className="text-2xl font-bold text-foreground leading-tight">{scenario.title}</h2>
          <p className="text-sm text-muted-foreground mt-2">{scenario.description}</p>
        </div>

        <div className="flex-1 overflow-auto p-6 flex flex-col gap-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              What&apos;s Happening?
            </h3>
            <p className="text-lg text-zinc-100 leading-relaxed font-medium">
              {parseBoldText(step.explanation)}
            </p>
          </div>

          {step.notes && step.notes.length > 0 && (
            <div className="flex flex-col gap-4 mt-2">
              {step.notes.map((note, idx) => (
                <div key={idx} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-400 mb-2 text-sm">{note.title}</h4>
                  <div className="text-sm text-purple-100/90 leading-relaxed whitespace-pre-wrap">
                    {parseBoldText(note.content)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CANVAS */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden bg-zinc-950">
        {/* Top: Code Panel */}
        <div className="h-[45%] shrink-0 flex w-full">
          <CodePanel step={step} />
        </div>

        {/* Bottom: Interactive Panels */}
        <div className="flex-1 flex gap-4 min-h-0 w-full">
          {step.useRefMode === "react-memory" && <ReactMemoryPanel step={step} />}
          {step.useRefMode === "dom-ref" && <DomRefPanel step={step} />}
          
          {/* Default state if no specific mode is active */}
          {!step.useRefMode && (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
              <span className="text-zinc-500 font-medium text-lg">Follow the instructions in the code panel</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
