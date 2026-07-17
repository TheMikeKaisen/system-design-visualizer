"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function MicrotaskQueuePanel() {
  const { scenario, currentStepIndex } = useJSSimulationStore();
  const currentState = scenario.steps[currentStepIndex];
  const microtaskQueue = currentState.microtaskQueue || [];

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-fuchsia-500/5 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-500/70"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          Microtask Queue
        </h2>
        <span className="text-[9px] font-bold uppercase tracking-widest text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">
          ⚡ Higher Priority
        </span>
      </div>
      
      <div className="flex-1 p-4 overflow-x-auto overflow-y-hidden flex items-center gap-3">
        {microtaskQueue.length === 0 ? (
          <div className="w-full text-center text-sm text-muted-foreground italic">
            Queue is empty
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {microtaskQueue.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cn(
                  "flex-shrink-0 w-48 bg-muted/20 border rounded-lg p-3 shadow-sm",
                  idx === 0 ? "border-fuchsia-500/40 ring-1 ring-fuchsia-500/20 bg-fuchsia-500/10 shadow-[0_0_15px_-3px_rgba(217,70,239,0.2)]" : "border-border/40"
                )}
              >
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/40">
                  <span className={cn(
                    "text-xs font-bold truncate",
                    idx === 0 ? "text-fuchsia-500" : "text-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground bg-black/40 p-1.5 rounded truncate">
                  {item.callback}
                </div>
                <div className="mt-2 text-[9px] font-medium uppercase tracking-widest text-muted-foreground/60 text-right">
                  from {item.source}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
