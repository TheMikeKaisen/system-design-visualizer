import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { JAVA_FLOW_NODES } from "@/lib/scenario/scripts/javaExecutionFlow";
import { useEffect, useState } from "react";

export function ScenarioContextPanel() {
  const store = useScenarioStore();
  
  // Timer for auto-playback
  useEffect(() => {
    if (!store.isPlaying || !store.script) return;
    
    const currentStep = store.script.steps[store.currentStepIndex];
    if (currentStep.autoAdvance === false) {
      // Pause automatically when reaching a manual step
      store.setPlaying(false);
      return;
    }

    const duration = currentStep.durationMs || 2000;
    const realDuration = duration / store.playbackSpeed;

    const timer = setTimeout(() => {
      store.nextStep();
    }, realDuration);

    return () => clearTimeout(timer);
  }, [store.isPlaying, store.currentStepIndex, store.playbackSpeed, store.script]);

  if (!store.script) return null;

  const currentStep = store.script.steps[store.currentStepIndex];
  const selectedNode = store.selectedNodeId 
    ? JAVA_FLOW_NODES.find(n => n.id === store.selectedNodeId) 
    : null;

  const validStepsIndices = store.script.steps.map((step, index) => {
    const hasReq = !step.requiredExperiments || step.requiredExperiments.every(e => store.activeExperiments.includes(e));
    const hasExc = !step.excludedExperiments || step.excludedExperiments.some(e => store.activeExperiments.includes(e));
    if (hasReq && !hasExc) return index;
    return -1;
  }).filter(i => i !== -1);
  
  const displayIndex = validStepsIndices.indexOf(store.currentStepIndex);
  const isLastValidStep = store.currentStepIndex === validStepsIndices[validStepsIndices.length - 1];

  return (
    <div className="w-80 shrink-0 h-full border-l border-border/40 bg-background/95 backdrop-blur-md flex flex-col z-20 relative">
      {selectedNode ? (
        // Node Details Mode
        <div className="flex-1 overflow-y-auto p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">{selectedNode.data.label}</h2>
            <button 
              onClick={() => store.setSelectedNodeId(null)}
              className="text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 p-1.5 rounded-md transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">What is it?</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{selectedNode.data.educational?.notes?.whatIsIt}</p>
            </div>
            
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Why is it needed?</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{selectedNode.data.educational?.notes?.whyNeeded}</p>
            </div>
            
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">What if it's missing?</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{selectedNode.data.educational?.notes?.whatIfMissing}</p>
            </div>
            
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
              <h3 className="text-xs font-bold text-primary flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Interview Tips
              </h3>
              <p className="text-sm text-foreground/90 italic">{selectedNode.data.educational?.notes?.interviewTips}</p>
            </div>
          </div>
        </div>
      ) : (
        // Narrative Mode
        <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-4">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/20">{displayIndex + 1}</span>
              Step
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4 leading-tight">{currentStep.narrative.title}</h2>
            <p className="text-[15px] text-foreground/80 leading-relaxed">
              {currentStep.narrative.description}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {currentStep.autoAdvance === false && !store.isPlaying && !isLastValidStep && (
              <button
                onClick={() => {
                  store.setPlaying(true);
                  store.nextStep();
                }}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            )}
            
            {isLastValidStep && (
              <button
                onClick={() => {
                  store.setStepIndex(0);
                  store.setPlaying(true);
                }}
                className="w-full py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
              >
                Restart Lesson
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="p-4 border-t border-border/40 bg-muted/10 text-center shrink-0">
        <a 
          href="https://karthik-h-nair.vercel.app/garden/java-code-execution?v=articles" 
          target="_blank" 
          rel="noreferrer"
          className="text-[11px] font-medium text-primary hover:underline flex items-center justify-center gap-1.5 transition-all opacity-80 hover:opacity-100"
        >
          Read more about Java Code Execution
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>
    </div>
  );
}
