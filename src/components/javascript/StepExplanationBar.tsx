"use client";

import { useActiveSimulation } from "@/context/JSSimulationContext";
import { motion, AnimatePresence } from "framer-motion";

export function StepExplanationBar() {
  const { scenario, currentStepIndex } = useActiveSimulation();

  const steps = scenario?.steps ?? [];
  const safeIndex = Math.max(0, Math.min(currentStepIndex, steps.length - 1));
  const currentStep = steps[safeIndex] ?? null;
  const totalSteps = steps.length;
  const explanation = currentStep?.explanation ?? "";

  if (!scenario || totalSteps === 0 || !explanation) {
    return null;
  }

  return (
    <aside
      aria-label="Step explanation"
      className="shrink-0 w-full z-30 bg-card/90 dark:bg-zinc-900/85 backdrop-blur-md border-b border-border/60 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 sm:gap-4 min-h-[46px]">
        {/* Animated amber pulse indicator dot & step pill (inspired by Episode 5) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-2.5 w-2.5 relative shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          </span>
          <span className="text-[11px] uppercase tracking-wider font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0 select-none">
            Step {currentStepIndex + 1}
          </span>
        </div>

        {/* Subtle vertical separator */}
        <div className="h-4 w-px bg-border/60 hidden sm:block shrink-0" aria-hidden="true" />

        {/* Highly readable, smooth animated narrative explanation */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${scenario.id}-${safeIndex}`}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="text-xs sm:text-sm font-medium text-foreground/90 dark:text-zinc-200 leading-relaxed"
            >
              {explanation}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
