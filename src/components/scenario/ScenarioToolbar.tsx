import { useScenarioStore } from "@/lib/store/useScenarioStore";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ScenarioExperimentPanel } from "./ScenarioExperimentPanel";

export function ScenarioToolbar({ 
  title = "System Design Visualizer", 
  experiments = [], 
  extras,
  logoSrc,
  backHref
}: { 
  title?: string;
  experiments?: { id: string; label: string; description: string }[];
  extras?: React.ReactNode;
  logoSrc?: string;
  backHref?: string;
}) {
  const store = useScenarioStore();
  const [showExperiments, setShowExperiments] = useState(false);

  const currentStep = store.script?.steps[store.currentStepIndex];
  const isAtStart = store.currentStepIndex === 0;

  // Hide experiments panel when simulation starts
  useEffect(() => {
    if (store.isPlaying) {
      setShowExperiments(false);
    }
  }, [store.isPlaying]);

  // Compute valid steps (respecting active experiments) — same as context panels
  const validStepsIndices = store.script
    ? store.script.steps.map((step, index) => {
        const hasReq = !step.requiredExperiments || step.requiredExperiments.every(e => store.activeExperiments.includes(e));
        const hasExc = step.excludedExperiments && step.excludedExperiments.some(e => store.activeExperiments.includes(e));
        return hasReq && !hasExc ? index : -1;
      }).filter(i => i !== -1)
    : [];
  const isLastValidStep = validStepsIndices.length > 0 && store.currentStepIndex === validStepsIndices[validStepsIndices.length - 1];

  const needsContinue = !isAtStart && !isLastValidStep && currentStep?.autoAdvance === false && !store.isPlaying;

  // Split title if it contains a colon for hierarchy
  const [product, ...restLesson] = title.split(": ");
  const lesson = restLesson.join(": ");

  return (
    <header className="hidden sm:flex h-14 border-b border-border/40 bg-background/95 backdrop-blur items-center justify-between px-4 z-50 relative">
      <div className="flex items-center gap-3">
        <Link href={backHref || "/"} className="text-muted-foreground hover:text-foreground transition-colors mr-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        {logoSrc ? (
          <div className="w-8 h-8 flex items-center justify-center p-0.5 bg-white rounded-md">
            <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
          </div>
        )}
        <div className="flex flex-col justify-center">
          {lesson ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">{product}</span>
              <span className="text-sm font-bold text-foreground leading-tight">{lesson}</span>
            </>
          ) : (
            <h1 className="text-lg font-bold">{title}</h1>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (isLastValidStep && !store.isPlaying) {
              // Simulation ended — restart from the beginning
              store.setStepIndex(0);
              store.setPlaying(true);
            } else {
              store.setPlaying(!store.isPlaying);
              if (needsContinue) store.nextStep();
            }
          }}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-medium text-sm transition-colors ${
            needsContinue
              ? "bg-amber-500 text-amber-950 hover:bg-amber-400 animate-[pulse_1.5s_ease-in-out_infinite] ring-2 ring-amber-500/50"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {store.isPlaying ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause</>
          ) : needsContinue ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Continue</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play</>
          )}
        </button>

        <button
          onClick={() => {
            store.setPlaying(false);
            store.setSelectedNodeId(null);
            if (store.script) {
              store.reset();
            }
          }}
          className="flex items-center gap-2 bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground px-3 py-1.5 rounded-md font-medium text-sm transition-colors ml-1"
          title="Reset simulation and clear selection"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>

        <div className="flex items-center bg-muted/50 rounded-md p-0.5 ml-2">
          {[0.5, 1, 2].map((speed) => (
            <button
              key={speed}
              onClick={() => store.setSpeed(speed)}
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${store.playbackSpeed === speed ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {experiments && experiments.length > 0 && (
          <button
            onClick={() => setShowExperiments(!showExperiments)}
            className={`ml-4 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${showExperiments || store.activeExperiments.length > 0 ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.3 22a2 2 0 0 1-1.3-.4l-4-3a2 2 0 0 1-.7-2.6L8.8 4a2 2 0 0 1 2.6-.7l4 3a2 2 0 0 1 .7 2.6z"/><path d="M12 2v20"/></svg>
            Experiments {store.activeExperiments.length > 0 && <span className="bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{store.activeExperiments.length}</span>}
          </button>
        )}

        {extras}
      </div>

      {showExperiments && experiments && experiments.length > 0 && (
        <div className="absolute top-14 right-4 z-50">
          <ScenarioExperimentPanel experiments={experiments} onClose={() => setShowExperiments(false)} />
        </div>
      )}
    </header>
  );
}
