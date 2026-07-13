"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function CallStackPanel() {
  const { scenario, currentStepIndex } = useJSSimulationStore();
  const currentState = scenario.steps[currentStepIndex];
  const callStack = currentState.callStack;

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
          Call Stack
        </h2>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-end">
        <div className="flex flex-col gap-2 relative">
          {callStack.length > 0 && (
            <div className="text-center mb-2 pb-2 border-b border-border/20 text-[10px] font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-1">
              Stack Top <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {callStack.map((ec, index) => {
              const isTop = index === 0;
              return (
                <motion.div
                  key={ec.id}
                  layout
                  initial={{ opacity: 0, y: -50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.8, filter: "blur(4px)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={cn(
                    "p-3 rounded-lg border",
                    isTop 
                      ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_-3px_rgba(var(--primary),0.2)]" 
                      : "bg-muted/30 border-border/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "font-mono text-sm font-semibold",
                      isTop ? "text-primary" : "text-foreground"
                    )}>
                      {ec.name}
                    </span>
                    {isTop && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {callStack.length > 0 && (
            <div className="text-center mt-2 pt-2 border-t border-border/20 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Bottom
            </div>
          )}
          
          {callStack.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm font-mono border-2 border-dashed border-border/50 rounded-lg">
              Stack is empty
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
