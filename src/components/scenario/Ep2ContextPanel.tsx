"use client";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { useEffect, useState } from "react";
import { LessonQuiz } from "./LessonQuiz";
import { getPlatformNodes } from "@/lib/scenario/scripts/javaPlatformIndependence";

interface Ep2ContextPanelProps {
  selectedPlatform: "linux" | "windows" | "macos";
  isComparing?: boolean;
  onCompare?: () => void;
}

const EXPERIMENT_PANEL_CONTENT: Record<string, { title: string; body: string }> = {
  "no-jvm": {
    title: "No JVM Installed",
    body: "Hello.class is perfectly valid. The Bytecode is fine. But without a JVM to translate it, no OS can execute it. Platform independence is a contract — and the contract requires the JVM to be present."
  }
};

export function Ep2ContextPanel({ selectedPlatform, isComparing, onCompare }: Ep2ContextPanelProps) {
  const store = useScenarioStore();
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    if (!store.isPlaying || !store.script) return;
    const currentStep = store.script.steps[store.currentStepIndex];
    if (currentStep.autoAdvance === false) {
      store.setPlaying(false);
      return;
    }
    const duration = currentStep.durationMs || 2000;
    const realDuration = duration / store.playbackSpeed;
    const timer = setTimeout(() => store.nextStep(), realDuration);
    return () => clearTimeout(timer);
  }, [store.isPlaying, store.currentStepIndex, store.playbackSpeed, store.script]);

  if (!store.script) return null;

  const currentStep = store.script.steps[store.currentStepIndex];
  
  const activeExp = store.activeExperiments.find(e => e !== "compare-all");
  const expContent = activeExp ? EXPERIMENT_PANEL_CONTENT[activeExp] : null;

  const validStepsIndices = store.script.steps.map((step, index) => {
    const hasReq = !step.requiredExperiments || step.requiredExperiments.every(e => store.activeExperiments.includes(e));
    const hasExc = !step.excludedExperiments || step.excludedExperiments.some(e => store.activeExperiments.includes(e));
    if (hasReq && !hasExc) return index;
    return -1;
  }).filter(i => i !== -1);

  const displayIndex = validStepsIndices.indexOf(store.currentStepIndex);
  const isLastValidStep = store.currentStepIndex === validStepsIndices[validStepsIndices.length - 1];

  const allNodes = getPlatformNodes(selectedPlatform);
  const selectedNode = store.selectedNodeId
    ? allNodes.find(n => n.id === store.selectedNodeId)
    : null;

  const narrative = currentStep?.narrative;
  const canCompare = !isComparing && store.currentStepIndex >= 2 && activeExp !== "no-jvm";

  return (
    <div className="w-80 shrink-0 h-full border-l border-border/40 bg-background/95 backdrop-blur-md flex flex-col z-20 relative">
      {selectedNode ? (
        <div className="flex-1 overflow-y-auto p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">{selectedNode.data.label}</h2>
            <button onClick={() => store.setSelectedNodeId(null)} className="text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 p-1.5 rounded-md transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="space-y-5">
            {selectedNode.data.educational?.notes?.whatIsIt && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">What is it?</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{selectedNode.data.educational.notes.whatIsIt}</p>
              </div>
            )}
            {selectedNode.data.educational?.notes?.whyNeeded && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Why is it needed?</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{selectedNode.data.educational.notes.whyNeeded}</p>
              </div>
            )}
            {selectedNode.data.educational?.notes?.whatIfMissing && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">What if it&apos;s missing?</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{selectedNode.data.educational.notes.whatIfMissing}</p>
              </div>
            )}
            {selectedNode.data.educational?.notes?.interviewTips && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h3 className="text-xs font-bold text-primary flex items-center gap-2 mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Key Insight
                </h3>
                <p className="text-sm text-foreground/90 italic">{selectedNode.data.educational.notes.interviewTips}</p>
              </div>
            )}
          </div>
        </div>
      ) : showQuiz && currentStep?.quiz ? (
        <div className="flex-1 overflow-y-auto p-5 flex flex-col">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Can You Explain It?</p>
            <h2 className="text-lg font-bold text-foreground leading-tight">Quick Check</h2>
          </div>
          <LessonQuiz
            questions={currentStep.quiz}
            onComplete={() => {
              setShowQuiz(false);
              store.setStepIndex(0);
              store.setPlaying(true);
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex flex-col gap-6">
            <div>
              {expContent && (
                <div className="mb-5 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary shrink-0"><path d="M9.3 22a2 2 0 0 1-1.3-.4l-4-3a2 2 0 0 1-.7-2.6L8.8 4a2 2 0 0 1 2.6-.7l4 3a2 2 0 0 1 .7 2.6z"/><path d="M12 2v20"/></svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Experiment Active</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-primary font-bold text-sm mb-4">
                <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/20">{displayIndex + 1}</span>
                {narrative?.timelineLabel || "Step"}
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                {expContent ? expContent.title : narrative?.title}
              </h2>
            </div>

            {!expContent && narrative?.question && (
              <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Question</h3>
                <p className="text-sm font-medium text-foreground">{narrative.question}</p>
              </div>
            )}

            {!expContent && narrative?.explanation && (
              <div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {narrative.explanation}
                </p>
              </div>
            )}

            {!expContent && narrative?.keyTakeaway && (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-500 shrink-0 mt-0.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Key Takeaway</h3>
                  <p className="text-sm text-foreground/90 font-medium leading-relaxed">{narrative.keyTakeaway}</p>
                </div>
              </div>
            )}

            {!expContent && narrative?.interviewInsight && (
              <div className="flex items-start gap-3 bg-primary/5 border border-primary/10 p-4 rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary shrink-0 mt-0.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Interview Insight</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed italic">"{narrative.interviewInsight}"</p>
                </div>
              </div>
            )}
            
            {expContent && (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {expContent.body}
              </p>
            )}

            {canCompare && (
              <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
                <h3 className="text-sm font-bold text-foreground mb-2">Want to see why this works on Windows, Linux and macOS?</h3>
                <p className="text-xs text-muted-foreground mb-4">Open the comparison visualization to see the exact same Bytecode execute across three operating systems simultaneously.</p>
                <button
                  onClick={() => {
                    store.setPlaying(false);
                    if (onCompare) onCompare();
                  }}
                  className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Compare Platforms
                </button>
              </div>
            )}
          </div>
          </div>

          <div className="p-5 border-t border-border/20 bg-background/50 flex flex-col gap-3 shrink-0">
            {isLastValidStep && currentStep?.quiz && !showQuiz ? (
              <>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Can You Explain It? →
                </button>
                <button
                  onClick={() => { store.setStepIndex(0); store.setPlaying(true); }}
                  className="w-full py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                >
                  Replay Lesson
                </button>
              </>
            ) : isLastValidStep ? (
              <button
                onClick={() => { store.setStepIndex(0); store.setPlaying(true); }}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors"
              >
                Restart Lesson
              </button>
            ) : store.isPlaying ? (
              <button
                onClick={() => store.setPlaying(false)}
                className="w-full py-2.5 bg-primary/20 text-primary border border-primary/30 rounded-lg font-medium hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                Pause
              </button>
            ) : (
              <button
                onClick={() => {
                  store.setPlaying(true);
                  if (currentStep?.autoAdvance === false) store.nextStep();
                }}
                className={`w-full py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center justify-center gap-2 ${
                  !store.isPlaying
                    ? "bg-amber-500 text-amber-950 hover:bg-amber-400 animate-[pulse_1.5s_ease-in-out_infinite] ring-4 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {currentStep?.autoAdvance === false ? "Continue" : "Play"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            )}

            {displayIndex > 0 && (
              <button
                onClick={() => { store.setPlaying(false); store.prevStep(); }}
                className="w-full py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Previous Step
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
