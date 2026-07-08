import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { useEffect } from "react";
import { SystemNode } from "@/types";

export function ScenarioContextPanel({ nodes = [] }: { nodes?: SystemNode[] }) {
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
    ? nodes.find(n => n.id === store.selectedNodeId) 
    : null;

  const validStepsIndices = store.script.steps.map((step, index) => {
    const hasReq = !step.requiredExperiments || step.requiredExperiments.every(e => store.activeExperiments.includes(e));
    const hasExc = step.excludedExperiments && step.excludedExperiments.some(e => store.activeExperiments.includes(e));
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">{selectedNode.data.label}</h2>
            <button 
              onClick={() => store.setSelectedNodeId(null)}
              className="text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 p-1.5 rounded-md transition-colors shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {selectedNode.data.educational?.badges && selectedNode.data.educational.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedNode.data.educational.badges.map((badge, i) => (
                <div key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${badge.color || 'bg-muted/50 border-border/50 text-foreground/80'}`}>
                  <span className="opacity-70">{badge.label}:</span>
                  <span className="font-bold">{badge.value}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-6">
            {selectedNode.data.educational?.notes?.codePreview && (
              <div className="mb-4">
                <div className="bg-muted text-muted-foreground text-xs px-3 py-1.5 rounded-t-md font-mono border-b border-border/50">
                  {selectedNode.data.educational.notes.codeTitle || "Code Snippet"}
                </div>
                <pre className="bg-background border border-t-0 border-border rounded-b-md p-3 overflow-x-auto text-xs font-mono text-foreground/90">
                  <code>{selectedNode.data.educational.notes.codePreview}</code>
                </pre>
                {selectedNode.data.educational.notes.compiledOutput && (
                  <div className="mt-3 text-xs text-foreground/70 whitespace-pre-wrap font-mono">
                    <span className="font-bold text-foreground/50 uppercase block mb-1">Compiled Output:</span>
                    {selectedNode.data.educational.notes.compiledOutput}
                  </div>
                )}
              </div>
            )}

            {selectedNode.data.educational?.notes?.whatIsIt && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">What is it?</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedNode.data.educational.notes.whatIsIt}</p>
              </div>
            )}
            
            {selectedNode.data.educational?.notes?.whatDoesItDo && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">What does it do?</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedNode.data.educational.notes.whatDoesItDo}</p>
              </div>
            )}
            
            {selectedNode.data.educational?.notes?.whenIsItInvolved && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">When is it used?</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedNode.data.educational.notes.whenIsItInvolved}</p>
              </div>
            )}

            {selectedNode.data.educational?.notes?.whyNeeded && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Why is it needed?</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedNode.data.educational.notes.whyNeeded}</p>
              </div>
            )}
            
            {selectedNode.data.educational?.notes?.whatIfMissing && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">What if it's missing?</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedNode.data.educational.notes.whatIfMissing}</p>
              </div>
            )}

            {selectedNode.data.educational?.notes?.interestingFact && (
              <div className="bg-accent/30 border border-accent rounded-lg p-4">
                <h3 className="text-xs font-bold text-accent-foreground flex items-center gap-2 mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  Interesting Fact
                </h3>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{selectedNode.data.educational.notes.interestingFact}</p>
              </div>
            )}
            
            {selectedNode.data.educational?.notes?.interviewTips && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
                <h3 className="text-xs font-bold text-primary flex items-center gap-2 mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Interview Tips
                </h3>
                <p className="text-sm text-foreground/90 italic whitespace-pre-wrap">{selectedNode.data.educational.notes.interviewTips}</p>
              </div>
            )}
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
            {!isLastValidStep && (
              store.isPlaying ? (
                <button
                  onClick={() => store.setPlaying(false)}
                  className="w-full py-2.5 bg-primary/20 text-primary border border-primary/30 rounded-lg font-medium hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause
                </button>
              ) : (
                <button
                  onClick={() => {
                    store.setPlaying(true);
                    if (currentStep.autoAdvance === false) {
                      store.nextStep();
                    }
                  }}
                  className={`w-full py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center justify-center gap-2 ${
                    !store.isPlaying
                      ? "bg-amber-500 text-amber-950 hover:bg-amber-400 animate-[pulse_1.5s_ease-in-out_infinite] ring-4 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {currentStep.autoAdvance === false ? "Continue" : "Play"} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              )
            )}
            
            {isLastValidStep && (
              <button
                onClick={() => {
                  store.setStepIndex(0);
                  store.setPlaying(true);
                }}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Restart Lesson
              </button>
            )}

            {displayIndex > 0 && (
              <button
                onClick={() => {
                  store.setPlaying(false);
                  store.prevStep();
                }}
                className="w-full py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Previous Step
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
