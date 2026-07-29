import React, { useEffect } from "react";
import { useReactSimulationStore } from "@/store/useReactSimulationStore";
import { CodePanel } from "./CodePanel";
import { VirtualDomViewer } from "./VirtualDomViewer";
import { RealDomViewer } from "./RealDomViewer";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
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

export function ReactSimulatorLayout() {
  const { scenario, currentStepIndex, nextStep, prevStep, reset } = useReactSimulationStore();
  const step = scenario.steps[currentStepIndex];

  // Toast notifications
  useEffect(() => {
    if (step?.toastMessage) {
      toast(step.toastMessage, { duration: 2500 });
    }
  }, [step?.id, step?.toastMessage]);

  if (!step) return null;

  const isDiffing = step.activeAction === "diffing";

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      
      {/* LEFT SIDEBAR: Story / Explanation */}
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
             <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">What's Happening?</h3>
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

      {/* RIGHT CANVAS: Visualizer Grid */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden bg-zinc-950">
        
        {/* Top Half: Code Panel */}
        <div className="h-1/3 shrink-0 flex w-full">
           <CodePanel step={step} />
        </div>
        
        {/* Bottom Half: Trees */}
        <div className="flex-1 flex gap-4 min-h-0 w-full">
          
          {/* Virtual DOM Area */}
          <div className="flex-1 flex gap-4 min-w-0">
            {isDiffing ? (
              <>
                <VirtualDomViewer tree={step.oldVirtualDom} title="Old Virtual DOM" isOldTree={true} />
                <VirtualDomViewer tree={step.virtualDom} title="New Virtual DOM" />
              </>
            ) : (
              <VirtualDomViewer tree={step.virtualDom} title="Virtual DOM Tree" />
            )}
          </div>
          
          {/* Real DOM Area */}
          <div className="w-1/3 min-w-[300px] flex flex-col">
            <RealDomViewer tree={step.realDom} />
          </div>

        </div>
      </div>

    </div>
  );
}
