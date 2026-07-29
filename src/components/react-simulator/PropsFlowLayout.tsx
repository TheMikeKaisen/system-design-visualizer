import React, { useEffect } from "react";
import { useReactSimulationStore } from "@/store/useReactSimulationStore";
import { CodePanel } from "./CodePanel";
import { ComponentTreePanel } from "./ComponentTreePanel";
import { PropsInspectorPanel } from "./PropsInspectorPanel";
import { toast } from "sonner";

// Simple markdown-lite parser for bold text (**text**)
function parseBoldText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-blue-300 font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function PropsFlowLayout() {
  const { scenario, currentStepIndex } = useReactSimulationStore();
  const step = scenario.steps[currentStepIndex];

  // Toast notifications
  useEffect(() => {
    if (step?.toastMessage) {
      toast(step.toastMessage, { duration: 2500 });
    }
  }, [step?.id, step?.toastMessage]);

  if (!step) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">

      {/* LEFT SIDEBAR: Explanation */}
      <div className="w-[380px] sm:w-[420px] shrink-0 border-r border-border bg-card flex flex-col h-full overflow-hidden shadow-xl z-20">

        {/* Sidebar Header */}
        <div className="p-6 border-b border-border bg-zinc-900/40">
          <div className="text-xs font-bold tracking-widest uppercase text-blue-500 mb-2">
            Step {currentStepIndex + 1} of {scenario.steps.length}
          </div>
          <h2 className="text-2xl font-bold text-foreground leading-tight">{scenario.title}</h2>
          <p className="text-sm text-muted-foreground mt-2">{scenario.description}</p>
        </div>

        {/* Sidebar Body (Scrollable) */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-8">

          {/* Main Explanation */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              What&apos;s Happening?
            </h3>
            <p className="text-lg text-zinc-100 leading-relaxed font-medium">
              {parseBoldText(step.explanation)}
            </p>
          </div>

          {/* Notes (if any) */}
          {step.notes && step.notes.length > 0 && (
            <div className="flex flex-col gap-4 mt-2">
              {step.notes.map((note, idx) => (
                <div key={idx} className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-400 mb-2 text-sm">{note.title}</h4>
                  <div className="text-sm text-blue-100/90 leading-relaxed whitespace-pre-wrap">
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
        <div className="h-[40%] shrink-0 flex w-full">
          <CodePanel step={step} />
        </div>

        {/* Bottom: Component Tree + Props Inspector */}
        <div className="flex-1 flex gap-4 min-h-0 w-full">
          <div className="flex-1 min-w-0">
            <ComponentTreePanel tree={step.componentTree} />
          </div>
          <div className="flex-1 min-w-0">
            <PropsInspectorPanel entries={step.propsInspector} />
          </div>
        </div>

      </div>
    </div>
  );
}
