"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function CallbackQueuePanel() {
  const { scenario, currentStepIndex } = useJSSimulationStore();
  const currentState = scenario.steps[currentStepIndex];
  const callbackQueue = currentState.callbackQueue || [];
  const eventLoop = currentState.eventLoop || { phase: "idle" };

  const isBeingChecked = eventLoop.phase === "checking_callbacks";

  return (
    <div className={cn(
      "flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden transition-all duration-300",
      isBeingChecked ? "border-amber-500 shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] ring-1 ring-amber-500/50" : "border-border/50"
    )}>
      <div className={cn(
        "px-4 py-3 border-b flex items-center transition-colors duration-300",
        isBeingChecked ? "bg-amber-500/15 border-amber-500/50" : "bg-amber-500/5 border-border/50"
      )}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/70"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          Callback Queue <span className="text-[10px] text-muted-foreground/60 normal-case tracking-normal">(Macrotasks)</span>
        </h2>
      </div>
      
      <div className="flex-1 p-4 overflow-x-auto overflow-y-hidden flex items-center gap-3">
        {callbackQueue.length === 0 ? (
          <div className="w-full text-center text-sm text-muted-foreground italic">
            Queue is empty
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {callbackQueue.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                layoutId={item.id}
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cn(
                  "flex-shrink-0 w-48 bg-muted/20 border rounded-lg p-3 shadow-sm",
                  idx === 0 ? "border-amber-500/40 ring-1 ring-amber-500/20 bg-amber-500/10 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]" : "border-border/40"
                )}
              >
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/40">
                  <span className={cn(
                    "text-xs font-bold truncate",
                    idx === 0 ? "text-amber-500" : "text-foreground"
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
