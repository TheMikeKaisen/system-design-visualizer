"use client";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { useEffect } from "react";

interface MobileMenuProps {
  experiments?: { id: string; label: string; description: string }[];
  onClose: () => void;
}

export function MobileMenu({ experiments = [], onClose }: MobileMenuProps) {
  const store = useScenarioStore();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleReset = () => {
    store.setPlaying(false);
    store.setSelectedNodeId(null);
    if (store.script) {
      store.setStepIndex(store.script.steps.length - 1);
    }
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="sm:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Slide-up sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/60 rounded-t-2xl p-5 pb-8 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto -mt-1" />

        <h2 className="text-sm font-bold text-foreground">Controls</h2>

        {/* Play / Pause + Reset row */}
        <div className="flex gap-3">
          <button
            onClick={() => { store.setPlaying(!store.isPlaying); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            {store.isPlaying ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                Pause
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Play
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted text-muted-foreground hover:text-foreground"
            title="Reset"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>

        {/* Speed */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Speed</p>
          <div className="flex items-center bg-muted/50 rounded-xl p-1 gap-1">
            {[0.5, 1, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => store.setSpeed(speed)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${store.playbackSpeed === speed ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Experiments (if any) */}
        {experiments.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Experiments</p>
            <div className="flex flex-col gap-2">
              {experiments.map((exp) => {
                const isActive = store.activeExperiments.includes(exp.id);
                return (
                  <button
                    key={exp.id}
                    onClick={() => store.toggleExperiment(exp.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${isActive ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {exp.label}
                    {isActive && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="py-3 text-sm font-medium text-muted-foreground border border-border/50 rounded-xl"
        >
          Close
        </button>
      </div>
    </div>
  );
}
