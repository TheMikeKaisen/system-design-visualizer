import { useScenarioStore } from "@/lib/store/useScenarioStore";

export function ScenarioTimeline() {
  const store = useScenarioStore();
  if (!store.script) return null;

  const steps = store.script.steps;
  const current = store.currentStepIndex;
  const activeExperiments = store.activeExperiments;

  // Compute valid steps
  const validStepsIndices = steps.map((step, index) => {
    const hasReq = !step.requiredExperiments || step.requiredExperiments.every(e => activeExperiments.includes(e));
    const hasExc = !step.excludedExperiments || step.excludedExperiments.some(e => activeExperiments.includes(e));
    if (hasReq && !hasExc) return index;
    return -1;
  }).filter(i => i !== -1);

  // Calculate progress based on valid steps
  const validCurrentIndex = validStepsIndices.indexOf(current);
  const progressPercent = validStepsIndices.length > 1 
    ? (Math.max(0, validCurrentIndex) / (validStepsIndices.length - 1)) * 100 
    : 0;

  return (
    <div className="h-16 border-t border-border/40 bg-background/95 backdrop-blur z-20 relative flex flex-col justify-center px-8">
      <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto">
        {/* Background Line */}
        <div className="absolute left-0 right-0 h-1 bg-muted top-1/2 -translate-y-1/2 rounded-full" />
        
        {/* Progress Line */}
        <div 
          className="absolute left-0 h-1 bg-primary top-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />

        {validStepsIndices.map((originalIndex, displayIndex) => {
          const isPast = validStepsIndices.indexOf(current) > displayIndex;
          const isCurrent = current === originalIndex;
          const step = steps[originalIndex];
          const label = step.narrative?.timelineLabel || `Step ${displayIndex + 1}`;
          
          return (
            <button
              key={originalIndex}
              onClick={() => store.setStepIndex(originalIndex)}
              className="relative flex flex-col items-center group outline-none"
            >
              <div 
                className={`w-4 h-4 rounded-full border-2 transition-colors z-10 
                  ${isPast ? "bg-primary border-primary" : isCurrent ? "bg-background border-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-background border-muted-foreground"}`}
              >
                {isPast && (
                  <svg className="w-full h-full text-primary-foreground p-[1.5px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                )}
              </div>
              <div className={`absolute top-6 text-[10px] font-medium whitespace-nowrap transition-colors
                ${isCurrent ? "text-primary font-bold scale-110" : "text-muted-foreground group-hover:text-foreground"}`}>
                {label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
