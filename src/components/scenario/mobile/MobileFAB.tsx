"use client";
import { useScenarioStore } from "@/lib/store/useScenarioStore";

export function MobileFAB() {
  const store = useScenarioStore();

  const currentStep = store.script?.steps[store.currentStepIndex];

  // Compute valid steps (respecting active experiments), same as context panels
  const validStepsIndices = store.script
    ? store.script.steps.map((step, index) => {
        const hasReq = !step.requiredExperiments || step.requiredExperiments.every(e => store.activeExperiments.includes(e));
        const hasExc = step.excludedExperiments && step.excludedExperiments.some(e => store.activeExperiments.includes(e));
        return hasReq && !hasExc ? index : -1;
      }).filter(i => i !== -1)
    : [];

  const isAtStart = store.currentStepIndex === 0 && !store.isPlaying;
  const isLastValidStep = validStepsIndices.length > 0 && store.currentStepIndex === validStepsIndices[validStepsIndices.length - 1];

  // Only glow-resume if we're mid-simulation on a pause step (not at start, not at the terminal step)
  const isPauseStep =
    !store.isPlaying &&
    !isAtStart &&
    !isLastValidStep &&
    currentStep?.autoAdvance === false;

  const handleTap = () => {
    if (isPauseStep) {
      // Mid-simulation pause — advance and keep playing
      store.nextStep();
      store.setPlaying(true);
    } else if (isLastValidStep && !store.isPlaying) {
      // Simulation ended — restart from beginning
      store.setStepIndex(0);
      store.setPlaying(true);
    } else {
      // Normal play / pause toggle
      store.setPlaying(!store.isPlaying);
    }
  };

  return (
    <div className="sm:hidden fixed bottom-6 right-5 z-50">
      {isPauseStep ? (
        /* Golden Resume FAB with ripple rings */
        <div className="relative flex items-center justify-center">
          {/* Outer expanding ring */}
          <span className="absolute w-16 h-16 rounded-full bg-amber-500/30 animate-ping" />
          {/* Inner ring */}
          <span className="absolute w-14 h-14 rounded-full bg-amber-500/20 animate-pulse" />
          <button
            onClick={handleTap}
            className="relative w-14 h-14 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.6)] transition-transform active:scale-95"
            aria-label="Resume simulation"
          >
            {/* Play/Forward triangle icon */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        </div>
      ) : (
        /* Plain white Play / Pause FAB */
        <button
          onClick={handleTap}
          className="w-12 h-12 rounded-full bg-black/60 backdrop-blur border border-white/10 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
          aria-label={store.isPlaying ? "Pause simulation" : "Play simulation"}
        >
          {store.isPlaying ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
