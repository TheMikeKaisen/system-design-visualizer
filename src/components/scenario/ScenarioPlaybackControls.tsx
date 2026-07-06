import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { useEffect } from "react";

export function ScenarioPlaybackControls() {
  const store = useScenarioStore();
  
  if (!store.script) return null;
  
  const currentStep = store.script.steps[store.currentStepIndex];
  const isFirst = store.currentStepIndex === 0;
  const isLast = store.currentStepIndex === store.script.steps.length - 1;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <div className="bg-background/95 backdrop-blur-md border border-border/60 shadow-2xl rounded-2xl overflow-hidden flex flex-col pointer-events-auto">
        <div className="px-6 py-5">
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">
              {store.currentStepIndex + 1}
            </span>
            {currentStep.narrative.title}
          </h2>
          <p className="text-foreground/80 leading-relaxed text-[15px]">
            {currentStep.narrative.description}
          </p>
        </div>
        
        <div className="bg-muted/30 px-6 py-4 flex items-center justify-between border-t border-border/40">
          <div className="text-sm font-medium text-muted-foreground">
            Step {store.currentStepIndex + 1} of {store.script.steps.length}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={store.prevStep}
              disabled={isFirst}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              Previous
            </button>
            <button
              onClick={isLast ? store.reset : store.nextStep}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              {isLast ? "Restart" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
