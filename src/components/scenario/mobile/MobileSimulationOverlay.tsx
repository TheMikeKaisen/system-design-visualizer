"use client";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { useEffect, useState } from "react";
import { SystemNode } from "@/types";

export function MobileSimulationOverlay({ nodes = [] }: { nodes?: SystemNode[] }) {
  const store = useScenarioStore();
  const [visible, setVisible] = useState(false);

  const currentStep = store.script?.steps[store.currentStepIndex];

  // Compute valid steps (respecting active experiments), same as context panels
  const validStepsIndices = store.script
    ? store.script.steps.map((step, index) => {
        const hasReq = !step.requiredExperiments || step.requiredExperiments.every(e => store.activeExperiments.includes(e));
        const hasExc = step.excludedExperiments && step.excludedExperiments.some(e => store.activeExperiments.includes(e));
        return hasReq && !hasExc ? index : -1;
      }).filter(i => i !== -1)
    : [];

  const isAtStart = store.currentStepIndex === 0;
  const isLastValidStep = validStepsIndices.length > 0 && store.currentStepIndex === validStepsIndices[validStepsIndices.length - 1];

  // Overlay shows on any autoAdvance:false step (including last valid step like no-jvm error)
  const isAutoAdvanceStep = !store.isPlaying && !isAtStart && currentStep?.autoAdvance === false;

  // Whether this is a mid-simulation pause (can resume) vs a terminal state (just show info)
  const canResume = isAutoAdvanceStep && !isLastValidStep;

  // Show overlay with a ~1s delay after pause step is reached
  useEffect(() => {
    if (isAutoAdvanceStep) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isAutoAdvanceStep, store.currentStepIndex]);

  const handleResume = () => {
    setVisible(false);
    store.nextStep();
    store.setPlaying(true);
  };

  const handleDismiss = () => {
    if (store.selectedNodeId) {
      store.setSelectedNodeId(null);
    } else {
      setVisible(false);
    }
  };

  const narrative = currentStep?.narrative;
  const selectedNode = store.selectedNodeId
    ? nodes.find(n => n.id === store.selectedNodeId)
    : null;

  const showOverlay = (visible && isAutoAdvanceStep && narrative) || !!selectedNode;

  if (!showOverlay) return null;

  return (
    <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      {/* Semi-transparent gradient at top to show canvas is still "alive" */}
      <div className="flex-1 bg-gradient-to-b from-transparent to-black/40 pointer-events-none" />

      {/* Bottom sheet */}
      <div
        className="pointer-events-auto bg-background/98 backdrop-blur-md rounded-t-2xl border-t border-border/60 px-5 pt-4 pb-28 max-h-[65vh] overflow-y-auto"
        style={{ animation: "slideUpMobile 0.35s ease-out" }}
      >
        {/* Header row: step badge + close button */}
        <div className="flex items-center gap-2 mb-3">
          {selectedNode ? (
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
              Node Details
            </span>
          ) : (
            <>
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
                {narrative?.timelineLabel || "Step"}
              </span>
              {narrative?.keyTakeaway && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500">
                  Key Takeaway ↓
                </span>
              )}
            </>
          )}
          {/* Always show a close/dismiss button */}
          <button
            onClick={handleDismiss}
            className="ml-auto w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {selectedNode ? (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-foreground mb-1">{selectedNode.data.label}</h2>
            {selectedNode.data.educational?.badges && selectedNode.data.educational.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedNode.data.educational.badges.map((badge, i) => (
                  <div key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border ${badge.color || 'bg-muted/50 border-border/50 text-foreground/80'}`}>
                    <span className="opacity-70">{badge.label}:</span>
                    <span className="font-bold">{badge.value}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedNode.data.educational?.notes?.codePreview && (
              <div className="mb-4">
                <div className="bg-muted text-muted-foreground text-[10px] px-3 py-1.5 rounded-t-md font-mono border-b border-border/50">
                  {selectedNode.data.educational.notes.codeTitle || "Code Snippet"}
                </div>
                <pre className="bg-background border border-t-0 border-border rounded-b-md p-3 overflow-x-auto text-[10px] font-mono text-foreground/90">
                  <code>{selectedNode.data.educational.notes.codePreview}</code>
                </pre>
              </div>
            )}

            {selectedNode.data.educational?.notes?.whatIsIt && (
              <div>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">What is it?</h3>
                <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedNode.data.educational.notes.whatIsIt}</p>
              </div>
            )}
            
            {selectedNode.data.educational?.notes?.whatDoesItDo && (
              <div>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">What does it do?</h3>
                <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedNode.data.educational.notes.whatDoesItDo}</p>
              </div>
            )}
            
            {selectedNode.data.educational?.notes?.whenIsItInvolved && (
              <div>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">When is it used?</h3>
                <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedNode.data.educational.notes.whenIsItInvolved}</p>
              </div>
            )}

            {selectedNode.data.educational?.notes?.whyNeeded && (
              <div>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">Why is it needed?</h3>
                <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedNode.data.educational.notes.whyNeeded}</p>
              </div>
            )}

            {selectedNode.data.educational?.notes?.whatIfMissing && (
              <div>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">What if it's missing?</h3>
                <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedNode.data.educational.notes.whatIfMissing}</p>
              </div>
            )}

            {selectedNode.data.educational?.notes?.interestingFact && (
              <div className="bg-accent/30 border border-accent rounded-lg p-3">
                <h3 className="text-[10px] font-bold text-accent-foreground flex items-center gap-1.5 mb-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  Interesting Fact
                </h3>
                <p className="text-[13px] text-foreground/90 whitespace-pre-wrap">{selectedNode.data.educational.notes.interestingFact}</p>
              </div>
            )}
            
            {selectedNode.data.educational?.notes?.interviewTips && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-4">
                <h3 className="text-[10px] font-bold text-primary flex items-center gap-1.5 mb-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Interview Tips
                </h3>
                <p className="text-[13px] text-foreground/90 italic whitespace-pre-wrap">{selectedNode.data.educational.notes.interviewTips}</p>
              </div>
            )}
          </div>
        ) : narrative ? (
          <>
            {/* Title */}
            <h2 className="text-xl font-bold text-foreground mb-1">{narrative.title}</h2>

            {/* Question */}
            {narrative.question && (
              <p className="text-sm font-medium text-primary mb-3">{narrative.question}</p>
            )}

            {/* Explanation */}
            {narrative.explanation && (
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                {narrative.explanation}
              </p>
            )}

            {/* Key Takeaway */}
            {narrative.keyTakeaway && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Key Takeaway</p>
                <p className="text-sm text-foreground font-medium">{narrative.keyTakeaway}</p>
              </div>
            )}

            {/* Interview Insight */}
            {narrative.interviewInsight && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Interview Insight</p>
                <p className="text-sm text-foreground/90 italic">{narrative.interviewInsight}</p>
              </div>
            )}

            {/* Action button — Restart if at end. We removed the mid-sim Resume button per request. */}
            {isLastValidStep && (
              <button
                onClick={() => {
                  setVisible(false);
                  store.setStepIndex(0);
                  store.setPlaying(true);
                }}
                className="w-full py-3.5 mt-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                Watch Again
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
