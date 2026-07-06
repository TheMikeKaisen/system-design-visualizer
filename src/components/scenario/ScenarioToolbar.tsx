import { useScenarioStore } from "@/lib/store/useScenarioStore";
import Link from "next/link";
import { useState } from "react";
import { ScenarioExperimentPanel } from "./ScenarioExperimentPanel";

export function ScenarioToolbar() {
  const store = useScenarioStore();
  const [showExperiments, setShowExperiments] = useState(false);

  return (
    <header className="h-14 border-b border-border/40 bg-background/95 backdrop-blur flex items-center justify-between px-4 z-50 relative">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
        </div>
        <h1 className="text-lg font-bold">Java Internals: Execution Flow</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => store.setPlaying(!store.isPlaying)}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 rounded-md font-medium text-sm transition-colors"
        >
          {store.isPlaying ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play</>
          )}
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

        <button
          onClick={() => setShowExperiments(!showExperiments)}
          className={`ml-4 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${showExperiments || store.activeExperiments.length > 0 ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.3 22a2 2 0 0 1-1.3-.4l-4-3a2 2 0 0 1-.7-2.6L8.8 4a2 2 0 0 1 2.6-.7l4 3a2 2 0 0 1 .7 2.6z"/><path d="M12 2v20"/></svg>
          Experiments {store.activeExperiments.length > 0 && <span className="bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{store.activeExperiments.length}</span>}
        </button>

        <Link href="/" className="ml-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2">
          Exit
        </Link>
      </div>

      {showExperiments && (
        <div className="absolute top-14 right-4 z-50">
          <ScenarioExperimentPanel onClose={() => setShowExperiments(false)} />
        </div>
      )}
    </header>
  );
}
