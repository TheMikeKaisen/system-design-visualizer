"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Self-contained popup component for step explanations.
 * 
 * By isolating the popup's timer state (activeExplanation, isHoveringExplanation)
 * into its own component, we prevent the 2-second auto-dismiss timer from
 * triggering re-renders on the parent page. This stops Framer Motion's layoutId
 * elements (in CallStackPanel, queues, etc.) from glitching during popup state changes.
 */
export function StepExplanationPopup() {
  const { scenario, currentStepIndex } = useJSSimulationStore();

  const [activeExplanation, setActiveExplanation] = useState<string | null>(null);
  const [isHoveringExplanation, setIsHoveringExplanation] = useState(false);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (scenario.steps[currentStepIndex]?.explanation) {
      setActiveExplanation(scenario.steps[currentStepIndex].explanation!);
      if (!isHoveringExplanation) {
        t = setTimeout(() => setActiveExplanation(null), 2000);
      }
    } else {
      setActiveExplanation(null);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [currentStepIndex, scenario.steps, isHoveringExplanation]);

  return (
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl pointer-events-none px-4">
      <AnimatePresence mode="wait">
        {activeExplanation && (
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-primary/95 backdrop-blur-md border border-primary/50 rounded-xl p-4 text-primary-foreground text-sm font-medium shadow-2xl flex items-start gap-3 mx-auto pointer-events-auto"
            onMouseEnter={() => setIsHoveringExplanation(true)}
            onMouseLeave={() => setIsHoveringExplanation(false)}
          >
            <div className="mt-0.5 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
            <p className="leading-relaxed">{activeExplanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
